// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
use std::sync::{
    Mutex,
};
use tauri::{
    AppHandle, Emitter, Manager, WindowEvent
};
// use tauri_plugin_frame::FramePluginBuilder;
use tauri_plugin_decorum::WebviewWindowExt;
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;

/// Sidecar child process handle
struct SidecarState(Mutex<Option<tauri_plugin_shell::process::CommandChild>>);

/// Kill the sidecar process
fn kill_sidecar(app: &AppHandle) {
    let state = app.state::<SidecarState>();
    let mut guard = state.0.lock().unwrap();
    if let Some(child) = guard.take() {
        let pid = child.pid();
        // Windows: use taskkill /T to kill entire process tree (including bun child processes)
        // CREATE_NO_WINDOW prevents a console window from flashing on screen
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            let _ = std::process::Command::new("taskkill")
                .args(["/PID", &pid.to_string(), "/T", "/F"])
                .creation_flags(CREATE_NO_WINDOW)
                .output();
            log::info!("Sidecar process tree killed (PID: {})", pid);
        }
        #[cfg(not(target_os = "windows"))]
        {
            let _ = child.kill();
            // Also kill any child processes to prevent port leaks
            let _ = std::process::Command::new("pkill")
                .args(["-KILL", "-P", &pid.to_string()])
                .output();
            log::info!("Sidecar process tree killed (PID: {})", pid);
        }
    }
}

pub fn quit_application(app: &AppHandle) {
    kill_sidecar(app);
    app.exit(0);
}

/// 输出服务端日志：同步打印到控制台、写入日志文件，并推送 "server:output" 事件到前端
/// is_error 为 true 时使用 eprintln/log::error，否则使用 println/log::info
fn emit_server_output(app_handle: &AppHandle, line: &str, is_error: bool) {
    if is_error {
        eprintln!("{}", line);
        log::error!("{}", line);
    } else {
        println!("{}", line);
        log::info!("{}", line);
    }
    app_handle.emit("server:output", line).ok();
}

#[tauri::command]
fn open_devtools(app_handle: tauri::AppHandle) {
  if let Some(webview) = app_handle.get_webview_window("main") {
    webview.open_devtools();
  }
}

#[tauri::command]
fn close_devtools(app_handle: AppHandle) {
  if let Some(webview) = app_handle.get_webview_window("main") {
    webview.close_devtools();
  }
} 

pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      open_devtools,
      close_devtools,
    ])
    // .plugin(
    //   FramePluginBuilder::new()
    //     .titlebar_height(39)
    //     .button_width(46)
    //     .auto_titlebar(true)
    //     .snap_overlay_delay_ms(15)
    //     .close_hover_bg("rgba(196,43,28,1)")
    //     .button_hover_bg("rgba(255,255,255,0.1)")
    //     .build()
    // )
    .plugin(tauri_plugin_decorum::init())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_deep_link::init())
    .plugin(tauri_plugin_shell::init())
    .manage(SidecarState(Mutex::new(None)))// 初始化 SidecarState 以存储 sidecar child
    .on_window_event(|window, event| {  // 添加窗口事件监听器，在窗口关闭时杀死 sidecar
        if let WindowEvent::CloseRequested { .. } = event {
          quit_application(window.app_handle());
        }
    })
    .setup(|app| {
      // Create a custom titlebar for main window
      // On Windows this will hide decoration and render custom window controls
      // On macOS it expects a hiddenTitle: true and titleBarStyle: overlay
      let main_window = app.get_webview_window("main").unwrap();
      main_window.create_overlay_titlebar().unwrap();

      #[cfg(target_os = "macos")] {
				// Set a custom inset to the traffic lights
				main_window.set_traffic_lights_inset(12.0, 16.0).unwrap();

				// Make window transparent without privateApi
				main_window.make_transparent().unwrap();

				// Set window level
				// NSWindowLevel: https://developer.apple.com/documentation/appkit/nswindowlevel
				// main_window.set_window_level(25).unwrap();
			}
      
      #[cfg(desktop)]
      app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;

      #[cfg(desktop)]
      app.deep_link().register_all()?;

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build()
        )?;
      }

      // ====================== 启动服务端======================
      let app_handle = app.handle().clone();
      let sidecar_command = app.shell().sidecar("idea-server").unwrap();
      let (mut rx, child) = sidecar_command  // 存储 child 而不是丢弃
        .spawn()
        .expect("Failed to spawn sidecar");

      // 将 child 存储到 SidecarState 中
      {
        let state = app.state::<SidecarState>();
        let mut guard = state.0.lock().unwrap();
        *guard = Some(child);
      }

      let app_handle_clone = app_handle.clone();
      tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
          match event {
            CommandEvent::Stdout(line_bytes) => {
              let line = String::from_utf8_lossy(&line_bytes);
              emit_server_output(&app_handle_clone, &line, false);
            }
            CommandEvent::Stderr(line_bytes) => {
              let line = String::from_utf8_lossy(&line_bytes);
              emit_server_output(&app_handle_clone, &line, true);
            }
            _ => {}
          }
        }
      });
      emit_server_output(&app_handle, "==================启动Node服务端成功=========================", false);

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}