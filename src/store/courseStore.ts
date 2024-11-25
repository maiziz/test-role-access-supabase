import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Course {
  id: string;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  course: Course;
}

interface CourseState {
  courses: Course[];
  enrollments: Enrollment[];
  loading: boolean;
  error: string | null;
  fetchTeacherCourses: (teacherId: string) => Promise<void>;
  fetchStudentEnrollments: (studentId: string) => Promise<void>;
  createCourse: (title: string, description: string, teacherId: string) => Promise<void>;
  enrollInCourse: (studentId: string, courseId: string) => Promise<void>;
}

export const useCourseStore = create<CourseState>((set) => ({
  courses: [],
  enrollments: [],
  loading: false,
  error: null,

  fetchTeacherCourses: async (teacherId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('created_by', teacherId);

      if (error) throw error;
      set({ courses: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching teacher courses:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch courses',
        loading: false 
      });
    }
  },

  fetchStudentEnrollments: async (studentId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('user_id', studentId);

      if (error) throw error;
      set({ enrollments: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching student enrollments:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch enrollments',
        loading: false
      });
    }
  },

  createCourse: async (title: string, description: string, teacherId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('courses')
        .insert([{ title, description, created_by: teacherId }]);

      if (error) throw error;

      // Refresh the courses list
      const { data: courses, error: fetchError } = await supabase
        .from('courses')
        .select('*')
        .eq('created_by', teacherId);

      if (fetchError) throw fetchError;
      set({ courses: courses || [], loading: false });
    } catch (error) {
      console.error('Error creating course:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create course',
        loading: false
      });
    }
  },

  enrollInCourse: async (studentId: string, courseId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert([{ user_id: studentId, course_id: courseId }]);

      if (error) throw error;

      // Refresh the enrollments list
      const { data: enrollments, error: fetchError } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('user_id', studentId);

      if (fetchError) throw fetchError;
      set({ enrollments: enrollments || [], loading: false });
    } catch (error) {
      console.error('Error enrolling in course:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to enroll in course',
        loading: false
      });
    }
  },
}));
