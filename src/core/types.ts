// core/types.ts — tipos canônicos do jogo. Fonte única de verdade para o estado.
// Lógica pura: nenhum acesso a DOM, canvas ou localStorage aqui.

export type EquipSlot = 'elmo' | 'camisa' | 'calcas' | 'botas' | 'arma' | 'escudo';
export type SkillId = 'afiado' | 'vigor' | 'regen' | 'rapidez' | 'saque';
export type BiomaId = 'campo' | 'floresta' | 'caverna' | 'neve' | 'castelo';
export type Raridade = 'comum' | 'incomum' | 'raro' | 'ultra' | 'lendario';
export type ItemTipo =
  | 'moeda'
  | 'anel'
  | 'colar'
  | 'luva'
  | 'pena'
  | 'cantil'
  | 'osso'
  | 'pedra'
  | 'broche'
  | 'cristal'
  | 'reliquia'
  | 'gema';

export interface EquipTier {
  nome: string;
  custo: number;
  atk: number;
  hp: number;
}

export interface EquipDef {
  nome: string;
  tiers: EquipTier[];
}

export interface ItemTipoDef {
  nome: string;
  /** Um nome por raridade, do comum ao lendário. */
  nomes: Record<Raridade, string>;
  valorMult: number;
  peso: number;
}

export interface SkillDef {
  nome: string;
  desc: string;
  base: number;
}

export interface LugarDef {
  id: string;
  nome: string;
  bioma: BiomaId;
  kinds: number[];
  bossKind: number;
  bossNome: string;
}

export interface RegrasCombate {
  intervaloBase: number;
  intervaloInimigo: number;
  alcancePlayer: number;
  alcanceInimigo: number;
  spawnCd: number;
  velBase: number;
  /** distância (px) do spawn em relação ao cavaleiro */
  distSpawn: number;
  /** cooldown inicial do cavaleiro (s) */
  cdInicialJogador: number;
  /** cooldown inicial do inimigo ao entrar em alcance (s) */
  cdInicialInimigo: number;
}

export interface Cavaleiro {
  nome: string;
  atk: number;
  hp: number;
}

export interface ItemInventario {
  nome: string;
  tipo: ItemTipo;
  raridade: Raridade;
  valor: number;
}

export interface Inventario {
  capacidade: number;
  itens: ItemInventario[];
  /** vende na hora os itens desta raridade ou abaixo (null = desligado) */
  autoReciclar: Raridade | null;
  reciclados: number;
  ouroReciclado: number;
  /** abates seguidos sem drop; no limite, o próximo é garantido */
  semDrops: number;
}

export interface GameState {
  ouro: number;
  lugar: number; // índice absoluto (lugarDe/voltaDe derivam lugar + volta)
  nivel: number; // 1..10 (10 = boss)
  vitorias: number;
  derrotas: number;
  abates: number;
  equip: Record<EquipSlot, number>;
  skills: Record<SkillId, number>;
  cavaleiro: Cavaleiro;
  /** brasões acumulados em renascimentos (bônus permanente) */
  brasoes: number;
  /** quantas vezes o reino renasceu */
  renascimentos: number;
  inventario: Inventario;
  updatedAt: number;
}

/** Save cru vindo do localStorage: pode conter modelo antigo ou corrompido. */
export type SaveCru = Omit<
  Partial<GameState>,
  'cavaleiro' | 'equip' | 'skills' | 'inventario'
> & {
  nivelInimigo?: unknown;
  herois?: Array<{ nome?: unknown; atk?: unknown; hp?: unknown }>;
  quartel?: unknown;
  muralha?: unknown;
  mercado?: unknown;
  treinar?: unknown;
  cavaleiro?: Partial<Cavaleiro> | unknown;
  equip?: Partial<Record<EquipSlot, unknown>>;
  skills?: Partial<Record<SkillId, unknown>>;
  inventario?: unknown;
  [extra: string]: unknown;
};

export interface CombatParams {
  atk: number;
  hp: number;
  /** segundos entre golpes do cavaleiro */
  intervalo: number;
  /** vida/s regenerada */
  regen: number;
  /** multiplicador de ouro (skill saque) */
  ouroMult: number;
}

export interface Inimigo {
  kind: number;
  nome: string;
  hp: number;
  maxHp: number;
  atk: number;
  boss: boolean;
  gold: number;
}

export interface Horda {
  inimigos: Inimigo[];
  total: number;
  bonus: number;
  boss: boolean;
  lugar: string;
  bioma: BiomaId;
}

export interface SimResult {
  venceu: boolean;
  tempo: number;
  abates: number;
  horda: Horda;
}

export interface AvancoNivel {
  subiuLugar: boolean;
  volta: number;
}

export interface GanhoOffline {
  segundosFora: number;
  ouro: number;
}

export interface RenascimentoResultado {
  possivel: boolean;
  ganhos: number;
  total: number;
}

export interface CompraAuto {
  compras: number;
  gasto: number;
}

export interface DropProcessado {
  item: ItemInventario;
  vendido: boolean;
  motivo: 'auto' | 'cheio' | null;
}

export interface ResultadoDrops {
  obtidos: ItemInventario[];
  processados: DropProcessado[];
  reciclados: number;
  ouro: number;
}
