import Phaser from 'phaser';
import { State } from '../systems/state.js';
import { charSheet, makeAnims, candles } from '../utils/art.js';
import { wait, tween } from '../utils/async.js';
import { F } from '../utils/menulist.js';

export default class Sorting extends Phaser.Scene {
  constructor() { super('Sorting'); }
  async create() {
    const s = this, W = 960, ui = State.ui, f = State.hero === 'maria';
    ui.showHud(false); s.cameras.main.setBackgroundColor('#0b0818'); s.cameras.main.fadeIn(800);
    s.add.tileSprite(0, 300, W, 240, 'floor').setOrigin(0).setTint(0x8a86a0);
    s.add.tileSprite(0, 0, W, 300, 'wall').setOrigin(0).setTint(0x888899);
    [[0, 150], [1, 350], [2, 610], [3, 810]].forEach(([i, x]) => s.add.image(x, 40, 'bn' + i).setOrigin(0.5, 0).setScale(4));
    [60, 480, 900].forEach((x) => s.add.image(x, 150, 'window').setScale(3));
    const pts = []; for (let i = 0; i < 28; i++) pts.push([40 + i * 33 + (i % 3) * 8, 60 + ((i * 47) % 150)]);
    candles(s, pts);
    for (let i = 0; i < 18; i++) {
      const left = i % 2 === 0, k = (i / 2) | 0, x = left ? 60 + k * 70 : 900 - k * 70, y = 470 + (k % 2) * 40;
      const st = s.add.image(x, y, 'st0' + (i % 4), 0).setOrigin(0.5, 1).setScale(3).setDepth(y); s.tweens.add({ targets: st, y: y - 4, duration: 900 + i * 40, yoyo: true, repeat: -1 });
    }
    charSheet(s, 'hero', State.heroLook); makeAnims(s, 'hero');
    s.add.image(480, 430, 'stool').setOrigin(0.5, 1).setScale(6).setDepth(300);
    const hero = s.add.sprite(480, 650, 'hero', 9).setOrigin(0.5, 1).setScale(6).setDepth(310);
    const hat = s.add.image(480, -120, 'hat').setOrigin(0.5, 1).setScale(6).setDepth(320);
    await wait(s, 900);
    await ui.say([{ n: 'Voz no salão', t: `${State.name('hero')}!` }]);
    hero.anims.play('hero-up', true);
    await tween(s, { targets: hero, y: 400, duration: 1800 });
    hero.anims.stop(); hero.setFrame(0);
    s.cameras.main.zoomTo(1.5, 2500); s.cameras.main.pan(480, 280, 2500);
    await tween(s, { targets: hat, y: 300, duration: 900, ease: 'Bounce.Out' });
    await ui.say([
      { s: 'hat', n: 'Chapéu Seletor', e: 'neutral', t: 'Hmm... interessante. Muito interessante.' },
      { s: 'hat', n: 'Chapéu Seletor', e: 'happy', t: f ? 'Uma mente que ama livros e um jeito quieto de observar tudo. Mas há muito mais por trás desse silêncio...' : 'Um riso fácil, energia de sobra e uma coragem que se esconde atrás das piadas. Não me engana, não.' },
      { s: 'hat', n: 'Chapéu Seletor', e: 'neutral', t: 'Inteligência, curiosidade, lealdade... Difícil. Muito difícil. Mas eu já sei onde o seu lugar vai ser.' },
    ]);
    s.cameras.main.flash(500, 255, 200, 80);
    const band = s.add.rectangle(480, 150, W, 120, 0x7a1020, 0.8).setDepth(400).setScale(1, 0);
    const tx = s.add.text(480, 150, 'GRIFINÓRIA!', { fontFamily: F, fontSize: '84px', fontStyle: 'bold', color: '#f4d27a', stroke: '#3b0a10', strokeThickness: 12 }).setOrigin(0.5).setDepth(401).setScale(0);
    s.tweens.add({ targets: band, scaleY: 1, duration: 300 }); s.tweens.add({ targets: tx, scale: 1, duration: 500, ease: 'Back.Out' });
    for (let i = 0; i < 70; i++) {
      const c = s.add.rectangle(Phaser.Math.Between(0, W), -20, 6, 10, i % 2 ? 0xd9b030 : 0xa3202e).setDepth(402);
      s.tweens.add({ targets: c, y: 560, x: c.x + Phaser.Math.Between(-60, 60), angle: 360, duration: Phaser.Math.Between(1800, 3200), delay: Phaser.Math.Between(0, 900) });
    }
    await wait(s, 2800);
    await ui.say([{ s: 'hat', n: 'Chapéu Seletor', e: 'happy', t: `Bem-vind${f ? 'a' : 'o'} à Grifinória! Seus colegas já estão esperando por você.` }]);
    State.flags.sorted = true; State.pos = { x: 20 * 16, y: 10 * 16 }; State.save();
    s.cameras.main.fadeOut(800); await wait(s, 900); s.scene.start('Hall');
  }
}
