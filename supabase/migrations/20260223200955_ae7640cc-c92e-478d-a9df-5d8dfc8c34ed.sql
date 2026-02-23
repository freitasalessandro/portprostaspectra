
-- Create enum for attendant roles/levels
CREATE TYPE public.atendente_cargo AS ENUM ('n1_triagem', 'n2_tecnico', 'supervisor');

-- Add cargo column to atendentes_perfil
ALTER TABLE public.atendentes_perfil
ADD COLUMN cargo public.atendente_cargo NOT NULL DEFAULT 'n1_triagem';

-- Add a comment for documentation
COMMENT ON COLUMN public.atendentes_perfil.cargo IS 'Nível do atendente: n1_triagem (triagem), n2_tecnico (técnico), supervisor (gerencia equipe e vê todos os tickets)';
