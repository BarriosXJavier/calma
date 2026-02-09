export type SubscriptionTier = 'free' | 'starter' | 'pro';

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
      users: {
        Row: {
          id: string;
          clerk_id: string;
          email: string;
          name: string | null;
          slug: string;
          timezone: string;
          subscription_tier: SubscriptionTier;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_id: string;
          email: string;
          name?: string | null;
          slug: string;
          timezone?: string;
          subscription_tier?: SubscriptionTier;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_id?: string;
          email?: string;
          name?: string | null;
          slug?: string;
          timezone?: string;
          subscription_tier?: SubscriptionTier;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      connected_accounts: {
        Row: {
          id: string;
          user_id: string;
          google_account_id: string;
          email: string;
          access_token: string;
          refresh_token: string;
          expiry_date: number;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          google_account_id: string;
          email: string;
          access_token: string;
          refresh_token: string;
          expiry_date: number;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          google_account_id?: string;
          email?: string;
          access_token?: string;
          refresh_token?: string;
          expiry_date?: number;
          is_default?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'connected_accounts_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      availability: {
        Row: {
          id: string;
          user_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'availability_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      meeting_types: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string;
          duration_minutes: number;
          description: string | null;
          is_default: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          slug: string;
          duration_minutes: number;
          description?: string | null;
          is_default?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          slug?: string;
          duration_minutes?: number;
          description?: string | null;
          is_default?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'meeting_types_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          host_id: string;
          meeting_type_id: string;
          guest_name: string;
          guest_email: string;
          start_time: string;
          end_time: string;
          guest_timezone: string;
          google_event_id: string | null;
          meet_link: string | null;
          notes: string | null;
          status: 'confirmed' | 'cancelled';
          created_at: string;
        };
        Insert: {
          id?: string;
          host_id: string;
          meeting_type_id: string;
          guest_name: string;
          guest_email: string;
          start_time: string;
          end_time: string;
          guest_timezone: string;
          google_event_id?: string | null;
          meet_link?: string | null;
          notes?: string | null;
          status?: 'confirmed' | 'cancelled';
          created_at?: string;
        };
        Update: {
          id?: string;
          host_id?: string;
          meeting_type_id?: string;
          guest_name?: string;
          guest_email?: string;
          start_time?: string;
          end_time?: string;
          guest_timezone?: string;
          google_event_id?: string | null;
          meet_link?: string | null;
          notes?: string | null;
          status?: 'confirmed' | 'cancelled';
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bookings_host_id_fkey';
            columns: ['host_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_meeting_type_id_fkey';
            columns: ['meeting_type_id'];
            referencedRelation: 'meeting_types';
            referencedColumns: ['id'];
          },
        ];
      };
      feedback: {
        Row: {
          id: string;
          user_id: string | null;
          content: string;
          archived: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          content: string;
          archived?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          content?: string;
          archived?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'feedback_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
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

// Helper type aliases
export type Availability = Database['public']['Tables']['availability']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type MeetingType = Database['public']['Tables']['meeting_types']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type ConnectedAccount =
  Database['public']['Tables']['connected_accounts']['Row'];

// Booking with joined meeting type
export type BookingWithMeetingType = Booking & {
  meeting_types?: MeetingType | null;
};

export const TIER_LIMITS = {
  free: {
    calendars: 1,
    bookingsPerMonth: 2,
  },
  starter: {
    calendars: 3,
    bookingsPerMonth: 10,
  },
  pro: {
    calendars: Infinity,
    bookingsPerMonth: Infinity,
  },
} as const;
