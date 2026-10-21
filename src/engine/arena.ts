// engine/arena.ts — motor da horda (lógica + orquestração do desenho).
// Sprites em render/sprites, cenário em engine/scenario, primitivas em render/pixel.
// Nenhuma forma vetorial: só fillRect/fillText/strokeRect e transformações.

import { REGRAS, SKILL_MULT } from '../core/data.js';
import type { BiomaId, Inimigo } from '../core/types.js';
import type { EquipVisual } from '../render/sprites/shared.js';
import { W, H, CHAO_Y, PX, R, elipsePixel, elipsePontos, type Ctx2D } from '../render/pixel.js';
import {
  desenharCavaleiro,
  desenharMonstro,
  EQUIP_VAZIO,
  TIPOS,
} from '../render/sprites/index.js';
import {
  biomaPorLugar,
  desenharCenario,
  desenharPrimeiroPlano,
  novaParticula,
  type Particula,
} from './scenario.js';

export type ArenaSfx = 'golpe' | 'dano' | 'abate' | 'abateElite' | 'abateBoss';

export interface ArenaFightConfig {
  playerAtk: number;
  playerHp: number;
  intervalo: number;
  regen: number;
  reducaoDano: number;
  equip: EquipVisual;
  inimigos: Inimigo[];
  lugarAbs: number;
  biomaId: BiomaId;
  lugarNome: string;
  nivel: number;
  cap: number;
  tempoMax: number;
  onAbate?: (def: Inimigo) => void;
  onPlayerHp?: (hp: number, max: number) => void;
  onProgress?: (abatidos: number, total: number) => void;
  onSfx?: (evento: ArenaSfx) => void;
}

export interface ArenaResult {
  venceu: boolean;
  abates: number;
  ouro: number;
  tempo: number;
  abandonada?: boolean;
  erro?: boolean;
  watchdog?: boolean;
  [extra: string]: unknown;
}

interface VivoArena {
  def: Inimigo;
  hp: number;
  x: number;
  lado: number;
  vel: number;
  yOff: number;
  cd: number;
  swing: number | null;
  lunge: number;
  flash: number;
  morto: boolean;
  dieT: number;
  esc: number;
  atkA: number | null;
}

interface LutaAtiva extends ArenaFightConfig {
  fila: number;
  spawnT: number;
  lado: number;
  vivos: VivoArena[];
  player: { hp: number; max: number; cd: number };
  hpSync: number;
  abates: number;
  ouro: number;
  fim: 'vitoria' | 'derrota' | null;
  fimT: number;
  inicio: number;
  maxDur: number;
  atkK: number | null;
  resolve: (r: ArenaResult) => void;
}

interface Fx {
  tipo: 'puff' | 'slash' | 'morte';
  x: number;
  y: number;
  idade: number;
  dir?: 1 | -1;
  cor?: string;
}

interface Faisca {
  x: number;
  y: number;
  vx: number;
  vy: number;
  idade: number;
  vida: number;
  s: number;
  cor: string;
}

interface DanoFlutuante {
  x: number;
  y: number;
  txt: string;
  c: string;
  idade: number;
}

interface CavPose {
  flash: number;
  lunge: number;
  swing: number | null;
  caido: boolean;
  dir: 1 | -1;
}

export class Arena {
  private cv: HTMLCanvasElement;
  private ctx: Ctx2D;
  private t = 0;
  private ultimo = 0;
  private parts: Particula[] = [];
  private fx: Fx[] = [];
  private faiscas: Faisca[] = [];
  private danos: DanoFlutuante[] = [];
  private flashDano = 0;
  private shake = 0;
  private splash: { txt: string; sub: string; idade: number } | null = null;
  private modo: 'descanso' | 'luta' = 'descanso';
  private lugarAbs = 0;
  private biomaId: BiomaId = 'campo';
  private nivelSeed = 1;
  private equipPreview: EquipVisual = { ...EQUIP_VAZIO };
  private cav: CavPose = { flash: 0, lunge: 0, swing: null, caido: false, dir: 1 };
  private luta: LutaAtiva | null = null;
  private erros = 0;
  private tickBound: (agora: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.cv = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('[arena] canvas 2d indisponível');
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
    this.ultimo = performance.now();
    this.tickBound = this.tick.bind(this);
    requestAnimationFrame(this.tickBound);
  }

  descanso(lugarAbs: number, biomaId: BiomaId, equip?: EquipVisual, nivel = 1): void {
    // Resolve luta pendente (ex.: reset no meio da run) para não travar o await.
    if (this.luta?.resolve) {
      const L = this.luta;
      this.luta = null;
      this.modo = 'descanso';
      L.resolve({ venceu: false, abates: L.abates || 0, ouro: L.ouro || 0, tempo: 0, abandonada: true });
    }
    this.modo = 'descanso';
    this.lugarAbs = lugarAbs;
    this.biomaId = biomaId;
    this.nivelSeed = lugarAbs * 10 + nivel;
    this.equipPreview = equip ?? { ...EQUIP_VAZIO };
    this.cav = { flash: 0, lunge: 0, swing: null, caido: false, dir: 1 };
  }

  // Resolve a luta pendente na marra (não depende do rAF estar vivo).
  forcarFim(motivo = 'watchdog'): boolean {
    const L = this.luta;
    if (!L?.resolve) return false;
    this.luta = null;
    this.modo = 'descanso';
    const tudoMorto = (L.vivos || []).length > 0 && L.fila >= L.inimigos.length && L.vivos.every((v) => v.morto);
    L.resolve({
      venceu: tudoMorto,
      abates: L.abates || 0,
      ouro: L.ouro || 0,
      tempo: 0,
      [motivo]: true,
    });
    return true;
  }

  lutarHorda(cfg: ArenaFightConfig): Promise<ArenaResult> {
    return new Promise((resolve) => {
      // Nunca deixa uma luta anterior pendurada (promise sem resolve = await eterno).
      if (this.luta?.resolve) {
        const anterior = this.luta;
        this.luta = null;
        anterior.resolve({
          venceu: false,
          abates: anterior.abates || 0,
          ouro: anterior.ouro || 0,
          tempo: 0,
          abandonada: true,
        });
      }
      this.erros = 0;
      this.modo = 'luta';
      this.lugarAbs = cfg.lugarAbs;
      this.biomaId = cfg.biomaId;
      this.nivelSeed = cfg.lugarAbs * 10 + cfg.nivel;
      this.luta = {
        ...cfg,
        fila: 0,
        spawnT: 0,
        lado: 1,
        vivos: [],
        player: { hp: cfg.playerHp, max: cfg.playerHp, cd: REGRAS.cdInicialJogador },
        hpSync: 0,
        abates: 0,
        ouro: 0,
        fim: null,
        fimT: 0,
        inicio: performance.now(),
        maxDur: Math.max(150, cfg.tempoMax || 480),
        atkK: null,
        resolve,
      };
      this.cav = { flash: 0, lunge: 0, swing: null, caido: false, dir: 1 };
      this.fx = [];
      this.faiscas = [];
      this.danos = [];
      this.flashDano = 0;
      const chefe = cfg.inimigos[0];
      const nome =
        cfg.nivel >= 10
          ? `BOSS — ${chefe?.nome ?? '???'}`
          : `${cfg.lugarNome} — Nível ${cfg.nivel}`;
      this.splash = {
        txt: nome,
        sub: cfg.nivel >= 10 ? 'Derrote o chefão!' : `${cfg.inimigos.length} inimigos se aproximam!`,
        idade: 0,
      };
    });
  }

  private alvoProximo(L: LutaAtiva): VivoArena | null {
    let best: VivoArena | null = null;
    let bd = Infinity;
    for (const v of L.vivos) {
      if (v.hp <= 0) continue;
      const d = Math.abs(v.x - PX);
      if (d <= REGRAS.alcancePlayer && d < bd) {
        bd = d;
        best = v;
      }
    }
    return best;
  }

  private emitirFaiscas(x: number, y: number, n: number, cores: string[], forca = 90): void {
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const vel = forca * (0.35 + Math.random() * 0.65);
      this.faiscas.push({
        x,
        y,
        vx: Math.cos(ang) * vel,
        vy: Math.sin(ang) * vel - 30,
        idade: 0,
        vida: 0.28 + Math.random() * 0.42,
        s: 1 + Math.random() * 2,
        cor: cores[Math.floor(Math.random() * cores.length)],
      });
    }
  }

  private matar(v: VivoArena, L: LutaAtiva): void {
    v.hp = 0;
    v.morto = true;
    v.dieT = 0.45;
    L.abates++;
    L.ouro += v.def.gold;
    this.danos.push({ x: v.x, y: 150, txt: `+${v.def.gold}`, c: '#e8b34a', idade: 0 });
    const T = TIPOS[v.def.kind % TIPOS.length];
    this.emitirFaiscas(v.x, 158, v.def.boss ? 26 : 12, [T.pele, '#fff3bf', '#e8b34a'], v.def.boss ? 150 : 95);
    this.fx.push({ tipo: 'morte', x: v.x, y: 160, idade: 0, cor: T.pele });
    L.onSfx?.(v.def.boss ? 'abateBoss' : v.def.elite ? 'abateElite' : 'abate');
    L.onAbate?.(v.def);
    L.onProgress?.(L.abates, L.inimigos.length);
  }

  private tick(agora: number): void {
    try {
      this.passo(agora);
      this.erros = 0; // só aborta por erros consecutivos, não por erros acumulados
    } catch (e) {
      this.erros = (this.erros || 0) + 1;
      if (console?.error) console.error('[arena] erro no tick (recuperado):', e);
      if (this.erros > 25) {
        const L = this.luta;
        this.erros = 0;
        if (L?.resolve) {
          this.luta = null;
          this.modo = 'descanso';
          L.resolve({ venceu: false, abates: L.abates || 0, ouro: L.ouro || 0, tempo: 0, erro: true });
        }
      }
    }
    requestAnimationFrame(this.tickBound);
  }

  private passo(agora: number): void {
    const dt = Math.min(0.05, (agora - this.ultimo) / 1000);
    this.ultimo = agora;
    this.t += dt;
    const ctx = this.ctx;
    const L = this.modo === 'luta' ? this.luta : null;
    const B = biomaPorLugar(this.lugarAbs, this.biomaId);

    // --- lógica da luta (regras = simulação em core/horde.ts) ---
    if (L && !L.fim) {
      L.spawnT -= dt;
      const emCampo = L.vivos.filter((v) => !v.morto).length;
      if (L.fila < L.inimigos.length && emCampo < L.cap && L.spawnT <= 0) {
        L.lado *= -1;
        const def = L.inimigos[L.fila];
        L.vivos.push({
          def,
          hp: def.hp,
          x: PX + L.lado * REGRAS.distSpawn,
          lado: L.lado,
          vel: REGRAS.velBase + (L.fila % 3) * 5,
          yOff: [-16, 2, 14][L.fila % 3],
          cd: REGRAS.cdInicialInimigo,
          swing: null,
          lunge: 0,
          flash: 0,
          morto: false,
          dieT: 0,
          esc: def.boss ? 2.1 : def.elite ? 1.3 : 1,
          atkA: null,
        });
        this.fx.push({ tipo: 'puff', x: PX + L.lado * REGRAS.distSpawn, y: CHAO_Y + 10, idade: 0 });
        L.fila++;
        L.spawnT = REGRAS.spawnCd;
      }
      const P = L.player;
      if (L.regen > 0) {
        P.hp = Math.min(P.max, P.hp + L.regen * dt);
        L.hpSync -= dt;
        if (L.hpSync <= 0) {
          L.hpSync = 0.5;
          L.onPlayerHp?.(Math.max(0, Math.round(P.hp)), P.max);
        }
      }
      P.cd -= dt;
      if (P.cd <= 0) {
        const alvo = this.alvoProximo(L);
        if (alvo) {
          alvo.hp -= L.playerAtk;
          alvo.flash = 1;
          const dir = alvo.x >= PX ? 1 : -1;
          this.cav.dir = dir;
          L.atkK = 0;
          this.fx.push({
            tipo: 'slash',
            x: alvo.x - dir * 8,
            y: CHAO_Y - 30,
            idade: 0,
            dir,
          });
          this.emitirFaiscas(alvo.x, CHAO_Y - 36, alvo.def.boss ? 14 : 8, ['#ffffff', '#ffd43b', '#fff3bf']);
          this.danos.push({ x: alvo.x, y: 132, txt: `-${L.playerAtk}`, c: '#ffd43b', idade: 0 });
          this.shake = Math.max(this.shake, alvo.def.boss ? 5 : 3);
          L.onSfx?.('golpe');
          P.cd = L.intervalo || REGRAS.intervaloBase;
          if (alvo.hp <= 0) this.matar(alvo, L);
        }
      }
      if (L.atkK != null) {
        L.atkK += dt;
        if (L.atkK > 0.55) L.atkK = null;
      }
      for (const v of L.vivos) {
        if (v.morto) {
          v.dieT -= dt;
          continue;
        }
        v.flash = Math.max(0, v.flash - dt * 3);
        const d = Math.abs(v.x - PX);
        if (d <= REGRAS.alcanceInimigo) {
          v.cd -= dt;
          if (v.cd <= 0) {
            const dano = Math.max(
              1,
              Math.round(
                v.def.atk *
                  (1 - Math.min(SKILL_MULT.reducaoDanoMax, Math.max(0, L.reducaoDano))),
              ),
            );
            P.hp -= dano;
            v.cd = REGRAS.intervaloInimigo;
            v.atkA = 0;
            this.cav.flash = 1;
            this.flashDano = 1;
            this.emitirFaiscas(PX - Math.sign(v.x - PX) * 12, CHAO_Y - 42, 7, ['#ff8787', '#ff6b6b', '#ffffff'], 75);
            this.danos.push({ x: PX - 14, y: CHAO_Y - 58, txt: `-${dano}`, c: '#ff8787', idade: 0 });
            L.onSfx?.('dano');
            this.shake = Math.max(this.shake, 4);
            L.onPlayerHp?.(Math.max(0, Math.round(P.hp)), P.max);
          }
        } else {
          v.x -= Math.sign(v.x - PX) * v.vel * dt;
          if (Math.abs(v.x - PX) < REGRAS.alcanceInimigo)
            v.x = PX + Math.sign(v.x - PX) * REGRAS.alcanceInimigo;
          if (Math.random() < dt * 2.6) {
            this.fx.push({
              tipo: 'puff',
              x: v.x + (Math.random() - 0.5) * 8,
              y: CHAO_Y + 20 + (v.yOff || 0),
              idade: 0.22,
            });
          }
        }
        if (v.atkA != null) {
          v.atkA += dt;
          if (v.atkA > 0.55) v.atkA = null;
        }
      }
      // fim?
      if (P.hp <= 0 && !L.fim) {
        L.fim = 'derrota';
        L.fimT = agora;
        this.cav.caido = true;
        this.splash = { txt: 'DERROTA', sub: 'O cavaleiro caiu... tente de novo!', idade: 0 };
      } else if (L.fila >= L.inimigos.length && L.vivos.every((v) => v.morto) && !L.fim) {
        L.fim = 'vitoria';
        L.fimT = agora;
        this.splash = { txt: 'VITÓRIA!', sub: 'Nível limpo!', idade: 0 };
      }
      // watchdog interno
      if (!L.fim && (agora - L.inicio) / 1000 > L.maxDur) {
        const tudoMorto =
          L.vivos.length > 0 && L.fila >= L.inimigos.length && L.vivos.every((v) => v.morto);
        L.fim = tudoMorto ? 'vitoria' : 'derrota';
        L.fimT = agora;
        if (L.fim === 'derrota') this.cav.caido = true;
        this.splash = {
          txt: L.fim === 'vitoria' ? 'VITÓRIA!' : 'DERROTA',
          sub: 'Tempo esgotado.',
          idade: 0,
        };
      }
    }
    // entrega do resultado (FORA do bloco de combate)
    if (L?.fim && agora - L.fimT > 1400) {
      const done = L;
      this.luta = null;
      this.modo = 'descanso';
      done.resolve({
        venceu: done.fim === 'vitoria',
        abates: done.abates,
        ouro: done.ouro,
        tempo: (agora - done.inicio) / 1000,
      });
    }

    // pose do cavaleiro
    const pk = L?.atkK != null ? (L.atkK as number) / 0.55 : null;
    if (pk == null) {
      this.cav.lunge = 0;
      this.cav.swing = null;
    } else if (pk < 0.4) {
      this.cav.lunge = (pk / 0.4) * 14;
      this.cav.swing = pk * 0.8;
    } else {
      const k = (pk - 0.4) / 0.6;
      this.cav.lunge = Math.max(0, 14 - k * 14);
      this.cav.swing = Math.max(0, 0.9 - k);
    }
    this.cav.flash = Math.max(0, this.cav.flash - dt * 3);

    // partículas / efeitos
    const maxParts = 26 + (B.volta > 1 ? 12 : 0);
    if (this.parts.length < maxParts && Math.random() < 0.5) this.parts.push(novaParticula(B));
    for (const p of this.parts) {
      p.x +=
        (p.vx + (p.tipo === 'folha' || p.tipo === 'neve' ? Math.sin(this.t * 2 + p.y * 0.05) * 10 : 0)) *
        dt;
      p.y += p.vy * dt;
      p.vida -= dt;
    }
    this.parts = this.parts.filter((p) => p.vida > 0 && p.y < H + 6 && p.y > -12 && p.x > -12 && p.x < W + 12);
    for (const e of this.fx) e.idade += dt;
    this.fx = this.fx.filter((e) => e.idade < 0.45);
    for (const f of this.faiscas) {
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.vy += 210 * dt;
      f.idade += dt;
    }
    this.faiscas = this.faiscas.filter((f) => f.idade < f.vida);
    this.flashDano = Math.max(0, this.flashDano - dt * 3.4);
    for (const d of this.danos) d.idade += dt;
    this.danos = this.danos.filter((d) => d.idade < 0.9);
    if (this.splash) {
      this.splash.idade += dt;
      if (this.splash.idade > 2.4) this.splash = null;
    }
    this.shake = Math.max(0, this.shake - dt * 22);

    // ---------- desenho (só rects + texto) ----------
    ctx.save();
    if (this.shake > 0)
      ctx.translate(Math.round((Math.random() - 0.5) * this.shake), Math.round((Math.random() - 0.5) * this.shake));
    desenharCenario(ctx, B, B.volta, this.nivelSeed, this.t);

    for (const p of this.parts) {
      ctx.globalAlpha = Math.min(0.65, p.vida);
      const ps = Math.max(1, p.s * 0.75);
      ctx.fillStyle = p.c;
      if (p.tipo === 'vaga') {
        const tw = 1 + (Math.sin(this.t * 5 + p.x) > 0 ? 0.6 : 0);
        ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.max(1, Math.round(ps * tw)), Math.max(1, Math.round(ps * tw)));
      } else {
        ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.max(1, Math.round(ps)), Math.max(1, Math.round(ps)));
      }
      ctx.globalAlpha = 1;
    }

    const s = 3.6, peY = CHAO_Y + 26;
    if (L) {
      for (const v of [...L.vivos].sort((a, b) => (a.yOff || 0) - (b.yOff || 0))) {
        if (v.morto && v.dieT <= 0) continue;
        const ey = peY + (v.yOff || 0);
        const dir = (v.x >= PX ? -1 : 1) as 1 | -1;
        const atk = v.atkA != null ? (v.atkA as number) / 0.55 : null;
        let lunge = 0;
        let swing: number | null = null;
        if (atk != null) {
          if (atk < 0.4) {
            lunge = (atk / 0.4) * 12;
            swing = atk * 0.8;
          } else {
            const k = (atk - 0.4) / 0.6;
            lunge = Math.max(0, 12 - k * 12);
            swing = Math.max(0, 0.9 - k);
          }
        }
        ctx.save();
        if (v.morto) ctx.globalAlpha = Math.max(0, v.dieT / 0.45);
        desenharMonstro(ctx, v.def.kind, {
          x: v.x,
          peY: ey,
          s,
          t: this.t + v.x,
          lunge,
          swing,
          flash: v.flash,
          caido: v.morto,
          dir,
          esc: v.esc,
        });
        ctx.restore();
        // mini barra de vida arredondada (sem quinas e sem pino)
        if (!v.morto) {
          const bw = v.def.boss ? 64 : 28;
          const bh = 5;
          const uE = s * 0.85 * (v.esc || 1);
          const T2 = TIPOS[v.def.kind % TIPOS.length];
          const topoCabeca = T2.extra === 'lobo' ? 11 * uE : (T2.h * uE * 0.5 + 5 * uE);
          const topo = Math.round(ey - topoCabeca - 8);
          const pct = Math.max(0, Math.min(1, v.hp / v.def.hp));
          const corBarra = pct > 0.5 ? '#51cf66' : pct > 0.25 ? '#ffd43b' : '#ff6b6b';
          const bx0 = Math.round(v.x - bw / 2);
          const pill = (x: number, y: number, w: number, h: number, c: string): void => {
            if (w < 3 || h < 3) return;
            ctx.fillStyle = c;
            ctx.fillRect(x + 1, y, w - 2, 1);
            ctx.fillRect(x, y + 1, w, h - 2);
            ctx.fillRect(x + 1, y + h - 1, w - 2, 1);
          };
          pill(bx0 - 2, topo - 2, bw + 4, bh + 4, '#0d0a14');
          pill(bx0, topo - 1, bw, bh + 2, '#2a2338');
          if (v.def.elite) {
            const cx = Math.round(v.x);
            R(ctx, cx - 5, topo - 13, 10, 2, '#e8b34a');
            R(ctx, cx - 5, topo - 16, 2, 3, '#e8b34a');
            R(ctx, cx - 1, topo - 18, 2, 5, '#fff3bf');
            R(ctx, cx + 3, topo - 16, 2, 3, '#e8b34a');
          }
          if (pct > 0.01) {
            const wf = Math.max(3, Math.round((bw - 2) * pct));
            pill(bx0 + 1, topo, wf, bh, corBarra);
            if (wf > 5) {
              ctx.globalAlpha = 0.4;
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(bx0 + 2, topo + 1, wf - 3, 1);
              ctx.globalAlpha = 1;
            }
            ctx.fillStyle = 'rgba(13,10,20,0.45)';
            for (let sx = bx0 + 5; sx < bx0 + wf; sx += 6) {
              ctx.fillRect(sx, topo + 1, 1, bh - 2);
            }
            if (wf > 4) {
              ctx.globalAlpha = 0.55;
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(bx0 + wf - 2, topo + 2, 1, 2);
              ctx.globalAlpha = 1;
            }
          }
        }
      }
    }
    const eq: EquipVisual =
      (L?.equip as EquipVisual | undefined) ?? this.equipPreview ?? { ...EQUIP_VAZIO };
    desenharCavaleiro(ctx, {
      x: PX,
      peY,
      s,
      t: this.t,
      lunge: this.cav.lunge,
      swing: this.cav.swing,
      flash: this.cav.flash,
      caido: this.cav.caido,
      dir: this.cav.dir,
      equip: eq,
    });

    // primeiro plano (tufos e pedras nas quinas) cria profundidade
    desenharPrimeiroPlano(ctx, B, this.t);

    // efeitos em pixels: rastro de corte, poeira e estilhaços
    for (const e of this.fx) {
      const k = Math.min(1, e.idade / 0.45);
      if (e.tipo === 'slash') {
        const dir = e.dir ?? 1;
        const len = Math.round(12 + k * 26);
        for (let i = 0; i < len; i += 2) {
          const t2 = i / Math.max(1, len);
          const px = e.x - dir * len * 0.5 + i * dir;
          const py = e.y + (t2 - 0.5) * (6 + k * 10);
          ctx.globalAlpha = (1 - k) * (1 - t2 * 0.7);
          R(ctx, px, py, 3, 2, t2 < 0.35 ? '#ffffff' : '#ffd43b');
        }
        ctx.globalAlpha = 1 - k;
        elipsePontos(ctx, Math.round(e.x), Math.round(e.y), Math.round(8 + k * 20), Math.round(6 + k * 13), '#fff', 12, 2);
        elipsePontos(ctx, Math.round(e.x), Math.round(e.y), Math.round(4 + k * 11), Math.round(3 + k * 8), '#ffd43b', 14, 2);
        // núcleo do corte + faíscas radiais
        const nk = Math.round((1 - k) * 5);
        R(ctx, Math.round(e.x) - nk, Math.round(e.y) - 1, nk * 2, 2, '#ffffff');
        R(ctx, Math.round(e.x) - 1, Math.round(e.y) - nk, 2, nk * 2, '#ffffff');
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2 + 0.5;
          const rr = 7 + k * 24;
          R(ctx, Math.round(e.x + Math.cos(a) * rr), Math.round(e.y + Math.sin(a) * rr), 2, 2, '#fff3bf');
        }
        ctx.globalAlpha = 1;
      } else if (e.tipo === 'puff') {
        const px = Math.round(e.x);
        const py = Math.round(e.y - k * 12);
        elipsePixel(ctx, px, py, Math.round(4 + k * 9), Math.round(2 + k * 5), '#b9b0c6', 0.25 * (1 - k));
        elipsePontos(ctx, px, py, Math.round(5 + k * 11), Math.round(2 + k * 6), '#8d86a8', 24, 1);
        for (let i = 0; i < 3; i++) {
          ctx.globalAlpha = 0.3 * (1 - k);
          R(ctx, e.x - 5 + i * 5 + k * 6, e.y - 3 - k * 10 - i * 2, 2, 2, '#8d86a8');
        }
        ctx.globalAlpha = 1;
      } else if (e.tipo === 'morte') {
        ctx.globalAlpha = (1 - k) * 0.7;
        elipsePontos(ctx, e.x, e.y + 8, Math.round(10 + k * 26), Math.round(4 + k * 9), e.cor ?? '#e9e4da', 14, 2);
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4 + 0.3;
          const rr = 6 + k * 30;
          R(
            ctx,
            Math.round(e.x + Math.cos(a) * rr),
            Math.round(e.y + Math.sin(a) * rr * 0.45),
            i % 2 === 0 ? 3 : 2,
            i % 2 === 0 ? 3 : 2,
            i % 2 === 0 ? '#e9e4da' : (e.cor ?? '#ffd43b'),
          );
        }
        ctx.globalAlpha = 1;
      }
    }

    // faíscas dos impactos (gravidade + fade)
    for (const f of this.faiscas) {
      const k = 1 - f.idade / f.vida;
      const sz = Math.max(1, Math.round(f.s * k));
      ctx.globalAlpha = Math.min(1, k * 1.7);
      R(ctx, f.x, f.y, sz, sz, f.cor);
    }
    ctx.globalAlpha = 1;

    // flash vermelho nas bordas ao levar dano
    if (this.flashDano > 0) {
      ctx.globalAlpha = this.flashDano * 0.15;
      ctx.fillStyle = '#ff4d5e';
      ctx.fillRect(0, 0, W, 16);
      ctx.fillRect(0, H - 16, W, 16);
      ctx.fillRect(0, 16, 10, H - 32);
      ctx.fillRect(W - 10, 16, 10, H - 32);
      ctx.globalAlpha = 1;
    }

    // números flutuantes em fonte pixel (contorno p/ contraste)
    ctx.textAlign = 'center';
    ctx.font = '9px "Press Start 2P", monospace';
    for (const d of this.danos) {
      const k = d.idade / 0.9;
      const dx = Math.round(d.x), dy = Math.round(d.y - k * 34);
      ctx.globalAlpha = 1 - k * k;
      ctx.fillStyle = '#241f26';
      ctx.fillText(d.txt, dx - 1, dy);
      ctx.fillText(d.txt, dx + 1, dy);
      ctx.fillText(d.txt, dx, dy - 1);
      ctx.fillText(d.txt, dx, dy + 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(d.txt, dx - 1, dy - 1);
      ctx.fillStyle = d.c;
      ctx.fillText(d.txt, dx, dy);
      ctx.globalAlpha = 1;
    }

    // banner do boss em moldura pixel
    const bossVivo = L?.vivos.find((v) => !v.morto && v.def.boss);
    if (bossVivo) {
      const bw = Math.min(304, W - 80);
      const bx = Math.round(W / 2 - bw / 2);
      const by = 8;
      const bh = 42;
      ctx.fillStyle = 'rgba(12,8,18,0.82)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = '#0d0a14';
      ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
      ctx.fillStyle = 'rgba(232,179,74,0.75)';
      ctx.fillRect(bx, by, bw, 1);
      ctx.fillRect(bx, by + bh - 1, bw, 1);
      ctx.fillRect(bx, by, 1, bh);
      ctx.fillRect(bx + bw - 1, by, 1, bh);
      // rebites de canto
      for (const [cx, cy] of [
        [bx + 5, by + 5],
        [bx + bw - 8, by + 5],
        [bx + 5, by + bh - 8],
        [bx + bw - 8, by + bh - 8],
      ] as const) {
        R(ctx, cx, cy, 3, 3, '#e8b34a');
      }
      // caveirinha pixel à esquerda
      const sx = bx + 9, sy = by + 12;
      R(ctx, sx, sy, 8, 7, '#e9e4da');
      R(ctx, sx, sy + 7, 8, 2, '#e9e4da');
      R(ctx, sx + 1, sy + 2, 2, 2, '#1a1015');
      R(ctx, sx + 5, sy + 2, 2, 2, '#1a1015');
      R(ctx, sx + 3, sy + 5, 2, 1, '#1a1015');
      ctx.textBaseline = 'middle';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#2a0505';
      ctx.fillText(bossVivo.def.nome, W / 2 + 1, by + 16 + 1);
      ctx.fillStyle = '#ffc9c9';
      ctx.fillText(bossVivo.def.nome, W / 2, by + 16);
      // barra de vida arredondada e segmentada
      const barX = bx + 12;
      const barY = by + 27;
      const barW = bw - 24;
      const barH = 8;
      const barra = (x: number, y: number, w: number, h: number, c: string): void => {
        if (w < 4 || h < 4) return;
        ctx.fillStyle = c;
        ctx.fillRect(x + 2, y, w - 4, 2);
        ctx.fillRect(x, y + 2, w, h - 4);
        ctx.fillRect(x + 2, y + h - 2, w - 4, 2);
      };
      barra(barX - 2, barY - 2, barW + 4, barH + 4, '#250b10');
      barra(barX, barY, barW, barH, '#4a1218');
      const wBoss = Math.round(barW * Math.max(0, Math.min(1, bossVivo.hp / bossVivo.def.hp)));
      if (wBoss > 3) {
        barra(barX, barY, wBoss, barH, '#e03131');
        ctx.fillStyle = '#ff8787';
        ctx.fillRect(barX + 2, barY + 2, Math.max(0, wBoss - 4), 2);
        ctx.fillStyle = 'rgba(12,8,18,0.5)';
        for (let sx2 = barX + 7; sx2 < barX + wBoss; sx2 += 8) ctx.fillRect(sx2, barY + 2, 1, barH - 4);
        ctx.fillStyle = '#ffd43b';
        ctx.fillRect(barX + wBoss - 3, barY + 2, 1, barH - 4);
      }
      ctx.textBaseline = 'alphabetic';
    }

    // splash de início/fim em painel pixel
    if (this.splash) {
      const k = this.splash.idade;
      ctx.globalAlpha = k < 0.3 ? k / 0.3 : k > 2 ? Math.max(0, 1 - (k - 2) / 0.4) : 1;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '16px "Press Start 2P", monospace';
      const titulo = this.splash.txt;
      const tw = ctx.measureText(titulo).width;
      const pw = Math.min(W - 48, Math.max(248, Math.ceil(tw) + 70));
      const ph = 58;
      const px = Math.round(W / 2 - pw / 2);
      const py = 64;
      const derrota = titulo.toUpperCase().includes('DERROTA');
      const corTitulo = derrota ? '#ff8787' : '#ffd43b';
      ctx.fillStyle = 'rgba(10,7,16,0.82)';
      ctx.fillRect(px, py, pw, ph);
      ctx.fillStyle = 'rgba(232,179,74,0.75)';
      ctx.fillRect(px, py, pw, 2);
      ctx.fillRect(px, py + ph - 2, pw, 2);
      ctx.fillRect(px, py, 2, ph);
      ctx.fillRect(px + pw - 2, py, 2, ph);
      for (const [cx, cy] of [
        [px + 4, py + 4],
        [px + pw - 8, py + 4],
        [px + 4, py + ph - 8],
        [px + pw - 8, py + ph - 8],
      ] as const) {
        R(ctx, cx, cy, 4, 4, '#e8b34a');
      }
      const linhaW = Math.max(0, Math.round((pw - tw) / 2) - 34);
      if (linhaW > 8) {
        R(ctx, px + 18, py + 27, linhaW, 2, '#8a6414');
        R(ctx, px + 18 + linhaW - 4, py + 25, 4, 6, '#e8b34a');
        R(ctx, px + pw - 18 - linhaW, py + 27, linhaW, 2, '#8a6414');
        R(ctx, px + pw - 18 - linhaW, py + 25, 4, 6, '#e8b34a');
      }
      ctx.fillStyle = '#1a0e04';
      ctx.fillText(titulo, W / 2 + 2, py + 28 + 2);
      ctx.fillStyle = corTitulo;
      ctx.fillText(titulo, W / 2, py + 28);
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.fillStyle = '#241f26';
      ctx.fillText(this.splash.sub, W / 2 + 1, py + 46 + 1);
      ctx.fillStyle = '#e9e4da';
      ctx.fillText(this.splash.sub, W / 2, py + 46);
      ctx.textBaseline = 'alphabetic';
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  /** canvas subjacente (p/ testes ou resize externo). */
  get canvas(): HTMLCanvasElement {
    return this.cv;
  }
}
