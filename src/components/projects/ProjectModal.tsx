import React, { useState, useEffect } from 'react';
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
  const [name, setName] = useState('');
  const [genre, setGenre] = useState(GENRES[0]);
  const [notes, setNotes] = useState('');
  const [styleReferenceImage, setStyleReferenceImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-lg rounded-2xl bg-[#0f111a] border border-white/15 shadow-2xl shadow-indigo-500/10 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {initialProject ? 'Edit Project Settings' : 'Create New Game Project'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Saved directly to local SQLite database.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Project / Game Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Blade Legends Simulator, Dungeon Slayer Obby"
              className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-400 transition-colors"
            />
          </div>

          {/* Genre */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Game Genre / Category
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-400"
            >
              {GENRES.map((g) => (
                <option key={g} value={g} className="bg-[#121420] text-zinc-200">
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Style Reference Image */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-300 flex items-center space-x-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Style Reference Image (Visual Anchor)</span>
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">1 per project</span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-2">
              Used as visual anchor for UI frames, thumbnail generation, color palette, and asset styling.
            </p>

            {styleReferenceImage ? (
              <div className="relative rounded-lg overflow-hidden border border-white/20 bg-black/40 group h-36">
                <img
                  src={styleReferenceImage}
                  alt="Style Reference"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                  <label className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-medium cursor-pointer hover:bg-indigo-500">
                    Replace Image
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
                    className="p-1.5 rounded-md bg-rose-600/80 text-white hover:bg-rose-500"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-white/15 hover:border-indigo-400/50 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <Upload className="w-6 h-6 text-zinc-400 mb-2" />
                <span className="text-xs font-medium text-zinc-200">
                  Click or drag image to upload reference style
                </span>
                <span className="text-[10px] text-zinc-500 mt-1">
                  PNG, JPG, WebP supported
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Design Notes & Gameplay brief */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Gameplay Brief & Mechanics Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Core loop: players click swords to earn Power, sell for Coins, open pet eggs, unlock floating islands, and fight bosses in the arena..."
              className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-400 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            {initialProject && onDelete ? (
              deleteConfirm ? (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-rose-400">Confirm delete?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-2.5 py-1 rounded bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(false)}
                    className="px-2 py-1 rounded bg-white/10 text-zinc-300 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(true)}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Project</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : initialProject ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
