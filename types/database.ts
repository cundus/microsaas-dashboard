export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      admin_assignments: {
        Row: {
          admin_id: string;
          created_at: string;
          microsaas_id: string;
        };
        Insert: {
          admin_id: string;
          created_at?: string;
          microsaas_id: string;
        };
        Update: {
          admin_id?: string;
          created_at?: string;
          microsaas_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_assignments_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admin_assignments_microsaas_id_fkey";
            columns: ["microsaas_id"];
            isOneToOne: false;
            referencedRelation: "microsaas";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_roles: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          role_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          is_active?: boolean;
          name: string;
          role_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          role_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_users_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "admin_roles";
            referencedColumns: ["id"];
          },
        ];
      };
      alert_logs: {
        Row: {
          id: string;
          message: string;
          microsaas_id: string;
          rule_id: string;
          sent_at: string | null;
          status: string;
          triggered_at: string;
          value: number;
        };
        Insert: {
          id?: string;
          message: string;
          microsaas_id: string;
          rule_id: string;
          sent_at?: string | null;
          status: string;
          triggered_at?: string;
          value: number;
        };
        Update: {
          id?: string;
          message?: string;
          microsaas_id?: string;
          rule_id?: string;
          sent_at?: string | null;
          status?: string;
          triggered_at?: string;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "alert_logs_microsaas_id_fkey";
            columns: ["microsaas_id"];
            isOneToOne: false;
            referencedRelation: "microsaas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alert_logs_rule_id_microsaas_id_fkey";
            columns: ["rule_id", "microsaas_id"];
            isOneToOne: false;
            referencedRelation: "alert_rules";
            referencedColumns: ["id", "microsaas_id"];
          },
        ];
      };
      alert_rules: {
        Row: {
          channel: string;
          created_at: string;
          id: string;
          is_active: boolean;
          metric: string;
          microsaas_id: string;
          name: string;
          operator: string;
          threshold: number;
          updated_at: string;
        };
        Insert: {
          channel: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          metric: string;
          microsaas_id: string;
          name: string;
          operator: string;
          threshold: number;
          updated_at?: string;
        };
        Update: {
          channel?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          metric?: string;
          microsaas_id?: string;
          name?: string;
          operator?: string;
          threshold?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "alert_rules_microsaas_id_fkey";
            columns: ["microsaas_id"];
            isOneToOne: false;
            referencedRelation: "microsaas";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          admin_id: string | null;
          created_at: string;
          event_order: number;
          id: string;
          metadata: Json;
          microsaas_id: string | null;
          resource_id: string;
          resource_type: string;
        };
        Insert: {
          action: string;
          admin_id?: string | null;
          created_at?: string;
          event_order?: never;
          id?: string;
          metadata?: Json;
          microsaas_id?: string | null;
          resource_id: string;
          resource_type: string;
        };
        Update: {
          action?: string;
          admin_id?: string | null;
          created_at?: string;
          event_order?: never;
          id?: string;
          metadata?: Json;
          microsaas_id?: string | null;
          resource_id?: string;
          resource_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_microsaas_id_fkey";
            columns: ["microsaas_id"];
            isOneToOne: false;
            referencedRelation: "microsaas";
            referencedColumns: ["id"];
          },
        ];
      };
      budgeting_asset_transactions: {
        Row: {
          amount: number;
          asset_id: string;
          created_at: string;
          description: string;
          id: string;
          movement: Database["public"]["Enums"]["budgeting_asset_movement"];
          signed_amount: number | null;
          transaction_date: string;
          transaction_id: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          asset_id: string;
          created_at?: string;
          description?: string;
          id?: string;
          movement: Database["public"]["Enums"]["budgeting_asset_movement"];
          signed_amount?: number | null;
          transaction_date: string;
          transaction_id?: string | null;
          user_id?: string;
        };
        Update: {
          amount?: number;
          asset_id?: string;
          created_at?: string;
          description?: string;
          id?: string;
          movement?: Database["public"]["Enums"]["budgeting_asset_movement"];
          signed_amount?: number | null;
          transaction_date?: string;
          transaction_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgeting_asset_transactions_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "budgeting_asset_balances";
            referencedColumns: ["asset_id"];
          },
          {
            foreignKeyName: "budgeting_asset_transactions_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "budgeting_assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budgeting_asset_transactions_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: true;
            referencedRelation: "budgeting_transactions";
            referencedColumns: ["id"];
          },
        ];
      };
      budgeting_assets: {
        Row: {
          color: string;
          created_at: string;
          icon: string;
          id: string;
          is_archived: boolean;
          name: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          is_archived?: boolean;
          name: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          is_archived?: boolean;
          name?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      budgeting_categories: {
        Row: {
          color: string;
          created_at: string;
          icon: string;
          id: string;
          is_default: boolean;
          name: string;
          type: Database["public"]["Enums"]["budgeting_activity_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          is_default?: boolean;
          name: string;
          type: Database["public"]["Enums"]["budgeting_activity_type"];
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          is_default?: boolean;
          name?: string;
          type?: Database["public"]["Enums"]["budgeting_activity_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      budgeting_profiles: {
        Row: {
          created_at: string;
          currency: string;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      budgeting_recurring_rules: {
        Row: {
          amount: number;
          asset_id: string | null;
          category_id: string | null;
          created_at: string;
          day_is_last_of_month: boolean;
          day_of_month: number | null;
          days_of_week: number[] | null;
          description: string;
          end_date: string | null;
          frequency: Database["public"]["Enums"]["budgeting_recurrence_frequency"];
          id: string;
          interval_count: number;
          month_of_year: number | null;
          next_occurrence: string | null;
          start_date: string;
          status: Database["public"]["Enums"]["budgeting_recurrence_status"];
          type: Database["public"]["Enums"]["budgeting_activity_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          asset_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          day_is_last_of_month?: boolean;
          day_of_month?: number | null;
          days_of_week?: number[] | null;
          description?: string;
          end_date?: string | null;
          frequency: Database["public"]["Enums"]["budgeting_recurrence_frequency"];
          id?: string;
          interval_count?: number;
          month_of_year?: number | null;
          next_occurrence?: string | null;
          start_date: string;
          status?: Database["public"]["Enums"]["budgeting_recurrence_status"];
          type: Database["public"]["Enums"]["budgeting_activity_type"];
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          amount?: number;
          asset_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          day_is_last_of_month?: boolean;
          day_of_month?: number | null;
          days_of_week?: number[] | null;
          description?: string;
          end_date?: string | null;
          frequency?: Database["public"]["Enums"]["budgeting_recurrence_frequency"];
          id?: string;
          interval_count?: number;
          month_of_year?: number | null;
          next_occurrence?: string | null;
          start_date?: string;
          status?: Database["public"]["Enums"]["budgeting_recurrence_status"];
          type?: Database["public"]["Enums"]["budgeting_activity_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgeting_recurring_rules_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "budgeting_asset_balances";
            referencedColumns: ["asset_id"];
          },
          {
            foreignKeyName: "budgeting_recurring_rules_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "budgeting_assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budgeting_recurring_rules_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "budgeting_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      budgeting_transactions: {
        Row: {
          amount: number;
          asset_id: string | null;
          category_id: string | null;
          created_at: string;
          description: string;
          id: string;
          recurring_rule_id: string | null;
          transaction_date: string;
          type: Database["public"]["Enums"]["budgeting_activity_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          asset_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          recurring_rule_id?: string | null;
          transaction_date: string;
          type: Database["public"]["Enums"]["budgeting_activity_type"];
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          amount?: number;
          asset_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          recurring_rule_id?: string | null;
          transaction_date?: string;
          type?: Database["public"]["Enums"]["budgeting_activity_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgeting_transactions_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "budgeting_asset_balances";
            referencedColumns: ["asset_id"];
          },
          {
            foreignKeyName: "budgeting_transactions_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "budgeting_assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budgeting_transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "budgeting_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budgeting_transactions_recurring_rule_id_fkey";
            columns: ["recurring_rule_id"];
            isOneToOne: false;
            referencedRelation: "budgeting_recurring_rules";
            referencedColumns: ["id"];
          },
        ];
      };
      dashboard_activity: {
        Row: {
          description: string;
          id: number;
          kind: string;
          microsaas_id: string;
          occurred_at: string;
          resource_id: string;
          source_key: string;
        };
        Insert: {
          description: string;
          id?: never;
          kind: string;
          microsaas_id: string;
          occurred_at: string;
          resource_id: string;
          source_key: string;
        };
        Update: {
          description?: string;
          id?: never;
          kind?: string;
          microsaas_id?: string;
          occurred_at?: string;
          resource_id?: string;
          source_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dashboard_activity_microsaas_id_fkey";
            columns: ["microsaas_id"];
            isOneToOne: false;
            referencedRelation: "microsaas";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          due_at: string | null;
          id: string;
          microsaas_id: string;
          number: string;
          paid_at: string | null;
          status: string;
          transaction_id: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency?: string;
          due_at?: string | null;
          id?: string;
          microsaas_id: string;
          number: string;
          paid_at?: string | null;
          status: string;
          transaction_id?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          due_at?: string | null;
          id?: string;
          microsaas_id?: string;
          number?: string;
          paid_at?: string | null;
          status?: string;
          transaction_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_microsaas_id_fkey";
            columns: ["microsaas_id"];
            isOneToOne: false;
            referencedRelation: "microsaas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_transaction_id_microsaas_id_user_id_fkey";
            columns: ["transaction_id", "microsaas_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id", "microsaas_id", "user_id"];
          },
          {
            foreignKeyName: "invoices_user_id_microsaas_id_fkey";
            columns: ["user_id", "microsaas_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id", "microsaas_id"];
          },
        ];
      };
      labels: {
        Row: {
          color: string;
          created_at: string;
          id: string;
          name: string;
          project_id: string;
        };
        Insert: {
          color: string;
          created_at?: string;
          id?: string;
          name: string;
          project_id: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          id?: string;
          name?: string;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "labels_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      lists: {
        Row: {
          id: string;
          name: string;
          position: number;
          project_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          position?: number;
          project_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          position?: number;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lists_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      mcp_tokens: {
        Row: {
          created_at: string;
          id: string;
          last_used_at: string | null;
          name: string;
          token_hash: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_used_at?: string | null;
          name: string;
          token_hash: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_used_at?: string | null;
          name?: string;
          token_hash?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      microsaas: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          slug: string;
          status: string;
          updated_at: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          slug: string;
          status?: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          slug?: string;
          status?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [];
      };
      microsaas_config: {
        Row: {
          api_key_mask: string | null;
          environment: string;
          maintenance_mode: boolean;
          microsaas_id: string;
          updated_at: string;
          webhook_url: string | null;
        };
        Insert: {
          api_key_mask?: string | null;
          environment?: string;
          maintenance_mode?: boolean;
          microsaas_id: string;
          updated_at?: string;
          webhook_url?: string | null;
        };
        Update: {
          api_key_mask?: string | null;
          environment?: string;
          maintenance_mode?: boolean;
          microsaas_id?: string;
          updated_at?: string;
          webhook_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "microsaas_config_microsaas_id_fkey";
            columns: ["microsaas_id"];
            isOneToOne: true;
            referencedRelation: "microsaas";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_gateways: {
        Row: {
          created_at: string;
          environment: string;
          id: string;
          is_active: boolean;
          microsaas_id: string;
          name: string;
          provider: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          environment?: string;
          id?: string;
          is_active?: boolean;
          microsaas_id: string;
          name: string;
          provider: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          environment?: string;
          id?: string;
          is_active?: boolean;
          microsaas_id?: string;
          name?: string;
          provider?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_gateways_microsaas_id_fkey";
            columns: ["microsaas_id"];
            isOneToOne: false;
            referencedRelation: "microsaas";
            referencedColumns: ["id"];
          },
        ];
      };
      performance_metrics: {
        Row: {
          active_users: number;
          endpoint: string;
          error_count: number;
          id: string;
          microsaas_id: string;
          recorded_at: string;
          request_count: number;
          response_time_p50_ms: number | null;
          response_time_p90_ms: number | null;
          response_time_p99_ms: number | null;
          uptime_percent: number;
        };
        Insert: {
          active_users?: number;
          endpoint?: string;
          error_count?: number;
          id?: string;
          microsaas_id: string;
          recorded_at?: string;
          request_count?: number;
          response_time_p50_ms?: number | null;
          response_time_p90_ms?: number | null;
          response_time_p99_ms?: number | null;
          uptime_percent: number;
        };
        Update: {
          active_users?: number;
          endpoint?: string;
          error_count?: number;
          id?: string;
          microsaas_id?: string;
          recorded_at?: string;
          request_count?: number;
          response_time_p50_ms?: number | null;
          response_time_p90_ms?: number | null;
          response_time_p99_ms?: number | null;
          uptime_percent?: number;
        };
        Relationships: [
          {
            foreignKeyName: "performance_metrics_microsaas_id_fkey";
            columns: ["microsaas_id"];
            isOneToOne: false;
            referencedRelation: "microsaas";
            referencedColumns: ["id"];
          },
        ];
      };
      plan_microsaas: {
        Row: {
          microsaas_id: string;
          plan_id: string;
        };
        Insert: {
          microsaas_id: string;
          plan_id: string;
        };
        Update: {
          microsaas_id?: string;
          plan_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "plan_microsaas_microsaas_id_fkey";
            columns: ["microsaas_id"];
            isOneToOne: false;
            referencedRelation: "microsaas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plan_microsaas_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
      plans: {
        Row: {
          created_at: string;
          currency: string;
          features: Json;
          id: string;
          interval: string;
          name: string;
          price: number;
          status: string;
          trial_days: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          features?: Json;
          id?: string;
          interval: string;
          name: string;
          price: number;
          status?: string;
          trial_days?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          features?: Json;
          id?: string;
          interval?: string;
          name?: string;
          price?: number;
          status?: string;
          trial_days?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          email: string;
          full_name: string | null;
          id: string;
        };
        Insert: {
          avatar_url?: string | null;
          email: string;
          full_name?: string | null;
          id: string;
        };
        Update: {
          avatar_url?: string | null;
          email?: string;
          full_name?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      project_members: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          id: string;
          invited_email: string;
          project_id: string;
          role: string;
          status: string;
          user_id: string | null;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string;
          id?: string;
          invited_email: string;
          project_id: string;
          role?: string;
          status?: string;
          user_id?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string;
          id?: string;
          invited_email?: string;
          project_id?: string;
          role?: string;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          owner_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          owner_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          owner_id?: string;
        };
        Relationships: [];
      };
      promo_codes: {
        Row: {
          code: string;
          created_at: string;
          currency: string | null;
          discount_type: string;
          discount_value: number;
          expires_at: string | null;
          id: string;
          is_active: boolean;
          microsaas_id: string;
          starts_at: string;
          updated_at: string;
          usage_count: number;
          usage_limit: number | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          currency?: string | null;
          discount_type: string;
          discount_value: number;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          microsaas_id: string;
          starts_at?: string;
          updated_at?: string;
          usage_count?: number;
          usage_limit?: number | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          currency?: string | null;
          discount_type?: string;
          discount_value?: number;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          microsaas_id?: string;
          starts_at?: string;
          updated_at?: string;
          usage_count?: number;
          usage_limit?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "promo_codes_microsaas_id_fkey";
            columns: ["microsaas_id"];
            isOneToOne: false;
            referencedRelation: "microsaas";
            referencedColumns: ["id"];
          },
        ];
      };
      schema_migrations: {
        Row: {
          applied_at: string;
          baseline: boolean;
          filename: string;
        };
        Insert: {
          applied_at?: string;
          baseline?: boolean;
          filename: string;
        };
        Update: {
          applied_at?: string;
          baseline?: boolean;
          filename?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          billing_interval: string;
          canceled_at: string | null;
          created_at: string;
          currency: string;
          current_period_end: string;
          current_period_start: string;
          external_id: string | null;
          id: string;
          microsaas_id: string;
          payment_method: string | null;
          plan_id: string;
          price: number;
          status: string;
          trial_ends_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          billing_interval: string;
          canceled_at?: string | null;
          created_at?: string;
          currency?: string;
          current_period_end: string;
          current_period_start: string;
          external_id?: string | null;
          id?: string;
          microsaas_id: string;
          payment_method?: string | null;
          plan_id: string;
          price: number;
          status: string;
          trial_ends_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          billing_interval?: string;
          canceled_at?: string | null;
          created_at?: string;
          currency?: string;
          current_period_end?: string;
          current_period_start?: string;
          external_id?: string | null;
          id?: string;
          microsaas_id?: string;
          payment_method?: string | null;
          plan_id?: string;
          price?: number;
          status?: string;
          trial_ends_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_microsaas_id_fkey";
            columns: ["microsaas_id"];
            isOneToOne: false;
            referencedRelation: "microsaas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_plan_id_microsaas_id_fkey";
            columns: ["plan_id", "microsaas_id"];
            isOneToOne: false;
            referencedRelation: "plan_microsaas";
            referencedColumns: ["plan_id", "microsaas_id"];
          },
          {
            foreignKeyName: "subscriptions_user_id_microsaas_id_fkey";
            columns: ["user_id", "microsaas_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id", "microsaas_id"];
          },
        ];
      };
      task_assignees: {
        Row: {
          assigned_at: string;
          task_id: string;
          user_id: string;
        };
        Insert: {
          assigned_at?: string;
          task_id: string;
          user_id: string;
        };
        Update: {
          assigned_at?: string;
          task_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_assignees_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_assignees_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      task_images: {
        Row: {
          created_at: string;
          created_by: string;
          height: number | null;
          id: string;
          mime_type: string;
          project_id: string;
          size_bytes: number;
          storage_path: string;
          task_id: string;
          width: number | null;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          height?: number | null;
          id?: string;
          mime_type: string;
          project_id: string;
          size_bytes?: number;
          storage_path: string;
          task_id: string;
          width?: number | null;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          height?: number | null;
          id?: string;
          mime_type?: string;
          project_id?: string;
          size_bytes?: number;
          storage_path?: string;
          task_id?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "task_images_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_images_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      task_labels: {
        Row: {
          label_id: string;
          task_id: string;
        };
        Insert: {
          label_id: string;
          task_id: string;
        };
        Update: {
          label_id?: string;
          task_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_labels_label_id_fkey";
            columns: ["label_id"];
            isOneToOne: false;
            referencedRelation: "labels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_labels_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          archived_at: string | null;
          created_by: string;
          description_md: string | null;
          due_date: string | null;
          id: string;
          list_id: string;
          position: number;
          project_id: string;
          serial_number: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          created_by: string;
          description_md?: string | null;
          due_date?: string | null;
          id?: string;
          list_id: string;
          position?: number;
          project_id: string;
          serial_number: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          created_by?: string;
          description_md?: string | null;
          due_date?: string | null;
          id?: string;
          list_id?: string;
          position?: number;
          project_id?: string;
          serial_number?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_list_id_fkey";
            columns: ["list_id"];
            isOneToOne: false;
            referencedRelation: "lists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          external_id: string | null;
          gateway_id: string | null;
          id: string;
          microsaas_id: string;
          paid_at: string | null;
          payment_method: string | null;
          status: string;
          subscription_id: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency?: string;
          external_id?: string | null;
          gateway_id?: string | null;
          id?: string;
          microsaas_id: string;
          paid_at?: string | null;
          payment_method?: string | null;
          status: string;
          subscription_id?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          external_id?: string | null;
          gateway_id?: string | null;
          id?: string;
          microsaas_id?: string;
          paid_at?: string | null;
          payment_method?: string | null;
          status?: string;
          subscription_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_gateway_id_microsaas_id_fkey";
            columns: ["gateway_id", "microsaas_id"];
            isOneToOne: false;
            referencedRelation: "payment_gateways";
            referencedColumns: ["id", "microsaas_id"];
          },
          {
            foreignKeyName: "transactions_microsaas_id_fkey";
            columns: ["microsaas_id"];
            isOneToOne: false;
            referencedRelation: "microsaas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_subscription_id_microsaas_id_user_id_fkey";
            columns: ["subscription_id", "microsaas_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id", "microsaas_id", "user_id"];
          },
          {
            foreignKeyName: "transactions_user_id_microsaas_id_fkey";
            columns: ["user_id", "microsaas_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id", "microsaas_id"];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          deleted_at: string | null;
          email: string;
          external_id: string;
          id: string;
          last_login_at: string | null;
          microsaas_id: string;
          name: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email: string;
          external_id: string;
          id?: string;
          last_login_at?: string | null;
          microsaas_id: string;
          name: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email?: string;
          external_id?: string;
          id?: string;
          last_login_at?: string | null;
          microsaas_id?: string;
          name?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_microsaas_id_fkey";
            columns: ["microsaas_id"];
            isOneToOne: false;
            referencedRelation: "microsaas";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      budgeting_asset_balances: {
        Row: {
          asset_id: string | null;
          color: string | null;
          current_value: number | null;
          icon: string | null;
          is_archived: boolean | null;
          last_movement_date: string | null;
          name: string | null;
          total_added: number | null;
          total_adjusted: number | null;
          total_withdrawn: number | null;
          type: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      claim_pending_invites: { Args: never; Returns: number };
      delete_microsaas: {
        Args: { p_confirmation: string; p_id: string };
        Returns: undefined;
      };
      get_global_kpis: {
        Args: never;
        Returns: {
          currency: string;
          metric: string;
          previous: number;
          value: number;
        }[];
      };
      get_microsaas_list: {
        Args: { p_slug?: string };
        Returns: {
          checked_at: string;
          currency: string;
          description: string;
          id: string;
          latest_uptime_percent: number;
          logo_url: string;
          mrr: number;
          name: string;
          slug: string;
          status: string;
          uptime_percent: number;
          user_count: number;
        }[];
      };
      get_recent_activity: {
        Args: { p_limit?: number };
        Returns: {
          description: string;
          id: number;
          kind: string;
          microsaas_id: string;
          occurred_at: string;
          product_name: string;
          product_slug: string;
          resource_id: string;
        }[];
      };
      get_revenue_time_series: {
        Args: { p_end: string; p_start: string };
        Returns: {
          currency: string;
          day: string;
          microsaas_id: string;
          mrr: number;
          name: string;
        }[];
      };
      get_user_growth_time_series: {
        Args: { p_end: string; p_interval?: string; p_start: string };
        Returns: {
          new_users: number;
          period_end: string;
          period_start: string;
        }[];
      };
      get_users: {
        Args: {
          p_direction?: string;
          p_joined_from?: string;
          p_joined_to?: string;
          p_microsaas?: string;
          p_page?: number;
          p_plan?: string;
          p_search?: string;
          p_size?: number;
          p_sort?: string;
          p_status?: string;
        };
        Returns: {
          current_page: number;
          rows: Json;
          total: number;
        }[];
      };
      is_project_member: { Args: { p_project: string }; Returns: boolean };
      is_project_member_for_user: {
        Args: { p_project_id: string; p_user_id: string };
        Returns: boolean;
      };
      is_project_owner: { Args: { p_project: string }; Returns: boolean };
      save_microsaas_config: {
        Args: {
          p_ciphertext?: string;
          p_environment: string;
          p_id: string;
          p_mask?: string;
          p_webhook: string;
        };
        Returns: undefined;
      };
      set_microsaas_maintenance: {
        Args: { p_confirmation: string; p_enabled: boolean; p_id: string };
        Returns: undefined;
      };
      shares_project_with: { Args: { p_user: string }; Returns: boolean };
    };
    Enums: {
      budgeting_activity_type: "income" | "expense" | "asset";
      budgeting_asset_movement: "deposit" | "withdrawal" | "adjustment";
      budgeting_recurrence_frequency: "daily" | "weekly" | "monthly" | "yearly";
      budgeting_recurrence_status: "active" | "paused" | "ended";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      budgeting_activity_type: ["income", "expense", "asset"],
      budgeting_asset_movement: ["deposit", "withdrawal", "adjustment"],
      budgeting_recurrence_frequency: ["daily", "weekly", "monthly", "yearly"],
      budgeting_recurrence_status: ["active", "paused", "ended"],
    },
  },
} as const;
