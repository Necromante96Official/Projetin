// ui/log.ts — log interno + mini-histórico + flash de resultado.
// O <ul id="log"> é a fonte das Crônicas; o mini-log mostra as últimas 4.

import { ICONS } from '../render/icons.js';
import type { ModalManager } from './modal.js';
import { el } from './dom.js';

export type LogTipo = 'buy' | 'win' | 'loss' | 'info' | '';

export class LogStore {
  private novas = 0;
  private flashTimer: number | undefined;
  /** chamado quando chega log com as Crônicas abertas (p/ atualizar o modal). */
  onCronicasAberta: (() => void) | null = null;

  constructor(private modal: ModalManager) {}

  log(msg: string, tipo: LogTipo = ''): void {
    const html = msg.replaceAll('🪙', ICONS.coin);
    const ul = document.getElementById('log');
    if (ul) {
      const li = document.createElement('li');
      if (tipo) li.className = tipo;
      li.innerHTML = html;
      ul.prepend(li);
      while (ul.children.length > 40) ul.lastChild?.remove();
    }
    const mini = document.getElementById('mini-log');
    if (mini) {
      const li = document.createElement('li');
      if (tipo) li.className = tipo;
      li.innerHTML = html;
      mini.prepend(li);
      while (mini.children.length > 4) mini.lastChild?.remove();
    }
    if (this.modal.chave !== 'cronicas') {
      this.novas++;
      el('cronicas-dot').classList.remove('hidden');
    } else {
      this.onCronicasAberta?.();
    }
  }

  flash(texto: string, venceu: boolean): void {
    const f = document.getElementById('resultado-flash');
    if (!f) return;
    f.textContent = texto;
    f.className = `resultado-flash visivel ${venceu ? 'win' : 'loss'}`;
    window.clearTimeout(this.flashTimer);
    this.flashTimer = window.setTimeout(() => f.classList.remove('visivel'), 2600);
  }

  limpar(): void {
    const ul = document.getElementById('log');
    if (ul) ul.innerHTML = '';
    const mini = document.getElementById('mini-log');
    if (mini) mini.innerHTML = '';
    this.novas = 0;
    el('cronicas-dot').classList.add('hidden');
  }

  marcarLidas(): void {
    this.novas = 0;
    el('cronicas-dot').classList.add('hidden');
  }
}
