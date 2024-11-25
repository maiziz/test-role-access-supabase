import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  role: 'teacher' | 'student';
}

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, role: 'teacher' | 'student') => Promise<void>;
  signOut: () => Promise<void>;
  checkUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  signIn: async (email, password, role) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      await supabase.from('user_roles').upsert({
        user_id: data.user.id,
        role,
      });

      set({ user: { id: data.user.id, email: data.user.email!, role } });
    }
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
  checkUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      set({
        user: {
          id: user.id,
          email: user.email!,
          role: roleData?.role || 'student',
        },
        loading: false,
      });
    } else {
      set({ user: null, loading: false });
    }
  },
}));