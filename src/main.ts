import Phaser from 'phaser';
import './style.css';
import { GameApplication } from './application/GameApplication';
import { level001 } from './content/level-001';
import { LocalStorageSaveRepository } from './infrastructure/save';
import { GameScene } from './presentation/GameScene';

const application = new GameApplication(level001, new LocalStorageSaveRepository());

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-root',
  width: 750,
  height: 1334,
  backgroundColor: '#162033',
  scene: [new GameScene(application)],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
});
