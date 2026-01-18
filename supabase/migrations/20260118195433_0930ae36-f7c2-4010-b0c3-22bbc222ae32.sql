-- Create a secure function to regenerate profile UID with collision handling
CREATE OR REPLACE FUNCTION regenerate_profile_uid(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_uid TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  -- Verify the user is updating their own profile
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Not authorized to update this profile';
  END IF;

  LOOP
    -- Generate a cryptographically stronger UID using multiple entropy sources
    new_uid := substring(md5(gen_random_uuid()::text || clock_timestamp()::text || random()::text), 1, 8);
    
    BEGIN
      UPDATE public.profiles 
      SET uid = new_uid, updated_at = now()
      WHERE user_id = p_user_id;
      
      -- Success, exit loop
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      attempt := attempt + 1;
      IF attempt >= max_attempts THEN
        RAISE EXCEPTION 'Failed to generate unique UID after % attempts', max_attempts;
      END IF;
      -- Continue loop to try again
    END;
  END LOOP;
  
  RETURN new_uid;
END;
$$;