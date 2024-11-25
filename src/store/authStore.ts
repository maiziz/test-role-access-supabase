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
  signUp: (email: string, password: string, role: 'teacher' | 'student') => Promise<void>;
  signOut: () => Promise<void>;
  checkUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  signUp: async (email, password, role) => {
    try {
      // First create the user in Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role // Store role in user metadata
          }
        }
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('No user returned after sign up');
      }

      // Create the user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([
          { user_id: authData.user.id, role }
        ]);

      if (roleError) {
        console.error('Role creation error:', roleError);
        // Clean up the created user if role creation fails
        await supabase.auth.signOut();
        throw new Error('Failed to create user role');
      }

      // Set the user in state
      set({
        user: {
          id: authData.user.id,
          email: authData.user.email || '',
          role
        },
        loading: false
      });
    } catch (error) {
      console.error('Sign up process error:', error);
      throw error;
    }
  },

  signIn: async (email, password, role) => {
    try {
      // First sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Invalid login credentials');
      }

      if (!authData.user) {
        console.error('No user data returned');
        throw new Error('Login failed');
      }

      // Get the user's role from the database
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .single();

      if (roleError) {
        console.error('Role fetch error:', roleError);
        await supabase.auth.signOut();
        throw new Error('Error checking user role');
      }

      if (roleData.role !== role) {
        console.error('Role mismatch:', { expected: role, actual: roleData.role });
        await supabase.auth.signOut();
        throw new Error(`Invalid role. You are a ${roleData.role}, not a ${role}`);
      }

      // Set the user in state
      set({
        user: {
          id: authData.user.id,
          email: authData.user.email || '',
          role: roleData.role
        },
        loading: false
      });
    } catch (error) {
      console.error('Sign in process error:', error);
      await supabase.auth.signOut();
      throw error;
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, loading: false });
  },

  checkUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        set({ user: null, loading: false });
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError) {
        console.error('Error fetching user role:', roleError);
        set({ user: null, loading: false });
        return;
      }

      set({
        user: {
          id: user.id,
          email: user.email || '',
          role: roleData.role
        },
        loading: false
      });
    } catch (error) {
      console.error('Check user error:', error);
      set({ user: null, loading: false });
    }
  }
}));