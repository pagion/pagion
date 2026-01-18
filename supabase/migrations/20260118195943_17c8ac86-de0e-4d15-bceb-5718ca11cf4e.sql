-- Fix 1: Restrict profile visibility to owner and contacts
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own and contact profiles" 
  ON public.profiles FOR SELECT 
  TO authenticated 
  USING (
    auth.uid() = user_id OR
    user_id IN (
      SELECT contact_user_id FROM public.contacts 
      WHERE contacts.user_id = auth.uid()
    )
  );

-- Fix 2: Create secure RPC function for UID lookup (minimal data exposure)
CREATE OR REPLACE FUNCTION lookup_profile_by_uid(p_uid TEXT)
RETURNS TABLE(user_id UUID, name TEXT)
LANGUAGE plpgsql
SECURITY INVOKER
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

-- Fix 3: Update regenerate_profile_uid to use SECURITY INVOKER
CREATE OR REPLACE FUNCTION regenerate_profile_uid(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  new_uid TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  -- Verify the user is updating their own profile (RLS will also enforce this)
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Not authorized to update this profile';
  END IF;

  LOOP
    -- Generate a cryptographically stronger UID
    new_uid := substring(md5(gen_random_uuid()::text || clock_timestamp()::text || random()::text), 1, 8);
    
    BEGIN
      UPDATE public.profiles 
      SET uid = new_uid, updated_at = now()
      WHERE user_id = p_user_id;
      
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      attempt := attempt + 1;
      IF attempt >= max_attempts THEN
        RAISE EXCEPTION 'Failed to generate unique UID after % attempts', max_attempts;
      END IF;
    END;
  END LOOP;
  
  RETURN new_uid;
END;
$$;

-- Fix 4: Add message content length constraint using a trigger (not CHECK constraint for flexibility)
CREATE OR REPLACE FUNCTION validate_message_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.content IS NULL OR length(trim(NEW.content)) = 0 THEN
    RAISE EXCEPTION 'Message content cannot be empty';
  END IF;
  
  IF length(NEW.content) > 10000 THEN
    RAISE EXCEPTION 'Message content exceeds maximum length of 10000 characters';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_message_content_trigger ON public.messages;

CREATE TRIGGER validate_message_content_trigger
  BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION validate_message_content();