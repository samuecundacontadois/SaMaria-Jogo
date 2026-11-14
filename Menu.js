import Phaser from 'phaser';
import { State } from '../systems/state.js';
import { CHARS, HS, HS_N, SHIRTS, PANTS, SHOES } from '../config/chars.js';
import { charSheet, portrait } from '../utils/art.js';
import { F, box } from '../utils/menulist.js';

const cyc = (a, v, d) => a[(a.indexOf(v) + d + a.length) % a.length];
export default class Customize extends Phaser.Scene {
  constructor() { super('Customize'); }
  create(data) {
    const s = this, hero = data.hero, W = 960; const Lk = { ...CHARS[hero] };
    State.hero = hero; State.heroLook = Lk;
    s.cameras.main.setBackgroundColor('#120d24'); s.cameras.main.fadeIn(400);
    s.add.text(W / 2, 40, 'Personalize ' + CHARS[hero].name, { fontFamily: F, fontSize: '30px', color: '#f4d27a', fontStyle: 'bold' }).setOrigin(0.5);
    const g = s.add.graphics(); box(g, 60, 80, 300, 430); box(g, 400, 80, 500, 430);
    const pt = s.add.image(210, 215, 'px').setScale(3.5);
    charSheet(s, 'hero', Lk); const sp = s.add.sprite(210, 480, 'hero', 0).setOrigin(0.5, 1).setScale(5);
    const rows = [
      { n: 'Penteado', v: () => HS_N[HS.indexOf(Lk.hs)], ch: (d) => (Lk.hs = cyc(HS, Lk.hs, d)) },
      { n: 'Uniforme', v: () => 'Cor ' + (SHIRTS.indexOf(Lk.shirt) + 1), ch: (d) => (Lk.shirt = cyc(SHIRTS, Lk.shirt, d)) },
      { n: 'Calça', v: () => 'Cor ' + (PANTS.indexOf(Lk.pants) + 1), ch: (d) => (Lk.pants = cyc(PANTS, Lk.pants, d)) },
      { n: 'Sapatos', v: () => 'Cor ' + (SHOES.indexOf(Lk.shoes) + 1), ch: (d) => (Lk.shoes = cyc(SHOES, Lk.shoes, d)) },
      { n: 'Óculos', v: () => (Lk.glasses ? 'Sim' : 'Não'), ch: () => (Lk.glasses = !Lk.glasses) },
      { n: 'Cachecol', v: () => (Lk.scarf ? 'Grifinória' : 'Nenhum'), ch: () => (Lk.scarf = !Lk.scarf) },
      { n: 'Começar aventura', v: () => '', ch: null },
    ];
    let sel = 0;
    const ts = rows.map((r, i) => s.add.text(430, 110 + i * 58, '', { fontFamily: F, fontSize: '22px', color: '#f4e3b0', fontStyle: 'bold' }).setInteractive({ useHandCursor: true }).on('pointerdown', () => { sel = i; act(1); }).on('pointerover', () => { sel = i; draw(); }));
    const draw = () => {
      pt.setTexture(portrait(s, 'hero', 'happy')); charSheet(s, 'hero', Lk);
      ts.forEach((t, i) => { const r = rows[i]; t.setText((i === sel ? '> ' : '  ') + r.n + (r.ch ? '   < ' + r.v() + ' >' : '')); t.setColor(i === sel ? '#ffffff' : '#f4e3b0'); });
    };
    const act = (d) => { const r = rows[sel]; if (r.ch) { r.ch(d); draw(); } else start(); };
    const start = () => { State.init(hero, { ...Lk }); s.cameras.main.once('camerafadeoutcomplete', () => s.scene.start('Sorting')); s.cameras.main.fadeOut(500, 0, 0, 0); };
    s.add.text(430, 480, 'W/S escolhe   A/D muda   E confirma', { fontFamily: F, fontSize: '14px', color: '#9a90b8' });
    s.input.keyboard.on('keydown', (e) => {
      if (['KeyW', 'ArrowUp'].includes(e.code)) { sel = (sel + rows.length - 1) % rows.length; draw(); }
      else if (['KeyS', 'ArrowDown'].includes(e.code)) { sel = (sel + 1) % rows.length; draw(); }
      else if (['KeyA', 'ArrowLeft'].includes(e.code)) act(-1);
      else if (['KeyD', 'ArrowRight'].includes(e.code)) act(1);
      else if (['Enter', 'KeyE', 'Space'].includes(e.code) && !rows[sel].ch) start();
    });
    draw();
  }
}
