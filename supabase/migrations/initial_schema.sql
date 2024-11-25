-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS class_schedule;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS user_roles;

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id)
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT date_check CHECK (end_date >= start_date)
);

-- Course enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'dropped')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  UNIQUE(student_id, course_id)
);

-- Class schedule table
CREATE TABLE IF NOT EXISTS class_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT CHECK (
    recurring = false OR 
    recurrence_pattern IN ('daily', 'weekly', 'biweekly')
  ),
  CONSTRAINT time_check CHECK (end_time > start_time)
);

-- Set up Row Level Security (RLS)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedule ENABLE ROW LEVEL SECURITY;

-- User roles policies
CREATE POLICY "Users can view their own role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own role"
  ON user_roles FOR UPDATE
  USING (auth.uid() = user_id);

-- Courses policies
CREATE POLICY "Anyone can view courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can create courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update their own courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own courses"
  ON courses FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

-- Enrollments policies
CREATE POLICY "Students can view their enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can enroll themselves"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'student'
    )
  );

CREATE POLICY "Students can update their own enrollment status"
  ON enrollments FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid());

-- Class schedule policies
CREATE POLICY "Anyone can view class schedules"
  ON class_schedule FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can manage class schedules"
  ON class_schedule FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = class_schedule.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_class_schedule_course_id ON class_schedule(course_id);
