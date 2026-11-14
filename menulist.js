import Phaser from 'phaser';
import { State } from '../systems/state.js';
import { SHIRTS } from '../config/chars.js';
import { charSheet, candles } from '../utils/art.js';
import { wait } from '../utils/async.js';
import { ITEMS } from './items.js';

export const T = 16;
const seg = (len, g = []) => { const o = []; let p = 0; [...g].sort((a, b) => a[0] - b[0]).forEach(([a, b]) => { if (a > p) o.push([p, a]); p = b; }); if (p < len) o.push([p, len]); return o; };
function room(s, w, h, floor, wk, gaps = {}) {
  const W = w * T, H = h * T;
  s.add.tileSprite(0, 0, W, H, floor).setOrigin(0);
  const wall = (x, y, ww, hh) => { s.add.tileSprite(x, y, ww, hh, wk).setOrigin(0).setDepth(2); s.solid(x, y, ww, hh); };
  seg(w, gaps.top).forEach(([a, b]) => wall(a * T, 0, (b - a) * T, 3 * T));
  seg(w, gaps.bottom).forEach(([a, b]) => wall(a * T, H - 2 * T, (b - a) * T, 2 * T));
  seg(h, gaps.left).forEach(([a, b]) => wall(0, a * T, 2 * T, (b - a) * T));
  seg(h, gaps.right).forEach(([a, b]) => wall(W - 2 * T, a * T, 2 * T, (b - a) * T));
}
const arch = (s, x, y, w, h) => s.add.rectangle(x * T, y * T, w * T, h * T, 0x0c0a16).setOrigin(0).setDepth(3);
const dark = (s, w, h, a = 0.22) => s.add.rectangle(0, 0, w * T, h * T, 0x0a0a30, a).setOrigin(0).setDepth(900);
const win = (s, x) => s.add.image(x * T, 0, 'window').setOrigin(0.5, 0).setDepth(3);
const torch = (s, x, y = 1.9) => {
  s.add.image(x * T, y * T, 'torch').setOrigin(0.5, 1).setDepth(4);
  const g = s.add.image(x * T, (y - 0.5) * T, 'glow').setDepth(960).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5).setScale(1.3);
  s.tweens.add({ targets: g, alpha: 0.3, duration: 250 + x * 9, yoyo: true, repeat: -1 });
};
const deco = (s, k, x, y, sw = 0, sh = 0) => { const i = s.add.image(x * T, y * T, k).setOrigin(0.5, 1).setDepth(y * T); if (sw) i.sol = s.solid(x * T - sw / 2, y * T - sh, sw, sh); return i; };
const say = (t, e = 'neutral') => State.ui.say([{ s: 'hero', e, t }]);

async function sleep(s) {
  const ui = State.ui, p = s.player;
  ui.busy = true; p.setVelocity(0); p.body.enable = false; p.anims.stop(); p.setFrame(0); p.setPosition(6 * T, 4.9 * T);
  const bl = s.add.rectangle(6 * T, 4.4 * T, 14, 14, 0xa3202e).setDepth(5 * T + 2); s.add.rectangle(6 * T, 3.9 * T, 14, 2, 0xe0b040).setDepth(5 * T + 3).setData('tmp', 1);
  const zs = [0, 1, 2].map((i) => s.add.text(6 * T + 8 + i * 5, 3.6 * T - i * 7, 'Z', { fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold', color: '#cfe0ff', stroke: '#000', strokeThickness: 2 }).setDepth(2000).setAlpha(0));
  zs.forEach((z, i) => s.tweens.add({ targets: z, alpha: 1, y: z.y - 8, duration: 900, delay: i * 500, repeat: 1 }));
  await wait(s, 1800); s.cameras.main.fadeOut(900); await wait(s, 1100);
  State.day++; State.time = 420; State.hp = State.maxHp; State.complete('sleep'); State.save();
  bl.destroy(); s.children.list.filter((o) => o.getData && o.getData('tmp')).forEach((o) => o.destroy()); zs.forEach((z) => z.destroy());
  p.setPosition(6 * T, 6.6 * T); p.body.enable = true; State.pos = { x: p.x, y: p.y }; State.save();
  s.cameras.main.fadeIn(900); await wait(s, 900); ui.busy = false; ui.toast(`Bom dia! Dia ${State.day}. Jogo salvo.`);
}
function wardrobe(s) {
  const nomes = ['Uniforme padrão', 'Vermelho Grifinória', 'Azul-noite', 'Verde-musgo'];
  const ch = nomes.map((n, i) => ({ t: n, fx: () => { State.heroLook.shirt = SHIRTS[i]; State.heroLook.wedding = null; charSheet(s, 'hero', State.heroLook); State.save(); } }));
  Object.entries(ITEMS).filter(([k, v]) => v.outfit && (State.flags.outfits || {})[k]).forEach(([k, v]) => ch.push({ t: v.outfit === 'glasses' ? (State.heroLook.glasses ? 'Tirar os óculos' : 'Usar os óculos') : v.n, fx: () => { if (v.outfit === 'glasses') State.heroLook.glasses = !State.heroLook.glasses; else { State.heroLook.shirt = v.outfit; State.heroLook.wedding = null; } charSheet(s, 'hero', State.heroLook); State.save(); } }));
  if (State.flags.ring) ch.push({ t: State.hero === 'maria' ? 'Vestido de noiva' : 'Terno de noivo', fx: () => { State.heroLook.wedding = State.hero === 'maria' ? 'dress' : 'suit'; charSheet(s, 'hero', State.heroLook); State.complete('fit'); State.save(); } });
  return State.ui.say([{ s: 'hero', e: 'happy', t: 'O meu guarda-roupa! Qual roupa eu vou usar hoje?', ch }]);
}
const sit = (s, x, y, d, k, dep) => { const i = s.add.image(x * T, y * T, k, d * 3).setOrigin(0.5, 1).setDepth(dep ?? y * T); s.solid(x * T - 4, y * T - 4, 8, 4); return i; };
const brk = (s, k, x, y, sw, sh, id, rm) => {
  const ok = !!(State.flags.fixed || {})[id], img = deco(s, k, x, y, ok && rm ? 0 : sw, sh), deb = [];
  if (!ok) { img.setTint(0x808088).setAngle(-12); [[-7, 0], [6, -1], [9, 1]].forEach(([dx, dy]) => deb.push(s.add.rectangle(x * T + dx, y * T + dy, 3, 2, 0x6a6670).setDepth(y * T + 1))); }
  (s.broken = s.broken || []).push({ id, img, deb, x: x * T, y: y * T - 8, fixed: ok, rm: !!rm, lesson: id.startsWith('f_') });
};
async function fish(s) {
  const ui = State.ui, it = State.inv[State.sel];
  if (!it || it.id !== 'rod') return say('Preciso da vara de pesca. Selecione-a na barra de itens (tecla 2).');
  const p = s.player; ui.busy = true; p.setVelocity(0); p.dir = 2; p.anims.stop(); p.setFrame(6);
  const bx = p.x + 30, by = p.y - 4, g = s.add.graphics().setDepth(2000), bob = s.add.circle(bx, by, 2, 0xe24a6a).setDepth(2001);
  const line = () => g.clear().lineStyle(1, 0xffffff, 0.8).lineBetween(p.x + 6, p.y - 14, bob.x, bob.y);
  s.tweens.add({ targets: bob, y: by + 1.5, duration: 500, yoyo: true, repeat: -1 });
  const ev = s.time.addEvent({ delay: 30, loop: true, callback: line });
  await wait(s, Phaser.Math.Between(2000, 4500));
  const ex = s.add.text(p.x, p.y - 30, '!', { fontFamily: 'monospace', fontSize: '14px', fontStyle: 'bold', color: '#ffe27a', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(2002);
  s.tweens.add({ targets: bob, y: by + 5, duration: 120, yoyo: true, repeat: 5 });
  const got = await new Promise((res) => { let d = false; const h = () => { if (!d) { d = true; res(true); } }; s.input.keyboard.once('keydown-E', h); s.time.delayedCall(1300, () => { if (!d) { d = true; s.input.keyboard.off('keydown-E', h); res(false); } }); });
  ev.remove(); g.destroy(); bob.destroy(); ex.destroy();
  if (got) {
    const r = Math.random(), id = r < 0.55 ? 'carpa' : r < 0.88 ? 'truta' : 'lua';
    const ok = await ui.fishGame(id);
    if (ok) { if (State.addItem(id)) { State.flags.fishN = (State.flags.fishN || 0) + 1; State.ach('Primeiro Peixe'); if (State.flags.fishN >= 10) State.ach('Mestre da Pesca'); ui.toast(`Você pescou: ${ITEMS[id].n}!`); State.complete('fish'); } else ui.toast('Mochila cheia!'); }
    else ui.toast('O peixe escapou...');
  } else ui.toast('Você demorou, o peixe escapou...');
  ui.busy = false;
}
async function takeBook() {
  const ui = State.ui, F = State.flags;
  if (F.bookDay === State.day) return say('Já peguei um livro emprestado hoje. Os bibliotecários estão de olho.');
  if (!State.addItem('book')) return ui.toast('Mochila cheia!');
  F.bookDay = State.day; ui.toast('Você pegou emprestado: Livro'); State.save();
  return say('Um livro de criaturas mágicas, com a capa meio gasta. Deve agradar a alguém que gosta de ler.', 'happy');
}
function openChest(s, id, gal, item) {
  const F = State.flags; F.chests = F.chests || {};
  if (F.chests[id]) return say('O baú já está vazio.');
  F.chests[id] = 1; State.galleons += gal; let t = `Você encontrou ${gal} galeões`;
  if (item && State.addItem(item)) t += ` e ${ITEMS[item].n}`;
  State.ui.toast(t + '!'); const im = s.chestImgs && s.chestImgs[id]; if (im) im.setTint(0x777777); State.save();
}
async function painting(s) {
  const F = State.flags;
  if (!F.secret1) { F.secret1 = true; State.complete('passage'); s.cameras.main.shake(300, 0.004); State.save(); return say('Esse quadro está solto... Atrás dele existe uma passagem escura! Aperte E de novo para entrar.', 'surprised'); }
  s.go('segredo', 'fromCorridor');
}
function keyChest(s) {
  const F = State.flags;
  if (F.key) return say('O baú está vazio. Já peguei a chave.');
  F.key = true; State.addItem('chave'); State.galleons += 40; State.ui.toast('Você encontrou a chave do portão e 40 galeões!');
  const im = s.chestImgs && s.chestImgs.key; if (im) im.setTint(0x777777); State.complete('key'); State.save();
  return say('Uma chave antiga e pesada. Deve abrir o portão da Floresta Proibida, a leste dos terrenos.', 'surprised');
}
const pet = (s, k, x, y, msg) => {
  const im = s.add.image(x * T, y * T, k).setOrigin(0.5, 1).setDepth(y * T); s.tweens.add({ targets: im, y: im.y - 1.5, duration: 900, yoyo: true, repeat: -1 });
  s.extra.push({ x: x * T, y: (y - 0.4) * T, r: 22, fn: async (sc) => { State.ui.toast(msg); sc.pop({ x: x * T, y: y * T }); } });
};
function decorate(s) {
  const cols = [0xffffff, 0x6a8ad8, 0x6ab87a, 0xe0c060], names = ['Tapete vermelho', 'Tapete azul', 'Tapete verde', 'Tapete dourado'], F = State.flags; F.deco = F.deco || { rug: 0, pic: false };
  const ch = names.map((n, i) => ({ t: n, fx: () => { F.deco.rug = i; s.rugImg.setTint(cols[i]); State.save(); } }));
  ch.push({ t: F.deco.pic ? 'Tirar o quadro da parede' : 'Pendurar um quadro na parede', fx: () => { F.deco.pic = !F.deco.pic; if (F.deco.pic && !s.picImg) s.picImg = s.add.image(12 * T, 1.5 * T, 'painting').setDepth(4); else if (s.picImg) s.picImg.setVisible(F.deco.pic); State.save(); } });
  return State.ui.say([{ s: 'hero', e: 'happy', t: 'Que tal mudar a decoração do meu canto?', ch }]);
}
function scope(s) { const k = ['Júpiter está lindo hoje. Dá para ver até uma lua.', 'Aquela constelação parece um dragão dormindo.', 'A lente está suja de poeira estelar. Ou de poeira mesmo.']; return say(k[Math.floor(Math.random() * k.length)], 'happy'); }
const thing = (x, y, fn, r = 26) => ({ x: x * T, y: y * T, r, fn });

export const MAPS = {
  hall: {
    w: 40, h: 30, spawns: { start: [20, 10], fromCorridor: [3.3, 20.5], fromLake: [20, 27], fromLibrary: [36.7, 20.5] },
    doors: [{ r: [0, 19, 1.6, 3], to: 'corridor', at: 'fromHall' }, { r: [19, 28.4, 2, 1.6], to: 'lake', at: 'fromHall' }, { r: [38.4, 19, 1.6, 3], to: 'library', at: 'fromHall' }],
    things: [], house: null,
    crowd: [[3.5, 12], [3.5, 23], [10.8, 20], [16.5, 12], [16.5, 23], [23.5, 18], [23.8, 10], [28.6, 12], [28.8, 22], [34.5, 14], [34.5, 22], [9, 7.5], [30, 7.5]],
    build(s) {
      const W = 40 * T, H = 30 * T, rs = { s: 11 }, R = () => (rs.s = (rs.s * 1664525 + 1013904223) >>> 0) / 4294967296;
      room(s, 40, 30, 'floor', 'wall', { left: [[19, 22]], bottom: [[19, 21]], right: [[19, 22]] });
      s.add.tileSprite(11 * T, 3 * T, 18 * T, 4 * T, 'dais').setOrigin(0).setDepth(1);
      s.add.tileSprite(18 * T, 8 * T, 4 * T, 20 * T, 'rug').setOrigin(0).setDepth(1);
      s.add.graphics().setDepth(1).lineStyle(2, 0xe0b040).strokeRect(18 * T + 1, 8 * T, 4 * T - 2, 20 * T);
      s.add.rectangle(0, 3 * T - 4, W, 4, 0x1c1a24).setOrigin(0).setDepth(3);
      arch(s, 0, 19, 2, 3); arch(s, 19, 28, 2, 2); arch(s, 38, 19, 2, 3);
      [4, 11, 20, 29, 36].forEach((x) => win(s, x));
      [8, 14, 26, 32].forEach((x, i) => s.add.image(x * T, 4, 'bn' + i).setOrigin(0.5, 0).setDepth(4));
      [6, 17, 23, 34].forEach((x) => torch(s, x));
      [7, 13, 25, 31].forEach((x, i) => {
        s.add.tileSprite((x - 1) * T, 9 * T, T, 16 * T, 'bench').setOrigin(0).setDepth(3);
        s.add.tileSprite((x + 2) * T, 9 * T, T, 16 * T, 'bench').setOrigin(0).setDepth(3);
        s.add.tileSprite(x * T, 9 * T, 2 * T, 16 * T, 'tb' + i).setOrigin(0).setDepth(5);
        s.solid((x - 1) * T, 9 * T, 4 * T, 16 * T);
        for (let k = 0; k < 7; k++) {
          const y = (10.7 + k * 2.1) * T;
          if (R() > 0.3) s.add.image(x * T - 8, y, `st${i}${k % 4}`, 6).setOrigin(0.5, 1).setDepth(4);
          if (R() > 0.3) s.add.image((x + 2) * T + 8, y, `st${i}${(k + 1) % 4}`, 3).setOrigin(0.5, 1).setDepth(4);
        }
      });
      [[14, 'prof0'], [17, 'prof1'], [20, 'albus'], [23, 'prof2'], [26, 'prof3']].forEach(([x, k]) => s.add.image(x * T, 5.3 * T, k, 0).setOrigin(0.5, 1).setDepth(4));
      s.add.tileSprite(12 * T, 72, 16 * T, 24, 'tbs').setOrigin(0).setDepth(5); s.solid(12 * T, 70, 16 * T, 28);
      s.add.image(20 * T, 7.4 * T, 'stool').setOrigin(0.5, 1).setDepth(7.4 * T); s.add.image(20 * T, 7.4 * T - 9, 'hat').setOrigin(0.5, 1).setDepth(7.4 * T + 1);
      s.solid(20 * T - 6, 7.4 * T - 6, 12, 6);
      const pts = []; for (let i = 0; i < 24; i++) pts.push([3 * T + i * 25 + (i % 3) * 6, 4 * T + ((i * 29) % 50) + (i % 2) * 8]);
      candles(s, pts); dark(s, 40, 30);
    },
  },
  corridor: {
    w: 36, h: 18, spawns: { fromHall: [3.3, 10.5], fromCommon: [31.5, 4.8], fromLake: [17.5, 15], fromDefesa: [15.5, 4.8], fromFeiticos: [23.5, 4.8], fromSecret: [19.5, 4.8], fromPocoes: [33.2, 9.5], fromHerb: [7.5, 4.8] },
    doors: [{ r: [0, 8, 1.6, 6], to: 'hall', at: 'fromCorridor' }, { r: [30, 0, 3, 2.5], to: 'common', at: 'fromCorridor' }, { r: [14, 0, 3, 2.5], to: 'defesa', at: 'fromCorridor' }, { r: [22, 0, 3, 2.5], to: 'feiticos', at: 'fromCorridor' }, { r: [6, 0, 3, 2.5], to: 'herbologia', at: 'fromCorridor' }, { r: [34.4, 8, 1.6, 3], to: 'pocoes', at: 'fromCorridor' }, { r: [16, 16.4, 4, 1.6], to: 'lake', at: 'fromCorridor' }],
    things: [thing(19, 3.7, painting, 28)], house: null,
    crowd: [[6, 5], [7, 12], [11, 12], [14, 6], [16, 13], [20, 6], [23, 12], [26, 13], [28, 6], [31, 12], [34, 8], [4, 15]],
    build(s) {
      room(s, 36, 18, 'floor', 'wall', { top: [[6, 9], [14, 17], [22, 25], [30, 33]], bottom: [[16, 20]], left: [[8, 14]], right: [[8, 11]] });
      s.add.tileSprite(2 * T, 8 * T, 32 * T, 3 * T, 'rug').setOrigin(0).setDepth(1);
      arch(s, 30, 0, 3, 3); arch(s, 14, 0, 3, 3); arch(s, 22, 0, 3, 3); arch(s, 6, 0, 3, 3); arch(s, 34, 8, 2, 3); arch(s, 0, 8, 2, 6); arch(s, 16, 16, 4, 2);
      [3.5, 12, 20, 27].forEach((x) => win(s, x)); [19.5, 28].forEach((x) => torch(s, x));
      [10, 29].forEach((x) => s.add.image(x * T, 1.5 * T, 'painting').setDepth(4));
      if (State.flags.secret1) { s.add.rectangle(18.3 * T, 0.4 * T, 1.6 * T, 2.4 * T, 0x0c0a16).setOrigin(0).setDepth(3.5); s.add.image(19.7 * T, 1.6 * T, 'painting').setDepth(4).setAngle(18); } else s.add.image(19 * T, 1.5 * T, 'painting').setDepth(4);
      deco(s, 'armor', 19, 4.4, 12, 6); brk(s, 'armor', 10, 4.4, 12, 6, 'c_ar1'); brk(s, 'armor', 28, 4.4, 12, 6, 'c_ar2');
      candles(s, [[8, 6], [14, 5.5], [22, 6], [29, 5.5]].map(([x, y]) => [x * T, y * T])); dark(s, 36, 18);
    },
  },
  common: {
    w: 32, h: 22, spawns: { fromCorridor: [16, 18.4], fromDorm: [28.5, 4.8] },
    doors: [{ r: [14, 20.4, 4, 1.6], to: 'corridor', at: 'fromCommon' }, { r: [27, 0, 3, 2.5], to: 'dorm', at: 'fromCommon' }],
    house: 0,
    crowd: [[6, 9], [8, 17], [13, 17], [23, 16], [24, 9], [29, 18], [3, 19], [19, 8]],
    things: [thing(16, 5, () => say('A lareira da Grifinória crepita. Cheira a chocolate quente e a casa.', 'happy'), 34)],
    build(s) {
      room(s, 32, 22, 'plank', 'wall', { bottom: [[14, 18]], top: [[27, 30]] });
      s.add.tileSprite(9 * T, 9 * T, 14 * T, 8 * T, 'rug').setOrigin(0).setDepth(1).setTint(0xb8965a);
      arch(s, 14, 20, 4, 2); arch(s, 27, 0, 3, 3);
      [7, 23].forEach((x) => win(s, x)); [10, 22, 26.5, 30.5].forEach((x) => torch(s, x));
      [12, 20].forEach((x) => s.add.image(x * T, 1.5 * T, 'painting').setDepth(4));
      pet(s, 'cat', 20, 16.6, 'O gato ronronou e esfregou a cabeça na sua mão.');
      deco(s, 'fire', 16, 4.5, 32, 10);
      const g = s.add.image(16 * T, 3.9 * T, 'glow').setDepth(960).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.6).setScale(2.2);
      s.tweens.add({ targets: g, alpha: 0.35, duration: 300, yoyo: true, repeat: -1 });
      deco(s, 'sofa', 16, 12.2, 32, 10); deco(s, 'armchair', 11, 11.5, 16, 10); deco(s, 'armchair', 21, 11.5, 16, 10);
      [4, 6, 9, 25].forEach((x) => deco(s, 'shelf', x, 5.2, 14, 8)); brk(s, 'shelf', 23, 5.2, 14, 8, 'cm_sh1');
      [4, 28].forEach((x) => s.add.image(x * T, 4, 'bn0').setOrigin(0.5, 0).setDepth(4));
      [[14.7, 12.1, 0], [17.3, 12.1, 1], [11, 11.3, 2], [21, 11.3, 3]].forEach(([x, y, v]) => sit(s, x, y, 3, 'st0' + v, 12.2 * T - 0.5));
      [[4, 13], [26, 13]].forEach(([x, y], i) => {
        s.add.tileSprite(x * T, y * T, 2 * T, 2 * T, 'tb0').setOrigin(0).setDepth(5); s.solid(x * T, y * T, 2 * T, 2 * T);
        sit(s, x - 0.5, y + 0.9, 2, 'st0' + (i + 1)); sit(s, x + 2.5, y + 1.1, 1, 'st0' + (i + 2)); sit(s, x + 1, y + 3, 3, 'st0' + ((i + 3) % 4), (y + 2) * T - 1);
      });
      candles(s, [[6, 8], [14, 7], [24, 8], [28, 9]].map(([x, y]) => [x * T, y * T])); dark(s, 32, 22, 0.3);
    },
  },
  dorm: {
    w: 32, h: 20, spawns: { fromCommon: [5.5, 16.2] },
    doors: [{ r: [4, 18.4, 3, 1.6], to: 'common', at: 'fromDorm' }],
    house: 0, crowd: [[8, 13], [20, 14]],
    things: [thing(6, 5.6, sleep, 30), thing(26, 5.4, wardrobe, 28), thing(18, 12.5, decorate, 26)],
    build(s) {
      room(s, 32, 20, 'plank', 'wall', { bottom: [[4, 7]] });
      const D = State.flags.deco || { rug: 0, pic: false };
      s.rugImg = s.add.tileSprite(10 * T, 10 * T, 12 * T, 5 * T, 'rug').setOrigin(0).setDepth(1).setTint([0xffffff, 0x6a8ad8, 0x6ab87a, 0xe0c060][D.rug || 0]);
      if (D.pic) s.picImg = s.add.image(12 * T, 1.5 * T, 'painting').setDepth(4);
      pet(s, 'owl', 14, 9, 'A coruja piou baixinho e fechou os olhos de prazer.');
      arch(s, 4, 18, 3, 2);
      [8, 16, 24].forEach((x) => win(s, x)); [3, 13, 20].forEach((x) => torch(s, x));
      const ar = s.add.image(6 * T, 6.5 * T, 'arrow').setFlipY(true).setDepth(1100).setScale(1.4); s.tweens.add({ targets: ar, y: ar.y - 5, duration: 500, yoyo: true, repeat: -1 });
      s.add.text(6 * T, 7.3 * T, 'Sua cama', { fontFamily: 'monospace', fontSize: '8px', fontStyle: 'bold', color: '#ffe27a', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(1100);
      const bg = s.add.image(6 * T, 4.2 * T, 'glow').setDepth(960).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffd24a).setAlpha(0.6).setScale(1.1); s.tweens.add({ targets: bg, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });
      [6, 10, 14, 18, 22].forEach((x) => { deco(s, 'bed', x, 5.2, 14, 24); deco(s, 'chest', x + 1.6, 5.2, 12, 8); });
      deco(s, 'wardrobe', 26, 4.8, 14, 8); deco(s, 'wardrobe', 28.5, 4.8, 14, 8);
      candles(s, [[8, 8], [16, 7.5], [24, 8], [20, 12]].map(([x, y]) => [x * T, y * T])); dark(s, 32, 20, 0.3);
    },
  },
  lake: {
    w: 48, h: 32, spawns: { fromHall: [24.5, 8], fromCorridor: [4.5, 8], fromHogs: [4, 22.5], fromForest: [44, 9.5] }, house: null,
    doors: [{ r: [22, 4, 5, 2.5], to: 'hall', at: 'fromLake' }, { r: [3, 4, 3, 2.5], to: 'corridor', at: 'fromLake' }, { r: [0, 20, 1.6, 4], to: 'hogsmeade', at: 'fromLake' }, { r: [46.4, 8, 1.6, 3], to: 'forest', at: 'fromLake', lock: () => (State.flags.key ? null : 'O portão da Floresta está trancado. Talvez exista uma chave escondida no castelo...') }],
    things: [thing(28, 21, fish, 34), thing(31, 21, fish, 34)],
    crowd: [[22, 10], [26, 10], [20, 18], [14, 24], [24, 24], [8, 12], [12, 20], [18, 22], [22, 14], [7, 17], [28, 8], [10, 15]],
    build(s) {
      const W = 48 * T, H = 32 * T;
      s.add.tileSprite(0, 0, W, H, 'grass').setOrigin(0).setTint(0xb8cfae);
      s.add.image(0, 0, 'castle').setOrigin(0).setDepth(2);
      [[0, 3], [6, 22], [27, 48]].forEach(([a, b]) => s.solid(a * T, 0, (b - a) * T, 6.5 * T));
      s.add.tileSprite(0, 6.5 * T, 2 * T, 13.5 * T, 'hedge').setOrigin(0).setDepth(2); s.add.tileSprite(0, 24 * T, 2 * T, 8 * T, 'hedge').setOrigin(0).setDepth(2); s.solid(0, 0, 2 * T, 20 * T); s.solid(0, 24 * T, 2 * T, 8 * T);
      s.add.tileSprite(0, 20 * T, 14 * T, 4 * T, 'cobble').setOrigin(0).setDepth(1);
      s.add.tileSprite(W - 2 * T, 6.5 * T, 2 * T, 1.5 * T, 'hedge').setOrigin(0).setDepth(2); s.add.tileSprite(W - 2 * T, 11 * T, 2 * T, 21 * T, 'hedge').setOrigin(0).setDepth(2); s.solid(W - 2 * T, 0, 2 * T, 8 * T); s.solid(W - 2 * T, 11 * T, 2 * T, 21 * T);
      s.add.rectangle(W - 2 * T, 8 * T, 2 * T, 3 * T, 0x0c0a16).setOrigin(0).setDepth(3);
      if (!State.flags.key) for (let i = 0; i < 6; i++) s.add.rectangle(W - 2 * T + 3 + i * 5, 8 * T, 2, 3 * T, 0x8a8e9a).setOrigin(0).setDepth(3.2);
      s.add.tileSprite(0, H - 2 * T, W, 2 * T, 'hedge').setOrigin(0).setDepth(2); s.solid(0, H - 2 * T, W, 2 * T);
      s.add.tileSprite(22 * T, 6.5 * T, 5 * T, 13.5 * T, 'cobble').setOrigin(0).setDepth(1);
      s.add.tileSprite(3 * T, 6.5 * T, 3 * T, 5.5 * T, 'cobble').setOrigin(0).setDepth(1);
      s.add.tileSprite(3 * T, 9 * T, 23 * T, 3 * T, 'cobble').setOrigin(0).setDepth(1);
      // Lago Negro
      const cx = 36 * T, cy = 21 * T, rx = 10 * T, ry = 9 * T;
      const gm = s.make.graphics({ add: false }); gm.fillStyle(0xffffff).fillEllipse(cx, cy, rx * 2, ry * 2);
      const wt = s.add.tileSprite(cx - rx, cy - ry, rx * 2, ry * 2, 'water').setOrigin(0).setDepth(1); wt.setMask(gm.createGeometryMask());
      const w2 = s.add.tileSprite(cx - rx, cy - ry, rx * 2, ry * 2, 'water2').setOrigin(0).setDepth(1.1); w2.setMask(gm.createGeometryMask());
      s.tweens.add({ targets: wt, tilePositionX: 32, duration: 12000, repeat: -1 }); s.tweens.add({ targets: w2, tilePositionX: -32, tilePositionY: 16, duration: 9000, repeat: -1 });
      s.add.graphics().setDepth(1.2).lineStyle(5, 0xcfe8ff, 0.3).strokeEllipse(cx, cy, rx * 2, ry * 2).lineStyle(3, 0x0e2a48, 0.6).strokeEllipse(cx, cy, rx * 2 - 8, ry * 2 - 8);
      for (let i = 0; i < 3; i++) { const m = s.add.ellipse(cx - 60 + i * 50, cy - 30 + i * 40, 200, 30, 0xdfe8ff, 0.08).setDepth(901); s.tweens.add({ targets: m, x: m.x + 70, duration: 7000 + i * 1500, yoyo: true, repeat: -1, ease: 'Sine.InOut' }); }
      for (let ty = 12; ty < 30; ty++) { if (ty === 20 || ty === 21) continue; const dy = (ty + 0.5 - 21) / 9, hw = 10 * Math.sqrt(Math.max(0, 1 - dy * dy)); if (hw > 0.5) s.solid((36 - hw) * T, ty * T, 2 * hw * T, T); }
      s.solid(33 * T, 20 * T, 13 * T, 2 * T);
      s.add.tileSprite(24 * T, 20 * T, 9 * T, 2 * T, 'plank').setOrigin(0).setDepth(2);
      const bt = s.add.image(31 * T, 25 * T, 'boat').setOrigin(0.5, 1).setDepth(25 * T); s.tweens.add({ targets: bt, y: bt.y + 2, angle: 2, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      // lampiões, árvores, cabana do Hagrid, salgueiro
      [[21.2, 10.5], [27.8, 10.5], [21.2, 16], [27.8, 16]].forEach(([x, y]) => {
        deco(s, 'lamp', x, y, 6, 4);
        const g = s.add.image(x * T, (y - 1) * T, 'glow').setDepth(960).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.45).setScale(1.2);
        s.tweens.add({ targets: g, alpha: 0.3, duration: 400 + x * 13, yoyo: true, repeat: -1 });
      });
      deco(s, 'hut', 8, 28.2, 40, 14);
      for (let i = 0; i < 3; i++) { const sm = s.add.circle(8 * T + 10, 28.2 * T - 44, 3, 0xd8d8e0, 0.5).setDepth(950); s.tweens.add({ targets: sm, y: sm.y - 30, x: sm.x + 8, alpha: 0, scale: 2.2, duration: 2400, repeat: -1, delay: i * 800 }); }
      [[11.5, 28], [12.6, 28.6], [13.6, 28], [12, 29.2]].forEach(([x, y]) => s.add.image(x * T, y * T, 'pumpkin').setOrigin(0.5, 1).setDepth(y * T));
      deco(s, 'willow', 15, 17.5, 14, 10);
      [[4, 16], [4, 18], [4, 26], [7, 29], [17, 29.5], [21, 29.5], [25, 29.5], [29, 29.5], [33, 29.5], [37, 29.5], [41, 29.5], [45, 29.5], [47, 14], [47, 18], [47, 24], [30, 8], [34, 8], [38, 8], [42, 8]].forEach(([x, y]) => deco(s, 'pine', x, y, 8, 5));
      [[19, 13], [20, 25], [8, 18], [23, 21], [13, 12]].forEach(([x, y]) => deco(s, 'tree', x, y, 8, 5));
      let a = 5; const R = () => (a = (a * 1664525 + 1013904223) >>> 0) / 4294967296;
      for (let i = 0; i < 45; i++) {
        const x = 3 + R() * 22, y = 12.5 + R() * 16;
        if ((x > 20.5 && x < 28 && y < 21) || (x > 4 && x < 15 && y > 26)) continue;
        s.add.image(x * T, y * T, 'fl' + (i % 3)).setDepth(1.5);
      }
      s.add.tileSprite(18 * T, 20.5 * T, 2 * T, T, 'bench').setOrigin(0).setDepth(20.5 * T); s.solid(18 * T, 20.5 * T, 2 * T, T);
      if (!State.flags.dateScene) { sit(s, 18.7, 20.9, 2, 'st01', 20.6 * T); sit(s, 19.5, 20.9, 2, 'st12', 20.6 * T); }
      dark(s, 48, 32, 0.15);
    },
  },
  defesa: {
    w: 32, h: 18, spawns: { fromCorridor: [13.5, 15.2] }, house: null,
    doors: [{ r: [12, 16.4, 3, 1.6], to: 'corridor', at: 'fromDefesa' }], things: [],
    crowd: [[5, 12], [26, 12]],
    build(s) {
      room(s, 32, 18, 'floor', 'wall', { bottom: [[12, 15]] });
      arch(s, 12, 16, 3, 2);
      s.add.rectangle(16 * T, 1.6 * T, 12 * T, 1.7 * T, 0x1f3a2a).setStrokeStyle(2, 0x6b4426).setDepth(4);
      [[11, 1.2, 40], [11, 1.7, 70], [18, 1.4, 50], [18, 1.9, 30]].forEach(([x, y, w]) => s.add.rectangle(x * T, y * T, w, 1, 0xdfe8df, 0.6).setOrigin(0).setDepth(4.5));
      [[3, 7], [3, 10], [26, 7], [26, 10]].forEach(([x, y]) => { s.add.tileSprite(x * T, y * T, 3 * T, T, 'tb0').setOrigin(0).setDepth(5); s.solid(x * T, y * T, 3 * T, T); });
      [5, 27].forEach((x) => win(s, x)); [10, 22].forEach((x) => torch(s, x));
      candles(s, [[8, 5], [24, 5], [16, 8]].map(([x, y]) => [x * T, y * T])); dark(s, 32, 18, 0.2);
    },
  },
  feiticos: {
    w: 32, h: 18, spawns: { fromCorridor: [13.5, 15.2] }, house: null,
    doors: [{ r: [12, 16.4, 3, 1.6], to: 'corridor', at: 'fromFeiticos' }], things: [],
    crowd: [[5, 12], [26, 13]],
    build(s) {
      room(s, 32, 18, 'floor', 'wall', { bottom: [[12, 15]] });
      arch(s, 12, 16, 3, 2);
      s.add.rectangle(16 * T, 1.6 * T, 12 * T, 1.7 * T, 0x1f2a3a).setStrokeStyle(2, 0x6b4426).setDepth(4);
      [[11, 1.2, 60], [11, 1.7, 40], [18, 1.4, 50], [18, 1.9, 36]].forEach(([x, y, w]) => s.add.rectangle(x * T, y * T, w, 1, 0xcfe8ff, 0.7).setOrigin(0).setDepth(4.5));
      [[3, 7], [3, 10], [26, 7], [26, 10]].forEach(([x, y]) => { s.add.tileSprite(x * T, y * T, 3 * T, T, 'tb2').setOrigin(0).setDepth(5); s.solid(x * T, y * T, 3 * T, T); });
      brk(s, 'wardrobe', 10, 11, 14, 8, 'f_1'); brk(s, 'chest', 16, 12.5, 12, 8, 'f_2'); brk(s, 'shelf', 22, 11, 14, 8, 'f_3');
      [5, 27].forEach((x) => win(s, x)); [10, 22].forEach((x) => torch(s, x));
      candles(s, [[8, 5], [24, 5], [16, 8]].map(([x, y]) => [x * T, y * T])); dark(s, 32, 18, 0.2);
    },
  },
  library: {
    w: 36, h: 22, spawns: { fromHall: [3.3, 15.5], fromTorre: [18, 4.8] }, house: null,
    doors: [{ r: [0, 14, 1.6, 4], to: 'hall', at: 'fromLibrary' }, { r: [16, 0, 4, 2.5], to: 'torre', at: 'fromLibrary' }],
    things: [thing(10, 10.9, takeBook, 28), thing(26, 10.9, takeBook, 28)],
    crowd: [[6, 18], [12, 19], [24, 19], [31, 18], [6, 9], [32, 9], [16, 8]],
    build(s) {
      room(s, 36, 22, 'plank', 'wall', { left: [[14, 18]], top: [[16, 20]] }); arch(s, 16, 0, 4, 3);
      s.add.tileSprite(14 * T, 8 * T, 8 * T, 9 * T, 'rug').setOrigin(0).setDepth(1).setTint(0x8a9ab8);
      arch(s, 0, 14, 2, 4);
      [6, 16, 26].forEach((x) => win(s, x)); [10, 21, 31].forEach((x) => torch(s, x));
      [4, 6, 8, 10, 12, 14, 22, 24, 26, 28, 30, 32].forEach((x) => deco(s, 'shelf', x, 5.2, 14, 8));
      [8, 10, 12, 24, 26, 28].forEach((x) => deco(s, 'shelf', x, 10.3, 14, 8));
      [[5, 14], [29, 14]].forEach(([x, y], i) => {
        s.add.tileSprite(x * T, y * T, 2 * T, 2 * T, 'tb' + (i + 1)).setOrigin(0).setDepth(5); s.solid(x * T, y * T, 2 * T, 2 * T);
        sit(s, x - 0.5, y + 0.9, 2, 'st1' + i); sit(s, x + 2.5, y + 1.1, 1, 'st2' + i); sit(s, x + 1, y + 3, 3, 'st3' + i, (y + 2) * T - 1);
      });
      candles(s, [[10, 7], [18, 6.5], [26, 7], [18, 13]].map(([x, y]) => [x * T, y * T])); dark(s, 36, 22, 0.28);
    },
  },
  pocoes: {
    w: 32, h: 18, spawns: { fromCorridor: [13.5, 15.2] }, house: null,
    doors: [{ r: [12, 16.4, 3, 1.6], to: 'corridor', at: 'fromPocoes' }], things: [], crowd: [[5, 12], [26, 13]],
    build(s) {
      room(s, 32, 18, 'floor', 'wall', { bottom: [[12, 15]] }); arch(s, 12, 16, 3, 2);
      [[8, 8], [16, 9], [24, 8], [11, 12.5], [21, 12.5]].forEach(([x, y], i) => { deco(s, 'potcauldron', x, y, 18, 8); const g = s.add.image(x * T, (y - 0.8) * T, 'glow').setDepth(960).setBlendMode(Phaser.BlendModes.ADD).setTint(0x5aff7a).setAlpha(0.4).setScale(0.8); s.tweens.add({ targets: g, alpha: 0.2, duration: 600 + i * 90, yoyo: true, repeat: -1 }); });
      [[3, 7], [3, 10], [26, 7], [26, 10]].forEach(([x, y]) => { s.add.tileSprite(x * T, y * T, 3 * T, T, 'tb3').setOrigin(0).setDepth(5); s.solid(x * T, y * T, 3 * T, T); });
      s.add.rectangle(16 * T, 1.6 * T, 12 * T, 1.7 * T, 0x1f3a2a).setStrokeStyle(2, 0x6b4426).setDepth(4);
      [5, 27].forEach((x) => win(s, x)); [10, 22].forEach((x) => torch(s, x)); dark(s, 32, 18, 0.3);
    },
  },
  herbologia: {
    w: 32, h: 18, spawns: { fromCorridor: [13.5, 15.2] }, house: null,
    doors: [{ r: [12, 16.4, 3, 1.6], to: 'corridor', at: 'fromHerb' }], things: [], crowd: [[5, 12], [26, 13]],
    build(s) {
      room(s, 32, 18, 'grass', 'wall', { bottom: [[12, 15]] }); arch(s, 12, 16, 3, 2);
      s.add.tileSprite(2 * T, 3 * T, 28 * T, 12 * T, 'path').setOrigin(0).setDepth(0.5).setAlpha(0.5);
      for (let i = 0; i < 12; i++) deco(s, 'plant' + (i % 3), 4 + i * 2.1, 8 + (i % 2) * 5.5, 10, 5);
      [5, 27].forEach((x) => win(s, x)); [10, 22].forEach((x) => torch(s, x)); dark(s, 32, 18, 0.15);
    },
  },
  torre: {
    w: 30, h: 18, spawns: { fromLibrary: [15, 15] }, house: null,
    doors: [{ r: [13, 16.4, 4, 1.6], to: 'library', at: 'fromTorre' }], things: [thing(15, 8.7, scope, 28)], crowd: [],
    build(s) {
      room(s, 30, 18, 'floor', 'wall', { bottom: [[13, 17]] }); arch(s, 13, 16, 4, 2);
      s.add.tileSprite(2 * T, 0, 26 * T, 3 * T, 'stars').setOrigin(0).setDepth(2.5); s.add.circle(22 * T, 1.3 * T, 14, 0xf4eccc).setDepth(2.6); s.add.circle(19 * T + 6, 1.3 * T - 2, 3, 0xd8d0aa).setDepth(2.7);
      deco(s, 'telescope', 15, 9, 12, 6); s.add.tileSprite(11 * T, 8 * T, 8 * T, 5 * T, 'rug').setOrigin(0).setDepth(1).setTint(0x6a7ab8);
      [8, 22].forEach((x) => torch(s, x)); candles(s, [[6, 10], [24, 10], [15, 6]].map(([x, y]) => [x * T, y * T])); dark(s, 30, 18, 0.4);
    },
  },
  segredo: {
    w: 30, h: 18, spawns: { fromCorridor: [15, 15] }, house: null,
    doors: [{ r: [13, 16.4, 4, 1.6], to: 'corridor', at: 'fromSecret' }],
    things: [thing(15, 7.6, keyChest, 28)], crowd: [],
    build(s) {
      room(s, 30, 18, 'floor', 'wall', { bottom: [[13, 17]] }); arch(s, 13, 16, 4, 2);
      s.chestImgs = { key: deco(s, 'chest', 15, 7, 12, 8) }; s.chestImgs.key.setScale(1.5); if (State.flags.key) s.chestImgs.key.setTint(0x777777);
      [4, 6, 8, 22, 24, 26].forEach((x) => deco(s, 'shelf', x, 5.2, 14, 8)); [10, 20].forEach((x) => torch(s, x)); [8, 22].forEach((x) => win(s, x));
      s.add.tileSprite(11 * T, 8 * T, 8 * T, 6 * T, 'rug').setOrigin(0).setDepth(1).setTint(0x7a6a8a);
      candles(s, [[8, 9], [22, 9], [15, 5]].map(([x, y]) => [x * T, y * T])); dark(s, 30, 18, 0.4);
    },
  },
  forest: {
    w: 44, h: 28, spawns: { fromLake: [3.5, 14], fromCave: [39.5, 4.8], fromClareira: [5, 17] }, house: null,
    doors: [{ r: [0, 12, 1.6, 4], to: 'lake', at: 'fromForest' }, { r: [38, 0, 3, 2.5], to: 'caverna', at: 'fromForest' }],
    things: [thing(11, 21.6, (s) => openChest(s, 'fo_c1', 35, 'pocao'), 26), thing(32, 5.6, (s) => openChest(s, 'fo_c2', 50, 'flor'), 26), thing(36, 21.6, (s) => openChest(s, 'fo_c3', 70, 'pocao'), 26)],
    enemies: [['spider', 10, 8], ['spider', 14, 19], ['wisp', 17, 12], ['spider', 30, 9], ['wisp', 32, 17], ['spider', 36, 24], ['wisp', 28, 22]], crowd: [],
    build(s) {
      const W = 44 * T, H = 28 * T; room(s, 44, 28, 'grass', 'hedge', { left: [[12, 16]], top: [[38, 41]] });
      arch(s, 0, 12, 2, 4); arch(s, 38, 0, 3, 3);
      s.add.tileSprite(22 * T, 3 * T, 3 * T, 22 * T, 'water').setOrigin(0).setDepth(1);
      s.solid(22 * T, 3 * T, 3 * T, 10 * T); s.solid(22 * T, 15 * T, 3 * T, 10 * T);
      brk(s, 'bridge', 23.5, 15, 48, 28, 'fo_bridge', true);
      let a = 17; const R = () => (a = (a * 1664525 + 1013904223) >>> 0) / 4294967296;
      for (let i = 0; i < 80; i++) {
        const x = 2.5 + R() * 39, y = 4 + R() * 23;
        if ((x > 21 && x < 26) || (x < 9 && y > 10 && y < 18) || (x > 37 && x < 42 && y < 9) || (y > 12.5 && y < 16.5 && x < 40)) continue;
        deco(s, 'pine', x, y, 8, 5).setTint(0x7a9a8a);
      }
      for (let i = 0; i < 26; i++) { const x = 3 + R() * 38, y = 4 + R() * 22; if ((x > 21 && x < 26)) continue; s.add.image(x * T, y * T, 'mushroom').setDepth(y * T - 1); const g = s.add.image(x * T, y * T - 4, 'glow').setDepth(950).setBlendMode(Phaser.BlendModes.ADD).setTint(0x5ad8c8).setAlpha(0.35).setScale(0.35); s.tweens.add({ targets: g, alpha: 0.15, duration: 800 + i * 70, yoyo: true, repeat: -1 }); }
      s.chestImgs = {}; [['fo_c1', 11, 21], ['fo_c2', 32, 5], ['fo_c3', 36, 21]].forEach(([id, x, y]) => { const im = deco(s, 'chest', x, y, 12, 8); if ((State.flags.chests || {})[id]) im.setTint(0x777777); s.chestImgs[id] = im; });
      s.add.particles(0, 0, 'px', { x: { min: 0, max: W }, y: { min: 0, max: H }, lifespan: 4000, speed: { min: 4, max: 12 }, scale: { min: 1.2, max: 2 }, alpha: { start: 0.9, end: 0 }, tint: 0xe8ff7a, blendMode: 'ADD', frequency: 110, quantity: 1 }).setDepth(955);
      for (let i = 0; i < 3; i++) { const m = s.add.ellipse(8 * T + i * 14 * T, 10 * T + i * 4 * T, 260, 36, 0xb8c8d8, 0.07).setDepth(901); s.tweens.add({ targets: m, x: m.x + 90, duration: 8000 + i * 1500, yoyo: true, repeat: -1, ease: 'Sine.InOut' }); }
      dark(s, 44, 28, 0.5);
    },
  },
  clareira: {
    w: 30, h: 18, spawns: { fromForest: [15, 15] }, house: null,
    doors: [{ r: [13, 16.4, 4, 1.6], to: 'forest', at: 'fromClareira' }], things: [], crowd: [],
    build(s) {
      room(s, 30, 18, 'grass', 'hedge', { bottom: [[13, 17]] }); arch(s, 13, 16, 4, 2);
      const cx = 15 * T, cy = 6 * T, gm = s.make.graphics({ add: false }); gm.fillStyle(0xffffff).fillEllipse(cx, cy, 10 * T, 6 * T);
      const wt = s.add.tileSprite(cx - 5 * T, cy - 3 * T, 10 * T, 6 * T, 'water').setOrigin(0).setDepth(1); wt.setMask(gm.createGeometryMask()); s.tweens.add({ targets: wt, tilePositionX: 32, duration: 14000, repeat: -1 });
      s.add.graphics().setDepth(1.2).lineStyle(4, 0xcfe8ff, 0.3).strokeEllipse(cx, cy, 10 * T, 6 * T); s.solid(11 * T, 4 * T, 8 * T, 4 * T);
      [[4, 8], [7, 12], [24, 8], [26, 13], [20, 14], [9, 6], [22, 6], [3, 15], [27, 6]].forEach(([x, y]) => deco(s, 'pine', x, y, 8, 5).setTint(0x7a9a8a));
      let a = 29; const R = () => (a = (a * 1664525 + 1013904223) >>> 0) / 4294967296;
      for (let i = 0; i < 22; i++) { const x = 4 + R() * 22, y = 5 + R() * 10; if (x > 10 && x < 20 && y < 9) continue; s.add.image(x * T, y * T, 'mushroom').setDepth(y * T - 1); const g = s.add.image(x * T, y * T - 4, 'glow').setDepth(950).setBlendMode(Phaser.BlendModes.ADD).setTint(0x5ad8c8).setAlpha(0.4).setScale(0.4); s.tweens.add({ targets: g, alpha: 0.15, duration: 700 + i * 60, yoyo: true, repeat: -1 }); }
      s.add.tileSprite(12 * T, 11.4 * T, 3 * T, T, 'bench').setOrigin(0).setDepth(11.4 * T);
      s.add.particles(0, 0, 'px', { x: { min: 0, max: 30 * T }, y: { min: 0, max: 18 * T }, lifespan: 4000, speed: { min: 4, max: 12 }, scale: { min: 1.2, max: 2 }, alpha: { start: 0.9, end: 0 }, tint: 0xe8ff7a, blendMode: 'ADD', frequency: 90, quantity: 1 }).setDepth(955);
      dark(s, 30, 18, 0.45);
    },
  },
  caverna: {
    w: 30, h: 18, spawns: { fromForest: [15, 15] }, house: null,
    doors: [{ r: [13, 16.4, 4, 1.6], to: 'forest', at: 'fromCave' }],
    things: [thing(15, 7.6, (s) => openChest(s, 'cave', 120, 'book'), 28)], crowd: [],
    build(s) {
      room(s, 30, 18, 'floor', 'wall', { bottom: [[13, 17]] }); arch(s, 13, 16, 4, 2);
      s.add.rectangle(0, 0, 30 * T, 18 * T, 0x0a1a2a, 0.55).setOrigin(0).setDepth(1.5);
      s.chestImgs = { cave: deco(s, 'chest', 15, 7, 12, 8) }; s.chestImgs.cave.setScale(1.5); if ((State.flags.chests || {}).cave) s.chestImgs.cave.setTint(0x777777);
      [[5, 8], [8, 12], [22, 9], [25, 13], [12, 6], [19, 6], [4, 14], [26, 7]].forEach(([x, y], i) => { deco(s, 'crystal', x, y, 8, 5); const g = s.add.image(x * T, (y - 0.5) * T, 'glow').setDepth(960).setBlendMode(Phaser.BlendModes.ADD).setTint(0x6ae0ff).setAlpha(0.5).setScale(0.9); s.tweens.add({ targets: g, alpha: 0.25, duration: 900 + i * 90, yoyo: true, repeat: -1 }); });
      dark(s, 30, 18, 0.3);
    },
  },
  hogsmeade: {
    w: 40, h: 24, spawns: { fromLake: [37, 11.5] }, house: null,
    doors: [{ r: [38.4, 9, 1.6, 6], to: 'lake', at: 'fromHogs' }], things: [],
    crowd: [[8, 13], [18, 13], [22, 11], [33, 12], [8, 17], [16, 18], [26, 18], [34, 18], [12, 21]],
    build(s) {
      const W = 40 * T, H = 24 * T;
      room(s, 40, 24, 'snow', 'snowhedge', { right: [[9, 15]] });
      s.add.tileSprite(0, 9 * T, W, 6 * T, 'scobble').setOrigin(0).setDepth(1);
      s.add.tileSprite(19 * T, 15 * T, 4 * T, 7 * T, 'scobble').setOrigin(0).setDepth(1);
      s.add.image(W - 480, 3 * T - 6, 'skyline').setOrigin(0).setDepth(1.5).setTint(0xc8d4f0); s.add.image(0, 3 * T + 4, 'skyline').setOrigin(0).setDepth(1.4).setTint(0xb8c4e0).setAlpha(0.7);
      s.add.rectangle(0, 0, W, 3 * T, 0xaab4d0, 0.35).setOrigin(0).setDepth(1.6);
      const shops = [[6, 'DEDOS DE MEL', 0xd8488a], [15, 'Floreios e Borrões', 0x4a6ab0], [24, 'Jardim da Violeta', 0x4a9a5a], [33, 'Joalheria Rubi', 0x8a4aa8]];
      shops.forEach(([x, name, col], i) => {
        const b = deco(s, 'hs' + i, x, 8.4, 52, 14);
        s.add.text(x * T, 8.4 * T - 29, name, { fontFamily: 'monospace', fontSize: '7px', fontStyle: 'bold', color: '#ffffff', stroke: '#2a1020', strokeThickness: 2 }).setOrigin(0.5).setDepth(8.5 * T);
        [[x * T - 20, 8.4 * T - 36], [x * T + 18, 8.4 * T - 36], [x * T - 20, 8.4 * T - 16], [x * T + 18, 8.4 * T - 16]].forEach(([gx, gy]) => {
          const g = s.add.image(gx, gy, 'glow').setDepth(960).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.32).setScale(0.9);
          s.tweens.add({ targets: g, alpha: 0.2, duration: 700 + gx * 3, yoyo: true, repeat: -1 });
        });
      });
      [[10.5, 9.2], [20, 9.2], [29.5, 9.2], [14, 15.2], [26, 15.2]].forEach(([x, y]) => {
        deco(s, 'lamppost', x, y, 6, 4);
        const g = s.add.image(x * T, (y - 2.2) * T, 'glow').setDepth(960).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5).setScale(1.4);
        s.tweens.add({ targets: g, alpha: 0.35, duration: 500 + x * 9, yoyo: true, repeat: -1 });
      });
      s.add.tileSprite(2 * T, 15.4 * T, 15 * T, 12, 'fence').setOrigin(0).setDepth(15.9 * T); s.solid(2 * T, 15.6 * T, 15 * T, 6);
      s.add.tileSprite(23 * T, 15.4 * T, 13 * T, 12, 'fence').setOrigin(0).setDepth(15.9 * T); s.solid(23 * T, 15.6 * T, 13 * T, 6);
      [[3.2, 10.3], [3.9, 10.5], [3.5, 10]].forEach(([x, y]) => deco(s, 'cauldron', x, y, 18, 8));
      [[11.5, 10.2], [21.5, 10.4], [31, 10.3]].forEach(([x, y]) => deco(s, 'cauldron', x, y, 18, 8));
      [[4, 21], [8, 22], [14, 21.5], [26, 21.5], [31, 21], [36, 22], [2.6, 16.5], [37, 5.2]].forEach(([x, y]) => deco(s, 'pinesnow', x, y, 8, 5));
      [[12, 17.5], [29, 18.5]].forEach(([x, y]) => deco(s, 'barrel', x, y, 10, 5));
      s.add.particles(0, 0, 'px', { x: { min: 0, max: W }, y: { min: -10, max: H * 0.6 }, lifespan: 7000, speedY: { min: 18, max: 36 }, speedX: { min: -14, max: 6 }, scale: { min: 1, max: 2.2 }, alpha: { min: 0.5, max: 0.95 }, frequency: 50, quantity: 1 }).setDepth(955);
      dark(s, 40, 24, 0.2);
    },
  },
};
