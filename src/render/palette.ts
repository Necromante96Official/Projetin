// render/palette.ts — FONTE ÚNICA de cores do jogo (reformulação out/2026).
// Regra normativa: sprite novo SÓ usa cor daqui. Ver docs/paleta.md,
// docs/pixel-art-guia.md e docs/sprites-referencia.md.
//
// Rampas com hue-shift: sombra esfria (puxa azul/roxo), luz esquenta (amarelo).
// Helpers shade()/V() em render/pixel.ts já aplicam isso (0.62 sombra / 1.35 luz).

export const PALETA = {
  // pele
  pele: '#f1c27d',
  peleSombra: '#d9a066',
  cabelo: '#5c3a21',
  contornoPele: '#6b5433',
  contornoPele2: '#7a6238',
  // metal
  aco: '#8fa3bd',
  acoEscuro: '#5d6f88',
  acoProfundo: '#39424f',
  contornoHeroi: '#1c2333',
  brilhoMetal: '#dfe8ee',
  branco: '#ffffff',
  // ouro / divino
  ouro: '#e8b34a',
  ouroLuz: '#fff3bf',
  ouroSombra: '#8a6414',
  // tecido
  pano: '#c9b48a',
  panoEscuro: '#8a7a5c',
  panoProfundo: '#6b5f45',
  tabardo: '#3f8cff',
  tunica: '#c2255c',
  // couro / madeira
  couro: '#6b4a2f',
  couroClaro: '#9a8a70',
  madeira: '#8a6d3b',
  madeiraEscura: '#5c4a2f',
  madeiraNoite: '#3a2f1e',
  couroNoite: '#2b2118',
  // monstros (rampas por tipo — ver TIPOS em render/sprites/monsters.ts)
  goblin: '#51cf66',
  goblinEscuro: '#2f9e44',
  orcEscuro: '#1e5c2e',
  lobo: '#59616b',
  loboEscuro: '#33393f',
  osso: '#e9e4da',
  ossoEscuro: '#8a8578',
  capuz: '#b197fc',
  capuzEscuro: '#5f3dc4',
  troll: '#63a375',
  trollEscuro: '#3d6b4f',
  morcego: '#a78bfa',
  morcegoEscuro: '#5b3fa8',
  aranha: '#6d4c9f',
  aranhaEscura: '#3b2a5a',
  gelo: '#a5d8ff',
  geloEscuro: '#4d7fa8',
  fantasma: '#9ae6c8',
  fantasmaEscuro: '#2f6b57',
  dragao: '#ff922b',
  dragaoEscuro: '#a63a0a',
  // fx / ui
  danoDado: '#ffd43b',
  danoSofrido: '#ff8787',
  vermelho: '#e03131',
  vidaBoss: '#ff6b6b',
  cura: '#8ce99a',
  azulClaro: '#74c0fc',
  laminaRunica: '#bfe9ff',
  olho: '#241f26',
  preto: '#000000',
} as const;

export type CorPaleta = (typeof PALETA)[keyof typeof PALETA];

// Todas as cores válidas (para validar sprites em matriz ou hex solto).
export const CORES_VALIDAS: ReadonlySet<string> = new Set(
  Object.values(PALETA).map((c) => c.toLowerCase()),
);

// Spec travado do projeto (espelho de docs/sprites-referencia.md).
export const SPEC = {
  grade: '480x270',
  chaoY: 218,
  cavaleiroX: 240,
  escalaArena: 3.6,
  luz: 'topo',
  outline: '1px selout (tom mais escuro da rampa)',
  tiersPorSlot: 4, // 0..3
  slots: ['elmo', 'camisa', 'calcas', 'botas', 'arma', 'escudo'],
} as const;

// Lint simples para sprites em matriz (ver desenharSpriteMatriz em render/pixel.ts).
// matriz: array de strings; '.' ou ' ' = transparente. mapa: { char: '#hex' }.
// Retorna { ok, coresIntrusas: [], orfaos: n }.
export function validarSprite(
  matriz: string[],
  mapa: Record<string, string> = {},
  paletaOuLista: Readonly<Record<string, string>> | readonly string[] = PALETA,
): { ok: boolean; coresIntrusas: string[]; orfaos: number } {
  const validas = new Set(
    (Array.isArray(paletaOuLista) ? paletaOuLista : Object.values(paletaOuLista)).map((c) =>
      String(c).toLowerCase(),
    ),
  );
  const coresIntrusas: string[] = [];
  for (const cor of Object.values(mapa)) {
    const c = String(cor).toLowerCase();
    if (c.startsWith('#') && !validas.has(c) && !coresIntrusas.includes(cor)) {
      coresIntrusas.push(cor);
    }
  }
  // Pixel órfão: sólido sem vizinho 4-dir da mesma letra (ruído a 1x).
  let orfaos = 0;
  const solido = (x: number, y: number): boolean => {
    if (y < 0 || y >= matriz.length) return false;
    const lin = matriz[y];
    if (!lin || x < 0 || x >= lin.length) return false;
    const ch = lin[x];
    return ch !== '.' && ch !== ' ';
  };
  matriz.forEach((lin, y) => {
    [...lin].forEach((ch, x) => {
      if (ch === '.' || ch === ' ') return;
      if (!solido(x - 1, y) && !solido(x + 1, y) && !solido(x, y - 1) && !solido(x, y + 1)) {
        orfaos++;
      }
    });
  });
  return { ok: coresIntrusas.length === 0, coresIntrusas, orfaos };
}

// Valida o uso real: recebe lista de hex usados e aponta intrusas.
// (sprites procedurais usam fillRect; o lint de matriz cobre sprites novos em matriz.)
export function validarCores(hexesUsados: string[]): {
  ok: boolean;
  coresIntrusas: string[];
} {
  const intrusas = [...new Set(hexesUsados.map((c) => String(c).toLowerCase()))].filter(
    (c) => c.startsWith('#') && !CORES_VALIDAS.has(c),
  );
  return { ok: intrusas.length === 0, coresIntrusas: intrusas };
}
