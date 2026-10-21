// core/state.ts — criação e migração de save. Único lugar que conhece
// os formatos antigos (fase única, esquadrão, prédios) e o saneamento anti-NaN.

import {
  MAX_LUGAR,
  MAX_SKILL,
  MAX_TIER,
  MISSOES,
  ORDEM_CONQUISTAS,
  ORDEM_MISSOES,
  ORDEM_SKILLS,
  ORDEM_SLOTS,
  PRESTIGIO,
} from './data.js';
import { criarInventarioInicial, sanitizarInventario } from './inventory.js';
import { missoesVazias } from './missions.js';
import type {
  ConquistaId,
  EquipSlot,
  Estatisticas,
  GameState,
  MissaoTipo,
  MissoesDiarias,
  SaveCru,
  SkillId,
} from './types.js';

const num = (v: unknown, d: number): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : d;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  }
  return d;
};

const ouroSeguro = (n: number): number =>
  Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, n));

const inteiroSeguro = (v: unknown, d: number): number =>
  Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(num(v, d))));

const statSegura = (v: unknown, d: number): number =>
  Math.min(Number.MAX_SAFE_INTEGER, Math.max(1, num(v, d)));

const estatisticasSeguras = (v: unknown): Estatisticas => {
  const e =
    v && typeof v === 'object'
      ? (v as Partial<Record<keyof Estatisticas, unknown>>)
      : {};
  return {
    ouroTotal: inteiroSeguro(e.ouroTotal, 0),
    bossesDerrotados: inteiroSeguro(e.bossesDerrotados, 0),
    elitesDerrotados: inteiroSeguro(e.elitesDerrotados, 0),
    itensEncontrados: inteiroSeguro(e.itensEncontrados, 0),
    itensLendarios: inteiroSeguro(e.itensLendarios, 0),
    maiorLugar: Math.min(MAX_LUGAR, inteiroSeguro(e.maiorLugar, 0)),
    maiorNivel: Math.min(10, Math.max(1, inteiroSeguro(e.maiorNivel, 1))),
  };
};

const conquistasSeguras = (v: unknown): ConquistaId[] => {
  if (!Array.isArray(v)) return [];
  const validas = new Set<string>(ORDEM_CONQUISTAS);
  return [
    ...new Set(
      v.filter(
        (id): id is ConquistaId =>
          typeof id === 'string' && validas.has(id),
      ),
    ),
  ];
};

const missoesSeguras = (v: unknown): MissoesDiarias => {
  const base = missoesVazias();
  if (!v || typeof v !== 'object') return base;
  const raw = v as Record<string, unknown>;
  const data =
    typeof raw.data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.data)
      ? raw.data
      : '';
  const validas = new Set<string>(ORDEM_MISSOES);
  const tipos = Array.isArray(raw.tipos)
    ? [
        ...new Set(
          raw.tipos.filter(
            (tipo): tipo is MissaoTipo =>
              typeof tipo === 'string' && validas.has(tipo),
          ),
        ),
      ]
    : [];
  const progressoRaw =
    raw.progresso && typeof raw.progresso === 'object'
      ? (raw.progresso as Record<string, unknown>)
      : {};
  const progresso = { ...base.progresso };
  for (const tipo of ORDEM_MISSOES) {
    progresso[tipo] = Math.min(
      MISSOES[tipo].meta,
      inteiroSeguro(progressoRaw[tipo], 0),
    );
  }
  const concluidas = Array.isArray(raw.concluidas)
    ? [
        ...new Set(
          raw.concluidas.filter(
            (tipo): tipo is MissaoTipo =>
              typeof tipo === 'string' &&
              validas.has(tipo) &&
              tipos.includes(tipo as MissaoTipo),
          ),
        ),
      ]
    : [];
  return {
    data,
    tipos,
    progresso,
    concluidas,
    bonusPago: raw.bonusPago === true,
  };
};

const nomeSeguro = (v: unknown): string => {
  if (typeof v !== 'string') return 'Sor Aria';
  const limpo = v
    .replace(/[<>&]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 24);
  return limpo || 'Sor Aria';
};

export function criarEstadoInicial(): GameState {
  return {
    ouro: 30,
    lugar: 0,
    nivel: 1,
    vitorias: 0,
    derrotas: 0,
    abates: 0,
    equip: { elmo: 0, camisa: 0, calcas: 0, botas: 0, arma: 0, escudo: 0 },
    skills: {
      afiado: 0,
      vigor: 0,
      regen: 0,
      rapidez: 0,
      saque: 0,
      fortuna: 0,
      tenacidade: 0,
    },
    cavaleiro: { nome: 'Sor Aria', atk: 10, hp: 100 },
    brasoes: 0,
    renascimentos: 0,
    inventario: criarInventarioInicial(),
    estatisticas: {
      ouroTotal: 0,
      bossesDerrotados: 0,
      elitesDerrotados: 0,
      itensEncontrados: 0,
      itensLendarios: 0,
      maiorLugar: 0,
      maiorNivel: 1,
    },
    conquistas: [],
    missoes: missoesVazias(),
    updatedAt: Date.now(),
  };
}

export function migrarSave(state: SaveCru | null | undefined): GameState {
  if (!state) return criarEstadoInicial();
  const agora = Date.now();
  const base = criarEstadoInicial();
  const s: GameState & Record<string, unknown> = { ...base, ...(state as object) } as GameState &
    Record<string, unknown>;

  // números sempre finitos (save corrompido = NaN = luta infinita)
  s.ouro = ouroSeguro(num(s.ouro, 30));
  s.lugar = Math.min(MAX_LUGAR, Math.max(0, Math.floor(num(s.lugar, 0))));
  s.nivel = Math.min(10, Math.max(1, Math.floor(num(s.nivel, 1))));
  for (const k of ['vitorias', 'derrotas', 'abates'] as const) {
    (s as Record<string, number>)[k] = inteiroSeguro(s[k], 0);
  }
  // relógio do save: nunca NaN/futuro (futuro travaria ou inflaria o offline)
  s.updatedAt = Math.min(agora, Math.max(0, Math.floor(num(s.updatedAt, agora))));

  // modelo antigo de fase única
  const nivelInimigo = num((s as SaveCru).nivelInimigo, NaN);
  if (Number.isFinite(nivelInimigo) && s.nivel === 1 && s.lugar === 0) {
    const prog = Math.max(0, Math.floor(nivelInimigo) - 1);
    s.lugar = Math.min(MAX_LUGAR, Math.floor(prog / 10));
    s.nivel = (prog % 10) + 1;
  }
  delete s.nivelInimigo;

  // modelo antigo de esquadrão vira base do cavaleiro
  const herois = (s as SaveCru).herois;
  const cavRaw = (s as SaveCru).cavaleiro as { nome?: unknown; atk?: unknown; hp?: unknown } | undefined;
  const cavInvalido = !cavRaw || typeof cavRaw !== 'object' || !Number.isFinite(num(cavRaw.atk, NaN));
  if (cavInvalido && Array.isArray(herois) && herois.length > 0) {
    const atk = herois.reduce((a, h) => a + num(h?.atk, 0), 0);
    const hp = herois.reduce((a, h) => a + num(h?.hp, 0), 0);
    const primeiro = typeof herois[0]?.nome === 'string' ? (herois[0].nome as string) : 'Aria';
    s.cavaleiro = { nome: `Sor ${primeiro}`, atk: statSegura(atk, 6), hp: statSegura(hp, 40) };
  }
  delete s.herois;
  if (!s.cavaleiro || typeof s.cavaleiro !== 'object') s.cavaleiro = { ...base.cavaleiro };
  s.cavaleiro = {
    nome: nomeSeguro(s.cavaleiro.nome),
    atk: statSegura(s.cavaleiro.atk, 10),
    hp: statSegura(s.cavaleiro.hp, 100),
  };

  // prestígio: nunca NaN e nunca acima do teto (evita multiplicador infinito)
  s.brasoes = Math.min(PRESTIGIO.maxBrasoes, inteiroSeguro(s.brasoes, 0));
  s.renascimentos = inteiroSeguro(s.renascimentos, 0);

  // mochila: capacidade em passos de 50, itens/auto-reciclagem válidos
  s.inventario = sanitizarInventario((state as SaveCru).inventario);

  // conquistas: estatísticas permanentes e saves antigos ganham crédito retroativo
  const est = estatisticasSeguras((state as SaveCru).estatisticas);
  est.maiorLugar = Math.max(est.maiorLugar, s.lugar);
  est.maiorNivel = Math.max(est.maiorNivel, s.nivel);
  est.bossesDerrotados = Math.max(est.bossesDerrotados, s.lugar);
  est.ouroTotal = Math.max(est.ouroTotal, s.ouro);
  est.itensEncontrados = Math.max(
    est.itensEncontrados,
    s.inventario.itens.length + s.inventario.reciclados,
  );
  est.itensLendarios = Math.max(
    est.itensLendarios,
    s.inventario.itens.filter((item) => item.raridade === 'lendario').length,
  );
  s.estatisticas = est;
  s.conquistas = conquistasSeguras((state as SaveCru).conquistas);
  s.missoes = missoesSeguras((state as SaveCru).missoes);

  // prédios antigos viram reembolso em ouro (sistema removido)
  let refund = 0;
  for (const k of ['quartel', 'muralha', 'mercado']) {
    refund += Math.max(0, Math.floor(num(s[k], 1)) - 1) * 40;
    delete s[k];
  }
  delete s.treinar;
  s.ouro = ouroSeguro(s.ouro + refund);

  // equipamentos e skills com defaults
  const equipCru = (state.equip ?? {}) as Partial<Record<EquipSlot, unknown>>;
  s.equip = { ...base.equip };
  for (const slot of ORDEM_SLOTS) {
    s.equip[slot] = Math.min(MAX_TIER, Math.max(0, Math.floor(num(equipCru[slot], 0))));
  }
  const skillsCru = (state.skills ?? {}) as Partial<Record<SkillId, unknown>>;
  s.skills = { ...base.skills };
  for (const id of ORDEM_SKILLS) {
    s.skills[id] = Math.min(MAX_SKILL, Math.max(0, Math.floor(num(skillsCru[id], 0))));
  }

  return s as GameState;
}
