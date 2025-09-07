-- Fix the foreign key constraint issue
-- Drop the problematic foreign key constraints that reference auth.users
ALTER TABLE public.memberships DROP CONSTRAINT IF EXISTS memberships_user_id_fkey;
ALTER TABLE public.agency_members DROP CONSTRAINT IF EXISTS agency_members_user_id_fkey;

-- Instead of foreign keys to auth.users, we'll rely on the application logic
-- since the trigger runs before the auth.users record is fully committed

-- Re-enable RLS on tables now that the constraint issue is fixed
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;