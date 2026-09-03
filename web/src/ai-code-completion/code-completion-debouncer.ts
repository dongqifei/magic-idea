export class InlineCompletionDebouncer {

    private timeoutId?: number;

    debounce<T>(callback: () => Promise<T>, debounceDelay: number): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            if (this.timeoutId) {
                window.clearTimeout(this.timeoutId);
            }

            this.timeoutId = window.setTimeout(() => {
                callback()
                    .then(resolve)
                    .catch(reject);
                this.timeoutId = undefined;
            }, debounceDelay);
        });
    }
}
