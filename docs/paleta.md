# Paleta Oficial — Reino Idle

> Fonte única: `src/render/palette.ts`. Este doc é espelho legível.
> **Regra: sprite novo só usa cor daqui.** Cor fora da paleta = rejeitado em review
> (`validarSprite()` em `src/render/palette.ts` acusa).

## Rampas (hue-shift aplicado: sombra esfria, luz esquenta)

### Pele (4)
| Uso | Hex |
|---|---|
| Luz | `#f1c27d` |
| Sombra quente | `#d9a066` |
| Cabelo | `#5c3a21` |
| Contorno pele | `#6b5433` / `#7a6238` |

### Metal armadura (4)
| Uso | Hex |
|---|---|
| Base | `#8fa3bd` |
| Escuro/contorno | `#5d6f88` |
| Profundo | `#39424f` / `#1c2333` |
| Brilho | `#dfe8ee` → `#ffffff` |

### Ouro/divino (4)
| Uso | Hex |
|---|---|
| Base | `#e8b34a` |
| Luz | `#fff3bf` |
| Sombra | `#8a6414` |
| Fogo claro | `#ffd43b` |

### Tecido/roupa (4)
| Uso | Hex |
|---|---|
| Pano claro | `#c9b48a` |
| Pano escuro | `#8a7a5c` / `#6b5f45` |
| Tabardo azul | `#3f8cff` |
| Túnica roxa | `#c2255c` |

### Couro/madeira (4)
| Uso | Hex |
|---|---|
| Claro | `#9a8a70` / `#8a6d3b` |
| Base | `#6b5433` / `#6b4a2f` |
| Escuro | `#5c4a2f` / `#3a2f1e` |
| Noite | `#2b2118` |

### Monstros (rampas por tipo)
| Monstro | Pele | Roupa |
|---|---|---|
| Goblin | `#51cf66` | `#2f9e44` |
| Orc | `#2f9e44` | `#1e5c2e` |
| Lobo | `#59616b` | `#33393f` |
| Esqueleto | `#e9e4da` | `#8a8578` |
| Bandido/capuz | `#b197fc` | `#5f3dc4` |
| Troll | `#63a375` | `#3d6b4f` |
| Morcego | `#a78bfa` | `#5b3fa8` |
| Aranha | `#6d4c9f` | `#3b2a5a` |
| Golem de gelo | `#a5d8ff` | `#4d7fa8` |
| Espectro | `#9ae6c8` | `#2f6b57` |
| Cavaleiro caído | `#5d6f88` | `#1c2333` |
| Dragão | `#ff922b` | `#a63a0a` |

### FX/UI
| Uso | Hex |
|---|---|
| Dano player | `#ffd43b` |
| Dano recebido | `#ff8787` / `#e03131` |
| Ouro texto | `#e8b34a` |
| Vida boss | `#ff6b6b` |
| Cura/buff | `#8ce99a` / `#51cf66` |
| Olho/escuro | `#241f26` |

## Regras de uso

1. **3–5 tons por material**, nunca 20 marrons parecidos.
2. Sombra = cor base via `shade(c, 0.62)` (já puxa pro azul); luz = `shade(c, 1.35)`.
3. Outline: tom mais escuro **da própria rampa** (selout) ou `#1c2333` em herói.
4. Specular: 1–2px, cor mais clara da rampa (`#fff3bf`/`#ffffff`), só em metal/vidro.
5. Sem pixel semi-transparente em borda externa (sombra de chão usa `elipsePixel`
   com alpha — única exceção autorizada).
6. Pele sem dithering; pedra/terreno pode dither xadrez entre adjacentes.

## Como adicionar cor nova

1. Prove que nenhuma rampa cobre o caso (teste no fundo claro+escuro).
2. Adicione em `src/render/palette.ts` com nome + `USO`.
3. Atualize este doc.
4. Rode o jogo e confira `validarSprite()`.
