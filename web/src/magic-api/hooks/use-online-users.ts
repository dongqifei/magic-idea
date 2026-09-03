import { useEffect, useState, useCallback } from 'react';
import { MagicApiOnlineUserInfo } from '@MagicIdea/core/magic-api/magic-api-types';
import { MagicApiOnlineUserService } from '@MagicIdea/core/magic-api/magic-api-online-user-service';

export const useOnlineUsers = (onlineUserService?: MagicApiOnlineUserService) => {
  const [onlineUsers, setOnlineUsers] = useState<MagicApiOnlineUserInfo[]>([]);
  const [fileUsers, setFileUsers] = useState<Map<string, MagicApiOnlineUserInfo[]>>(new Map());

  // 获取所有在线用户
  const getAllOnlineUsers = useCallback(() => {
    return onlineUserService?.getAllOnlineUsers() || [];
  }, [onlineUserService]);

  // 获取指定文件的在线用户
  const getUsersByFileId = useCallback((fileId: string) => {
    return onlineUserService?.getUsersByFileId(fileId) || [];
  }, [onlineUserService]);

  // 监听在线用户变化
  useEffect(() => {
    if (!onlineUserService) return;

    const disposables = [
      onlineUserService.onOnlineUsersChange(users => {
        setOnlineUsers([...users]);
      }),
      
      onlineUserService.onFileUsersChange(({ fileId, users }) => {
        setFileUsers(prev => {
          const newMap = new Map(prev);
          if (users.length === 0) {
            newMap.delete(fileId);
          } else {
            newMap.set(fileId, users);
          }
          return newMap;
        });
      })
    ];

    // 初始化数据
    setOnlineUsers(onlineUserService.getAllOnlineUsers());

    return () => {
      disposables.forEach(disposable => disposable.dispose());
    };
  }, [onlineUserService]);

  return {
    // 状态
    onlineUsers,
    fileUsers,
    
    // 方法
    getAllOnlineUsers,
    getUsersByFileId,
    
    // 快捷方法
    isFileActive: (fileId: string) => 
      onlineUserService?.isFileActive(fileId) || false,
      
    getOnlineUserCount: () => 
      onlineUserService?.getOnlineUserCount() || 0,
      
    getOnlineUserCountByFile: (fileId: string) => 
      onlineUserService?.getOnlineUserCountByFile(fileId) || 0,
  };
};