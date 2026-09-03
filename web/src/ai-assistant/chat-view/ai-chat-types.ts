import { FileData } from "@MagicIdea/core/filesystem/file-system-types";
import { ChatMode } from "@MagicIdea/ai-chat/common";

export interface FileContextInfo {
  name?: string;
  icon?: string;
  iconColor?: string;
  languageId?: string; // 语言ID
  selectionText?: string;
  selectionLineText?: string;
  isContextEnabled?: boolean;
  uri?: string;
  fileMetaData?: FileData & {[key: string]: any};
}

export interface ReceivingAgentType {
  agentId: string;
  modes: ChatMode[];
  currentModeId?: string;
} 