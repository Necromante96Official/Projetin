// ui/modal.ts — painel flutuante único (detalhes, loja, crônicas, ajuda).
// Uma única fonte de verdade para "qual modal está aberto" (p/ re-render).

import { hidratarIcones } from '../render/icons.js';
import { el } from './dom.js';

export type ModalKey = 'cavaleiro' | 'lugar' | 'equip' | 'skills' | 'cronicas' | 'ajuda' | null;

export function stat(label: string, valor: string): string {
  return `<div class="linha-stat"><span>${label}</span><b>${valor}</b></div>`;
}

export function pips(atual: number, max: number): string {
  const total = Math.max(0, Math.floor(max));
  const n = Number.isFinite(atual) ? Math.min(total, Math.max(0, Math.floor(atual))) : 0;
  return `<span class="pips">${'●'.repeat(n)}${'○'.repeat(total - n)}</span>`;
}

export class ModalManager {
  private aberto: ModalKey = null;
  private tituloEl: HTMLElement;
  private corpoEl: HTMLElement;
  private backdropEl: HTMLElement;

  constructor() {
    this.tituloEl = el('modal-titulo');
    this.corpoEl = el('modal-corpo');
    this.backdropEl = el('modal-backdrop');

    el('modal-fechar').onclick = () => this.fechar();
    this.backdropEl.addEventListener('click', (e) => {
      if (e.target === this.backdropEl) this.fechar();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.fechar();
    });
  }

  abrir(titulo: string, html: string, chave: ModalKey = null): void {
    this.tituloEl.textContent = titulo;
    this.corpoEl.innerHTML = html;
    hidratarIcones(this.corpoEl);
    this.backdropEl.classList.remove('hidden');
    this.aberto = chave;
  }

  fechar(): void {
    this.backdropEl.classList.add('hidden');
    this.aberto = null;
  }

  get chave(): ModalKey {
    return this.aberto;
  }

  get corpo(): HTMLElement {
    return this.corpoEl;
  }
}
