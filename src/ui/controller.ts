// ui/controller.ts — orquestra jogo: estado + arena + HUD + modais + timers.
// Único lugar com side-effects temporais (setInterval) e fluxo de batalha.
// Regras de combate continuam 100% em core/ (testáveis); desenho em engine/.

import {
  avancarNivel,
  calcularGanhoOffline,
  comprarEquip,
  comprarSkill,
  criarEstadoInicial,
  limiteSimultaneos,
  lugarDe,
  ouroPorMinuto,
  parametrosCombate,
  simularHorda,
  EQUIPS,
  MAX_PECAS,
  SKILLS,
  totalTiersEquip,
  type EquipSlot,
  type GameState,
  type SkillId,
} from '../core/index.js';
import { Arena, type ArenaResult } from '../engine/arena.js';
import { hidratarIcones } from '../render/icons.js';
import { el, fmt, formatTempo } from './dom.js';
import { Hud } from './hud.js';
import { LogStore } from './log.js';
import { ModalManager } from './modal.js';
import { apagarSave, carregar, salvar } from './storage.js';
import {
  ajudaHtml,
  cavaleiroHtml,
  cronicasHtml,
  equipamentosHtml,
  lugarHtml,
  skillsHtml,
} from './views.js';

const DESCANSO_MS = 3000;

export class GameController {
  private state: GameState;
  private arena: Arena;
  private modal = new ModalManager();
  private logs: LogStore;
  private hud = new Hud();
  private tempoRestante = DESCANSO_MS / 1000;
  private emBatalha = false;
  private hpAtual: number | null = null;
  private runSeq = 0;
  private rendaTimer: number | undefined;
  private autoTimer: number | undefined;
  private readonly aoSair = (): void => salvar(this.state);

  constructor(canvas: HTMLCanvasElement) {
    this.state = carregar();
    this.logs = new LogStore(this.modal);
    this.logs.onCronicasAberta = () => this.abrirCronicas();
    this.arena = new Arena(canvas);
  }

  // ---------- modais ----------

  abrirDetalhesCavaleiro(): void {
    const { titulo, html } = cavaleiroHtml(this.state);
    this.modal.abrir(titulo, html, 'cavaleiro');
  }

  abrirDetalhesLugar(): void {
    const { titulo, html } = lugarHtml(this.state);
    this.modal.abrir(titulo, html, 'lugar');
  }

  abrirEquipamentos(): void {
    const { titulo, html } = equipamentosHtml(this.state);
    this.modal.abrir(titulo, html, 'equip');
    this.modal.corpo.querySelectorAll('[data-eq]').forEach((btn) => {
      (btn as HTMLElement).onclick = () => {
        const slot = (btn as HTMLElement).dataset.eq as EquipSlot;
        if (comprarEquip(this.state, slot)) {
          this.logs.log(`🛒 Comprou: ${EQUIPS[slot].nome}.`, 'buy');
          this.persistirERender();
          this.abrirEquipamentos();
        }
      };
    });
  }

  abrirSkills(): void {
    const { titulo, html } = skillsHtml(this.state);
    this.modal.abrir(titulo, html, 'skills');
    this.modal.corpo.querySelectorAll('[data-sk]').forEach((btn) => {
      (btn as HTMLElement).onclick = () => {
        const id = (btn as HTMLElement).dataset.sk as SkillId;
        if (comprarSkill(this.state, id)) {
          this.logs.log(`🛒 Skill: ${SKILLS[id].nome} Nv.${this.state.skills[id]}.`, 'buy');
          this.persistirERender();
          this.abrirSkills();
        }
      };
    });
  }

  abrirCronicas(): void {
    const { titulo, html } = cronicasHtml();
    this.modal.abrir(titulo, html, 'cronicas');
    this.logs.marcarLidas();
  }

  abrirAjuda(): void {
    const { titulo, html } = ajudaHtml();
    this.modal.abrir(titulo, html, 'ajuda');
  }

  // ---------- render ----------

  private persistirERender(): void {
    salvar(this.state);
    this.render();
  }

  render(): void {
    this.hud.render(this.state, { onSlotClick: () => this.abrirEquipamentos() }, this.hpAtual);
    const chave = this.modal.chave;
    if (chave === 'cavaleiro') this.abrirDetalhesCavaleiro();
    else if (chave === 'lugar') this.abrirDetalhesLugar();
  }

  /** Mantém barra e número de HP coerentes durante a luta (dano + regeneração). */
  private atualizarVida(hp: number, max: number): void {
    const seguro = Math.max(0, Math.min(max, Math.round(hp)));
    this.hpAtual = seguro;
    const pct = max > 0 ? (seguro / max) * 100 : 0;
    (el('hp-aliado') as HTMLElement).style.width = `${pct}%`;
    el('hp-aliado-num').textContent =
      `${fmt(seguro)}/${fmt(max)} HP • ${totalTiersEquip(this.state)}/${MAX_PECAS} peças`;
  }

  private descansoAtual(): void {
    const l = lugarDe(this.state.lugar);
    this.arena.descanso(this.state.lugar, l.bioma, this.state.equip, this.state.nivel);
  }

  private ganharOuro(valor: number): void {
    if (!Number.isFinite(valor) || valor <= 0) return;
    this.state.ouro = Math.min(Number.MAX_SAFE_INTEGER, this.state.ouro + valor);
  }

  // ---------- batalha ----------

  private async iniciarRun(): Promise<void> {
    if (this.emBatalha) return;
    this.emBatalha = true;
    const runId = ++this.runSeq;
    const ativo = (): boolean => runId === this.runSeq;
    let vigia: number | undefined;
    try {
      const sim = simularHorda(this.state);
      const horda = sim.horda;
      const P = parametrosCombate(this.state);
      const l = lugarDe(this.state.lugar);
      const tempoMax = Math.max(180, sim.tempo * 2 + 60);

      this.atualizarVida(P.hp, P.hp);
      (el('horda-fill') as HTMLElement).style.width = '0%';
      el('horda-txt').textContent = horda.boss ? 'BOSS' : `0/${horda.total}`;
      el('timer').textContent = horda.boss ? '☠ boss...' : 'horda em andamento...';

      const res = await Promise.race([
        this.arena.lutarHorda({
          playerAtk: P.atk,
          playerHp: P.hp,
          intervalo: P.intervalo,
          regen: P.regen,
          equip: { ...this.state.equip },
          inimigos: horda.inimigos,
          lugarAbs: this.state.lugar,
          biomaId: horda.bioma,
          lugarNome: horda.lugar,
          nivel: this.state.nivel,
          cap: limiteSimultaneos(this.state.nivel),
          tempoMax,
          onAbate: (def) => {
            if (!ativo()) return;
            this.ganharOuro(def.gold);
            this.state.abates += 1;
            el('ouro').textContent = fmt(this.state.ouro);
          },
          onPlayerHp: (hp, max) => {
            if (!ativo()) return;
            this.atualizarVida(hp, max);
          },
          onProgress: (k, total) => {
            if (!ativo()) return;
            (el('horda-fill') as HTMLElement).style.width = `${Math.round((k / total) * 100)}%`;
            el('horda-txt').textContent = `${k}/${total}`;
          },
        }),
        new Promise<ArenaResult>((resolve) => {
          // Vigia fora do rAF: se a engine travar, força o fim e o jogo segue.
          vigia = window.setTimeout(
            () => {
              if (this.emBatalha && ativo()) {
                const forcou = this.arena.forcarFim('watchdog');
                if (!forcou) {
                  // nem a engine respondeu: destrava na marra
                  resolve({ venceu: false, abates: 0, ouro: 0, tempo: 0, watchdog: true });
                }
              }
            },
            (tempoMax + 45) * 1000,
          );
        }),
      ]);
      window.clearTimeout(vigia);
      vigia = undefined;

      // Reset/troca de estado durante a luta: não toca no estado novo.
      if (!ativo()) return;
      if (res.abandonada || res.erro) {
        // falha recuperada: só destrava, sem economia
        return;
      }
      if (res.watchdog) {
        this.logs.log('Sistema: a run demorou demais e foi encerrada para o jogo seguir.', 'info');
      }

      if (res.venceu) {
        this.ganharOuro(horda.bonus);
        this.state.vitorias += 1;
        this.logs.flash(`✅ Nível limpo! +${fmt(res.ouro + horda.bonus)} ouro`, true);
        if (horda.boss) {
          this.logs.log(
            `👑 BOSS derrotado: ${horda.inimigos[0]?.nome ?? '???'}! +${fmt(res.ouro + horda.bonus)} ouro.`,
            'win',
          );
        } else {
          this.logs.log(
            `✅ ${l.nome} Nv.${this.state.nivel} limpo! ${res.abates} abates, +${fmt(res.ouro + horda.bonus)} ouro.`,
            'win',
          );
        }
        const av = avancarNivel(this.state);
        if (av.subiuLugar) {
          const nl = lugarDe(this.state.lugar);
          this.logs.log(
            `🌍 Novo lugar: ${nl.nome}${av.volta > 1 ? ` — VOLTA ${av.volta}!` : '!'} O boss caiu!`,
            'info',
          );
        }
      } else {
        this.state.derrotas += 1;
        this.logs.flash(`❌ Derrota... manteve ${fmt(res.ouro)} ouro`, false);
        this.logs.log(
          `❌ ${this.state.cavaleiro.nome} caiu no ${l.nome} Nv.${this.state.nivel} (${res.abates}/${horda.total}). Equipe e volte!`,
          'loss',
        );
      }
    } catch (e) {
      console.error('[game] erro na run (recuperado):', e);
      if (ativo()) this.logs.log('Sistema: erro inesperado na batalha; seguindo.', 'info');
    } finally {
      // NUNCA trava o auto-avançar, mesmo com erro inesperado
      window.clearTimeout(vigia);
      if (ativo()) {
        this.emBatalha = false;
        this.hpAtual = null;
        this.tempoRestante = DESCANSO_MS / 1000;
        salvar(this.state);
        this.descansoAtual();
        this.render();
      }
    }
  }

  // ---------- boot ----------

  boot(): void {
    window.addEventListener('pagehide', this.aoSair);

    el('lutar-agora').onclick = () => {
      if (this.emBatalha) return;
      this.tempoRestante = 0; // pula o descanso
      void this.iniciarRun(); // funciona mesmo com o auto desligado
    };
    el('reset').onclick = () => {
      if (confirm('Apagar progresso e recomeçar o reino?')) {
        this.runSeq++; // invalida callbacks/watchdog da run em andamento
        apagarSave();
        this.state = criarEstadoInicial();
        this.emBatalha = false;
        this.hpAtual = null;
        this.tempoRestante = DESCANSO_MS / 1000;
        this.logs.limpar();
        this.logs.log('👑 Novo reino fundado! Boa sorte, regente.', 'info');
        salvar(this.state);
        this.descansoAtual();
        this.render();
      }
    };

    const acionavel = (id: string, fn: () => void): void => {
      const n = el(id);
      n.onclick = fn;
      n.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fn();
        }
      };
    };
    acionavel('card-cavaleiro', () => this.abrirDetalhesCavaleiro());
    acionavel('card-lugar', () => this.abrirDetalhesLugar());
    el('btn-equip').onclick = () => this.abrirEquipamentos();
    el('btn-skills').onclick = () => this.abrirSkills();
    el('btn-cronicas').onclick = () => this.abrirCronicas();
    el('btn-ajuda').onclick = () => this.abrirAjuda();

    // descanso entre hordas (hora de investir) — a luta pausa o relógio
    this.autoTimer = window.setInterval(() => {
      if (this.emBatalha) return;
      const auto = el('auto') as HTMLInputElement;
      if (auto.checked) {
        this.tempoRestante -= 0.25;
        if (this.tempoRestante <= 0) {
          void this.iniciarRun();
        } else {
          const total = DESCANSO_MS / 1000;
          (el('timer-fill') as HTMLElement).style.width = `${Math.min(100, ((total - this.tempoRestante) / total) * 100)}%`;
          el('timer').textContent = `próx. horda em ${this.tempoRestante.toFixed(0)}s`;
        }
      } else {
        el('timer').textContent = 'auto-batalha pausada';
      }
    }, 250);

    // renda passiva pequena, escala com o estágio atual
    this.rendaTimer = window.setInterval(() => {
      const renda = Math.max(1, Math.round(ouroPorMinuto(this.state) / 12));
      this.ganharOuro(renda);
      salvar(this.state);
      this.render();
    }, 5000);

    // ganho offline
    const ganho = calcularGanhoOffline(this.state);
    if (ganho.ouro > 0) {
      this.ganharOuro(ganho.ouro);
      this.logs.log(
        `🌙 Enquanto você esteve fora (${formatTempo(ganho.segundosFora)}), seus coletores ganharam ${fmt(ganho.ouro)} de ouro.`,
        'info',
      );
      salvar(this.state);
    }

    hidratarIcones();
    this.logs.log(
      `👋 Bem-vindo! ${this.state.cavaleiro.nome} começa de farrapos — equipe e vença as hordas.`,
      'info',
    );
    this.logs.marcarLidas();
    this.descansoAtual();
    this.render();
  }

  destroy(): void {
    window.removeEventListener('pagehide', this.aoSair);
    window.clearInterval(this.autoTimer);
    window.clearInterval(this.rendaTimer);
  }
}
