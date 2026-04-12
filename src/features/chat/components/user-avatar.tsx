import React from 'react';

export const UserAvatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { src?: string; alt?: string }
>(({ src, alt = 'User', className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden ${className}`}
    {...props}
  >
    {src ? (
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    ) : (
      <span className="text-sm font-medium text-gray-600">{alt.charAt(0)}</span>
    )}
  </div>
));

UserAvatar.displayName = 'UserAvatar';
