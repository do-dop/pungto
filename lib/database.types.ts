export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      dashboard_links: {
        Row: {
          id: number
          room_id: string
          label: string
          url: string
          kind: 'github' | 'figma' | 'notion' | 'docs' | 'etc'
          position: number
          created_at: string
        }
        Insert: {
          id?: number
          room_id: string
          label: string
          url: string
          kind: 'github' | 'figma' | 'notion' | 'docs' | 'etc'
          position?: number
          created_at?: string
        }
        Update: {
          id?: number
          room_id?: string
          label?: string
          url?: string
          kind?: 'github' | 'figma' | 'notion' | 'docs' | 'etc'
          position?: number
          created_at?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          room_id: string
          session_id: string
          display_name: string
          joined_at: string
        }
        Insert: {
          room_id: string
          session_id: string
          display_name: string
          joined_at?: string
        }
        Update: {
          room_id?: string
          session_id?: string
          display_name?: string
          joined_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          room_id: string
          session_id: string
          display_name: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          session_id: string
          display_name: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          session_id?: string
          display_name?: string
          content?: string
          created_at?: string
        }
        Relationships: []
      }
      room_dashboard: {
        Row: {
          room_id: string
          project_name: string | null
          summary: string
          goal: string
          updated_at: string
        }
        Insert: {
          room_id: string
          project_name?: string | null
          summary: string
          goal: string
          updated_at?: string
        }
        Update: {
          room_id?: string
          project_name?: string | null
          summary?: string
          goal?: string
          updated_at?: string
        }
        Relationships: []
      }
      room_members: {
        Row: {
          room_id: string
          user_id: string
          display_name: string | null
          joined_at: string
        }
        Insert: {
          room_id: string
          user_id: string
          display_name?: string | null
          joined_at?: string
        }
        Update: {
          room_id?: string
          user_id?: string
          display_name?: string | null
          joined_at?: string
        }
        Relationships: []
      }
      room_secrets: {
        Row: {
          room_id: string
          password_hash: string
          created_at: string
        }
        Insert: {
          room_id: string
          password_hash: string
          created_at?: string
        }
        Update: {
          room_id?: string
          password_hash?: string
          created_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          id: string
          title: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id: string
          title: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          id: string
          room_id: string
          title: string
          description: string | null
          scheduled_date: string
          color: 'purple' | 'teal' | 'coral'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          title: string
          description?: string | null
          scheduled_date: string
          color?: 'purple' | 'teal' | 'coral'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          title?: string
          description?: string | null
          scheduled_date?: string
          color?: 'purple' | 'teal' | 'coral'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: number
          room_id: string
          title: string
          description: string
          status: 'todo' | 'doing' | 'review' | 'done'
          category: string
          category_class: string
          owner_name: string
          due_text: string
          is_overdue: boolean
          position: number
          created_by_session_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          room_id: string
          title: string
          description?: string
          status: 'todo' | 'doing' | 'review' | 'done'
          category?: string
          category_class?: string
          owner_name?: string
          due_text?: string
          is_overdue?: boolean
          position?: number
          created_by_session_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          room_id?: string
          title?: string
          description?: string
          status?: 'todo' | 'doing' | 'review' | 'done'
          category?: string
          category_class?: string
          owner_name?: string
          due_text?: string
          is_overdue?: boolean
          position?: number
          created_by_session_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_roles: {
        Row: {
          id: number
          room_id: string
          name: string
          role: string
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          room_id: string
          name: string
          role: string
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          room_id?: string
          name?: string
          role?: string
          position?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      create_room_with_password: {
        Args: {
          p_room_id: string
          p_title: string
          p_password: string
        }
        Returns: undefined
      }
      get_public_room_title: {
        Args: {
          p_room_id: string
        }
        Returns: string
      }
      join_room_with_password: {
        Args: {
          p_room_id: string
          p_password: string
          p_display_name: string
        }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
