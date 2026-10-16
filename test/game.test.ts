import { describe, expect, it } from 'vitest';
import {
  EQUIPS,
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

  it('todas as peças e skills têm definição válida', () => {
    for (const slot of ORDEM_SLOTS) {
      expect(EQUIPS[slot].tiers).toHaveLength(MAX_TIER + 1);
      expect(EQUIPS[slot].tiers[0].custo).toBe(0);
    }
    expect(Object.keys(SKILLS)).toHaveLength(ORDEM_SKILLS.length);
    expect(MAX_SKILL).toBe(5);
  });
});
