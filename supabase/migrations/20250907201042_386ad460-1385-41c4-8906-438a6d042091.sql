-- First, let's check and fix RLS policies that might be blocking the trigger

-- Update agencies policies to allow system inserts
DROP POLICY IF EXISTS "agencies_insert" ON public.agencies;
DROP POLICY IF EXISTS "insert agencies for self" ON public.agencies;

CREATE POLICY "agencies_insert_auth" ON public.agencies
FOR INSERT 
WITH CHECK (
  created_by = auth.uid() OR 
  auth.uid() IS NULL  -- Allow system/trigger inserts
);

-- Update profiles policies to allow system inserts  
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert_auth" ON public.profiles
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() OR 
  auth.uid() IS NULL  -- Allow system/trigger inserts
);

-- Update memberships policies to allow system inserts
DROP POLICY IF EXISTS "insert memberships for self" ON public.memberships;
CREATE POLICY "memberships_insert_auth" ON public.memberships
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() OR 
  auth.uid() IS NULL  -- Allow system/trigger inserts
);

-- Update agency_members policies to allow system inserts
CREATE POLICY IF NOT EXISTS "agency_members_insert_auth" ON public.agency_members
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() OR 
  auth.uid() IS NULL  -- Allow system/trigger inserts
);

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_agency_id uuid;
BEGIN
  -- Generate agency ID
  new_agency_id := gen_random_uuid();
  
  -- Create agency with proper name
  INSERT INTO public.agencies (id, name, created_by, owner_user_id)
  VALUES (
    new_agency_id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)) || ' Agency',
    NEW.id,
    NEW.id
  );

  -- Create agency membership
  INSERT INTO public.agency_members (agency_id, user_id, role)
  VALUES (new_agency_id, NEW.id, 'owner');
  
  -- Create legacy membership record
  INSERT INTO public.memberships (agency_id, user_id, role)
  VALUES (new_agency_id, NEW.id, 'owner');

  -- Create user profile
  INSERT INTO public.profiles (id, user_id, email, full_name, agency_id)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    new_agency_id
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error details
  RAISE LOG 'handle_new_user error for user %: % %', NEW.id, SQLSTATE, SQLERRM;
  -- Re-raise the error to prevent user creation
  RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();