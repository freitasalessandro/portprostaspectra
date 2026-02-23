
-- Table for allowed WhatsApp groups
CREATE TABLE public.allowed_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  group_jid TEXT NOT NULL,
  group_name TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint per user+group
CREATE UNIQUE INDEX idx_allowed_groups_unique ON public.allowed_groups(user_id, group_jid);

ALTER TABLE public.allowed_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own allowed_groups" ON public.allowed_groups
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
