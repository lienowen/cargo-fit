# Cargo Fit

A mobile-first packing puzzle built as the first vertical slice of a data-driven game platform.

## Play loop

1. Select a cargo piece.
2. Rotate it when needed.
3. Drag it into the truck grid.
4. Pack every piece without overlap.

The first level includes drag placement, rotation, rejection feedback, undo, restart, local save, and a completion screen.

## Architecture

- `domain`: deterministic rules and state; no Phaser, DOM, storage, or network imports.
- `application`: semantic commands, undo orchestration, save triggering, and UI projections.
- `presentation`: Phaser scene, input translation, animation, and feedback only.
- `infrastructure`: browser save adapter.
- `content`: versioned level and cargo definitions.

State changes enter through `PlaceCargo`, `RotateCargo`, `Undo`, and `Restart` commands. The renderer reads projections and consumes domain events; animation does not decide game results.

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

- [x] Real end-to-end level
- [x] Pure domain model
- [x] Versioned level schema
- [x] Runtime content validation
- [x] Local save
- [x] Automated tests and CI
- [ ] Second sample level with fragile/heavy cargo rule
- [ ] Asset registry and loading groups
- [ ] Batch level solver and content pipeline
