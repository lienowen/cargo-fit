import type { DomainEvent, GameCommand, GameSnapshot, LevelDefinition } from '../domain/game';
import { GameState } from '../domain/game';
import type { SaveRepository } from '../infrastructure/save';

export interface GameProjection {
  readonly levelId: string;
  readonly levelNumber: number;
  readonly levelCount: number;
  readonly title: string;
  readonly objective: string;
  readonly columns: number;
  readonly rows: number;
  readonly moveCount: number;
  readonly complete: boolean;
  readonly hasNextLevel: boolean;
  readonly pieces: ReturnType<GameState['listPieces']>;
}

export class GameApplication {
  private readonly levels: readonly LevelDefinition[];
  private levelIndex = 0;
  private state: GameState;
  private readonly undoStack: GameSnapshot[] = [];

  public constructor(
    levelOrLevels: LevelDefinition | readonly LevelDefinition[],
    private readonly saves: SaveRepository,
  ) {
    this.levels = Array.isArray(levelOrLevels) ? levelOrLevels : [levelOrLevels];
    const firstLevel = this.levels[0];
    if (!firstLevel) throw new Error('At least one level is required.');
    this.state = this.loadState(firstLevel);
  }

  public execute(command: GameCommand): readonly DomainEvent[] {
    if (command.type === 'Undo') return this.undo();
    if (command.type === 'Restart') return this.restart();
    if (command.type === 'NextLevel') return this.nextLevel();

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
    const level = this.currentLevel();
    return {
      levelId: level.id,
      levelNumber: this.levelIndex + 1,
      levelCount: this.levels.length,
      title: level.title,
      objective: level.objective,
      columns: level.columns,
      rows: level.rows,
      moveCount: this.state.moveCount,
      complete: this.state.isComplete(),
      hasNextLevel: this.levelIndex < this.levels.length - 1,
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

  private currentLevel(): LevelDefinition {
    const level = this.levels[this.levelIndex];
    if (!level) throw new Error(`Missing level at index ${this.levelIndex}.`);
    return level;
  }

  private loadState(level: LevelDefinition): GameState {
    const saved = this.saves.load(level.id);
    return new GameState(level, saved?.levelId === level.id ? saved : undefined);
  }

  private undo(): readonly DomainEvent[] {
    const snapshot = this.undoStack.pop();
    if (!snapshot) return [{ type: 'CommandRejected', reason: 'Nothing to undo yet.' }];
    this.state = new GameState(this.currentLevel(), snapshot);
    this.saves.save(this.state.snapshot());
    return [{ type: 'MoveUndone' }];
  }

  private restart(): readonly DomainEvent[] {
    const level = this.currentLevel();
    this.undoStack.length = 0;
    this.state = new GameState(level);
    this.saves.clear(level.id);
    return [{ type: 'LevelRestarted' }];
  }

  private nextLevel(): readonly DomainEvent[] {
    if (!this.state.isComplete()) {
      return [{ type: 'CommandRejected', reason: 'Complete this truck before moving on.' }];
    }
    if (this.levelIndex >= this.levels.length - 1) {
      return [{ type: 'CommandRejected', reason: 'Every available level is complete.' }];
    }

    this.levelIndex += 1;
    this.undoStack.length = 0;
    const level = this.currentLevel();
    this.state = this.loadState(level);
    return [{ type: 'LevelChanged', levelId: level.id }];
  }
}
