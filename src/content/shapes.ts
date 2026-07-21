import type { GridCell } from '../domain/game';

export const rectangle = (columns: number, rows: number): readonly GridCell[] =>
  Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => ({ column, row })),
  ).flat();
