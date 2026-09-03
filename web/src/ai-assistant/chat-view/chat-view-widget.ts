import {
    ChatAgent,
    ChatAgentService,
    ChatModel,
    ChatRequestModel,
    ChatResponseContent,
    ChatResponseModel,
    ChatService,
    EditableChatRequestModel,
    ParsedChatRequestAgentPart,
    ParsedChatRequestFunctionPart,
    ParsedChatRequestVariablePart,
    type ChatRequest,
    type ChatHierarchyBranch,
} from '@MagicIdea/ai-chat/common';
import { TreeNode } from './tree-node';

// TODO Instead of directly operating on the ChatRequestModel we could use an intermediate view model
export interface RequestNode extends TreeNode {
    request: ChatRequestModel,
    branch: ChatHierarchyBranch,
    sessionId: string
}
export const isRequestNode = (node: TreeNode): node is RequestNode => 'request' in node;

export interface EditableRequestNode extends RequestNode {
    request: EditableChatRequestModel
}
export const isEditableRequestNode = (node: TreeNode): node is EditableRequestNode => isRequestNode(node) && EditableChatRequestModel.is(node.request);

// TODO Instead of directly operating on the ChatResponseModel we could use an intermediate view model
export interface ResponseNode extends TreeNode {
    response: ChatResponseModel,
    sessionId: string
}
export const isResponseNode = (node: TreeNode): node is ResponseNode => 'response' in node;


