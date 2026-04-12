'use client';

import { FC, useState } from 'react';
import { Bell } from 'lucide-react';

interface NotificationsBellProps {
  unreadCount?: number;
}

export const NotificationsBell: FC<NotificationsBellProps> = ({
  unreadCount = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};
