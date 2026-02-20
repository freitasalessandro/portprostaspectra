export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      communication_history: {
        Row: {
          created_at: string
          destination_number: string
          error_details: string | null
          event: string
          id: string
          message_sent: string
          proposal_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          destination_number: string
          error_details?: string | null
          event: string
          id?: string
          message_sent: string
          proposal_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          destination_number?: string
          error_details?: string | null
          event?: string
          id?: string
          message_sent?: string
          proposal_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_history_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_history_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "public_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_templates: {
        Row: {
          channel: string
          created_at: string
          id: string
          message: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          message: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          message?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      communication_triggers: {
        Row: {
          active: boolean
          created_at: string
          event: string
          id: string
          recipient: string
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          event: string
          id?: string
          recipient?: string
          template_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          event?: string
          id?: string
          recipient?: string
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_triggers_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "communication_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string | null
          ai_provider: string
          anthropic_api_key: string | null
          bdi_admin: number
          bdi_profit: number
          bdi_risk: number
          bdi_tax: number
          city: string | null
          cnpj: string | null
          company_name: string
          created_at: string
          email: string | null
          evolution_api_instance: string | null
          evolution_api_token: string | null
          evolution_api_url: string | null
          id: string
          logo_url: string | null
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
          website: string | null
          whatsapp: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          ai_provider?: string
          anthropic_api_key?: string | null
          bdi_admin?: number
          bdi_profit?: number
          bdi_risk?: number
          bdi_tax?: number
          city?: string | null
          cnpj?: string | null
          company_name?: string
          created_at?: string
          email?: string | null
          evolution_api_instance?: string | null
          evolution_api_token?: string | null
          evolution_api_url?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          ai_provider?: string
          anthropic_api_key?: string | null
          bdi_admin?: number
          bdi_profit?: number
          bdi_risk?: number
          bdi_tax?: number
          city?: string | null
          cnpj?: string | null
          company_name?: string
          created_at?: string
          email?: string | null
          evolution_api_instance?: string | null
          evolution_api_token?: string | null
          evolution_api_url?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      contract_signatures: {
        Row: {
          contract_id: string
          created_at: string
          document_path: string
          id: string
          ip_address: string
          selfie_path: string
          signature_hash: string
          signed_at: string
          signer_name: string
          user_agent: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          document_path: string
          id?: string
          ip_address: string
          selfie_path: string
          signature_hash: string
          signed_at?: string
          signer_name: string
          user_agent: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          document_path?: string
          id?: string
          ip_address?: string
          selfie_path?: string
          signature_hash?: string
          signed_at?: string
          signer_name?: string
          user_agent?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_signatures_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_signatures_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "public_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          access_code: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          content: Json
          created_at: string
          id: string
          proposal_id: string | null
          slug: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          access_code?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          content?: Json
          created_at?: string
          id?: string
          proposal_id?: string | null
          slug?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          access_code?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          content?: Json
          created_at?: string
          id?: string
          proposal_id?: string | null
          slug?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "public_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_plans: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          installments: Json
          is_default: boolean
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          installments?: Json
          is_default?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          installments?: Json
          is_default?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proposal_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          payment_terms: string | null
          payment_type: string
          proposal_id: string
          quantity: number
          service_name: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          payment_terms?: string | null
          payment_type?: string
          proposal_id: string
          quantity?: number
          service_name: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          payment_terms?: string | null
          payment_type?: string
          proposal_id?: string
          quantity?: number
          service_name?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "public_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_sections: {
        Row: {
          content: Json
          created_at: string
          id: string
          proposal_id: string
          section_key: string
          sort_order: number
          title: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          proposal_id: string
          section_key: string
          sort_order?: number
          title: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          proposal_id?: string
          section_key?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_sections_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_sections_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "public_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_signatures: {
        Row: {
          contract_data: Json | null
          created_at: string
          id: string
          ip_address: string
          proposal_id: string
          signature_hash: string
          signed_at: string
          signer_name: string
          user_agent: string
        }
        Insert: {
          contract_data?: Json | null
          created_at?: string
          id?: string
          ip_address: string
          proposal_id: string
          signature_hash: string
          signed_at?: string
          signer_name: string
          user_agent: string
        }
        Update: {
          contract_data?: Json | null
          created_at?: string
          id?: string
          ip_address?: string
          proposal_id?: string
          signature_hash?: string
          signed_at?: string
          signer_name?: string
          user_agent?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_signatures_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_signatures_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "public_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_social_proof: {
        Row: {
          case_category: string
          case_description: string
          case_link: string | null
          case_metric: string | null
          case_metric_label: string | null
          case_title: string
          created_at: string
          id: string
          proposal_id: string
          sort_order: number
        }
        Insert: {
          case_category: string
          case_description: string
          case_link?: string | null
          case_metric?: string | null
          case_metric_label?: string | null
          case_title: string
          created_at?: string
          id?: string
          proposal_id: string
          sort_order?: number
        }
        Update: {
          case_category?: string
          case_description?: string
          case_link?: string | null
          case_metric?: string | null
          case_metric_label?: string | null
          case_title?: string
          created_at?: string
          id?: string
          proposal_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_social_proof_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_social_proof_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "public_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_views: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          proposal_id: string
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          proposal_id: string
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          proposal_id?: string
          user_agent?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_views_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_views_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "public_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          accepted_at: string | null
          accepted_by_email: string | null
          accepted_by_name: string | null
          access_code: string
          bdi_factor: number | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          description: string | null
          id: string
          notes: string | null
          project_title: string
          recurring_total: number
          setup_total: number
          slug: string | null
          status: string
          total_value: number
          type: string
          updated_at: string
          user_id: string
          valid_until: string | null
          whatsapp_number: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_email?: string | null
          accepted_by_name?: string | null
          access_code?: string
          bdi_factor?: number | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          project_title: string
          recurring_total?: number
          setup_total?: number
          slug?: string | null
          status?: string
          total_value?: number
          type?: string
          updated_at?: string
          user_id: string
          valid_until?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by_email?: string | null
          accepted_by_name?: string | null
          access_code?: string
          bdi_factor?: number | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          project_title?: string
          recurring_total?: number
          setup_total?: number
          slug?: string | null
          status?: string
          total_value?: number
          type?: string
          updated_at?: string
          user_id?: string
          valid_until?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_files: {
        Row: {
          created_at: string
          file_path: string
          file_type: string
          id: string
          service_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          file_path: string
          file_type?: string
          id?: string
          service_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          file_path?: string
          file_type?: string
          id?: string
          service_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_files_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          is_case: boolean
          link: string | null
          metric: string | null
          metric_label: string | null
          section: string
          sort_order: number
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_case?: boolean
          link?: string | null
          metric?: string | null
          metric_label?: string | null
          section?: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_case?: boolean
          link?: string | null
          metric?: string | null
          metric_label?: string | null
          section?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_contracts: {
        Row: {
          access_code: string | null
          client_name: string | null
          content: Json | null
          created_at: string | null
          id: string | null
          slug: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          access_code?: string | null
          client_name?: string | null
          content?: Json | null
          created_at?: string | null
          id?: string | null
          slug?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          access_code?: string | null
          client_name?: string | null
          content?: Json | null
          created_at?: string | null
          id?: string | null
          slug?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      public_proposals: {
        Row: {
          accepted_at: string | null
          accepted_by_name: string | null
          access_code: string | null
          bdi_factor: number | null
          client_name: string | null
          created_at: string | null
          description: string | null
          id: string | null
          notes: string | null
          project_title: string | null
          recurring_total: number | null
          setup_total: number | null
          slug: string | null
          status: string | null
          total_value: number | null
          type: string | null
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_name?: string | null
          access_code?: string | null
          bdi_factor?: number | null
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          notes?: string | null
          project_title?: string | null
          recurring_total?: number | null
          setup_total?: number | null
          slug?: string | null
          status?: string | null
          total_value?: number | null
          type?: string | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by_name?: string | null
          access_code?: string | null
          bdi_factor?: number | null
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          notes?: string | null
          project_title?: string | null
          recurring_total?: number | null
          setup_total?: number | null
          slug?: string | null
          status?: string | null
          total_value?: number | null
          type?: string | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_proposal: {
        Args: {
          _accepted_by_email: string
          _accepted_by_name: string
          _proposal_id: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "viewer"],
    },
  },
} as const
