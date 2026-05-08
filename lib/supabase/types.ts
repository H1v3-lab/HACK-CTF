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
          role: "user" | "admin" | "staff";
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
          role?: "user" | "admin" | "staff";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string;
          avatar_url?: string | null;
          bio?: string | null;
          updated_at?: string;
        };
        Relationships: [];
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
          deleted_at: string | null;
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
          deleted_at?: string | null;
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
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "challenges_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          user_id: string;
          team_id: string | null;
          challenge_id: string;
          is_correct: boolean;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          team_id?: string | null;
          challenge_id: string;
          is_correct: boolean;
          submitted_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      user_solves: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          points_awarded: number;
          solved_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          points_awarded: number;
          solved_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      team_solves: {
        Row: {
          id: string;
          team_id: string;
          challenge_id: string;
          solved_by: string | null;
          points_awarded: number;
          blood_rank: number | null;
          solved_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          challenge_id: string;
          solved_by?: string | null;
          points_awarded: number;
          blood_rank?: number | null;
          solved_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          name: string;
          captain_id: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          captain_id?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          name?: string;
          captain_id?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          team_id: string;
          user_id: string;
          role: "captain" | "member";
          joined_at: string;
        };
        Insert: {
          team_id: string;
          user_id: string;
          role?: "captain" | "member";
          joined_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      team_invites: {
        Row: {
          id: string;
          team_id: string;
          code_hash: string;
          created_by: string | null;
          created_at: string;
          expires_at: string | null;
          used_at: string | null;
          used_by: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          code_hash: string;
          created_by?: string | null;
          expires_at?: string | null;
          used_at?: string | null;
          used_by?: string | null;
        };
        Update: {
          expires_at?: string | null;
          used_at?: string | null;
          used_by?: string | null;
        };
        Relationships: [];
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
        Relationships: [];
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
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: {
      challenges_public: {
        Row: {
          id: string;
          title: string;
          description: string;
          category_id: string | null;
          points: number;
          difficulty: "easy" | "medium" | "hard" | "insane";
          hints: Json;
          files: Json;
          is_active: boolean;
          solves: number;
          author: string | null;
          created_at: string;
          updated_at: string;
        };
        Relationships: [];
      };
      scoreboard_public: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          score: number;
          solves: number;
          last_solve: string | null;
          position: number;
        };
        Relationships: [];
      };
      team_scoreboard_public: {
        Row: {
          id: string;
          name: string;
          score: number;
          solves: number;
          last_solve: string | null;
          position: number;
        };
        Relationships: [];
      };
      user_solves_view: {
        Row: {
          user_id: string;
          challenge_id: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      verify_flag: {
        Args: { submitted_flag: string; stored_hash: string };
        Returns: boolean;
      };
      compute_team_points: {
        Args: { p_challenge_id: string };
        Returns: { points: number; blood_rank: number }[];
      };
      submit_flag: {
        Args: { challenge_id: string; submitted_flag: string };
        Returns: { correct: boolean; already_solved: boolean; team_points_awarded: number | null }[];
      };
    };
  };
}
