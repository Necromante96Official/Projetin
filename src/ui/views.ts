// ui/views.ts — construtores de HTML dos modais (puros, sem side-effects).
// O wiring dos botões (comprar) fica no controller; aqui só o markup.
// Textos preservados 1:1 do main.js original.

import {
  EQUIPS,
  LUGARES,
  MAX_PECAS,
  MAX_SKILL,
  MAX_TIER,
  ORDEM_SKILLS,
  ORDEM_SLOTS,
  SKILLS,
  ehBoss,
  lugarDe,
  parametrosCombate,
  totalInimigos,
  totalTiersEquip,
  voltaDe,
  type EquipSlot,
  type GameState,
} from '../core/index.js';
import { ICONS } from '../render/icons.js';
import { fmt } from './dom.js';
import { pips, stat } from './modal.js';

export const ICONE_SLOT: Record<EquipSlot, string> = {
  elmo: 'elmo',
  camisa: 'camisa',
  calcas: 'calca',
  botas: 'bota',
  arma: 'adaga',
  escudo: 'escudoR',
};

export function cavaleiroHtml(state: GameState): { titulo: string; html: string } {
  const cav = state.cavaleiro;
  const p = parametrosCombate(state);
  const pecas = totalTiersEquip(state);
  const sk = ORDEM_SKILLS.reduce((s, id) => s + (state.skills[id] ?? 0), 0);
  return {
    titulo: `🛡️ ${cav.nome}`,
    html: `
    ${stat('Ataque', `${ICONS.swords} ${fmt(p.atk)}`)}
    ${stat('Vida', `${ICONS.heart} ${fmt(p.hp)}`)}
    ${stat('Velocidade', `${(1 / p.intervalo).toFixed(1)} golpes/s`)}
    ${stat('Regeneração', `${p.regen.toFixed(1)}/s`)}
    ${stat('Peças equipadas', `${pecas}/${MAX_PECAS}`)}
    ${stat('Skills', `${sk} níveis`)}
    <p class="hint" style="margin-top:10px">Ele segura o centro sozinho. Fortaleça com equipamentos e habilidades.</p>
  `,
  };
}

export function lugarHtml(state: GameState): { titulo: string; html: string } {
  const l = lugarDe(state.lugar);
  const v = voltaDe(state.lugar);
  const boss = ehBoss(state.nivel);
  return {
    titulo: `📍 ${l.nome}`,
    html: `
    ${stat('Nível', `${state.nivel}/10`)}
    ${stat('Volta', v > 1 ? `Volta ${v} (reino corrompido)` : 'Volta 1')}
    ${stat('Inimigos', boss ? `BOSS: ${l.bossNome}` : `${totalInimigos(state.nivel)} na horda`)}
    ${stat('Lugares criados', `${LUGARES.length} de ∞ (volta e repete mais forte)`)}
    <p class="hint" style="margin-top:10px">Limpe o Nv.10 (boss) para desbloquear o próximo lugar.</p>
  `,
  };
}

export function equipamentosHtml(state: GameState): { titulo: string; html: string } {
  const bonusTxt = (a: number, h: number): string =>
    `${a ? `+${a} atk ` : ''}${h ? `+${h} vida` : ''}`.trim() || '—';
  const linhas = ORDEM_SLOTS.map((slot) => {
    const t = state.equip[slot] ?? 0;
    const atual = EQUIPS[slot].tiers[t];
    const prox = t < MAX_TIER ? EQUIPS[slot].tiers[t + 1] : null;
    const custo = prox ? prox.custo : null;
    const pode = custo != null && state.ouro >= custo;
    return `
    <div class="item ${pode ? 'pode-comprar' : ''}">
      <div class="item-top">
        <div class="item-icone" data-ic="${ICONE_SLOT[slot]}"></div>
        <div>
          <div class="item-nome">${EQUIPS[slot].nome} ${pips(t, MAX_TIER)}</div>
          <div class="item-desc">${atual.nome}${prox ? ` → <b>${prox.nome}</b> (${bonusTxt(prox.atk, prox.hp)})` : ' (máximo)'}</div>
        </div>
      </div>
      ${prox ? `<button class="btn-buy" data-eq="${slot}" ${pode ? '' : 'disabled'}>${ICONS.coin} ${fmt(custo as number)}</button>` : `<span class="nivel-pill">MAX</span>`}
    </div>`;
  }).join('');
  return {
    titulo: '🎒 Equipamentos',
    html: `
    <p class="hint">Ouro atual: ${ICONS.coin} <b>${fmt(state.ouro)}</b> — peças mudam o visual na arena.</p>
    <div class="loja">${linhas}</div>
  `,
  };
}

export function skillsHtml(state: GameState): { titulo: string; html: string } {
  const linhas = ORDEM_SKILLS.map((id) => {
    const nv = state.skills[id] ?? 0;
    const custo = nv >= MAX_SKILL ? null : SKILLS[id].base * (nv + 1);
    const pode = custo != null && state.ouro >= custo;
    return `
    <div class="item ${pode ? 'pode-comprar' : ''}">
      <div class="item-top">
        <div class="item-icone" data-ic="skill"></div>
        <div>
          <div class="item-nome">${SKILLS[id].nome} ${pips(nv, MAX_SKILL)}</div>
          <div class="item-desc">${SKILLS[id].desc}</div>
        </div>
      </div>
      ${custo != null ? `<button class="btn-buy" data-sk="${id}" ${pode ? '' : 'disabled'}>${ICONS.coin} ${fmt(custo)}</button>` : `<span class="nivel-pill">MAX</span>`}
    </div>`;
  }).join('');
  return {
    titulo: '✨ Habilidades',
    html: `
    <p class="hint">Ouro atual: ${ICONS.coin} <b>${fmt(state.ouro)}</b> — passivas, funcionam sozinhas.</p>
    <div class="loja">${linhas}</div>
  `,
  };
}

export function cronicasHtml(): { titulo: string; html: string } {
  const ul = document.getElementById('log');
  const itens = ul
    ? [...ul.children].map((li) => `<li class="${li.className}">${li.innerHTML}</li>`).join('')
    : '';
  return {
    titulo: '📜 Crônicas do reino',
    html: `<ul class="modal-log">${itens || '<li>Nada por aqui ainda.</li>'}</ul>`,
  };
}

export function ajudaHtml(): { titulo: string; html: string } {
  return {
    titulo: '❓ Como governar',
    html: `
    <div class="linha-stat"><span>Começo</span><b>peito nu + farrapos + graveto</b></div>
    <div class="linha-stat"><span>Hordas</span><b>15× o nível, vêm até você</b></div>
    <div class="linha-stat"><span>Nv.10</span><b>sempre tem BOSS gigante</b></div>
    <div class="linha-stat"><span>Equip/Skills</span><b>botões da direita, com ouro</b></div>
    <div class="linha-stat"><span>Derrota</span><b>mantém o ouro e tenta de novo</b></div>
    <p class="hint" style="margin-top:10px">100% automático. O jogo salva sozinho, inclusive offline.</p>
  `,
  };
}
