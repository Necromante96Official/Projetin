// render/icons.ts — ícones SVG inline — funcionam em qualquer Windows,
// sem depender de fontes de emoji colorido (o 🪙 virava □ em algumas máquinas).

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
} as const;

export type IconeId = keyof typeof ICONS;

// Troca <span data-ic="coin"></span> pelo SVG correspondente.
export function hidratarIcones(raiz: ParentNode = document): void {
  raiz.querySelectorAll('[data-ic]').forEach((s) => {
    const id = (s as HTMLElement).dataset.ic as IconeId | undefined;
    const svg = id ? ICONS[id] : undefined;
    if (svg) (s as HTMLElement).innerHTML = svg;
  });
}
