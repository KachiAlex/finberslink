'use client';

import { FC } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface ChatAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
}

export const ChatAvatar: FC<ChatAvatarProps> = ({
  src,
  alt = 'User avatar',
  fallback = 'U',
}) => {
  return (
    <Avatar>
      {src && <AvatarImage src={src} alt={alt} />}
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
};
