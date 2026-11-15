import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AttachmentGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

export const AttachmentGroup = React.forwardRef<HTMLDivElement, AttachmentGroupProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-nowrap items-center gap-2 overflow-x-auto py-1 px-1 scrollbar-thin scrollbar-thumb-white/10 select-none',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AttachmentGroup.displayName = 'AttachmentGroup';

export interface AttachmentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'subtle';
}

export const Attachment = React.forwardRef<HTMLDivElement, AttachmentProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'group relative inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors shrink-0 max-w-[220px]',
          variant === 'default' &&
            'bg-muted/60 hover:bg-muted border-border text-foreground',
          variant === 'outline' &&
            'bg-transparent hover:bg-muted/30 border-border text-foreground',
          variant === 'subtle' &&
            'bg-secondary/40 hover:bg-secondary/70 border-transparent text-secondary-foreground',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Attachment.displayName = 'Attachment';

export interface AttachmentMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
}

export const AttachmentMedia = React.forwardRef<HTMLDivElement, AttachmentMediaProps>(
  ({ className, src, alt, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded overflow-hidden bg-background/50 text-muted-foreground',
          className
        )}
        {...props}
      >
        {src ? (
          <img src={src} alt={alt || 'attachment preview'} className="h-full w-full object-cover" />
        ) : (
          children
        )}
      </div>
    );
  }
);
AttachmentMedia.displayName = 'AttachmentMedia';

export interface AttachmentContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const AttachmentContent = React.forwardRef<HTMLDivElement, AttachmentContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col min-w-0 flex-1 overflow-hidden', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AttachmentContent.displayName = 'AttachmentContent';

export interface AttachmentTitleProps extends React.HTMLAttributes<HTMLSpanElement> {}

export const AttachmentTitle = React.forwardRef<HTMLSpanElement, AttachmentTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'truncate text-[12px] font-medium text-foreground tracking-tight',
          className
        )}
        title={typeof children === 'string' ? children : undefined}
        {...props}
      >
        {children}
      </span>
    );
  }
);
AttachmentTitle.displayName = 'AttachmentTitle';

export interface AttachmentActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

export const AttachmentActions = React.forwardRef<HTMLDivElement, AttachmentActionsProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center shrink-0 ml-0.5', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AttachmentActions.displayName = 'AttachmentActions';

export interface AttachmentActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const AttachmentAction = React.forwardRef<HTMLButtonElement, AttachmentActionProps>(
  ({ className, children, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
AttachmentAction.displayName = 'AttachmentAction';
