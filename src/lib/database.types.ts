export interface Database {
  public: {
    Tables: {
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'teacher' | 'student'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'teacher' | 'student'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'teacher' | 'student'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
