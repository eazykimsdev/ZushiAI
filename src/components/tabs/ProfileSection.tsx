import * as React from 'react';
import { Upload, Trash2, Check } from 'lucide-react';
import { UserSettings } from '../../types';
import { Avatar, fileToAvatarDataUrl } from '../ui/Avatar';

interface ProfileSectionProps {
  settings: UserSettings;
  onUpdateSettings: (partial: Partial<UserSettings>) => void;
}

const inputClass =
  'w-full h-10 rounded-[10px] bg-background border border-border px-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors';

interface IconPickerProps {
  label: string;
  hint: string;
  src?: string;
  name?: string;
  rounded: 'full' | 'xl';
  onPick: (dataUrl: string) => void;
  onClear: () => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ label, hint, src, name, rounded, onPick, onClear }) => {
  const ref = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState('');

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, WebP or GIF).');
      return;
    }
    try {
      setError('');
      onPick(await fileToAvatarDataUrl(file));
    } catch (err: any) {
      setError(err?.message || 'Could not read that image.');
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar src={src} name={name} size={64} rounded={rounded} />
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-foreground">{label}</div>
        <div className="text-[12px] text-muted-foreground mb-2">{hint}</div>
        <div className="flex items-center gap-2">
          <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handle} />
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="h-8 px-3 inline-flex items-center gap-1.5 rounded-[8px] border border-border hover:border-border-hover bg-surface-2 text-[12px] text-foreground transition-colors cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" /> {src ? 'Replace' : 'Upload'}
          </button>
          {src && (
            <button
              type="button"
              onClick={onClear}
              className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-[8px] text-[12px] text-muted-foreground hover:text-error transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          )}
        </div>
        {error && <div className="mt-1.5 text-[12px] text-error">{error}</div>}
      </div>
    </div>
  );
};

/** Roblox experience + Roblox developer identity shown in the sidebar. Saved to SQLite settings on blur. */
export const ProfileSection: React.FC<ProfileSectionProps> = ({ settings, onUpdateSettings }) => {
  const [serverName, setServerName] = React.useState(settings.serverName || '');
  const [userName, setUserName] = React.useState(settings.userName || '');
  const [userHandle, setUserHandle] = React.useState(settings.userHandle || '');
  const [saved, setSaved] = React.useState(false);

  // Keep local fields in sync after the async settings load
  React.useEffect(() => setServerName(settings.serverName || ''), [settings.serverName]);
  React.useEffect(() => setUserName(settings.userName || ''), [settings.userName]);
  React.useEffect(() => setUserHandle(settings.userHandle || ''), [settings.userHandle]);

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const commit = (key: 'serverName' | 'userName' | 'userHandle', value: string, current?: string) => {
    const v = value.trim();
    if (v === (current || '')) return;
    onUpdateSettings({ [key]: v } as Partial<UserSettings>);
    flash();
  };

  return (
    <section id="settings-profile" className="surface-card p-6 scroll-mt-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-[18px] font-semibold text-foreground">Roblox Experience and Profile</h2>
          <p className="text-[13px] text-muted-foreground mt-1 max-w-md">
            Shown in the sidebar and project metadata. Stored locally on this device.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-[12px] text-success transition-opacity duration-200 ${saved ? 'opacity-100' : 'opacity-0'}`}
          aria-live="polite"
        >
          <Check className="h-3.5 w-3.5" /> Saved
        </span>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div className="text-[12px] font-medium text-muted-foreground">Roblox Experience</div>
          <IconPicker
            label="Experience icon"
            hint="Square icons look best."
            src={settings.serverIcon}
            name={serverName}
            rounded="xl"
            onPick={(url) => {
              onUpdateSettings({ serverIcon: url });
              flash();
            }}
            onClear={() => onUpdateSettings({ serverIcon: '' })}
          />
          <label className="block">
            <span className="block text-[12px] text-muted-foreground mb-1.5">Experience or Group Name</span>
            <input
              className={inputClass}
              value={serverName}
              placeholder="e.g. Aether Arena or Blox Devs"
              maxLength={40}
              onChange={(e) => setServerName(e.target.value)}
              onBlur={() => commit('serverName', serverName, settings.serverName)}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            />
          </label>
        </div>

        <div className="space-y-4">
          <div className="text-[12px] font-medium text-muted-foreground">Roblox Developer Profile</div>
          <IconPicker
            label="Avatar image"
            hint="Shown next to your name."
            src={settings.userAvatar}
            name={userName || userHandle}
            rounded="full"
            onPick={(url) => {
              onUpdateSettings({ userAvatar: url });
              flash();
            }}
            onClear={() => onUpdateSettings({ userAvatar: '' })}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-[12px] text-muted-foreground mb-1.5">Developer Name</span>
              <input
                className={inputClass}
                value={userName}
                placeholder="Your name"
                maxLength={32}
                onChange={(e) => setUserName(e.target.value)}
                onBlur={() => commit('userName', userName, settings.userName)}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              />
            </label>
            <label className="block">
              <span className="block text-[12px] text-muted-foreground mb-1.5">Roblox Username</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground pointer-events-none">@</span>
                <input
                  className={inputClass + ' pl-7'}
                  value={userHandle.replace(/^@/, '')}
                  placeholder="roblox_username"
                  maxLength={32}
                  onChange={(e) => setUserHandle(e.target.value.replace(/^@/, '').replace(/\s/g, ''))}
                  onBlur={() => commit('userHandle', userHandle, settings.userHandle)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                />
              </div>
            </label>
          </div>
        </div>
      </div>
    </section>
  );
};
