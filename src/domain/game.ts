export type Rotation = 0 | 1 | 2 | 3;
export type CargoTrait = 'heavy' | 'fragile';
export type PlacementRuleType = 'NoHeavyAboveFragile';

export interface GridCell {
  readonly column: number;
  readonly row: number;
}

export interface CargoPrototype {
  readonly id: string;
  readonly cells: readonly GridCell[];
  readonly label: string;
  readonly color: number;
  readonly traits?: readonly CargoTrait[];
}

export interface CargoInstanceDefinition {
  readonly id: string;
  readonly prototypeId: string;
  readonly initialRotation?: Rotation;
}

export interface PlacementRuleDefinition {
  readonly id: string;
  readonly type: PlacementRuleType;
}

export interface LevelDefinition {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly title: string;
  readonly objective: string;
  readonly columns: number;
  readonly rows: number;
  readonly cargo: readonly CargoInstanceDefinition[];
  readonly prototypes: readonly CargoPrototype[];
  readonly rules: readonly PlacementRuleDefinition[];
}

export interface Placement {
  readonly column: number;
  readonly row: number;
}

export interface PieceState {
  readonly id: string;
  readonly prototypeId: string;
  readonly rotation: Rotation;
  readonly placement: Placement | null;
}

export interface GameSnapshot {
  readonly schemaVersion: 1;
  readonly levelId: string;
  readonly moveCount: number;
  readonly pieces: readonly PieceState[];
}

export type DomainEvent =
  | { readonly type: 'CargoPlaced'; readonly pieceId: string }
  | { readonly type: 'CargoRotated'; readonly pieceId: string }
  | { readonly type: 'MoveUndone' }
  | { readonly type: 'LevelRestarted' }
  | { readonly type: 'LevelChanged'; readonly levelId: string }
  | { readonly type: 'LevelCompleted'; readonly moveCount: number }
  | { readonly type: 'CommandRejected'; readonly reason: string };

export type GameCommand =
  | { readonly type: 'PlaceCargo'; readonly pieceId: string; readonly column: number; readonly row: number }
  | { readonly type: 'RotateCargo'; readonly pieceId: string }
  | { readonly type: 'Undo' }
  | { readonly type: 'Restart' }
  | { readonly type: 'NextLevel' };

interface OccupiedCell extends GridCell {
  readonly pieceId: string;
  readonly prototype: CargoPrototype;
}

type PlacementRuleValidator = (cells: readonly OccupiedCell[]) => string | null;

const placementRuleValidators: Record<PlacementRuleType, PlacementRuleValidator> = {
  NoHeavyAboveFragile: (cells) => {
    const heavyCells = cells.filter((cell) => cell.prototype.traits?.includes('heavy'));
    const fragileCells = cells.filter((cell) => cell.prototype.traits?.includes('fragile'));

    const unsafe = heavyCells.some((heavy) =>
      fragileCells.some((fragile) => heavy.column === fragile.column && heavy.row < fragile.row),
    );

    return unsafe ? 'Heavy cargo cannot be placed above fragile cargo.' : null;
  },
};

const normalizeCells = (cells: readonly GridCell[]): GridCell[] => {
  const minColumn = Math.min(...cells.map((cell) => cell.column));
  const minRow = Math.min(...cells.map((cell) => cell.row));
  return cells
    .map((cell) => ({ column: cell.column - minColumn, row: cell.row - minRow }))
    .sort((left, right) => left.row - right.row || left.column - right.column);
};

export const rotateCells = (cells: readonly GridCell[], rotation: Rotation): GridCell[] => {
  let result = normalizeCells(cells);
  for (let turn = 0; turn < rotation; turn += 1) {
    result = normalizeCells(result.map((cell) => ({ column: -cell.row, row: cell.column })));
  }
  return result;
};

export const validateLevel = (level: LevelDefinition): readonly string[] => {
  const errors: string[] = [];
  if (level.schemaVersion !== 1) errors.push('Unsupported level schema version.');
  if (!level.id.trim()) errors.push('Level id is required.');
  if (!level.title.trim()) errors.push('Level title is required.');
  if (level.columns <= 0 || level.rows <= 0) errors.push('Board dimensions must be positive.');

  const prototypeIds = new Set<string>();
  for (const prototype of level.prototypes) {
    if (prototypeIds.has(prototype.id)) errors.push(`Duplicate prototype id: ${prototype.id}`);
    prototypeIds.add(prototype.id);
    if (prototype.cells.length === 0) errors.push(`Prototype ${prototype.id} has no cells.`);
    if (new Set(prototype.traits).size !== (prototype.traits?.length ?? 0)) {
      errors.push(`Prototype ${prototype.id} has duplicate traits.`);
    }
    if (prototype.traits?.includes('heavy') && prototype.traits.includes('fragile')) {
      errors.push(`Prototype ${prototype.id} cannot be both heavy and fragile.`);
    }
  }

  const instanceIds = new Set<string>();
  let totalArea = 0;
  for (const piece of level.cargo) {
    if (instanceIds.has(piece.id)) errors.push(`Duplicate cargo id: ${piece.id}`);
    instanceIds.add(piece.id);
    const prototype = level.prototypes.find((candidate) => candidate.id === piece.prototypeId);
    if (!prototype) errors.push(`Cargo ${piece.id} references missing prototype ${piece.prototypeId}.`);
    else totalArea += prototype.cells.length;
  }

  const ruleIds = new Set<string>();
  for (const rule of level.rules) {
    if (ruleIds.has(rule.id)) errors.push(`Duplicate rule id: ${rule.id}`);
    ruleIds.add(rule.id);
    if (!(rule.type in placementRuleValidators)) errors.push(`Unsupported placement rule: ${String(rule.type)}`);
  }

  if (totalArea !== level.columns * level.rows) {
    errors.push(`Cargo area ${totalArea} does not match board area ${level.columns * level.rows}.`);
  }
  return errors;
};

export class GameState {
  private pieces: PieceState[];
  private moveCountValue: number;

  public constructor(private readonly level: LevelDefinition, snapshot?: GameSnapshot) {
    const errors = validateLevel(level);
    if (errors.length > 0) throw new Error(errors.join('\n'));

    this.pieces = snapshot
      ? snapshot.pieces.map((piece) => ({ ...piece, placement: piece.placement ? { ...piece.placement } : null }))
      : level.cargo.map((piece) => ({
          id: piece.id,
          prototypeId: piece.prototypeId,
          rotation: piece.initialRotation ?? 0,
          placement: null,
        }));
    this.moveCountValue = snapshot?.moveCount ?? 0;
  }

  public get moveCount(): number {
    return this.moveCountValue;
  }

  public getPiece(pieceId: string): PieceState {
    const piece = this.pieces.find((candidate) => candidate.id === pieceId);
    if (!piece) throw new Error(`Unknown cargo piece: ${pieceId}`);
    return { ...piece, placement: piece.placement ? { ...piece.placement } : null };
  }

  public listPieces(): readonly PieceState[] {
    return this.pieces.map((piece) => ({ ...piece, placement: piece.placement ? { ...piece.placement } : null }));
  }

  public getPrototype(prototypeId: string): CargoPrototype {
    const prototype = this.level.prototypes.find((candidate) => candidate.id === prototypeId);
    if (!prototype) throw new Error(`Unknown cargo prototype: ${prototypeId}`);
    return prototype;
  }

  public cellsFor(piece: PieceState): readonly GridCell[] {
    return rotateCells(this.getPrototype(piece.prototypeId).cells, piece.rotation);
  }

  public place(pieceId: string, placement: Placement): DomainEvent[] {
    const piece = this.getPiece(pieceId);
    const rejection = this.placementError(piece, placement);
    if (rejection) return [{ type: 'CommandRejected', reason: rejection }];

    this.replacePiece({ ...piece, placement: { ...placement } });
    this.moveCountValue += 1;
    const events: DomainEvent[] = [{ type: 'CargoPlaced', pieceId }];
    if (this.isComplete()) events.push({ type: 'LevelCompleted', moveCount: this.moveCountValue });
    return events;
  }

  public rotate(pieceId: string): DomainEvent[] {
    const piece = this.getPiece(pieceId);
    const nextRotation = ((piece.rotation + 1) % 4) as Rotation;
    const rotated = { ...piece, rotation: nextRotation };
    if (piece.placement) {
      const rejection = this.placementError(rotated, piece.placement);
      if (rejection) return [{ type: 'CommandRejected', reason: rejection }];
    }

    this.replacePiece(rotated);
    this.moveCountValue += 1;
    const events: DomainEvent[] = [{ type: 'CargoRotated', pieceId }];
    if (this.isComplete()) events.push({ type: 'LevelCompleted', moveCount: this.moveCountValue });
    return events;
  }

  public isComplete(): boolean {
    return this.pieces.every((piece) => piece.placement !== null);
  }

  public snapshot(): GameSnapshot {
    return {
      schemaVersion: 1,
      levelId: this.level.id,
      moveCount: this.moveCountValue,
      pieces: this.listPieces(),
    };
  }

  private placementError(piece: PieceState, placement: Placement): string | null {
    const candidate = { ...piece, placement: { ...placement } };
    const targetCells = this.cellsFor(candidate).map((cell) => ({
      column: placement.column + cell.column,
      row: placement.row + cell.row,
    }));

    if (targetCells.some((cell) => cell.column < 0 || cell.row < 0 || cell.column >= this.level.columns || cell.row >= this.level.rows)) {
      return 'Cargo must stay inside the truck.';
    }

    const occupied = new Set<string>();
    for (const other of this.pieces) {
      if (other.id === piece.id || !other.placement) continue;
      for (const cell of this.cellsFor(other)) {
        occupied.add(`${other.placement.column + cell.column}:${other.placement.row + cell.row}`);
      }
    }

    if (targetCells.some((cell) => occupied.has(`${cell.column}:${cell.row}`))) {
      return 'Cargo cannot overlap another item.';
    }

    const occupiedCells = this.occupiedCells(candidate);
    for (const rule of this.level.rules) {
      const rejection = placementRuleValidators[rule.type](occupiedCells);
      if (rejection) return rejection;
    }
    return null;
  }

  private occupiedCells(candidate: PieceState): readonly OccupiedCell[] {
    const pieces = this.pieces.map((piece) => (piece.id === candidate.id ? candidate : piece));
    return pieces.flatMap((piece) => {
      if (!piece.placement) return [];
      const prototype = this.getPrototype(piece.prototypeId);
      return this.cellsFor(piece).map((cell) => ({
        column: piece.placement!.column + cell.column,
        row: piece.placement!.row + cell.row,
        pieceId: piece.id,
        prototype,
      }));
    });
  }

  private replacePiece(next: PieceState): void {
    this.pieces = this.pieces.map((piece) => (piece.id === next.id ? next : piece));
  }
}
