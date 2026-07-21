import Phaser from 'phaser';
import './style.css';
import { GameApplication } from './application/GameApplication';
import { levels } from './content/levels';
import { LocalStorageSaveRepository } from './infrastructure/save';
import { GameScene } from './presentation/GameScene';

const application = new GameApplication(levels, new LocalStorageSaveRepository());

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
