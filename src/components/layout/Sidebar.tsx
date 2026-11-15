import * as React from 'react';
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
  Footprints,
  Compass,
  ShoppingBag,
  Gift,
  FolderTree,
  Search,
  ChevronDown,
} from 'lucide-react';

interface SidebarProps {
  onInsertMacroBlock?: (blockTitle: string, blockCategory: string) => void;
}

interface PaletteItem {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface PaletteCategory {
  id: string;
  name: string;
  items: PaletteItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ onInsertMacroBlock }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [collapsedCategories, setCollapsedCategories] = React.useState<Record<string, boolean>>({});

  const toggleCategory = (id: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const categories: PaletteCategory[] = [
    {
      id: 'core',
      name: 'Core Systems',
      items: [
        {
          title: 'DataStore Safety',
          description: 'Session-locked player data with auto-save & retry budgets',
          icon: <Database className="h-4 w-4 text-muted-foreground" />,
        },
        {
          title: 'ProcessReceipt',
          description: 'Idempotent DevProduct & Pass purchase transactions',
          icon: <Receipt className="h-4 w-4 text-muted-foreground" />,
        },
        {
          title: 'Anti-Exploit Remote Guard',
          description: 'Server-authoritative rate-limits & payload type checks',
          icon: <ShieldAlert className="h-4 w-4 text-muted-foreground" />,
        },
        {
          title: 'Global Leaderboards',
          description: 'OrderedDataStore synced podium rankings',
          icon: <Trophy className="h-4 w-4 text-muted-foreground" />,
        },
      ],
    },
    {
      id: 'combat',
      name: 'Gameplay & Combat',
      items: [
        {
          title: 'Hitbox / Melee Combat',
          description: 'Spatial query raycast hitbox with hit-stop & VFX',
          icon: <Swords className="h-4 w-4 text-muted-foreground" />,
        },
        {
          title: 'Round & Match Loop',
          description: 'Intermission, map teleport, win-condition state machine',
          icon: <Timer className="h-4 w-4 text-muted-foreground" />,
        },
        {
          title: 'Inventory & Backpack',
          description: 'Stackable items, hotbar equip, weight constraints',
          icon: <Boxes className="h-4 w-4 text-muted-foreground" />,
        },
        {
          title: 'Quest & Achievement Engine',
          description: 'Progress tracker, kill/collect triggers, claim rewards',
          icon: <Scroll className="h-4 w-4 text-muted-foreground" />,
        },
      ],
    },
    {
      id: 'monetization',
      name: 'Monetization & Retention',
      items: [
        {
          title: 'Pet Hatching & Probability',
          description: '2026 odds compliance, weighted RNG, unbox animations',
          icon: <Gift className="h-4 w-4 text-muted-foreground" />,
        },
        {
          title: 'In-Game Currency Shop',
          description: 'Coin/Gem purchases, tiered gamepass perks',
          icon: <ShoppingBag className="h-4 w-4 text-muted-foreground" />,
        },
        {
          title: 'FTUE & Onboarding Guide',
          description: 'First 60s guide arrows, stuck detection, skip hints',
          icon: <Compass className="h-4 w-4 text-muted-foreground" />,
        },
      ],
    },
    {
      id: 'world',
      name: 'World & Environment',
      items: [
        {
          title: 'Dungeon & Obby Generation',
          description: 'Procedural checkpoint obby with moving hazards',
          icon: <Mountain className="h-4 w-4 text-muted-foreground" />,
        },
        {
          title: 'Atmosphere & Day/Night Lighting',
          description: 'Atmosphere presets, sun-ray bloom, color correction',
          icon: <SunMedium className="h-4 w-4 text-muted-foreground" />,
        },
        {
          title: 'Sound & Audio Layer Pool',
          description: 'Combat hits, UI clicks, footsteps with spatial roll-off',
          icon: <Footprints className="h-4 w-4 text-muted-foreground" />,
        },
      ],
    },
  ];

  const filteredCategories = categories.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col select-none h-full overflow-hidden shrink-0">
      {/* Header with Search */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center gap-2 px-1">
          <FolderTree className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Block Palette
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search mechanics..."
            className="w-full bg-background border border-border rounded-[10px] pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
          />
        </div>
      </div>

      {/* Collapsible Category List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredCategories.map((category) => {
          const isCollapsed = Boolean(collapsedCategories[category.id]);
          return (
            <div key={category.id} className="space-y-1">
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors duration-140"
              >
                <span className="font-medium text-[11px] uppercase tracking-wider">
                  {category.name}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-140 ${
                    isCollapsed ? '-rotate-90' : 'rotate-0'
                  }`}
                />
              </button>

              {/* Items in Category (Collapsible) */}
              {!isCollapsed && (
                <div className="space-y-0.5 pl-1">
                  {category.items.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onInsertMacroBlock?.(item.title, category.name)}
                      className="w-full flex items-start gap-2.5 p-2 rounded-[10px] hover:bg-secondary border border-transparent hover:border-border text-left transition-colors duration-140 group"
                    >
                      <div className="mt-0.5 shrink-0 text-muted-foreground group-hover:text-foreground">
                        {item.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-foreground truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1 leading-normal">
                          {item.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
