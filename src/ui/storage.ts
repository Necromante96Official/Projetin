// ui/storage.ts — persistência do save (único lugar que toca localStorage).
// O formato é validado por migrarSave(): save antigo/corrompido nunca quebra o jogo.

import { criarEstadoInicial, migrarSave, type GameState, type SaveCru } from '../core/index.js';

export const SAVE_KEY = 'reino-idle-save-v1';

export function carregar(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return criarEstadoInicial();
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return criarEstadoInicial();
    }
    return migrarSave(parsed as SaveCru);
  } catch {
    return criarEstadoInicial();
  }
}

export function salvar(state: GameState): void {
  try {
    // Marca o instante real do save: é a base do ganho offline (evita farmar reload).
    state.updatedAt = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    /* armazenamento cheio/bloqueado: segue sem save */
  }
}

export function apagarSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* sem storage */
  }
}
