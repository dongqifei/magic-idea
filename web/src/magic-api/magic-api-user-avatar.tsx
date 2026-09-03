import React from 'react';
import { MagicApiOnlineUserInfo } from '@MagicIdea/core/magic-api/magic-api-types';
import './magic-api-user-avatar.css';

export interface MagicApiUserAvatarProps {
  users: MagicApiOnlineUserInfo[];
  maxDisplay?: number;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
  className?: string;
}

// 头像颜色生成函数
const getColorByCid = (cid: string) => {
  const colors = [
    '#1565C0', '#2E7D32', '#F9A825', '#D84315', '#6A1B9A',
    '#00838F', '#AD1457', '#37474F', '#4E342E', '#283593',
  ];
  
  // 使用djb2哈希算法
  let hash = 5381;
  for (let i = 0; i < cid.length; i++) {
    hash = (hash * 33) ^ cid.charCodeAt(i);
  }
  
  const index = (hash >>> 0) % colors.length;
  return colors[index];
};

// 获取用户名的第一个字符
const getInitial = (username: string) => {
  if (!username || username.trim().length === 0) return '?';
  return username.charAt(0).toUpperCase();
};

// 单个用户头像组件
export const MagicApiUserAvatar: React.FC<{ 
  user: MagicApiOnlineUserInfo; 
  size?: 'small' | 'medium' | 'large';
}> = ({ user, size = 'small' }) => {
  const sizeClass = {
    small: 'avatar-sm',
    medium: 'avatar-md',
    large: 'avatar-lg',
  }[size];

  return (
    <div className="user-avatar-container">
    <div
      className={`magic-api-user-avatar ${sizeClass}`}
      style={{ backgroundColor: getColorByCid(user.cid) }}
      title={`${user.username} (${user.ip})`}
    >
      {getInitial(user.username)}
    </div>
    </div>
  );
};

// 用户头像组组件
export const MagicApiUserAvatarsGroup: React.FC<MagicApiUserAvatarProps> = ({
  users,
  maxDisplay = 3,
  size = 'small',
  className = '',
}) => {
  if (!users || users.length === 0) return null;

  const displayUsers = users.slice(0, maxDisplay);
  const extraCount = users.length - maxDisplay;

  return (
    <div className={`magic-api-user-avatars-group ${className}`}>
      {displayUsers.map((user, index) => (
        <div
          key={user.cid}
          className="avatar-item"
        >
          <MagicApiUserAvatar user={user} size={size} />
        </div>
      ))}
      
      {extraCount > 0 && (
        <div 
          className="avatar-extra-count" 
          title={`还有 ${extraCount} 人正在编辑`}
        >
          +{extraCount}
        </div>
      )}
    </div>
  );
};