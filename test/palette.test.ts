import { describe, expect, it } from 'vitest';
import { CORES_VALIDAS, PALETA, SPEC, validarCores, validarSprite } from '../src/render/palette.js';
import { desenharSpriteMatriz } from '../src/render/pixel.js';
import { TIPOS } from '../src/render/sprites/index.js';
import { biomaPorLugar } from '../src/engine/scenario.js';

describe('reformulação sprites — paleta e matriz', () => {
  it('paleta sem duplicatas e com o essencial', () => {
    const vals = Object.values(PALETA).map((c) => c.toLowerCase());
    expect(new Set(vals).size).toBe(vals.length);
    for (const k of ['pele', 'aco', 'ouro', 'madeira', 'olho'] as const) {
      expect(PALETA[k]).toMatch(/^#[0-9a-f]{6}$/i);
    }
    expect(CORES_VALIDAS.size).toBeGreaterThanOrEqual(30);
  });

  it('spec travado: grade, luz do topo, 6 slots × 4 tiers', () => {
    expect(SPEC.luz).toBe('topo');
    expect(SPEC.slots).toHaveLength(6);
    expect(SPEC.tiersPorSlot).toBe(4);
  });

  it('TIPOS de monstro só usam cores da paleta', () => {
    for (const t of TIPOS) {
      const r = validarCores([t.pele, t.roupa]);
      expect(r.coresIntrusas).toEqual([]);
    }
  });

  it('matriz renderiza via fillRect arredondado e validador acusa intrusa', () => {
    const calls: Array<[number, number, number, number]> = [];
    const ctx = {
      fillStyle: '',
      fillRect: (x: number, y: number, w: number, h: number) => calls.push([x, y, w, h]),
    };
    const box = desenharSpriteMatriz(ctx, ['.XX.', 'XXXX'], { X: PALETA.vermelho }, 1.6, 2.4, 3);
    expect(box).toEqual({ w: 4 * 3, h: 2 * 3 });
    // 2 + 4 pixels sólidos
    expect(calls).toHaveLength(6);
    expect(calls[0][0]).toBe(Math.round(1.6 + 1 * 3));

    const ok = validarSprite(['.XX.', 'XXXX'], { X: PALETA.vermelho });
    expect(ok.ok).toBe(true);
    expect(ok.orfaos).toBe(0);

    const ruim = validarSprite(['X..', '...'], { X: '#123456' });
    expect(ruim.ok).toBe(false);
    expect(ruim.coresIntrusas).toEqual(['#123456']);
    expect(ruim.orfaos).toBe(1); // pixel isolado
  });

  it('biomas resolvem volta corretamente', () => {
    expect(biomaPorLugar(0, 'campo').volta).toBe(1);
    expect(biomaPorLugar(8, 'cidadela').volta).toBe(1);
    expect(biomaPorLugar(9, 'campo').volta).toBe(2);
    expect(biomaPorLugar(18, 'campo').volta).toBe(3);
    expect(biomaPorLugar(1, 'floresta').nome).toBe('Floresta Sombria');
    expect(biomaPorLugar(8, 'cidadela').nome).toBe('Cidadela Celeste');
  });
});
