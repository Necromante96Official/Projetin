// Áudio procedural — nenhum asset externo, funciona offline.

export type SomEvento =
  | 'click'
  | 'compra'
  | 'erro'
  | 'equipar'
  | 'skill'
  | 'vender'
  | 'drop'
  | 'raro'
  | 'lendario'
  | 'golpe'
  | 'dano'
  | 'abate'
  | 'elite'
  | 'boss'
  | 'vitoria'
  | 'derrota'
  | 'nivel'
  | 'lugar'
  | 'prestigio'
  | 'conquista'
  | 'missao'
  | 'modalAbrir'
  | 'modalFechar';

const AMBIENTES: Record<string, readonly [number, number]> = {
  campo: [196, 247],
  floresta: [174, 220],
  caverna: [110, 147],
  pico: [262, 330],
  castelo: [147, 185],
  ruinas: [220, 277],
  pantano: [123, 156],
  abismo: [98, 131],
  cidadela: [294, 370],
};

const ESPERA: Partial<Record<SomEvento, number>> = {
  golpe: 55,
  dano: 75,
  abate: 55,
  drop: 90,
  raro: 120,
  lendario: 200,
};

type Ctx2D = AudioContext;

function novoContexto(): Ctx2D | null {
  if (typeof window === 'undefined') return null;
  const janela = window as Window & { webkitAudioContext?: typeof AudioContext };
  const Ctor = window.AudioContext ?? janela.webkitAudioContext;
  if (!Ctor) return null;
  try {
    return new Ctor();
  } catch {
    return null;
  }
}

export class Sfx {
  private ctx: Ctx2D | null = null;
  private master: GainNode | null = null;
  private bufferRuido: AudioBuffer | null = null;
  private ultimo = new Map<SomEvento, number>();
  private ambiencia: { osc: OscillatorNode; gain: GainNode }[] = [];
  private ambienteGain: GainNode | null = null;
  private biomaAtual: string | null = null;
  private mudo: boolean;

  constructor(mudoInicial = false) {
    this.mudo = mudoInicial;
  }

  get silenciado(): boolean {
    return this.mudo;
  }

  desbloquear(): void {
    const ctx = this.garantir();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      void ctx.resume().then(() => {
        if (!this.mudo && this.biomaAtual && this.ambiencia.length === 0) {
          this.ambiente(this.biomaAtual);
        }
      });
    }
    this.aplicarVolume();
  }

  alternarMudo(): boolean {
    this.mudo = !this.mudo;
    this.aplicarVolume();
    if (this.mudo) {
      this.limparAmbiencia();
    } else if (this.biomaAtual) {
      this.ambiente(this.biomaAtual);
    }
    return this.mudo;
  }

  ambiente(bioma: string): void {
    if (this.biomaAtual === bioma && this.ambiencia.length > 0) return;
    this.biomaAtual = bioma;
    this.limparAmbiencia();
    if (this.mudo) return;
    const ctx = this.garantir();
    if (!ctx || ctx.state !== 'running' || !this.master) return;

    const notas = AMBIENTES[bioma] ?? AMBIENTES.campo;
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 620;
    filtro.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 1.4);
    filtro.connect(gain).connect(this.master);
    this.ambienteGain = gain;

    notas.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const voz = ctx.createGain();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = i === 0 ? -4 : 4;
      voz.gain.value = i === 0 ? 0.55 : 0.28;
      osc.connect(voz).connect(filtro);
      osc.start();
      this.ambiencia.push({ osc, gain: voz });
    });
  }

  pararAmbiente(): void {
    this.biomaAtual = null;
    this.limparAmbiencia();
  }

  tocar(evento: SomEvento, forca = 1): void {
    if (this.mudo) return;
    const agora = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const espera = ESPERA[evento] ?? 0;
    if (agora - (this.ultimo.get(evento) ?? -1e9) < espera) return;
    this.ultimo.set(evento, agora);

    const ctx = this.garantir();
    if (!ctx || !this.master) return;
    if (ctx.state === 'suspended') void ctx.resume();

    const v = Math.max(0.1, Math.min(2, forca));
    switch (evento) {
      case 'click':
        this.tom(640, 0.045, 'square', 0.09 * v, 0, 520);
        break;
      case 'compra':
        this.tom(523, 0.07, 'triangle', 0.12 * v);
        this.tom(784, 0.1, 'triangle', 0.1 * v, 0.06);
        this.estalo(0.05, 0.05 * v, 3200, 0.03);
        break;
      case 'erro':
        this.tom(220, 0.12, 'sawtooth', 0.09 * v, 0, 150);
        this.tom(165, 0.16, 'sawtooth', 0.07 * v, 0.07, 120);
        break;
      case 'equipar':
        this.tom(500, 0.06, 'triangle', 0.1 * v, 0, 720);
        this.tom(760, 0.09, 'triangle', 0.08 * v, 0.06);
        break;
      case 'skill':
        this.tom(660, 0.08, 'triangle', 0.1 * v);
        this.tom(880, 0.09, 'triangle', 0.09 * v, 0.07);
        this.tom(1100, 0.14, 'sine', 0.08 * v, 0.14);
        break;
      case 'vender':
        this.tom(880, 0.06, 'triangle', 0.1 * v, 0, 520);
        this.estalo(0.05, 0.05 * v, 3400, 0.04);
        break;
      case 'drop':
        this.tom(880, 0.08, 'triangle', 0.11 * v);
        this.tom(1320, 0.12, 'sine', 0.09 * v, 0.07);
        break;
      case 'raro':
        this.tom(784, 0.08, 'triangle', 0.1 * v);
        this.tom(988, 0.08, 'triangle', 0.1 * v, 0.07);
        this.tom(1175, 0.16, 'sine', 0.09 * v, 0.14);
        break;
      case 'lendario':
        [1047, 1319, 1568, 2093].forEach((f, i) =>
          this.tom(f, 0.18, 'triangle', 0.08 * v, i * 0.08),
        );
        this.estalo(0.3, 0.045 * v, 4200, 0.04);
        break;
      case 'golpe':
        this.estalo(0.045, 0.13 * v, 1700, 0);
        this.tom(190, 0.05, 'square', 0.05 * v, 0, 120);
        break;
      case 'dano':
        this.tom(110, 0.1, 'sawtooth', 0.09 * v, 0, 65);
        this.estalo(0.06, 0.07 * v, 500, 0);
        break;
      case 'abate':
        this.tom(180, 0.14, 'triangle', 0.08 * v, 0, 55);
        this.estalo(0.1, 0.09 * v, 800, 0);
        break;
      case 'elite':
        this.tom(392, 0.12, 'square', 0.07 * v);
        this.tom(523, 0.12, 'square', 0.07 * v, 0.09);
        this.tom(659, 0.18, 'triangle', 0.08 * v, 0.18);
        this.estalo(0.16, 0.07 * v, 1400, 0);
        break;
      case 'boss':
        this.tom(65, 0.42, 'sawtooth', 0.14 * v, 0, 42);
        this.tom(98, 0.3, 'triangle', 0.08 * v, 0.05, 70);
        this.estalo(0.35, 0.1 * v, 300, 0);
        break;
      case 'vitoria':
        [523, 659, 784, 1047].forEach((f, i) =>
          this.tom(f, 0.16, 'triangle', 0.09 * v, i * 0.09),
        );
        break;
      case 'derrota':
        [392, 330, 262, 196].forEach((f, i) =>
          this.tom(f, 0.2, 'sawtooth', 0.07 * v, i * 0.12),
        );
        break;
      case 'nivel':
        [523, 659, 784, 1047].forEach((f, i) =>
          this.tom(f, 0.13, 'square', 0.07 * v, i * 0.07),
        );
        break;
      case 'lugar':
        [392, 523, 659, 784].forEach((f, i) =>
          this.tom(f, 0.16, 'triangle', 0.08 * v, i * 0.08),
        );
        break;
      case 'prestigio':
        [262, 330, 392, 523, 659, 784].forEach((f, i) =>
          this.tom(f, 0.24, 'sine', 0.08 * v, i * 0.1),
        );
        this.estalo(0.5, 0.05 * v, 2600, 0);
        break;
      case 'conquista':
        [659, 880, 1109, 1319].forEach((f, i) =>
          this.tom(f, 0.15, 'triangle', 0.09 * v, i * 0.075),
        );
        this.estalo(0.22, 0.04 * v, 3600, 0.16);
        break;
      case 'missao':
        [523, 698, 880, 1047].forEach((f, i) =>
          this.tom(f, 0.13, 'sine', 0.08 * v, i * 0.07),
        );
        this.estalo(0.16, 0.035 * v, 3000, 0.12);
        break;
      case 'modalAbrir':
        this.tom(440, 0.06, 'triangle', 0.08 * v, 0, 560);
        break;
      case 'modalFechar':
        this.tom(330, 0.06, 'triangle', 0.07 * v, 0, 260);
        break;
    }
  }

  private garantir(): Ctx2D | null {
    if (this.ctx) return this.ctx;
    const ctx = novoContexto();
    if (!ctx) return null;
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = this.mudo ? 0 : 0.32;
    master.connect(ctx.destination);
    this.master = master;
    return ctx;
  }

  private aplicarVolume(): void {
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(this.mudo ? 0 : 0.32, this.ctx.currentTime, 0.015);
  }

  private tom(
    freq: number,
    dur: number,
    tipo: OscillatorType,
    vol: number,
    atraso = 0,
    freqFinal?: number,
  ): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const t0 = ctx.currentTime + atraso;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (freqFinal !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqFinal), t0 + dur);
    }
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.04);
  }

  private estalo(dur: number, vol: number, corte: number, atraso = 0): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const t0 = ctx.currentTime + atraso;
    const src = ctx.createBufferSource();
    src.buffer = this.criarRuido(ctx);
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.frequency.value = corte;
    filtro.Q.value = 0.9;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filtro).connect(gain).connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  private criarRuido(ctx: Ctx2D): AudioBuffer {
    if (this.bufferRuido) return this.bufferRuido;
    const total = Math.max(1, Math.floor(ctx.sampleRate * 0.5));
    const buffer = ctx.createBuffer(1, total, ctx.sampleRate);
    const dados = buffer.getChannelData(0);
    for (let i = 0; i < total; i++) dados[i] = Math.random() * 2 - 1;
    this.bufferRuido = buffer;
    return buffer;
  }

  private limparAmbiencia(): void {
    const ctx = this.ctx;
    if (ctx && this.ambienteGain) {
      const gain = this.ambienteGain;
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.12);
      const nodes = this.ambiencia.slice();
      window.setTimeout(() => {
        nodes.forEach(({ osc }) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {
            // oscilador já finalizado
          }
        });
        try {
          gain.disconnect();
        } catch {
          // nó já desconectado
        }
      }, 450);
    } else {
      this.ambiencia.forEach(({ osc }) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // oscilador já finalizado
        }
      });
    }
    this.ambiencia = [];
    this.ambienteGain = null;
  }
}
