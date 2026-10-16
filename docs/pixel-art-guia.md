# Guia de Pixel Art — Reino Idle

> Referência oficial de arte do projeto. Vale para `src/render/pixel.ts`, `src/render/sprites/`,
> `src/engine/scenario.ts` e todo sprite futuro. Em PT-BR, direto ao ponto.

## 1. Decisões travadas (não mudar sem discutir)

| Item | Valor no projeto | Por quê (pesquisa 2026) |
|---|---|---|
| Resolução interna | `480×270` (`W`, `H` em `render/pixel.ts`) | 16:9, escala por inteiros até 1080p/4K sem mixels |
| Render | Canvas 480×270 com CSS `image-rendering: pixelated` + `ctx.imageSmoothingEnabled = false` | Pixel nítido, sem blur bilinear |
| Primitiva | **Só `fillRect` com `Math.round()` + `fillText`** | Evita anti-aliasing de `arc/ellipse/gradient/stroke` curvo |
| Luz | **Sempre do topo** (`V()` = faixa clara 1px em cima, sombra embaixo) | Consistência entre cavaleiro, monstros e cenário |
| Outline | 1px escuro seletivo (`sel-out` via `shade()`) ou contorno da cor mais escura da rampa — nunca preto puro chapado em tudo | Separa do fundo sem achatar (técnica *selout*) |
| Escala | Fator `s ≈ 3.6` na arena, coordenadas sempre arredondadas | Sem shimmer ao mover; sem sub-pixel |
| Paleta | `src/render/palette.ts` é a fonte única (~32 cores). Ver `docs/paleta.md` | Paleta curta = coesão; 16–32 cores é o padrão indie |

Fontes: SpriteLab (grid + paleta + nearest-neighbour), Pixeli (luz fixa + hue-shift),
MDN Crisp Pixel Art (`image-rendering: pixelated`, coordenadas inteiras),
Slynyrd Pixelblog 8/55/56 (idle/walk/attack, timing por frame).

## 2. Pipeline de um sprite novo (ordem obrigatória)

1. **Silhueta primeiro** — bloco chapado, 1 cor. Teste: preencha de preto, reconhece a 1×?
2. **Cores chapadas (flats)** — 1 cor base por material, só cores de `palette.ts`.
3. **1 sombra** — lado oposto à luz (para baixo, já que a luz é do topo).
4. **1 luz** — faixa de 1px no topo (`V()` faz isso).
5. **Detalhe mínimo** — olhos/mãos/arma primeiro; resto só se ler a 1×.
6. **Teste em jogo** — fundo claro E escuro, parado E andando, com `flash` de dano.

> Não faça: decorar antes da silhueta, pillow shading (sombra em volta toda),
> banding (faixas paralelas), AA com alpha nas bordas externas.

## 3. Curvas, clusters e dithering

- **Curvas limpas:** progressão de runs `4,3,2,1` — sem degraus aleatórios.
- **Clusters:** blocos contínuos ≥ 2px nas áreas principais; sem pixel órfão.
- **Dithering:** só em área grande (céu/chão, 32px+), padrão xadrez `bayer`, entre
  cores **adjacentes** da rampa. Nunca em sprite 16px.
- **Hue-shift:** sombra esfria (puxa pro azul/roxo), luz esquenta (puxa pro amarelo).
  Ex.: vermelho `#c04030` → sombra `#8a2f45` (fria), não `#802b20` (mesma matiz escura).

## 4. Animação (o que o projeto usa hoje)

O projeto anima **proceduralmente** (senos + `lunge`/`swing`), não por frames.
Regras vindas da pesquisa, já aplicadas em `engine/arena.ts`/`render/sprites/`:

| Ciclo | Frames/tempo | Regra |
|---|---|---|
| Idle/breath | `bob = sin(t*4)*0.6` | 1–2px vertical, cabelo/pluma com atraso (`sin(t*6)`) |
| Walk | `passo = sin(t*4)` alternando pernas | Contato passa + rising no *pass*; sem pogo vertical |
| Attack | `swing 0→1` em ~0.55s, `lunge` até 14px | Antecipação curta (player ≤50ms), 1 frame de *smear* (anel pontilhado), *hold* no impacto, overshoot 1px |
| Hit | `flash 1→0` + `shake` 3–5px + número flutuante | Flash branco ≤0.32 alpha, congela 50–200ms conforme peso |
| Death | `caido` + `globalAlpha 0.55` + `dieT 0.45s` | Cair → ceder → deitar → segurar pose final |

Timing de referência: idle 200–400ms, walk 100–150ms, run 60–100ms,
strike 40–60ms + hold 100–200ms, recovery > strike.

Quando migrar para sprites em matriz/frames (ver `render/pixel.ts: desenharSpriteMatriz`),
usar a mesma tabela de timing com durações **desiguais** por frame.

## 5. Checklist de aceite (todo sprite novo passa por isso)

- [ ] Só cores de `src/render/palette.ts`? (`validarSprite()` acusa intrusa)
- [ ] Silhueta legível em preto sólido a 1×?
- [ ] Luz só do topo, sem pillow shading?
- [ ] Outline 1px consistente (todo ou selout, nunca misto)?
- [ ] Coordenadas arredondadas, sem `arc/ellipse/gradient`?
- [ ] Testado em fundo claro + escuro e em movimento?
- [ ] Pivô no mesmo ponto anatômico entre estados (pé de apoio)?

## 6. Ferramentas recomendadas

- **Desenho:** Aseprite / LibreSprite (timeline + onion skin + export sheet+JSON).
- **Paleta:** Lospec (PICO-8, DawnBringer 32, Endesga 32 como ponto de partida).
- **Validação:** `npm test` (lógica) + inspeção visual na arena em `npm run dev`.
- **Export futuro:** sheet em grade fixa + JSON `{frame, duração, pivô}`, filtro
  `point/nearest`, sem mipmap/compressão, padding 2px entre frames.

## 7. Para saber mais (links pesquisados)

- SpriteLab — How to Make Pixel Art Sprites for Games (grid, paleta, scaling)
- Pixeli — Shading and light / Animation / Attacks and impacts
- MDN — Crisp pixel art look with image-rendering + Optimizing canvas
- Slynyrd Pixelblog 8 (intro animação), 55 (top-down char), 56 (attacks)
- CrieSeusJogos — Guia Completo de Pixel Art 2026 (silhueta → luz → volume → detalhe)
