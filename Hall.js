import Phaser from 'phaser';
import { makeWorld, makeWorld2, makeWorld3, makeWorld4, makeWorld5, makeWorld6, makeWorld7, makeWorld8 } from '../utils/art.js';
export default class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() { makeWorld(this); makeWorld2(this); makeWorld3(this); makeWorld4(this); makeWorld5(this); makeWorld6(this); makeWorld7(this); makeWorld8(this); this.scene.launch('UI'); this.scene.start('Menu'); }
}
