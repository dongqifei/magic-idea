import { Channel } from '../../common/message-rpc/channel';
import { IEvent as Event } from '../../common';
export declare const ConnectionSource: unique symbol;
/**
 * A ConnectionSource creates a Channel. The channel is valid until it sends a close event.
 */
export interface ConnectionSource {
    onConnectionDidOpen: Event<Channel>;
}
