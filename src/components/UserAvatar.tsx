import React from 'react';
import { getUserAvatar, avatarSizeClasses } from '../utils/userIcons';

interface UserAvatarProps {
  username: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

export default function UserAvatar({ 
  username, 
  size = 'md', 
  showName = false,
  className = ''
}: UserAvatarProps) {
  const { emoji, colorClass } = getUserAvatar(username);
  
  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${colorClass} ${avatarSizeClasses[size]} rounded-full flex items-center justify-center`}>
        <span>{emoji}</span>
      </div>
      {showName && (
        <span className="ml-2 text-sm font-medium">{username}</span>
      )}
    </div>
  );
}