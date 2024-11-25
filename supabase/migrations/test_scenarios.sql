-- Test Scenario: Create Test Users and Data

-- 1. Clean up existing test data
DELETE FROM auth.users WHERE email IN ('test.teacher@example.com', 'test.student@example.com');

-- 2. Create test users
DO $$
DECLARE
    teacher_id uuid;
    student_id uuid;
BEGIN
    -- Create teacher
    teacher_id := gen_random_uuid();
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        aud,
        role,
        created_at,
        updated_at
    ) VALUES (
        teacher_id,
        'test.teacher@example.com',
        -- Using Supabase's default password hashing
        crypt('password123', gen_salt('bf', 10)),
        now(),
        jsonb_build_object(
            'provider', 'email',
            'providers', array['email']
        ),
        jsonb_build_object('role', 'teacher'),
        'authenticated',
        'authenticated',
        now(),
        now()
    );

    -- Create student
    student_id := gen_random_uuid();
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        aud,
        role,
        created_at,
        updated_at
    ) VALUES (
        student_id,
        'test.student@example.com',
        crypt('password123', gen_salt('bf', 10)),
        now(),
        jsonb_build_object(
            'provider', 'email',
            'providers', array['email']
        ),
        jsonb_build_object('role', 'student'),
        'authenticated',
        'authenticated',
        now(),
        now()
    );

    -- Add roles
    INSERT INTO user_roles (user_id, role)
    VALUES 
        (teacher_id, 'teacher'),
        (student_id, 'student')
    ON CONFLICT (user_id) 
    DO UPDATE SET role = EXCLUDED.role;

    -- Create test courses
    INSERT INTO courses (title, description, teacher_id, start_date, end_date)
    VALUES 
        (
            'Introduction to Mathematics',
            'A comprehensive introduction to basic mathematics concepts',
            teacher_id,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '3 months'
        ),
        (
            'Advanced Physics',
            'An in-depth study of physics principles',
            teacher_id,
            CURRENT_DATE + INTERVAL '1 month',
            CURRENT_DATE + INTERVAL '4 months'
        );

    -- Enroll student in first course
    INSERT INTO enrollments (student_id, course_id)
    SELECT student_id, id
    FROM courses
    LIMIT 1;
END $$;

-- Verify the setup
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'role' as meta_role,
    ur.role as db_role,
    ur.created_at
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
WHERE au.email IN ('test.teacher@example.com', 'test.student@example.com');

-- Verify courses
SELECT 
    c.title,
    c.description,
    au.email as teacher_email,
    c.start_date,
    c.end_date
FROM courses c
JOIN auth.users au ON c.teacher_id = au.id;

-- Verify enrollments
SELECT 
    au.email as student_email,
    c.title as course_title,
    e.enrolled_at
FROM enrollments e
JOIN auth.users au ON e.student_id = au.id
JOIN courses c ON e.course_id = c.id;
