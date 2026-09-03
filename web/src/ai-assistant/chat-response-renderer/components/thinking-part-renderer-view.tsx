import * as React from 'react';
import { Think } from '@ant-design/x';
import { ThinkingChatResponseContent } from '@MagicIdea/ai-chat/common';

export interface ThinkingPartRendererViewProps {
  response: ThinkingChatResponseContent
}

export const ThinkingPartRendererView = (props: ThinkingPartRendererViewProps) => {
  // 只删除开头的换行，保留中间格式
  const cleanContent = (props.response.content || '').replace(/^\s+/, '');
  // return (
  //   <div className='theia-thinking'>
  //     <details>
  //       <summary>思考过程</summary>
  //       <pre>{cleanContent}</pre>
  //     </details>
  //   </div>
  // );
  return <Think title={'深度思考'}>{cleanContent}</Think>;
}