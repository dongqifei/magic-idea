/**
 * 依赖注入容器配置
 */
import "reflect-metadata"; // 必须导入，Inversify 依赖反射元数据
import { injectable, inject, named } from "inversify";
import { window as appWindow } from '@tauri-apps/api';

import { CommandRegistry } from "@lumino/commands";
import { isTauri, MaybePromise, MenuModelRegistry } from "./common";
import { LogLevel } from "./logger/logger-types";
import { getLogger } from "./logger/logger-service";
import { ApplicationShellLayout } from "./shell";
import { ShellLayoutRestorer, ApplicationShellLayoutMigrationError } from './shell/shell-layout-restorer';

import { KeybindingRegistry } from "./keybinding";
import { ContributionProvider } from "./common/contribution-provider";
import { FrontendApplicationContribution } from "./frontend-application-contribution";
import { Stopwatch } from "./performance";
import { CommandRegistryImpl } from "./commands/command-registry-impl";
import { MagicApiServerService } from "./magic-api";

const TIMER_WARNING_THRESHOLD = 100;

@injectable()
export class FrontendApplication {
  private logger = getLogger("frontend-application");

  @inject(ApplicationShellLayout)
  protected readonly _shell: ApplicationShellLayout;

  @inject(ContributionProvider)
  @named(FrontendApplicationContribution)
  protected readonly contributions: ContributionProvider<FrontendApplicationContribution>;

  @inject(Stopwatch)
  protected readonly stopwatch: Stopwatch;

  @inject(CommandRegistryImpl)
  private readonly commandsImpl: CommandRegistryImpl;

  @inject(MagicApiServerService)
  private readonly magicApiServerService: MagicApiServerService;

  constructor(
    @inject(CommandRegistry) protected readonly commands: CommandRegistry,
    @inject(KeybindingRegistry)
    protected readonly keybindings: KeybindingRegistry,
    @inject(ShellLayoutRestorer) protected readonly layoutRestorer: ShellLayoutRestorer,
    // @inject(MenuManager) protected readonly menus: MenuManager
    @inject(MenuModelRegistry) protected readonly menus: MenuModelRegistry
  ) {}

  get shell(): ApplicationShellLayout {
    return this._shell;
  }

  /**
   * Start the frontend application.
   *
   * Start up consists of the following steps:
   * - start frontend contributions
   * - attach the application shell to the host element
   * - initialize the application shell layout
   * - reveal the application shell if it was hidden by a startup indicator
   */
  async start(): Promise<void> {
    // 启动前端贡献
    await this.measure(
      "startContributions",
      () => this.startContributions(),
      "Start frontend contributions",
      false
    );
    
    // 启动shell
    const host = await this.getHost();
    this.shell.attachTo(host);

    // 初始化MagicApi服务
    await this.magicApiServerService.initServer();

    // 初始化布局
    await this.measure(
      "initializeLayout",
      () => this.initializeLayout(),
      "Initialize the workbench layout",
      false
    );
    await this.fireOnDidInitializeLayout();

    // 绑定事件监听器
    this.registerEventListeners();
    this.logger.info("Starting frontend application...");
  }

  /**
   * Register global event listeners.
   */
  protected registerEventListeners(): void {
    let isNeedConfirm = true;

    if(isTauri()){
      const tauriWindow = appWindow.getCurrentWindow();
      tauriWindow.onCloseRequested(async (event) => {
        if (isNeedConfirm) {
          // 执行保存布局
          this.layoutRestorer.storeLayout(this);
          this.stopContributions();
          return undefined;
        }
      });

      tauriWindow.onResized( async ({ payload: size }) => {
        // console.log('Window resized', size);
        this.shell.handleResize()
      })
    }
    
    // window.addEventListener("beforeunload", function (e) {
    //   if (isNeedConfirm) {
    //     e.preventDefault();
    //     return '';  // 也返回空字符串
    //   }
    // });

    window.addEventListener("unload", () => {
      this.layoutRestorer.storeLayout(this);
      this.stopContributions();
    });
    // 处理窗口大小变化
    window.addEventListener("resize", () => this.shell.handleResize());
  }

  /**
   * Initialize the shell layout either using the layout restorer service or, if no layout has
   * been stored, by creating the default layout.
   */
  protected async initializeLayout(): Promise<void> {
    if (!(await this.restoreLayout())) {
      // Fallback: Create the default shell layout
      await this.createDefaultLayout();
    }
  }

  /**
   * Try to restore the shell layout from the storage service. Resolves to `true` if successful.
   */
  protected async restoreLayout(): Promise<boolean> {
    try {
      return await this.layoutRestorer.restoreLayout(this);
    } catch (error) {
      if (ApplicationShellLayoutMigrationError.is(error)) {
        console.warn(error.message);
        console.info("Initializing the default layout instead...");
      } else {
        console.error("Could not restore layout", error);
      }
      return false;
    }
  }

  /**
   * Let the frontend application contributions initialize the shell layout. Override this
   * method in order to create an application-specific custom layout.
   */
  protected async createDefaultLayout(): Promise<void> {
    for (const contribution of this.contributions.getContributions()) {
      if (contribution.initializeLayout) {
        await this.measure(
          contribution.constructor.name + ".initializeLayout",
          () => contribution.initializeLayout!(this)
        );
      }
    }
  }

  protected async fireOnDidInitializeLayout(): Promise<void> {
    for (const contribution of this.contributions.getContributions()) {
      if (contribution.onDidInitializeLayout) {
        await this.measure(
          contribution.constructor.name + ".onDidInitializeLayout",
          () => contribution.onDidInitializeLayout!(this)
        );
      }
    }
  }

  /**
   * Initialize and start the frontend application contributions.
   */
  protected async startContributions(): Promise<void> {
    for (const contribution of this.contributions.getContributions()) {
      if (contribution.initialize) {
        try {
          await this.measure(
            contribution.constructor.name + ".initialize",
            () => contribution.initialize!()
          );
        } catch (error) {
          console.error("Could not initialize contribution", error);
        }
      }
    }

    for (const contribution of this.contributions.getContributions()) {
      if (contribution.configure) {
        try {
          await this.measure(contribution.constructor.name + ".configure", () =>
            contribution.configure!(this)
          );
        } catch (error) {
          console.error("Could not configure contribution", error);
        }
      }
    }

    /**
     * FIXME:
     * - decouple commands & menus
     * - consider treat commands, keybindings and menus as frontend application contributions
     */
    await this.measure("commands.onStart", () => this.commandsImpl.onStart());
    await this.measure("keybindings.onStart", () => this.keybindings.onStart());
    await this.measure("menus.onStart", () => this.menus.onStart());
    for (const contribution of this.contributions.getContributions()) {
      if (contribution.onStart) {
        try {
          await this.measure(contribution.constructor.name + ".onStart", () =>
            contribution.onStart!(this)
          );
        } catch (error) {
          this.logger.error("Could not start contribution", error);
        }
      }
    }
  }

  /**
   * Stop the frontend application contributions. This is called when the window is unloaded.
   */
  protected stopContributions(): void {
    this.logger.info(">>> Stopping frontend contributions...");
    for (const contribution of this.contributions.getContributions()) {
      if (contribution.onStop) {
        try {
          contribution.onStop(this);
        } catch (error) {
          console.error("Could not stop contribution", error);
        }
      }
    }
    this.logger.info("<<< All frontend contributions have been stopped.");
  }

  /**
   * Return a promise to the host element to which the application shell is attached.
   */
  getHost(): Promise<HTMLElement> {
    if (document.body) {
      return Promise.resolve(document.getElementById("root") || document.body);
    }
    return new Promise<HTMLElement>((resolve) =>
      window.addEventListener("load", () => resolve(document.body), {
        once: true,
      })
    );
  }

  protected async measure<T>(
    name: string,
    fn: () => MaybePromise<T>,
    message = `Frontend ${name}`,
    threshold = true
  ): Promise<T> {
    return this.stopwatch.startAsync(
      name,
      message,
      fn,
      threshold
        ? {
            thresholdMillis: TIMER_WARNING_THRESHOLD,
            defaultLogLevel: LogLevel.DEBUG,
          }
        : {}
    );
  }
}
