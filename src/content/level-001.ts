import type { CargoPrototype, LevelDefinition } from '../domain/game';
import { rectangle } from './shapes';

const prototypes: readonly CargoPrototype[] = [
  { id: 'cargo.crate.3x4', label: 'Large crate', color: 0xe58f3c, cells: rectangle(3, 4) },
  { id: 'cargo.crate.2x4', label: 'Long crate', color: 0x4d9de0, cells: rectangle(2, 4) },
  { id: 'cargo.crate.2x2', label: 'Small crate', color: 0x63c174, cells: rectangle(2, 2) },
];

export const level001: LevelDefinition = {
  schemaVersion: 1,
  id: 'level.001',
  title: 'First Delivery',
  objective: 'Pack every crate into the truck without overlap.',
  columns: 6,
  rows: 8,
  prototypes,
  rules: [],
  cargo: [
    { id: 'cargo.001', prototypeId: 'cargo.crate.3x4' },
    { id: 'cargo.002', prototypeId: 'cargo.crate.3x4' },
    { id: 'cargo.003', prototypeId: 'cargo.crate.2x4' },
    { id: 'cargo.004', prototypeId: 'cargo.crate.2x4' },
    { id: 'cargo.005', prototypeId: 'cargo.crate.2x2' },
    { id: 'cargo.006', prototypeId: 'cargo.crate.2x2' },
  ],
};
