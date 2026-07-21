# Cargo Fit

A mobile-first packing puzzle built as a data-driven game platform.

## Play loop

1. Select a cargo piece.
2. Rotate it when needed.
3. Drag it into the truck grid.
4. Pack every piece without overlap or rule violations.

The current build contains two complete sample levels:

- **First Delivery** validates the base packing loop.
- **Handle With Care** adds heavy and fragile cargo. Heavy cargo may not be placed above fragile cargo.

Both levels include drag placement, rotation, rejection feedback, undo, restart, local save, completion flow, and next-level progression.

## Architecture

- `domain`: deterministic rules and state; no Phaser, DOM, storage, or network imports.
- `application`: semantic commands, undo orchestration, save triggering, level progression, and UI projections.
- `presentation`: Phaser scene, input translation, animation, labels, and feedback only.
- `infrastructure`: browser save adapter.
- `content`: versioned level, cargo, and rule definitions.

State changes enter through `PlaceCargo`, `RotateCargo`, `Undo`, `Restart`, and `NextLevel` commands. Placement rules are registered in the domain layer and selected by level data. The renderer reads projections and consumes events; animation never decides game results.

## Development

```bash
npm install
npm run dev
```

Verification:

```bash
npm test
npm run build
```

## Current milestone

- [x] Real end-to-end base level
- [x] Pure domain model
- [x] Versioned level schema
- [x] Runtime content validation
- [x] Local save
- [x] Automated tests and CI
- [x] Second sample with fragile/heavy cargo rule
- [x] Multi-level progression
- [ ] Asset registry and loading groups
- [ ] Batch level solver and content pipeline
- [ ] Market-ready art and sound pass
