

## Problema
Seções do site estão aparecendo "embaçadas" (semi-transparentes) porque usam animações de opacidade baseadas em `scrollYProgress` com thresholds muito altos — os elementos demoram demais para atingir `opacity: 1`.

## Seções Afetadas

1. **ArsenalSection** (`ArsenalSection.tsx`)
   - `headerOpacity`: range `[0, 0.25]` mapeando `[0, 1]` — o título começa invisível e demora 25% do scroll para aparecer
   - `gridY`: range `[0.1, 0.5]` com `y: [80, 0]` — grid demora demais para se posicionar

2. **CasesSection** (`CasesSection.tsx`)
   - `bgParallax` é só visual, sem problema de opacidade
   - As seções de design services usam `whileInView` que funcionam bem

3. **TrustedBrandsSection** — usa `staggerContainer` com `whileInView`, deveria funcionar corretamente

## Plano de Correção

### 1. Corrigir ArsenalSection — Ajustar thresholds de scroll
- `headerOpacity`: mudar de `[0, 0.25] → [0, 1]` para `[0, 0.08] → [0.4, 1]` (mesmo padrão aplicado no CaseCard)
- `headerY`: mudar de `[0, 0.4] → [60, 0]` para `[0, 0.15] → [20, 0]`
- `gridY`: mudar de `[0.1, 0.5] → [80, 0]` para `[0.05, 0.2] → [30, 0]`

### 2. Revisar CaseCard — Confirmar fix anterior
- Já corrigido na última edição, manter os valores atuais

### 3. Revisar motion variants globais (motion.ts)
- `staggerContainer.hidden` começa com `opacity: 0` — funciona bem com `whileInView` pois dispara na viewport
- Sem alteração necessária aqui

## Resultado Esperado
Todas as seções aparecem nítidas rapidamente ao entrar na viewport, sem efeito de "embaçamento" prolongado.

