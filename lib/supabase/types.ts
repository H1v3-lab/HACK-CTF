export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          score: number;
          rank: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          bio?: string | null;
          score?: number;
          rank?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string;
          avatar_url?: string | null;
          bio?: string | null;
          score?: number;
          rank?: number | null;
          updated_at?: string;
        };
      };
      challenges: {
        Row: {
          id: string;
          title: string;
          description: string;
          category_id: string | null;
          points: number;
          difficulty: "easy" | "medium" | "hard" | "insane";
          flag_hash: string;
          hints: Json;
          files: Json;
          is_active: boolean;
          solves: number;
          author: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category_id?: string | null;
          points?: number;
          difficulty?: "easy" | "medium" | "hard" | "insane";
          flag_hash: string;
          hints?: Json;
          files?: Json;
          is_active?: boolean;
          solves?: number;
          author?: string | null;
        };
        Update: {
          title?: string;
          description?: string;
          points?: number;
          difficulty?: "easy" | "medium" | "hard" | "insane";
          flag_hash?: string;
          hints?: Json;
          files?: Json;
          is_active?: boolean;
          solves?: number;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          color: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
        };
        Update: {
          name?: string;
          color?: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          flag: string;
          is_correct: boolean;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          flag: string;
          is_correct: boolean;
          submitted_at?: string;
        };
        Update: never;
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          color: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          color?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          icon?: string | null;
          color?: string;
        };
      };
      user_badges: {
        Row: {
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          user_id: string;
          badge_id: string;
          earned_at?: string;
        };
        Update: never;
      };
    };
    Views: {
      scoreboard: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          score: number;
          solves: number;
          last_solve: string | null;
          position: number;
        };
      };
      user_solves: {
        Row: {
          user_id: string;
          challenge_id: string;
        };
      };
    };
  };
}
