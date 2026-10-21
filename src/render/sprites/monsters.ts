// render/sprites/monsters.ts — monstros 100% em retângulos.
// TIPOS indexa por kind (ver NOMES_MONSTROS em core/data.ts).

import { R, shade, V, comDir, elipsePixel, type Ctx2D } from '../pixel.js';
import type { OptsMonstro } from './shared.js';

export type MonstroExtra =
  | 'orelhas'
  | 'presas'
  | 'lobo'
  | 'cranio'
  | 'capuz'
  | 'barriga'
  | 'asas'
  | 'aranha'
  | 'golem'
  | 'fantasma'
  | 'armadura'
  | 'dragao';
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
  { h: 8, pele: '#a78bfa', roupa: '#5b3fa8', extra: 'asas', arma: null },
  { h: 9, pele: '#6d4c9f', roupa: '#3b2a5a', extra: 'aranha', arma: null },
  { h: 30, pele: '#a5d8ff', roupa: '#4d7fa8', extra: 'golem', arma: null },
  { h: 26, pele: '#9ae6c8', roupa: '#2f6b57', extra: 'fantasma', arma: 'adaga' },
  { h: 16, pele: '#5d6f88', roupa: '#1c2333', extra: 'armadura', arma: 'espada' },
  { h: 34, pele: '#ff922b', roupa: '#a63a0a', extra: 'dragao', arma: null },
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

    if (T.extra === 'asas') {
      const flutua = Math.sin(t * 7) * 1.2;
      const fy = peY - 9 * u + bob + flutua;
      const flap = Math.sin(t * 12) * 2.2 * u;
      // asas abertas (membrana escura + borda clara)
      R(ctx, xx - 10 * u, fy - 1 * u + flap * 0.3, 7 * u, 2 * u, roupa);
      R(ctx, xx - 13 * u, fy - 2 * u + flap * 0.5, 5 * u, 1.5 * u, pele);
      R(ctx, xx - 8 * u, fy + 1 * u + flap * 0.2, 5 * u, 1.2 * u, shade(T.roupa, 0.62));
      R(ctx, xx + 3 * u, fy - 1 * u - flap * 0.3, 7 * u, 2 * u, roupa);
      R(ctx, xx + 8 * u, fy - 2 * u - flap * 0.5, 5 * u, 1.5 * u, pele);
      R(ctx, xx + 3 * u, fy + 1 * u - flap * 0.2, 5 * u, 1.2 * u, shade(T.roupa, 0.62));
      // corpo + barriga
      V(ctx, xx - 2.8 * u, fy - 2.6 * u, 5.6 * u, 6 * u, pele);
      R(ctx, xx - 2.8 * u, fy - 0.4 * u, 5.6 * u, 1.6 * u, shade(T.roupa, 0.8));
      // orelhas pontudas
      R(ctx, xx - 2.4 * u, fy - 5.6 * u, 1.6 * u, 3 * u, pele);
      R(ctx, xx + 0.8 * u, fy - 5.6 * u, 1.6 * u, 3 * u, pele);
      R(ctx, xx - 2 * u, fy - 5 * u, 1 * u, 2 * u, T.roupa);
      R(ctx, xx + 1 * u, fy - 5 * u, 1 * u, 2 * u, T.roupa);
      // olhos vermelhos + presas
      R(ctx, xx - 1.8 * u, fy - 2.2 * u, 1.2 * u, 1.1 * u, '#e03131');
      R(ctx, xx + 0.6 * u, fy - 2.2 * u, 1.2 * u, 1.1 * u, '#e03131');
      R(ctx, xx - 1.1 * u, fy + 1 * u, 0.8 * u, 1.4 * u, '#fff');
      R(ctx, xx + 0.3 * u, fy + 1 * u, 0.8 * u, 1.4 * u, '#fff');
      R(ctx, xx - 0.5 * u, fy + 2.4 * u, 1 * u, 0.8 * u, T.roupa);
      // cauda fina
      R(ctx, xx - 0.4 * u, fy + 2.8 * u, 0.8 * u, 2.4 * u, roupa);
    } else if (T.extra === 'aranha') {
      const fy = peY - 5 * u + bob;
      const mexer = Math.sin(t * 9) * 0.7 * u;
      // oito pernas em degraus
      for (const lado of [-1, 1] as const) {
        for (let i = 0; i < 4; i++) {
          const baseX = xx + lado * 2.5 * u;
          const baseY = fy + (i - 1.5) * 1.2 * u;
          const out = (4 + i * 1.1) * u;
          R(ctx, baseX + lado * out * 0.35, baseY, lado * out * 0.4, 0.9 * u, roupa);
          R(
            ctx,
            baseX + lado * out * 0.75,
            baseY - (1 + (i % 2)) * u + mexer * (i % 2 ? 1 : -1) * 0.3,
            lado * 0.9 * u,
            (1.6 + (i % 2)) * u,
            pele,
          );
        }
      }
      // abdômen atrás + cabeça à frente
      elipsePixel(ctx, xx - 5 * u, fy, 5 * u, 4 * u, roupa, caido ? 0.4 : 0.95);
      R(ctx, xx - 9 * u, fy - 1 * u, 3 * u, 2 * u, shade(T.roupa, 0.62));
      V(ctx, xx + 2 * u, fy - 3 * u, 5.5 * u, 6 * u, pele);
      R(ctx, xx + 5 * u, fy - 1.8 * u, 2.4 * u, 3.2 * u, shade(T.pele, 0.8));
      // quatro olhos vermelhos + presas
      R(ctx, xx + 4.8 * u, fy - 1.8 * u, 0.9 * u, 0.9 * u, '#e03131');
      R(ctx, xx + 6.2 * u, fy - 1.8 * u, 0.9 * u, 0.9 * u, '#e03131');
      R(ctx, xx + 5 * u, fy - 0.4 * u, 0.6 * u, 0.6 * u, '#ff8787');
      R(ctx, xx + 6.2 * u, fy - 0.4 * u, 0.6 * u, 0.6 * u, '#ff8787');
      R(ctx, xx + 5.2 * u, fy + 2.4 * u, 0.7 * u, 1.2 * u, '#fff');
      R(ctx, xx + 6.6 * u, fy + 2.4 * u, 0.7 * u, 1.2 * u, '#fff');
      // fio de teia
      R(ctx, xx + 7.4 * u, fy - 4 * u, 0.4 * u, 4 * u, 'rgba(233,228,218,0.45)');
    } else if (T.extra === 'golem') {
      const base = peY;
      // pernas grossas
      R(ctx, xx - 5.5 * u, base - 6 * u, 4 * u, 6 * u, roupa);
      R(ctx, xx + 1.5 * u, base - 6 * u, 4 * u, 6 * u, roupa);
      R(ctx, xx - 5.5 * u, base - 1.4 * u, 4.4 * u, 1.4 * u, '#39424f');
      R(ctx, xx + 1.1 * u, base - 1.4 * u, 4.4 * u, 1.4 * u, '#39424f');
      // torso de pedra
      V(ctx, xx - 6.5 * u, base - 17 * u, 13 * u, 11 * u, pele);
      R(ctx, xx - 6.5 * u, base - 17 * u, 13 * u, 2 * u, shade(T.pele, 1.2));
      R(ctx, xx + 3.5 * u, base - 16 * u, 3 * u, 9 * u, shade(T.pele, 0.7));
      R(ctx, xx - 4.5 * u, base - 12 * u, 3 * u, 6 * u, shade(T.roupa, 0.8));
      // braços enormes
      R(ctx, xx - 9.5 * u, base - 16 * u, 3.2 * u, 9 * u, roupa);
      R(ctx, xx + 6.3 * u, base - 16 * u, 3.2 * u, 9 * u, roupa);
      R(ctx, xx - 10 * u, base - 7.5 * u, 4.2 * u, 2.2 * u, pele);
      R(ctx, xx + 5.8 * u, base - 7.5 * u, 4.2 * u, 2.2 * u, pele);
      // cabeça com olhos de gelo
      V(ctx, xx - 3.6 * u, base - 21 * u, 7.2 * u, 4.6 * u, pele);
      R(ctx, xx - 2.6 * u, base - 19.8 * u, 1.4 * u, 1.2 * u, '#74c0fc');
      R(ctx, xx + 1.2 * u, base - 19.8 * u, 1.4 * u, 1.2 * u, '#74c0fc');
      // rachaduras de gelo + núcleo
      R(ctx, xx - 1 * u, base - 16 * u, 1.4 * u, 5 * u, '#74c0fc');
      R(ctx, xx - 2.4 * u, base - 14 * u, 1.4 * u, 3 * u, '#a5d8ff');
      R(ctx, xx + 1.2 * u, base - 13 * u, 1 * u, 3 * u, '#74c0fc');
      R(ctx, xx - 1.8 * u, base - 9 * u, 2 * u, 2 * u, '#e9ecf5');
      R(ctx, xx - 1.2 * u, base - 8.4 * u, 1.2 * u, 1.2 * u, '#ffffff');
      // cristais nos ombros
      R(ctx, xx - 8 * u, base - 19 * u, 1.6 * u, 3 * u, '#a5d8ff');
      R(ctx, xx + 6.4 * u, base - 19 * u, 1.6 * u, 3 * u, '#a5d8ff');
    } else if (T.extra === 'fantasma') {
      const fy = peY - 10 * u + bob + Math.sin(t * 3) * 1.4;
      const onda = Math.sin(t * 4) * 1.2 * u;
      // cauda esvoaçante
      R(ctx, xx - 4 * u, fy + 4 * u, 8 * u, 2 * u, roupa);
      R(ctx, xx - 3 * u + onda, fy + 6 * u, 3 * u, 2.4 * u, roupa);
      R(ctx, xx + 0.4 * u - onda, fy + 5.4 * u, 3 * u, 3 * u, roupa);
      R(ctx, xx - 2 * u - onda, fy + 8 * u, 2 * u, 2 * u, shade(T.roupa, 0.7));
      // corpo flutuante
      V(ctx, xx - 4.6 * u, fy - 5 * u, 9.2 * u, 10 * u, roupa);
      R(ctx, xx - 4.6 * u, fy - 5 * u, 9.2 * u, 1.4 * u, pele);
      R(ctx, xx - 3.4 * u, fy - 3 * u, 6.8 * u, 5 * u, shade(T.roupa, 1.15));
      R(ctx, xx + 2 * u, fy - 4 * u, 2 * u, 8 * u, shade(T.roupa, 0.68));
      // capuz
      R(ctx, xx - 5.4 * u, fy - 8 * u, 10.8 * u, 3.4 * u, roupa);
      R(ctx, xx - 4.4 * u, fy - 9 * u, 8.8 * u, 2 * u, shade(T.roupa, 1.2));
      R(ctx, xx - 3 * u, fy - 6.6 * u, 6 * u, 3 * u, '#1a2b25');
      // olhos brilhantes
      R(ctx, xx - 1.8 * u, fy - 5.6 * u, 1.2 * u, 1.4 * u, '#ffffff');
      R(ctx, xx + 0.6 * u, fy - 5.6 * u, 1.2 * u, 1.4 * u, '#ffffff');
      R(ctx, xx - 1.4 * u, fy - 5.2 * u, 0.6 * u, 0.7 * u, '#2f6b57');
      R(ctx, xx + 1 * u, fy - 5.2 * u, 0.6 * u, 0.7 * u, '#2f6b57');
      // braços + adaga
      R(ctx, xx - 6 * u, fy - 2 * u, 2 * u, 4.4 * u, roupa);
      R(ctx, xx + 4 * u, fy - 2 * u, 2 * u, 4.4 * u, roupa);
      const ang = swing == null ? 0.4 : -1.4 + swing * 2.2;
      if (T.arma) desenharArma(ctx, tipo, xx + 5 * u, fy - 1 * u, u, ang, flash > 0);
      // faíscas assombradas
      R(ctx, xx - 7 * u, fy - 3 * u + onda, 1.4 * u, 1.4 * u, '#9ae6c8');
      R(ctx, xx + 7 * u, fy + 2 * u - onda, 1.2 * u, 1.2 * u, '#9ae6c8');
    } else if (T.extra === 'dragao') {
      const fy = peY;
      const flap = Math.sin(t * 7) * 2 * u;
      // asas atrás
      R(ctx, xx - 12 * u, fy - 20 * u + flap * 0.25, 8 * u, 4 * u, roupa);
      R(ctx, xx - 16 * u, fy - 23 * u + flap * 0.4, 6 * u, 3 * u, shade(T.roupa, 0.75));
      R(ctx, xx + 6 * u, fy - 20 * u - flap * 0.25, 8 * u, 4 * u, roupa);
      R(ctx, xx + 12 * u, fy - 23 * u - flap * 0.4, 6 * u, 3 * u, shade(T.roupa, 0.75));
      // cauda
      R(ctx, xx - 13 * u, fy - 7 * u, 7 * u, 2.4 * u, pele);
      R(ctx, xx - 18 * u, fy - 6 * u + Math.sin(t * 4) * u, 5 * u, 1.6 * u, roupa);
      R(ctx, xx - 20 * u, fy - 7 * u + Math.sin(t * 4) * u, 2.4 * u, 2 * u, shade(T.roupa, 1.2));
      // corpo
      elipsePixel(ctx, xx - 3 * u, fy - 8 * u, 8 * u, 5 * u, pele, caido ? 0.4 : 1);
      R(ctx, xx - 9 * u, fy - 5 * u, 13 * u, 2 * u, shade(T.pele, 1.15));
      // patas com garras
      for (const lx of [-7, -1, 4] as const) {
        R(ctx, xx + lx * u, fy - 5 * u, 2.6 * u, 5 * u, roupa);
        R(ctx, xx + lx * u - 0.4 * u, fy - 1 * u, 3.4 * u, 1.2 * u, '#241f26');
        R(ctx, xx + lx * u + 2.2 * u, fy - 1 * u, 1 * u, 1 * u, '#e9e4da');
      }
      // pescoço + cabeça
      R(ctx, xx + 5 * u, fy - 15 * u, 4 * u, 8 * u, pele);
      R(ctx, xx + 4 * u, fy - 13 * u, 2 * u, 6 * u, shade(T.pele, 0.7));
      V(ctx, xx + 7 * u, fy - 19 * u, 8 * u, 5.4 * u, pele);
      R(ctx, xx + 13 * u, fy - 16 * u, 4 * u, 2.4 * u, shade(T.pele, 1.15));
      R(ctx, xx + 14.4 * u, fy - 15.4 * u, 1 * u, 1 * u, '#241f26');
      // chifres + espinhos
      R(ctx, xx + 8 * u, fy - 22 * u, 1.6 * u, 3 * u, '#e9e4da');
      R(ctx, xx + 11 * u, fy - 22 * u, 1.6 * u, 3 * u, '#e9e4da');
      for (let i = 0; i < 4; i++)
        R(ctx, xx - 7 * u + i * 3 * u, fy - 13 * u - (i % 2) * u, 1.4 * u, 2 * u, '#e9e4da');
      // olho + brasa na boca
      R(ctx, xx + 11.4 * u, fy - 18 * u, 1.6 * u, 1.2 * u, '#ffd43b');
      R(ctx, xx + 12 * u, fy - 17.8 * u, 0.7 * u, 0.7 * u, '#241f26');
      R(ctx, xx + 15.4 * u, fy - 15.8 * u, 1.2 * u, 1.2 * u, '#ff922b');
      R(ctx, xx + 16.2 * u, fy - 16.4 * u, 0.7 * u, 2 * u, '#ffd43b');
    } else if (T.extra === 'lobo') {
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
      } else if (T.extra === 'armadura') {
        // elmo fechado com fenda e olhos vermelhos
        R(ctx, xx - 3.2 * u, peY - h - 4.6 * u + bob, 6.6 * u, 5 * u, '#39424f');
        R(ctx, xx - 3.2 * u, peY - h - 4.6 * u + bob, 6.6 * u, 0.8 * u, '#59677d');
        R(ctx, xx - 2.4 * u, peY - h - 3.4 * u + bob, 5 * u, 0.9 * u, '#0d0a14');
        R(ctx, xx - 1.6 * u, peY - h - 3.4 * u + bob, 1.2 * u, 0.9 * u, '#e03131');
        R(ctx, xx + 0.9 * u, peY - h - 3.4 * u + bob, 1.2 * u, 0.9 * u, '#e03131');
        R(ctx, xx - 0.4 * u, peY - h - 6.2 * u + bob, 1.2 * u, 2 * u, '#e8b34a');
        // ombreiras com espinhos dourados
        R(ctx, xx - 5.6 * u, peY - h * 0.78 + bob, 3 * u, 2.2 * u, '#39424f');
        R(ctx, xx + 2.6 * u, peY - h * 0.78 + bob, 3 * u, 2.2 * u, '#39424f');
        R(ctx, xx - 5.2 * u, peY - h * 0.78 - 1 * u + bob, 1.1 * u, 1.6 * u, '#e8b34a');
        R(ctx, xx + 4.4 * u, peY - h * 0.78 - 1 * u + bob, 1.1 * u, 1.6 * u, '#e8b34a');
        // runa no peito + manto rasgado
        R(ctx, xx - 0.6 * u, peY - h * 0.62 + bob, 1.2 * u, 3 * u, '#e03131');
        R(ctx, xx - 1.8 * u, peY - h * 0.52 + bob, 3.6 * u, 0.8 * u, '#e03131');
        R(ctx, xx - 5.2 * u, peY - h * 0.52 + bob, 1.6 * u, h * 0.28, '#1c2333');
        R(ctx, xx + 3.6 * u, peY - h * 0.52 + bob, 1.6 * u, h * 0.28, '#1c2333');
      }
      const px = xx + 3 * u, py = peY - h * 0.55 + bob;
      const ang = swing == null ? 0.4 : -1.4 + swing * 2.2;
      if (T.arma) desenharArma(ctx, tipo, px, py, u, ang, flash > 0);
    }

    if (flash > 0) {
      // brilho de impacto no contorno (sem caixa branca)
      ctx.globalAlpha = Math.min(0.75, flash * 0.9);
      const alturaFlash =
        T.extra === 'lobo'
          ? 11 * u
          : T.extra === 'golem'
            ? 21 * u
            : T.extra === 'dragao'
              ? 23 * u
              : T.extra === 'fantasma'
                ? 10 * u
                : T.extra === 'aranha'
                  ? 9 * u
                  : T.extra === 'asas'
                    ? 7 * u
                    : h + 5 * u;
      R(ctx, xx - 2 * u, peY - alturaFlash, 4 * u, 0.8 * u, '#ffffff');
      R(ctx, xx - 5 * u, peY - alturaFlash * 0.7 + bob, 0.8 * u, 2 * u, '#ffffff');
      R(ctx, xx + 4.4 * u, peY - alturaFlash * 0.55 + bob, 0.7 * u, 2.2 * u, '#ffffff');
      R(ctx, xx - 1 * u, peY - 1.8 * u, 1.2 * u, 0.7 * u, '#ffffff');
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  });
}
