
-- The view intentionally bypasses RLS to serve as a controlled public interface
-- with only safe fields exposed. Revert security_invoker to default (off).
ALTER VIEW public.public_proposals SET (security_invoker = off);
