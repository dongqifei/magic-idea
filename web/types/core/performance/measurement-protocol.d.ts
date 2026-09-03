import { Measurement, MeasurementOptions } from './measurement';
import { Stopwatch } from './stopwatch';
export declare const BackendStopwatch: unique symbol;
/** API path of the stopwatch service that exposes the back-end stopwatch to clients. */
export declare const stopwatchPath = "/services/stopwatch";
/** Token representing a remote measurement in the {@link BackendStopwatch} protocol. */
export type RemoteMeasurement = number;
export declare const BackendStopwatchOptions: unique symbol;
/**
 * A service that exposes the back-end's {@link Stopwatch} to clients
 * via the remote API. If you do not need this service then bind or re-bind
 * the {@link NullBackendStopwatch} implementation to this service interface.
 */
export interface BackendStopwatch {
    /**
     * Create a {@link Measurement} that will compute the time that elapsed on the back-end when logged.
     *
     * @param name the {@link Measurement.name measurement name}
     * @param options optional configuration of the new measurement
     * @returns a token identifying an unique self-timing measurement relative to the back-end's timeline
     */
    start(name: string, options?: MeasurementOptions): Promise<RemoteMeasurement>;
    /**
     * Stop a measurement previously {@link start started} and log in the back-end a measurement of
     * its duration relative to the back-end's timeline.
     *
     * @param measurement token identifying a measurement previously {@link start started}
     * @param message a message to log
     * @param messageArgs optional arguments to the `message`
     */
    stop(measurement: RemoteMeasurement, message: string, messageArgs: any[]): Promise<void>;
}
/**
 * Default implementation of the (remote) back-end stopwatch service.
 */
export declare class DefaultBackendStopwatch {
    readonly measurements: Map<number, Measurement>;
    protected idSequence: number;
    protected readonly stopwatch: Stopwatch;
    start(name: string, options?: MeasurementOptions): RemoteMeasurement;
    stop(measurementToken: RemoteMeasurement, message: string, messageArgs: any[]): void;
}
/**
 * No-op implementation of the (remote) back-end stopwatch service.
 */
export declare class NullBackendStopwatch implements BackendStopwatch {
    start(): Promise<RemoteMeasurement>;
    stop(): Promise<void>;
}
