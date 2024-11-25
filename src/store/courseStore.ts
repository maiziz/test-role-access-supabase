import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Course {
  id: string;
  title: string;
  description: string;
  teacher_id: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  course: Course;
}

interface CourseState {
  courses: Course[];
  enrollments: Enrollment[];
  loading: boolean;
  error: string | null;
  fetchAllCourses: () => Promise<void>;
  fetchTeacherCourses: (teacherId: string) => Promise<void>;
  fetchStudentEnrollments: (studentId: string) => Promise<void>;
  createCourse: (course: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  enrollInCourse: (studentId: string, courseId: string) => Promise<void>;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  enrollments: [],
  loading: false,
  error: null,

  fetchAllCourses: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ courses: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching courses:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch courses',
        loading: false 
      });
    }
  },

  fetchTeacherCourses: async (teacherId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

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
      // First fetch all courses for the enrollment modal
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;
      set({ courses: coursesData || [] });

      // Then fetch student enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('student_id', studentId)
        .order('enrolled_at', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;
      set({ 
        enrollments: enrollmentsData || [], 
        loading: false 
      });
    } catch (error) {
      console.error('Error fetching student enrollments:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch enrollments',
        loading: false
      });
    }
  },

  createCourse: async (course) => {
    set({ loading: true, error: null });
    try {
      const { error: insertError } = await supabase
        .from('courses')
        .insert([{
          title: course.title,
          description: course.description,
          teacher_id: course.teacher_id,
          start_date: course.start_date,
          end_date: course.end_date
        }]);

      if (insertError) throw insertError;

      // Refresh the courses list
      const { data: coursesData, error: fetchError } = await supabase
        .from('courses')
        .select('*')
        .eq('teacher_id', course.teacher_id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      set({ courses: coursesData || [], loading: false });
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
      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert([{ 
          student_id: studentId, 
          course_id: courseId 
        }]);

      if (enrollError) throw enrollError;

      // Refresh the enrollments list
      const { data: enrollmentsData, error: fetchError } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('student_id', studentId)
        .order('enrolled_at', { ascending: false });

      if (fetchError) throw fetchError;
      set({ enrollments: enrollmentsData || [], loading: false });
    } catch (error) {
      console.error('Error enrolling in course:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to enroll in course',
        loading: false
      });
    }
  },
}));
