# Cargo Fit

A mobile-first packing puzzle built as a data-driven game platform.

## Play loop

1. Select a cargo piece.
2. Rotate it when needed.
3. Drag it into the truck grid.
4. Pack every piece without overlap or rule violations.

The current build contains three complete sample levels:

- **First Delivery** validates the base packing loop.
- **Handle With Care** adds heavy and fragile cargo. Heavy cargo may not be placed above fragile cargo.
- **Turnaround** introduces a layout that requires deliberate rotation.

All levels include drag placement, rotation, rejection feedback, undo, restart, local save, completion flow, and next-level progression.

## Architecture

- `domain`: deterministic rules and state; no Phaser, DOM, storage, or network imports.
- `application`: semantic commands, undo orchestration, save triggering, level progression, and UI projections.
- `presentation`: Phaser scene, input translation, animation, labels, and feedback only.
- `infrastructure`: browser save adapter.
- `content`: versioned level, cargo, and rule definitions.
- `tooling`: deterministic content solver used as a release gate.

State changes enter through `PlaceCargo`, `RotateCargo`, `Undo`, `Restart`, and `NextLevel` commands. Placement rules are registered in the domain layer and selected by level data. The renderer reads projections and consumes events; animation never decides game results.

## Development

```bash
npm install
npm run dev
```

Verification:

```bash
npm test
npm run validate:content
npm run build
```

`validate:content` checks every registered level for schema errors and at least one reproducible completion path. CI blocks publication when a level is invalid or unsolvable.

## Current milestone

- [x] Real end-to-end base level
- [x] Pure domain model
- [x] Versioned level schema
- [x] Runtime content validation
- [x] Local save
- [x] Automated tests and CI
- [x] Second sample with fragile/heavy cargo rule
- [x] Rotation-focused third sample
- [x] Multi-level progression
- [x] Batch level solver and content release gate
- [ ] Asset registry and loading groups
- [ ] Market-ready art and sound pass
