import { isOSX } from "./os"

/**
 * Resolves after the next animation frame if no parameter is given,
 * or after the given number of animation frames.
 */
export function animationFrame(n: number = 1): Promise<void> {
    return new Promise(resolve => {
        function frameFunc(): void {
            if (n <= 0) {
                resolve();
            } else {
                n--;
                requestAnimationFrame(frameFunc);
            }
        }
        frameFunc();
    });
}

/** Is a mouse `event` the pointer event that triggers the context menu on this platform? */
export function isContextMenuEvent(event: MouseEvent): boolean {
    return isOSX && event.ctrlKey && event.button === 0 || event.button === 2;
}
