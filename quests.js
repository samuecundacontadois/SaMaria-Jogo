import Phaser from 'phaser';
import { State } from '../systems/state.js';
import { CHARS } from '../config/chars.js';
import { charSheet, tex } from '../utils/art.js';
import { F } from '../utils/menulist.js';

const mix = (a, b, t) => { const f = (v, w) => Math.round(v + (w - v) * t); const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); return '#' + ((1 << 24) | (f(A >> 16, B >> 16) << 16) | (f((A >> 8) & 255, (B >> 8) & 255) << 8) | f(A & 255, B & 255)).toString(16).slice(1); };
function paintBg(s) {
  tex(s, 'menubg', 480, 270, (P, c) => {
    let seed = 12; const R = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    for (let y = 0; y < 200; y++) P(mix('#05071a', '#12224a', y / 200), 0, y, 480, 1);
    for (let i = 0; i < 90; i++) P(R() > 0.8 ? '#ffffff' : '#9ab0ff', (R() * 479) | 0, (R() * 150) | 0, 1, 1);
    c.fillStyle = 'rgba(240,228,190,.13)'; c.beginPath(); c.arc(58, 42, 22, 0, 7); c.fill();
    for (let dy = -14; dy <= 14; dy++) { const w = Math.floor(Math.sqrt(196 - dy * dy)); P('#f0e4c0', 58 - w, 42 + dy, w * 2, 1); }
    P('#d8c898', 52, 38, 4, 3); P('#d8c898', 62, 46, 5, 3); P('#d8c898', 56, 32, 3, 2);
    for (let i = 0; i < 6; i++) P('#0c1632', (R() * 440) | 0, 150 + ((R() * 40) | 0), 50 + ((R() * 60) | 0), 8);
    const tower = (x, y, w, h, rh, col, rc, lit) => {
      P(col, x, y, w, h);
      for (let i = 0; i < rh; i++) { const hw = (w / 2 + 2) * (1 - i / rh); P(rc, Math.round(x + w / 2 - hw), y - i, Math.max(1, Math.round(hw * 2)), 1); }
      if (lit) for (let wy = y + 8; wy < y + h - 6; wy += 11) for (let wx = x + 4; wx < x + w - 4; wx += 7) if (R() > 0.35) { P('#ff9a30', wx, wy, 2, 4); P('#ffd070', wx, wy, 2, 1); }
    };
    P('#1f2540', 20, 132, 440, 60);
    [[20, 100, 18, 90, 22], [100, 85, 16, 95, 20], [112, 70, 14, 120, 22], [300, 95, 18, 90, 20], [415, 70, 24, 120, 28], [445, 100, 20, 90, 22]].forEach(([x, y, w, h, rh]) => tower(x, y, w, h, rh, '#1b2038', '#141a30', false));
    P('#2c3044', 40, 120, 110, 72);
    for (let x = 48; x < 142; x += 7) { P('#ff9a30', x, 128, 2, 16); P('#ffd070', x, 128, 2, 2); P('#ff9a30', x, 150, 2, 12); }
    P('#222640', 36, 114, 118, 8); for (let x = 38; x < 152; x += 6) P('#222640', x, 110, 3, 4);
    [[170, 70, 22, 120, 26], [200, 92, 20, 98, 22], [240, 60, 24, 130, 30], [282, 40, 28, 150, 36], [322, 84, 20, 106, 24], [350, 66, 22, 124, 28], [382, 92, 18, 98, 20], [128, 28, 38, 164, 42]].forEach(([x, y, w, h, rh]) => tower(x, y, w, h, rh, '#2f3348', '#1e2748', true));
    P('#2a2e42', 190, 160, 140, 34); for (let x = 196; x < 330; x += 14) { P('#14182a', x, 172, 9, 22); P('#14182a', x + 1, 168, 7, 4); }
    P('#232738', 24, 184, 436, 14); for (let i = 0; i < 40; i++) P('#2c3146', (R() * 430) | 0, 184 + ((R() * 12) | 0), 8, 3);
    for (let y = 192; y < 270; y++) P(mix('#1f4a28', '#10301a', (y - 192) / 78), 0, y, 480, 1);
    for (let i = 0; i < 260; i++) P(R() > 0.5 ? '#2e6a34' : '#19401f', (R() * 479) | 0, 194 + ((R() * 75) | 0), 2, 1);
    [[158, 270, 30], [152, 246, 26], [160, 226, 22], [172, 210, 18], [172, 198, 14]].forEach(([x, y, w]) => { P('#6a6a7a', x - w / 2, y, w, 8); for (let k = 0; k < 8; k++) P(R() > 0.5 ? '#8a8a9a' : '#555566', x - w / 2 + ((R() * w) | 0), y + ((R() * 7) | 0), 3, 2); });
    P('#6a6a7a', 175, 262, 90, 8); for (let k = 0; k < 18; k++) P(R() > 0.5 ? '#8a8a9a' : '#555566', 178 + ((R() * 84) | 0), 262 + ((R() * 6) | 0), 4, 2);
    const pine = (x, y, h) => {
      P('#5a3a1e', x - 2, y - 5, 4, 7);
      for (let k = 0; k < 4; k++) { const ty = y - 6 - k * (h / 5), w0 = 8 + (4 - k) * 5; for (let i = 0; i < h / 4; i++) { const hw = (w0 / 2) * ((i + 1) / (h / 4)); P(k % 2 ? '#1f5a2c' : '#25702f', Math.round(x - hw), ty - (h / 4) + i, Math.max(1, Math.round(hw * 2)), 1); P('#143a1c', Math.round(x + hw * 0.35), ty - (h / 4) + i, Math.max(1, Math.round(hw * 0.65)), 1); } }
    };
    [[18, 232, 52], [48, 250, 60], [78, 226, 48], [108, 240, 56], [138, 214, 44], [195, 246, 46], [398, 214, 46], [430, 240, 60], [458, 220, 52], [470, 258, 62], [260, 226, 40]].forEach(([x, y, h]) => pine(x, y, h));
    P('#6a665e', 320, 232, 98, 38); for (let i = 0; i < 26; i++) P(R() > 0.5 ? '#8a857a' : '#4a463e', 322 + ((R() * 92) | 0), 234 + ((R() * 32) | 0), 5, 3);
    for (let i = 0; i < 30; i++) { const hw = 54 - i * 0.55; P(i % 3 ? '#6a4a28' : '#7e5a30', Math.round(369 - hw), 204 + i, Math.round(hw * 2), 1); }
    for (let k = 0; k < 40; k++) P('#4a321a', 320 + ((R() * 98) | 0), 208 + ((R() * 26) | 0), 1, 5);
    P('#8a857a', 392, 190, 13, 34); P('#6a665e', 392, 190, 13, 3); P('#ffa030', 330, 242, 9, 11); P('#ffd070', 331, 243, 3, 3); P('#ffa030', 396, 242, 9, 11); P('#ffd070', 397, 243, 3, 3);
    P('#4a2e18', 356, 238, 16, 30); P('#6a4a28', 358, 240, 12, 28); P('#e0a040', 366, 254, 2, 2);
    [[300, 262], [318, 268], [66, 266], [255, 268], [455, 266]].forEach(([x, y]) => { P('#e8e8e0', x, y + 2, 2, 3); P('#c8383a', x - 1, y, 4, 3); });
  });
  tex(s, 'broom', 60, 16, (P) => { P('#7a5230', 14, 7, 46, 3); P('#9a6a3a', 14, 7, 46, 1); P('#c8963c', 0, 3, 16, 10); for (let i = 0; i < 8; i++) P(i % 2 ? '#a8742c' : '#dba850', 1 + i * 2, 4, 1, 8); P('#8a6a2a', 12, 3, 3, 10); });
  tex(s, 'tri', 10, 14, (P) => { for (let i = 0; i < 7; i++) P('#e8a850', 0, i, 2 + i, 1); for (let i = 7; i < 14; i++) P('#e8a850', 0, i, 2 + (13 - i), 1); });
}

export default class Menu extends Phaser.Scene {
  constructor() { super('Menu'); }
  create() {
    const s = this, W = 960; State.ui.showHud(false); s.cameras.main.fadeIn(700);
    paintBg(s); s.add.image(0, 0, 'menubg').setOrigin(0).setScale(2);
    for (let i = 0; i < 4; i++) { const sm = s.add.circle(786, 380, 5, 0xc8ccd8, 0.4); s.tweens.add({ targets: sm, y: 300, x: 800 + i * 4, alpha: 0, scale: 2.4, duration: 3600, repeat: -1, delay: i * 900 }); }
    const fx = 470, fy = 500;
    s.add.rectangle(fx, fy + 6, 38, 7, 0x5a3a1e); const glow = s.add.circle(fx, fy - 8, 46, 0xff8a2a, 0.18); s.tweens.add({ targets: glow, alpha: 0.32, scale: 1.1, duration: 300, yoyo: true, repeat: -1 });
    [[0xff7a1a, 14, 30], [0xffc040, 9, 22], [0xfff0a0, 5, 14]].forEach(([c, w, h], i) => { const fl = s.add.triangle(fx, fy + 2, 0, h, w, h, w / 2, 0, c).setOrigin(0.5, 1); s.tweens.add({ targets: fl, scaleY: 0.78 + i * 0.05, scaleX: 1.1, duration: 160 + i * 50, yoyo: true, repeat: -1 }); });
    for (let i = 0; i < 18; i++) { const f = s.add.rectangle(Phaser.Math.Between(40, 920), Phaser.Math.Between(330, 520), 3, 3, 0xe8ff7a, 0.8).setBlendMode(Phaser.BlendModes.ADD); s.tweens.add({ targets: f, x: f.x + Phaser.Math.Between(-40, 40), y: f.y + Phaser.Math.Between(-30, 30), alpha: 0.1, duration: Phaser.Math.Between(2200, 4200), yoyo: true, repeat: -1 }); }
    for (let i = 0; i < 24; i++) { const st = s.add.rectangle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, 260), 2, 2, 0xffffff, 0.9); s.tweens.add({ targets: st, alpha: 0.15, duration: Phaser.Math.Between(900, 2600), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 2000) }); }
    charSheet(s, 'm_samuel', CHARS.samuel); charSheet(s, 'm_maria', CHARS.maria);
    const fly = s.add.container(790, 175), br = s.add.image(0, 28, 'broom').setScale(3.2).setOrigin(0.5);
    const a = s.add.image(-22, 8, 'm_samuel', 6).setScale(3.4).setOrigin(0.5, 1), b = s.add.image(22, 8, 'm_maria', 6).setScale(3.4).setOrigin(0.5, 1);
    const cape1 = s.add.triangle(-48, -6, 0, 0, 30, 8, 4, 26, 0xa31a2a).setOrigin(0.5), cape2 = s.add.triangle(-4, -6, 0, 0, 24, 8, 4, 22, 0xa31a2a).setOrigin(0.5);
    fly.add([cape1, cape2, br, a, b]); s.tweens.add({ targets: fly, y: 190, angle: 2, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const title = s.add.text(488, 98, 'SAMARIA', { fontFamily: F, fontSize: '104px', fontStyle: 'bold', color: '#ffffff', stroke: '#2a1204', strokeThickness: 12 }).setOrigin(0.5);
    title.setTint(0xf0b868, 0xf0b868, 0xa8682a, 0xa8682a); s.tweens.add({ targets: title, y: 103, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    s.add.text(488, 156, 'Uma aventura em Hogwarts', { fontFamily: F, fontSize: '16px', color: '#c8bfe8', stroke: '#0a0a1a', strokeThickness: 4 }).setOrigin(0.5);
    const hasSave = State.has();
    const go = () => { s.cameras.main.once('camerafadeoutcomplete', () => s.scene.start(State.flags.sorted || ['metro', 'plataforma', 'trem'].includes(State.map) ? 'Hall' : 'Sorting')); s.cameras.main.fadeOut(400, 0, 0, 0); };
    const items = [
      { t: 'CONTINUAR', off: !hasSave, fn: () => { if (State.load()) go(); } },
      { t: 'NOVO JOGO', fn: () => s.scene.start('Select') },
      { t: 'TELA CHEIA', fn: () => s.scale.toggleFullscreen() },
    ];
    let sel = items.findIndex((i) => !i.off); const arrow = s.add.image(352, 0, 'tri').setScale(2.6).setOrigin(0.5);
    const txt = items.map((it, i) => {
      const t = s.add.text(378, 210 + i * 58, it.t, { fontFamily: F, fontSize: '40px', fontStyle: 'bold', color: '#ffffff', stroke: '#3a1e08', strokeThickness: 8 }).setOrigin(0, 0.5);
      if (!it.off) t.setInteractive({ useHandCursor: true }).on('pointerover', () => { sel = i; draw(); }).on('pointerdown', () => it.fn());
      return t;
    });
    const draw = () => txt.forEach((t, i) => { if (items[i].off) t.setTint(0x6a5a4a); else if (i === sel) t.setTint(0xffe0a0); else t.setTint(0xd9a05a); if (i === sel) arrow.setY(t.y); });
    arrow.setVisible(sel >= 0); draw();
    s.tweens.add({ targets: arrow, x: 360, duration: 450, yoyo: true, repeat: -1 });
    const move = (d) => { let n = sel; do { n = (n + d + items.length) % items.length; } while (items[n].off && n !== sel); sel = n; draw(); };
    s.input.keyboard.on('keydown', (e) => {
      if (['KeyW', 'ArrowUp'].includes(e.code)) move(-1); else if (['KeyS', 'ArrowDown'].includes(e.code)) move(1);
      else if (['Enter', 'KeyE', 'Space'].includes(e.code) && sel >= 0 && !items[sel].off) items[sel].fn();
    });
  }
}
