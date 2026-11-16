/**
 * Database types for Ellixorrr Supabase schema.
 *
 * These types are generated from the SQL migrations in
 * supabase/migrations/. They describe the shape of every table,
 * relationship, and enum used by the application.
 *
 * IMPORTANT: These are hand-written to match the migrations exactly.
 * If you change a migration, update these types to match before running
 * TypeScript checks.
 */

export type Role = "customer" | "admin";

export type ProjectStatus =
  | "enquiry"
  | "planning"
  | "in_progress"
  | "review"
  | "completed"
  | "on_hold";

export type EnquiryStatus = "new" | "reviewing" | "contacted" | "converted" | "closed";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: Role;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: Role;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: Role;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          customer_id: string;
          project_name: string;
          service_type: string;
          description: string | null;
          status: ProjectStatus;
          start_date: string | null;
          expected_completion_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          project_name: string;
          service_type: string;
          description?: string | null;
          status?: ProjectStatus;
          start_date?: string | null;
          expected_completion_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          project_name?: string;
          service_type?: string;
          description?: string | null;
          status?: ProjectStatus;
          start_date?: string | null;
          expected_completion_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_updates: {
        Row: {
          id: string;
          project_id: string;
          author_id: string;
          title: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          author_id: string;
          title: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          author_id?: string;
          title?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      enquiries: {
        Row: {
          id: string;
          customer_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          business_name: string | null;
          service_type: string;
          project_description: string;
          status: EnquiryStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          business_name?: string | null;
          service_type: string;
          project_description: string;
          status?: EnquiryStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          name?: string;
          email?: string | null;
          phone?: string | null;
          business_name?: string | null;
          service_type?: string;
          project_description?: string | null;
          status?: EnquiryStatus;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T];

export type TableRow<T extends keyof Database["public"]["Tables"]> =
  Tables<T>["Row"];

export type TableInsert<T extends keyof Database["public"]["Tables"]> =
  Tables<T>["Insert"];

export type TableUpdate<T extends keyof Database["public"]["Tables"]> =
  Tables<T>["Update"];
