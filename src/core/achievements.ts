// core/achievements.ts — metas permanentes com recompensa única.
// A avaliação é pura: o controller só chama desbloquearConquistas após mudanças.

import {
  CONQUISTAS,
  ORDEM_CONQUISTAS,
  ORDEM_SKILLS,
  PRESTIGIO,
} from './data.js';
import { totalTiersEquip } from './shop.js';
import type {
  ConquistaDef,
  ConquistaId,
  Estatisticas,
  GameState,
} from './types.js';

export interface ConquistaProgresso {
  id: ConquistaId;
  def: ConquistaDef;
  progresso: number;
  desbloqueada: boolean;
}

export interface ConquistaDesbloqueada {
  id: ConquistaId;
  def: ConquistaDef;
}

const seguro = (n: number): number =>
  Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;

const stats = (state: GameState): Estatisticas => state.estatisticas;

const progressoMenorSkill = (state: GameState): number => {
  const menor = ORDEM_SKILLS.reduce(
    (atual, id) => Math.min(atual, state.skills[id] ?? 0),
    Number.MAX_SAFE_INTEGER,
  );
  return menor === Number.MAX_SAFE_INTEGER ? 0 : menor;
};

const PROGRESSO: Record<ConquistaId, (state: GameState) => number> = {
  'primeira-vitoria': (s) => seguro(s.vitorias),
  cacador: (s) => seguro(s.abates),
  exterminador: (s) => seguro(s.abates),
  'primeiro-boss': (s) => seguro(stats(s).bossesDerrotados),
  explorador: (s) => seguro(stats(s).maiorLugar),
  conquistador: (s) => seguro(stats(s).maiorLugar),
  renascido: (s) => seguro(s.renascimentos),
  dinastia: (s) => seguro(s.renascimentos),
  ferreiro: (s) => totalTiersEquip(s),
  arsenal: (s) => totalTiersEquip(s),
  'armadura-lendaria': (s) => totalTiersEquip(s),
  aprendiz: (s) => progressoMenorSkill(s),
  erudito: (s) => progressoMenorSkill(s),
  colecionador: (s) => seguro(stats(s).itensEncontrados),
  sortudo: (s) => seguro(stats(s).itensLendarios),
  'cacador-elite': (s) => seguro(stats(s).elitesDerrotados),
  rico: (s) => seguro(stats(s).ouroTotal),
  magnata: (s) => seguro(stats(s).ouroTotal),
  teimoso: (s) => seguro(s.derrotas),
  'mochila-cheia': (s) => seguro(s.inventario.itens.length),
};

export function progressoConquista(state: GameState, id: ConquistaId): number {
  return PROGRESSO[id]?.(state) ?? 0;
}

export function listarConquistas(state: GameState): ConquistaProgresso[] {
  return ORDEM_CONQUISTAS.map((id) => ({
    id,
    def: CONQUISTAS[id],
    progresso: progressoConquista(state, id),
    desbloqueada: state.conquistas.includes(id),
  }));
}

/** Desbloqueia metas cumpridas, paga recompensas e devolve só as novas. */
export function desbloquearConquistas(state: GameState): ConquistaDesbloqueada[] {
  if (!Array.isArray(state.conquistas)) state.conquistas = [];
  const novas: ConquistaDesbloqueada[] = [];
  for (const id of ORDEM_CONQUISTAS) {
    if (state.conquistas.includes(id)) continue;
    const def = CONQUISTAS[id];
    if (progressoConquista(state, id) < def.meta) continue;
    state.conquistas.push(id);
    if (def.ouro > 0) {
      state.ouro = Math.min(
        Number.MAX_SAFE_INTEGER,
        Math.max(0, state.ouro) + def.ouro,
      );
    }
    if (def.brasoes > 0) {
      state.brasoes = Math.min(
        PRESTIGIO.maxBrasoes,
        Math.max(0, state.brasoes) + def.brasoes,
      );
    }
    novas.push({ id, def });
  }
  if (novas.length > 0) state.updatedAt = Date.now();
  return novas;
}
