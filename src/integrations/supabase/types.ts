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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          audience: string
          body: string
          created_at: string
          created_by: string | null
          id: string
          pinned: boolean
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          pinned?: boolean
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          pinned?: boolean
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          author: string | null
          category: string
          content: string | null
          created_at: string
          created_by: string | null
          description: string | null
          featured: boolean
          id: string
          published: boolean
          thumbnail: string | null
          title: string
          type: string
          updated_at: string
          video_url: string | null
          views: number
        }
        Insert: {
          author?: string | null
          category: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          featured?: boolean
          id?: string
          published?: boolean
          thumbnail?: string | null
          title: string
          type?: string
          updated_at?: string
          video_url?: string | null
          views?: number
        }
        Update: {
          author?: string | null
          category?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          featured?: boolean
          id?: string
          published?: boolean
          thumbnail?: string | null
          title?: string
          type?: string
          updated_at?: string
          video_url?: string | null
          views?: number
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category: string | null
          comment: string | null
          created_at: string
          id: string
          rating: number
          user_id: string | null
        }
        Insert: {
          category?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          user_id?: string | null
        }
        Update: {
          category?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          user_id?: string | null
        }
        Relationships: []
      }
      gadgets: {
        Row: {
          brand: string | null
          cash_value: number
          category: string
          condition: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          model: string | null
          name: string
          points_value: number
          status: string
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          brand?: string | null
          cash_value?: number
          category: string
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          model?: string | null
          name: string
          points_value?: number
          status?: string
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          brand?: string | null
          cash_value?: number
          category?: string
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          model?: string | null
          name?: string
          points_value?: number
          status?: string
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          id: string
          item_id: string | null
          payment_method: string
          quantity: number
          shipping_address: string | null
          status: string
          total_amount: number
          total_points: number
          tracking: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id?: string | null
          payment_method?: string
          quantity?: number
          shipping_address?: string | null
          status?: string
          total_amount?: number
          total_points?: number
          tracking?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string | null
          payment_method?: string
          quantity?: number
          shipping_address?: string | null
          status?: string
          total_amount?: number
          total_points?: number
          tracking?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "swap_items"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          destination: string | null
          id: string
          method: string
          processed_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          destination?: string | null
          id?: string
          method?: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          destination?: string | null
          id?: string
          method?: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          co2_saved: number
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          location: string | null
          phone: string | null
          points: number
          tier: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          co2_saved?: number
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          location?: string | null
          phone?: string | null
          points?: number
          tier?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          co2_saved?: number
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          points?: number
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      redemptions: {
        Row: {
          created_at: string
          id: string
          points_spent: number
          reward_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_spent: number
          reward_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points_spent?: number
          reward_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          points_cost: number
          stock: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          points_cost: number
          stock?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          points_cost?: number
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      swap_items: {
        Row: {
          cash_price: number
          category: string
          condition: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          points_price: number
          status: string
          stock: number
          updated_at: string
        }
        Insert: {
          cash_price?: number
          category: string
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          points_price?: number
          status?: string
          stock?: number
          updated_at?: string
        }
        Update: {
          cash_price?: number
          category?: string
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          points_price?: number
          status?: string
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      swaps: {
        Row: {
          created_at: string
          id: string
          item_id: string | null
          notes: string | null
          offered_gadget_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id?: string | null
          notes?: string | null
          offered_gadget_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string | null
          notes?: string | null
          offered_gadget_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swaps_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "swap_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swaps_offered_gadget_id_fkey"
            columns: ["offered_gadget_id"]
            isOneToOne: false
            referencedRelation: "gadgets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          message: string
          priority: string
          replies: number
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          message: string
          priority?: string
          replies?: number
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          message?: string
          priority?: string
          replies?: number
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          points: number
          reference_id: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
