// ui/controller.ts — orquestra jogo: estado + arena + HUD + modais + timers.
// Único lugar com side-effects temporais (setInterval) e fluxo de batalha.
// Regras de combate continuam 100% em core/ (testáveis); desenho em engine/.

import {
  avancarNivel,
  calcularGanhoOffline,
  comprarEquip,
  comprarMelhoriasAcessiveis,
  comprarSkill,
  criarEstadoInicial,
  definirAutoReciclar,
  desbloquearConquistas,
  garantirMissoes,
  indiceRaridade,
  limiteSimultaneos,
  lugarDe,
  melhorarInventario,
  ouroPorMinuto,
  parametrosCombate,
  processarDrops,
  processarMissoes,
  registrarMissao,
  renascer,
  rolarDrops,
  simularHorda,
  venderItem,
  venderItensPorRaridade,
  venderTodosItens,
  EQUIPS,
  MAX_PECAS,
  MISSOES_BONUS,
  RARIDADE_INFO,
  SKILLS,
  totalTiersEquip,
  type EquipSlot,
  type GameState,
  type ItemInventario,
  type OrdemInventario,
  type Raridade,
  type SkillId,
} from '../core/index.js';
import { Sfx } from '../audio/sfx.js';
import { Arena, type ArenaResult } from '../engine/arena.js';
import { hidratarIcones, iconeItem } from '../render/icons.js';
import { el, fmt, formatTempo } from './dom.js';
import { Hud } from './hud.js';
import { LogStore } from './log.js';
import { ModalManager } from './modal.js';
import {
  apagarSave,
  carregar,
  carregarMudo,
  salvar,
  salvarMudo,
} from './storage.js';
import {
  ajudaHtml,
  cavaleiroHtml,
  conquistasHtml,
  cronicasHtml,
  equipamentosHtml,
  lugarHtml,
  missoesHtml,
  mochilaHtml,
  renascerHtml,
  skillsHtml,
} from './views.js';

const DESCANSO_MS = 3000;

export class GameController {
  private state: GameState;
  private arena: Arena;
  private modal = new ModalManager();
  private logs: LogStore;
  private hud = new Hud();
  private readonly sfx = new Sfx(carregarMudo());
  private readonly aoPrimeiroGesto = (): void => this.sfx.desbloquear();
  private readonly aoClicarSom = (e: MouseEvent): void => {
    const alvo = e.target instanceof Element ? e.target.closest('button') : null;
    if (alvo) this.sfx.tocar('click');
  };
  private readonly aoMudarSom = (e: Event): void => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
      this.sfx.tocar('click');
    }
  };
  private tempoRestante = DESCANSO_MS / 1000;
  private filtroMochila: Raridade | null = null;
  private ordemMochila: OrdemInventario = 'recente';
  private emBatalha = false;
  private hpAtual: number | null = null;
  private runSeq = 0;
  private rendaTimer: number | undefined;
  private autoTimer: number | undefined;
  private readonly aoSair = (): void => salvar(this.state);
  private readonly aoEsconder = (): void => {
    if (document.visibilityState === 'hidden') salvar(this.state);
  };

  constructor(canvas: HTMLCanvasElement) {
    this.state = carregar();
    this.logs = new LogStore(this.modal);
    this.logs.onCronicasAberta = () => this.abrirCronicas();
    this.arena = new Arena(canvas);
    this.modal.onAbrir = () => this.sfx.tocar('modalAbrir');
    this.modal.onFechar = () => this.sfx.tocar('modalFechar');
  }

  // ---------- modais ----------

  private renderCavaleiro(abrir: boolean): void {
    const { titulo, html } = cavaleiroHtml(this.state);
    if (abrir) this.modal.abrir(titulo, html, 'cavaleiro');
    else this.modal.atualizar(titulo, html, 'cavaleiro');
  }

  private renderLugar(abrir: boolean): void {
    const { titulo, html } = lugarHtml(this.state);
    if (abrir) this.modal.abrir(titulo, html, 'lugar');
    else this.modal.atualizar(titulo, html, 'lugar');
  }

  private renderEquipamentos(abrir: boolean): void {
    const { titulo, html } = equipamentosHtml(this.state);
    if (abrir) this.modal.abrir(titulo, html, 'equip');
    else this.modal.atualizar(titulo, html, 'equip');
    this.modal.corpo.querySelectorAll('[data-eq]').forEach((btn) => {
      (btn as HTMLElement).onclick = () => {
        const slot = (btn as HTMLElement).dataset.eq as EquipSlot;
        if (comprarEquip(this.state, slot)) {
          this.sfx.tocar('compra');
          registrarMissao(this.state, 'compras');
          this.logs.log(`🛒 Comprou: ${EQUIPS[slot].nome}.`, 'buy');
          this.persistirERender();
        } else {
          this.sfx.tocar('erro');
        }
      };
    });
  }

  private renderSkills(abrir: boolean): void {
    const { titulo, html } = skillsHtml(this.state);
    if (abrir) this.modal.abrir(titulo, html, 'skills');
    else this.modal.atualizar(titulo, html, 'skills');
    this.modal.corpo.querySelectorAll('[data-sk]').forEach((btn) => {
      (btn as HTMLElement).onclick = () => {
        const id = (btn as HTMLElement).dataset.sk as SkillId;
        if (comprarSkill(this.state, id)) {
          this.sfx.tocar('skill');
          registrarMissao(this.state, 'compras');
          this.logs.log(`🛒 Skill: ${SKILLS[id].nome} Nv.${this.state.skills[id]}.`, 'buy');
          this.persistirERender();
        } else {
          this.sfx.tocar('erro');
        }
      };
    });
  }

  private renderRenascer(abrir: boolean): void {
    const { titulo, html } = renascerHtml(this.state);
    if (abrir) this.modal.abrir(titulo, html, 'renascer');
    else this.modal.atualizar(titulo, html, 'renascer');
    this.modal.corpo.querySelectorAll('[data-renascer]').forEach((btn) => {
      (btn as HTMLElement).onclick = () => this.executarRenascimento();
    });
  }

  private renderConquistas(abrir: boolean): void {
    const { titulo, html } = conquistasHtml(this.state);
    if (abrir) this.modal.abrir(titulo, html, 'conquistas');
    else this.modal.atualizar(titulo, html, 'conquistas');
  }

  private renderMissoes(abrir: boolean): void {
    const { titulo, html } = missoesHtml(this.state);
    if (abrir) this.modal.abrir(titulo, html, 'missoes');
    else this.modal.atualizar(titulo, html, 'missoes');
  }

  private renderMochila(abrir: boolean): void {
    const { titulo, html } = mochilaHtml(this.state, {
      filtro: this.filtroMochila,
      ordem: this.ordemMochila,
    });
    if (abrir) this.modal.abrir(titulo, html, 'mochila');
    else this.modal.atualizar(titulo, html, 'mochila');

    const corpo = this.modal.corpo;
    const upgrade = corpo.querySelector<HTMLElement>('[data-upgrade]');
    if (upgrade) {
      upgrade.onclick = () => {
        if (melhorarInventario(this.state)) {
          this.sfx.tocar('compra');
          registrarMissao(this.state, 'compras');
          this.logs.log(
            `🎒 Mochila ampliada para ${this.state.inventario.capacidade} espaços.`,
            'buy',
          );
          this.persistirERender();
        } else {
          this.sfx.tocar('erro');
        }
      };
    }

    const select = corpo.querySelector<HTMLSelectElement>('#auto-reciclar');
    if (select) {
      select.onchange = () => {
        const raridade = select.value === '' ? null : (select.value as Raridade);
        if (!definirAutoReciclar(this.state, raridade)) return;
        this.logs.log(
          raridade
            ? `♻ Auto-reciclagem: ${RARIDADE_INFO[raridade].nome} ou abaixo.`
            : '♻ Auto-reciclagem desligada.',
          'info',
        );
        this.persistirERender();
      };
    }

    const filtroSelect = corpo.querySelector<HTMLSelectElement>('#filtro-raridade');
    if (filtroSelect) {
      filtroSelect.onchange = () => {
        this.filtroMochila =
          filtroSelect.value === '' ? null : (filtroSelect.value as Raridade);
        this.render();
      };
    }

    const ordemSelect = corpo.querySelector<HTMLSelectElement>('#ordem-mochila');
    if (ordemSelect) {
      ordemSelect.onchange = () => {
        this.ordemMochila = ordemSelect.value as OrdemInventario;
        this.render();
      };
    }

    corpo.querySelectorAll<HTMLElement>('[data-item]').forEach((btn) => {
      btn.onclick = () => {
        const i = Number(btn.dataset.item);
        const item = this.state.inventario.itens[i];
        if (!item) return;
        const valor = venderItem(this.state, i);
        if (valor != null) {
          this.registrarOuroGanho(valor);
          registrarMissao(this.state, 'vendas');
          this.sfx.tocar('vender');
          this.logs.log(
            `💰 Vendeu ${item.nome} (${RARIDADE_INFO[item.raridade].nome}) por ${fmt(valor)} ouro.`,
            'buy',
          );
          this.persistirERender();
        } else {
          this.sfx.tocar('erro');
        }
      };
    });

    const todos = corpo.querySelector<HTMLElement>('[data-vender-todos]');
    if (todos) {
      todos.onclick = () => {
        const vendidos = venderTodosItens(this.state);
        if (vendidos.itens > 0) {
          this.registrarOuroGanho(vendidos.ouro);
          registrarMissao(this.state, 'vendas', vendidos.itens);
          this.sfx.tocar('vender');
          this.logs.log(
            `💰 Vendeu ${vendidos.itens} ${vendidos.itens > 1 ? 'itens' : 'item'} por ${fmt(vendidos.ouro)} ouro.`,
            'buy',
          );
          this.persistirERender();
        } else {
          this.sfx.tocar('erro');
        }
      };
    }

    const porFiltro = corpo.querySelector<HTMLElement>('[data-vender-filtro]');
    if (porFiltro && this.filtroMochila) {
      const raridade = this.filtroMochila;
      porFiltro.onclick = () => {
        const vendidos = venderItensPorRaridade(this.state, raridade);
        if (vendidos.itens > 0) {
          this.registrarOuroGanho(vendidos.ouro);
          registrarMissao(this.state, 'vendas', vendidos.itens);
          this.sfx.tocar('vender');
          const quantidade = `${vendidos.itens} ${vendidos.itens > 1 ? 'itens' : 'item'}`;
          this.logs.log(
            `💰 Vendeu ${quantidade} de raridade ${RARIDADE_INFO[raridade].nome.toLowerCase()} por ${fmt(vendidos.ouro)} ouro.`,
            'buy',
          );
          this.persistirERender();
        } else {
          this.sfx.tocar('erro');
        }
      };
    }
  }

  abrirDetalhesCavaleiro(): void {
    this.renderCavaleiro(true);
  }

  abrirDetalhesLugar(): void {
    this.renderLugar(true);
  }

  abrirEquipamentos(): void {
    this.renderEquipamentos(true);
  }

  abrirSkills(): void {
    this.renderSkills(true);
  }

  abrirRenascer(): void {
    this.renderRenascer(true);
  }

  abrirMochila(): void {
    this.renderMochila(true);
  }

  abrirConquistas(): void {
    this.checarConquistas();
    this.renderConquistas(true);
  }

  abrirMissoes(): void {
    this.checarConquistas();
    this.renderMissoes(true);
  }

  abrirCronicas(): void {
    const { titulo, html } = cronicasHtml();
    if (this.modal.chave === 'cronicas') this.modal.atualizar(titulo, html, 'cronicas');
    else this.modal.abrir(titulo, html, 'cronicas');
    this.logs.marcarLidas();
  }

  abrirAjuda(): void {
    const { titulo, html } = ajudaHtml();
    this.modal.abrir(titulo, html, 'ajuda');
  }

  private executarRenascimento(): void {
    this.registrarProgresso();
    const resultado = renascer(this.state);
    if (!resultado.possivel) {
      this.sfx.tocar('erro');
      this.logs.log(
        `👑 Renascer libera após vencer o boss do ${lugarDe(0).nome}. Continue avançando!`,
        'info',
      );
      return;
    }
    this.sfx.tocar('prestigio');
    this.runSeq++;
    this.emBatalha = false;
    this.hpAtual = null;
    this.filtroMochila = null;
    this.ordemMochila = 'recente';
    this.tempoRestante = DESCANSO_MS / 1000;
    this.resetarBatalhaVisual();
    this.modal.fechar();
    this.logs.flash(`👑 Renascimento! +${fmt(resultado.ganhos)} brasões`, true);
    this.logs.log(
      `👑 O reino renasceu pela ${this.state.renascimentos}ª vez: +${fmt(resultado.ganhos)} brasões (total ${fmt(resultado.total)}).`,
      'info',
    );
    this.checarConquistas();
    salvar(this.state);
    this.descansoAtual();
    this.render();
  }

  private comprarAcessivel(): void {
    const resultado = comprarMelhoriasAcessiveis(this.state);
    if (resultado.compras <= 0) {
      this.sfx.tocar('erro');
      this.logs.log('⚡ Nenhuma melhoria acessível com o ouro atual.', 'info');
      return;
    }
    this.sfx.tocar('compra');
    registrarMissao(this.state, 'compras', resultado.compras);
    this.logs.log(
      `⚡ Comprou ${resultado.compras} melhoria${resultado.compras > 1 ? 's' : ''} por ${fmt(resultado.gasto)} ouro.`,
      'buy',
    );
    this.persistirERender();
  }

  // ---------- render ----------

  private persistirERender(): void {
    this.checarConquistas();
    salvar(this.state);
    this.render();
  }

  render(): void {
    this.hud.render(this.state, { onSlotClick: () => this.abrirEquipamentos() }, this.hpAtual);
    const chave = this.modal.chave;
    if (chave === 'cavaleiro') this.renderCavaleiro(false);
    else if (chave === 'lugar') this.renderLugar(false);
    else if (chave === 'equip') this.renderEquipamentos(false);
    else if (chave === 'skills') this.renderSkills(false);
    else if (chave === 'renascer') this.renderRenascer(false);
    else if (chave === 'mochila') this.renderMochila(false);
    else if (chave === 'conquistas') this.renderConquistas(false);
    else if (chave === 'missoes') this.renderMissoes(false);
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
    this.sfx.ambiente(l.bioma);
  }

  private dataLocalHoje(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
  }

  private garantirMissoesDoDia(): void {
    const tinha = this.state.missoes.data !== '';
    if (!garantirMissoes(this.state, this.dataLocalHoje()) || !tinha) return;
    this.sfx.tocar('missao');
    this.logs.log('🎯 Novas missões diárias disponíveis. Complete as 3 para o bônus!', 'info');
    this.logs.flash('🎯 Missões diárias renovadas!', true);
  }

  private registrarOuroTotal(valor: number): void {
    if (!Number.isFinite(valor) || valor <= 0) return;
    const est = this.state.estatisticas;
    est.ouroTotal = Math.min(
      Number.MAX_SAFE_INTEGER,
      Math.max(0, est.ouroTotal) + valor,
    );
  }

  private registrarOuroGanho(valor: number): void {
    this.registrarOuroTotal(valor);
    registrarMissao(this.state, 'ouro', valor);
  }

  private ganharOuro(valor: number): void {
    if (!Number.isFinite(valor) || valor <= 0) return;
    this.state.ouro = Math.min(Number.MAX_SAFE_INTEGER, this.state.ouro + valor);
    this.registrarOuroGanho(valor);
  }

  private registrarProgresso(): void {
    const est = this.state.estatisticas;
    est.maiorLugar = Math.max(est.maiorLugar, this.state.lugar);
    est.maiorNivel = Math.max(est.maiorNivel, this.state.nivel);
  }

  private relatarMissoes(resultado: ReturnType<typeof processarMissoes>): void {
    if (resultado.concluidas.length === 0 && !resultado.bonus) return;
    this.sfx.tocar('missao');
    for (const { def } of resultado.concluidas) {
      this.registrarOuroTotal(def.ouro);
      this.logs.log(`🎯 Missão concluída: ${def.nome} — +${fmt(def.ouro)} ouro.`, 'buy');
    }
    if (resultado.bonus) {
      this.registrarOuroTotal(MISSOES_BONUS.ouro);
      this.logs.log(
        `🎯 Bônus diário completo: +${fmt(MISSOES_BONUS.ouro)} ouro e +${fmt(MISSOES_BONUS.brasoes)} brasão.`,
        'buy',
      );
    }
    this.logs.flash(
      resultado.bonus
        ? '🎯 Bônus diário completo!'
        : `🎯 ${resultado.concluidas.length} missão${resultado.concluidas.length > 1 ? 'ões' : ''} concluída${resultado.concluidas.length > 1 ? 's' : ''}!`,
      true,
    );
  }

  private checarConquistas(): void {
    this.garantirMissoesDoDia();
    this.registrarProgresso();
    this.relatarMissoes(processarMissoes(this.state));
    const novas = desbloquearConquistas(this.state);
    if (novas.length === 0) return;
    this.sfx.tocar('conquista');
    for (const { def } of novas) {
      const premios: string[] = [];
      if (def.ouro > 0) premios.push(`${fmt(def.ouro)} ouro`);
      if (def.brasoes > 0) {
        premios.push(`${fmt(def.brasoes)} ${def.brasoes > 1 ? 'brasões' : 'brasão'}`);
      }
      this.logs.log(
        `🏅 ${def.nome}: ${def.desc}${premios.length > 0 ? ` — +${premios.join(' + ')}` : ''}.`,
        'buy',
      );
    }
    this.logs.flash(
      novas.length > 1
        ? `🏅 ${novas.length} conquistas desbloqueadas!`
        : `🏅 ${novas[novas.length - 1].def.nome}`,
      true,
    );
  }

  // ---------- batalha ----------

  private iniciarBatalhaVisual(boss: boolean): void {
    const fill = el('timer-fill') as HTMLElement;
    fill.classList.add('batalha');
    fill.style.width = '100%';
    el('timer').textContent = boss ? '☠ boss em andamento...' : '⚔ horda em andamento...';
    if (boss) this.sfx.tocar('boss');
  }

  private resetarBatalhaVisual(): void {
    const fill = el('timer-fill') as HTMLElement;
    fill.classList.remove('batalha');
    fill.style.width = '0%';
  }

  private async iniciarRun(): Promise<void> {
    if (this.emBatalha) return;
    this.emBatalha = true;
    const runId = ++this.runSeq;
    const ativo = (): boolean => runId === this.runSeq;
    let vigia: number | undefined;
    let lootItens = 0;
    let lootReciclados = 0;
    let lootOuro = 0;
    const lootMelhor = { item: null as ItemInventario | null };
    try {
      const sim = simularHorda(this.state);
      const horda = sim.horda;
      const P = parametrosCombate(this.state);
      const l = lugarDe(this.state.lugar);
      const tempoMax = Math.max(180, sim.tempo * 2 + 60);
      this.registrarProgresso();

      this.atualizarVida(P.hp, P.hp);
      (el('horda-fill') as HTMLElement).style.width = '0%';
      el('horda-txt').textContent = horda.boss ? 'BOSS' : `0/${horda.total}`;
      this.iniciarBatalhaVisual(horda.boss);

      const res = await Promise.race([
        this.arena.lutarHorda({
          playerAtk: P.atk,
          playerHp: P.hp,
          intervalo: P.intervalo,
          regen: P.regen,
          reducaoDano: P.reducaoDano,
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
            registrarMissao(this.state, 'abates');
            const est = this.state.estatisticas;
            if (def.elite) {
              est.elitesDerrotados += 1;
              registrarMissao(this.state, 'elites');
            }
            if (def.boss) {
              est.bossesDerrotados += 1;
              registrarMissao(this.state, 'bosses');
            }
            const itens = rolarDrops(this.state, { boss: def.boss });
            if (itens.length > 0) {
              est.itensEncontrados += itens.length;
              est.itensLendarios += itens.filter((item) => item.raridade === 'lendario').length;
              registrarMissao(this.state, 'drops', itens.length);
              registrarMissao(
                this.state,
                'raros',
                itens.filter(
                  (item) => indiceRaridade(item.raridade) >= indiceRaridade('raro'),
                ).length,
              );
              this.sfx.tocar('drop');
              const resumo = processarDrops(this.state, itens);
              this.registrarOuroGanho(resumo.ouro);
              lootItens += resumo.obtidos.length;
              lootReciclados += resumo.reciclados;
              lootOuro += resumo.ouro;
              for (const item of resumo.obtidos) {
                if (
                  lootMelhor.item === null ||
                  indiceRaridade(item.raridade) > indiceRaridade(lootMelhor.item.raridade) ||
                  (item.raridade === lootMelhor.item.raridade &&
                    item.valor > lootMelhor.item.valor)
                ) {
                  lootMelhor.item = item;
                }
              }
            }
            el('ouro').textContent = fmt(this.state.ouro);
          },
          onSfx: (evento) => {
            if (!ativo()) return;
            if (evento === 'golpe') this.sfx.tocar('golpe');
            else if (evento === 'dano') this.sfx.tocar('dano');
            else if (evento === 'abate') this.sfx.tocar('abate');
            else if (evento === 'abateElite') this.sfx.tocar('elite');
            else this.sfx.tocar('boss');
          },
          onPlayerHp: (hp, max) => {
            if (!ativo()) return;
            this.atualizarVida(hp, max);
          },
          onProgress: (k, total) => {
            if (!ativo()) return;
            (el('horda-fill') as HTMLElement).style.width = `${Math.round((k / total) * 100)}%`;
            el('horda-txt').textContent = `${k}/${total}`;
            el('timer').textContent = horda.boss
              ? '☠ boss em andamento...'
              : `⚔ horda em andamento — ${k}/${total}`;
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
        this.sfx.tocar('vitoria');
        this.ganharOuro(horda.bonus);
        this.state.vitorias += 1;
        registrarMissao(this.state, 'vitorias');
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
          this.sfx.tocar('lugar');
          const nl = lugarDe(this.state.lugar);
          this.logs.log(
            `🌍 Novo lugar: ${nl.nome}${av.volta > 1 ? ` — VOLTA ${av.volta}!` : '!'} O boss caiu!`,
            'info',
          );
        }
      } else {
        this.sfx.tocar('derrota');
        this.state.derrotas += 1;
        this.logs.flash(`❌ Derrota... manteve ${fmt(res.ouro)} ouro`, false);
        this.logs.log(
          `❌ ${this.state.cavaleiro.nome} caiu no ${l.nome} Nv.${this.state.nivel} (${res.abates}/${horda.total}). Equipe e volte!`,
          'loss',
        );
      }

      const melhorLoot = lootMelhor.item;
      if (melhorLoot && indiceRaridade(melhorLoot.raridade) >= indiceRaridade('lendario')) {
        this.sfx.tocar('lendario');
      } else if (
        melhorLoot &&
        indiceRaridade(melhorLoot.raridade) >= indiceRaridade('raro')
      ) {
        this.sfx.tocar('raro');
      }
      const lootNotavel =
        horda.boss ||
        (melhorLoot != null &&
          indiceRaridade(melhorLoot.raridade) >= indiceRaridade('raro'));
      if (lootNotavel && (lootItens > 0 || lootReciclados > 0)) {
        const partes: string[] = [];
        if (lootItens > 0) {
          partes.push(
            `${lootItens} item${lootItens > 1 ? 's' : ''} guardado${lootItens > 1 ? 's' : ''}`,
          );
        }
        if (lootReciclados > 0) {
          partes.push(
            `${lootReciclados} reciclado${lootReciclados > 1 ? 's' : ''} (+${fmt(lootOuro)} ouro)`,
          );
        }
        if (melhorLoot) {
          partes.push(
            `melhor: ${iconeItem(melhorLoot.tipo)} ${melhorLoot.nome} (${RARIDADE_INFO[melhorLoot.raridade].nome})`,
          );
        }
        this.logs.log(`🎁 ${partes.join(' • ')}.`, 'info');
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
        this.resetarBatalhaVisual();
        this.checarConquistas();
        salvar(this.state);
        this.descansoAtual();
        this.render();
      }
    }
  }

  // ---------- boot ----------

  private atualizarBotaoSom(): void {
    const btn = el('btn-som');
    const mudo = this.sfx.silenciado;
    btn.textContent = mudo ? '🔇 Som' : '🔊 Som';
    btn.setAttribute('aria-pressed', String(mudo));
    btn.title = mudo ? 'Ativar som' : 'Desativar som';
    btn.classList.toggle('mudo', mudo);
  }

  boot(): void {
    window.addEventListener('pagehide', this.aoSair);
    document.addEventListener('visibilitychange', this.aoEsconder);
    document.addEventListener('pointerdown', this.aoPrimeiroGesto, { passive: true });
    document.addEventListener('click', this.aoClicarSom);
    document.addEventListener('change', this.aoMudarSom);

    el('lutar-agora').onclick = () => {
      if (this.emBatalha) return;
      this.tempoRestante = 0; // pula o descanso
      void this.iniciarRun(); // funciona mesmo com o auto desligado
    };
    el('reset').onclick = () => {
      if (confirm('Apagar TODO o progresso (incluindo brasões) e recomeçar o reino?')) {
        this.runSeq++; // invalida callbacks/watchdog da run em andamento
        apagarSave();
        this.state = criarEstadoInicial();
        this.emBatalha = false;
        this.hpAtual = null;
        this.tempoRestante = DESCANSO_MS / 1000;
        this.resetarBatalhaVisual();
        this.logs.limpar();
        this.logs.log('👑 Novo reino fundado! Boa sorte, regente.', 'info');
        this.garantirMissoesDoDia();
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
    el('btn-mochila').onclick = () => this.abrirMochila();
    el('btn-conquistas').onclick = () => this.abrirConquistas();
    el('btn-missoes').onclick = () => this.abrirMissoes();
    el('btn-renascer').onclick = () => this.abrirRenascer();
    el('btn-auto-comprar').onclick = () => this.comprarAcessivel();
    el('btn-cronicas').onclick = () => this.abrirCronicas();
    el('btn-ajuda').onclick = () => this.abrirAjuda();
    el('btn-som').onclick = () => {
      this.sfx.desbloquear();
      salvarMudo(this.sfx.alternarMudo());
      this.atualizarBotaoSom();
    };
    this.atualizarBotaoSom();

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
      this.checarConquistas();
      salvar(this.state);
      this.render();
    }, 5000);

    // ganho offline
    this.garantirMissoesDoDia();
    const ganho = calcularGanhoOffline(this.state);
    if (ganho.ouro > 0) {
      this.ganharOuro(ganho.ouro);
      this.logs.log(
        `🌙 Enquanto você esteve fora (${formatTempo(ganho.segundosFora)}), seus coletores ganharam ${fmt(ganho.ouro)} de ouro.`,
        'info',
      );
      salvar(this.state);
    }

    this.checarConquistas();
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
    document.removeEventListener('visibilitychange', this.aoEsconder);
    document.removeEventListener('pointerdown', this.aoPrimeiroGesto);
    document.removeEventListener('click', this.aoClicarSom);
    document.removeEventListener('change', this.aoMudarSom);
    this.sfx.pararAmbiente();
    window.clearInterval(this.autoTimer);
    window.clearInterval(this.rendaTimer);
  }
}
