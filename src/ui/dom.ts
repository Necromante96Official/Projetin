// ui/dom.ts — helpers mínimos de DOM + formatação pt-BR.
// Nenhuma regra de jogo aqui: só acesso a elementos e texto.

export function el(id: string): HTMLElement {
  const n = document.getElementById(id);
  if (!n) throw new Error(`[ui] elemento #${id} não encontrado`);
  return n;
}

export function fmt(n: number): string {
  return Number(n).toLocaleString('pt-BR');
}

export function formatTempo(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  return `${Math.floor(m / 60)}h${m % 60}min`;
}
