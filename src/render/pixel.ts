// render/pixel.ts — primitivas 100% pixel-art: SÓ retângulos inteiros + texto.
// PROIBIDO aqui (e em todo o jogo): arc, ellipse, gradients, strokes curvos.
// Tudo é fillRect com coordenadas arredondadas = pixels nítidos, sem blur.
// Referência normativa: docs/pixel-art-guia.md + docs/paleta.md (render/palette.ts).

export const W = 480;
export const H = 270;
export const CHAO_Y = 218;
export const PX = 240; // x do cavaleiro (centro da arena)

export type Ctx2D = CanvasRenderingContext2D;

export function R(
  ctx: Ctx2D,
  x: number,
  y: number,
  w: number,
  h: number,
  c: string,
): void {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// mistura dois hex (#rrggbb) por t (0=a, 1=b)
export function mistura(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) + ((((pb >> 16) & 255) - ((pa >> 16) & 255)) * t));
  const g = Math.round(((pa >> 8) & 255) + ((((pb >> 8) & 255) - ((pa >> 8) & 255)) * t));
  const bl = Math.round((pa & 255) + (((pb & 255) - (pa & 255)) * t));
  return `rgb(${r},${g},${bl})`;
}

// Escurece (f<1, com shift p/ o azul) ou clareia (f>1) um hex.
export function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  if (f < 1) {
    r = Math.round(r * f);
    g = Math.round(g * f);
    b = Math.round(b * f + 8 * (1 - f));
  } else {
    r = Math.round(r + (255 - r) * (f - 1));
    g = Math.round(g + (255 - g) * (f - 1));
    b = Math.round(b + (255 - b) * (f - 1));
  }
  return `rgb(${r},${g},${b})`;
}

// Massa com volume: base + 1px de luz em cima + sombra embaixo (luz do topo).
export function V(
  ctx: Ctx2D,
  x: number,
  y: number,
  w: number,
  h: number,
  c: string,
): void {
  R(ctx, x, y, w, h, c);
  R(ctx, x, y, w, 1, shade(c, 1.35));
  R(ctx, x, y + h - 1, w, 1, shade(c, 0.62));
}

// Espelha horizontalmente em torno de x (para olhar p/ esquerda).
export function comDir(ctx: Ctx2D, x: number, dir: number, fn: () => void): void {
  if (dir < 0) {
    ctx.save();
    ctx.translate(x * 2, 0);
    ctx.scale(-1, 1);
    fn();
    ctx.restore();
  } else {
    fn();
  }
}

// Círculo pixelado (fileiras espelhadas, sem arc).
export function pixelCirculo(
  ctx: Ctx2D,
  cx: number,
  cy: number,
  r: number,
  cor: string,
  alpha = 1,
): void {
  ctx.globalAlpha = alpha;
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(r * r - dy * dy));
    R(ctx, cx - w, cy + dy, w * 2 + 1, 1, cor);
  }
  ctx.globalAlpha = 1;
}

// Elipse pixelada preenchida (sombras no chão).
export function elipsePixel(
  ctx: Ctx2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  cor: string,
  alpha = 1,
): void {
  ctx.globalAlpha = alpha;
  for (let dy = -ry; dy <= ry; dy++) {
    const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
    R(ctx, cx - w, cy + dy, w * 2 + 1, 1, cor);
  }
  ctx.globalAlpha = 1;
}

// Contorno de elipse em pontos (círculo da arena, sem stroke curvo).
export function elipsePontos(
  ctx: Ctx2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  cor: string,
  passoGraus = 7,
  px = 2,
): void {
  for (let a = 0; a < 360; a += passoGraus) {
    const rad = (a * Math.PI) / 180;
    R(ctx, cx + Math.cos(rad) * rx, cy + Math.sin(rad) * ry, px, px, cor);
  }
}

// Pirâmide em degraus (montanhas, sem triângulos vetoriais).
export function piramide(
  ctx: Ctx2D,
  cx: number,
  baseY: number,
  w: number,
  h: number,
  cor: string,
): void {
  const degraus = Math.max(2, Math.round(h / 4));
  for (let i = 0; i < degraus; i++) {
    const k = i / degraus;
    const ww = Math.max(2, w * (1 - k));
    R(ctx, cx - ww / 2, baseY - ((i + 1) * h) / degraus, ww, h / degraus + 0.7, cor);
  }
}

// Quadrado vazado (anéis de choque, glow, molduras).
export function quadradoVazado(
  ctx: Ctx2D,
  x: number,
  y: number,
  lado: number,
  cor: string,
  alpha = 1,
  esp = 1,
): void {
  ctx.globalAlpha = alpha;
  R(ctx, x, y, lado, esp, cor);
  R(ctx, x, y + lado - esp, lado, esp, cor);
  R(ctx, x, y, esp, lado, cor);
  R(ctx, x + lado - esp, y, esp, lado, cor);
  ctx.globalAlpha = 1;
}

// Céu em faixas duras (sem gradiente): n cores misturadas topo→fundo.
export function ceuBandas(
  ctx: Ctx2D,
  topo: string,
  fundo: string,
  y0: number,
  y1: number,
  n = 8,
): void {
  for (let i = 0; i < n; i++) {
    R(ctx, 0, y0 + ((y1 - y0) * i) / n, W, (y1 - y0) / n + 1, mistura(topo, fundo, i / (n - 1)));
  }
}

// Dithering quadriculado (transições sem banding).
export function ditherLinha(
  ctx: Ctx2D,
  y: number,
  cor: string,
  passo = 4,
  ini = 0,
): void {
  for (let dx = ini; dx < W; dx += passo) {
    R(ctx, dx, y, 2, 2, cor);
  }
}

// Sprite em matriz de strings — 2º caminho oficial de criação (ver docs/).
// '.' ou ' ' = transparente. Cada char pinta 1 bloco px×px via R() (nítido).
// Ex.: desenharSpriteMatriz(ctx, ['.XX.','.XXX.'], { X: '#e03131' }, x, y, 3)
export function desenharSpriteMatriz(
  ctx: Pick<Ctx2D, 'fillStyle' | 'fillRect'>,
  matriz: string[],
  mapa: Record<string, string>,
  x: number,
  y: number,
  px = 1,
): { w: number; h: number } {
  const larg = Math.max(...matriz.map((l) => l.length));
  matriz.forEach((linha, dy) => {
    [...linha].forEach((ch, dx) => {
      if (ch === '.' || ch === ' ') return;
      const cor = mapa[ch];
      if (!cor) return;
      (ctx as Ctx2D).fillStyle = cor;
      ctx.fillRect(Math.round(x + dx * px), Math.round(y + dy * px), Math.round(px), Math.round(px));
    });
  });
  return { w: larg * px, h: matriz.length * px };
}
