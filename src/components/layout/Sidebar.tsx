import React, { useState } from 'react';
import {
  Database,
  Receipt,
  ShieldAlert,
  Trophy,
  Swords,
  Timer,
  Boxes,
  Scroll,
  Mountain,
  SunMedium,
  Crosshair,
  Footprints,
  Compass,
  ShoppingBag,
  Gift,
  RefreshCw,
  FolderTree,
  FileCode2,
  PlayCircle,
  Search,
  Plus,
} from 'lucide-react';

interface SidebarProps {
  onInsertMacroBlock?: (blockTitle: string, blockCategory: string) => void;
}

interface PaletteCategory {
  name: string;
  badge?: string;
  badgeColor?: string;
  items: {
    title: string;
    description: string;
    icon: React.ReactNode;
    tag?: string;
    vaultRef?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ onInsertMacroBlock }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const categories: PaletteCategory[] = [
    {
      name: 'CORE SYSTEMS',
      badge: 'SETUP',
      badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      items: [
        {
          title: 'DataStore Safety',
          description: 'Session-locked player data with auto-save & migration',
          icon: <Database className="w-3.5 h-3.5 text-blue-400" />,
          tag: 'SERVER',
          vaultRef: 'DataStore Safety.md',
        },
        {
          title: 'ProcessReceipt',
          description: 'Idempotent DevProduct & Pass purchase transactions',
          icon: <Receipt className="w-3.5 h-3.5 text-emerald-400" />,
          tag: 'SERVER',
          vaultRef: 'Monetization Compliance.md',
        },
        {
          title: 'Anti-Exploit Remote Guard',
          description: 'Server-authoritative rate-limits & payload schema',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
          tag: 'SECURITY',
          vaultRef: 'Secure Remotes.md',
        },
        {
          title: 'Global Leaderboards',
          description: 'OrderedDataStore synced top players podium',
          icon: <Trophy className="w-3.5 h-3.5 text-amber-400" />,
          tag: 'NET',
        },
      ],
    },
    {
      name: 'GAMEPLAY & COMBAT',
      badge: 'COMBAT',
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      items: [
        {
          title: 'Hitbox / Melee Combat',
          description: 'Spatial query raycast hitbox with hit-stop & VFX',
          icon: <Swords className="w-3.5 h-3.5 text-rose-400" />,
          tag: 'CLIENT+SERVER',
        },
        {
          title: 'Round & Match Loop',
          description: 'Intermission, map teleport, win-condition state machine',
          icon: <Timer className="w-3.5 h-3.5 text-amber-400" />,
          tag: 'STATE',
        },
        {
          title: 'Inventory & Backpack',
          description: 'Stackable items, hotbar equip, weight constraints',
          icon: <Boxes className="w-3.5 h-3.5 text-indigo-400" />,
          tag: 'SYSTEM',
        },
        {
          title: 'Quest & Achievement Engine',
          description: 'Progressive goals, notification toasts & rewards',
          icon: <Scroll className="w-3.5 h-3.5 text-cyan-400" />,
          tag: 'PROGRESS',
        },
      ],
    },
    {
      name: 'WORLD & MAP',
      badge: 'WORLD',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      items: [
        {
          title: 'Biome & Terrain Builder',
          description: 'Procedural heightmap voxels, material grading',
          icon: <Mountain className="w-3.5 h-3.5 text-emerald-400" />,
          tag: 'MAP',
        },
        {
          title: 'Atmosphere & Post-FX',
          description: 'ColorCorrection, Bloom, DepthOfField & Skybox setup',
          icon: <SunMedium className="w-3.5 h-3.5 text-amber-400" />,
          tag: 'LIGHTING',
        },
        {
          title: 'Dynamic Spawner Grid',
          description: 'Mob / Ore / Coin respawn logic with zone bounding',
          icon: <Crosshair className="w-3.5 h-3.5 text-purple-400" />,
          tag: 'SERVER',
        },
        {
          title: 'Obby Obstacle Course',
          description: 'Kill-bricks, conveyor belts, rotating lasers, checkpoints',
          icon: <Footprints className="w-3.5 h-3.5 text-sky-400" />,
          tag: 'OBBY',
        },
      ],
    },
    {
      name: 'INTERFACE & HUD',
      badge: 'UI',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      items: [
        {
          title: 'Simulator Glass HUD',
          description: 'Responsive coins, level-up bar, multiplier badge',
          icon: <Compass className="w-3.5 h-3.5 text-indigo-400" />,
          tag: 'SCREENGUI',
        },
        {
          title: 'Shop & Gamepass Menu',
          description: 'Animated tabbed store with Buy-Robux hooks',
          icon: <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />,
          tag: 'SCREENGUI',
        },
        {
          title: 'Daily Streak / Spin Wheel',
          description: '24-hour timestamp verification with reward tiers',
          icon: <Gift className="w-3.5 h-3.5 text-pink-400" />,
          tag: 'RETENTION',
        },
        {
          title: 'Rebirth / Prestige System',
          description: 'Stat reset, permanent token boost & tier perks',
          icon: <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />,
          tag: 'PROGRESS',
        },
      ],
    },
    {
      name: 'STUDIO OPS',
      badge: 'STUDIO',
      badgeColor: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
      items: [
        {
          title: 'Inspect Explorer Tree',
          description: 'Query ReplicatedStorage, ServerScriptService, StarterGui',
          icon: <FolderTree className="w-3.5 h-3.5 text-zinc-400" />,
          tag: 'BRIDGE',
        },
        {
          title: 'Inject Script / Module',
          description: 'Push Luau source directly into Studio instance',
          icon: <FileCode2 className="w-3.5 h-3.5 text-blue-400" />,
          tag: 'BRIDGE',
        },
        {
          title: 'Trigger Playtest Session',
          description: 'Execute local test run and read output log',
          icon: <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />,
          tag: 'BRIDGE',
        },
      ],
    },
  ];

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.tag && item.tag.toLowerCase().includes(searchTerm.toLowerCase()))
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <aside className="w-64 border-r border-white/10 bg-[#0a0b12]/80 backdrop-blur-md flex flex-col select-none h-full">
      {/* Header & Filter */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
            Block Palette
          </span>
          <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/5">
            20 MACROS
          </span>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search blocks & APIs..."
            className="w-full bg-black/40 border border-white/10 rounded-md pl-8 pr-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Palette list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {filteredCategories.map((category) => (
          <div key={category.name} className="space-y-1.5">
            <div className="flex items-center justify-between px-1 py-0.5">
              <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                {category.name}
              </span>
              {category.badge && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${category.badgeColor}`}
                >
                  {category.badge}
                </span>
              )}
            </div>

            <div className="space-y-1">
              {category.items.map((item) => (
                <div
                  key={item.title}
                  onClick={() => onInsertMacroBlock?.(item.title, category.name)}
                  className="group relative p-2 rounded-md bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 rounded bg-black/40 border border-white/5 group-hover:border-indigo-500/40">
                        {item.icon}
                      </div>
                      <span className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors">
                        {item.title}
                      </span>
                    </div>
                    {item.tag && (
                      <span className="text-[9px] font-mono text-zinc-500 group-hover:text-zinc-400">
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-400 line-clamp-1 group-hover:text-zinc-300">
                    {item.description}
                  </p>
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
