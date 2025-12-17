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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          checksum: string | null
          equipment_id: string | null
          file_size: number | null
          file_type: string | null
          id: string
          is_image: boolean | null
          is_primary: boolean
          label: string | null
          sort_order: number | null
          taken_at: string | null
          uploaded_at: string | null
          url: string
        }
        Insert: {
          checksum?: string | null
          equipment_id?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_image?: boolean | null
          is_primary?: boolean
          label?: string | null
          sort_order?: number | null
          taken_at?: string | null
          uploaded_at?: string | null
          url: string
        }
        Update: {
          checksum?: string | null
          equipment_id?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_image?: boolean | null
          is_primary?: boolean
          label?: string | null
          sort_order?: number | null
          taken_at?: string | null
          uploaded_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_details"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          lat: number
          lng: number
          metadata: Json | null
          metadata_order: string[] | null
          name: string
          summary: string | null
          type_id: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          lat: number
          lng: number
          metadata?: Json | null
          metadata_order?: string[] | null
          name: string
          summary?: string | null
          type_id: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          lat?: number
          lng?: number
          metadata?: Json | null
          metadata_order?: string[] | null
          name?: string
          summary?: string | null
          type_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "equipment_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_logs: {
        Row: {
          created_at: string | null
          equipment_id: string | null
          id: string
          inspector: string | null
          notes: string | null
        }
        Insert: {
          created_at?: string | null
          equipment_id?: string | null
          id?: string
          inspector?: string | null
          notes?: string | null
        }
        Update: {
          created_at?: string | null
          equipment_id?: string | null
          id?: string
          inspector?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_logs_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_logs_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_details"
            referencedColumns: ["id"]
          },
        ]
      }
      line_equipment: {
        Row: {
          equipment_id: string
          line_id: string
        }
        Insert: {
          equipment_id: string
          line_id: string
        }
        Update: {
          equipment_id?: string
          line_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "line_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_equipment_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "lines"
            referencedColumns: ["id"]
          },
        ]
      }
      lines: {
        Row: {
          coordinates: Json
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          name: string
          type_id: number
        }
        Insert: {
          coordinates: Json
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          type_id: number
        }
        Update: {
          coordinates?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          type_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "lines_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      service_logs: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          equipment_id: string
          happened_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          equipment_id: string
          happened_at?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          equipment_id?: string
          happened_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_logs_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_logs_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_details"
            referencedColumns: ["id"]
          },
        ]
      }
      types: {
        Row: {
          color: string | null
          display_name: string
          icon: string | null
          id: number
          name: string
        }
        Insert: {
          color?: string | null
          display_name: string
          icon?: string | null
          id?: number
          name: string
        }
        Update: {
          color?: string | null
          display_name?: string
          icon?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      equipment_details: {
        Row: {
          attachments: Json | null
          created_at: string | null
          description: string | null
          id: string | null
          inspections: Json | null
          lat: number | null
          lines: Json | null
          lng: number | null
          metadata: Json | null
          metadata_order: string[] | null
          name: string | null
          type_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      equipment_delete_metadata_key: {
        Args: { p_equipment_id: string; p_key: string }
        Returns: undefined
      }
      equipment_set_metadata_order: {
        Args: { p_equipment_id: string; p_order: string[] }
        Returns: undefined
      }
      equipment_upsert_metadata: {
        Args: { p_equipment_id: string; p_key: string; p_value: Json }
        Returns: undefined
      }
      import_equipment_geojson: {
        Args: { g: Json }
        Returns: {
          inserted_id: string
        }[]
      }
      import_lines_geojson: {
        Args: { g: Json }
        Returns: {
          inserted_id: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      user_role: "user" | "admin"
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
      user_role: ["user", "admin"],
    },
  },
} as const
