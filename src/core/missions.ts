// core/missions.ts — missões diárias determinísticas, com bônus por completar as 3.
// A data vem da UI (core continua puro); o save guarda o dia e o progresso.

import {
  MISSOES,
  MISSOES_BONUS,
  ORDEM_MISSOES,
  PRESTIGIO,
} from './data.js';
import type {
  GameState,
  MissaoDef,
  MissaoTipo,
  MissoesDiarias,
} from './types.js';

export interface MissaoConcluida {
  tipo: MissaoTipo;
  def: MissaoDef;
}

export interface MissoesResultado {
  concluidas: MissaoConcluida[];
  bonus: boolean;
}

const progressoZerado = (): Record<MissaoTipo, number> => ({
  abates: 0,
  vitorias: 0,
  elites: 0,
  bosses: 0,
  drops: 0,
  raros: 0,
  compras: 0,
  vendas: 0,
  ouro: 0,
});

export function missoesVazias(): MissoesDiarias {
  return {
    data: '',
    tipos: [],
    progresso: progressoZerado(),
    concluidas: [],
    bonusPago: false,
  };
}

const hashData = (data: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < data.length; i++) {
    hash ^= data.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const sortearTipos = (data: string): MissaoTipo[] => {
  const pool = [...ORDEM_MISSOES];
  let seed = hashData(data) || 1;
  for (let i = pool.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
};

const dataValida = (data: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(data);

/** Gera/renova as missões se o dia mudou. Retorna true quando houve renovação. */
export function garantirMissoes(state: GameState, data: string): boolean {
  if (!state.missoes) state.missoes = missoesVazias();
  const m = state.missoes;
  const atualValida =
    dataValida(m.data) &&
    m.tipos.length === 3 &&
    new Set(m.tipos).size === 3 &&
    m.tipos.every((tipo) => ORDEM_MISSOES.includes(tipo));
  if (atualValida && m.data === data) return false;

  m.data = dataValida(data) ? data : '';
  m.tipos = m.data ? sortearTipos(m.data) : [];
  m.progresso = progressoZerado();
  m.concluidas = [];
  m.bonusPago = false;
  state.updatedAt = Date.now();
  return true;
}

/** Conta uma ação do jogador em uma missão ativa. */
export function registrarMissao(
  state: GameState,
  tipo: MissaoTipo,
  valor = 1,
): boolean {
  const m = state.missoes;
  if (!m || !m.tipos.includes(tipo)) return false;
  const incremento = Math.floor(valor);
  if (!Number.isFinite(incremento) || incremento <= 0) return false;
  const meta = MISSOES[tipo].meta;
  const atual = Math.max(0, Math.floor(m.progresso[tipo] ?? 0));
  const proximo = Math.min(meta, atual + incremento);
  if (proximo === atual) return false;
  m.progresso[tipo] = proximo;
  return true;
}

export function missoesConcluidas(state: GameState): number {
  return state.missoes.tipos.filter((tipo) =>
    state.missoes.concluidas.includes(tipo),
  ).length;
}

/** Paga missões cumpridas e o bônus diário uma única vez. */
export function processarMissoes(state: GameState): MissoesResultado {
  const resultado: MissoesResultado = { concluidas: [], bonus: false };
  const m = state.missoes;
  if (!m || m.tipos.length === 0) return resultado;

  for (const tipo of m.tipos) {
    if (m.concluidas.includes(tipo)) continue;
    if ((m.progresso[tipo] ?? 0) < MISSOES[tipo].meta) continue;
    m.concluidas.push(tipo);
    state.ouro = Math.min(
      Number.MAX_SAFE_INTEGER,
      Math.max(0, state.ouro) + MISSOES[tipo].ouro,
    );
    resultado.concluidas.push({ tipo, def: MISSOES[tipo] });
  }

  if (!m.bonusPago && m.tipos.every((tipo) => m.concluidas.includes(tipo))) {
    m.bonusPago = true;
    state.ouro = Math.min(
      Number.MAX_SAFE_INTEGER,
      Math.max(0, state.ouro) + MISSOES_BONUS.ouro,
    );
    state.brasoes = Math.min(
      PRESTIGIO.maxBrasoes,
      Math.max(0, state.brasoes) + MISSOES_BONUS.brasoes,
    );
    resultado.bonus = true;
  }

  if (resultado.concluidas.length > 0 || resultado.bonus) {
    state.updatedAt = Date.now();
  }
  return resultado;
}
