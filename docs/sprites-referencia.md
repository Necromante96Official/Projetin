# Sprites — Referência Técnica (Reino Idle)

## 1. Onde mora cada coisa

| Arquivo | Papel |
|---|---|
| `src/render/pixel.ts` | Primitivas: `R`, `V`, `shade`, `mistura`, `comDir`, `pixelCirculo`, `elipsePixel`, `elipsePontos`, `piramide`, `quadradoVazado`, `ceuBandas`, `ditherLinha` + `desenharSpriteMatriz` |
| `src/render/palette.ts` | Paleta única + `validarSprite()` + specs de grade |
| `src/render/sprites/` | `knight.ts` (`desenharCavaleiro`), `monsters.ts` (`desenharMonstro` + `TIPOS`), `shared.ts` (poses) |
| `src/engine/scenario.ts` | `desenharCenario(ctx, bioma, volta, seed, t)` + `BIOMAS` + `novaParticula` |
| `src/engine/arena.ts` | Orquestra: spawn, poses (`lunge`/`swing`/`flash`/`caido`), HUD, FX |
| `src/render/icons.ts` | Ícones SVG da UI (não são sprites de batalha) |

## 2. Spec de grade

- Canvas lógico `480×270`, chão em `CHAO_Y=218`, cavaleiro em `PX=240`.
- Cavaleiro: ~17px altura lógica × `s=3.6` ≈ 61px na tela. Monstros: `h 10–19`
  × `u = s*0.85*mult`. Boss `esc=2.1`.
- Unidade `u = s` (cavaleiro) — todas as medidas são múltiplos de `u`.
- Espelhamento: `comDir(ctx, x, dir, fn)` — desenhe olhando `+x`, `dir=-1` espelha.
- Sombra de chão: `elipsePixel(ctx, xx, peY+2, rx, 3, '#000', 0.3)`.

### Contrato de desenho (não quebrar)

```ts
desenharCavaleiro(ctx, { x, peY, s, t, lunge, swing, flash, caido, dir, equip })
desenharMonstro(ctx, tipo, { x, peY, s, t, lunge, swing, flash, caido, dir, esc })
```

`equip = { elmo, camisa, calcas, botas, arma, escudo }`, tiers `0..3`.
Cada tier muda o visual (ver §4). `flash>0` = overlay branco; `caido` = alpha 0.55.

## 3. Cavaleiro — mapa visual por tier

| Slot | T0 | T1 | T2 | T3 |
|---|---|---|---|---|
| Elmo | cabelo `#5c3a21` + pele | capuz couro | ferro + pluma vermelha | dourado + pluma grande |
| Camisa | peito nu + cinto | pano `#c9b48a` | tabardo azul + ouro | ouro + roxo + faixa clara |
| Calças | pernas pele + farrapo | pano | malha ferro | placas ouro + faixa clara |
| Botas | descalço | couro | ferro escuro | veloz + friso ouro |
| Arma | graveto marrom | adaga cinza | espada longa clara | lâmina rúnica `#bfe9ff` + brilho |
| Escudo | sem | madeira + rebite | aço azul + cruz ouro | ouro + gema `#74c0fc` |

Ordem de desenho (pincel do programador): sombra → pernas → botas → torso
(+ombreiras T≥2) → escudo → cabeça → braço+arma (com `rotate`) → flash.

## 4. Monstros (`TIPOS`, 12 kinds)

| # | Nome | h | Pele | Roupa | Extra | Arma |
|---|---|---|---|---|---|---|
| 0 | Goblin | 12 | `#51cf66` | `#2f9e44` | orelhas | clava |
| 1 | Orc | 15 | `#2f9e44` | `#1e5c2e` | presas | clava |
| 2 | Lobo | 10 | `#59616b` | `#33393f` | quadrúpede, trote `sin(t*10)` | — |
| 3 | Esqueleto | 14 | `#e9e4da` | `#8a8578` | crânio, costelas | espada |
| 4 | Bandido | 13 | `#b197fc` | `#5f3dc4` | capuz + faixa vermelha | adaga |
| 5 | Troll | 19 | `#63a375` | `#3d6b4f` | barriga + bochechas | clavão |
| 6 | Morcego Sombrio | 8 | `#a78bfa` | `#5b3fa8` | asas animadas, voo | — |
| 7 | Aranha Gigante | 9 | `#6d4c9f` | `#3b2a5a` | 8 pernas, abdômen, teia | — |
| 8 | Golem de Gelo | 30 | `#a5d8ff` | `#4d7fa8` | corpo de pedra, núcleo e rachaduras | — |
| 9 | Espectro | 26 | `#9ae6c8` | `#2f6b57` | flutua, cauda esvoaçante, capuz | adaga |
| 10 | Cavaleiro Caído | 16 | `#5d6f88` | `#1c2333` | elmo fechado, ombreiras, runa | espada |
| 11 | Dragão Jovem | 34 | `#ff922b` | `#a63a0a` | asas, cauda, chifres, brasa | — |

Lugares: Campo Verde `[0,1,2]`, Floresta Sombria `[2,3,5]`, Caverna de Brasas
`[6,7,3]`, Pico Nevado `[8,2,3]`, Castelo Sombrio `[9,10,4]`, Ruínas Douradas
`[4,10,0]`, Pântano das Almas `[7,9,3]`, Abismo de Obsidiana `[11,6,7]` e
Cidadela Celeste `[8,9,10]`. Elites usam os mesmos kinds com escala 1.3 e coroa.

## 5. Cenário

`ceuBandas` (9 faixas) → astro pixelado (sol/lua via `pixelCirculo`) →
pássaros/nuvens em blocos → cordilheira `piramide` com seed → camada próxima
(pinheiros/estalagmites/torres) → `ditherLinha` no horizonte → chão em faixas +
grão → detalhes por clima → círculo da arena (`elipsePontos`) → tochas com
`quadradoVazado` → vinheta xadrez → volta>1 tinge `#780a28`.

Partículas (`novaParticula`): folhas, vagalumes (`twinkle`), brasas, neve, cinzas.

## 6. Como criar um sprite novo (2 caminhos)

### A) Procedural (padrão atual — recomendado para personagem/equip)

1. Defina medidas em múltiplos de `u`, luz do topo, cores só de `palette.ts`.
2. Use `R()` para massas, `V()` para volume, `comDir()` para direção.
3. Adicione `bob/passo` com `sin(t)` e `swing/lunge` para ataque.
4. Registre o spec na tabela do §3/§4 deste doc.

### B) Matriz (novo — recomendado para props/ícones/PJ pequenos)

```ts
import { desenharSpriteMatriz } from '../render/pixel.js';
const CORACAO = [
  '.XX.XX.',
  'XXXXXXX',
  'XXXXXXX',
  '.XXXXX.',
  '..XXX..',
  '...X...',
];
desenharSpriteMatriz(ctx, CORACAO, { X: '#e03131' }, x, y, 3);
```

`.` = transparente. Valide com `validarSprite(matriz, paletaOuLista)`.

## 7. Como adicionar um monstro novo

1. Acrescente em `TIPOS`: `{ h, pele, roupa, extra, arma }` (cores da paleta).
2. Implemente o `extra` em `desenharMonstro` (bloco `if (T.extra === '...')`).
3. Inclua o kind em `LUGARES` (`src/core/data.ts`) ou num lugar novo.
4. Teste: `npm run dev` → force o nível/lugar → confira barra de vida e `flash`.

## 8. Como adicionar um bioma novo

1. Acrescente em `BIOMAS` (`engine/scenario.ts`): `{ ceu:[topo,fundo], astro, longe, chaoA, chaoB, part }`.
2. Cubra `part` em `novaParticula` + camada próxima + detalhes do solo.
3. Registre o lugar em `LUGARES` (`core/data.ts`) apontando `bioma: '<id>'`.

## 9. Passada de detalhamento (2026-10-16, a partir de screenshot)

O que estava "chapado" e como foi corrigido (só `render/sprites/*`, `engine/scenario.ts`/`arena.ts`, sem mudar regras):

- **Cavaleiro T0:** rosto com olho (branco+pupila+brilho), sobrancelha, nariz, boca,
  orelha e sombra de queixo; torso com peitoral/abdômen/fivela; pernas com joelho
  e farrapo com remendo; braço de apoio + punho no graveto.
- **Monstros:** olhos com pupila em todos; goblin com sobrancelha/dente/brinco;
  orc com focinho; lobo com barriga clara/dorso eriçado/cauda com ponta; esqueleto
  com dentes separados e rachadura; capuz com fecho; troll com boca e verrugas.
  Todos com pés, braço de apoio e arma com mão+fio.
- **Cenário:** sol com halo em dither + raios (sem glow borrado); nuvens com
  barriga de sombra; montanhas com neve e luz/sombra lateral; pinheiros em 4
  camadas com volume; chão com terra 2 tons + flores/pedras/tufos; tochas sem
  caixas de glow (halo pontilhado); vinheta do céu removida (virava ruído).
- **Arena:** HP bars compactas verde→amarelo→vermelho com fundo; números com
  contorno duplo; sombras mais presentes; slash com núcleo.
