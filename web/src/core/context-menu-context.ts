import { injectable } from 'inversify';
import { OS } from './common/os';

@injectable()
export class ContextMenuContext {

    protected _altPressed = false;
    get altPressed(): boolean {
        return this._altPressed;
    }

    protected setAltPressed(altPressed: boolean): void {
        this._altPressed = altPressed;
    }

    resetAltPressed(): void {
        this.setAltPressed(false);
    }

    constructor() {
        document.addEventListener('keydown', e => this.setAltPressed(e.altKey || (OS.type() !== OS.Type.OSX && e.shiftKey)), true);
        document.addEventListener('keyup', () => this.resetAltPressed(), true);
    }

}
