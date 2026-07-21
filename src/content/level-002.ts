import type { CargoPrototype, LevelDefinition } from '../domain/game';
import { rectangle } from './shapes';

const prototypes: readonly CargoPrototype[] = [
  {
    id: 'cargo.heavy.3x2',
    label: 'Heavy machinery',
    color: 0xb44d4d,
    cells: rectangle(3, 2),
    traits: ['heavy'],
  },
  {
    id: 'cargo.fragile.3x2',
    label: 'Fragile glass',
    color: 0xe4bd52,
    cells: rectangle(3, 2),
    traits: ['fragile'],
  },
  {
    id: 'cargo.standard.3x2',
    label: 'Standard supplies',
    color: 0x4d9de0,
    cells: rectangle(3, 2),
  },
];

export const level002: LevelDefinition = {
  schemaVersion: 1,
  id: 'level.002',
  title: 'Handle With Care',
  objective: 'Fragile cargo must stay above heavy cargo.',
  columns: 6,
  rows: 6,
  prototypes,
  rules: [
    { id: 'rule.no-heavy-above-fragile', type: 'NoHeavyAboveFragile' },
  ],
  cargo: [
    { id: 'fragile.001', prototypeId: 'cargo.fragile.3x2' },
    { id: 'fragile.002', prototypeId: 'cargo.fragile.3x2' },
    { id: 'standard.001', prototypeId: 'cargo.standard.3x2' },
    { id: 'standard.002', prototypeId: 'cargo.standard.3x2' },
    { id: 'heavy.001', prototypeId: 'cargo.heavy.3x2' },
    { id: 'heavy.002', prototypeId: 'cargo.heavy.3x2' },
  ],
};
