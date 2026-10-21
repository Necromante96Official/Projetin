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
    data.ts                balanceamento (EQUIPS, SKILLS, LUGARES, REGRAS, itens)
    state.ts               criarEstadoInicial + migrarSave (anti-NaN, saves antigos)
    combat.ts              parametrosCombate / poderCavaleiro / poderTime
    horde.ts               lugarDe, gerarHorda, simularHorda, avancarNivel
    shop.ts                custo/compra de equip + skills + compra acessível
    prestige.ts            brasoesDisponiveis, podeRenascer, renascer
    inventory.ts           drops por tipo/raridade, pity, mochila, auto-reciclagem, upgrade
    offline.ts             ouroPorMinuto, calcularGanhoOffline
    achievements.ts        metas, progresso permanente e recompensas únicas
    missions.ts            3 missões diárias determinísticas, progresso e bônus
    index.ts               barrel (import único do núcleo)
  engine/                  TEMPO REAL — canvas + relógio
    arena.ts               class Arena (spawn, combate, desenho, watchdog, onSfx)
    scenario.ts            biomas, desenharCenario, partículas
  audio/                   SOM — Web Audio procedural, sem assets
    sfx.ts                 Sfx: efeitos, ambiente por bioma e mute persistido
  render/                  PIXEL ART — só fillRect/fillText arredondados
    pixel.ts               primitivas (R, V, shade, piramide, matriz, ...)
    palette.ts             PALETA fonte única + validarSprite + SPEC
    icons.ts               SVGs da UI + 16 ícones de item + hidratarIcones
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
  game.test.ts             regras/loja/horda/save/offline/prestígio/inventário/itens/conquistas/missões
  palette.test.ts          paleta/spec/matriz/biomas
```

## Regras de dependência (não inverter)

```text
ui  →  core, engine, render, audio
engine  →  core, render
render  →  core (só tipos)
audio  →  nada (Web Audio puro)
core  →  nada (puro)
```

- `core/` nunca importa DOM, canvas, `localStorage` ou `document`.
- `engine/` nunca toca DOM fora do canvas.
- `ui/` é a única que toca `document`/`localStorage`/`setInterval` e orquestra o áudio.
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
| Novo som/evento | `audio/sfx.ts` (`SomEvento` + `tocar`) + `ui/controller.ts` (disparo) | manual + mute |
| Novo elite | `core/data.ts` (`ELITE`) + `core/horde.ts` + `engine/arena.ts` visual | `npm test` horda |
| Balancear renascimento | `core/data.ts` (`PRESTIGIO`) + `core/prestige.ts` (fórmula) | `npm test` + simulação |
| Balancear drops/mochila | `core/data.ts` (`RARIDADE_INFO`, `TIPOS_ITEM`, `INVENTARIO`) + `core/inventory.ts` | `npm test` inventário |
| Adicionar visual de item | `core/types.ts` (`ItemTipo`) + `core/data.ts` (`TIPOS_ITEM`) + `render/icons.ts` | `npm test` catálogo + modal |
| Nova conquista | `core/types.ts` (`ConquistaId`) + `core/data.ts` (`CONQUISTAS`) + `core/achievements.ts` (progresso) | `npm test` conquistas |
| Nova missão diária | `core/types.ts` (`MissaoTipo`) + `core/data.ts` (`MISSOES`) + `core/missions.ts` + contador no `ui/controller.ts` | `npm test` missões |
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
- Prestígio: `core/prestige.ts` é a única regra de reset. `PRESTIGIO` fica em
  `data.ts`; `combat.ts` aplica os multiplicadores (stats e ouro) e o save migra
  `brasoes`/`renascimentos` com teto. Renascer preserva vitórias/derrotas/abates.
- Inventário: `core/inventory.ts` é a única regra de drops/venda/upgrade. O rng é
  injetável (testes determinísticos). `RARIDADE_INFO`, `TIPOS_ITEM` e `INVENTARIO`
  ficam em `data.ts`; `state.ts` sanitiza capacidade em passos de 50, itens (tipo
  inferido em saves antigos), auto-reciclagem e o contador de pity. `rolarDrops`
  atualiza `inventario.semDrops`: 10 abates secos garantem o próximo drop; BOSS
  reseta o pity e garante ao menos um raro. `listarInventario` filtra/ordena sem
  mutar a mochila; `venderItensPorRaridade` vende um lote exato. Renascer preserva
  mochila, capacidade, pity e configuração de auto-reciclagem.
- Áudio: `engine/arena.ts` só emite `onSfx` (golpe/dano/abate/elite/boss); quem
  toca é `ui/controller.ts` via `Sfx`. AudioContext é criado sob demanda e só
  inicia após gesto do usuário; a preferência de mute fica em `ui/storage.ts`
  (`reino-idle-som`).
- Conquistas: `core/achievements.ts` é a única regra de progresso/recompensa.
  `CONQUISTAS` e `ORDEM_CONQUISTAS` ficam em `data.ts`; `state.ts` sanitiza
  `estatisticas`/`conquistas` e credita progresso de saves antigos. O controller
  chama `desbloquearConquistas` após batalhas, compras, vendas, renascimento e
  boot, paga ouro/brasões uma única vez e registra nas Crônicas. Renascer preserva
  conquistas, recordes e contadores permanentes.
- Missões diárias: `core/missions.ts` é a única regra de sorteio/progresso/bônus.
  `MISSOES`, `ORDEM_MISSOES` e `MISSOES_BONUS` ficam em `data.ts`; a data local
  (`YYYY-MM-DD`) é calculada no controller e passada para `garantirMissoes`, mantendo
  o core puro. O progresso zera na troca de dia; `state.ts` sanitiza o bloco e
  `processarMissoes` paga cada meta e o bônus uma única vez. Renascer preserva o
  progresso do dia.

## Comandos

```bash
npm install
npm run dev        # jogo com HMR
npm test           # vitest (59 testes)
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + bundle p/ dist/ (GitHub Pages)
```
