import type { GameSnapshot, LevelDefinition, Rotation } from '../domain/game';
import { GameState, rotateCells } from '../domain/game';

export interface SolutionStep {
  readonly pieceId: string;
  readonly rotation: Rotation;
  readonly column: number;
  readonly row: number;
}

export interface SolveResult {
  readonly steps: readonly SolutionStep[];
  readonly visitedNodes: number;
}

const uniqueRotations = (level: LevelDefinition, prototypeId: string): readonly Rotation[] => {
  const prototype = level.prototypes.find((candidate) => candidate.id === prototypeId);
  if (!prototype) return [];

  const seen = new Set<string>();
  const rotations: Rotation[] = [];
  for (const rotation of [0, 1, 2, 3] as const) {
    const signature = rotateCells(prototype.cells, rotation)
      .map((cell) => `${cell.column}:${cell.row}`)
      .join('|');
    if (!seen.has(signature)) {
      seen.add(signature);
      rotations.push(rotation);
    }
  }
  return rotations;
};

const withRotation = (snapshot: GameSnapshot, pieceId: string, rotation: Rotation): GameSnapshot => ({
  ...snapshot,
  pieces: snapshot.pieces.map((piece) => piece.id === pieceId ? { ...piece, rotation } : piece),
});

export const solveLevel = (level: LevelDefinition, maxNodes = 100_000): SolveResult | null => {
  const initial = new GameState(level).snapshot();
  let visitedNodes = 0;

  const search = (snapshot: GameSnapshot, steps: readonly SolutionStep[]): readonly SolutionStep[] | null => {
    visitedNodes += 1;
    if (visitedNodes > maxNodes) return null;

    const piece = snapshot.pieces.find((candidate) => candidate.placement === null);
    if (!piece) return steps;

    for (const rotation of uniqueRotations(level, piece.prototypeId)) {
      const rotatedSnapshot = withRotation(snapshot, piece.id, rotation);
      for (let row = 0; row < level.rows; row += 1) {
        for (let column = 0; column < level.columns; column += 1) {
          const candidate = new GameState(level, rotatedSnapshot);
          const events = candidate.place(piece.id, { column, row });
          if (events.some((event) => event.type === 'CommandRejected')) continue;

          const step: SolutionStep = { pieceId: piece.id, rotation, column, row };
          const result = search(candidate.snapshot(), [...steps, step]);
          if (result) return result;
        }
      }
    }
    return null;
  };

  const steps = search(initial, []);
  return steps ? { steps, visitedNodes } : null;
};
