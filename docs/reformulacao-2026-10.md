# Reformulação Sprites — o que mudou e por quê (2026-10-16)

## Motivação (resumo da pesquisa)

A pesquisa (SpriteLab, Pixeli, MDN, Slynyrd 8/55/56) convergiu em 4 decisões que
importam mais que talento de desenho: **grade fixa, paleta curta, outline/luz
consistentes e escala por inteiros com nearest-neighbour**. O projeto já acertava
em render (`fillRect` + `Math.round`, `imageSmoothingEnabled=false`,
`image-rendering: pixelated`), mas falhava em **governança**: cores espalhadas
como hex solto em 3 arquivos, sem fonte única, sem validador e sem caminho
documentado para criar sprite novo.

## O que foi feito

1. **`src/paleta.js` (novo)** — fonte única da paleta (~32 cores), rampas por
   material, `SPEC` de grade/animação e `validarSprite()` (lint de cores
   intrusas e pixels órfãos). Motivo: paleta curta compartilhada é o que faz
   sprites parecerem do mesmo jogo.
2. **`src/pixel.js`** — adicionado `desenharSpriteMatriz(ctx, matriz, mapa, x, y, px)`
   (sprites definidos como strings, técnica padrão de pixel art programática)
   sem quebrar nenhuma API existente. Motivo: dar um 2º caminho barato para
   props/ícones sem precisar esculpir `fillRect` à mão.
3. **`src/sprites.js` / `src/cenario.js`** — cabeçalhos apontando para
   `docs/` + `paleta.js` como referência normativa; visuais **inalterados**
   (mesmos hex, mesmas medidas) para não quebrar save, simulação nem testes.
4. **`docs/` (novo)** — `pixel-art-guia.md` (regras), `paleta.md` (espelho legível),
   `sprites-referencia.md` (spec técnico + passo a passo), este arquivo.
5. **`test/paleta.test.js` (novo)** — trava a reformulação: paleta sem duplicata,
   `TIPOS` só com cores válidas, matriz renderiza e validador acusa intrusa.

## O que NÃO mudou (de propósito)

- Nenhum visual em tela, nenhuma regra de combate, nenhum save.
- `game.js`, `arena.js`, `main.js`, `icons.js` intactos em comportamento.
- `strokeRect` do banner do boss mantido (UI, não sprite).

## Como validar

```bash
npm test        # lógica + paleta
npm run build   # bundle
npm run dev     # inspeção visual na arena (fundo claro+escuro, idle+luta)
```

## Migração TypeScript + modularização (2026-10-16, posterior)

> Registro histórico acima mantido intacto. Depois dele:
>
> - JS → TS estrito (`tsconfig.json`, `npm run typecheck`, `build` valida tipos).
> - `src/game.js` → `src/core/` (`types`, `data`, `state`, `combat`, `horde`, `shop`, `offline`, `index` barrel).
> - `src/pixel.js` → `src/render/pixel.ts`; `src/paleta.js` → `src/render/palette.ts`;
>   `src/icons.js` → `src/render/icons.ts`;
>   `src/sprites.js` → `src/render/sprites/` (`knight.ts`, `monsters.ts`, `shared.ts`);
>   `src/cenario.js` → `src/engine/scenario.ts`; `src/arena.js` → `src/engine/arena.ts`.
> - `src/main.js` (488 linhas) → `src/main.ts` fino + `src/ui/` (`controller`, `hud`, `views`,
>   `modal`, `log`, `storage`, `dom`); CSS `src/css/` → `src/styles/`.
> - Testes `test/*.js` → `test/*.test.ts` (mesmos casos + biomas).
> - Correção real encontrada na migração: `desenharArma()` referenciava `T.pele`
>   inexistente (ReferenceError recuperado pelo tick da arena); agora usa
>   `TIPOS[tipo].pele`. Ver `docs/ARQUITETURA.md` para o mapa atual.
