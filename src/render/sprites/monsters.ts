// render/sprites/monsters.ts — monstros 100% em retângulos.
// TIPOS indexa por kind (ver NOMES_MONSTROS em core/data.ts).

import { R, shade, V, comDir, elipsePixel, type Ctx2D } from '../pixel.js';
import type { OptsMonstro } from './shared.js';

export type MonstroExtra = 'orelhas' | 'presas' | 'lobo' | 'cranio' | 'capuz' | 'barriga';
export type MonstroArma = 'clava' | 'clavao' | 'espada' | 'adaga' | null;

export interface TipoMonstro {
  h: number;
  pele: string;
  roupa: string;
  extra: MonstroExtra;
  arma: MonstroArma;
}

export const TIPOS: readonly TipoMonstro[] = [
  { h: 12, pele: '#51cf66', roupa: '#2f9e44', extra: 'orelhas', arma: 'clava' },
  { h: 15, pele: '#2f9e44', roupa: '#1e5c2e', extra: 'presas', arma: 'clava' },
  { h: 10, pele: '#59616b', roupa: '#33393f', extra: 'lobo', arma: null },
  { h: 14, pele: '#e9e4da', roupa: '#8a8578', extra: 'cranio', arma: 'espada' },
  { h: 13, pele: '#b197fc', roupa: '#5f3dc4', extra: 'capuz', arma: 'adaga' },
  { h: 19, pele: '#63a375', roupa: '#3d6b4f', extra: 'barriga', arma: 'clavao' },
];

function desenharArma(
  ctx: Ctx2D,
  tipo: number,
  px: number,
  py: number,
  u: number,
  ang: number,
  flash: boolean,
): void {
  const T = TIPOS[tipo % TIPOS.length];
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(ang);
  const arma = T.arma;
  if (arma === 'adaga') {
    R(ctx, -1.8 * u, -1 * u, 1.8 * u, 2 * u, T.pele); // mão
    R(ctx, 0, -0.6 * u, 4.5 * u, 1.2 * u, flash ? '#fff' : '#dfe8ee');
    R(ctx, 0, -0.6 * u, 4.5 * u, 0.45 * u, '#ffffff');
    R(ctx, 3.4 * u, -0.8 * u, 1.1 * u, 1.6 * u, '#ffffff');
    R(ctx, -1 * u, -1 * u, 1 * u, 2 * u, '#8a6d3b');
  } else if (arma === 'espada') {
    R(ctx, -1.8 * u, -1 * u, 1.8 * u, 2 * u, T.pele); // mão
    R(ctx, -1 * u, -1.4 * u, 1 * u, 2.8 * u, '#5c5346'); // guarda
    R(ctx, -1 * u, -1.4 * u, 1 * u, 0.5 * u, '#8a7a5c');
    R(ctx, 0, -0.6 * u, 8 * u, 1.2 * u, flash ? '#fff' : '#b08968');
    R(ctx, 0, -0.6 * u, 8 * u, 0.45 * u, '#d8c49a');
    R(ctx, 7 * u, -0.8 * u, 1 * u, 1.6 * u, '#fff');
  } else {
    const grosso = arma === 'clavao' ? 2.6 : 1.8;
    const comp = arma === 'clavao' ? 8 : 6;
    R(ctx, -1.8 * u, -1 * u, 1.8 * u, 2 * u, T.pele); // mão
    R(ctx, -0.6 * u, -grosso * u * 0.5, 1.2 * u, grosso * u, '#3a2f1e'); // grip
    R(ctx, 0, -grosso * u * 0.5, comp * u, grosso * u, '#8a6d3b');
    R(ctx, 0, -grosso * u * 0.5, comp * u, grosso * u * 0.35, '#a88d55'); // luz
    R(ctx, comp * u - 1 * u, -grosso * u * 0.5, 1.6 * u, grosso * u, '#6b5433');
    R(ctx, comp * u - 1 * u, -grosso * u * 0.5, 1.6 * u, grosso * u * 0.35, '#8a6d3b');
    if (arma === 'clavao') {
      R(ctx, 2 * u, -grosso * u * 0.5 - 0.8 * u, 1.2 * u, 0.8 * u, '#5c4a2f'); // espinhos
      R(ctx, 4.6 * u, -grosso * u * 0.5 - 0.8 * u, 1.2 * u, 0.8 * u, '#5c4a2f');
    }
  }
  ctx.restore();
}

export function desenharMonstro(ctx: Ctx2D, tipo: number, o: OptsMonstro): void {
  const T = TIPOS[tipo % TIPOS.length];
  const { x, peY, s, t, lunge, swing, flash, caido, dir, esc } = o;
  const mult = esc || 1;
  comDir(ctx, x, dir || 1, () => {
    const xx = x + (lunge || 0);
    const u = s * 0.85 * mult;
    const h = T.h * u * 0.5;
    const bob = caido ? 0 : Math.sin(t * 5 + 1) * 0.8;

    elipsePixel(ctx, xx, peY + 2, Math.round(10 * s * 0.33 * mult), 3, '#000', caido ? 0.25 : 0.42);

    const pele = caido ? '#777' : T.pele;
    const roupa = caido ? '#555' : T.roupa;

    ctx.save();
    if (caido) ctx.globalAlpha = 0.55;

    if (T.extra === 'lobo') {
      const trote = Math.sin(t * 10) * 1.2;
      const abano = Math.sin(t * 7) * 0.8;
      V(ctx, xx - 7 * u, peY - 6 * u + bob, 13 * u, 4 * u, pele);
      // dorso eriçado + barriga clara
      R(ctx, xx - 6 * u, peY - 6.8 * u + bob, 2 * u, 1 * u, shade(T.pele, 0.62));
      R(ctx, xx - 2 * u, peY - 7 * u + bob, 2 * u, 1.2 * u, shade(T.pele, 0.62));
      R(ctx, xx + 2 * u, peY - 6.8 * u + bob, 2 * u, 1 * u, shade(T.pele, 0.62));
      R(ctx, xx - 5 * u, peY - 2.6 * u + bob, 9 * u, 0.8 * u, '#868e96');
      // cabeça: focinho + nariz + olho com pupila + orelhas com interior
      R(ctx, xx + 4 * u, peY - 9 * u + bob, 5 * u, 4.5 * u, pele);
      R(ctx, xx + 8 * u, peY - 7.5 * u + bob, 3 * u, 2 * u, pele);
      R(ctx, xx + 10.2 * u, peY - 7.2 * u + bob, 1.2 * u, 1.2 * u, '#241f26');
      R(ctx, xx + 5 * u, peY - 11 * u + bob, 1.6 * u, 2.4 * u, pele);
      R(ctx, xx + 5.3 * u, peY - 10.6 * u + bob, 1 * u, 1.2 * u, '#33393f');
      R(ctx, xx + 6.4 * u, peY - 8.2 * u + bob, 1.4 * u, 1.4 * u, '#fff');
      R(ctx, xx + 6.6 * u, peY - 8 * u + bob, 0.8 * u, 0.9 * u, '#e03131');
      R(ctx, xx + 6.7 * u, peY - 8 * u + bob, 0.35 * u, 0.4 * u, '#241f26');
      R(ctx, xx + 9.4 * u, peY - 6 * u + bob, 0.9 * u, 1.1 * u, '#fff');
      R(ctx, xx + 10.4 * u, peY - 6 * u + bob, 0.9 * u, 1.1 * u, '#fff');
      // cauda abanando com ponta escura
      R(ctx, xx - 9.4 * u, peY - 8.5 * u + bob + trote * 0.4 + abano * 0.5, 2.6 * u, 1.4 * u, pele);
      R(ctx, xx - 10.4 * u, peY - 8.5 * u + bob + trote * 0.4 + abano * 0.5, 1.2 * u, 1.4 * u, '#33393f');
      for (let i = 0; i < 4; i++) {
        const lx = xx - 6 * u + i * 3.4 * u;
        const off = (i % 2 === 0 ? trote : -trote) * 0.5;
        R(ctx, lx, peY - 2.6 * u + off * 0.4, 1.4 * u, 2.6 * u, roupa);
        R(ctx, lx, peY - 1.2 * u + off * 0.4, 1.4 * u, 1.2 * u, '#241f26');
      }
    } else {
      // pernas + pés (pés escuros ancoram no chão)
      R(ctx, xx - 3 * u, peY - h * 0.32, 2 * u, h * 0.32, roupa);
      R(ctx, xx + 1 * u, peY - h * 0.32, 2 * u, h * 0.32, roupa);
      R(ctx, xx - 3.4 * u, peY - 1.6 * u, 2.8 * u, 1.6 * u, '#241f26');
      R(ctx, xx + 0.6 * u, peY - 1.6 * u, 2.8 * u, 1.6 * u, '#241f26');
      R(ctx, xx - 3.4 * u, peY - 1.6 * u, 2.8 * u, 0.5 * u, roupa);
      R(ctx, xx + 0.6 * u, peY - 1.6 * u, 2.8 * u, 0.5 * u, roupa);
      V(ctx, xx - 4 * u, peY - h * 0.72 + bob, 8 * u, h * 0.42, roupa);
      // sombra lateral do torso (volume)
      R(ctx, xx + 2.6 * u, peY - h * 0.72 + bob, 1.4 * u, h * 0.42, shade(T.roupa, 0.62));
      // braço de apoio (lado oposto à arma)
      R(ctx, xx - 5.4 * u, peY - h * 0.66 + bob, 1.8 * u, h * 0.3, pele);
      R(ctx, xx - 5.4 * u, peY - h * 0.4 + bob, 1.8 * u, 1.2 * u, pele); // garra
      R(ctx, xx - 5.4 * u, peY - h * 0.4 + bob, 1.8 * u, 0.5 * u, shade(T.pele, 0.62));
      if (T.extra === 'barriga') {
        R(ctx, xx - 4.4 * u, peY - h - 4.6 * u + bob, 2 * u, 1.4 * u, roupa);
        R(ctx, xx + 2.6 * u, peY - h - 4.6 * u + bob, 2 * u, 1.4 * u, roupa);
        // olhos fundos + sobrancelha + verrugas
        R(ctx, xx - 2 * u, peY - h - 3.4 * u + bob, 1.6 * u, 0.7 * u, shade(T.pele, 0.62));
        R(ctx, xx + 0.4 * u, peY - h - 3.4 * u + bob, 1.6 * u, 0.7 * u, shade(T.pele, 0.62));
        R(ctx, xx - 1.6 * u, peY - h - 2.8 * u + bob, 1 * u, 1 * u, '#ffd43b');
        R(ctx, xx + 0.6 * u, peY - h - 2.8 * u + bob, 1 * u, 1 * u, '#ffd43b');
        R(ctx, xx - 2.6 * u, peY - h - 3.6 * u + bob, 0.7 * u, 0.7 * u, shade(T.pele, 0.62));
        // boca com dentes + barriga com dobras e pelos
        R(ctx, xx - 1 * u, peY - h - 1.2 * u + bob, 3 * u, 0.9 * u, '#241f26');
        R(ctx, xx - 0.6 * u, peY - h - 1.2 * u + bob, 0.6 * u, 0.7 * u, '#fff');
        R(ctx, xx + 1 * u, peY - h - 1.2 * u + bob, 0.6 * u, 0.7 * u, '#fff');
        R(ctx, xx - 2 * u, peY - h - 0.6 * u + bob, 5 * u, h * 0.3, pele);
        R(ctx, xx - 2 * u, peY - h - 0.6 * u + bob, 5 * u, 0.6 * u, '#8ce99a');
        R(ctx, xx - 1 * u, peY - h * 0.4 + bob, 3 * u, 0.5 * u, shade(T.pele, 0.62));
        R(ctx, xx - 1 * u, peY - h - 2.6 * u + bob, 1.1 * u, 1.1 * u, '#ff8787');
        R(ctx, xx + 0.8 * u, peY - h - 2.6 * u + bob, 1.1 * u, 1.1 * u, '#ff8787');
        R(ctx, xx - 3.4 * u, peY - h - 0.9 * u + bob, 1.2 * u, 1.2 * u, '#8ce99a');
        R(ctx, xx + 2.4 * u, peY - h - 0.5 * u + bob, 1.2 * u, 1.2 * u, '#8ce99a');
        R(ctx, xx - 1 * u, peY - h * 0.52 + bob, 1.4 * u, 1 * u, '#2f5c40');
      }
      V(ctx, xx - 2.6 * u, peY - h - 4 * u + bob, 5.6 * u, 4.4 * u, pele);
      if (T.extra === 'orelhas') {
        // orelhas grandes com interior + brinco
        R(ctx, xx - 5 * u, peY - h - 3 * u + bob, 2.4 * u, 1.6 * u, pele);
        R(ctx, xx + 2.8 * u, peY - h - 3 * u + bob, 2.4 * u, 1.6 * u, pele);
        R(ctx, xx - 4.4 * u, peY - h - 2.8 * u + bob, 1.2 * u, 1 * u, '#2f9e44');
        R(ctx, xx + 3.4 * u, peY - h - 2.8 * u + bob, 1.2 * u, 1 * u, '#2f9e44');
        R(ctx, xx - 5 * u, peY - h - 1.6 * u + bob, 0.8 * u, 0.8 * u, '#e8b34a');
        // sobrancelhas bravas + olhos amarelos com pupila
        R(ctx, xx - 1.6 * u, peY - h - 3.4 * u + bob, 2 * u, 0.7 * u, '#1e5c2e');
        R(ctx, xx + 0.8 * u, peY - h - 3.4 * u + bob, 2 * u, 0.7 * u, '#1e5c2e');
        R(ctx, xx - 1.2 * u, peY - h - 2.6 * u + bob, 1.4 * u, 1.3 * u, '#fff3bf');
        R(ctx, xx + 0.8 * u, peY - h - 2.6 * u + bob, 1.4 * u, 1.3 * u, '#fff3bf');
        R(ctx, xx - 0.9 * u, peY - h - 2.4 * u + bob, 0.7 * u, 0.9 * u, '#e03131');
        R(ctx, xx + 1.1 * u, peY - h - 2.4 * u + bob, 0.7 * u, 0.9 * u, '#e03131');
        // nariz + boca com dente
        R(ctx, xx + 0.1 * u, peY - h - 1.2 * u + bob, 1 * u, 0.7 * u, '#1e5c2e');
        R(ctx, xx - 0.8 * u, peY - h - 0.2 * u + bob, 2.4 * u, 0.6 * u, '#1e5c2e');
        R(ctx, xx + 0.6 * u, peY - h - 0.2 * u + bob, 0.7 * u, 0.9 * u, '#fff');
        R(ctx, xx - 3 * u, peY - h * 0.34 + bob, 6 * u, 1 * u, '#5c4a2f');
        R(ctx, xx - 0.4 * u, peY - h * 0.34 + bob, 0.9 * u, 1 * u, '#e8b34a');
      } else if (T.extra === 'presas') {
        // olhos raivosos (vermelho + pupila + sobrancelha)
        R(ctx, xx - 1.6 * u, peY - h - 4 * u + bob, 2 * u, 0.7 * u, '#10240f');
        R(ctx, xx + 0.8 * u, peY - h - 4 * u + bob, 2 * u, 0.7 * u, '#10240f');
        R(ctx, xx - 1.4 * u, peY - h - 3.4 * u + bob, 1.8 * u, 1.2 * u, '#ff6b6b');
        R(ctx, xx + 0.8 * u, peY - h - 3.4 * u + bob, 1.8 * u, 1.2 * u, '#ff6b6b');
        R(ctx, xx - 1 * u, peY - h - 3.2 * u + bob, 0.8 * u, 0.9 * u, '#241f26');
        R(ctx, xx + 1.2 * u, peY - h - 3.2 * u + bob, 0.8 * u, 0.9 * u, '#241f26');
        // focinho + narina + presas maiores
        R(ctx, xx - 1 * u, peY - h - 2 * u + bob, 2.8 * u, 1 * u, shade(T.pele, 0.62));
        R(ctx, xx + 0.2 * u, peY - h - 2 * u + bob, 0.7 * u, 0.7 * u, '#10240f');
        R(ctx, xx - 1.2 * u, peY - h - 1.4 * u + bob, 1 * u, 1.6 * u, '#fff');
        R(ctx, xx + 1.2 * u, peY - h - 1.4 * u + bob, 1 * u, 1.6 * u, '#fff');
        R(ctx, xx - 4 * u, peY - h - 4.4 * u + bob, 8 * u, 1.4 * u, roupa);
        R(ctx, xx - 4 * u, peY - h - 4.4 * u + bob, 8 * u, 0.5 * u, '#8ce99a');
        R(ctx, xx - 3 * u, peY - h * 0.36 + bob, 6 * u, 1 * u, '#3a2b1a');
      } else if (T.extra === 'cranio') {
        // órbitas com brilho + nariz + dentes separados + rachadura
        R(ctx, xx - 1.4 * u, peY - h - 3 * u + bob, 1.4 * u, 1.6 * u, '#241f26');
        R(ctx, xx + 0.6 * u, peY - h - 3 * u + bob, 1.4 * u, 1.6 * u, '#241f26');
        R(ctx, xx - 1.1 * u, peY - h - 2.8 * u + bob, 0.5 * u, 0.5 * u, '#e03131');
        R(ctx, xx + 0.9 * u, peY - h - 2.8 * u + bob, 0.5 * u, 0.5 * u, '#e03131');
        R(ctx, xx - 0.1 * u, peY - h - 1.2 * u + bob, 0.7 * u, 0.8 * u, '#241f26');
        for (let i = 0; i < 3; i++) R(ctx, xx - 3.4 * u, peY - h * 0.66 + i * 1.8 * u + bob, 6.8 * u, 0.7 * u, pele);
        R(ctx, xx - 0.5 * u, peY - h * 0.66 + bob, 0.5 * u, 5 * u, '#8a8578');
        R(ctx, xx + 1 * u, peY - h * 0.66 + 3.6 * u + bob, 0.5 * u, 1.6 * u, '#8a8578');
        R(ctx, xx - 2.6 * u, peY - h - 4 * u + bob, 1.6 * u, 0.6 * u, '#8a8578');
      } else if (T.extra === 'capuz') {
        // capuz com dobra clara no topo + sombra interna + fecho do manto
        R(ctx, xx - 3.4 * u, peY - h - 5 * u + bob, 7.2 * u, 2.4 * u, roupa);
        R(ctx, xx - 3.4 * u, peY - h - 5 * u + bob, 7.2 * u, 0.7 * u, '#b197fc');
        R(ctx, xx - 3.4 * u, peY - h - 3.2 * u + bob, 0.9 * u, 2 * u, shade(T.roupa, 0.62));
        R(ctx, xx - 1.6 * u, peY - h - 2.8 * u + bob, 3.6 * u, 1.2 * u, '#241f26');
        R(ctx, xx - 1 * u, peY - h - 2.6 * u + bob, 0.9 * u, 0.9 * u, '#ffd43b');
        R(ctx, xx + 0.5 * u, peY - h - 2.6 * u + bob, 0.9 * u, 0.9 * u, '#ffd43b');
        R(ctx, xx - 1 * u, peY - h - 2.6 * u + bob, 0.35 * u, 0.35 * u, '#241f26');
        R(ctx, xx + 0.5 * u, peY - h - 2.6 * u + bob, 0.35 * u, 0.35 * u, '#241f26');
        R(ctx, xx - 0.5 * u, peY - h - 0.6 * u + bob, 1 * u, 1 * u, '#e8b34a');
        R(ctx, xx - 2.4 * u, peY - h + 0.6 * u + bob, 5.2 * u, 1.2 * u, '#e03131');
        R(ctx, xx - 2.4 * u, peY - h + 0.6 * u + bob, 5.2 * u, 0.4 * u, '#ff8787');
        R(ctx, xx - 3.2 * u, peY - h + 1.8 * u + bob, 1.4 * u, 1.8 * u, '#c2255c');
      }
      const px = xx + 3 * u, py = peY - h * 0.55 + bob;
      const ang = swing == null ? 0.4 : -1.4 + swing * 2.2;
      if (T.arma) desenharArma(ctx, tipo, px, py, u, ang, flash > 0);
    }

    if (flash > 0) {
      ctx.globalAlpha = Math.min(0.32, flash * 0.4);
      R(ctx, xx - 6 * u, peY - h - 6 * u, 12 * u, h + 7 * u, '#ffffff');
    }
    ctx.restore();
  });
}
