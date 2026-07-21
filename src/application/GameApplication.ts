import type { DomainEvent, GameCommand, GameSnapshot, LevelDefinition } from '../domain/game';
import { GameState } from '../domain/game';
import type { SaveRepository } from '../infrastructure/save';

export interface GameProjection {
  readonly levelId: string;
  readonly columns: number;
  readonly rows: number;
  readonly moveCount: number;
  readonly complete: boolean;
  readonly pieces: ReturnType<GameState['listPieces']>;
}

export class GameApplication {
  private state: GameState;
  private readonly undoStack: GameSnapshot[] = [];

  public constructor(
    private readonly level: LevelDefinition,
    private readonly saves: SaveRepository,
  ) {
    const saved = saves.load(level.id);
    this.state = new GameState(level, saved?.levelId === level.id ? saved : undefined);
  }

  public execute(command: GameCommand): readonly DomainEvent[] {
    if (command.type === 'Undo') return this.undo();
    if (command.type === 'Restart') return this.restart();

    const previous = this.state.snapshot();
    const events = command.type === 'PlaceCargo'
      ? this.state.place(command.pieceId, { column: command.column, row: command.row })
      : this.state.rotate(command.pieceId);

    if (!events.some((event) => event.type === 'CommandRejected')) {
      this.undoStack.push(previous);
      this.saves.save(this.state.snapshot());
    }
    return events;
  }

  public projection(): GameProjection {
    return {
      levelId: this.level.id,
      columns: this.level.columns,
      rows: this.level.rows,
      moveCount: this.state.moveCount,
      complete: this.state.isComplete(),
      pieces: this.state.listPieces(),
    };
  }

  public cellsFor(pieceId: string) {
    const piece = this.state.getPiece(pieceId);
    return this.state.cellsFor(piece);
  }

  public prototypeFor(pieceId: string) {
    const piece = this.state.getPiece(pieceId);
    return this.state.getPrototype(piece.prototypeId);
  }

  private undo(): readonly DomainEvent[] {
    const snapshot = this.undoStack.pop();
    if (!snapshot) return [{ type: 'CommandRejected', reason: 'Nothing to undo yet.' }];
    this.state = new GameState(this.level, snapshot);
    this.saves.save(this.state.snapshot());
    return [{ type: 'MoveUndone' }];
  }

  private restart(): readonly DomainEvent[] {
    this.undoStack.length = 0;
    this.state = new GameState(this.level);
    this.saves.clear(this.level.id);
    return [{ type: 'LevelRestarted' }];
  }
}
