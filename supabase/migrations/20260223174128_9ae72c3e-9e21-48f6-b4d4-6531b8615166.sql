
-- Create quick replies table
CREATE TABLE public.respostas_rapidas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.respostas_rapidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own respostas_rapidas"
  ON public.respostas_rapidas FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
