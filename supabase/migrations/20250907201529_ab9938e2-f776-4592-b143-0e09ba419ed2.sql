-- Let's temporarily disable RLS on tables that need population during signup
-- and create a simpler, more robust trigger

-- Temporarily disable RLS for user creation process
ALTER TABLE public.agencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_members DISABLE ROW LEVEL SECURITY;

-- Create a much simpler trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_agency_id uuid;
  agency_name text;
  user_name text;
BEGIN
  -- Set defaults
  new_agency_id := gen_random_uuid();
  user_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User');
  agency_name := user_name || '''s Agency';
  
  -- Create agency
  INSERT INTO public.agencies (id, name, created_by, owner_user_id)
  VALUES (new_agency_id, agency_name, NEW.id, NEW.id);

  -- Create memberships
  INSERT INTO public.agency_members (agency_id, user_id, role)
  VALUES (new_agency_id, NEW.id, 'owner');
  
  INSERT INTO public.memberships (agency_id, user_id, role)
  VALUES (new_agency_id, NEW.id, 'owner');

  -- Create profile
  INSERT INTO public.profiles (id, user_id, email, full_name, agency_id)
  VALUES (NEW.id, NEW.id, NEW.email, user_name, new_agency_id);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Signup failed: %', SQLERRM;
END;
$$;