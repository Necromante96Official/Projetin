import { describe, expect, it } from 'vitest';
import {
  CONQUISTAS,
  EQUIPS,
  INVENTARIO,
  MAX_LUGAR,
  MAX_SKILL,
  MAX_TIER,
  MISSOES,
  MISSOES_BONUS,
  ORDEM_CONQUISTAS,
  ORDEM_SKILLS,
  ORDEM_SLOTS,
  ORDEM_TIPOS_ITEM,
  PRESTIGIO,
  RARIDADES,
  RARIDADE_INFO,
  SKILLS,
  TIPOS_ITEM,
  avancarNivel,
  bonusPrestigio,
  brasoesDisponiveis,
  calcularGanhoOffline,
  chanceDropNormal,
  comprarEquip,
  comprarMelhoriasAcessiveis,
  comprarSkill,
  criarEstadoInicial,
  criarInventarioInicial,
  custoEquip,
  custoProximaMelhoria,
  custoUpgradeInventario,
  definirAutoReciclar,
  desbloquearConquistas,
  garantirMissoes,
  gerarHorda,
  listarConquistas,
  listarInventario,
  lugarDe,
  melhorarInventario,
  migrarSave,
  missoesConcluidas,
  ouroPorMinuto,
  parametrosCombate,
  pityRestante,
  podeRenascer,
  poderCavaleiro,
  processarDrops,
  processarMissoes,
  progressoConquista,
  registrarMissao,
  renascer,
  rolarDrops,
  sanitizarInventario,
  simularHorda,
  sortearRaridade,
  valorItem,
  venderItem,
  venderItensPorRaridade,
  venderTodosItens,
  type ItemInventario,
  type Raridade,
} from '../src/core/index.js';
import { ICONES_ITENS, iconeItem } from '../src/render/icons.js';

describe('reino idle — equipamentos + skills', () => {
  it('começa pelado: tiers 0 e skills 0', () => {
    const s = criarEstadoInicial();
    const total = ORDEM_SLOTS.reduce((a, k) => a + (s.equip[k] ?? 0), 0);
    expect(total).toBe(0);
    expect(s.skills.afiado).toBe(0);
    expect(s.cavaleiro.atk).toBe(10);
  });

  it('comprar arma aumenta o ataque', () => {
    const s = criarEstadoInicial();
    s.ouro = 9999;
    const antes = poderCavaleiro(s).atk;
    expect(comprarEquip(s, 'arma')).toBe(true);
    expect(s.equip.arma).toBe(1);
    expect(poderCavaleiro(s).atk).toBeGreaterThan(antes);
  });

  it('não compra sem ouro nem além do máximo', () => {
    const s = criarEstadoInicial();
    s.ouro = 0;
    expect(comprarEquip(s, 'arma')).toBe(false);
    s.ouro = 999999;
    comprarEquip(s, 'arma');
    comprarEquip(s, 'arma');
    comprarEquip(s, 'arma');
    expect(s.equip.arma).toBe(MAX_TIER);
    expect(comprarEquip(s, 'arma')).toBe(false);
    expect(custoEquip(s, 'arma')).toBeNull();
  });

  it('skills alteram os parâmetros de combate', () => {
    const s = criarEstadoInicial();
    s.ouro = 99999;
    const base = parametrosCombate(s);
    comprarSkill(s, 'afiado');
    comprarSkill(s, 'vigor');
    comprarSkill(s, 'rapidez');
    comprarSkill(s, 'regen');
    const buff = parametrosCombate(s);
    expect(buff.atk).toBeGreaterThan(base.atk);
    expect(buff.hp).toBeGreaterThan(base.hp);
    expect(buff.intervalo).toBeLessThan(base.intervalo);
    expect(buff.regen).toBeGreaterThan(0);
  });

  it('horda e boss geram corretamente', () => {
    const s = criarEstadoInicial();
    expect(gerarHorda(s).inimigos).toHaveLength(15);
    expect(gerarHorda({ ...s, nivel: 10 }).boss).toBe(true);
    expect(lugarDe(2).nome).toBe('Caverna de Brasas');
    expect(lugarDe(8).nome).toBe('Cidadela Celeste');
    expect(lugarDe(9).nome).toBe('Campo Verde');
  });

  it('elites aparecem a cada 6 inimigos a partir do Nv.3', () => {
    const s = criarEstadoInicial();
    expect(gerarHorda({ ...s, nivel: 2 }).inimigos.some((e) => e.elite)).toBe(false);
    const h = gerarHorda({ ...s, nivel: 3 });
    const elites = h.inimigos.filter((e) => e.elite);
    expect(elites).toHaveLength(Math.floor((h.inimigos.length - 1) / 6));
    expect(elites[0].nome.startsWith('Elite ')).toBe(true);
    expect(elites[0].hp).toBeGreaterThan(0);
    expect(elites[0].gold).toBeGreaterThan(0);
  });

  it('fortuna e tenacidade alteram drop e defesa', () => {
    const s = criarEstadoInicial();
    const baseDrop = chanceDropNormal(s);
    const baseDef = parametrosCombate(s).reducaoDano;
    s.skills.fortuna = 2;
    s.skills.tenacidade = 3;
    expect(chanceDropNormal(s)).toBeGreaterThan(baseDrop);
    expect(parametrosCombate(s).reducaoDano).toBeGreaterThan(baseDef);
    expect(parametrosCombate(s).reducaoDano).toBeCloseTo(0.12);
    expect(ORDEM_SKILLS).toContain('fortuna');
    expect(ORDEM_SKILLS).toContain('tenacidade');
  });

  it('Nv.1 vencível; sim determinística', () => {
    const s = criarEstadoInicial();
    const r = simularHorda(s);
    expect(r.venceu).toBe(true);
    expect(r.abates).toBe(15);
    expect(simularHorda(s)).toEqual(r);
  });

  it('Nv.10 avança de lugar', () => {
    const s = { ...criarEstadoInicial(), nivel: 10 };
    const av = avancarNivel(s);
    expect(av.subiuLugar).toBe(true);
    expect(s.lugar).toBe(1);
    expect(s.nivel).toBe(1);
  });

  it('migra save com prédios: reembolsa e remove', () => {
    const s = migrarSave({ ouro: 10, quartel: 3, muralha: 2, mercado: 2, nivelInimigo: 5 });
    expect((s as unknown as Record<string, unknown>).quartel).toBeUndefined();
    expect(s.ouro).toBeGreaterThan(10);
    expect(s.lugar).toBe(0);
    expect(s.equip.arma).toBe(0);
    expect(s.cavaleiro.atk).toBeGreaterThan(0);
  });

  it('migra save sem cavaleiro válido (anti-NaN)', () => {
    const s = migrarSave({ ouro: 0, cavaleiro: { nome: 'X' } });
    expect(Number.isFinite(s.cavaleiro.atk)).toBe(true);
    expect(Number.isFinite(s.cavaleiro.hp)).toBe(true);
  });

  it('ganho offline só após 30s', () => {
    const s = criarEstadoInicial();
    s.updatedAt = Date.now() - 10 * 1000;
    expect(calcularGanhoOffline(s).ouro).toBe(0);
    s.updatedAt = Date.now() - 3600 * 1000;
    expect(calcularGanhoOffline(s).ouro).toBeGreaterThan(0);
  });

  it('offline ignora relógio no futuro (sem ganho retroativo)', () => {
    const s = criarEstadoInicial();
    s.updatedAt = Date.now() + 60 * 1000;
    const g = calcularGanhoOffline(s);
    expect(g.segundosFora).toBe(0);
    expect(g.ouro).toBe(0);
  });

  it('renda offline usa o estágio normal, não o ouro inflado do BOSS', () => {
    const s = criarEstadoInicial();
    s.nivel = 10;
    s.lugar = 0;
    const horda = gerarHorda(s);
    expect(horda.boss).toBe(true);
    expect(ouroPorMinuto(s)).toBeLessThan((horda.inimigos[0]?.gold ?? 0) * 4);
    expect(ouroPorMinuto(s)).toBe(Math.round((3 + 10 * 1.5) * 4));
  });

  it('saneia save corrompido: ouro, lugar, relógio, equip e stats', () => {
    const agora = Date.now();
    const s = migrarSave({
      ouro: -50,
      lugar: 1e9,
      nivel: 999,
      updatedAt: agora + 60 * 1000,
      cavaleiro: { nome: '', atk: -5, hp: Number.NaN },
      equip: { arma: 99999, elmo: -3 },
      skills: { afiado: 99999, vigor: Number.NaN },
    });
    expect(s.ouro).toBe(0);
    expect(s.lugar).toBe(MAX_LUGAR);
    expect(s.nivel).toBe(10);
    expect(s.updatedAt).toBeLessThanOrEqual(agora);
    expect(s.cavaleiro.atk).toBe(1);
    expect(s.cavaleiro.hp).toBe(100);
    expect(s.equip.arma).toBe(MAX_TIER);
    expect(s.equip.elmo).toBe(0);
    expect(s.skills.afiado).toBe(MAX_SKILL);
    expect(s.skills.vigor).toBe(0);
  });

  it('limita números gigantes mas finitos do save (sem Infinity no combate)', () => {
    const s = migrarSave({
      ouro: Number.MAX_VALUE,
      vitorias: Number.MAX_VALUE,
      abates: Number.MAX_VALUE,
      cavaleiro: { atk: Number.MAX_VALUE, hp: Number.MAX_VALUE },
    });
    for (const n of [s.ouro, s.vitorias, s.abates, s.cavaleiro.atk, s.cavaleiro.hp]) {
      expect(Number.isFinite(n)).toBe(true);
      expect(n).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
    }
    const p = parametrosCombate(s);
    expect(Number.isFinite(p.atk)).toBe(true);
    expect(Number.isFinite(p.hp)).toBe(true);
  });

  it('não passa do último lugar no avanço de nível', () => {
    const s = { ...criarEstadoInicial(), lugar: MAX_LUGAR, nivel: 10 };
    const av = avancarNivel(s);
    expect(s.lugar).toBe(MAX_LUGAR);
    expect(av.subiuLugar).toBe(false);
  });

  it('todas as peças e skills têm definição válida', () => {
    for (const slot of ORDEM_SLOTS) {
      expect(EQUIPS[slot].tiers).toHaveLength(MAX_TIER + 1);
      expect(EQUIPS[slot].tiers[0].custo).toBe(0);
    }
    expect(Object.keys(SKILLS)).toHaveLength(ORDEM_SKILLS.length);
    expect(MAX_SKILL).toBe(5);
  });

  it('renascimento só libera depois do lugar mínimo', () => {
    const s = criarEstadoInicial();
    expect(podeRenascer(s)).toBe(false);
    expect(brasoesDisponiveis(s)).toBe(0);
    s.lugar = PRESTIGIO.lugarMinimo;
    expect(podeRenascer(s)).toBe(true);
    expect(brasoesDisponiveis(s)).toBeGreaterThan(0);
    expect(renascer(s).possivel).toBe(true);
  });

  it('renascer zera loja/lugar e preserva brasões e registros', () => {
    const s = criarEstadoInicial();
    s.lugar = 3;
    s.nivel = 6;
    s.ouro = 5000;
    s.equip.arma = MAX_TIER;
    s.skills.afiado = 3;
    s.vitorias = 42;
    const ganho = brasoesDisponiveis(s);
    const r = renascer(s);
    expect(r.possivel).toBe(true);
    expect(r.ganhos).toBe(ganho);
    expect(s.brasoes).toBe(ganho);
    expect(s.renascimentos).toBe(1);
    expect(s.lugar).toBe(0);
    expect(s.nivel).toBe(1);
    expect(ORDEM_SLOTS.every((k) => s.equip[k] === 0)).toBe(true);
    expect(ORDEM_SKILLS.every((k) => s.skills[k] === 0)).toBe(true);
    expect(s.ouro).toBe(PRESTIGIO.ouroInicialBase + ganho * PRESTIGIO.ouroInicialPorBrasao);
    expect(s.vitorias).toBe(42);
  });

  it('não renasce sem progresso suficiente', () => {
    const s = criarEstadoInicial();
    const r = renascer(s);
    expect(r.possivel).toBe(false);
    expect(s.renascimentos).toBe(0);
  });

  it('brasões aumentam ataque, vida, regeneração e ouro', () => {
    const s = criarEstadoInicial();
    s.skills.regen = 1;
    const base = parametrosCombate(s);
    s.brasoes = 5;
    const buff = parametrosCombate(s);
    expect(buff.atk).toBeGreaterThan(base.atk);
    expect(buff.hp).toBeGreaterThan(base.hp);
    expect(buff.regen).toBeGreaterThan(base.regen);
    expect(buff.ouroMult).toBeGreaterThan(base.ouroMult);
    expect(bonusPrestigio(s).stats).toBeGreaterThan(1);
  });

  it('renascimento vira uma parede de progresso em vitória', () => {
    const s = criarEstadoInicial();
    s.lugar = 3;
    s.nivel = 6;
    for (const slot of ORDEM_SLOTS) s.equip[slot] = MAX_TIER;
    for (const id of ORDEM_SKILLS) s.skills[id] = MAX_SKILL;
    expect(simularHorda(s).venceu).toBe(false);
    s.brasoes = 8;
    expect(simularHorda(s).venceu).toBe(true);
  });

  it('compra acessível respeita o saldo e para quando não há mais nada', () => {
    const s = criarEstadoInicial();
    s.ouro = 500;
    const r = comprarMelhoriasAcessiveis(s);
    expect(r.compras).toBeGreaterThan(0);
    expect(r.gasto).toBe(500 - s.ouro);
    expect(r.gasto).toBeLessThanOrEqual(500);
    const proximo = custoProximaMelhoria(s);
    expect(proximo === null || proximo > s.ouro).toBe(true);

    s.ouro = 999999;
    comprarMelhoriasAcessiveis(s);
    expect(custoProximaMelhoria(s)).toBeNull();
    expect(comprarMelhoriasAcessiveis(s)).toEqual({ compras: 0, gasto: 0 });
  });

  it('migra brasões/renascimentos e sanitiza o nome do cavaleiro', () => {
    const s = migrarSave({
      brasoes: 1e9,
      renascimentos: Number.NaN,
      cavaleiro: { nome: '<b>Aria</b>', atk: 10, hp: 100 },
    });
    expect(s.brasoes).toBe(PRESTIGIO.maxBrasoes);
    expect(s.renascimentos).toBe(0);
    expect(s.cavaleiro.nome).not.toContain('<');
    expect(s.cavaleiro.nome).not.toContain('>');
  });
});

describe('reino idle — mochila e drops', () => {
  it('começa com 50 slots, vazia e sem auto-reciclagem', () => {
    const s = criarEstadoInicial();
    expect(s.inventario).toEqual(criarInventarioInicial());
    expect(s.inventario.capacidade).toBe(INVENTARIO.slotsIniciais);
    expect(s.inventario.itens).toHaveLength(0);
    expect(s.inventario.autoReciclar).toBeNull();
    expect(s.inventario.semDrops).toBe(0);
  });

  it('raridades têm pesos que somam 100% e valor crescente', () => {
    expect(RARIDADES).toHaveLength(5);
    for (let i = 1; i < RARIDADES.length; i++) {
      expect(RARIDADE_INFO[RARIDADES[i]].valorMult).toBeGreaterThan(
        RARIDADE_INFO[RARIDADES[i - 1]].valorMult,
      );
    }
    const normal = RARIDADES.reduce((s, r) => s + RARIDADE_INFO[r].pesoNormal, 0);
    const boss = RARIDADES.reduce((s, r) => s + RARIDADE_INFO[r].pesoBoss, 0);
    expect(normal).toBeCloseTo(100);
    expect(boss).toBeCloseTo(100);
  });

  it('catálogo tem 16 tipos, 5 nomes por raridade e ícone próprio', () => {
    expect(ORDEM_TIPOS_ITEM).toHaveLength(16);
    const nomes = new Set<string>();
    let pesoTotal = 0;
    for (const tipo of ORDEM_TIPOS_ITEM) {
      const def = TIPOS_ITEM[tipo];
      expect(def.nome.length).toBeGreaterThan(0);
      expect(def.valorMult).toBeGreaterThan(0);
      expect(def.peso).toBeGreaterThan(0);
      for (const raridade of RARIDADES) {
        expect(def.nomes[raridade].length).toBeGreaterThan(0);
        nomes.add(def.nomes[raridade]);
      }
      expect(ICONES_ITENS[tipo]).toBe(iconeItem(tipo));
      expect(iconeItem(tipo)).toContain('<svg');
      pesoTotal += def.peso;
    }
    expect(nomes.size).toBe(ORDEM_TIPOS_ITEM.length * RARIDADES.length);
    expect(pesoTotal).toBeCloseTo(100);
  });

  it('sorteia raridades pelas bordas dos pesos', () => {
    const pesos = RARIDADES.map((r) => RARIDADE_INFO[r].pesoNormal);
    expect(sortearRaridade(pesos, () => 0)).toBe('comum');
    expect(sortearRaridade(pesos, () => 0.9)).toBe('raro');
    expect(sortearRaridade(pesos, () => 0.999999)).toBe('lendario');
    expect(sortearRaridade(pesos, () => 1)).toBe('lendario');
    expect(sortearRaridade([0, 0, 0, 0, 0], () => 0.5)).toBe('comum');
  });

  it('BOSS solta 3 itens e abate normal respeita a chance atual', () => {
    const boss = criarEstadoInicial();
    expect(rolarDrops(boss, { boss: true, rng: () => 0 })).toHaveLength(INVENTARIO.itensBoss);
    const seco = criarEstadoInicial();
    expect(rolarDrops(seco, { rng: () => 0.99 })).toHaveLength(0);
    expect(seco.inventario.semDrops).toBe(1);
    const molhado = criarEstadoInicial();
    expect(rolarDrops(molhado, { rng: () => 0 })).toHaveLength(1);
    expect(molhado.inventario.semDrops).toBe(0);
  });

  it('chance de drop cresce por nível e o pity garante o próximo item', () => {
    const s = criarEstadoInicial();
    expect(chanceDropNormal(s)).toBeCloseTo(0.415);
    s.nivel = 10;
    expect(chanceDropNormal(s)).toBeCloseTo(0.55);
    s.nivel = 99;
    expect(chanceDropNormal(s)).toBe(INVENTARIO.chanceDropMax);
    s.nivel = 1;
    expect(pityRestante(s)).toBe(INVENTARIO.pitySemDrops);

    for (let i = 0; i < INVENTARIO.pitySemDrops; i++) {
      expect(rolarDrops(s, { rng: () => 0.999999 })).toHaveLength(0);
    }
    expect(s.inventario.semDrops).toBe(INVENTARIO.pitySemDrops);
    expect(pityRestante(s)).toBe(0);
    const garantido = rolarDrops(s, { rng: () => 0 });
    expect(garantido).toHaveLength(1);
    expect(s.inventario.semDrops).toBe(0);
  });

  it('BOSS garante ao menos um item raro', () => {
    const s = criarEstadoInicial();
    const itens = rolarDrops(s, { boss: true, rng: () => 0 });
    expect(itens).toHaveLength(INVENTARIO.itensBoss);
    expect(itens.some((item) => item.raridade === 'raro')).toBe(true);
    for (const item of itens) {
      expect(item.nome).toBe(TIPOS_ITEM[item.tipo].nomes[item.raridade]);
      expect(item.valor).toBeGreaterThan(0);
    }
  });

  it('auto-reciclagem vende até a raridade escolhida', () => {
    const s = criarEstadoInicial();
    s.ouro = 0;
    expect(definirAutoReciclar(s, 'incomum')).toBe(true);
    const comum: ItemInventario = {
      nome: 'Anel de cobre',
      tipo: 'anel',
      raridade: 'comum',
      valor: 10,
    };
    const raro: ItemInventario = {
      nome: 'Gema estelar',
      tipo: 'gema',
      raridade: 'raro',
      valor: 100,
    };
    const r = processarDrops(s, [comum, raro]);
    expect(r.reciclados).toBe(1);
    expect(r.ouro).toBe(10);
    expect(s.ouro).toBe(10);
    expect(s.inventario.itens).toEqual([raro]);
    expect(s.inventario.reciclados).toBe(1);
    expect(s.inventario.ouroReciclado).toBe(10);
  });

  it('mochila cheia vende o excedente automaticamente', () => {
    const s = criarEstadoInicial();
    s.inventario.itens = Array.from({ length: s.inventario.capacidade }, (_, i) => ({
      nome: `Item ${i}`,
      tipo: 'pedra' as const,
      raridade: 'comum' as const,
      valor: 1,
    }));
    const r = processarDrops(s, [
      { nome: 'Relíquia dos deuses', tipo: 'reliquia', raridade: 'lendario', valor: 500 },
    ]);
    expect(r.obtidos).toHaveLength(0);
    expect(r.processados[0].motivo).toBe('cheio');
    expect(s.ouro).toBe(30 + 500);
    expect(s.inventario.itens).toHaveLength(INVENTARIO.slotsIniciais);
    expect(s.inventario.reciclados).toBe(1);
  });

  it('vende item e vende tudo creditando o ouro', () => {
    const s = criarEstadoInicial();
    s.ouro = 0;
    s.inventario.itens = [
      { nome: 'A', tipo: 'moeda', raridade: 'comum', valor: 7 },
      { nome: 'B', tipo: 'gema', raridade: 'raro', valor: 70 },
    ];
    expect(venderItem(s, 5)).toBeNull();
    expect(venderItem(s, 0)).toBe(7);
    expect(s.ouro).toBe(7);
    expect(s.inventario.itens).toHaveLength(1);
    expect(venderTodosItens(s)).toEqual({ itens: 1, ouro: 70 });
    expect(s.ouro).toBe(77);
    expect(s.inventario.itens).toHaveLength(0);
    expect(s.inventario.reciclados).toBe(2);
    expect(s.inventario.ouroReciclado).toBe(77);
  });

  it('filtra e ordena a mochila sem mudar os índices originais', () => {
    const s = criarEstadoInicial();
    s.inventario.itens = [
      { nome: 'A', tipo: 'moeda', raridade: 'comum', valor: 50 },
      { nome: 'B', tipo: 'gema', raridade: 'raro', valor: 100 },
      { nome: 'C', tipo: 'pedra', raridade: 'comum', valor: 200 },
      { nome: 'D', tipo: 'reliquia', raridade: 'lendario', valor: 300 },
    ];
    const original = [...s.inventario.itens];

    const recentes = listarInventario(s.inventario, null, 'recente');
    expect(recentes.map((e) => e.indice)).toEqual([3, 2, 1, 0]);

    const raridade = listarInventario(s.inventario, null, 'raridade');
    expect(raridade.map((e) => e.indice)).toEqual([3, 1, 2, 0]);

    const valor = listarInventario(s.inventario, null, 'valor');
    expect(valor.map((e) => e.indice)).toEqual([3, 2, 1, 0]);

    const comuns = listarInventario(s.inventario, 'comum', 'valor');
    expect(comuns.map((e) => e.indice)).toEqual([2, 0]);
    expect(comuns.map((e) => e.item.valor)).toEqual([200, 50]);
    expect(listarInventario(s.inventario, 'mitico' as Raridade)).toHaveLength(4);
    expect(s.inventario.itens).toEqual(original);
  });

  it('vende em lote apenas a raridade filtrada', () => {
    const s = criarEstadoInicial();
    s.ouro = 0;
    s.inventario.itens = [
      { nome: 'A', tipo: 'moeda', raridade: 'comum', valor: 50 },
      { nome: 'B', tipo: 'gema', raridade: 'raro', valor: 100 },
      { nome: 'C', tipo: 'pedra', raridade: 'comum', valor: 200 },
      { nome: 'D', tipo: 'reliquia', raridade: 'lendario', valor: 300 },
    ];
    expect(venderItensPorRaridade(s, 'comum')).toEqual({ itens: 2, ouro: 250 });
    expect(s.ouro).toBe(250);
    expect(s.inventario.itens.map((e) => e.nome)).toEqual(['B', 'D']);
    expect(s.inventario.reciclados).toBe(2);
    expect(s.inventario.ouroReciclado).toBe(250);
    expect(venderItensPorRaridade(s, 'comum')).toEqual({ itens: 0, ouro: 0 });
    expect(venderItensPorRaridade(s, 'mitico' as Raridade)).toEqual({
      itens: 0,
      ouro: 0,
    });
  });

  it('upgrade custa 600, adiciona 50 slots e para no teto', () => {
    const s = criarEstadoInicial();
    s.ouro = 1_000_000_000;
    expect(custoUpgradeInventario(s)).toBe(600);
    expect(melhorarInventario(s)).toBe(true);
    expect(s.inventario.capacidade).toBe(100);
    expect(custoUpgradeInventario(s)).toBe(930);
    for (let i = 0; i < 100; i++) melhorarInventario(s);
    expect(s.inventario.capacidade).toBe(INVENTARIO.slotsMax);
    expect(custoUpgradeInventario(s)).toBeNull();
    expect(melhorarInventario(s)).toBe(false);
  });

  it('não amplia a mochila sem ouro', () => {
    const s = criarEstadoInicial();
    s.ouro = 0;
    expect(melhorarInventario(s)).toBe(false);
    expect(s.inventario.capacidade).toBe(INVENTARIO.slotsIniciais);
  });

  it('sanitiza inventário corrompido e limita ao teto', () => {
    const inv = sanitizarInventario({
      capacidade: 1e9,
      autoReciclar: 'mitico',
      reciclados: Number.NaN,
      ouroReciclado: -5,
      semDrops: 999,
      itens: [
        { nome: '<b>Bom</b>', raridade: 'raro', valor: 12.9 },
        { nome: 'Ruim', raridade: 'mitico', valor: 10 },
        { nome: 'NaN', raridade: 'comum', valor: Number.NaN },
        'nope',
      ],
    });
    expect(inv.capacidade).toBe(INVENTARIO.slotsMax);
    expect(inv.autoReciclar).toBeNull();
    expect(inv.reciclados).toBe(0);
    expect(inv.ouroReciclado).toBe(0);
    expect(inv.semDrops).toBe(INVENTARIO.pitySemDrops);
    expect(inv.itens).toHaveLength(2);
    expect(inv.itens[0]).toEqual({
      nome: 'bBom/b',
      tipo: 'moeda',
      raridade: 'raro',
      valor: 12,
    });
    expect(inv.itens[0].nome).not.toContain('<');
    expect(inv.itens[0].nome).not.toContain('>');
    expect(inv.itens[1].valor).toBe(1);
  });

  it('migra inventário antigo e preserva itens válidos', () => {
    const s = migrarSave({
      inventario: {
        capacidade: 137,
        autoReciclar: 'raro',
        itens: [{ nome: 'Cristal', raridade: 'ultra', valor: 50 }],
      },
    });
    expect(s.inventario.capacidade).toBe(150);
    expect(s.inventario.autoReciclar).toBe('raro');
    expect(s.inventario.itens).toHaveLength(1);
    expect(s.inventario.itens[0].raridade).toBe('ultra');
    expect(s.inventario.itens[0].tipo).toBe('cristal');
  });

  it('renascer preserva a mochila e a configuração', () => {
    const s = criarEstadoInicial();
    s.lugar = 2;
    s.inventario.capacidade = 100;
    s.inventario.autoReciclar = 'comum';
    s.inventario.itens.push({
      nome: 'Relíquia dos deuses',
      tipo: 'reliquia',
      raridade: 'lendario',
      valor: 400,
    });
    expect(renascer(s).possivel).toBe(true);
    expect(s.inventario.itens).toHaveLength(1);
    expect(s.inventario.itens[0].raridade).toBe('lendario');
    expect(s.inventario.capacidade).toBe(100);
    expect(s.inventario.autoReciclar).toBe('comum');
  });

  it('valor do item cresce com tipo, raridade e estágio', () => {
    const comumNv1 = valorItem('moeda', 'comum', 1, 0, () => 0);
    const lendarioNv1 = valorItem('moeda', 'lendario', 1, 0, () => 0);
    const comumNv10 = valorItem('moeda', 'comum', 10, 3, () => 0);
    const gemaNv1 = valorItem('gema', 'comum', 1, 0, () => 0);
    expect(lendarioNv1).toBeGreaterThan(comumNv1);
    expect(comumNv10).toBeGreaterThan(comumNv1);
    expect(gemaNv1).toBeGreaterThan(comumNv1);
    expect(valorItem('moeda', 'comum', 1, 0, () => 0)).toBeLessThan(
      valorItem('moeda', 'comum', 1, 0, () => 0.999),
    );
  });

  it('definir auto-reciclagem rejeita raridade inválida', () => {
    const s = criarEstadoInicial();
    expect(definirAutoReciclar(s, 'lendario')).toBe(true);
    expect(s.inventario.autoReciclar).toBe('lendario');
    expect(definirAutoReciclar(s, 'mitico' as unknown as Raridade)).toBe(false);
    expect(s.inventario.autoReciclar).toBe('lendario');
    expect(definirAutoReciclar(s, null)).toBe(true);
    expect(s.inventario.autoReciclar).toBeNull();
  });
});

describe('reino idle — conquistas', () => {
  it('começa sem conquistas e com estatísticas zeradas', () => {
    const s = criarEstadoInicial();
    expect(s.conquistas).toEqual([]);
    expect(s.estatisticas.ouroTotal).toBe(0);
    expect(s.estatisticas.itensLendarios).toBe(0);
    expect(ORDEM_CONQUISTAS).toHaveLength(20);
    expect(Object.keys(CONQUISTAS)).toHaveLength(ORDEM_CONQUISTAS.length);
  });

  it('desbloqueia, paga recompensa e não repete', () => {
    const s = criarEstadoInicial();
    s.vitorias = 1;
    const ouroAntes = s.ouro;
    const novas = desbloquearConquistas(s);
    expect(novas.map((c) => c.id)).toContain('primeira-vitoria');
    expect(s.conquistas).toContain('primeira-vitoria');
    expect(s.ouro).toBe(ouroAntes + CONQUISTAS['primeira-vitoria'].ouro);
    expect(desbloquearConquistas(s)).toEqual([]);
    expect(s.ouro).toBe(ouroAntes + CONQUISTAS['primeira-vitoria'].ouro);
  });

  it('progresso usa estatísticas permanentes e skills mínimas', () => {
    const s = criarEstadoInicial();
    s.estatisticas.maiorLugar = 9;
    s.estatisticas.maiorNivel = 10;
    s.estatisticas.ouroTotal = 10000;
    s.estatisticas.itensLendarios = 1;
    for (const id of ORDEM_SKILLS) s.skills[id] = 2;
    s.skills.afiado = 3;
    expect(progressoConquista(s, 'conquistador')).toBe(9);
    expect(progressoConquista(s, 'rico')).toBe(10000);
    expect(progressoConquista(s, 'sortudo')).toBe(1);
    expect(progressoConquista(s, 'erudito')).toBe(2);
    const lista = listarConquistas(s);
    expect(lista.find((c) => c.id === 'aprendiz')?.desbloqueada).toBe(false);
    const novas = desbloquearConquistas(s);
    expect(novas.map((c) => c.id)).toContain('conquistador');
    expect(novas.map((c) => c.id)).toContain('rico');
    expect(novas.map((c) => c.id)).toContain('sortudo');
    expect(novas.map((c) => c.id)).not.toContain('erudito');
    expect(s.brasoes).toBe(CONQUISTAS.conquistador.brasoes);
  });

  it('migra estatísticas antigas e filtra conquistas inválidas', () => {
    const s = migrarSave({
      ouro: 1200,
      lugar: 4,
      nivel: 7,
      vitorias: 2,
      abates: 40,
      conquistas: ['primeira-vitoria', 'primeira-vitoria', 'inexistente'],
      estatisticas: { ouroTotal: -50, maiorNivel: 99, itensLendarios: 2 },
      inventario: {
        itens: [
          { nome: 'Relíquia', raridade: 'lendario', valor: 100 },
          { nome: 'Moeda', raridade: 'comum', valor: 5 },
        ],
        reciclados: 3,
      },
    });
    expect(s.conquistas).toEqual(['primeira-vitoria']);
    expect(s.estatisticas.maiorLugar).toBe(4);
    expect(s.estatisticas.maiorNivel).toBe(10);
    expect(s.estatisticas.bossesDerrotados).toBeGreaterThanOrEqual(4);
    expect(s.estatisticas.ouroTotal).toBeGreaterThanOrEqual(1200);
    expect(s.estatisticas.itensEncontrados).toBe(5);
    expect(s.estatisticas.itensLendarios).toBe(2);
    expect(desbloquearConquistas(s).map((c) => c.id)).toContain('explorador');
  });
});

describe('reino idle — missões diárias', () => {
  it('começa sem missões até a primeira data ser informada', () => {
    const s = criarEstadoInicial();
    expect(s.missoes.data).toBe('');
    expect(s.missoes.tipos).toEqual([]);
    expect(s.missoes.concluidas).toEqual([]);
    expect(s.missoes.bonusPago).toBe(false);
    expect(missoesConcluidas(s)).toBe(0);
  });

  it('sorteia 3 missões determinísticas e as mantém no mesmo dia', () => {
    const a = criarEstadoInicial();
    const b = criarEstadoInicial();
    expect(garantirMissoes(a, '2026-10-21')).toBe(true);
    expect(garantirMissoes(b, '2026-10-21')).toBe(true);
    expect(a.missoes.data).toBe('2026-10-21');
    expect(a.missoes.tipos).toHaveLength(3);
    expect(new Set(a.missoes.tipos).size).toBe(3);
    expect(a.missoes.tipos).toEqual(b.missoes.tipos);
    expect(garantirMissoes(a, '2026-10-21')).toBe(false);
  });

  it('reinicia progresso e conclusões quando o dia muda', () => {
    const s = criarEstadoInicial();
    garantirMissoes(s, '2026-10-21');
    const tipo = s.missoes.tipos[0]!;
    expect(registrarMissao(s, tipo, 3)).toBe(true);
    expect(s.missoes.progresso[tipo]).toBe(3);
    s.missoes.concluidas = [tipo];
    expect(garantirMissoes(s, '2026-10-22')).toBe(true);
    expect(s.missoes.data).toBe('2026-10-22');
    expect(s.missoes.tipos).toHaveLength(3);
    expect(s.missoes.concluidas).toEqual([]);
    expect(s.missoes.bonusPago).toBe(false);
    for (const t of s.missoes.tipos) expect(s.missoes.progresso[t]).toBe(0);
  });

  it('ignora missão inativa e limita o progresso à meta', () => {
    const s = criarEstadoInicial();
    garantirMissoes(s, '2026-10-21');
    const ativa = s.missoes.tipos[0]!;
    const inativa = (Object.keys(MISSOES) as Array<keyof typeof MISSOES>).find(
      (tipo) => !s.missoes.tipos.includes(tipo),
    );
    expect(inativa).toBeDefined();
    expect(registrarMissao(s, inativa!, 1)).toBe(false);
    expect(s.missoes.progresso[inativa!]).toBe(0);
    expect(registrarMissao(s, ativa, 9999)).toBe(true);
    expect(s.missoes.progresso[ativa]).toBe(MISSOES[ativa].meta);
    expect(registrarMissao(s, ativa, 1)).toBe(false);
  });

  it('paga cada missão e o bônus das 3 apenas uma vez', () => {
    const s = criarEstadoInicial();
    garantirMissoes(s, '2026-10-21');
    const ouroAntes = s.ouro;
    const brasoesAntes = s.brasoes;
    let premios = 0;
    for (const tipo of s.missoes.tipos) {
      premios += MISSOES[tipo].ouro;
      registrarMissao(s, tipo, MISSOES[tipo].meta);
    }
    const resultado = processarMissoes(s);
    expect(resultado.concluidas).toHaveLength(3);
    expect(resultado.bonus).toBe(true);
    expect(s.ouro).toBe(ouroAntes + premios + MISSOES_BONUS.ouro);
    expect(s.brasoes).toBe(brasoesAntes + MISSOES_BONUS.brasoes);
    expect(missoesConcluidas(s)).toBe(3);
    expect(processarMissoes(s)).toEqual({ concluidas: [], bonus: false });
    expect(s.ouro).toBe(ouroAntes + premios + MISSOES_BONUS.ouro);
  });

  it('sanitiza missões antigas/corrompidas no save', () => {
    const s = migrarSave({
      missoes: {
        data: '2026-10-21',
        tipos: ['abates', 'abates', 'bosses', 'inexistente'],
        progresso: { abates: 99999, bosses: -3, ouro: 123.9 },
        concluidas: ['abates', 'bosses', 'inexistente'],
        bonusPago: true,
      },
    });
    expect(s.missoes.tipos).toEqual(['abates', 'bosses']);
    expect(s.missoes.progresso.abates).toBe(MISSOES.abates.meta);
    expect(s.missoes.progresso.bosses).toBe(0);
    expect(s.missoes.progresso.ouro).toBe(123);
    expect(s.missoes.concluidas).toEqual(['abates', 'bosses']);
    expect(s.missoes.bonusPago).toBe(true);
  });
});
