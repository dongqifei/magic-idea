/**
 * Resolves after the next animation frame if no parameter is given,
 * or after the given number of animation frames.
 */
export declare function animationFrame(n?: number): Promise<void>;
/** Is a mouse `event` the pointer event that triggers the context menu on this platform? */
export declare function isContextMenuEvent(event: MouseEvent): boolean;
