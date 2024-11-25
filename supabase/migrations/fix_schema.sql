-- First, let's verify and fix any schema issues

-- 1. Create the public schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS public;

-- 2. Grant necessary permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- 3. Enable RLS on the schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- 4. Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 5. Verify and recreate the user_roles table
DROP TABLE IF EXISTS user_roles CASCADE;
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(user_id),
    CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- 6. Create courses table
DROP TABLE IF EXISTS courses CASCADE;
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    teacher_id UUID NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT fk_teacher
        FOREIGN KEY(teacher_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- 7. Create enrollments table
DROP TABLE IF EXISTS enrollments CASCADE;
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    course_id UUID NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(student_id, course_id),
    CONSTRAINT fk_student
        FOREIGN KEY(student_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_course
        FOREIGN KEY(course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE
);

-- 8. Set up RLS policies for user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
CREATE POLICY "Users can view their own role"
    ON user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own role" ON user_roles;
CREATE POLICY "Users can update their own role"
    ON user_roles
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;
CREATE POLICY "Users can insert their own role"
    ON user_roles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 9. Set up RLS policies for courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can create courses" ON courses;
CREATE POLICY "Teachers can create courses"
    ON courses
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'teacher'
        )
        AND teacher_id = auth.uid()
    );

DROP POLICY IF EXISTS "Teachers can update their courses" ON courses;
CREATE POLICY "Teachers can update their courses"
    ON courses
    FOR UPDATE
    USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Everyone can view courses" ON courses;
CREATE POLICY "Everyone can view courses"
    ON courses
    FOR SELECT
    USING (true);

-- 10. Set up RLS policies for enrollments
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can enroll in courses" ON enrollments;
CREATE POLICY "Students can enroll in courses"
    ON enrollments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'student'
        )
        AND student_id = auth.uid()
    );

DROP POLICY IF EXISTS "Students can view their enrollments" ON enrollments;
CREATE POLICY "Students can view their enrollments"
    ON enrollments
    FOR SELECT
    USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can view course enrollments" ON enrollments;
CREATE POLICY "Teachers can view course enrollments"
    ON enrollments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = enrollments.course_id
            AND courses.teacher_id = auth.uid()
        )
    );

-- 11. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);

-- 12. Grant necessary permissions on tables
GRANT ALL ON TABLE user_roles TO postgres, authenticated, service_role;
GRANT ALL ON TABLE courses TO postgres, authenticated, service_role;
GRANT ALL ON TABLE enrollments TO postgres, authenticated, service_role;
