// ui/hud.ts — espelha o GameState no DOM (topbar, herói, lugar, previsão, paperdoll).
// Puro no sentido de UI: lê o estado, escreve no DOM, não muta o jogo.

import {
  EQUIPS,
  MAX_PECAS,
  MAX_TIER,
  MISSOES,
  ORDEM_CONQUISTAS,
  ORDEM_SKILLS,
  ORDEM_SLOTS,
  RARIDADE_INFO,
  TIPOS_ITEM,
  brasoesDisponiveis,
  chanceDropNormal,
  custoProximaMelhoria,
  ehBoss,
  indiceRaridade,
  lugarDe,
  missoesConcluidas,
  parametrosCombate,
  simularHorda,
  totalTiersEquip,
  voltaDe,
  type GameState,
  type ItemInventario,
} from '../core/index.js';
import { ICONS, hidratarIcones, iconeItem } from '../render/icons.js';
import { el, fmt } from './dom.js';
import { pips } from './modal.js';
import { ICONE_SLOT } from './views.js';

export interface HudHandlers {
  onSlotClick: () => void;
}

export class Hud {
  private cache: {
    chave: string;
    sim: ReturnType<typeof simularHorda>;
    p: ReturnType<typeof parametrosCombate>;
  } | null = null;
  private dollHtml = '';
  private heroisHtml = '';

  render(state: GameState, handlers: HudHandlers, hpAtual: number | null = null): void {
    const cav = state.cavaleiro;
    const chave = [
      state.lugar,
      state.nivel,
      state.brasoes,
      ...ORDEM_SLOTS.map((s) => state.equip[s] ?? 0),
      ...ORDEM_SKILLS.map((s) => state.skills[s] ?? 0),
      cav.atk,
      cav.hp,
    ].join('|');
    let cache = this.cache;
    if (!cache || cache.chave !== chave) {
      cache = {
        chave,
        sim: simularHorda(state),
        p: parametrosCombate(state),
      };
      this.cache = cache;
    }
    const sim = cache.sim;
    const p = cache.p;
    const time = { atk: p.atk, hp: p.hp };
    const l = lugarDe(state.lugar);
    const v = voltaDe(state.lugar);
    const boss = ehBoss(state.nivel);
    const h = sim.horda;

    el('ouro').textContent = fmt(state.ouro);
    const faseEl = el('fase');
    faseEl.textContent = `${l.nome.split(' ')[0]} ${state.nivel}/10${v > 1 ? ` V${v}` : ''}`;
    faseEl.title = `${l.nome} • ${state.nivel}/10${v > 1 ? ` • V${v}` : ''}`;
    el('vitorias').textContent = fmt(state.vitorias);
    el('derrotas').textContent = fmt(state.derrotas || 0);
    el('conquistas-label').textContent =
      `${fmt(state.conquistas.length)}/${fmt(ORDEM_CONQUISTAS.length)}`;

    const missoes = state.missoes;
    const feitasMissoes = missoesConcluidas(state);
    el('missoes-contador').textContent = `${fmt(feitasMissoes)}/${fmt(missoes.tipos.length)}`;
    const pendente = missoes.tipos.find((tipo) => !missoes.concluidas.includes(tipo));
    el('missoes-resumo').textContent =
      missoes.tipos.length === 0
        ? 'Preparando os objetivos do dia...'
        : pendente
          ? `Próxima: ${MISSOES[pendente].nome} (${fmt(missoes.progresso[pendente] ?? 0)}/${fmt(MISSOES[pendente].meta)})`
          : 'Bônus do dia resgatado. Novos objetivos à meia-noite.';

    const renascerLabel = el('renascer-label');
    renascerLabel.textContent =
      state.brasoes > 0 ? `👑 ${fmt(state.brasoes)} brasões` : '👑 Renascer';
    el('renascer-dot').classList.toggle('hidden', brasoesDisponiveis(state) <= 0);

    const btnAuto = el('btn-auto-comprar') as HTMLButtonElement;
    const proximo = custoProximaMelhoria(state);
    const podeAuto = proximo != null && proximo <= state.ouro;
    btnAuto.disabled = !podeAuto;
    btnAuto.textContent = podeAuto
      ? `⚡ Comprar acessível (${fmt(proximo as number)})`
      : '⚡ Comprar acessível';

    el('nome-cavaleiro').textContent = `${cav.nome}`;
    el('poder-time').innerHTML = `${ICONS.swords} ${fmt(time.atk)} atk • ${ICONS.heart} ${fmt(time.hp)} vida`;
    const pecas = totalTiersEquip(state);
    const hpMostrado = hpAtual == null ? time.hp : Math.max(0, Math.min(time.hp, hpAtual));
    (el('hp-aliado') as HTMLElement).style.width =
      `${time.hp > 0 ? (hpMostrado / time.hp) * 100 : 0}%`;
    el('hp-aliado-num').textContent = `${fmt(hpMostrado)}/${fmt(time.hp)} HP • ${pecas}/${MAX_PECAS} peças`;

    el('lugar-nome').textContent = `${l.nome}${v > 1 ? ` (V${v})` : ''}`;
    el('lugar-info').textContent = boss ? `☠ BOSS: ${l.bossNome}` : `Nv. ${state.nivel}/10 • ${h.total} inimigos`;

    el('bioma').textContent = `📍 ${l.nome}${v > 1 ? ` — Volta ${v}` : ''}`;
    el('versus-nivel').textContent = boss ? '☠ BOSS' : `Nv. ${state.nivel}/10`;

    const inv = state.inventario;
    let melhor: ItemInventario | null = null;
    for (const item of inv.itens) {
      if (
        melhor == null ||
        indiceRaridade(item.raridade) > indiceRaridade(melhor.raridade) ||
        (item.raridade === melhor.raridade && item.valor > melhor.valor)
      ) {
        melhor = item;
      }
    }
    const chance = (chanceDropNormal(state) * 100).toLocaleString('pt-BR', {
      maximumFractionDigits: 1,
    });
    el('mochila-contador').textContent = `${inv.itens.length}/${inv.capacidade}`;
    (el('mochila-fill') as HTMLElement).style.width =
      `${inv.capacidade > 0 ? (inv.itens.length / inv.capacidade) * 100 : 0}%`;
    const resumo = el('mochila-resumo');
    if (!melhor) {
      resumo.textContent = `Vazia — ${chance}% de drop por abate.`;
    } else {
      const info = RARIDADE_INFO[melhor.raridade];
      const tipo = TIPOS_ITEM[melhor.tipo]?.nome ?? 'Item';
      resumo.innerHTML = `Melhor: <span class="mochila-melhor raridade-${melhor.raridade}">${iconeItem(melhor.tipo)} ${melhor.nome}</span><br><span class="mi-tipo">${tipo} • ${info.nome}${
        inv.autoReciclar ? ` • ♻ até ${RARIDADE_INFO[inv.autoReciclar].nome}` : ''
      }</span>`;
    }

    const porAbate = h.inimigos[0]?.gold ?? 0;
    el('previsao').innerHTML = `
      <div class="linha-stat"><span>Abates</span><b>${boss ? '1 chefão' : `${h.total} × ${ICONS.coin}${porAbate}`}</b></div>
      <div class="linha-stat"><span>Bônus ao limpar</span><b>${ICONS.coin} +${fmt(h.bonus)}</b></div>
      <div class="prognostico ${sim.venceu ? 'fav' : 'risco'}">${sim.venceu ? `▲ Deve limpar (~${Math.round(sim.tempo)}s)` : '▼ Vai cair — equipe antes!'}</div>
    `;

    const atkBase = fmt(cav.atk);
    const hpBase = fmt(cav.hp);
    const vel = (1 / p.intervalo).toFixed(1);
    const heroisHtml = `
      <div class="heroi"><span>${ICONS.swords} ${atkBase} base</span></div>
      <div class="heroi"><span>${ICONS.heart} ${hpBase} base</span></div>
      <div class="heroi"><span>⚡ ${vel}/s</span></div>`;
    if (heroisHtml !== this.heroisHtml) {
      this.heroisHtml = heroisHtml;
      el('herois').innerHTML = heroisHtml;
    }

    const doll = el('paperdoll');
    const dollHtml = ORDEM_SLOTS.map((slot) => {
      const t = state.equip[slot] ?? 0;
      const prox = t < MAX_TIER ? EQUIPS[slot].tiers[t + 1] : null;
      const acessivel = prox && state.ouro >= prox.custo;
      return `
      <div class="slot ${acessivel ? 'acessivel' : ''}" data-slot="${slot}" role="button" tabindex="0" title="${EQUIPS[slot].nome}: ${EQUIPS[slot].tiers[t].nome}${prox ? ` → ${prox.nome} (${fmt(prox.custo)})` : ' (MAX)'}">
        <span data-ic="${ICONE_SLOT[slot]}"></span>
        <small>${EQUIPS[slot].nome}</small>
        ${pips(t, MAX_TIER)}
      </div>`;
    }).join('');
    if (dollHtml !== this.dollHtml) {
      this.dollHtml = dollHtml;
      doll.innerHTML = dollHtml;
      doll.querySelectorAll('[data-slot]').forEach((s) => {
        const node = s as HTMLElement;
        node.onclick = handlers.onSlotClick;
        node.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handlers.onSlotClick();
          }
        };
      });
      hidratarIcones(doll);
    }
  }
}
