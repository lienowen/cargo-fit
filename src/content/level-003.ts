import type { CargoPrototype, LevelDefinition } from '../domain/game';
import { rectangle } from './shapes';

const prototypes: readonly CargoPrototype[] = [
  {
    id: 'cargo.bar.1x6',
    label: 'Full-length beam',
    color: 0x8b6ccf,
    cells: rectangle(1, 6),
  },
  {
    id: 'cargo.crate.3x2',
    label: 'Wide crate',
    color: 0x38a3a5,
    cells: rectangle(3, 2),
  },
];

export const level003: LevelDefinition = {
  schemaVersion: 1,
  id: 'level.003',
  title: 'Turnaround',
  objective: 'Rotate the long cargo to discover a complete fit.',
  columns: 6,
  rows: 6,
  prototypes,
  rules: [],
  cargo: [
    { id: 'beam.001', prototypeId: 'cargo.bar.1x6' },
    { id: 'beam.002', prototypeId: 'cargo.bar.1x6' },
    { id: 'wide.001', prototypeId: 'cargo.crate.3x2' },
    { id: 'wide.002', prototypeId: 'cargo.crate.3x2' },
    { id: 'wide.003', prototypeId: 'cargo.crate.3x2' },
    { id: 'wide.004', prototypeId: 'cargo.crate.3x2' },
  ],
};
