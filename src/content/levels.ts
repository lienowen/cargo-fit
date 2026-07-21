import type { LevelDefinition } from '../domain/game';
import { level001 } from './level-001';
import { level002 } from './level-002';
import { level003 } from './level-003';

export const levels: readonly LevelDefinition[] = [level001, level002, level003];
