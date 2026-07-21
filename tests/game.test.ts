import { describe, expect, it } from 'vitest';
import { level001 } from '../src/content/level-001';
import { GameState, validateLevel } from '../src/domain/game';

describe('level content', () => {
  it('passes structural validation', () => {
    expect(validateLevel(level001)).toEqual([]);
  });
});

describe('cargo placement domain', () => {
  it('rejects overlapping cargo without changing the state', () => {
    const game = new GameState(level001);
    game.place('cargo.001', { column: 0, row: 0 });
    const before = game.snapshot();
    const events = game.place('cargo.002', { column: 1, row: 1 });

    expect(events[0]?.type).toBe('CommandRejected');
    expect(game.snapshot()).toEqual(before);
  });

  it('completes a known deterministic solution', () => {
    const game = new GameState(level001);
    game.place('cargo.001', { column: 0, row: 0 });
    game.place('cargo.002', { column: 3, row: 0 });
    game.place('cargo.003', { column: 0, row: 4 });
    game.place('cargo.004', { column: 2, row: 4 });
    game.place('cargo.005', { column: 4, row: 4 });
    const events = game.place('cargo.006', { column: 4, row: 6 });

    expect(game.isComplete()).toBe(true);
    expect(events.at(-1)).toEqual({ type: 'LevelCompleted', moveCount: 6 });
  });
});
