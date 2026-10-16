// ui/hud.ts — espelha o GameState no DOM (topbar, herói, lugar, previsão, paperdoll).
// Puro no sentido de UI: lê o estado, escreve no DOM, não muta o jogo.

import {
  EQUIPS,
  MAX_TIER,
  ORDEM_SKILLS,
  ORDEM_SLOTS,
  ehBoss,
  gerarHorda,
  lugarDe,
  parametrosCombate,
  poderTime,
  simularHorda,
  totalTiersEquip,
  voltaDe,
  type GameState,
} from '../core/index.js';
import { ICONS, hidratarIcones } from '../render/icons.js';
import { el, fmt } from './dom.js';
import { pips } from './modal.js';
import { ICONE_SLOT } from './views.js';

export interface HudHandlers {
  onSlotClick: () => void;
}

export class Hud {
  render(state: GameState, handlers: HudHandlers): void {
    const time = poderTime(state);
    const p = parametrosCombate(state);
    const cav = state.cavaleiro;
    const l = lugarDe(state.lugar);
    const v = voltaDe(state.lugar);
    const boss = ehBoss(state.nivel);
    const h = gerarHorda(state);
    const sim = simularHorda(state);

    el('ouro').textContent = fmt(state.ouro);
    const faseEl = el('fase');
    faseEl.textContent = `${l.nome.split(' ')[0]} ${state.nivel}/10${v > 1 ? ` V${v}` : ''}`;
    faseEl.title = `${l.nome} • ${state.nivel}/10${v > 1 ? ` • V${v}` : ''}`;
    el('vitorias').textContent = fmt(state.vitorias);
    el('derrotas').textContent = fmt(state.derrotas || 0);

    el('nome-cavaleiro').textContent = `${cav.nome}`;
    el('poder-time').innerHTML = `${ICONS.swords} ${fmt(time.atk)} atk • ${ICONS.heart} ${fmt(time.hp)} vida`;
    el('hp-aliado-num').textContent = `${fmt(time.hp)} HP • ${totalTiersEquip(state)}/18 peças`;

    el('lugar-nome').textContent = `${l.nome}${v > 1 ? ` (V${v})` : ''}`;
    el('lugar-info').textContent = boss ? `☠ BOSS: ${l.bossNome}` : `Nv. ${state.nivel}/10 • ${h.total} inimigos`;

    el('bioma').textContent = `📍 ${l.nome}${v > 1 ? ` — Volta ${v}` : ''}`;
    el('versus-nivel').textContent = boss ? '☠ BOSS' : `Nv. ${state.nivel}/10`;

    const porAbate = h.inimigos[0].gold;
    el('previsao').innerHTML = `
      <div class="linha-stat"><span>Abates</span><b>${boss ? '1 chefão' : `${h.total} × ${ICONS.coin}${porAbate}`}</b></div>
      <div class="linha-stat"><span>Bônus ao limpar</span><b>${ICONS.coin} +${fmt(h.bonus)}</b></div>
      <div class="prognostico ${sim.venceu ? 'fav' : 'risco'}">${sim.venceu ? `▲ Deve limpar (~${Math.round(sim.tempo)}s)` : '▼ Vai cair — equipe antes!'}</div>
    `;

    const atkBase = fmt(cav.atk);
    const hpBase = fmt(cav.hp);
    const vel = (1 / p.intervalo).toFixed(1);
    el('herois').innerHTML = `
      <div class="heroi"><span>${ICONS.swords} ${atkBase} base</span></div>
      <div class="heroi"><span>${ICONS.heart} ${hpBase} base</span></div>
      <div class="heroi"><span>⚡ ${vel}/s</span></div>`;

    const doll = el('paperdoll');
    doll.innerHTML = ORDEM_SLOTS.map((slot) => {
      const t = state.equip[slot] ?? 0;
      const prox = t < MAX_TIER ? EQUIPS[slot].tiers[t + 1] : null;
      const acessivel = prox && state.ouro >= prox.custo;
      return `
      <div class="slot ${acessivel ? 'acessivel' : ''}" data-slot="${slot}" title="${EQUIPS[slot].nome}: ${EQUIPS[slot].tiers[t].nome}${prox ? ` → ${prox.nome} (${fmt(prox.custo)})` : ' (MAX)'}">
        <span data-ic="${ICONE_SLOT[slot]}"></span>
        <small>${EQUIPS[slot].nome}</small>
        ${pips(t, MAX_TIER)}
      </div>`;
    }).join('');
    doll.querySelectorAll('[data-slot]').forEach((s) => {
      (s as HTMLElement).onclick = handlers.onSlotClick;
    });

    hidratarIcones();

    // garante que skills extras futuras não quebrem o HUD silenciosamente
    void ORDEM_SKILLS;
  }
}
