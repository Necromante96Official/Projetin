// ui/views.ts — construtores de HTML dos modais (puros, sem side-effects).
// O wiring dos botões (comprar) fica no controller; aqui só o markup.
// Textos preservados 1:1 do main.js original.

import {
  EQUIPS,
  INVENTARIO,
  LUGARES,
  MAX_PECAS,
  MAX_SKILL,
  MAX_TIER,
  MISSOES,
  MISSOES_BONUS,
  ORDEM_SKILLS,
  ORDEM_SLOTS,
  PRESTIGIO,
  RARIDADES,
  RARIDADE_INFO,
  SKILLS,
  TIPOS_ITEM,
  bonusPrestigio,
  brasoesDisponiveis,
  chanceDropNormal,
  custoUpgradeInventario,
  ehBoss,
  listarConquistas,
  listarInventario,
  lugarDe,
  missoesConcluidas,
  parametrosCombate,
  pityRestante,
  totalInimigos,
  totalTiersEquip,
  voltaDe,
  type EquipSlot,
  type GameState,
  type OrdemInventario,
  type Raridade,
} from '../core/index.js';
import { ICONS, iconeItem } from '../render/icons.js';
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
  const b = bonusPrestigio(state);
  const pctStats = Math.round((b.stats - 1) * 100);
  const pctOuro = Math.round((b.ouro - 1) * 100);
  return {
    titulo: `🛡️ ${cav.nome}`,
    html: `
    ${stat('Ataque', `${ICONS.swords} ${fmt(p.atk)}`)}
    ${stat('Vida', `${ICONS.heart} ${fmt(p.hp)}`)}
    ${stat('Velocidade', `${(1 / p.intervalo).toFixed(1)} golpes/s`)}
    ${stat('Regeneração', `${p.regen.toFixed(1)}/s`)}
    ${stat('Peças equipadas', `${pecas}/${MAX_PECAS}`)}
    ${stat('Skills', `${sk} níveis`)}
    ${stat('Brasões', `${fmt(state.brasoes)} (+${pctStats}% atk/vida, +${pctOuro}% ouro)`)}
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

export function renascerHtml(state: GameState): { titulo: string; html: string } {
  const ganho = brasoesDisponiveis(state);
  const b = bonusPrestigio(state);
  const pctStats = Math.round((b.stats - 1) * 100);
  const pctOuro = Math.round((b.ouro - 1) * 100);
  const l = lugarDe(state.lugar);
  const v = voltaDe(state.lugar);
  const lugarAtual = `${l.nome}${v > 1 ? ` (V${v})` : ''} • Nv.${state.nivel}/10`;
  return {
    titulo: '👑 Renascimento',
    html: `
    ${stat('Brasões atuais', fmt(state.brasoes))}
    ${stat('Renascimentos', fmt(state.renascimentos))}
    ${stat('Bônus permanente', `+${pctStats}% ataque/vida • +${pctOuro}% ouro`)}
    ${stat('Progresso atual', lugarAtual)}
    ${stat('Próximo prêmio', ganho > 0 ? `+${fmt(ganho)} brasões` : `após o boss do ${lugarDe(0).nome}`)}
    <div class="aviso">
      <strong>⚠️ O reino recomeça.</strong>
      Lugar, nível, ouro, equipamentos e habilidades voltam ao início. Você mantém os
      <b>brasões</b> (bônus permanente), o nome do cavaleiro e as estatísticas da jornada.
    </div>
    <div class="modal-actions">
      ${
        ganho > 0
          ? `<button class="btn-primary" data-renascer>👑 Renascer e ganhar ${fmt(ganho)} brasões</button>`
          : `<button class="btn-primary" disabled>Faltam lugares para renascer</button>`
      }
    </div>
    <p class="hint" style="margin:10px 0 0">Cada brasão dá +${Math.round(PRESTIGIO.bonusStatsPorBrasao * 100)}% de ataque/vida e +${Math.round(PRESTIGIO.bonusOuroPorBrasao * 100)}% de ouro, para sempre.</p>
  `,
  };
}

export function conquistasHtml(state: GameState): { titulo: string; html: string } {
  const lista = listarConquistas(state);
  const feitas = lista.filter((c) => c.desbloqueada).length;
  const est = state.estatisticas;
  const lugarRecorde = lugarDe(est.maiorLugar);
  const voltaRecorde = voltaDe(est.maiorLugar);
  const linhas = lista
    .map(({ def, progresso, desbloqueada }) => {
      const atual = Math.min(progresso, def.meta);
      const pct = def.meta > 0 ? Math.min(100, (atual / def.meta) * 100) : 100;
      const premios: string[] = [];
      if (def.ouro > 0) premios.push(`${ICONS.coin} ${fmt(def.ouro)}`);
      if (def.brasoes > 0) premios.push(`👑 ${fmt(def.brasoes)}`);
      return `
      <div class="conquista ${desbloqueada ? 'feita' : ''}">
        <div class="conquista-icone" aria-hidden="true">${desbloqueada ? '🏅' : '🔒'}</div>
        <div class="conquista-info">
          <div class="conquista-top">
            <b>${def.nome}</b>
            <span>${desbloqueada ? 'Concluída' : `${fmt(atual)}/${fmt(def.meta)}`}</span>
          </div>
          <div class="conquista-desc">${def.desc}</div>
          <div class="conquista-track"><div class="conquista-fill" style="width:${pct.toFixed(1)}%"></div></div>
          <div class="conquista-premio">Recompensa: ${premios.join(' + ') || 'registro eterno'}</div>
        </div>
      </div>`;
    })
    .join('');
  return {
    titulo: '🏅 Conquistas',
    html: `
    <p class="hint">${fmt(feitas)} de ${fmt(lista.length)} conquistas — recompensas pagas automaticamente.</p>
    ${stat('Ouro acumulado', `${ICONS.coin} ${fmt(est.ouroTotal)}`)}
    ${stat('Chefes derrotados', fmt(est.bossesDerrotados))}
    ${stat('Elites derrotados', fmt(est.elitesDerrotados))}
    ${stat('Itens encontrados', `${fmt(est.itensEncontrados)} • ${fmt(est.itensLendarios)} lendários`)}
    ${stat('Maior progresso', `${lugarRecorde.nome}${voltaRecorde > 1 ? ` V${voltaRecorde}` : ''} • Nv.${est.maiorNivel}`)}
    <div class="conquistas-lista">${linhas}</div>
  `,
  };
}

export function missoesHtml(state: GameState): { titulo: string; html: string } {
  const m = state.missoes;
  const feitas = missoesConcluidas(state);
  const total = m.tipos.length;
  const linhas = m.tipos
    .map((tipo) => {
      const def = MISSOES[tipo];
      const progresso = Math.min(def.meta, m.progresso[tipo] ?? 0);
      const concluida = m.concluidas.includes(tipo);
      const pct = def.meta > 0 ? Math.min(100, (progresso / def.meta) * 100) : 100;
      return `
      <div class="conquista missao ${concluida ? 'feita' : ''}">
        <div class="conquista-icone" aria-hidden="true">${concluida ? '✅' : '🎯'}</div>
        <div class="conquista-info">
          <div class="conquista-top">
            <b>${def.nome}</b>
            <span>${concluida ? 'Concluída' : `${fmt(progresso)}/${fmt(def.meta)}`}</span>
          </div>
          <div class="conquista-desc">${def.desc}</div>
          <div class="conquista-track"><div class="conquista-fill" style="width:${pct.toFixed(1)}%"></div></div>
          <div class="conquista-premio">Recompensa: ${ICONS.coin} ${fmt(def.ouro)} ouro</div>
        </div>
      </div>`;
    })
    .join('');
  const bonus = m.bonusPago
    ? `Bônus resgatado: +${ICONS.coin} ${fmt(MISSOES_BONUS.ouro)} e +${fmt(MISSOES_BONUS.brasoes)} brasão`
    : `Complete as 3: +${ICONS.coin} ${fmt(MISSOES_BONUS.ouro)} e +${fmt(MISSOES_BONUS.brasoes)} brasão`;
  return {
    titulo: '🎯 Missões diárias',
    html: `
    <p class="hint">3 objetivos por dia, renovados à meia-noite (horário local). As recompensas são pagas automaticamente.</p>
    ${stat('Concluídas', `${fmt(feitas)}/${fmt(total)}`)}
    ${stat('Bônus diário', bonus)}
    ${total > 0 ? `<div class="conquistas-lista">${linhas}</div>` : '<p class="hint">As missões do dia estão sendo preparadas...</p>'}
  `,
  };
}

export interface OpcoesMochila {
  filtro?: Raridade | null;
  ordem?: OrdemInventario;
}

export function mochilaHtml(
  state: GameState,
  opcoes: OpcoesMochila = {},
): { titulo: string; html: string } {
  const inv = state.inventario;
  const total = inv.itens.reduce((s, item) => s + item.valor, 0);
  const custo = custoUpgradeInventario(state);
  const podeAmpliar = custo != null && state.ouro >= custo;
  const pct = (n: number): string =>
    `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
  const chance = chanceDropNormal(state);
  const pity = pityRestante(state);
  const filtro =
    opcoes.filtro != null && RARIDADE_INFO[opcoes.filtro] ? opcoes.filtro : null;
  const ordem: OrdemInventario =
    opcoes.ordem === 'raridade' || opcoes.ordem === 'valor'
      ? opcoes.ordem
      : 'recente';
  const listados = listarInventario(inv, filtro, ordem);
  const totalListado = listados.reduce((s, entrada) => s + entrada.item.valor, 0);
  const filtroNome = filtro ? RARIDADE_INFO[filtro].nome : null;
  const itens = listados
    .map(({ item, indice }) => {
      const info = RARIDADE_INFO[item.raridade];
      const tipo = TIPOS_ITEM[item.tipo]?.nome ?? 'Item';
      return `
      <button class="mochila-item raridade-${item.raridade}" data-item="${indice}" title="Vender ${item.nome} (${tipo} ${info.nome.toLowerCase()}) por ${fmt(item.valor)} ouro">
        <span class="mi-icone" aria-hidden="true">${iconeItem(item.tipo)}</span>
        <span class="mi-info">
          <span class="mi-nome">${item.nome}</span>
          <span class="mi-tipo">${tipo}</span>
        </span>
        <span class="mi-rodape">
          <span class="mi-raridade">${info.simbolo} ${info.nome}</span>
          <span class="mi-valor">${ICONS.coin} ${fmt(item.valor)}</span>
        </span>
      </button>`;
    })
    .join('');
  const autoOpcoes = RARIDADES.map(
    (r) =>
      `<option value="${r}" ${inv.autoReciclar === r ? 'selected' : ''}>${RARIDADE_INFO[r].nome} ou abaixo</option>`,
  ).join('');
  const filtroOpcoes = RARIDADES.map(
    (r) =>
      `<option value="${r}" ${filtro === r ? 'selected' : ''}>${RARIDADE_INFO[r].nome}</option>`,
  ).join('');
  const ordemOpcoes = (
    [
      ['recente', 'Mais recentes'],
      ['raridade', 'Raridade'],
      ['valor', 'Valor'],
    ] as const
  )
    .map(
      ([valor, nome]) =>
        `<option value="${valor}" ${ordem === valor ? 'selected' : ''}>${nome}</option>`,
    )
    .join('');
  const chances = (boss: boolean): string =>
    RARIDADES.map(
      (r) =>
        `${RARIDADE_INFO[r].nome} ${pct(boss ? RARIDADE_INFO[r].pesoBoss : RARIDADE_INFO[r].pesoNormal)}`,
    ).join(' • ');
  const garantia =
    pity > 0
      ? `garantia em ${pity} abate${pity > 1 ? 's' : ''}`
      : 'próximo abate garantido';
  const venderFiltro =
    filtro && listados.length > 0
      ? `<button class="btn-ghost" data-vender-filtro title="Vender todos os itens exibidos">💰 Vender exibidos (${listados.length} • ${ICONS.coin} ${fmt(totalListado)})</button>`
      : '';
  const corpoItens = itens
    ? `<div class="mochila-grid">${itens}</div>`
    : inv.itens.length === 0
      ? '<p class="hint mochila-vazia">Mochila vazia. Derrote hordas para achar itens — o BOSS sempre solta ' +
        `${INVENTARIO.itensBoss}, ao menos um raro!</p>`
      : `<p class="hint mochila-vazia">Nenhum item ${filtroNome?.toLowerCase() ?? ''} na mochila. Troque o filtro para ver o restante.</p>`;
  return {
    titulo: '🎒 Mochila',
    html: `
    <p class="hint">Ouro atual: ${ICONS.coin} <b>${fmt(state.ouro)}</b> — itens caem dos monstros. Clique em um item para vendê-lo.</p>
    ${stat('Espaços', `${inv.itens.length}/${inv.capacidade}`)}
    ${stat('Valor guardado', `${ICONS.coin} ${fmt(total)}`)}
    ${stat('Reciclados', `${fmt(inv.reciclados)} itens • ${ICONS.coin} ${fmt(inv.ouroReciclado)}`)}
    ${stat('Chance de drop', `${pct(chance * 100)} no Nv.${state.nivel} • ${garantia}`)}
    <div class="mochila-config">
      <label for="auto-reciclar">♻ Auto-reciclar</label>
      <select id="auto-reciclar">
        <option value="">Desligado</option>
        ${autoOpcoes}
      </select>
      <span class="hint">Vende na hora os itens até a raridade escolhida (e também quando a mochila enche).</span>
    </div>
    <div class="mochila-controles">
      <div class="mochila-campo">
        <label for="filtro-raridade">Filtrar</label>
        <select id="filtro-raridade">
          <option value="">Todas</option>
          ${filtroOpcoes}
        </select>
      </div>
      <div class="mochila-campo">
        <label for="ordem-mochila">Ordenar</label>
        <select id="ordem-mochila">${ordemOpcoes}</select>
      </div>
      <span class="mochila-contagem">${listados.length} de ${inv.itens.length} itens • ${ICONS.coin} ${fmt(totalListado)}</span>
    </div>
    <div class="mochila-acoes">
      <button class="btn-primary" data-upgrade ${podeAmpliar ? '' : 'disabled'}>
        ${custo == null ? 'Mochila no máximo' : `Ampliar +${INVENTARIO.passoSlots} slots — ${ICONS.coin} ${fmt(custo)}`}
      </button>
      <button class="btn-ghost" data-vender-todos ${inv.itens.length === 0 ? 'disabled' : ''}>💰 Vender tudo (${ICONS.coin} ${fmt(total)})</button>
      ${venderFiltro}
    </div>
    ${corpoItens}
    <p class="hint" style="margin-top:12px">Normal (${pct(chance * 100)} por abate): ${chances(false)}.<br>BOSS (${INVENTARIO.itensBoss} itens, mínimo raro): ${chances(true)}.</p>
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
    <div class="linha-stat"><span>Atalho</span><b>⚡ compra as melhorias mais baratas</b></div>
    <div class="linha-stat"><span>Renascimento</span><b>troca progresso por brasões permanentes</b></div>
    <div class="linha-stat"><span>Mochila</span><b>itens caem dos monstros e viram ouro</b></div>
    <div class="linha-stat"><span>Conquistas</span><b>metas permanentes pagam ouro e brasões</b></div>
    <div class="linha-stat"><span>Missões</span><b>3 objetivos por dia, renovados à meia-noite</b></div>
    <div class="linha-stat"><span>Drops</span><b>chance cresce com o nível; após 10 abates secos vem a garantia</b></div>
    <div class="linha-stat"><span>BOSS</span><b>sempre solta 3 itens, ao menos um raro</b></div>
    <div class="linha-stat"><span>Derrota</span><b>mantém o ouro e tenta de novo</b></div>
    <p class="hint" style="margin-top:10px">100% automático. O jogo salva sozinho, inclusive offline.</p>
  `,
  };
}
