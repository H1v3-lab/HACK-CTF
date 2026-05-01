/**
 * Shared domain types used across the app.
 */

export interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  difficulty: "easy" | "medium" | "hard" | "insane";
  solves: number;
  author: string | null;
  hints?: unknown;
  files?: unknown;
  categories?: { name: string; color: string } | null;
}
