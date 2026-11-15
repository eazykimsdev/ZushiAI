import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  focused?: boolean;
}

export const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex flex-col w-full rounded-xl border border-border bg-card/80 transition-all focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/40 shadow-sm',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
InputGroup.displayName = 'InputGroup';

export interface InputGroupAddonProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'block-start' | 'block-end';
}

export const InputGroupAddon = React.forwardRef<HTMLDivElement, InputGroupAddonProps>(
  ({ className, align = 'block-end', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground',
          align === 'block-start' && 'border-b border-border/50 justify-between',
          align === 'block-end' && 'border-t border-border/50 justify-between',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
InputGroupAddon.displayName = 'InputGroupAddon';

export interface InputGroupButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'primary' | 'destructive';
  size?: 'sm' | 'default' | 'icon';
}

export const InputGroupButton = React.forwardRef<
  HTMLButtonElement,
  InputGroupButtonProps
>(
  (
    {
      className,
      variant = 'ghost',
      size = 'default',
      type = 'button',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer',
          variant === 'ghost' &&
            'text-muted-foreground hover:text-foreground hover:bg-white/5 active:bg-white/10',
          variant === 'default' &&
            'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
          variant === 'primary' &&
            'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
          variant === 'destructive' &&
            'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
          size === 'default' && 'h-8 px-3 py-1.5 gap-1.5',
          size === 'sm' && 'h-7 px-2.5 text-[11px] gap-1',
          size === 'icon' && 'h-7 w-7 p-0',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
InputGroupButton.displayName = 'InputGroupButton';

export interface InputGroupTextProps
  extends React.HTMLAttributes<HTMLSpanElement> {}

export const InputGroupText = React.forwardRef<HTMLSpanElement, InputGroupTextProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn('text-xs text-muted-foreground select-none', className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);
InputGroupText.displayName = 'InputGroupText';

export interface InputGroupTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxHeight?: number;
}

export const InputGroupTextarea = React.forwardRef<
  HTMLTextAreaElement,
  InputGroupTextareaProps
>(({ className, maxHeight = 160, value, onChange, ...props }, ref) => {
  const internalRef = React.useRef<HTMLTextAreaElement | null>(null);

  const adjustHeight = React.useCallback(() => {
    const textarea = internalRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
  }, [maxHeight]);

  React.useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const setCombinedRef = (node: HTMLTextAreaElement | null) => {
    internalRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
    }
  };

  return (
    <textarea
      ref={setCombinedRef}
      value={value}
      onChange={(e) => {
        onChange?.(e);
        adjustHeight();
      }}
      rows={1}
      className={cn(
        'w-full resize-none bg-transparent px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none scrollbar-thin scrollbar-thumb-white/10 leading-relaxed font-sans',
        className
      )}
      {...props}
    />
  );
});
InputGroupTextarea.displayName = 'InputGroupTextarea';
