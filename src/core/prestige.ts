// core/prestige.ts — renascimento: troca o progresso atual por brasões permanentes.
// Puro e determinístico: o controller só dispara quando o jogador confirma.

import { ORDEM_SKILLS, ORDEM_SLOTS, PRESTIGIO } from './data.js';
import type { GameState, RenascimentoResultado } from './types.js';

/** Brasões que o jogador ganharia se renascesse agora (0 = indisponível). */
export function brasoesDisponiveis(state: GameState): number {
  const lugar = Number.isFinite(state.lugar) ? Math.max(0, Math.floor(state.lugar)) : 0;
  if (lugar < PRESTIGIO.lugarMinimo) return 0;
  return Math.max(1, lugar * 2 + Math.floor(Math.pow(lugar - 1, 1.5)));
}

export function podeRenascer(state: GameState): boolean {
  return brasoesDisponiveis(state) > 0;
}

/**
 * Aplica o renascimento: guarda os brasões, zera lugar/nível/equip/skills e
 * devolve o ouro inicial. Vitórias, derrotas, abates e o nome do cavaleiro
 * ficam como registro da jornada.
 */
export function renascer(state: GameState): RenascimentoResultado {
  const ganhos = brasoesDisponiveis(state);
  const totalAtual = Number.isFinite(state.brasoes) ? Math.max(0, Math.floor(state.brasoes)) : 0;
  if (ganhos <= 0) return { possivel: false, ganhos: 0, total: totalAtual };

  state.brasoes = Math.min(PRESTIGIO.maxBrasoes, totalAtual + ganhos);
  state.renascimentos = Math.max(0, Math.floor(state.renascimentos)) + 1;
  state.ouro = PRESTIGIO.ouroInicialBase + state.brasoes * PRESTIGIO.ouroInicialPorBrasao;
  state.lugar = 0;
  state.nivel = 1;
  for (const slot of ORDEM_SLOTS) state.equip[slot] = 0;
  for (const id of ORDEM_SKILLS) state.skills[id] = 0;
  state.updatedAt = Date.now();
  return { possivel: true, ganhos, total: state.brasoes };
}
