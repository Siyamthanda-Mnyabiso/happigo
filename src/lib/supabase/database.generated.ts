export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          account_holder: string;
          account_last4: string;
          bank: string;
          provider_recipient_ref: string | null;
          restaurant_id: string;
          updated_at: string;
        };
        Insert: {
          account_holder: string;
          account_last4: string;
          bank: string;
          provider_recipient_ref?: string | null;
          restaurant_id: string;
          updated_at?: string;
        };
        Update: {
          account_holder?: string;
          account_last4?: string;
          bank?: string;
          provider_recipient_ref?: string | null;
          restaurant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bank_accounts_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: true;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
        ];
      };
      branches: {
        Row: {
          accepting_orders: boolean;
          address: string | null;
          created_at: string;
          id: string;
          lat: number | null;
          lng: number | null;
          name: string;
          restaurant_id: string;
        };
        Insert: {
          accepting_orders?: boolean;
          address?: string | null;
          created_at?: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          name: string;
          restaurant_id: string;
        };
        Update: {
          accepting_orders?: boolean;
          address?: string | null;
          created_at?: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          name?: string;
          restaurant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'branches_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
        ];
      };
      customer_addresses: {
        Row: {
          address: string;
          created_at: string;
          id: string;
          label: string;
          user_id: string;
        };
        Insert: {
          address: string;
          created_at?: string;
          id?: string;
          label: string;
          user_id: string;
        };
        Update: {
          address?: string;
          created_at?: string;
          id?: string;
          label?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'customer_addresses_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      delivery_declines: {
        Row: {
          driver_id: string;
          order_id: string;
        };
        Insert: {
          driver_id: string;
          order_id: string;
        };
        Update: {
          driver_id?: string;
          order_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'delivery_declines_driver_id_fkey';
            columns: ['driver_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'delivery_declines_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      driver_profiles: {
        Row: {
          created_at: string;
          is_online: boolean;
          phone: string | null;
          user_id: string;
          vehicle_model: string | null;
          vehicle_plate: string | null;
          vehicle_type: string | null;
        };
        Insert: {
          created_at?: string;
          is_online?: boolean;
          phone?: string | null;
          user_id: string;
          vehicle_model?: string | null;
          vehicle_plate?: string | null;
          vehicle_type?: string | null;
        };
        Update: {
          created_at?: string;
          is_online?: boolean;
          phone?: string | null;
          user_id?: string;
          vehicle_model?: string | null;
          vehicle_plate?: string | null;
          vehicle_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'driver_profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      menu_items: {
        Row: {
          available: boolean;
          branch_id: string;
          category: string;
          description: string | null;
          id: string;
          image_url: string | null;
          name: string;
          popular: boolean;
          price_cents: number;
        };
        Insert: {
          available?: boolean;
          branch_id: string;
          category?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name: string;
          popular?: boolean;
          price_cents: number;
        };
        Update: {
          available?: boolean;
          branch_id?: string;
          category?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          popular?: boolean;
          price_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'menu_items_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          name: string;
          options: string | null;
          order_id: string;
          quantity: number;
          unit_price_cents: number;
        };
        Insert: {
          id?: string;
          name: string;
          options?: string | null;
          order_id: string;
          quantity: number;
          unit_price_cents: number;
        };
        Update: {
          id?: string;
          name?: string;
          options?: string | null;
          order_id?: string;
          quantity?: number;
          unit_price_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          accepted_at: string | null;
          branch_id: string;
          created_at: string;
          customer_id: string | null;
          customer_name: string | null;
          delivered_at: string | null;
          delivery_address: string | null;
          delivery_fee_cents: number;
          delivery_instructions: string | null;
          delivery_lat: number | null;
          delivery_lng: number | null;
          driver_id: string | null;
          driver_pay_cents: number | null;
          food_cents: number;
          id: string;
          note: string | null;
          payment_method: string;
          payment_status: string;
          picked_up_at: string | null;
          prep_minutes: number | null;
          respond_by: string | null;
          status: Database['public']['Enums']['order_status'];
          tip_cents: number;
          total_cents: number | null;
        };
        Insert: {
          accepted_at?: string | null;
          branch_id: string;
          created_at?: string;
          customer_id?: string | null;
          customer_name?: string | null;
          delivered_at?: string | null;
          delivery_address?: string | null;
          delivery_fee_cents: number;
          delivery_instructions?: string | null;
          delivery_lat?: number | null;
          delivery_lng?: number | null;
          driver_id?: string | null;
          driver_pay_cents?: number | null;
          food_cents: number;
          id?: string;
          note?: string | null;
          payment_method?: string;
          payment_status?: string;
          picked_up_at?: string | null;
          prep_minutes?: number | null;
          respond_by?: string | null;
          status?: Database['public']['Enums']['order_status'];
          tip_cents?: number;
          total_cents?: number | null;
        };
        Update: {
          accepted_at?: string | null;
          branch_id?: string;
          created_at?: string;
          customer_id?: string | null;
          customer_name?: string | null;
          delivered_at?: string | null;
          delivery_address?: string | null;
          delivery_fee_cents?: number;
          delivery_instructions?: string | null;
          delivery_lat?: number | null;
          delivery_lng?: number | null;
          driver_id?: string | null;
          driver_pay_cents?: number | null;
          food_cents?: number;
          id?: string;
          note?: string | null;
          payment_method?: string;
          payment_status?: string;
          picked_up_at?: string | null;
          prep_minutes?: number | null;
          respond_by?: string | null;
          status?: Database['public']['Enums']['order_status'];
          tip_cents?: number;
          total_cents?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_driver_id_fkey';
            columns: ['driver_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      payouts: {
        Row: {
          amount_cents: number;
          id: string;
          paid_on: string;
          restaurant_id: string;
          status: string;
        };
        Insert: {
          amount_cents: number;
          id?: string;
          paid_on: string;
          restaurant_id: string;
          status?: string;
        };
        Update: {
          amount_cents?: number;
          id?: string;
          paid_on?: string;
          restaurant_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payouts_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          role: Database['public']['Enums']['user_role'];
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          role?: Database['public']['Enums']['user_role'];
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          role?: Database['public']['Enums']['user_role'];
        };
        Relationships: [];
      };
      restaurants: {
        Row: {
          created_at: string;
          cuisine: string | null;
          delivery_fee_cents: number;
          id: string;
          image_url: string | null;
          name: string;
          owner_id: string;
        };
        Insert: {
          created_at?: string;
          cuisine?: string | null;
          delivery_fee_cents?: number;
          id?: string;
          image_url?: string | null;
          name: string;
          owner_id: string;
        };
        Update: {
          created_at?: string;
          cuisine?: string | null;
          delivery_fee_cents?: number;
          id?: string;
          image_url?: string | null;
          name?: string;
          owner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'restaurants_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      subscription_payments: {
        Row: {
          amount_cents: number | null;
          id: string;
          paid_on: string;
          restaurant_id: string;
          status: string;
        };
        Insert: {
          amount_cents?: number | null;
          id?: string;
          paid_on: string;
          restaurant_id: string;
          status?: string;
        };
        Update: {
          amount_cents?: number | null;
          id?: string;
          paid_on?: string;
          restaurant_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscription_payments_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
        ];
      };
      subscriptions: {
        Row: {
          created_at: string;
          next_billing_on: string | null;
          plan: Database['public']['Enums']['plan_id'];
          restaurant_id: string;
          status: Database['public']['Enums']['subscription_status'];
          trial_ends_on: string | null;
        };
        Insert: {
          created_at?: string;
          next_billing_on?: string | null;
          plan: Database['public']['Enums']['plan_id'];
          restaurant_id: string;
          status?: Database['public']['Enums']['subscription_status'];
          trial_ends_on?: string | null;
        };
        Update: {
          created_at?: string;
          next_billing_on?: string | null;
          plan?: Database['public']['Enums']['plan_id'];
          restaurant_id?: string;
          status?: Database['public']['Enums']['subscription_status'];
          trial_ends_on?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: true;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
        ];
      };
      suspensions: {
        Row: {
          created_at: string;
          kind: string;
          subject_id: string;
        };
        Insert: {
          created_at?: string;
          kind: string;
          subject_id: string;
        };
        Update: {
          created_at?: string;
          kind?: string;
          subject_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_delivery: { Args: { oid: string }; Returns: undefined };
      admin_cancel_order: { Args: { oid: string }; Returns: undefined };
      admin_customers: {
        Args: never;
        Returns: {
          email: string;
          id: string;
          joined: string;
          last_order: string;
          name: string;
          orders: number;
          spent_cents: number;
        }[];
      };
      admin_drivers: {
        Args: never;
        Returns: {
          deliveries_this_month: number;
          earned_this_month_cents: number;
          id: string;
          name: string;
          phone: string;
          status: string;
          vehicle: string;
        }[];
      };
      admin_order: { Args: { oid: string }; Returns: Json };
      admin_orders: {
        Args: { filter?: string; search?: string };
        Returns: {
          created_at: string;
          customer_name: string;
          driver_name: string;
          id: string;
          restaurant_name: string;
          status: Database['public']['Enums']['order_status'];
          total_cents: number;
        }[];
      };
      admin_overview: { Args: never; Returns: Json };
      admin_restaurant: { Args: { rid: string }; Returns: Json };
      admin_restaurants: {
        Args: never;
        Returns: {
          cuisine: string;
          id: string;
          joined: string;
          name: string;
          orders_this_month: number;
          plan: string;
          status: string;
        }[];
      };
      admin_set_driver_suspended: { Args: { suspend: boolean; uid: string }; Returns: undefined };
      admin_set_restaurant_suspended: {
        Args: { rid: string; suspend: boolean };
        Returns: undefined;
      };
      decline_delivery: { Args: { oid: string }; Returns: undefined };
      driver_available_deliveries: {
        Args: never;
        Returns: {
          distance_km: number;
          driver_pay_cents: number;
          item_count: number;
          order_id: string;
          pickup_address: string;
          restaurant_name: string;
          status: Database['public']['Enums']['order_status'];
          tip_cents: number;
        }[];
      };
      is_admin: { Args: never; Returns: boolean };
      mark_delivered: { Args: { oid: string }; Returns: undefined };
      mark_picked_up: { Args: { oid: string }; Returns: undefined };
      order_tracking: {
        Args: { oid: string };
        Returns: {
          driver_first_name: string;
          status: Database['public']['Enums']['order_status'];
          vehicle_model: string;
          vehicle_plate: string;
        }[];
      };
      place_order: {
        Args: {
          p_address: string;
          p_branch: string;
          p_instructions: string;
          p_items: Json;
          p_lat?: number;
          p_lng?: number;
          p_note: string;
          p_payment: string;
          p_tip: number;
        };
        Returns: string;
      };
    };
    Enums: {
      order_status:
        'new' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'declined' | 'cancelled';
      plan_id: 'smb' | 'enterprise';
      subscription_status: 'active' | 'past_due' | 'cancelled';
      user_role: 'customer' | 'restaurant' | 'driver' | 'admin';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      order_status: [
        'new',
        'preparing',
        'ready',
        'picked_up',
        'delivered',
        'declined',
        'cancelled',
      ],
      plan_id: ['smb', 'enterprise'],
      subscription_status: ['active', 'past_due', 'cancelled'],
      user_role: ['customer', 'restaurant', 'driver', 'admin'],
    },
  },
} as const;
