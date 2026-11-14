import Phaser from 'phaser';
import { State } from '../systems/state.js';
import { CHARS } from '../config/chars.js';
import { portrait } from '../utils/art.js';
import { menuList, F, box } from '../utils/menulist.js';

export default class Select extends Phaser.Scene {
  constructor() { super('Select'); }
  create() {
    const s = this, W = 960;
    s.cameras.main.setBackgroundColor('#120d24'); s.cameras.main.fadeIn(400);
    s.add.text(W / 2, 50, 'Escolha seu personagem', { fontFamily: F, fontSize: '32px', color: '#f4d27a', fontStyle: 'bold' }).setOrigin(0.5);
    const info = { samuel: 'Engraçado, extrovertido e romântico.', maria: 'Estudiosa, introvertida e engraçada.' };
    ['samuel', 'maria'].forEach((id, i) => {
      const x = 300 + i * 360, g = s.add.graphics(); box(g, x - 140, 90, 280, 290);
      s.add.image(x, 235, portrait(s, id, 'happy')).setScale(4);
      s.add.text(x, 400, info[id], { fontFamily: F, fontSize: '14px', color: '#c8bfe8', align: 'center', wordWrap: { width: 270 } }).setOrigin(0.5, 0);
    });
    menuList(s, ['samuel', 'maria'].map((id, i) => ({ x: 300 + i * 360, y: 470, t: 'Jogar como ' + CHARS[id].name, fn: () => { State.heroPick = id; s.scene.start('Customize', { hero: id }); } })), { w: 300 });
  }
}
