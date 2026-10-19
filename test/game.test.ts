import { describe, expect, it } from 'vitest';
import {
  EQUIPS,
  MAX_LUGAR,
  MAX_SKILL,
  MAX_TIER,
  ORDEM_SKILLS,
  ORDEM_SLOTS,
  SKILLS,
  avancarNivel,
  calcularGanhoOffline,
  comprarEquip,
  comprarSkill,
  criarEstadoInicial,
  custoEquip,
  gerarHorda,
  lugarDe,
  migrarSave,
  parametrosCombate,
  poderCavaleiro,
  simularHorda,
} from '../src/core/index.js';

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
    expect(lugarDe(2).nome).toBe('Campo Verde');
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
});
