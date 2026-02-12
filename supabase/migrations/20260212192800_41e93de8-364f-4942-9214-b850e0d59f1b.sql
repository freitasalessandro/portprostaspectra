
-- Drop the overly permissive update policy
DROP POLICY IF EXISTS "Anyone can accept a proposal" ON public.proposals;

-- Create a restrictive RLS function for accepting proposals
CREATE OR REPLACE FUNCTION public.accept_proposal(
  _proposal_id uuid,
  _accepted_by_name text,
  _accepted_by_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.proposals
  SET 
    accepted_at = now(),
    accepted_by_name = _accepted_by_name,
    accepted_by_email = _accepted_by_email,
    status = 'accepted'
  WHERE id = _proposal_id
    AND status != 'accepted';
END;
$$;
