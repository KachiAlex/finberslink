import React from 'react';

export const Form = ({ children, ...props }: React.FormHTMLAttributes<HTMLFormElement>) => (
  <form {...props}>
    {children}
  </form>
);

export const FormField = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">
    {children}
  </div>
);

export const FormItem = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`space-y-2 ${className}`}>
    {children}
  </div>
);

export const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ children, className = '', ...props }, ref) => (
  <label
    ref={ref}
    className={`text-sm font-medium text-gray-700 ${className}`}
    {...props}
  >
    {children}
  </label>
));

FormLabel.displayName = 'FormLabel';

export const FormControl = ({ children }: { children: React.ReactNode }) => (
  <div>
    {children}
  </div>
);

export const FormDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-gray-500 ${className}`}>
    {children}
  </p>
);

export const FormMessage = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-red-500 ${className}`}>
    {children}
  </p>
);
