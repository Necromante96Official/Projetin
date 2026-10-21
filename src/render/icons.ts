// render/icons.ts — ícones SVG inline — funcionam em qualquer Windows,
// sem depender de fontes de emoji colorido (o 🪙 virava □ em algumas máquinas).

import type { ItemTipo } from '../core/types.js';

export const ICONS = {
  coin: `<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="#e8b34a" stroke="#8a6414" stroke-width="1.5"/><circle cx="8" cy="8" r="3.6" fill="none" stroke="#8a6414" stroke-width="1.5"/><circle cx="5.8" cy="5.6" r="1.2" fill="#f6d789"/></svg>`,
  swords: `<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2 L12 12" stroke="#dfe8ee" stroke-width="2.4" stroke-linecap="round"/><path d="M14 2 L4 12" stroke="#dfe8ee" stroke-width="2.4" stroke-linecap="round"/><path d="M1 4.5 L4.5 1 M11.5 1 L15 4.5" stroke="#e8b34a" stroke-width="1.8" stroke-linecap="round"/><circle cx="8" cy="8" r="1.4" fill="#e8b34a"/></svg>`,
  treino: `<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="7" width="12" height="2" rx="1" fill="#dfe8ee"/><rect x="0.8" y="4.5" width="2.4" height="7" rx="1" fill="#e8b34a"/><rect x="12.8" y="4.5" width="2.4" height="7" rx="1" fill="#e8b34a"/><rect x="3.6" y="5.8" width="1.6" height="4.4" rx="0.8" fill="#8a6414"/><rect x="10.8" y="5.8" width="1.6" height="4.4" rx="0.8" fill="#8a6414"/></svg>`,
  heart: `<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13.5 C3 10 1.5 7 2.5 4.8 C3.4 3 5.8 3 8 5.4 C10.2 3 12.6 3 13.5 4.8 C14.5 7 13 10 8 13.5 Z" fill="#ff6b6b"/></svg>`,
  shield: `<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1 L13.5 3.2 V7.5 C13.5 11.5 11 13.8 8 15 C5 13.8 2.5 11.5 2.5 7.5 V3.2 Z" fill="#3a5a8c" stroke="#e8b34a" stroke-width="1.2"/><circle cx="8" cy="7.5" r="1.8" fill="#e8b34a"/></svg>`,
  shop: `<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6 L3.2 13.5 H12.8 L14 6 Z" fill="#7048e8"/><path d="M2 6 L4 2.5 H12 L14 6 Z" fill="#b197fc"/><rect x="6.4" y="9" width="3.2" height="4.5" fill="#1c1533"/></svg>`,
  elmo: `<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 9 C3 4.5 5.5 2.5 8 2.5 C10.5 2.5 13 4.5 13 9 L12 11 H4 Z" fill="#8fa3bd" stroke="#3a4356" stroke-width="1"/><rect x="3" y="9.4" width="10" height="1.6" fill="#3a4356"/><rect x="9" y="6" width="3" height="1.2" fill="#222"/></svg>`,
  camisa: `<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2 H10 L13 5 L11 7 L10.4 6 V14 H5.6 V6 L5 7 L3 5 Z" fill="#3f8cff" stroke="#24365c" stroke-width="1"/></svg>`,
  calca: `<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 2 H11 V7 L10.4 14 H7.6 L8 7.4 L8 7.4 L8 7.4 L5.6 14 H4.6 Z" fill="#8a7a5c" stroke="#4a4132" stroke-width="1" fill-rule="evenodd"/><path d="M5 2 H11 V4 H5 Z" fill="#e8b34a"/></svg>`,
  bota: `<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 2 H9 V9 L12 11 V13 H5 Z" fill="#6b4a2f" stroke="#3a2a1a" stroke-width="1"/></svg>`,
  adaga: `<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M11 2 L13 2 L8 10 L7 9 Z" fill="#dfe8ee" stroke="#8a93a3" stroke-width="0.8"/><rect x="5" y="8.6" width="4" height="1.6" fill="#8a6414" transform="rotate(-38 7 9.4)"/></svg>`,
  escudoR: `<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="#3a5a8c" stroke="#e8b34a" stroke-width="1.2"/><circle cx="8" cy="8" r="1.8" fill="#e8b34a"/></svg>`,
  skill: `<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1 L10 6 L15 6 L10.8 9 L12.4 14 L8 11 L3.6 14 L5.2 9 L1 6 L6 6 Z" fill="#e8b34a" stroke="#8a6414" stroke-width="1"/></svg>`,
  moeda: `<svg class="ic ic-item" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.2" fill="#f2c75c" stroke="#8a6414" stroke-width="1.3"/><circle cx="8" cy="8" r="4.2" fill="none" stroke="#b98723" stroke-width="0.9"/><path d="M8 5.2 V10.8 M6.5 7 H9.5 M6.5 9 H9.5" stroke="#8a6414" stroke-width="0.8" stroke-linecap="round"/><circle cx="6" cy="5.8" r="1" fill="#fff1bd"/></svg>`,
  anel: `<svg class="ic ic-item" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="9.4" r="4.5" fill="none" stroke="#e8b34a" stroke-width="2"/><path d="M8 2.2 L10.3 4.5 L8 6.8 L5.7 4.5 Z" fill="#74c0fc" stroke="#3a5a8c" stroke-width="0.8"/><path d="M7.1 4.1 L8 2.2 L8.9 4.1" fill="none" stroke="#d9efff" stroke-width="0.7"/></svg>`,
  colar: `<svg class="ic ic-item" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3 C3.5 9 5.2 11.2 8 11.2 C10.8 11.2 12.5 9 13 3" fill="none" stroke="#e8b34a" stroke-width="1.2" stroke-linecap="round"/><circle cx="4.3" cy="5" r="0.7" fill="#f8dc96"/><circle cx="5.4" cy="8.1" r="0.65" fill="#f8dc96"/><circle cx="11.7" cy="5" r="0.7" fill="#f8dc96"/><circle cx="10.6" cy="8.1" r="0.65" fill="#f8dc96"/><path d="M8 10.2 L10 12 L8 14.2 L6 12 Z" fill="#63d68a" stroke="#2f8f4a" stroke-width="0.8"/></svg>`,
  luva: `<svg class="ic ic-item" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.2 7.4 V4.8 C4.2 4.1 5.4 4.1 5.4 4.8 V7.2 V3.4 C5.4 2.7 6.6 2.7 6.6 3.4 V7 V2.7 C6.6 2 7.8 2 7.8 2.7 V7 V3.4 C7.8 2.7 9 2.7 9 3.4 V8 L10.2 6.2 C10.7 5.5 11.8 6.2 11.4 7 L10.4 10.4 C10 13 8.8 14 6.6 14 C4.8 14 3.8 12.8 3.5 10.8 L3 8.4 C2.8 7.5 4 7 4.3 7.8 Z" fill="#8a7a5c" stroke="#4a4132" stroke-width="0.8" stroke-linejoin="round"/><path d="M4.4 10.6 H10.6" stroke="#b8a37c" stroke-width="0.8"/></svg>`,
  pena: `<svg class="ic ic-item" viewBox="0 0 16 16" aria-hidden="true"><path d="M12.8 2.2 C8.5 2.5 5.2 5.1 4.2 9.5 C3.9 10.8 4.5 12 4.5 12 C5.7 12.1 7.1 11.5 8.2 10.5 C11.1 7.9 12.5 5.1 12.8 2.2 Z" fill="#74c0fc" stroke="#3a5a8c" stroke-width="0.8"/><path d="M4.3 12.8 L9.4 7.2 M6.4 9.7 L5.7 6.9 M8.3 7.7 L9.7 8.9" fill="none" stroke="#d9efff" stroke-width="0.7" stroke-linecap="round"/></svg>`,
  cantil: `<svg class="ic ic-item" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3 H10 V4.4 C11.7 5.2 12.8 6.9 12.8 9 C12.8 12 10.6 14 8 14 C5.4 14 3.2 12 3.2 9 C3.2 6.9 4.3 5.2 6 4.4 Z" fill="#8a7a5c" stroke="#4a4132" stroke-width="0.9"/><path d="M6 2 H10 V3.4 H6 Z" fill="#c9a25e" stroke="#6b4a2f" stroke-width="0.7"/><path d="M4.4 7.5 H11.6 V10.5 H4.4 Z" fill="none" stroke="#e8b34a" stroke-width="0.8"/><circle cx="8" cy="9" r="1.2" fill="#e8b34a"/></svg>`,
  osso: `<svg class="ic ic-item" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.7 4.7 L11.3 11.3" stroke="#e8e0cf" stroke-width="2.8" stroke-linecap="round"/><circle cx="3.5" cy="3.5" r="1.8" fill="#f4eddf" stroke="#9c917e" stroke-width="0.7"/><circle cx="5.6" cy="2.2" r="1.5" fill="#f4eddf" stroke="#9c917e" stroke-width="0.7"/><circle cx="12.5" cy="12.5" r="1.8" fill="#f4eddf" stroke="#9c917e" stroke-width="0.7"/><circle cx="10.4" cy="13.8" r="1.5" fill="#f4eddf" stroke="#9c917e" stroke-width="0.7"/></svg>`,
  pedra: `<svg class="ic ic-item" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.2 11.5 L2.3 7.4 L5.3 3.2 L10.7 2.5 L13.8 6.1 L13.2 11.3 L9.1 13.8 Z" fill="#8fa3bd" stroke="#3a4356" stroke-width="0.9"/><path d="M5.3 3.2 L8 7.2 L2.3 7.4 M8 7.2 L10.7 2.5 M8 7.2 L13.8 6.1 M8 7.2 L9.1 13.8" fill="none" stroke="#d7e3ef" stroke-width="0.6" opacity="0.7"/></svg>`,
  broche: `<svg class="ic ic-item" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.2 L12.8 6 L8 13.8 L3.2 6 Z" fill="#b197fc" stroke="#5f3dc4" stroke-width="0.9"/><path d="M8 2.2 L9.5 6 L8 13.8 L6.5 6 Z" fill="#d0bfff" opacity="0.65"/><path d="M2.2 10.5 L5.5 9.3 M13.8 10.5 L10.5 9.3" stroke="#e8b34a" stroke-width="0.8" stroke-linecap="round"/></svg>`,
  cristal: `<svg class="ic ic-item" viewBox="0 0 16 16" aria-hidden="true"><path d="M6.2 1.8 L9.8 2.4 L10.7 8.2 L8.2 14 L5.3 8.6 Z" fill="#74c0fc" stroke="#3a5a8c" stroke-width="0.8"/><path d="M6.2 1.8 L8.2 8.6 L9.8 2.4 M5.3 8.6 L8.2 8.6 L10.7 8.2" fill="none" stroke="#d9efff" stroke-width="0.6"/><path d="M11.5 3.5 L13.8 4.5 L14 8 L11.8 10 Z" fill="#b197fc" stroke="#5f3dc4" stroke-width="0.6"/></svg>`,
  reliquia: `<svg class="ic ic-item" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2 H12 V3.2 C12 6 10.4 7.8 8 7.8 C5.6 7.8 4 6 4 3.2 Z" fill="#e8b34a" stroke="#8a6414" stroke-width="0.9"/><path d="M7.2 7.8 H8.8 V12 H10.8 V14 H5.2 V12 H7.2 Z" fill="#c9a25e" stroke="#8a6414" stroke-width="0.8"/><circle cx="8" cy="4.8" r="1.2" fill="#ff6b7a"/><path d="M3 2 H13" stroke="#f8dc96" stroke-width="0.9" stroke-linecap="round"/></svg>`,
  gema: `<svg class="ic ic-item" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 2 H11 L14 6 L8 14 L2 6 Z" fill="#63d68a" stroke="#2f8f4a" stroke-width="0.9"/><path d="M5 2 L8 6 L11 2 M2 6 H14 M8 6 L8 14" fill="none" stroke="#b2f2bb" stroke-width="0.7"/><path d="M5 2 L4.2 6 H2 M11 2 L11.8 6 H14" fill="none" stroke="#2f8f4a" stroke-width="0.6"/></svg>`,
  escama: `<svg class="ic ic-item" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8 C12 3.5 14 6.2 13.4 10.2 C12.8 13.4 10.4 14.4 8 14.2 C5.6 14.4 3.2 13.4 2.6 10.2 C2 6.2 4 3.5 8 1.8 Z" fill="#63d68a" stroke="#2f8f4a" stroke-width="0.9"/><path d="M8 3.2 C10.2 5.4 10.6 8.8 9.2 12.8 M8 3.2 C5.8 5.4 5.4 8.8 6.8 12.8" fill="none" stroke="#b2f2bb" stroke-width="0.7"/><path d="M4.4 6.8 C6.2 6.2 9.8 6.2 11.6 6.8" fill="none" stroke="#2f8f4a" stroke-width="0.6" opacity="0.7"/></svg>`,
  mapa: `<svg class="ic ic-item" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3.5 L5.6 2.2 L10.4 3.8 L14 2.5 V12.5 L10.4 13.8 L5.6 12.2 L2 13.5 Z" fill="#d9c9a3" stroke="#6b4a2f" stroke-width="0.9"/><path d="M5.6 2.2 V12.2 M10.4 3.8 V13.8" stroke="#8a7a5c" stroke-width="0.7"/><path d="M7 6.4 L9 8.6 M9.2 6.2 L7.2 9" stroke="#c2255c" stroke-width="1.2" stroke-linecap="round"/><circle cx="11.8" cy="10.5" r="0.8" fill="#e8b34a"/></svg>`,
  grimorio: `<svg class="ic ic-item" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2.5 C5 1.6 7 1.8 8 2.6 C9 1.8 11 1.6 13 2.5 V13.2 C11 12.4 9 12.5 8 13.4 C7 12.5 5 12.4 3 13.2 Z" fill="#7048e8" stroke="#3b2a5a" stroke-width="1"/><path d="M8 2.6 V13.4" stroke="#d0bfff" stroke-width="0.8"/><path d="M4.6 5.2 H6.6 M4.6 7.2 H6.6 M9.6 5.2 H11.6 M9.6 7.2 H11.6" stroke="#d0bfff" stroke-width="0.7" stroke-linecap="round"/><path d="M6.4 10 L8 8.6 L9.6 10 L8 11.4 Z" fill="#e8b34a" stroke="#8a6414" stroke-width="0.6"/></svg>`,
  trofeu: `<svg class="ic ic-item" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2 H12 V5.5 C12 8.2 10.4 9.6 8 9.6 C5.6 9.6 4 8.2 4 5.5 Z" fill="#e8b34a" stroke="#8a6414" stroke-width="0.9"/><path d="M4 3 H2.2 C2.2 5.6 3.2 7 5 7.2 M12 3 H13.8 C13.8 5.6 12.8 7 11 7.2" fill="none" stroke="#c9a25e" stroke-width="0.9" stroke-linecap="round"/><path d="M7.2 9.6 H8.8 V12 H10.8 V14 H5.2 V12 H7.2 Z" fill="#c9a25e" stroke="#8a6414" stroke-width="0.8"/><path d="M6.2 12 H9.8" stroke="#8a6414" stroke-width="0.8"/><path d="M8 3.4 L8.7 4.8 L10.2 5 L9.1 6.1 L9.4 7.6 L8 6.9 L6.6 7.6 L6.9 6.1 L5.8 5 L7.3 4.8 Z" fill="#fff3bf"/></svg>`,
} as const;

export const ICONES_ITENS: Readonly<Record<ItemTipo, string>> = {
  moeda: ICONS.moeda,
  anel: ICONS.anel,
  colar: ICONS.colar,
  luva: ICONS.luva,
  pena: ICONS.pena,
  cantil: ICONS.cantil,
  osso: ICONS.osso,
  pedra: ICONS.pedra,
  broche: ICONS.broche,
  cristal: ICONS.cristal,
  reliquia: ICONS.reliquia,
  gema: ICONS.gema,
  escama: ICONS.escama,
  mapa: ICONS.mapa,
  grimorio: ICONS.grimorio,
  trofeu: ICONS.trofeu,
};

export function iconeItem(tipo: ItemTipo): string {
  return ICONES_ITENS[tipo] ?? ICONS.moeda;
}

export type IconeId = keyof typeof ICONS;

// Troca <span data-ic="coin"></span> pelo SVG correspondente.
export function hidratarIcones(raiz: ParentNode = document): void {
  raiz.querySelectorAll('[data-ic]').forEach((s) => {
    const id = (s as HTMLElement).dataset.ic as IconeId | undefined;
    const svg = id ? ICONS[id] : undefined;
    if (svg) (s as HTMLElement).innerHTML = svg;
  });
}
