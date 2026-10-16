// engine/arena.ts — motor da horda (lógica + orquestração do desenho).
// Sprites em render/sprites, cenário em engine/scenario, primitivas em render/pixel.
// Nenhuma forma vetorial: só fillRect/fillText/strokeRect e transformações.

import { REGRAS } from '../core/data.js';
import type { BiomaId, Inimigo } from '../core/types.js';
import type { EquipVisual } from '../render/sprites/shared.js';
import { W, H, CHAO_Y, PX, R, quadradoVazado, elipsePontos, type Ctx2D } from '../render/pixel.js';
import { desenharCavaleiro, desenharMonstro, TIPOS } from '../render/sprites/index.js';
import { biomaPorLugar, desenharCenario, novaParticula, type Particula } from './scenario.js';

export interface ArenaFightConfig {
  playerAtk: number;
  playerHp: number;
  intervalo: number;
  regen: number;
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
  tipo: 'puff' | 'slash';
  x: number;
  y: number;
  idade: number;
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
  private danos: DanoFlutuante[] = [];
  private shake = 0;
  private splash: { txt: string; sub: string; idade: number } | null = null;
  private modo: 'descanso' | 'luta' = 'descanso';
  private lugarAbs = 0;
  private biomaId: BiomaId = 'campo';
  private nivelSeed = 1;
  private equipPreview: EquipVisual = { elmo: 0, camisa: 0, calcas: 0, botas: 0, arma: 0, escudo: 0 };
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

  descanso(lugarAbs: number, biomaId: BiomaId, equip?: EquipVisual): void {
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
    this.equipPreview = equip ?? { elmo: 0, camisa: 0, calcas: 0, botas: 0, arma: 0, escudo: 0 };
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
        player: { hp: cfg.playerHp, max: cfg.playerHp, cd: 0.4 },
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
      this.danos = [];
      const nome =
        cfg.nivel >= 10 ? `BOSS — ${cfg.inimigos[0].nome}` : `${cfg.lugarNome} — Nível ${cfg.nivel}`;
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

  private matar(v: VivoArena, L: LutaAtiva): void {
    v.hp = 0;
    v.morto = true;
    v.dieT = 0.45;
    L.abates++;
    L.ouro += v.def.gold;
    this.danos.push({ x: v.x, y: 150, txt: `+${v.def.gold}`, c: '#e8b34a', idade: 0 });
    L.onAbate?.(v.def);
    L.onProgress?.(L.abates, L.inimigos.length);
  }

  private tick(agora: number): void {
    try {
      this.passo(agora);
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
          x: PX + L.lado * 290,
          lado: L.lado,
          vel: REGRAS.velBase + (L.fila % 3) * 5,
          yOff: [-16, 2, 14][L.fila % 3],
          cd: 0.6,
          swing: null,
          lunge: 0,
          flash: 0,
          morto: false,
          dieT: 0,
          esc: def.boss ? 2.1 : 1,
          atkA: null,
        });
        this.fx.push({ tipo: 'puff', x: PX + L.lado * 250, y: CHAO_Y + 10, idade: 0 });
        L.fila++;
        L.spawnT = REGRAS.spawnCd;
      }
      const P = L.player;
      if (L.regen > 0) P.hp = Math.min(P.max, P.hp + L.regen * dt);
      P.cd -= dt;
      if (P.cd <= 0) {
        const alvo = this.alvoProximo(L);
        if (alvo) {
          alvo.hp -= L.playerAtk;
          alvo.flash = 1;
          this.cav.dir = alvo.x >= PX ? 1 : -1;
          L.atkK = 0;
          this.fx.push({ tipo: 'slash', x: (PX + alvo.x) / 2, y: CHAO_Y - 26, idade: 0 });
          this.danos.push({ x: alvo.x, y: 132, txt: `-${L.playerAtk}`, c: '#ffd43b', idade: 0 });
          this.shake = Math.max(this.shake, alvo.def.boss ? 5 : 3);
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
            P.hp -= v.def.atk;
            v.cd = REGRAS.intervaloInimigo;
            v.atkA = 0;
            this.cav.flash = 1;
            this.danos.push({ x: PX - 14, y: CHAO_Y - 58, txt: `-${v.def.atk}`, c: '#ff8787', idade: 0 });
            this.shake = Math.max(this.shake, 4);
            L.onPlayerHp?.(Math.max(0, Math.round(P.hp)), P.max);
          }
        } else {
          v.x -= Math.sign(v.x - PX) * v.vel * dt;
          if (Math.abs(v.x - PX) < REGRAS.alcanceInimigo)
            v.x = PX + Math.sign(v.x - PX) * REGRAS.alcanceInimigo;
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
    const aura = (x: number, y: number, r: number): void => {
      quadradoVazado(ctx, Math.round(x - r), Math.round(y - r), r * 2, '#000', 0.1);
    };
    aura(PX, peY - 30, 30);
    if (L) {
      for (const v of [...L.vivos].sort((a, b) => (a.yOff || 0) - (b.yOff || 0))) {
        if (v.morto && v.dieT <= 0) continue;
        const ey = peY + (v.yOff || 0);
        aura(v.x, ey - 24, v.def.boss ? 46 : 24);
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
        // mini barra de vida ancorada na cabeça (compacta, com fundo e pino)
        if (!v.morto) {
          const bw = v.def.boss ? 56 : 22;
          const uE = s * 0.85 * (v.esc || 1);
          const T2 = TIPOS[v.def.kind % TIPOS.length];
          const topoCabeca = T2.extra === 'lobo' ? 11 * uE : (T2.h * uE * 0.5 + 5 * uE);
          const topo = Math.round(ey - topoCabeca - 7);
          const pct = Math.max(0, v.hp / v.def.hp);
          const corBarra = pct > 0.5 ? '#51cf66' : pct > 0.25 ? '#ffd43b' : '#ff6b6b';
          const bx0 = Math.round(v.x - bw / 2);
          ctx.fillStyle = '#1c2333';
          ctx.fillRect(bx0 - 1, topo - 1, bw + 2, 6);
          ctx.fillStyle = corBarra;
          ctx.fillRect(bx0, topo, Math.round(bw * pct), 2);
          ctx.fillStyle = '#39424f';
          ctx.fillRect(bx0, topo + 2, bw, 2);
          ctx.fillStyle = '#1c2333';
          ctx.fillRect(Math.round(v.x) - 1, topo + 4, 2, 6);
        }
      }
    }
    const eq: EquipVisual =
      (L?.equip as EquipVisual | undefined) ??
      this.equipPreview ?? { elmo: 0, camisa: 0, calcas: 0, botas: 0, arma: 0, escudo: 0 };
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

    // efeitos em pixels: slash = anéis pontilhados, puff = quadrados
    for (const e of this.fx) {
      const k = e.idade / 0.45;
      if (e.tipo === 'slash') {
        ctx.globalAlpha = 1 - k;
        elipsePontos(ctx, Math.round(e.x), Math.round(e.y), Math.round(8 + k * 18), Math.round(6 + k * 12), '#fff', 12, 2);
        elipsePontos(ctx, Math.round(e.x), Math.round(e.y), Math.round(4 + k * 10), Math.round(3 + k * 7), '#ffd43b', 14, 2);
        // núcleo do corte (cruz branca no centro)
        const nk = Math.round((1 - k) * 4);
        R(ctx, Math.round(e.x) - nk, Math.round(e.y) - 1, nk * 2, 2, '#ffffff');
        R(ctx, Math.round(e.x) - 1, Math.round(e.y) - nk, 2, nk * 2, '#ffffff');
        ctx.globalAlpha = 1;
      } else if (e.tipo === 'puff') {
        const lado = Math.round(8 + k * 22);
        quadradoVazado(ctx, Math.round(e.x - lado / 2), Math.round(e.y - k * 22 - lado / 2), lado, '#3a3348', 0.7 * (1 - k), 2);
      }
    }

    // números flutuantes (contorno duplo p/ contraste no céu claro)
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px monospace';
    for (const d of this.danos) {
      const k = d.idade / 0.9;
      const dx = Math.round(d.x), dy = Math.round(d.y - k * 34);
      ctx.globalAlpha = 1 - k * k;
      ctx.fillStyle = '#241f26';
      ctx.fillText(d.txt, dx - 2, dy);
      ctx.fillText(d.txt, dx + 2, dy);
      ctx.fillText(d.txt, dx, dy - 2);
      ctx.fillText(d.txt, dx, dy + 2);
      ctx.fillText(d.txt, dx - 1, dy - 1);
      ctx.fillText(d.txt, dx + 1, dy + 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(d.txt, dx - 1, dy - 1);
      ctx.fillStyle = d.c;
      ctx.fillText(d.txt, dx, dy);
      ctx.globalAlpha = 1;
    }

    // banner do boss
    const bossVivo = L?.vivos.find((v) => !v.morto && v.def.boss);
    if (bossVivo) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(60, 10, W - 120, 30);
      ctx.strokeStyle = '#e03131';
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 10, W - 120, 30);
      ctx.fillStyle = '#ffc9c9';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`☠ ${bossVivo.def.nome} ☠`, W / 2, 23);
      ctx.fillStyle = '#3a0d0d';
      ctx.fillRect(66, 28, W - 132, 7);
      ctx.fillStyle = '#e03131';
      ctx.fillRect(66, 28, Math.round((W - 132) * Math.max(0, bossVivo.hp / bossVivo.def.hp)), 7);
    }

    // splash
    if (this.splash) {
      const k = this.splash.idade;
      ctx.globalAlpha = k < 0.3 ? k / 0.3 : k > 2 ? Math.max(0, 1 - (k - 2) / 0.4) : 1;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(this.splash.txt, W / 2 + 2, 102);
      ctx.fillStyle = '#f6d789';
      ctx.fillText(this.splash.txt, W / 2, 100);
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#000';
      ctx.fillText(this.splash.sub, W / 2 + 1, 121);
      ctx.fillStyle = '#fff';
      ctx.fillText(this.splash.sub, W / 2, 120);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  /** canvas subjacente (p/ testes ou resize externo). */
  get canvas(): HTMLCanvasElement {
    return this.cv;
  }
}
