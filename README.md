# 🏰 Reino Idle

Jogo idle de gerenciamento medieval: **as batalhas são automáticas, você só administra.**

Mini protótipo jogável, em português, estilo minimalista limpo, pronto para GitHub Pages.

## 🎮 Como funciona o loop

1. A cada 3s seu cavaleiro luta sozinho contra uma horda (15× o nível; Nv.10 = BOSS).
   A cada 6 inimigos, a partir do Nv.3, surge um **elite** mais forte e mais rentável.
2. Vitória = ouro + bônus + próximo nível. Derrota = mantém o ouro de abates e tenta de novo.
   São 9 lugares, cada um com seu boss, do Campo Verde à Cidadela Celeste.
3. Você investe o ouro em:
   - 🎒 Equipamentos (6 slots × 4 tiers: elmo, camisa, calças, botas, arma, escudo)
   - ✨ Habilidades passivas (Afiado, Vigor, Regeneração, Rapidez, Saque, Fortuna e Tenacidade)
   - 🎒 Slots da mochila (600 no primeiro upgrade; depois 1,55× por passo)
   - ⚡ **Comprar acessível** compra as melhorias mais baratas de uma vez (QoL)
4. Save automático no `localStorage` + renda passiva + ganho offline (até 4h)
5. 👑 **Renascimento** (prestígio): ao limpar o primeiro bioma, troque lugar/nível/loja
   por **brasões** permanentes (+20% ataque/vida e +15% ouro por brasão). Cada volta
   recomeça mais forte e permite chegar mais longe.
6. 🎒 **Mochila**: monstros soltam itens em 5 raridades — Comum, Incomum, Raro,
   Ultra raro e Lendário — e 16 tipos (moeda, anel, colar, luva, pena, cantil, osso,
   pedra, broche, cristal, relíquia, gema, escama, mapa, grimório e troféu), cada um
   com ícone próprio. A chance normal é **40% + 1,5% por nível** (máx. 80%, ampliado
   por Fortuna) e, após 10 abates sem drop, o próximo é garantido. O BOSS solta 3
   itens, no mínimo um raro. Filtre por raridade, ordene por valor/raridade, venda um
   item, todos ou só os filtrados, configure a **auto-reciclagem** e amplie de 50 em
   50 slots até 1000. Mochila cheia vende o excedente sozinha. Renascer preserva a mochila.
7. 🔊 **Som procedural** (Web Audio, sem arquivos): efeitos para cliques, compras,
   golpes, drops, raridades, bosses, vitória/derrota, level up, prestígio, conquistas
   e ambiente por bioma. O botão **Som** no topo silencia/reativa e a escolha fica salva.
8. 🏅 **Conquistas**: 20 metas permanentes (vitórias, abates, bosses, elites, itens,
   equipamento, skills, renascimentos e ouro acumulado) pagam ouro e brasões uma única
   vez. O botão **Conquistas** mostra progresso, recompensas e recordes da jornada.

## 🏅 Conquistas e recordes

As conquistas não resetam no renascimento. Cada uma tem uma meta, uma barra de progresso
e uma recompensa única em ouro ou brasões; ao desbloquear, o jogo toca um som, registra
nas Crônicas e paga automaticamente. O modal também guarda recordes como ouro total
acumulado, chefes/elites derrotados, itens encontrados, lendários e maior progresso.

## 🎁 Drops e raridades

| Raridade | Chance normal | Chance BOSS | Valor base |
|---|---|---|---|
| Comum | 50% | 15% | 1× |
| Incomum | 29% | 30% | 2,4× |
| Raro | 13% | 30% | 6× |
| Ultra raro | 5,5% | 18% | 14× |
| Lendário | 2,5% | 7% | 38× |

O valor em ouro também cresce com o nível, o lugar e o tipo do item (0,8× a 1,5×).
BOSS sempre solta pelo menos um item raro.

## 🗂️ Arquitetura

Mapa completo em `docs/ARQUITETURA.md`. Resumo:

```text
src/core/     regras puras (tipos, balance, save, combate, horda, loja, inventário, offline, prestígio, conquistas)
src/engine/   tempo real (Arena + cenário)
src/audio/    efeitos e ambiente procedurais (Web Audio, sem assets)
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
npm test           # 53 testes (regras, prestígio, loja, inventário, elites, conquistas + paleta)
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + bundle p/ dist/
```

## 🚀 Publicar no GitHub Pages

1. Suba este repo para o GitHub com branch `main`
2. Vá em Settings → Pages → Source: **GitHub Actions**
3. Dê push — o workflow `.github/workflows/deploy.yml` faz build e publica `dist/` automaticamente

> `vite.config.ts` usa `base: './'` então funciona com qualquer nome de repositório.
