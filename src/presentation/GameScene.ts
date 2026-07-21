import Phaser from 'phaser';
import type { GameApplication, GameProjection } from '../application/GameApplication';
import type { DomainEvent } from '../domain/game';

interface PieceView {
  readonly container: Phaser.GameObjects.Container;
  readonly pieceId: string;
}

export class GameScene extends Phaser.Scene {
  private readonly boardX = 141;
  private readonly boardY = 172;
  private readonly cellSize = 78;
  private readonly trayScale = 0.43;
  private readonly pieceViews = new Map<string, PieceView>();
  private selectedPieceId: string | null = null;
  private moveText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private boardGraphics: Phaser.GameObjects.Graphics | null = null;
  private renderedLevelId: string | null = null;
  private victoryOverlay: Phaser.GameObjects.Container | null = null;

  public constructor(private readonly app: GameApplication) {
    super('Game');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor(0x162033);
    this.add.text(375, 40, 'CARGO FIT', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '44px',
      color: '#f8fafc',
      stroke: '#0b1220',
      strokeThickness: 8,
    }).setOrigin(0.5);

    this.levelText = this.add.text(375, 88, '', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '23px',
      color: '#7dd3fc',
    }).setOrigin(0.5);
    this.objectiveText = this.add.text(375, 118, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '19px',
      color: '#a8b4c8',
      align: 'center',
      wordWrap: { width: 650 },
    }).setOrigin(0.5, 0);

    this.moveText = this.add.text(40, 810, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#f8fafc',
    });
    this.statusText = this.add.text(375, 790, 'Select cargo, rotate it, then drag it into the truck.', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#b8c6da',
      align: 'center',
      wordWrap: { width: 620 },
    }).setOrigin(0.5, 0);

    this.createButton(86, 1240, 188, 'ROTATE', () => this.rotateSelected());
    this.createButton(281, 1240, 188, 'UNDO', () => this.handle(this.app.execute({ type: 'Undo' })));
    this.createButton(476, 1240, 188, 'RESTART', () => this.handle(this.app.execute({ type: 'Restart' })));
    this.renderFromProjection();
  }

  private drawBoard(): void {
    const projection = this.app.projection();
    this.boardGraphics?.destroy();
    const graphics = this.add.graphics();
    graphics.fillStyle(0x0b1220, 1);
    graphics.fillRoundedRect(
      this.boardX - 18,
      this.boardY - 18,
      projection.columns * this.cellSize + 36,
      projection.rows * this.cellSize + 36,
      24,
    );
    graphics.fillStyle(0x26354e, 1);
    graphics.fillRect(this.boardX, this.boardY, projection.columns * this.cellSize, projection.rows * this.cellSize);
    graphics.lineStyle(2, 0x425270, 1);
    for (let column = 0; column <= projection.columns; column += 1) {
      graphics.lineBetween(
        this.boardX + column * this.cellSize,
        this.boardY,
        this.boardX + column * this.cellSize,
        this.boardY + projection.rows * this.cellSize,
      );
    }
    for (let row = 0; row <= projection.rows; row += 1) {
      graphics.lineBetween(
        this.boardX,
        this.boardY + row * this.cellSize,
        this.boardX + projection.columns * this.cellSize,
        this.boardY + row * this.cellSize,
      );
    }
    graphics.setDepth(-1);
    this.boardGraphics = graphics;
  }

  private renderFromProjection(): void {
    const projection = this.app.projection();
    if (projection.levelId !== this.renderedLevelId) {
      this.renderedLevelId = projection.levelId;
      this.selectedPieceId = null;
      this.drawBoard();
    }

    this.levelText.setText(`LEVEL ${projection.levelNumber}/${projection.levelCount} · ${projection.title.toUpperCase()}`);
    this.objectiveText.setText(projection.objective);
    this.moveText.setText(`MOVES  ${projection.moveCount}`);
    this.pieceViews.forEach((view) => view.container.destroy());
    this.pieceViews.clear();

    const unplaced = projection.pieces.filter((piece) => !piece.placement);
    const trayPositions = [
      { x: 76, y: 900 }, { x: 285, y: 900 }, { x: 494, y: 900 },
      { x: 76, y: 1060 }, { x: 285, y: 1060 }, { x: 494, y: 1060 },
    ];

    for (const piece of projection.pieces) {
      const container = this.createPiece(piece.id);
      if (piece.placement) {
        container.setScale(1);
        container.setPosition(
          this.boardX + piece.placement.column * this.cellSize,
          this.boardY + piece.placement.row * this.cellSize,
        );
      } else {
        const trayIndex = unplaced.findIndex((candidate) => candidate.id === piece.id);
        const position = trayPositions[trayIndex] ?? trayPositions[0];
        if (!position) throw new Error('Missing tray position.');
        container.setScale(this.trayScale);
        container.setPosition(position.x, position.y);
      }
      this.pieceViews.set(piece.id, { container, pieceId: piece.id });
    }

    if (projection.complete) this.showVictory(projection);
    else this.hideVictory();
  }

  private createPiece(pieceId: string): Phaser.GameObjects.Container {
    const cells = this.app.cellsFor(pieceId);
    const prototype = this.app.prototypeFor(pieceId);
    const width = (Math.max(...cells.map((cell) => cell.column)) + 1) * this.cellSize;
    const height = (Math.max(...cells.map((cell) => cell.row)) + 1) * this.cellSize;
    const container = this.add.container(0, 0);
    const graphics = this.add.graphics();

    for (const cell of cells) {
      const x = cell.column * this.cellSize;
      const y = cell.row * this.cellSize;
      graphics.fillStyle(prototype.color, 1);
      graphics.fillRoundedRect(x + 4, y + 4, this.cellSize - 8, this.cellSize - 8, 10);
      graphics.lineStyle(3, 0xffffff, 0.25);
      graphics.strokeRoundedRect(x + 8, y + 8, this.cellSize - 16, this.cellSize - 16, 8);
      graphics.lineStyle(3, 0x000000, 0.18);
      graphics.lineBetween(x + 18, y + 18, x + this.cellSize - 18, y + this.cellSize - 18);
      graphics.lineBetween(x + this.cellSize - 18, y + 18, x + 18, y + this.cellSize - 18);
    }

    container.add(graphics);
    const traits = prototype.traits ?? [];
    if (traits.length > 0) {
      const badgeWidth = Math.min(width - 20, 180);
      const badge = this.add.rectangle(width / 2, height / 2, badgeWidth, 42, 0x08101f, 0.8)
        .setStrokeStyle(2, 0xffffff, 0.35);
      const badgeText = this.add.text(width / 2, height / 2, traits.join(' + ').toUpperCase(), {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '22px',
        color: '#ffffff',
      }).setOrigin(0.5);
      container.add([badge, badgeText]);
    }

    container.setSize(width, height);
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
    this.input.setDraggable(container);

    container.on('pointerdown', () => {
      this.selectedPieceId = pieceId;
      this.statusText.setText(`${prototype.label} selected.`);
      container.setDepth(20);
    });
    container.on('dragstart', () => {
      container.setScale(1);
      container.setDepth(30);
    });
    container.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      container.setPosition(dragX, dragY);
    });
    container.on('dragend', () => {
      const column = Math.round((container.x - this.boardX) / this.cellSize);
      const row = Math.round((container.y - this.boardY) / this.cellSize);
      this.handle(this.app.execute({ type: 'PlaceCargo', pieceId, column, row }));
    });
    return container;
  }

  private rotateSelected(): void {
    if (!this.selectedPieceId) {
      this.statusText.setText('Select cargo first.');
      return;
    }
    this.handle(this.app.execute({ type: 'RotateCargo', pieceId: this.selectedPieceId }));
  }

  private handle(events: readonly DomainEvent[]): void {
    const rejection = events.find((event) => event.type === 'CommandRejected');
    if (rejection?.type === 'CommandRejected') {
      this.statusText.setText(rejection.reason);
      this.cameras.main.shake(120, 0.004);
    } else if (events.some((event) => event.type === 'LevelChanged')) {
      this.statusText.setText('New delivery loaded.');
    } else if (events.some((event) => event.type === 'LevelCompleted')) {
      this.statusText.setText('Perfect fit!');
    } else {
      this.statusText.setText('Good move. Keep packing.');
    }
    this.renderFromProjection();
  }

  private createButton(x: number, y: number, width: number, label: string, onClick: () => void): void {
    const background = this.add.rectangle(x, y, width, 66, 0x31476b)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x7890b8);
    const text = this.add.text(x + width / 2, y + 33, label, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '22px',
      color: '#f8fafc',
    }).setOrigin(0.5);
    background.setInteractive({ useHandCursor: true });
    background.on('pointerover', () => background.setFillStyle(0x3d5a88));
    background.on('pointerout', () => background.setFillStyle(0x31476b));
    background.on('pointerdown', onClick);
    text.setDepth(background.depth + 1);
  }

  private showVictory(projection: GameProjection): void {
    if (this.victoryOverlay) return;
    const shade = this.add.rectangle(0, 0, 750, 1334, 0x08101f, 0.78).setOrigin(0);
    const panel = this.add.rectangle(375, 610, 570, 350, 0x22314b, 1).setStrokeStyle(4, 0x63c174);
    const title = this.add.text(375, 515, 'PERFECT FIT!', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '48px',
      color: '#f8fafc',
    }).setOrigin(0.5);
    const detail = this.add.text(375, 600, `Truck packed in ${projection.moveCount} moves`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '26px',
      color: '#b9e7c4',
    }).setOrigin(0.5);
    const actionLabel = projection.hasNextLevel ? 'NEXT LEVEL' : 'PLAY AGAIN';
    const action = this.add.rectangle(375, 705, 270, 70, 0x63c174)
      .setStrokeStyle(2, 0xffffff, 0.4)
      .setInteractive({ useHandCursor: true });
    const actionText = this.add.text(375, 705, actionLabel, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '22px',
      color: '#102018',
    }).setOrigin(0.5);
    action.on('pointerdown', () => {
      const command = projection.hasNextLevel ? { type: 'NextLevel' as const } : { type: 'Restart' as const };
      this.handle(this.app.execute(command));
    });
    this.victoryOverlay = this.add.container(0, 0, [shade, panel, title, detail, action, actionText]).setDepth(100);
  }

  private hideVictory(): void {
    this.victoryOverlay?.destroy();
    this.victoryOverlay = null;
  }
}
