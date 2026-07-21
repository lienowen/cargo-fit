import type { GameSnapshot } from '../domain/game';

export interface SaveRepository {
  load(levelId: string): GameSnapshot | null;
  save(snapshot: GameSnapshot): void;
  clear(levelId: string): void;
}

export class LocalStorageSaveRepository implements SaveRepository {
  private readonly prefix = 'cargo-fit.save.';

  public load(levelId: string): GameSnapshot | null {
    try {
      const value = window.localStorage.getItem(this.prefix + levelId);
      return value ? (JSON.parse(value) as GameSnapshot) : null;
    } catch {
      return null;
    }
  }

  public save(snapshot: GameSnapshot): void {
    window.localStorage.setItem(this.prefix + snapshot.levelId, JSON.stringify(snapshot));
  }

  public clear(levelId: string): void {
    window.localStorage.removeItem(this.prefix + levelId);
  }
}
