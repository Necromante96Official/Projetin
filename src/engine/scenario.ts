// engine/scenario.ts — fundo 100% em retângulos: faixas de céu, sol/lua pixel,
// montanhas em degraus, pinheiros em blocos, nuvens em blocos.
// Guia: docs/sprites-referencia.md §5. Paleta: render/palette.ts.

import { LUGARES } from '../core/data.js';
import type { BiomaId } from '../core/types.js';
import {
  W,
  H,
  CHAO_Y,
  PX,
  R,
  mistura,
  ceuBandas,
  pixelCirculo,
  piramide,
  elipsePontos,
  elipsePixel,
  ditherLinha,
  type Ctx2D,
} from '../render/pixel.js';

export type ParticulaTipo = 'folha' | 'neve' | 'vaga' | 'brasa' | 'cinza' | 'cinzas';

export interface Particula {
  x: number;
  y: number;
  vx: number;
  vy: number;
  s: number;
  c: string;
  vida: number;
  tipo: string;
}

interface BiomaBase {
  nome: string;
  ceu: [string, string];
  astro: 'sol' | 'lua' | 'nenhum';
  longe: string;
  chaoA: string;
  chaoB: string;
  part: 'folhas' | 'vagalumes' | 'brasas' | 'neve' | 'cinzas';
}

export interface Bioma extends BiomaBase {
  volta: number;
}

const BIOMAS: Record<BiomaId, BiomaBase> = {
  campo: {
    nome: 'Campo Verde',
    ceu: ['#6db9e8', '#d8ecb0'],
    astro: 'sol',
    longe: '#5d9455',
    chaoA: '#62a84e',
    chaoB: '#3f7a33',
    part: 'folhas',
  },
  floresta: {
    nome: 'Floresta Sombria',
    ceu: ['#274b5e', '#16282f'],
    astro: 'lua',
    longe: '#1d4a38',
    chaoA: '#2e5d43',
    chaoB: '#1a3828',
    part: 'vagalumes',
  },
  caverna: {
    nome: 'Caverna de Brasas',
    ceu: ['#40202f', '#140d1c'],
    astro: 'nenhum',
    longe: '#5c3040',
    chaoA: '#4d3642',
    chaoB: '#2a1d26',
    part: 'brasas',
  },
  neve: {
    nome: 'Pico Nevado',
    ceu: ['#9dbfdd', '#e9f1f5'],
    astro: 'sol',
    longe: '#8499ad',
    chaoA: '#e2ebf1',
    chaoB: '#aec2d1',
    part: 'neve',
  },
  castelo: {
    nome: 'Castelo Sombrio',
    ceu: ['#4c3b72', '#191230'],
    astro: 'lua',
    longe: '#2b2148',
    chaoA: '#4c4663',
    chaoB: '#2a2637',
    part: 'cinzas',
  },
};

export function biomaPorLugar(lugarAbs: number, biomaId: BiomaId): Bioma {
  const volta = Math.floor(lugarAbs / Math.max(1, LUGARES.length)) + 1;
  return { ...BIOMAS[biomaId], volta };
}

function semente(n: number): () => number {
  let s = (n * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Pirâmide invertida (estalactites da caverna).
function piramideBaixo(
  ctx: Ctx2D,
  cx: number,
  topoY: number,
  w: number,
  h: number,
  cor: string,
): void {
  const degraus = Math.max(2, Math.round(h / 4));
  for (let i = 0; i < degraus; i++) {
    const k = i / degraus;
    const ww = Math.max(2, w * (1 - k));
    R(ctx, cx - ww / 2, topoY + (i * h) / degraus, ww, h / degraus + 0.7, cor);
  }
}

// Camada intermediária: dá profundidade entre a cordilheira e a arena.
function desenharMeio(ctx: Ctx2D, B: Bioma, nivelSeed: number, t: number): void {
  const r = semente(nivelSeed * 43 + 17);

  if (B.part === 'brasas') {
    // teto rochoso com estalactites e veios de brasa ao fundo
    for (let x = -10; x < W + 24; ) {
      const w = 12 + r() * 26;
      const h = 22 + r() * 52;
      piramideBaixo(ctx, x + w / 2, -2, w, h, '#1c121e');
      if (r() > 0.72) R(ctx, x + w / 2 - 1, h - 8, 2, 4, '#b8462b');
      x += 26 + r() * 38;
    }
    for (let i = 0; i < 8; i++) {
      const lx = Math.round(r() * W);
      const ly = CHAO_Y - 4 - Math.round(r() * 10);
      R(ctx, lx, ly, 8 + Math.round(r() * 12), 2, '#5c2a2a');
      if (r() > 0.5) R(ctx, lx + 3, ly - 1, 4, 1, '#ff922b');
    }
    return;
  }

  if (B.part === 'cinzas') {
    // castelo distante: muralha, torres e janelas acesas
    const base = CHAO_Y + 2;
    ctx.globalAlpha = 0.6;
    R(ctx, -10, base - 24, W + 20, 24, '#231b3c');
    for (const [tx, tw, th] of [
      [36, 18, 58],
      [150, 24, 76],
      [316, 20, 62],
      [426, 26, 86],
    ] as const) {
      R(ctx, tx, base - th, tw, th, '#2a2047');
      R(ctx, tx, base - th, 2, th, '#3a2d5e');
      for (let c = 0; c < tw; c += 6) R(ctx, tx + c, base - th - 4, 3, 4, '#2a2047');
      const janela = Math.sin(t * 2 + tx) > -0.4;
      if (janela) {
        R(ctx, tx + tw / 2 - 2, base - th + 16, 4, 5, '#e8b34a');
        R(ctx, tx + tw / 2 - 1, base - th + 17, 2, 2, '#fff3bf');
      }
      if (r() > 0.5) R(ctx, tx + tw / 2 - 3, base - th + 32, 6, 4, '#e8b34a');
    }
    // ponte levadiça + névoa na base
    R(ctx, W / 2 - 26, base - 18, 52, 18, '#1c1631');
    for (let x = 0; x < W; x += 4) R(ctx, x, base - 6, 2, 2, 'rgba(233,236,245,0.12)');
    ctx.globalAlpha = 1;
    return;
  }

  // colinas suaves no horizonte (campo, floresta e neve)
  const corColina =
    B.part === 'neve'
      ? '#a9bfcf'
      : B.part === 'vagalumes'
        ? '#173a2d'
        : mistura(B.chaoA, '#101a14', 0.28);
  const corLuz = mistura(corColina, '#ffffff', 0.18);
  for (let i = 0; i < 6; i++) {
    const cx = i * 100 + 20 + r() * 40;
    const rx = 62 + r() * 54;
    const ry = 18 + r() * 22;
    elipsePixel(ctx, cx, CHAO_Y + 10, rx, ry, corColina, 0.95);
    elipsePixel(ctx, cx - rx * 0.2, CHAO_Y + 10 - ry * 0.42, rx * 0.55, ry * 0.28, corLuz, 0.5);
  }

  if (B.part === 'folhas') {
    // vilarejo distante: telhados, paredes e janelas quentes
    const base = CHAO_Y + 2;
    for (let i = 0; i < 4; i++) {
      const hx = 42 + i * 104 + Math.round(r() * 28);
      const hw = 18 + Math.round(r() * 8);
      const hh = 10 + Math.round(r() * 5);
      R(ctx, hx, base - hh, hw, hh, '#6b5a48');
      R(ctx, hx, base - hh, hw, 2, '#8a7a5c');
      piramide(ctx, hx + hw / 2, base - hh + 1, hw + 8, 9, '#7a4030');
      R(ctx, hx + Math.round(hw * 0.3), base - hh + 4, 3, 3, '#ffd43b');
      R(ctx, hx + Math.round(hw * 0.3), base - hh + 4, 1, 1, '#fff3bf');
      R(ctx, hx + hw - 5, base - hh - 6, 2, 6, '#4a3826');
    }
  } else if (B.part === 'vagalumes') {
    // linha de árvores densa, com neblina entre os troncos
    for (let x = -8; x < W + 16; ) {
      const w = 18 + r() * 18;
      const h = 30 + r() * 34;
      piramide(ctx, x + w / 2, CHAO_Y + 2, w, h, '#0f2a20');
      R(ctx, x + w / 2 - 1, CHAO_Y - h * 0.45, 2, h * 0.45, '#0a1d16');
      x += 16 + r() * 18;
    }
    for (let x = 0; x < W; x += 4) R(ctx, x, CHAO_Y - 6, 2, 2, 'rgba(209,241,220,0.09)');
  } else if (B.part === 'neve') {
    // pinheiros nevados ao fundo
    for (let x = -4; x < W + 12; ) {
      const w = 20 + r() * 16;
      const h = 26 + r() * 34;
      piramide(ctx, x + w / 2, CHAO_Y + 2, w, h, '#416b5a');
      R(ctx, x + w / 2 - w * 0.3, CHAO_Y - h * 0.7, w * 0.6, 2, '#e9f1f5');
      R(ctx, x + w / 2 - w * 0.2, CHAO_Y - h * 0.42, w * 0.4, 2, '#e9f1f5');
      x += 22 + r() * 20;
    }
  }
}

export function desenharCenario(
  ctx: Ctx2D,
  bioma: Bioma,
  volta: number,
  nivelSeed: number,
  t: number,
): void {
  const B = bioma;
  ceuBandas(ctx, B.ceu[0], B.ceu[1], 0, CHAO_Y + 2, 9);

  // astros pixelados — halo em dither (sem glow borrado com alpha)
  if (B.astro === 'sol') {
    const pulso = Math.round(Math.sin(t * 2) * 1);
    // halo quadriculado 1: pontos espaçados, 100% opacos
    ctx.fillStyle = '#fff3bf';
    for (let hy = -22; hy <= 22; hy += 4) {
      for (let hx = -22; hx <= 22; hx += 4) {
        if ((hx + hy) % 8 !== 0) continue;
        const d = Math.sqrt(hx * hx + hy * hy);
        if (d > 15 && d < 23 + pulso) ctx.fillRect(408 + hx, 44 + hy, 2, 2);
      }
    }
    pixelCirculo(ctx, 408, 44, 13, '#ffe066', 1);
    pixelCirculo(ctx, 408, 44, 11, '#fff3bf', 1);
    pixelCirculo(ctx, 404, 40, 5, '#ffffff', 1);
    // raios em cruz (piscam devagar)
    if (Math.sin(t * 2) > 0) {
      R(ctx, 408 - 2, 44 - 19, 4, 3, '#fff3bf');
      R(ctx, 408 - 2, 44 + 16, 4, 3, '#fff3bf');
      R(ctx, 408 - 19, 44 - 2, 3, 4, '#fff3bf');
      R(ctx, 408 + 16, 44 - 2, 3, 4, '#fff3bf');
    }
  } else if (B.astro === 'lua') {
    pixelCirculo(ctx, 408, 44, 19, '#e9ecf5', 0.14);
    pixelCirculo(ctx, 408, 44, 15, '#e9ecf5', 0.3);
    pixelCirculo(ctx, 408, 44, 12, '#e9ecf5', 1);
    pixelCirculo(ctx, 413, 40, 10, B.ceu[0], 1); // mordida do crescente
    // crateras em pixel
    R(ctx, 402, 40, 3, 2, '#c5cada');
    R(ctx, 405, 47, 2, 2, '#c5cada');
    R(ctx, 408, 43, 2, 1, '#d6dbe8');
    // estrelas cintilantes
    const rnd = semente(7);
    for (let i = 0; i < 34; i++) {
      const sx = Math.floor(rnd() * W);
      const sy = Math.floor(rnd() * 130);
      const s = rnd() > 0.85 ? 2 : 1;
      const brilho = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.7 + i * 1.9));
      ctx.globalAlpha = brilho;
      ctx.fillStyle = i % 5 === 0 ? '#fff3bf' : '#e9ecf5';
      ctx.fillRect(sx, sy, s, s);
    }
    ctx.globalAlpha = 1;
  }

  // raios de luz em degraus (dão atmosfera sem perder o pixel)
  if (B.astro === 'sol') {
    ctx.globalAlpha = 0.055 + Math.sin(t * 0.6) * 0.012;
    const deriva = (t * 7) % 140;
    for (let i = -1; i < 5; i++) {
      const bx = i * 140 - deriva;
      for (let y = 58; y < CHAO_Y; y += 10) {
        R(ctx, bx + (y - 58) * 0.42, y, 34, 5, '#fff3bf');
      }
    }
    ctx.globalAlpha = 1;
  }

  // pássaros (só de dia)
  if (B.astro === 'sol') {
    const rb = semente(4242);
    const aves = [0, 1, 2].map(() => ({ fx: rb(), fy: 52 + rb() * 46, vel: 9 + rb() * 6 }));
    ctx.fillStyle = 'rgba(40,50,70,0.8)';
    for (const a of aves) {
      const ax = Math.round(((a.fx * (W + 60) + t * a.vel) % (W + 60)) - 30);
      const bat = Math.sin(t * 8 + a.fx * 9) > 0 ? 0 : 2;
      ctx.fillRect(ax - 4, Math.round(a.fy) + bat, 4, 2);
      ctx.fillRect(ax, Math.round(a.fy) - bat, 4, 2);
    }
  }

  // nuvens em blocos à deriva (só onde há céu)
  if (B.astro !== 'nenhum') {
    const noite = B.astro === 'lua';
    const rn = semente(99);
    const nuvens = [0, 1, 2].map(() => ({
      fx: rn(),
      fy: 18 + rn() * 70,
      vel: 4 + rn() * 5,
      esc: 0.7 + rn() * 0.7,
    }));
    for (const n of nuvens) {
      const cx = Math.round(((n.fx * (W + 160) + t * n.vel) % (W + 160)) - 80);
      const cy = Math.round(n.fy), e = n.esc;
      const corTopo = noite ? '#5a5478' : '#ffffff';
      const corBase = noite ? '#3d3854' : '#cfe8f5';
      ctx.globalAlpha = noite ? 0.5 : 0.95;
      ctx.fillStyle = corTopo;
      ctx.fillRect(cx, cy, Math.round(44 * e), Math.round(10 * e));
      ctx.fillRect(cx + Math.round(8 * e), cy - Math.round(6 * e), Math.round(26 * e), Math.round(8 * e));
      ctx.fillRect(cx + Math.round(30 * e), cy + Math.round(2 * e), Math.round(20 * e), Math.round(8 * e));
      // barriga da nuvem (sombra) + luz no topo
      ctx.fillStyle = corBase;
      ctx.fillRect(cx, cy + Math.round(10 * e) - 2, Math.round(44 * e), 2);
      ctx.fillRect(cx + Math.round(30 * e), cy + Math.round(2 * e) + Math.round(8 * e) - 2, Math.round(20 * e), 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + Math.round(8 * e), cy - Math.round(6 * e), Math.round(26 * e), 2);
      ctx.globalAlpha = 1;
    }
  }

  // cordilheira distante em degraus + perspectiva atmosférica + luz lateral
  const rnd = semente(nivelSeed * 13 + 5);
  ctx.globalAlpha = 0.85;
  const corMontanha = mistura(B.longe, B.ceu[1], 0.24);
  let x = -20;
  while (x < W + 20) {
    const w = 60 + rnd() * 80;
    const h = 40 + rnd() * 60;
    const cxm = x + w / 2;
    piramide(ctx, cxm, CHAO_Y, w, h, corMontanha);
    // face iluminada (esquerda) e sombra (direita)
    R(ctx, cxm - w / 2, CHAO_Y - h * 0.7, 4, h * 0.7, mistura(corMontanha, '#ffffff', 0.22));
    R(ctx, cxm + w / 2 - 5, CHAO_Y - h * 0.85, 5, h * 0.85, mistura(corMontanha, '#101a14', 0.35));
    if (B.part === 'neve' || B.part === 'folhas') {
      // capacete de neve no pico
      const nw = Math.max(8, w * 0.22);
      R(ctx, cxm - nw / 2, CHAO_Y - h, nw, 4, '#e9f1f5');
      R(ctx, cxm - nw * 0.32, CHAO_Y - h + 4, nw * 0.64, 3, '#ffffff');
      R(ctx, cxm - nw * 0.2, CHAO_Y - h + 7, nw * 0.4, 2, '#cfe0ea');
    } else if (B.part !== 'brasas') {
      // bruma no cume (sem neve em campo/castelo)
      const nw = Math.max(8, w * 0.24);
      R(ctx, cxm - nw / 2, CHAO_Y - h, nw, 2, mistura(corMontanha, '#ffffff', 0.42));
      R(ctx, cxm - nw * 0.3, CHAO_Y - h + 2, nw * 0.6, 2, mistura(corMontanha, '#ffffff', 0.26));
    }
    x += w * 0.6;
  }
  ctx.globalAlpha = 1;

  // camada intermediária (profundidade entre montanha e arena)
  desenharMeio(ctx, B, nivelSeed, t);

  // camada próxima conforme o clima (tudo em blocos)
  const r2 = semente(nivelSeed * 77 + 3);
  let px = 6;
  while (px < W) {
    const pr = r2();
    const ph = 26 + pr * 34;
    const pw = 16 + pr * 10;
    if (B.part === 'brasas') {
      piramide(ctx, px + pw / 2, CHAO_Y, pw, ph, '#241a24'); // estalagmite
      if (pr > 0.6) {
        R(ctx, px + pw / 2 - 2, CHAO_Y - ph * 0.55, 4, 7, '#ff922b'); // cristal
        R(ctx, px + pw / 2 - 1, CHAO_Y - ph * 0.55, 2, 4, '#ffd43b');
      }
    } else if (B.part === 'cinzas') {
      if (pr > 0.45) {
        R(ctx, px, CHAO_Y - ph, pw * 0.7, ph, '#241f38'); // torre
        R(ctx, px - 3, CHAO_Y - ph - 6, pw * 0.7 + 6, 6, '#241f38');
        R(ctx, px + 4, CHAO_Y - ph + 8, 4, 6, '#ffd43b'); // janela acesa
      }
    } else {
      const nevado = B.part === 'neve';
      const corP = B.part === 'vagalumes' ? '#14362a' : nevado ? '#3d6b52' : '#2b6b3f';
      const corLuz = mistura(corP, '#ffffff', 0.28);
      const corSom = mistura(corP, '#0d1f14', 0.4);
      // tronco com luz + raízes
      R(ctx, px + pw * 0.32, CHAO_Y - 10, pw * 0.2, 10, '#4a3826');
      R(ctx, px + pw * 0.32, CHAO_Y - 10, 2, 10, '#6b5433');
      R(ctx, px + pw * 0.32 - 2, CHAO_Y - 2, pw * 0.2 + 4, 2, '#4a3826');
      for (let k = 0; k < 4; k++) {
        const ww = Math.max(4, pw * (1 - k * 0.2));
        const yy = CHAO_Y - 10 - (k + 1) * 8;
        const ccx = px + pw * 0.42;
        R(ctx, ccx - ww / 2, yy, ww, 4, corP);
        R(ctx, ccx - ww * 0.32, yy - 3, ww * 0.64, 3, corP);
        // luz à esquerda, sombra à direita (volume)
        R(ctx, ccx - ww / 2, yy, 2, 4, corLuz);
        R(ctx, ccx - ww * 0.32, yy - 3, 2, 3, corLuz);
        R(ctx, ccx + ww / 2 - 2, yy, 2, 4, corSom);
        if (nevado) R(ctx, ccx - ww * 0.22, yy - 3, ww * 0.44, 2, '#ffffff');
        else if (k % 2 === 0) R(ctx, ccx - ww * 0.1, yy + 1, 3, 1, corSom); // textura
      }
      // topo pontudo + pinhas
      R(ctx, px + pw * 0.42 - 1, CHAO_Y - 10 - 4 * 8 - 5, 3, 4, corP);
      R(ctx, px + pw * 0.42 - 1, CHAO_Y - 10 - 4 * 8 - 5, 1, 4, corLuz);
      if (pr > 0.55) R(ctx, px + pw * 0.42 + 3, CHAO_Y - 18, 2, 3, '#6b4a2f');
    }
    px += 34 + r2() * 46;
  }

  // dithering no horizonte + névoa baixa
  ditherLinha(ctx, CHAO_Y - 2, B.ceu[1]);
  ctx.globalAlpha = 0.16;
  ditherLinha(ctx, CHAO_Y - 7, mistura(B.ceu[1], '#ffffff', 0.35), 4, 2);
  ctx.globalAlpha = 0.1;
  ditherLinha(ctx, CHAO_Y - 11, mistura(B.ceu[1], '#ffffff', 0.5), 6, 1);
  ctx.globalAlpha = 1;

  // chão em faixas duras + faixa de luz no topo + textura de terra
  R(ctx, 0, CHAO_Y, W, H - CHAO_Y, B.chaoA);
  R(ctx, 0, CHAO_Y, W, 2, mistura(B.chaoA, '#ffffff', 0.25));
  R(ctx, 0, CHAO_Y + 2, W, 3, B.chaoB);
  ditherLinha(ctx, CHAO_Y + 5, B.chaoB, 6, 2);
  const r3 = semente(nivelSeed * 31 + 2);
  const terraS = mistura(B.chaoA, '#101a14', 0.3);
  const terraL = mistura(B.chaoA, '#ffffff', 0.18);
  for (let i = 0; i < 46; i++) {
    const tx = Math.floor(r3() * W), ty = Math.floor(CHAO_Y + 8 + r3() * (H - CHAO_Y - 10));
    const wdt = 2 + Math.floor(r3() * 3);
    ctx.fillStyle = terraS;
    ctx.fillRect(tx, ty, wdt, 2);
    if (r3() > 0.6) {
      ctx.fillStyle = terraL;
      ctx.fillRect(tx, ty - 1, wdt - 1, 1);
    }
  }

  // detalhes do solo conforme o clima
  const r4 = semente(nivelSeed * 57 + 11);
  for (let i = 0; i < 20; i++) {
    const gx = Math.floor(r4() * W);
    const gy = Math.floor(CHAO_Y + 10 + r4() * (H - CHAO_Y - 14));
    if (B.part === 'folhas') {
      const rol = r4();
      if (rol > 0.8) {
        // flor: caule + folhas + pétalas + miolo
        R(ctx, gx, gy - 5, 2, 5, '#2b6b3f');
        R(ctx, gx - 2, gy - 3, 2, 1, '#2b6b3f');
        const pet = ['#ff8787', '#ffd43b', '#ffffff'][Math.floor(r4() * 3)];
        R(ctx, gx - 2, gy - 9, 6, 3, pet);
        R(ctx, gx - 1, gy - 10, 4, 1, mistura(pet, '#ffffff', 0.4));
        R(ctx, gx, gy - 8, 2, 1, '#e8b34a');
      } else if (rol > 0.55) {
        // pedrinha com luz
        R(ctx, gx, gy - 2, 5, 3, '#8a8578');
        R(ctx, gx, gy - 2, 5, 1, '#c9c2b4');
        R(ctx, gx, gy, 5, 1, '#5c5648');
      } else {
        // tufo de grama 3 lâminas com ponta clara
        R(ctx, gx, gy - 5, 2, 5, '#2b6b3f');
        R(ctx, gx, gy - 5, 1, 2, '#8ce99a');
        R(ctx, gx + 2, gy - 6, 2, 6, '#3f7a33');
        R(ctx, gx + 2, gy - 6, 1, 2, '#8ce99a');
        R(ctx, gx + 5, gy - 4, 2, 4, '#2b6b3f');
      }
    } else if (B.part === 'vagalumes') {
      R(ctx, gx, gy - 5, 2, 5, '#d8cfc0');
      R(ctx, gx - 2, gy - 8, 7, 4, '#e03131');
      R(ctx, gx - 1, gy - 7, 1, 1, '#fff');
    } else if (B.part === 'neve') {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(gx, gy, 2, 2);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      const rw = 5 + Math.floor(r4() * 4);
      ctx.fillRect(gx, gy - 3, rw, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(gx, gy - 3, rw, 1);
    }
  }

  // anel da arena: pontilhado interno + pedras na borda frontal
  elipsePontos(ctx, PX, CHAO_Y + 26, 112, 18, 'rgba(255,255,255,0.1)', 5, 2);
  elipsePontos(ctx, PX, CHAO_Y + 26, 104, 16, 'rgba(255,255,255,0.3)', 9, 1);
  const pedra = mistura(B.chaoB, '#ffffff', 0.22);
  const pedraLuz = mistura(pedra, '#ffffff', 0.4);
  const pedraSombra = mistura(B.chaoB, '#000000', 0.32);
  for (let a = 6; a < 180; a += 7) {
    const rad = (a * Math.PI) / 180;
    const sx = Math.round(PX + Math.cos(rad) * 118);
    const sy = Math.round(CHAO_Y + 26 + Math.sin(rad) * 20);
    if (Math.abs(sx - PX) < 22) continue;
    R(ctx, sx - 3, sy - 1, 7, 3, pedraSombra);
    R(ctx, sx - 3, sy - 2, 6, 2, pedra);
    R(ctx, sx - 3, sy - 2, 4, 1, pedraLuz);
  }

  // tochas: base de pedra, poça de luz, chama em 4 tons, fumaça e faíscas
  for (const tx of [30, W - 30]) {
    const tremula = Math.sin(t * 13 + tx) * 1.5;
    // sombra + base + poste com luz lateral e anéis
    elipsePixel(ctx, tx + 3, CHAO_Y + 31, 16, 4, '#000', 0.22);
    R(ctx, tx - 5, CHAO_Y + 26, 10, 3, '#4a3826');
    R(ctx, tx - 5, CHAO_Y + 26, 10, 1, '#6b5433');
    R(ctx, tx - 2, CHAO_Y - 34, 4, 60, '#5c4a2f');
    R(ctx, tx - 2, CHAO_Y - 34, 1, 60, '#7a6238');
    R(ctx, tx - 2, CHAO_Y - 22, 4, 2, '#3a2f1e');
    R(ctx, tx - 2, CHAO_Y - 12, 4, 2, '#3a2f1e');
    R(ctx, tx - 4, CHAO_Y - 38, 8, 5, '#3a2f1e');
    R(ctx, tx - 4, CHAO_Y - 38, 8, 1, '#6b5a48');
    // poça de luz no chão (dither de baixa opacidade)
    elipsePixel(ctx, tx, CHAO_Y + 32, 26, 7, '#ffb35c', 0.09 + Math.abs(Math.sin(t * 6 + tx)) * 0.03);
    const fy = CHAO_Y - 50 + Math.round(tremula);
    // brasa + chama externa/meio/núcleo
    R(ctx, tx - 3, fy + 10, 6, 2, '#e03131');
    R(ctx, tx - 4, fy, 8, 11, '#ff922b');
    R(ctx, tx - 4, fy, 8, 2, '#ff6b6b');
    R(ctx, tx - 2, fy + 2, 4, 8, '#ffd43b');
    R(ctx, tx - 1, fy + 4, 2, 5, '#fff3bf');
    // lingueta da chama + faíscas que sobem
    R(ctx, tx - 1, fy - 3 + Math.round(tremula), 2, 3, '#ff922b');
    const sp = Math.sin(t * 9 + tx * 2) > 0.4;
    if (sp) R(ctx, tx + 3, fy - 8, 2, 2, '#ffd43b');
    if (Math.cos(t * 7 + tx) > 0.6) R(ctx, tx - 5, fy - 5, 1, 2, '#ff922b');
    // fumaça fina subindo
    for (let i = 0; i < 3; i++) {
      const sy = fy - 12 - i * 7 - Math.round((t * 6 + i * 9 + tx) % 9);
      const sx = tx + Math.round(Math.sin(t * 1.4 + i * 2 + tx) * (2 + i * 1.3));
      ctx.globalAlpha = 0.16 - i * 0.04;
      R(ctx, sx, sy, 2, 2, '#b9b0c6');
      ctx.globalAlpha = 1;
    }
    // halo pontilhado ao redor (dither, sem caixas)
    ctx.fillStyle = '#ffb35c';
    const haloR = 13;
    for (let hy = -haloR; hy <= haloR; hy += 3) {
      for (let hx = -haloR; hx <= haloR; hx += 3) {
        if ((hx + hy) % 6 !== 0) continue;
        const d = Math.sqrt(hx * hx + hy * hy);
        if (d > 9 && d < haloR) ctx.fillRect(tx + hx, fy + 5 + hy, 1, 1);
      }
    }
  }

  // voltas além da 1ª escurecem (faixa dura, sem gradiente)
  if (volta > 1) {
    ctx.globalAlpha = Math.min(0.14, 0.05 * volta);
    R(ctx, 0, 0, W, H, '#780a28');
    ctx.globalAlpha = 1;
  }
}

// Primeiro plano: tufos altos nas quinas, pedras e brasas. Desenhado
// depois dos lutadores para criar profundidade e enquadrar a arena.
export function desenharPrimeiroPlano(ctx: Ctx2D, B: Bioma, t: number): void {
  const claro =
    B.part === 'neve'
      ? '#dbe7ee'
      : B.part === 'brasas'
        ? '#2a1b26'
        : B.part === 'cinzas'
          ? '#211a36'
          : B.part === 'vagalumes'
            ? '#0c241a'
            : '#1f4a2c';
  const escuro = mistura(claro, '#000000', 0.4);
  const luz = mistura(claro, '#ffffff', 0.22);
  const balanco = (s: number): number => Math.round(Math.sin(t * 1.7 + s) * 1.6);
  const grupos = B.part === 'neve' ? 5 : 7;

  for (const lado of [-1, 1] as const) {
    for (let i = 0; i < grupos; i++) {
      const baseX = lado < 0 ? 6 + i * 8 : W - 7 - i * 8;
      const altura = 14 + ((i * 5) % 13);
      const b = balanco(i + (lado < 0 ? 0 : 9));
      R(ctx, baseX, H - altura, 2, altura, escuro);
      R(ctx, baseX + (b > 0 ? 1 : 0), H - altura - 3, 1, 4, claro);
      R(ctx, baseX + 2, H - Math.round(altura * 0.7), 2, Math.round(altura * 0.7), claro);
      R(ctx, baseX + 3 + b, H - Math.round(altura * 0.9), 1, 5, claro);
      R(ctx, baseX + 2, H - 2, 1, 2, luz);
    }
    const rx = lado < 0 ? 4 : W - 22;
    R(ctx, rx, H - 7, 18, 5, escuro);
    R(ctx, rx + 2, H - 8, 12, 2, luz);
    R(ctx, rx + 3, H - 9, 7, 1, mistura(claro, '#ffffff', 0.4));
  }

  for (let x = 0; x < 46; x += 4) {
    R(ctx, x, H - 2, 2, 2, 'rgba(0,0,0,0.28)');
    R(ctx, W - x - 2, H - 2, 2, 2, 'rgba(0,0,0,0.28)');
  }

  if (B.part === 'brasas') {
    for (let i = 0; i < 5; i++) {
      const x = 18 + i * 14;
      const y = H - 12;
      R(ctx, x, y, 3, 12, '#3a2430');
      R(ctx, x, y, 1, 10, '#ff922b');
      R(ctx, x + 1, y + 1, 1, 6, '#ffd43b');
    }
  }
}

export function novaParticula(B: Bioma): Particula {
  const r = Math.random;
  if (B.part === 'brasas')
    return {
      x: r() * W,
      y: CHAO_Y - r() * 40,
      vx: (r() - 0.5) * 12,
      vy: -18 - r() * 26,
      s: 1.5 + r() * 2,
      c: r() > 0.5 ? '#ff922b' : '#ff6b6b',
      vida: 1.4 + r(),
      tipo: 'brasa',
    };
  if (B.part === 'neve')
    return {
      x: r() * W,
      y: -4,
      vx: -8 - r() * 10,
      vy: 14 + r() * 14,
      s: 1.5 + r() * 2,
      c: '#ffffff',
      vida: 9,
      tipo: 'neve',
    };
  if (B.part === 'vagalumes')
    return {
      x: r() * W,
      y: 60 + r() * 140,
      vx: (r() - 0.5) * 14,
      vy: (r() - 0.5) * 10,
      s: 1.5 + r(),
      c: '#ffe066',
      vida: 3 + r() * 2,
      tipo: 'vaga',
    };
  if (B.part === 'cinzas')
    return r() > 0.3
      ? {
          x: r() * W,
          y: -4,
          vx: (r() - 0.5) * 10,
          vy: 10 + r() * 12,
          s: 1.5 + r() * 1.5,
          c: '#8d86a8',
          vida: 9,
          tipo: 'cinza',
        }
      : {
          x: r() * W,
          y: CHAO_Y,
          vx: (r() - 0.5) * 8,
          vy: -14 - r() * 18,
          s: 1.5 + r(),
          c: '#ffa94d',
          vida: 2,
          tipo: 'brasa',
        };
  return {
    x: r() * W,
    y: -4,
    vx: 10 + r() * 16,
    vy: 16 + r() * 16,
    s: 2 + r() * 2,
    c: r() > 0.4 ? '#8ce99a' : '#e8b34a',
    vida: 8,
    tipo: 'folha',
  };
}

// Faixa de cor atual do céu numa altura (p/ partículas coerentes, se precisar)
export function corCeuEm(B: Bioma, y: number): string {
  return mistura(B.ceu[0], B.ceu[1], Math.min(1, Math.max(0, y / CHAO_Y)));
}
