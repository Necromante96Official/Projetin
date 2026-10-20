// core/inventory.ts — mochila, drops por tipo/raridade, reciclagem e upgrade de slots.
// Puro e determinístico: o rng é injetável e nada aqui toca DOM ou storage.

import {
  INVENTARIO,
  MAX_LUGAR,
  ORDEM_TIPOS_ITEM,
  RARIDADES,
  RARIDADE_INFO,
  TIPOS_ITEM,
} from './data.js';
import type {
  DropProcessado,
  GameState,
  Inventario,
  ItemInventario,
  ItemTipo,
  Raridade,
  ResultadoDrops,
} from './types.js';

const MAX = Number.MAX_SAFE_INTEGER;

const TIPO_POR_NOME_LEGADO: Readonly<Record<string, ItemTipo>> = {
  'Anel de cobre': 'anel',
  'Colar de contas': 'colar',
  'Luva de retalhos': 'luva',
  'Pena de corvo': 'pena',
  'Moeda antiga': 'moeda',
  'Cantil de couro': 'cantil',
  'Fragmento de osso': 'osso',
  'Pedra brilhante': 'pedra',
  'Broche enferrujado': 'broche',
  'Fivela de bronze': 'broche',
  'Cristal turvo': 'cristal',
  'Selo do reino': 'reliquia',
  'Amuleto do viajante': 'colar',
  'Gema bruta': 'gema',
  'Relíquia esquecida': 'reliquia',
};

const PISTAS_TIPO: readonly (readonly [RegExp, ItemTipo])[] = [
  [/moeda/i, 'moeda'],
  [/anel/i, 'anel'],
  [/colar|amuleto/i, 'colar'],
  [/luva/i, 'luva'],
  [/pena/i, 'pena'],
  [/cantil/i, 'cantil'],
  [/osso/i, 'osso'],
  [/pedra/i, 'pedra'],
  [/broche|fivela/i, 'broche'],
  [/cristal/i, 'cristal'],
  [/rel[íi]quia|selo/i, 'reliquia'],
  [/gema/i, 'gema'],
];

function inteiroSeguro(v: unknown, d: number): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : d;
  return Math.min(MAX, Math.max(0, Math.floor(n)));
}

function raridadeValida(v: unknown): v is Raridade {
  return typeof v === 'string' && (RARIDADES as readonly string[]).includes(v);
}

function tipoValido(v: unknown): v is ItemTipo {
  return typeof v === 'string' && (ORDEM_TIPOS_ITEM as readonly string[]).includes(v);
}

function tipoPorNome(nome: unknown): ItemTipo | null {
  if (typeof nome !== 'string' || !nome.trim()) return null;
  const limpo = nome.replace(/\s+/g, ' ').trim();
  for (const tipo of ORDEM_TIPOS_ITEM) {
    for (const raridade of RARIDADES) {
      if (TIPOS_ITEM[tipo].nomes[raridade] === limpo) return tipo;
    }
  }
  const legado = TIPO_POR_NOME_LEGADO[limpo];
  if (legado) return legado;
  for (const [pista, tipo] of PISTAS_TIPO) {
    if (pista.test(limpo)) return tipo;
  }
  return null;
}

function nomeSeguro(v: unknown, tipo: ItemTipo): string {
  const padrao = TIPOS_ITEM[tipo].nomes.comum;
  if (typeof v !== 'string') return padrao;
  const limpo = v
    .replace(/[<>&]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
  return limpo || padrao;
}

export function indiceRaridade(r: Raridade): number {
  const i = RARIDADES.indexOf(r);
  return i < 0 ? 0 : i;
}

export function criarInventarioInicial(): Inventario {
  return {
    capacidade: INVENTARIO.slotsIniciais,
    itens: [],
    autoReciclar: null,
    reciclados: 0,
    ouroReciclado: 0,
    semDrops: 0,
  };
}

/** Sanitiza save antigo/corrompido: capacidade passos válidos, itens e stats finitos. */
export function sanitizarInventario(cru: unknown): Inventario {
  const inv = criarInventarioInicial();
  if (!cru || typeof cru !== 'object' || Array.isArray(cru)) return inv;
  const r = cru as Record<string, unknown>;

  const maxPassos = Math.floor(
    (INVENTARIO.slotsMax - INVENTARIO.slotsIniciais) / INVENTARIO.passoSlots,
  );
  const passos = Math.round(
    (inteiroSeguro(r.capacidade, INVENTARIO.slotsIniciais) - INVENTARIO.slotsIniciais) /
      INVENTARIO.passoSlots,
  );
  inv.capacidade =
    INVENTARIO.slotsIniciais +
    Math.min(maxPassos, Math.max(0, passos)) * INVENTARIO.passoSlots;
  inv.autoReciclar = raridadeValida(r.autoReciclar) ? r.autoReciclar : null;
  inv.reciclados = inteiroSeguro(r.reciclados, 0);
  inv.ouroReciclado = inteiroSeguro(r.ouroReciclado, 0);
  inv.semDrops = Math.min(INVENTARIO.pitySemDrops, inteiroSeguro(r.semDrops, 0));

  const itensCru = Array.isArray(r.itens) ? r.itens : [];
  for (const bruto of itensCru) {
    if (inv.itens.length >= inv.capacidade) break;
    if (!bruto || typeof bruto !== 'object') continue;
    const item = bruto as Record<string, unknown>;
    if (!raridadeValida(item.raridade)) continue;
    const tipo = tipoValido(item.tipo) ? item.tipo : tipoPorNome(item.nome) ?? 'moeda';
    inv.itens.push({
      nome: nomeSeguro(item.nome, tipo),
      tipo,
      raridade: item.raridade,
      valor: Math.max(1, inteiroSeguro(item.valor, 1)),
    });
  }
  return inv;
}

export function pesosRaridade(boss: boolean): readonly number[] {
  return RARIDADES.map((r) =>
    boss ? RARIDADE_INFO[r].pesoBoss : RARIDADE_INFO[r].pesoNormal,
  );
}

/** Sorteia uma raridade pelos pesos (0..1 do rng, com clamp nas bordas). */
export function sortearRaridade(
  pesos: readonly number[],
  rng: () => number = Math.random,
): Raridade {
  const total = pesos.reduce((s, p) => s + (Number.isFinite(p) && p > 0 ? p : 0), 0);
  if (total <= 0) return RARIDADES[0];
  let alvo = Math.min(0.999999999, Math.max(0, rng())) * total;
  for (let i = 0; i < RARIDADES.length; i++) {
    const p = Number.isFinite(pesos[i]) && pesos[i] > 0 ? pesos[i] : 0;
    alvo -= p;
    if (alvo < 0) return RARIDADES[i];
  }
  return RARIDADES[RARIDADES.length - 1];
}

/** Sorteia o tipo do item pelos pesos de catálogo. */
export function sortearTipo(rng: () => number = Math.random): ItemTipo {
  const total = ORDEM_TIPOS_ITEM.reduce(
    (s, tipo) => s + Math.max(0, TIPOS_ITEM[tipo].peso),
    0,
  );
  if (total <= 0) return ORDEM_TIPOS_ITEM[0];
  let alvo = Math.min(0.999999999, Math.max(0, rng())) * total;
  for (const tipo of ORDEM_TIPOS_ITEM) {
    alvo -= Math.max(0, TIPOS_ITEM[tipo].peso);
    if (alvo < 0) return tipo;
  }
  return ORDEM_TIPOS_ITEM[ORDEM_TIPOS_ITEM.length - 1];
}

/** Valor em ouro: nível/lugar e multiplicadores de tipo e raridade (variação ±10%). */
export function valorItem(
  tipo: ItemTipo,
  raridade: Raridade,
  nivel: number,
  lugar: number,
  rng: () => number = Math.random,
): number {
  const n = Math.min(10, Math.max(1, Math.floor(Number.isFinite(nivel) ? nivel : 1)));
  const l = Math.min(
    MAX_LUGAR,
    Math.max(0, Math.floor(Number.isFinite(lugar) ? lugar : 0)),
  );
  const base =
    INVENTARIO.valorBase + n * INVENTARIO.valorPorNivel + l * INVENTARIO.valorPorLugar;
  const variacao = 0.9 + Math.min(0.999999, Math.max(0, rng())) * 0.2;
  const infoTipo = TIPOS_ITEM[tipo] ?? TIPOS_ITEM.moeda;
  const infoRaridade = RARIDADE_INFO[raridade] ?? RARIDADE_INFO.comum;
  return Math.max(
    1,
    Math.min(
      MAX,
      Math.round(base * infoTipo.valorMult * infoRaridade.valorMult * variacao),
    ),
  );
}

/** Chance de drop por abate normal, limitada ao teto de balanceamento. */
export function chanceDropNormal(state: GameState): number {
  const nivel = Math.max(
    1,
    Math.floor(Number.isFinite(state.nivel) ? state.nivel : 1),
  );
  return Math.min(
    INVENTARIO.chanceDropMax,
    INVENTARIO.chanceDropBase + nivel * INVENTARIO.chanceDropPorNivel,
  );
}

/** Abates restantes até a garantia; 0 significa que o próximo já é garantido. */
export function pityRestante(state: GameState): number {
  return Math.max(
    0,
    INVENTARIO.pitySemDrops - inteiroSeguro(state.inventario.semDrops, 0),
  );
}

function criarItem(
  state: GameState,
  tipo: ItemTipo,
  raridade: Raridade,
  rng: () => number,
): ItemInventario {
  return {
    nome: TIPOS_ITEM[tipo].nomes[raridade],
    tipo,
    raridade,
    valor: valorItem(tipo, raridade, state.nivel, state.lugar, rng),
  };
}

function sortearItem(
  state: GameState,
  raridade: Raridade,
  rng: () => number,
): ItemInventario {
  const tipo = sortearTipo(rng);
  return criarItem(state, tipo, raridade, rng);
}

function pesosBossRaro(): readonly number[] {
  return RARIDADES.map((r, i) => (i >= indiceRaridade('raro') ? RARIDADE_INFO[r].pesoBoss : 0));
}

export type OrdemInventario = 'recente' | 'raridade' | 'valor';

export interface ItemListado {
  item: ItemInventario;
  /** índice original na mochila; necessário para vender o item certo. */
  indice: number;
}

export interface OpcoesDrops {
  boss?: boolean;
  rng?: () => number;
}

/** Rola 0..1 item em abates normais ou 3 itens no BOSS (mínimo raro). */
export function rolarDrops(state: GameState, opcoes: OpcoesDrops = {}): ItemInventario[] {
  const rng = opcoes.rng ?? Math.random;
  const boss = opcoes.boss === true;
  const inv = state.inventario;

  if (boss) {
    inv.semDrops = 0;
    const pesos = pesosRaridade(true);
    const itens = Array.from({ length: INVENTARIO.itensBoss }, () =>
      sortearItem(state, sortearRaridade(pesos, rng), rng),
    );
    if (!itens.some((item) => indiceRaridade(item.raridade) >= indiceRaridade('raro'))) {
      let pior = 0;
      for (let i = 1; i < itens.length; i++) {
        if (indiceRaridade(itens[i].raridade) < indiceRaridade(itens[pior].raridade)) pior = i;
      }
      const raridade = sortearRaridade(pesosBossRaro(), rng);
      itens[pior] = sortearItem(state, raridade, rng);
    }
    return itens;
  }

  const garantido = inteiroSeguro(inv.semDrops, 0) >= INVENTARIO.pitySemDrops;
  if (!garantido && rng() >= chanceDropNormal(state)) {
    inv.semDrops = Math.min(
      INVENTARIO.pitySemDrops,
      inteiroSeguro(inv.semDrops, 0) + 1,
    );
    return [];
  }

  inv.semDrops = 0;
  const raridade = sortearRaridade(pesosRaridade(false), rng);
  return [sortearItem(state, raridade, rng)];
}

/**
 * Guarda o item na mochila. Vende na hora se a raridade estiver na
 * auto-reciclagem ou se não houver espaço (motivo 'auto' | 'cheio').
 */
export function processarItem(inv: Inventario, item: ItemInventario): DropProcessado {
  const auto = inv.autoReciclar;
  const vendeAuto = auto != null && indiceRaridade(item.raridade) <= indiceRaridade(auto);
  if (vendeAuto || inv.itens.length >= inv.capacidade) {
    inv.reciclados = inteiroSeguro(inv.reciclados + 1, 0);
    inv.ouroReciclado = inteiroSeguro(inv.ouroReciclado + item.valor, 0);
    return { item, vendido: true, motivo: vendeAuto ? 'auto' : 'cheio' };
  }
  inv.itens.push(item);
  return { item, vendido: false, motivo: null };
}

/** Processa um lote de drops, creditando o ouro das reciclagens automáticas. */
export function processarDrops(
  state: GameState,
  itens: readonly ItemInventario[],
): ResultadoDrops {
  const inv = state.inventario;
  const resultado: ResultadoDrops = {
    obtidos: [],
    processados: [],
    reciclados: 0,
    ouro: 0,
  };
  for (const item of itens) {
    const processado = processarItem(inv, item);
    resultado.processados.push(processado);
    if (processado.vendido) {
      resultado.reciclados += 1;
      resultado.ouro += item.valor;
    } else {
      resultado.obtidos.push(item);
    }
  }
  if (resultado.ouro > 0) {
    state.ouro = Math.min(MAX, Math.max(0, state.ouro + resultado.ouro));
  }
  state.updatedAt = Date.now();
  return resultado;
}

/** Vende um item pelo índice; devolve o valor ou null se o índice não existe. */
export function venderItem(state: GameState, indice: number): number | null {
  const inv = state.inventario;
  const i = Math.floor(indice);
  if (!Number.isFinite(i) || i < 0 || i >= inv.itens.length) return null;
  const [item] = inv.itens.splice(i, 1);
  inv.reciclados = inteiroSeguro(inv.reciclados + 1, 0);
  inv.ouroReciclado = inteiroSeguro(inv.ouroReciclado + item.valor, 0);
  state.ouro = Math.min(MAX, Math.max(0, state.ouro + item.valor));
  state.updatedAt = Date.now();
  return item.valor;
}

/** Lista a mochila sem mutar a ordem original, com filtro exato e ordenação. */
export function listarInventario(
  inv: Inventario,
  filtro: Raridade | null = null,
  ordem: OrdemInventario = 'recente',
): ItemListado[] {
  const alvo = filtro !== null && raridadeValida(filtro) ? filtro : null;
  const modo: OrdemInventario =
    ordem === 'raridade' || ordem === 'valor' ? ordem : 'recente';
  const lista = inv.itens
    .map((item, indice) => ({ item, indice }))
    .filter(({ item }) => alvo === null || item.raridade === alvo);

  lista.sort((a, b) => {
    if (modo === 'recente') return b.indice - a.indice;
    if (modo === 'valor') {
      return (
        b.item.valor - a.item.valor ||
        indiceRaridade(b.item.raridade) - indiceRaridade(a.item.raridade)
      );
    }
    return (
      indiceRaridade(b.item.raridade) - indiceRaridade(a.item.raridade) ||
      b.item.valor - a.item.valor ||
      b.indice - a.indice
    );
  });
  return lista;
}

/** Vende todos os itens de uma raridade exata; devolve quantidade e ouro. */
export function venderItensPorRaridade(
  state: GameState,
  raridade: Raridade,
): { itens: number; ouro: number } {
  if (!raridadeValida(raridade)) return { itens: 0, ouro: 0 };
  const inv = state.inventario;
  const vender: ItemInventario[] = [];
  const manter: ItemInventario[] = [];
  for (const item of inv.itens) {
    (item.raridade === raridade ? vender : manter).push(item);
  }
  if (vender.length === 0) return { itens: 0, ouro: 0 };
  const ouro = vender.reduce((s, item) => s + item.valor, 0);
  inv.itens = manter;
  inv.reciclados = inteiroSeguro(inv.reciclados + vender.length, 0);
  inv.ouroReciclado = inteiroSeguro(inv.ouroReciclado + ouro, 0);
  state.ouro = Math.min(MAX, Math.max(0, state.ouro + ouro));
  state.updatedAt = Date.now();
  return { itens: vender.length, ouro };
}

export function venderTodosItens(state: GameState): { itens: number; ouro: number } {
  const inv = state.inventario;
  const itens = inv.itens.length;
  const ouro = inv.itens.reduce((s, item) => s + item.valor, 0);
  if (itens > 0) {
    inv.itens = [];
    inv.reciclados = inteiroSeguro(inv.reciclados + itens, 0);
    inv.ouroReciclado = inteiroSeguro(inv.ouroReciclado + ouro, 0);
    state.ouro = Math.min(MAX, Math.max(0, state.ouro + ouro));
    state.updatedAt = Date.now();
  }
  return { itens, ouro };
}

export function definirAutoReciclar(state: GameState, raridade: Raridade | null): boolean {
  if (raridade !== null && !raridadeValida(raridade)) return false;
  state.inventario.autoReciclar = raridade;
  state.updatedAt = Date.now();
  return true;
}

/** Custo do próximo +50 slots; null quando a mochila está no teto. */
export function custoUpgradeInventario(state: GameState): number | null {
  const inv = state.inventario;
  if (inv.capacidade >= INVENTARIO.slotsMax) return null;
  const passos = Math.floor(
    (inv.capacidade - INVENTARIO.slotsIniciais) / INVENTARIO.passoSlots,
  );
  return Math.max(
    1,
    Math.round(INVENTARIO.custoBase * Math.pow(INVENTARIO.custoFator, Math.max(0, passos))),
  );
}

export function melhorarInventario(state: GameState): boolean {
  const custo = custoUpgradeInventario(state);
  if (custo == null || state.ouro < custo) return false;
  state.ouro -= custo;
  state.inventario.capacidade = Math.min(
    INVENTARIO.slotsMax,
    state.inventario.capacidade + INVENTARIO.passoSlots,
  );
  state.updatedAt = Date.now();
  return true;
}
