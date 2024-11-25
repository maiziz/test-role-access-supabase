# Supabase Role-Based Access Control Setup

This guide explains how to set up role-based authentication in Supabase.

## Setup Steps

1. **Create a New Supabase Project**
   - Go to https://supabase.com
   - Create a new project
   - Save your project URL and anon key

2. **Run the SQL Scripts**
   Run these scripts in order in the Supabase SQL Editor:

   1. `1_initial_setup.sql`
      - Creates necessary extensions
      - Sets up basic schema and permissions

   2. `2_schema.sql`
      - Creates tables with relationships
      - Sets up Row Level Security (RLS)

   3. `3_test_data.sql`
      - Creates test users
      - Adds sample data

## Database Structure

### Tables
- `auth.users` (provided by Supabase)
- `user_roles` (manages user roles)
- Additional tables as needed

### Roles
- `authenticated`: Regular authenticated users
- Custom roles (e.g., admin, user, etc.)

## Security Features

1. **Row Level Security (RLS)**
   - Each table has RLS policies
   - Users can only access their own data
   - Role-specific access controls

2. **Role Validation**
   - Automatic role assignment
   - Role checking on operations
   - Prevents unauthorized access

## Testing

1. **Create Test Users**
   ```sql
   -- Use the provided test_data.sql script
   ```

2. **Test Access**
   - Sign in with test users
   - Verify role-based access
   - Check security policies

## Common Issues

1. **Permission Errors**
   - Check RLS policies
   - Verify user roles
   - Ensure proper authentication

2. **Data Access**
   - Confirm user ID matches
   - Check role assignments
   - Verify policy conditions

## Environment Variables
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Security Notes

1. Always use RLS policies
2. Never expose sensitive data
3. Validate roles server-side
4. Use proper error handling
5. Keep authentication tokens secure
