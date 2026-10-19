// core/horde.ts — lugares, geração de hordas e simulação determinística.
// A simulação usa as MESMAS regras da animação (engine/arena.ts):
// se mudar alcance/velocidade/regen aqui, mude lá também (ver REGRAS).

import { LUGARES, MAX_LUGAR, NOMES_MONSTROS, REGRAS } from './data.js';
import { parametrosCombate } from './combat.js';
import type {
  AvancoNivel,
  GameState,
  Horda,
  Inimigo,
  LugarDef,
  SimResult,
} from './types.js';

export function lugarDe(lugarAbs: number): LugarDef {
  return LUGARES[lugarAbs % LUGARES.length];
}

export function voltaDe(lugarAbs: number): number {
  return Math.floor(lugarAbs / LUGARES.length) + 1;
}

export function ehBoss(nivel: number): boolean {
  return nivel >= 10;
}

export function totalInimigos(nivel: number): number {
  return ehBoss(nivel) ? 1 : 15 * nivel;
}

export function limiteSimultaneos(nivel: number): number {
  if (ehBoss(nivel)) return 1;
  return Math.min(3 + Math.floor(nivel / 2), 6);
}

export function gerarHorda(state: GameState): Horda {
  const L = state.lugar;
  const N = state.nivel;
  const lugar = lugarDe(L);
  const boss = ehBoss(N);
  const mult = parametrosCombate(state).ouroMult;
  const goldBase = (3 + N * 1.5) * (1 + L * 2) * mult;

  const inimigos: Inimigo[] = [];
  if (boss) {
    const hpB = Math.round(10 * Math.pow(1.15, 9) * Math.pow(1.9, L) * 6);
    const atkB = Math.round(2 * Math.pow(1.1, 9) * Math.pow(1.6, L) * 2);
    inimigos.push({
      kind: lugar.bossKind,
      nome: `${lugar.bossNome} Nv.10`,
      hp: hpB,
      maxHp: hpB,
      atk: atkB,
      boss: true,
      gold: Math.round(goldBase * 15),
    });
  } else {
    const total = totalInimigos(N);
    for (let i = 0; i < total; i++) {
      const varI = 1 + (i % 5) * 0.04;
      const hp = Math.round(10 * Math.pow(1.15, N - 1) * Math.pow(1.9, L) * varI);
      const atk = Math.round(2 * Math.pow(1.1, N - 1) * Math.pow(1.6, L) * varI);
      const kind = lugar.kinds[i % lugar.kinds.length];
      inimigos.push({
        kind,
        nome: NOMES_MONSTROS[kind % NOMES_MONSTROS.length],
        hp,
        maxHp: hp,
        atk,
        boss: false,
        gold: Math.round(goldBase * (0.9 + (i % 3) * 0.1)),
      });
    }
  }
  const bonus = boss
    ? Math.round(goldBase * 10)
    : Math.round(inimigos.reduce((s, e) => s + e.gold, 0) * 0.4);
  return { inimigos, total: inimigos.length, bonus, boss, lugar: lugar.nome, bioma: lugar.bioma };
}

interface VivoSim {
  def: Inimigo;
  x: number;
  cd: number;
  vel: number;
}

// Simula a horda em ticks (mesmas REGRAS + regen/intervalo da animação).
export function simularHorda(state: GameState): SimResult {
  const horda = gerarHorda(state);
  const P = parametrosCombate(state);
  const R = REGRAS;
  const cap = limiteSimultaneos(state.nivel);
  const vivos: VivoSim[] = [];
  let fila = 0;
  let spawnT = 0;
  let ladoAlt = 1;
  let t = 0;
  let hp = P.hp;
  let cd = R.cdInicialJogador;
  const dt = 0.05;
  const PX = 240;
  const contaMortos = (): number => vivos.filter((v) => v.def.hp <= 0).length;

  const alvoMaisProximo = (): VivoSim | null => {
    let best: VivoSim | null = null;
    let bd = Infinity;
    for (const v of vivos) {
      if (v.def.hp <= 0) continue;
      const d = Math.abs(v.x - PX);
      if (d <= R.alcancePlayer && d < bd) {
        bd = d;
        best = v;
      }
    }
    return best;
  };

  for (let step = 0; step < 20000; step++) {
    t += dt;
    hp = Math.min(P.hp, hp + P.regen * dt);
    spawnT -= dt;
    const emCampo = vivos.filter((v) => v.def.hp > 0).length;
    if (fila < horda.inimigos.length && emCampo < cap && spawnT <= 0) {
      ladoAlt *= -1;
      vivos.push({
        def: { ...horda.inimigos[fila] },
        x: PX + ladoAlt * R.distSpawn,
        cd: R.cdInicialInimigo,
        vel: R.velBase + (fila % 3) * 5,
      });
      fila++;
      spawnT = R.spawnCd;
    }
    cd -= dt;
    if (cd <= 0) {
      const alvo = alvoMaisProximo();
      if (alvo) {
        alvo.def.hp -= P.atk;
        cd = P.intervalo;
      }
    }
    for (const v of vivos) {
      if (v.def.hp <= 0) continue;
      const d = Math.abs(v.x - PX);
      if (d <= R.alcanceInimigo) {
        v.cd -= dt;
        if (v.cd <= 0) {
          hp -= v.def.atk;
          v.cd = R.intervaloInimigo;
        }
      } else {
        v.x -= Math.sign(v.x - PX) * v.vel * dt;
        if (Math.abs(v.x - PX) < R.alcanceInimigo)
          v.x = PX + Math.sign(v.x - PX) * R.alcanceInimigo;
      }
    }
    if (hp <= 0) return { venceu: false, tempo: t, abates: contaMortos(), horda };
    const mortos = contaMortos();
    if (fila >= horda.inimigos.length && mortos >= horda.inimigos.length) {
      return { venceu: true, tempo: t, abates: mortos, horda };
    }
  }
  return { venceu: false, tempo: t, abates: contaMortos(), horda };
}

export function avancarNivel(state: GameState): AvancoNivel {
  if (state.nivel >= 10) {
    state.nivel = 1;
    if (state.lugar >= MAX_LUGAR) return { subiuLugar: false, volta: voltaDe(state.lugar) };
    state.lugar += 1;
    return { subiuLugar: true, volta: voltaDe(state.lugar) };
  }
  state.nivel += 1;
  return { subiuLugar: false, volta: voltaDe(state.lugar) };
}
