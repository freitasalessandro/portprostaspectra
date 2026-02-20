
-- Fix: set the view to use invoker's permissions
ALTER VIEW public.public_proposals SET (security_invoker = on);
