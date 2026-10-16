# 🏰 Reino Idle

Jogo idle de gerenciamento medieval: **as batalhas são automáticas, você só administra.**

Mini protótipo jogável, em português, estilo minimalista limpo, pronto para GitHub Pages.

## 🎮 Como funciona o loop

1. A cada 3s seu cavaleiro luta sozinho contra uma horda (15× o nível; Nv.10 = BOSS)
2. Vitória = ouro + bônus + próximo nível. Derrota = mantém o ouro de abates e tenta de novo
3. Você investe o ouro em 2 decisões de gerente:
   - 🎒 Equipamentos (6 slots × 4 tiers: elmo, camisa, calças, botas, arma, escudo)
   - ✨ Habilidades passivas (Afiado, Vigor, Regeneração, Rapidez, Saque)
4. Save automático no `localStorage` + renda passiva + ganho offline (até 4h)

## 🗂️ Arquitetura

Mapa completo em `docs/ARQUITETURA.md`. Resumo:

```text
src/core/     regras puras (tipos, balance, save, combate, horda, loja, offline)
src/engine/   tempo real (Arena + cenário)
src/render/   pixel art (primitivas, paleta, ícones, sprites/)
src/ui/       DOM (controller, HUD, modais, log, storage)
src/styles/   CSS
test/         vitest (regras + paleta)
```

Regra de ouro: `core/` é puro (sem DOM/canvas); `ui/` é a única que toca
`document`/`localStorage`; simulação e animação usam as mesmas `REGRAS`.

## 🎨 Pixel art / sprites

Guia normativo em `docs/`: `pixel-art-guia.md` (regras), `paleta.md`
(paleta oficial, fonte única em `src/render/palette.ts`), `sprites-referencia.md`
(spec técnico + como criar sprite/monstro/bioma), `reformulacao-2026-10.md`
(histórico) e `ARQUITETURA.md` (mapa atual dos módulos).

## 🛠️ Stack

TypeScript estrito + HTML + CSS + Vite + Vitest (zero framework, fácil de manter)

## ▶️ Rodar local

```bash
npm install
npm run dev        # jogo com HMR
npm test           # 16 testes (regras + paleta)
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + bundle p/ dist/
```

## 🚀 Publicar no GitHub Pages

1. Suba este repo para o GitHub com branch `main`
2. Vá em Settings → Pages → Source: **GitHub Actions**
3. Dê push — o workflow `.github/workflows/deploy.yml` faz build e publica `dist/` automaticamente

> `vite.config.ts` usa `base: './'` então funciona com qualquer nome de repositório.
