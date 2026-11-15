/**
 * LihForge Knowledge Vault Module
 *
 * Prepared for Phase 3:
 * Direct local search index (BM25 / SQLite FTS5) over LihFolk Vault V2 (~1,300 notes,
 * INDEX_SLIM.md, SYMPTOMS.md, TL;DR blocks, and checklists).
 */

export interface VaultNoteMatch {
  title: string;
  path: string;
  tags: string[];
  score: number;
  tldr: string[];
  mistakesSnippet?: string;
  checklistSnippet?: string;
}

export interface VaultConfig {
  vaultPath: string; // Defaults to embedded or user-specified path
  loaded: boolean;
  totalNotes: number;
}
