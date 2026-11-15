import * as React from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Gamepad2,
} from 'lucide-react';
import { Project } from '../../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: {
    id?: string;
    name: string;
    genre: string;
    notes: string;
    styleReferenceImage?: string | null;
  }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialProject?: Project | null;
}

const GENRES = [
  'Simulator (Clicker / Pet / Rebirth)',
  'RPG / Adventure & Dungeons',
  'Anime / Battlegrounds Combat',
  'Tycoon & Base Builder',
  'Obby (Obstacle Course)',
  'Survival / Horror',
  'Casual / Party / Mini-games',
  'Strategy / Tower Defense',
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialProject,
}) => {
  const [name, setName] = React.useState('');
  const [genre, setGenre] = React.useState(GENRES[0]);
  const [notes, setNotes] = React.useState('');
  const [styleReferenceImage, setStyleReferenceImage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState(false);

  React.useEffect(() => {
    if (initialProject) {
      setName(initialProject.name);
      setGenre(initialProject.genre);
      setNotes(initialProject.notes);
      setStyleReferenceImage(initialProject.styleReferenceImage || null);
    } else {
      setName('');
      setGenre(GENRES[0]);
      setNotes('');
      setStyleReferenceImage(null);
    }
    setDeleteConfirm(false);
  }, [initialProject, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file (PNG, JPG, WebP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setStyleReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        id: initialProject?.id,
        name: name.trim(),
        genre,
        notes: notes.trim(),
        styleReferenceImage,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialProject) return;
    setIsSubmitting(true);
    try {
      await onDelete?.(initialProject.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-lg rounded-[10px] bg-card border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-secondary/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-secondary text-primary border border-border">
              <Gamepad2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-foreground">
                {initialProject ? 'Edit Project Settings' : 'Create New Game Project'}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Persisted in local database.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-140"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Project Name */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-foreground">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aether Blades, Pet Champions Simulator"
              className="w-full bg-background border border-border rounded-[10px] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
            />
          </div>

          {/* Genre */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-foreground">
              Game Genre / Category
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-background border border-border rounded-[10px] px-3 py-2 text-xs text-foreground focus:outline-none focus:border-ring"
            >
              {GENRES.map((g) => (
                <option key={g} value={g} className="bg-card text-foreground">
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Style Reference Image */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-primary" />
                <span>Style Reference Image</span>
              </label>
              <span className="text-[11px] text-muted-foreground">1 per project</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Visual anchor for color palette and thumbnail styling.
            </p>

            {styleReferenceImage ? (
              <div className="relative rounded-[10px] overflow-hidden border border-border bg-background group h-36">
                <img
                  src={styleReferenceImage}
                  alt="Style Reference"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <label className="px-3 py-1.5 rounded-md bg-secondary text-foreground text-xs font-medium cursor-pointer hover:bg-muted border border-border">
                    Replace
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setStyleReferenceImage(null)}
                    className="px-3 py-1.5 rounded-md bg-destructive/20 text-destructive text-xs font-medium hover:bg-destructive/30 border border-destructive/40"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 border border-dashed border-border rounded-[10px] hover:border-primary/50 cursor-pointer bg-background hover:bg-secondary/40 transition-colors duration-140">
                <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                <span className="text-xs font-medium text-foreground">Click to upload reference image</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG, or WebP</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-foreground">
              Gameplay Notes & Mechanics Brief
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe core loop, required features, combat mechanics, and sound/VFX expectations..."
              className="w-full bg-background border border-border rounded-[10px] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring resize-none leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            {initialProject && onDelete ? (
              <div>
                {deleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="px-2.5 py-1.5 rounded-md bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90"
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(false)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-destructive hover:bg-destructive/10 text-xs transition-colors duration-140"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-[10px] text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-140"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-4 py-1.5 rounded-[10px] bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-colors duration-140 disabled:opacity-40 shadow-sm"
              >
                {initialProject ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
