// render/sprites/knight.ts — cavaleiro 100% em retângulos.
// Olha para +x local; dir=-1 espelha. Visuais mudam por tier de equipamento.
// Spec e guia: docs/sprites-referencia.md, docs/pixel-art-guia.md.

import { R, shade, V, comDir, elipsePixel, type Ctx2D } from '../pixel.js';
import type { OptsCavaleiro } from './shared.js';

export function desenharCavaleiro(ctx: Ctx2D, o: OptsCavaleiro): void {
  const { x, peY, s, t, lunge, swing, flash, caido, dir, equip } = o;
  const eq = equip;
  comDir(ctx, x, dir || 1, () => {
    const xx = x + (lunge || 0);
    const bob = caido ? 0 : Math.sin(t * 4) * 0.6 * s * 0.3;
    const passo = (lunge || 0) > 2 ? 0 : Math.sin(t * 4) * 0.5;

    elipsePixel(ctx, xx, peY + 2, Math.round(11 * s * 0.33), 3, '#000', 0.42);

    const u = s;
    const ARM = '#8fa3bd', ESC = '#5d6f88', OURO = '#e8b34a', PLUMA = '#e03131';
    const PELE = '#f1c27d', PELE_SOMBRA = '#d9a066', CABELO = '#5c3a21';
    const CINZ: string | null = caido ? '#777' : null;
    const C = (c: string): string => CINZ || c;

    ctx.save();
    if (caido) ctx.globalAlpha = 0.55;

    // ---- pernas conforme a calça ----
    const tCal = eq.calcas || 0;
    if (tCal === 0) {
      R(ctx, xx - 3 * u, peY - 4 * u + Math.max(0, passo * u * 0.4), 2 * u, 4 * u, C(PELE));
      R(ctx, xx + 1 * u, peY - 4 * u + Math.max(0, -passo * u * 0.4), 2 * u, 4 * u, C(PELE_SOMBRA));
      // joelho + sombra da panturrilha
      R(ctx, xx - 3 * u, peY - 3.4 * u + Math.max(0, passo * u * 0.4), 2 * u, 0.7 * u, C(PELE_SOMBRA));
      R(ctx, xx + 1 * u, peY - 2.6 * u + Math.max(0, -passo * u * 0.4), 1 * u, 1.4 * u, C('#a06a3f'));
      R(ctx, xx - 3 * u, peY - 4 * u + Math.max(0, passo * u * 0.4), 0.6 * u, 4 * u, C('#f7d9a8'));
      // farrapos rasgados (pontas alternadas) + remendo
      R(ctx, xx - 3.4 * u, peY - 6.4 * u, 2.8 * u, 2 * u, C('#6b5433'));
      R(ctx, xx + 0.6 * u, peY - 5.8 * u, 2.8 * u, 1.6 * u, C('#7a6238'));
      R(ctx, xx - 3.4 * u, peY - 4.4 * u, 1.1 * u, 1.2 * u, C('#6b5433'));
      R(ctx, xx + 0.2 * u, peY - 4.2 * u, 1 * u, 1 * u, C('#7a6238'));
      R(ctx, xx - 2.6 * u, peY - 6 * u, 1.2 * u, 1.2 * u, C('#8a7a5c'));
      R(ctx, xx - 2.6 * u, peY - 6 * u, 1.2 * u, 0.4 * u, C('#a89468'));
    } else {
      const corCal = tCal === 1 ? '#8a7a5c' : tCal === 2 ? '#5d6f88' : OURO;
      const corCal2 = tCal === 1 ? '#6b5f45' : tCal === 2 ? '#39424f' : '#8a6414';
      R(ctx, xx - 3 * u, peY - 4 * u + Math.max(0, passo * u * 0.4), 2 * u, 4 * u, C(corCal));
      R(ctx, xx + 1 * u, peY - 4 * u + Math.max(0, -passo * u * 0.4), 2 * u, 4 * u, C(corCal2));
      if (tCal === 3) {
        R(ctx, xx - 3 * u, peY - 5.4 * u, 2 * u, 0.8 * u, '#fff3bf');
        R(ctx, xx + 1 * u, peY - 5.4 * u, 2 * u, 0.8 * u, '#fff3bf');
      }
    }
    // ---- botas / pés ----
    const tBot = eq.botas || 0;
    if (tBot === 0) {
      R(ctx, xx - 3.2 * u, peY - 1.2 * u, 2.4 * u, 1.2 * u, C(PELE));
      R(ctx, xx + 0.8 * u, peY - 1.2 * u, 2.4 * u, 1.2 * u, C(PELE_SOMBRA));
      // tornozelo + dedos
      R(ctx, xx - 3.2 * u, peY - 1.2 * u, 2.4 * u, 0.45 * u, C(PELE_SOMBRA));
      R(ctx, xx - 1.4 * u, peY - 0.7 * u, 0.5 * u, 0.7 * u, C(PELE_SOMBRA));
      R(ctx, xx + 2.6 * u, peY - 0.7 * u, 0.5 * u, 0.7 * u, C('#a06a3f'));
    } else {
      const corB = tBot === 1 ? '#6b4a2f' : tBot === 2 ? '#2b2118' : '#3a2f10';
      R(ctx, xx - 3.4 * u, peY - 1.4 * u, 2.8 * u, 1.4 * u, C(corB));
      R(ctx, xx + 0.6 * u, peY - 1.4 * u, 2.8 * u, 1.4 * u, C(corB));
      if (tBot === 3) {
        R(ctx, xx - 3.4 * u, peY - 1.4 * u, 2.8 * u, 0.5 * u, OURO);
        R(ctx, xx + 0.6 * u, peY - 1.4 * u, 2.8 * u, 0.5 * u, OURO);
      }
    }
    // ---- torso conforme a camisa ----
    const tCam = eq.camisa || 0;
    R(ctx, xx - 4.6 * u, peY - 11.6 * u + bob, 9.2 * u, 8.2 * u, '#1c2333');
    R(ctx, xx - 4.6 * u, peY - 11.6 * u + bob, 9.2 * u, 1, shade('#8fa3bd', 1.25)); // sel-out
    if (tCam === 0) {
      V(ctx, xx - 4 * u, peY - 11 * u + bob, 8 * u, 7 * u, C(PELE));
      // peitoral: sombra sob os músculos + linha central
      R(ctx, xx - 2.8 * u, peY - 10.2 * u + bob, 2.2 * u, 0.9 * u, C(PELE_SOMBRA));
      R(ctx, xx + 0.6 * u, peY - 10.2 * u + bob, 2.2 * u, 0.9 * u, C(PELE_SOMBRA));
      R(ctx, xx - 0.2 * u, peY - 10.4 * u + bob, 0.5 * u, 2 * u, C(PELE_SOMBRA));
      // abdômen: gominhos + umbigo
      R(ctx, xx - 1.8 * u, peY - 8.2 * u + bob, 3.6 * u, 0.55 * u, C(PELE_SOMBRA));
      R(ctx, xx - 1.4 * u, peY - 7 * u + bob, 2.8 * u, 0.5 * u, C(PELE_SOMBRA));
      R(ctx, xx - 0.3 * u, peY - 7.6 * u + bob, 0.6 * u, 0.6 * u, C('#a06a3f'));
      // lateral do corpo (luz do topo: sombra à direita)
      R(ctx, xx + 2.8 * u, peY - 10.6 * u + bob, 1.2 * u, 6.2 * u, C(PELE_SOMBRA));
      R(ctx, xx - 4 * u, peY - 10.6 * u + bob, 0.7 * u, 6.2 * u, C('#f7d9a8'));
      // cinto com fivela
      R(ctx, xx - 4 * u, peY - 5.6 * u + bob, 8 * u, 0.8 * u, C('#6b5433'));
      R(ctx, xx - 0.7 * u, peY - 5.8 * u + bob, 1.4 * u, 1.2 * u, C('#e8b34a'));
      R(ctx, xx - 0.4 * u, peY - 5.5 * u + bob, 0.8 * u, 0.6 * u, C('#6b5433'));
    } else if (tCam === 1) {
      V(ctx, xx - 4 * u, peY - 11 * u + bob, 8 * u, 7 * u, C('#c9b48a'));
      R(ctx, xx - 4 * u, peY - 6 * u + bob, 8 * u, 1 * u, C('#8a7a5c'));
      R(ctx, xx + 2.5 * u, peY - 11 * u + bob, 1.2 * u, 7 * u, C('#a89468'));
    } else if (tCam === 2) {
      V(ctx, xx - 4 * u, peY - 11 * u + bob, 8 * u, 7 * u, C(ARM));
      R(ctx, xx - 2.5 * u, peY - 11 * u + bob, 5 * u, 7 * u, C('#3f8cff'));
      R(ctx, xx - 4 * u, peY - 6 * u + bob, 8 * u, 1.2 * u, OURO);
      R(ctx, xx - 0.8 * u, peY - 6.2 * u + bob, 1.6 * u, 1.6 * u, '#fff3bf');
      R(ctx, xx + 2.5 * u, peY - 11 * u + bob, 1.2 * u, 7 * u, C(ESC));
    } else {
      V(ctx, xx - 4 * u, peY - 11 * u + bob, 8 * u, 7 * u, C(OURO));
      R(ctx, xx - 2.5 * u, peY - 11 * u + bob, 5 * u, 7 * u, C('#c2255c'));
      R(ctx, xx - 4 * u, peY - 6 * u + bob, 8 * u, 1.2 * u, C('#8a6414'));
      R(ctx, xx - 0.8 * u, peY - 6.2 * u + bob, 1.6 * u, 1.6 * u, '#74c0fc');
      R(ctx, xx - 4 * u, peY - 11 * u + bob, 8 * u, 0.9 * u, '#fff3bf');
    }
    if (tCam >= 2) {
      const corO = tCam === 2 ? ESC : OURO;
      R(ctx, xx - 6 * u, peY - 12.4 * u + bob, 3 * u, 2.6 * u, C(corO));
      R(ctx, xx + 3 * u, peY - 12.4 * u + bob, 3 * u, 2.6 * u, C(corO));
      R(ctx, xx - 6 * u, peY - 12.4 * u + bob, 3 * u, 0.9 * u, tCam === 2 ? OURO : '#fff3bf');
      R(ctx, xx + 3 * u, peY - 12.4 * u + bob, 3 * u, 0.9 * u, tCam === 2 ? OURO : '#fff3bf');
    }
    // ---- escudo ----
    const tEsc = eq.escudo || 0;
    if (tEsc === 1) {
      R(ctx, xx - 8 * u, peY - 10 * u + bob, 3.2 * u, 6 * u, C('#7a5c38'));
      R(ctx, xx - 8 * u, peY - 10 * u + bob, 3.2 * u, 1 * u, C('#5c4a2f'));
      R(ctx, xx - 7.2 * u, peY - 8 * u + bob, 1.6 * u, 1.6 * u, C('#3a2f1e'));
    } else if (tEsc === 2) {
      R(ctx, xx - 8 * u, peY - 10 * u + bob, 3.4 * u, 6 * u, C('#3a5a8c'));
      R(ctx, xx - 7.4 * u, peY - 9.6 * u + bob, 2.2 * u, 1 * u, OURO);
      R(ctx, xx - 6.8 * u, peY - 10 * u + bob, 1 * u, 5 * u, OURO);
      R(ctx, xx - 7 * u, peY - 8 * u + bob, 1.4 * u, 1.4 * u, '#fff3bf');
    } else if (tEsc === 3) {
      R(ctx, xx - 8.4 * u, peY - 10.4 * u + bob, 3.8 * u, 6.8 * u, C(OURO));
      R(ctx, xx - 8.4 * u, peY - 10.4 * u + bob, 3.8 * u, 1 * u, '#fff3bf');
      R(ctx, xx - 7.2 * u, peY - 8.2 * u + bob, 1.6 * u, 1.6 * u, '#74c0fc');
    }
    // ---- cabeça conforme o elmo ----
    const tEl = eq.elmo || 0;
    R(ctx, xx - 3.6 * u, peY - 16.6 * u + bob, 7.2 * u, 6.2 * u, '#1c2333');
    R(ctx, xx - 3.6 * u, peY - 16.6 * u + bob, 7.2 * u, 1, shade('#8fa3bd', 1.25)); // sel-out
    if (tEl === 0) {
      V(ctx, xx - 3 * u, peY - 16 * u + bob, 6 * u, 5 * u, C(PELE));
      // cabelo com volume: base + mecha clara no topo + costeletas
      R(ctx, xx - 3 * u, peY - 16 * u + bob, 6 * u, 1.6 * u, C(CABELO));
      R(ctx, xx - 2.2 * u, peY - 16 * u + bob, 3.4 * u, 0.6 * u, C('#7a5230'));
      R(ctx, xx - 3.6 * u, peY - 15.4 * u + bob, 1 * u, 3.4 * u, C(CABELO));
      R(ctx, xx - 3.6 * u, peY - 15.4 * u + bob, 1 * u, 0.7 * u, C('#7a5230'));
      R(ctx, xx + 2.4 * u, peY - 15.6 * u + bob, 0.7 * u, 1.6 * u, C(CABELO));
      // sombra da testa sob o cabelo
      R(ctx, xx - 2.6 * u, peY - 14.4 * u + bob, 5.2 * u, 0.6 * u, C(PELE_SOMBRA));
      // sobrancelha + olho (branco + pupila, olhando p/ frente)
      R(ctx, xx + 0.4 * u, peY - 14.2 * u + bob, 1.8 * u, 0.5 * u, C(CABELO));
      R(ctx, xx + 0.6 * u, peY - 13.6 * u + bob, 1.5 * u, 1.2 * u, '#ffffff');
      R(ctx, xx + 1.3 * u, peY - 13.5 * u + bob, 0.8 * u, 1 * u, '#241f26');
      R(ctx, xx + 1.5 * u, peY - 13.5 * u + bob, 0.3 * u, 0.4 * u, '#ffffff');
      // nariz + boca + orelha + queixo
      R(ctx, xx + 2.2 * u, peY - 12.4 * u + bob, 0.7 * u, 0.9 * u, C(PELE_SOMBRA));
      R(ctx, xx + 0.6 * u, peY - 12.2 * u + bob, 1.2 * u, 0.55 * u, C('#8a4b3a'));
      R(ctx, xx - 3.2 * u, peY - 13.4 * u + bob, 0.8 * u, 1 * u, C(PELE_SOMBRA));
      R(ctx, xx - 2 * u, peY - 11.6 * u + bob, 4 * u, 0.6 * u, C(PELE_SOMBRA));
    } else if (tEl === 1) {
      V(ctx, xx - 3.2 * u, peY - 16.4 * u + bob, 6.4 * u, 5.4 * u, C('#6b4a2f'));
      R(ctx, xx - 1.8 * u, peY - 15 * u + bob, 3.6 * u, 3.4 * u, C(PELE));
      R(ctx, xx - 0.2 * u, peY - 13.8 * u + bob, 1 * u, 1 * u, '#241f26');
    } else if (tEl === 2) {
      V(ctx, xx - 3 * u, peY - 16 * u + bob, 6 * u, 5 * u, C(ARM));
      R(ctx, xx + 0 * u, peY - 14 * u + bob, 3 * u, 1 * u, '#241f26');
      R(ctx, xx - 3 * u, peY - 17 * u + bob, 6 * u, 1 * u, C(ESC));
      const onda = Math.sin(t * 6) * u * 0.5;
      R(ctx, xx - 1 * u, peY - 20 * u + bob, 3 * u, 3 * u, PLUMA);
      R(ctx, xx - 2 * u + onda, peY - 20 * u + bob, 1.4 * u, 2 * u, '#ff8787');
    } else {
      V(ctx, xx - 3 * u, peY - 16 * u + bob, 6 * u, 5 * u, C(OURO));
      R(ctx, xx + 0 * u, peY - 14 * u + bob, 3 * u, 1 * u, '#241f26');
      R(ctx, xx - 3 * u, peY - 17 * u + bob, 6 * u, 1.2 * u, '#fff3bf');
      const onda = Math.sin(t * 6) * u * 0.5;
      R(ctx, xx - 1.2 * u, peY - 21.4 * u + bob, 3.4 * u, 4.4 * u, PLUMA);
      R(ctx, xx - 2.2 * u + onda, peY - 21.4 * u + bob, 1.4 * u, 3 * u, '#ff8787');
    }

    // ---- braço de trás (apoio, mais escuro, balança oposto) ----
    {
      const balanco = caido ? 0 : Math.sin(t * 4 + Math.PI) * 0.8 * u;
      const bx = xx - 4.5 * u, by = peY - 9 * u + bob + balanco * 0.3;
      const corBT = tCam === 0 ? PELE_SOMBRA : '#5c5346';
      R(ctx, bx, by - 0.7 * u, 1.8 * u, 3.4 * u, C(corBT));
      R(ctx, bx - 0.4 * u, by + 2.4 * u, 2.2 * u, 1.6 * u, C(corBT)); // punho
      R(ctx, bx - 0.4 * u, by + 2.4 * u, 2.2 * u, 0.5 * u, C(PELE_SOMBRA));
    }

    // ---- braço + arma ----
    const tAr = eq.arma || 0;
    const pxx = xx + 3 * u, py = peY - 9 * u + bob;
    const ang = swing == null ? 0.5 + Math.sin(t * 4) * 0.06 : -1.5 + swing * 2.4;
    // ombro/deltoide (volume no encaixe)
    R(ctx, pxx - 1.2 * u, py - 1.6 * u, 2.6 * u, 2.4 * u, C(tCam === 0 ? PELE : '#7a6a55'));
    R(ctx, pxx - 1.2 * u, py - 1.6 * u, 2.6 * u, 0.6 * u, C(tCam === 0 ? '#f7d9a8' : '#9a8a70'));
    ctx.save();
    ctx.translate(pxx, py);
    ctx.rotate(ang);
    const braco = tCam === 0 ? PELE : '#7a6a55';
    R(ctx, 0, -0.8 * u, 3 * u, 1.6 * u, C(braco));
    R(ctx, 0, 0, 3 * u, 0.5 * u, C(tCam === 0 ? PELE_SOMBRA : '#5c5346'));
    if (tAr === 0) {
      // punho fechado + graveto com empunhadura e ponta
      R(ctx, 2.6 * u, -1 * u, 1.8 * u, 2 * u, C(PELE));
      R(ctx, 2.6 * u, 0.5 * u, 1.8 * u, 0.5 * u, C(PELE_SOMBRA));
      R(ctx, 3.6 * u, -0.6 * u, 1 * u, 1.2 * u, C('#3a2f1e')); // grip
      R(ctx, 4.4 * u, -0.5 * u, 5 * u, 0.7 * u, C('#6b5433'));
      R(ctx, 4.4 * u, -0.5 * u, 5 * u, 0.3 * u, C('#8a6d3b')); // luz do topo
      R(ctx, 8.6 * u, -0.7 * u, 1.2 * u, 1.1 * u, C('#7a6238')); // ponta
      R(ctx, 6 * u, 0.2 * u, 2 * u, 0.35 * u, C('#3a2f1e')); // nó
    } else if (tAr === 1) {
      R(ctx, 2.6 * u, -1 * u, 1.8 * u, 2 * u, C(PELE));
      R(ctx, 2.6 * u, 0.5 * u, 1.8 * u, 0.5 * u, C(PELE_SOMBRA));
      R(ctx, 4 * u, -1 * u, 1 * u, 2 * u, C('#5c5346')); // guarda
      R(ctx, 4.6 * u, -0.6 * u, 4.6 * u, 1.2 * u, C('#9a8a70'));
      R(ctx, 4.6 * u, -0.6 * u, 4.6 * u, 0.4 * u, '#d8d2c4'); // fio
      R(ctx, 8.4 * u, -0.8 * u, 1 * u, 1.6 * u, '#d8d2c4'); // ponta
    } else if (tAr === 2) {
      R(ctx, 2.6 * u, -1 * u, 1.8 * u, 2 * u, C(PELE));
      R(ctx, 2.6 * u, 0.5 * u, 1.8 * u, 0.5 * u, C(PELE_SOMBRA));
      R(ctx, 4 * u, -1.2 * u, 1.4 * u, 2.4 * u, OURO); // guarda
      R(ctx, 4 * u, -1.2 * u, 1.4 * u, 0.5 * u, '#fff3bf');
      R(ctx, 5 * u, -0.7 * u, 9 * u, 1.4 * u, C('#dfe8ee'));
      R(ctx, 5 * u, -0.7 * u, 9 * u, 0.5 * u, '#ffffff'); // fio
      R(ctx, 10.6 * u, -0.7 * u, 3.2 * u, 1.4 * u, '#ffffff');
    } else {
      R(ctx, 2.6 * u, -1 * u, 1.8 * u, 2 * u, C(PELE));
      R(ctx, 2.6 * u, 0.5 * u, 1.8 * u, 0.5 * u, C(PELE_SOMBRA));
      R(ctx, 4 * u, -1.2 * u, 1.4 * u, 2.4 * u, OURO);
      R(ctx, 4 * u, -1.2 * u, 1.4 * u, 0.5 * u, '#fff3bf');
      R(ctx, 5 * u, -0.8 * u, 9.6 * u, 1.6 * u, C('#bfe9ff'));
      R(ctx, 5 * u, -0.8 * u, 9.6 * u, 0.6 * u, '#ffffff'); // fio
      R(ctx, 5 * u, 0.2 * u, 9.6 * u, 0.6 * u, '#74c0fc'); // sombra
      R(ctx, 12 * u, -0.8 * u, 2.8 * u, 1.6 * u, '#ffffff');
      R(ctx, 7 * u, -0.5 * u, 1.6 * u, 1 * u, '#ffffff'); // runa acesa
    }
    ctx.restore();

    if (flash > 0) {
      ctx.globalAlpha = Math.min(0.32, flash * 0.4);
      R(ctx, xx - 4 * u, peY - 16 * u + bob, 11 * u, 16 * u, '#ffffff');
    }
    ctx.restore();
  });
}
