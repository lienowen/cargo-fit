import { describe, expect, it } from 'vitest';
import { levels } from '../src/content/levels';
import { validateLevel } from '../src/domain/game';
import { solveLevel } from '../src/tooling/solveLevel';

describe('content pipeline', () => {
  for (const level of levels) {
    it(`${level.id} passes schema and solvability gates`, () => {
      expect(validateLevel(level)).toEqual([]);
      const solution = solveLevel(level);
      expect(solution, `${level.id} should have at least one completion path`).not.toBeNull();
      expect(solution?.steps).toHaveLength(level.cargo.length);
    });
  }
});
