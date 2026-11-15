import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: number;
  rounded?: 'full' | 'xl';
  className?: string;
}

function initialsOf(name?: string): string {
  const clean = (name || '').replace(/^@/, '').trim();
  if (!clean) return '';
  const parts = clean.split(/[\s_.-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : clean.slice(0, 2);
  return letters.toUpperCase();
}

/** Image avatar with a clean initials fallback. No placeholder art. */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 32,
  rounded = 'full',
  className,
}) => {
  const initials = initialsOf(name);
  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden flex items-center justify-center bg-surface-3 text-foreground font-semibold border border-border select-none',
        rounded === 'full' ? 'rounded-full' : 'rounded-[12px]',
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) }}
    >
      {src ? (
        <img src={src} alt={name || 'avatar'} className="h-full w-full object-cover" draggable={false} />
      ) : (
        initials
      )}
    </div>
  );
};

/** Reads an image file, center-crops to a square and returns a small PNG data URL. */
export async function fileToAvatarDataUrl(file: Blob, px = 128): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Could not read that image.'));
      i.src = url;
    });
    const side = Math.min(img.width, img.height);
    const canvas = document.createElement('canvas');
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable.');
    ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, px, px);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}
