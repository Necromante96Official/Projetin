// ui/modal.ts — painel flutuante único (detalhes, loja, crônicas, ajuda).
// Uma única fonte de verdade para "qual modal está aberto" (p/ re-render).

import { hidratarIcones } from '../render/icons.js';
import { el } from './dom.js';

export type ModalKey =
  | 'cavaleiro'
  | 'lugar'
  | 'equip'
  | 'skills'
  | 'renascer'
  | 'mochila'
  | 'cronicas'
  | 'ajuda'
  | null;

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
  private painelEl: HTMLElement;
  private focoAnterior: HTMLElement | null = null;

  constructor() {
    this.tituloEl = el('modal-titulo');
    this.corpoEl = el('modal-corpo');
    this.backdropEl = el('modal-backdrop');
    this.painelEl = document.querySelector<HTMLElement>('.modal') ?? this.backdropEl;

    el('modal-fechar').onclick = () => this.fechar();
    this.backdropEl.addEventListener('click', (e) => {
      if (e.target === this.backdropEl) this.fechar();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.fechar();
        return;
      }
      if (e.key === 'Tab' && this.aberto !== null) this.manterFocoNoModal(e);
    });
  }

  private manterFocoNoModal(e: KeyboardEvent): void {
    const focaveis = [
      ...this.painelEl.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ];
    if (focaveis.length === 0) {
      e.preventDefault();
      this.painelEl.focus();
      return;
    }
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    const atual = document.activeElement;
    if (e.shiftKey && (atual === primeiro || atual === this.painelEl)) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && atual === ultimo) {
      e.preventDefault();
      primeiro.focus();
    }
  }

  abrir(titulo: string, html: string, chave: ModalKey = null): void {
    if (this.aberto === null) {
      this.focoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    this.atualizar(titulo, html, chave);
    this.backdropEl.classList.remove('hidden');
    this.painelEl.focus();
  }

  /** Atualiza o conteúdo sem fechar/reabrir (preserva rolagem e foco do modal). */
  atualizar(titulo: string, html: string, chave: ModalKey = this.aberto): void {
    const rolagem = this.painelEl.scrollTop;
    this.tituloEl.textContent = titulo;
    this.corpoEl.innerHTML = html;
    hidratarIcones(this.corpoEl);
    this.painelEl.classList.toggle('modal-largo', chave === 'mochila');
    this.painelEl.scrollTop = rolagem;
    this.aberto = chave;
  }

  fechar(): void {
    if (this.aberto === null) return;
    this.backdropEl.classList.add('hidden');
    this.aberto = null;
    const foco = this.focoAnterior;
    this.focoAnterior = null;
    if (foco?.isConnected) foco.focus();
  }

  get chave(): ModalKey {
    return this.aberto;
  }

  get corpo(): HTMLElement {
    return this.corpoEl;
  }
}
