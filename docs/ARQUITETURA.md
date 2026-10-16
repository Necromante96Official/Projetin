# Arquitetura — Reino Idle (memória da modularização)

> Como o código está organizado, o que importa de onde, e onde mexer.
> Stack: TypeScript estrito + Vite + Vitest, sem framework.

## Mapa de pastas

```text
src/
  main.ts                  entry fino (estilos + GameController.boot)
  vite-env.d.ts
  core/                    REGRAS DO JOGO — puro, sem DOM/canvas/storage
    types.ts               tipos canônicos (GameState, Horda, Inimigo, ...)
    data.ts                balanceamento (EQUIPS, SKILLS, LUGARES, REGRAS)
    state.ts               criarEstadoInicial + migrarSave (anti-NaN, saves antigos)
    combat.ts              parametrosCombate / poderCavaleiro / poderTime
    horde.ts               lugarDe, gerarHorda, simularHorda, avancarNivel
    shop.ts                custo/compra de equip + skills
    offline.ts             ouroPorMinuto, calcularGanhoOffline
    index.ts               barrel (import único do núcleo)
  engine/                  TEMPO REAL — canvas + relógio
    arena.ts               class Arena (spawn, combate, desenho, watchdog)
    scenario.ts            biomas, desenharCenario, partículas
  render/                  PIXEL ART — só fillRect/fillText arredondados
    pixel.ts               primitivas (R, V, shade, piramide, matriz, ...)
    palette.ts             PALETA fonte única + validarSprite + SPEC
    icons.ts               SVGs da UI + hidratarIcones
    sprites/
      shared.ts            poses + EquipVisual
      knight.ts            desenharCavaleiro (6 slots × 4 tiers)
      monsters.ts          TIPOS + desenharMonstro
      index.ts             barrel
  ui/                      DOM — única camada que toca document/localStorage
    dom.ts                 el(), fmt(), formatTempo()
    storage.ts             SAVE_KEY, carregar/salvar/apagar (via migrarSave)
    modal.ts               ModalManager (1 modal, chave p/ re-render)
    log.ts                 LogStore (log + mini-log + flash + dot Crônicas)
    views.ts               HTML puro dos modais (sem side-effect)
    hud.ts                 Hud.render(state) — espelha estado no DOM
    controller.ts          GameController — estado + timers + batalha + boot
  styles/                  CSS (base, layout, componentes)
test/
  game.test.ts             regras/loja/horda/save/offline
  palette.test.ts          paleta/spec/matriz/biomas
```

## Regras de dependência (não inverter)

```text
ui  →  core, engine, render
engine  →  core, render
render  →  core (só tipos)
core  →  nada (puro)
```

- `core/` nunca importa DOM, canvas, `localStorage` ou `document`.
- `engine/` nunca toca DOM fora do canvas.
- `ui/` é a única que toca `document`/`localStorage`/`setInterval`.
- Barris (`core/index.ts`, `render/sprites/index.ts`): importe do barrel,
  nunca pingue arquivos internos de outro módulo.

## Onde mexer (receitas)

| Quero… | Mexo em… | Testo com… |
|---|---|---|
| Rebalancear custo/atributo/skill/lugar | `core/data.ts` (+ `SKILL_MULT`) | `npm test` (sim Nv.1 vencível) |
| Mudar regra de combate | `core/combat.ts` + `core/horde.ts` **e** `engine/arena.ts` (mesmas REGRAS) | `npm test` + `npm run dev` visual |
| Novo tier visual | `render/sprites/knight.ts` + `core/data.ts` (nome/custo/atk/hp) | visual + `test/game` tiers |
| Novo monstro | `render/sprites/monsters.ts` (`TIPOS` + bloco `extra`) + `core/data.ts` (`LUGARES`) | `npm test` + arena |
| Novo bioma | `engine/scenario.ts` (`BIOMAS` + `novaParticula` + camadas) + `core/data.ts` lugar | visual |
| Novo modal/loja | `ui/views.ts` (HTML) + `ui/controller.ts` (wiring) | manual |
| Novo campo no save | `core/types.ts` + `core/state.ts` (default + migração) | `npm test` migração |

## Contratos travados

- Simulação (`core/horde.ts:simularHorda`) ≡ animação (`engine/arena.ts`): mesmos
  alcance, velocidade, intervalo, regen, spawn. Mudou um, muda o outro.
- Save: `migrarSave()` aceita modelo antigo (fase única, esquadrão, prédios) e
  corrompido (NaN → default). Nunca quebre sem migrar.
- Pixel art: só `fillRect` arredondado + `fillText`; paleta só de `palette.ts`
  (`validarSprite` acusa intrusa); luz sempre do topo.
- `Arena` nunca trava o jogo: watchdog interno + `forcarFim()` + `try/catch` no
  tick com `erro > 25 → resolve(erro)`. Controller tem vigia própria por run.

## Comandos

```bash
npm install
npm run dev        # jogo com HMR
npm test           # vitest (16 testes)
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + bundle p/ dist/ (GitHub Pages)
```
