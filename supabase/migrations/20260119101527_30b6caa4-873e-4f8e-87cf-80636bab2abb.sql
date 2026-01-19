-- Update lookup_profile_by_uid to SECURITY DEFINER so it can bypass RLS
-- This is safe because we validate input and return minimal data
CREATE OR REPLACE FUNCTION public.lookup_profile_by_uid(p_uid text)
RETURNS TABLE(user_id uuid, name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate UID format (8 alphanumeric characters)
  IF p_uid IS NULL OR length(p_uid) != 8 THEN
    RETURN;
  END IF;
  
  -- Return minimal profile data for the UID
  RETURN QUERY
  SELECT profiles.user_id, profiles.name
  FROM public.profiles
  WHERE profiles.uid = p_uid
  LIMIT 1;
END;
$$;