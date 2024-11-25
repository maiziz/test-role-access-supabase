import { supabase } from './supabase';

export interface Course {
  id: string;
  title: string;
  description: string;
  teacher_id: string;
  start_date: string;
  end_date: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  status: 'active' | 'completed' | 'dropped';
  progress: number;
}

export interface ClassSchedule {
  id: string;
  course_id: string;
  start_time: string;
  end_time: string;
  recurring: boolean;
  recurrence_pattern: 'daily' | 'weekly' | 'biweekly' | null;
}

// Database helper functions
export async function getCoursesByTeacher(teacherId: string) {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('teacher_id', teacherId);

  if (error) throw error;
  return data;
}

export async function getEnrolledCourses(studentId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      courses (*)
    `)
    .eq('student_id', studentId)
    .eq('status', 'active');

  if (error) throw error;
  return data;
}

export async function getUpcomingClasses(userId: string, role: 'teacher' | 'student') {
  const query = supabase
    .from('class_schedule')
    .select(`
      *,
      courses (*)
    `)
    .gte('start_time', new Date().toISOString());

  if (role === 'teacher') {
    query.eq('courses.teacher_id', userId);
  } else {
    query.in('course_id', (sub) =>
      sub
        .from('enrollments')
        .select('course_id')
        .eq('student_id', userId)
        .eq('status', 'active')
    );
  }

  const { data, error } = await query.limit(5);

  if (error) throw error;
  return data;
}

export async function createCourse(courseData: Omit<Course, 'id'>) {
  const { data, error } = await supabase
    .from('courses')
    .insert([courseData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function enrollInCourse(studentId: string, courseId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .insert([{
      student_id: studentId,
      course_id: courseId,
      status: 'active',
      progress: 0
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEnrollmentProgress(
  enrollmentId: string,
  progress: number
) {
  const { data, error } = await supabase
    .from('enrollments')
    .update({ progress })
    .eq('id', enrollmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}