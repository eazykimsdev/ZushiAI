import * as React from 'react';
import {
  Paperclip,
  ArrowUp,
  Square,
  FileCode,
  FileText,
  Image as ImageIcon,
  File,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from './attachment';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from './input-group';
import { Field } from './field';

export interface AttachedFile {
  id: string;
  name: string;
  path?: string;
  size?: number;
  type: 'image' | 'luau' | 'markdown' | 'other';
  previewUrl?: string;
}

export interface AttachmentComposerTrayProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string, attachments: AttachedFile[]) => void;
  onStop?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxAttachments?: number;
  quickPrompts?: string[];
  className?: string;
}

function getFileType(fileName: string): AttachedFile['type'] {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp')) {
    return 'image';
  }
  if (lower.endsWith('.luau') || lower.endsWith('.lua')) {
    return 'luau';
  }
  if (lower.endsWith('.md') || lower.endsWith('.txt')) {
    return 'markdown';
  }
  return 'other';
}

function getFileIcon(type: AttachedFile['type']) {
  switch (type) {
    case 'image':
      return <ImageIcon className="h-3.5 w-3.5 text-blue-400" />;
    case 'luau':
      return <FileCode className="h-3.5 w-3.5 text-emerald-400" />;
    case 'markdown':
      return <FileText className="h-3.5 w-3.5 text-amber-400" />;
    default:
      return <File className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

export const AttachmentComposerTray: React.FC<AttachmentComposerTrayProps> = ({
  value,
  onChange,
  onSubmit,
  onStop,
  isLoading = false,
  disabled = false,
  placeholder = 'Ask LihForge to engineer a Roblox system, mechanics, or Luau script...',
  maxAttachments = 5,
  quickPrompts = [],
  className,
}) => {
  const [attachments, setAttachments] = React.useState<AttachedFile[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handlePickFiles = async () => {
    if (attachments.length >= maxAttachments) return;

    try {
      // Try Tauri dialog plugin first
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: 'Roblox Assets & Code',
            extensions: ['luau', 'lua', 'md', 'txt', 'png', 'jpg', 'jpeg', 'webp', 'json'],
          },
        ],
      });

      if (!selected) return;

      const paths = Array.isArray(selected) ? selected : [selected];
      const remainingSlots = maxAttachments - attachments.length;
      const toAdd = paths.slice(0, remainingSlots).map((p) => {
        const name = p.split(/[/\\]/).pop() || 'file';
        return {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name,
          path: p,
          type: getFileType(name),
        } as AttachedFile;
      });

      setAttachments((prev) => [...prev, ...toAdd]);
    } catch {
      // Browser fallback using input element
      fileInputRef.current?.click();
    }
  };

  const handleBrowserFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxAttachments - attachments.length;
    const newItems: AttachedFile[] = [];

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const f = files[i];
      const type = getFileType(f.name);
      const item: AttachedFile = {
        id: `file-${Date.now()}-${i}`,
        name: f.name,
        size: f.size,
        type,
        previewUrl: type === 'image' ? URL.createObjectURL(f) : undefined,
      };
      newItems.push(item);
    }

    setAttachments((prev) => [...prev, ...newItems]);
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((a) => a.id !== id);
    });
  };

  const handleSubmit = () => {
    if ((!value.trim() && attachments.length === 0) || isLoading || disabled) return;
    onSubmit(value, attachments);
    setAttachments([]);
  };

  const isAtCap = attachments.length >= maxAttachments;

  return (
    <Field className={cn('w-full', className)}>
      {/* Hidden browser file input for web fallback */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".luau,.lua,.md,.txt,.png,.jpg,.jpeg,.webp,.json"
        className="hidden"
        onChange={handleBrowserFileChange}
      />

      {/* Quick suggestions if provided */}
      {quickPrompts.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none select-none">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0 pl-1">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>Quick:</span>
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading || disabled}
              onClick={() => onChange(prompt)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-secondary/60 hover:bg-secondary text-secondary-foreground border border-border transition-colors shrink-0 truncate max-w-[280px]"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Main Composer Box */}
      <InputGroup>
        {/* Top Addon: Attachment Tray (renders only if files attached) */}
        {attachments.length > 0 && (
          <InputGroupAddon align="block-start">
            <AttachmentGroup>
              {attachments.map((file) => (
                <Attachment key={file.id} variant="default">
                  <AttachmentMedia src={file.previewUrl}>
                    {getFileIcon(file.type)}
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>{file.name}</AttachmentTitle>
                  </AttachmentContent>
                  <AttachmentActions>
                    <AttachmentAction
                      aria-label="Remove attachment"
                      onClick={() => handleRemoveAttachment(file.id)}
                    >
                      <X className="h-3 w-3" />
                    </AttachmentAction>
                  </AttachmentActions>
                </Attachment>
              ))}
            </AttachmentGroup>
            <InputGroupText className="text-[10px] tabular-nums shrink-0 pl-2">
              {attachments.length}/{maxAttachments}
            </InputGroupText>
          </InputGroupAddon>
        )}

        {/* Textarea */}
        <InputGroupTextarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxHeight={160}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        {/* Bottom Addon: Actions Toolbar */}
        <InputGroupAddon align="block-end">
          <div className="flex items-center gap-1">
            <InputGroupButton
              variant="ghost"
              size="icon"
              disabled={isAtCap || isLoading || disabled}
              onClick={handlePickFiles}
              title={
                isAtCap
                  ? `Attachment limit reached (${maxAttachments} max)`
                  : 'Attach script, doc, or reference image'
              }
            >
              <Paperclip className="h-4 w-4" />
            </InputGroupButton>
            <span className="text-[11px] text-muted-foreground select-none pl-1 hidden sm:inline">
              Shift + Enter for new line
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isLoading ? (
              <InputGroupButton
                variant="destructive"
                size="sm"
                onClick={onStop}
                title="Cancel current run"
              >
                <Square className="h-3 w-3 fill-current" />
                <span>Stop</span>
              </InputGroupButton>
            ) : (
              <InputGroupButton
                variant="primary"
                size="sm"
                disabled={!value.trim() && attachments.length === 0}
                onClick={handleSubmit}
                title="Send message (Enter)"
              >
                <span>Send</span>
                <ArrowUp className="h-3.5 w-3.5" />
              </InputGroupButton>
            )}
          </div>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
};
