import { describe, expect, it } from 'vitest';
import { level001 } from '../src/content/level-001';
import { level002 } from '../src/content/level-002';
import { level003 } from '../src/content/level-003';
import { GameState, validateLevel } from '../src/domain/game';

describe('level content', () => {
  it('passes structural validation for every level', () => {
    expect(validateLevel(level001)).toEqual([]);
    expect(validateLevel(level002)).toEqual([]);
    expect(validateLevel(level003)).toEqual([]);
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

  it('completes the first deterministic solution', () => {
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

  it('rejects heavy cargo above fragile cargo without mutating state', () => {
    const game = new GameState(level002);
    game.place('heavy.001', { column: 0, row: 0 });
    const before = game.snapshot();
    const events = game.place('fragile.001', { column: 0, row: 2 });

    expect(events).toEqual([
      { type: 'CommandRejected', reason: 'Heavy cargo cannot be placed above fragile cargo.' },
    ]);
    expect(game.snapshot()).toEqual(before);
  });

  it('completes the fragile and heavy sample with a legal stack order', () => {
    const game = new GameState(level002);
    game.place('fragile.001', { column: 0, row: 0 });
    game.place('fragile.002', { column: 3, row: 0 });
    game.place('standard.001', { column: 0, row: 2 });
    game.place('standard.002', { column: 3, row: 2 });
    game.place('heavy.001', { column: 0, row: 4 });
    const events = game.place('heavy.002', { column: 3, row: 4 });

    expect(game.isComplete()).toBe(true);
    expect(events.at(-1)).toEqual({ type: 'LevelCompleted', moveCount: 6 });
  });

  it('completes the rotation sample with deterministic turns', () => {
    const game = new GameState(level003);
    game.place('beam.001', { column: 0, row: 0 });
    game.place('beam.002', { column: 5, row: 0 });

    for (const pieceId of ['wide.001', 'wide.002', 'wide.003', 'wide.004']) {
      game.rotate(pieceId);
    }
    game.place('wide.001', { column: 1, row: 0 });
    game.place('wide.002', { column: 3, row: 0 });
    game.place('wide.003', { column: 1, row: 3 });
    const events = game.place('wide.004', { column: 3, row: 3 });

    expect(game.isComplete()).toBe(true);
    expect(events.at(-1)).toEqual({ type: 'LevelCompleted', moveCount: 10 });
  });
});
