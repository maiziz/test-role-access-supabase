-- Test Data Setup
-- Note: Replace 'password' with actual hashed passwords in production

-- Function to create a test user
CREATE OR REPLACE FUNCTION create_test_user(
    email TEXT,
    password TEXT,
    role user_role
) RETURNS uuid AS $$
DECLARE
    new_user_id uuid;
BEGIN
    -- Insert into auth.users
    INSERT INTO auth.users (
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_sent_at
    )
    VALUES (
        email,
        crypt(password, gen_salt('bf')),
        NOW(),
        NOW()
    )
    RETURNING id INTO new_user_id;

    -- Set role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, role);

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create test users
DO $$ 
BEGIN
    -- Create admin user
    PERFORM create_test_user(
        'admin@example.com',
        'admin123',
        'admin'::user_role
    );

    -- Create regular user
    PERFORM create_test_user(
        'user@example.com',
        'user123',
        'user'::user_role
    );

    -- Create guest user
    PERFORM create_test_user(
        'guest@example.com',
        'guest123',
        'guest'::user_role
    );
END $$;

-- Test Queries

-- Test getting current user role
SELECT public.get_current_user_role();

-- Test role check
SELECT public.has_role('admin'::user_role);
SELECT public.has_role('user'::user_role);

-- View all users and their roles
SELECT 
    au.email,
    ur.role,
    ur.created_at
FROM auth.users au
JOIN public.user_roles ur ON au.id = ur.user_id;

-- Clean up (comment out in production)
-- DROP FUNCTION create_test_user(TEXT, TEXT, user_role);
