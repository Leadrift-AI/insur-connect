-- Fix the handle_new_user function to avoid RLS issues
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_agency_id uuid;
BEGIN
  -- Create a default agency for the new user (bypassing RLS with SECURITY DEFINER)
  INSERT INTO public.agencies (id, name, created_by, owner_user_id)
  VALUES (
    gen_random_uuid(), 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email) || '''s Agency', 
    NEW.id, 
    NEW.id
  )
  RETURNING id INTO new_agency_id;

  -- Create a membership record
  INSERT INTO public.agency_members (agency_id, user_id, role)
  VALUES (new_agency_id, NEW.id, 'owner');

  -- Create a membership in the memberships table as well (for compatibility)
  INSERT INTO public.memberships (agency_id, user_id, role)
  VALUES (new_agency_id, NEW.id, 'owner');

  -- Insert a profile for the new user
  INSERT INTO public.profiles (id, user_id, email, full_name, agency_id)
  VALUES (
    NEW.id, 
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data ->> 'full_name',
    new_agency_id
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error for debugging
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  -- Re-raise the error
  RAISE;
END;
$$;

-- Ensure the trigger exists and points to the correct function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();