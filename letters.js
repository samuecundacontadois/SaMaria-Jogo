import Phaser from 'phaser';
import { State } from '../systems/state.js';
import { portrait } from '../utils/art.js';
import { active, QUESTS, prog, ACHS, objs } from '../data/quests.js';
import { LETTERS } from '../data/letters.js';
import { MAPS } from '../data/maps.js';
import { box, F } from '../utils/menulist.js';
import { wait } from '../utils/async.js';
import { ITEMS, SHOPS } from '../data/items.js';

const OK = ['KeyE', 'Enter', 'Space'];
export default class UI extends Phaser.Scene {
  constructor() { super('UI'); }
  create() {
    State.ui = this; this.playing = false; this.busy = false; this.stamp = 0; this.nt = 0; this.chooser = null; this.finishType = null; this.waiter = null;
    // HUD
    this.hud = this.add.container(0, 0).setVisible(false);
    const hb = this.add.graphics(); box(hb, 12, 12, 200, 90); box(hb, 736, 340, 212, 188);
    this.clock = this.add.text(26, 20, '', { fontFamily: F, fontSize: '22px', color: '#f4e3b0', fontStyle: 'bold' });
    this.dayTx = this.add.text(26, 48, '', { fontFamily: F, fontSize: '13px', color: '#bfae7a' });
    this.qTitle = this.add.text(750, 350, '', { fontFamily: F, fontSize: '13px', color: '#e0b040', fontStyle: 'bold' });
    this.qBody = this.add.text(750, 374, '', { fontFamily: F, fontSize: '12px', color: '#f4e3b0', lineSpacing: 4, wordWrap: { width: 186 } });
    this.hpIc = []; for (let i = 0; i < 5; i++) { const h = this.add.image(36 + i * 26, 84, 'heart').setScale(3.4); this.hud.add(h); this.hpIc.push(h); }
    this.hud.add([hb, this.clock, this.dayTx, this.qTitle, this.qBody]); this.hpIc.forEach((h) => this.hud.bringToTop(h));
    // Barra de itens e mochila
    this.bar = this.add.container(0, 0).setVisible(false); this.barG = this.add.graphics(); this.bar.add(this.barG);
    this.bIc = []; this.bQ = [];
    for (let i = 0; i < 10; i++) {
      const x = 240 + i * 48 + 22, ic = this.add.image(x, 508, 'px').setScale(2.5).setVisible(false), q = this.add.text(x + 20, 524, '', { fontFamily: F, fontSize: '12px', color: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(1, 1);
      this.bar.add([ic, q, this.add.text(x - 19, 488, String((i + 1) % 10), { fontFamily: F, fontSize: '10px', color: '#9a90b8' })]); this.bIc.push(ic); this.bQ.push(q);
    }
    this.inv = this.add.container(0, 0).setVisible(false).setDepth(5); this.invG = this.add.graphics(); this.invIc = []; this.invQ = [];
    this.inv.add([this.invG, this.add.text(480, 78, 'Mochila', { fontFamily: F, fontSize: '24px', color: '#e0b040', fontStyle: 'bold' }).setOrigin(0.5)]);
    for (let i = 0; i < 30; i++) {
      const x = 195 + (i % 10) * 58 + 26, y = 112 + ((i / 10) | 0) * 58 + 26, ic = this.add.image(x, y, 'px').setScale(2.5).setVisible(false), q = this.add.text(x + 22, y + 22, '', { fontFamily: F, fontSize: '12px', color: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(1, 1);
      this.inv.add([ic, q]); this.invIc.push(ic); this.invQ.push(q);
    }
    this.invTx = this.add.text(200, 310, '', { fontFamily: F, fontSize: '16px', color: '#f4e3b0', lineSpacing: 6, wordWrap: { width: 560 } }); this.inv.add(this.invTx);
    this.inv.add(this.add.text(480, 430, 'WASD move   E usar   Tab ou Esc fecha', { fontFamily: F, fontSize: '13px', color: '#9a90b8' }).setOrigin(0.5));
    this.invOpen = false; this.ic = 0; this.barKey = ''; this.menuOpen = false; this.shopOpen = null; this.mnDyn = []; this.shDyn = [];
    this.readOpen = null; this.rdC = this.add.container(0, 0).setVisible(false).setDepth(8); this.rdG = this.add.graphics(); this.rdT = this.add.text(480, 78, '', { fontFamily: F, fontSize: '20px', fontStyle: 'bold', color: '#6b2a1a' }).setOrigin(0.5, 0); this.rdB = this.add.text(240, 128, '', { fontFamily: F, fontSize: '16px', color: '#3a2412', lineSpacing: 8, wordWrap: { width: 480 } }); this.rdH = this.add.text(480, 462, 'E para fechar', { fontFamily: F, fontSize: '12px', color: '#6b4426' }).setOrigin(0.5); this.rdC.add([this.rdG, this.rdT, this.rdB, this.rdH]);
    this.pauseOpen = false; this.pDyn = []; this.pauseC = this.add.container(0, 0).setVisible(false).setDepth(7); this.pauseG = this.add.graphics(); this.pauseC.add(this.pauseG);
    this.mmG = this.add.graphics(); this.hud.add(this.mmG); this.mmT = 0;
    this.menuC = this.add.container(0, 0).setVisible(false).setDepth(6); this.menuG = this.add.graphics(); this.menuC.add(this.menuG); this.menuBody = this.add.container(0, 70); this.bodyG = this.add.graphics(); this.menuBody.add(this.bodyG); this.menuC.add(this.menuBody); const mg = this.make.graphics({ add: false }); mg.fillStyle(0xffffff).fillRect(40, 70, 870, 430); this.menuBody.setMask(mg.createGeometryMask()); this.scrollY = 0;
    this.shopC = this.add.container(0, 0).setVisible(false).setDepth(6); this.shopG = this.add.graphics(); this.shopC.add(this.shopG);
    this.input.keyboard.addCapture('TAB');
    this.input.keyboard.on('keydown', (e) => {
      if (!this.playing) return; const c = e.code;
      if (this.readOpen) { if (['KeyE', 'Enter', 'Space', 'Escape'].includes(c)) { const r = this.readOpen; this.readOpen = null; this.rdC.setVisible(false); this.stamp = performance.now(); r(); } return; }
      if (this.pauseOpen) return this.pauseKey(c);
      if (this.menuOpen) return this.menuKey(c);
      if (this.shopOpen) return this.shopKey(c);
      if (this.invOpen) {
        if (['Tab', 'Escape'].includes(c)) this.closeInv();
        else if (['KeyA', 'ArrowLeft'].includes(c)) this.moveInv(-1); else if (['KeyD', 'ArrowRight'].includes(c)) this.moveInv(1);
        else if (['KeyW', 'ArrowUp'].includes(c)) this.moveInv(-10); else if (['KeyS', 'ArrowDown'].includes(c)) this.moveInv(10);
        else if (c === 'KeyE') this.useInv();
        return;
      }
      if (this.menuOpen) return this.menuKey(c);
      if (this.shopOpen) return this.shopKey(c);
      if (this.pauseOpen) return this.pauseKey(c);
      if (this.busy) return;
      if (c === 'Escape') return this.openMenu(6);
      if (c === 'KeyM') this.openMenu(5); else if (c === 'KeyJ') this.openMenu(1); else if (c === 'KeyF') this.useIdx(State.sel);
      else if (c === 'Tab') this.openMenu(0); else if (/^Digit\d$/.test(c)) State.sel = (+c.slice(5) + 9) % 10;
    });
    this.input.on('wheel', (p, o, dx, dy) => { if (this.menuOpen) { this.scrollY += dy * 0.7; this.renderMenu(); } else if (this.playing && !this.busy) State.sel = (State.sel + (dy > 0 ? 1 : 9)) % 10; });
    // Diálogo
    this.dlg = this.add.container(0, 0).setVisible(false);
    const bg = this.add.graphics(); box(bg, 30, 350, 900, 170);
    this.chG = this.add.graphics();
    this.pt = this.add.image(46, 364, 'px').setOrigin(0).setScale(2.5);
    this.pf = this.add.graphics().lineStyle(3, 0xd9b45a).strokeRect(45, 363, 162, 162);
    this.nameTx = this.add.text(240, 366, '', { fontFamily: F, fontSize: '20px', color: '#e0b040', fontStyle: 'bold' });
    this.txt = this.add.text(240, 396, '', { fontFamily: F, fontSize: '20px', color: '#f4e3b0', lineSpacing: 6, wordWrap: { width: 660 } });
    this.dlg.add([bg, this.chG, this.pt, this.pf, this.nameTx, this.txt]);
    // Entrada
    this.input.keyboard.on('keydown', (e) => {
      if (!this.busy || performance.now() - this.stamp < 180) return;
      const c = e.code;
      if (this.chooser) {
        if (['KeyW', 'ArrowUp'].includes(c)) this.chooser.move(-1);
        else if (['KeyS', 'ArrowDown'].includes(c)) this.chooser.move(1);
        else if (OK.includes(c)) this.chooser.pick();
        else if (/^Digit[1-9]$/.test(c)) this.chooser.set(+c.slice(5) - 1);
      } else if (OK.includes(c)) this.adv();
    });
    this.input.on('pointerdown', () => { if (this.busy && !this.chooser && !this.locked && performance.now() - this.stamp > 180) this.adv(); });
    this.time.addEvent({ delay: 15000, loop: true, callback: () => this.playing && State.save() });
  }
  showHud(v) { this.playing = v; this.hud.setVisible(v); this.bar.setVisible(v); if (v) this.refreshQuest(); }
  nodes() {
    return [['hall', 'Grande Salão', 480, 140], ['library', 'Biblioteca', 660, 140], ['torre', 'Torre Astronomia', 660, 415], ['pocoes', 'Sala de Poções', 778, 230], ['herbologia', 'Herbologia', 182, 230], ['feiticos', 'Sala de Feitiços', 300, 140], ['corridor', 'Corredor', 480, 230], ['common', 'Sala Comunal', 300, 230], ['defesa', 'Sala de Defesa', 660, 230], ['dorm', 'Dormitório', 300, 330], ['lake', 'Terrenos e Lago', 480, 330], ['hogsmeade', 'Hogsmeade', 660, 330], ['forest', 'Floresta Proibida', 480, 415]];
  }
  travel(n) {
    const seen = State.flags.seen || {}, h = this.scene.get('Hall');
    if (!seen[n[0]]) return this.toast('Você ainda não descobriu esse lugar.');
    if (n[0] === State.map) return this.toast('Você já está aqui.');
    const M = MAPS[n[0]], at = M.spawns.start ? 'start' : Object.keys(M.spawns)[0];
    this.closeMenu(); h.go(n[0], at);
  }
  shop(id) { return new Promise((res) => { this.busy = true; this.shopOpen = { id, mode: 0, sel: 0, res }; this.bar.setVisible(false); this.hud.setVisible(false); this.shopC.setVisible(true); this.renderShop(); }); }
  shopRows() { const S = this.shopOpen; return S.mode === 0 ? SHOPS[S.id].filter((k) => !(k === 'anel' && State.flags.ring) && !(ITEMS[k].outfit && (State.flags.outfits || {})[k])).map((k) => ({ k, price: ITEMS[k].buy })) : State.inv.map((it, i) => (it && ITEMS[it.id].v > 0 ? { k: it.id, i, qty: it.qty, price: ITEMS[it.id].v } : null)).filter(Boolean); }
  shopKey(c) {
    const S = this.shopOpen, rows = this.shopRows();
    if (c === 'Escape') { this.shopOpen = null; this.shopC.setVisible(false); this.busy = false; this.hud.setVisible(true); this.bar.setVisible(true); return S.res(); }
    if (['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(c)) { S.mode = 1 - S.mode; S.sel = 0; }
    else if (['KeyW', 'ArrowUp'].includes(c)) S.sel = Math.max(0, S.sel - 1); else if (['KeyS', 'ArrowDown'].includes(c)) S.sel = Math.min(rows.length - 1, S.sel + 1);
    else if (['KeyE', 'Enter'].includes(c) && rows[S.sel]) {
      const r = rows[S.sel];
      if (S.mode === 0) { if (State.galleons < r.price) this.toast('Galeões insuficientes.'); else if (!ITEMS[r.k].outfit && !State.addItem(r.k)) this.toast('Mochila cheia!'); else { if (ITEMS[r.k].outfit) { State.flags.outfits = State.flags.outfits || {}; State.flags.outfits[r.k] = 1; this.toast('Novo no guarda-roupa: ' + ITEMS[r.k].n); } State.galleons -= r.price; this.toast(`Comprou: ${ITEMS[r.k].n}`); if (ITEMS[r.k].gift) State.complete('buy'); if (r.k === 'anel') { State.flags.ring = true; State.complete('ring'); } } }
      else { State.take(r.i); State.galleons += r.price; this.toast(`Vendeu: ${ITEMS[r.k].n} (+${r.price})`); S.sel = Math.max(0, Math.min(S.sel, this.shopRows().length - 1)); }
      State.save();
    }
    this.renderShop();
  }
  renderShop() {
    const S = this.shopOpen, rows = this.shopRows(); this.shDyn.forEach((o) => o.destroy()); this.shDyn = []; const g = this.shopG; g.clear(); box(g, 180, 70, 600, 400);
    const T = (x, y, t, st = {}, o = 0) => { const e = this.add.text(x, y, t, { fontFamily: F, fontSize: '16px', color: '#f4e3b0', ...st }).setOrigin(o, 0); this.shopC.add(e); this.shDyn.push(e); };
    T(210, 90, S.mode === 0 ? 'COMPRAR' : 'VENDER', { fontSize: '22px', fontStyle: 'bold', color: '#e0b040' }); T(750, 94, `${State.galleons} galeões`, {}, 1);
    T(480, 440, 'W/S escolhe   E confirma   A/D troca Comprar/Vender   Esc sai', { fontSize: '12px', color: '#9a90b8' }, 0.5);
    if (!rows.length) T(210, 150, S.mode === 0 ? 'Nada à venda.' : 'Você não tem nada para vender.');
    rows.slice(0, 9).forEach((r, i) => { const d = ITEMS[r.k]; T(210, 140 + i * 30, `${i === S.sel ? '> ' : '  '}${d.n}${r.qty ? ' x' + r.qty : ''}`, { color: i === S.sel ? '#ffe27a' : '#f4e3b0' }); T(750, 140 + i * 30, `${r.price} g`, {}, 1); });
    const sel = rows[S.sel]; if (sel) T(210, 410, ITEMS[sel.k].d, { fontSize: '12px', color: '#bfae7a', wordWrap: { width: 540 } });
  }
  async potionGame() {
    this.busy = true; this.bar.setVisible(false); this.hud.setVisible(false);
    const c = this.add.container(0, 0).setDepth(9), g = this.add.graphics(); box(g, 200, 90, 560, 360); c.add(g);
    const names = ['Cogumelo brilhante', 'Olho de salamandra', 'Pena de fênix', 'Raiz de mandrágora'];
    const ics = [0, 1, 2, 3].map((i) => this.add.image(300 + i * 120, 270, 'ic_i' + (i + 1)).setScale(3.5));
    const info = this.add.text(480, 130, '', { fontFamily: F, fontSize: '20px', color: '#ffe27a' }).setOrigin(0.5);
    const sub = this.add.text(480, 400, '', { fontFamily: F, fontSize: '14px', color: '#bfae7a' }).setOrigin(0.5); c.add([...ics, info, sub]);
    [0, 1, 2, 3].forEach((i) => c.add(this.add.text(300 + i * 120, 320, String(i + 1), { fontFamily: F, fontSize: '18px', color: '#f4e3b0' }).setOrigin(0.5)));
    const ask = () => new Promise((r) => { const h = (e) => { if (/^Digit[1-4]$/.test(e.code)) { this.input.keyboard.off('keydown', h); r(+e.code.slice(5) - 1); } }; this.input.keyboard.on('keydown', h); });
    let wins = 0;
    for (const len of [3, 4, 5]) {
      const seq = Array.from({ length: len }, () => Phaser.Math.Between(0, 3)); info.setText(`Prepare-se... (${len} ingredientes)`); sub.setText('Memorize a ordem'); await wait(this, 1000);
      for (const k of seq) { ics[k].setScale(5).setTint(0xffe27a); info.setText(names[k]); await wait(this, 650); ics[k].setScale(3.5).clearTint(); await wait(this, 250); }
      info.setText('Sua vez!'); sub.setText('Aperte 1, 2, 3 ou 4 na mesma ordem'); let ok = true; this.dbgSeq = seq;
      for (const k of seq) { const a = await ask(); ics[a].setTint(a === k ? 0x6ae06a : 0xe24a4a); this.time.delayedCall(250, () => ics[a].clearTint()); if (a !== k) { ok = false; break; } }
      info.setText(ok ? 'Perfeito!' : 'Errou a ordem...'); sub.setText(''); if (ok) wins++; await wait(this, 900);
    }
    c.destroy(); this.busy = false; this.bar.setVisible(this.playing); this.hud.setVisible(this.playing); this.stamp = performance.now(); return wins >= 2;
  }
  async herbGame() {
    this.busy = true; this.bar.setVisible(false); this.hud.setVisible(false);
    const c = this.add.container(0, 0).setDepth(9), g = this.add.graphics(); box(g, 200, 90, 560, 360); c.add(g);
    const pl = this.add.image(480, 260, 'plant0').setScale(7), info = this.add.text(480, 130, '', { fontFamily: F, fontSize: '22px', color: '#ffe27a' }).setOrigin(0.5);
    const hint = this.add.text(480, 410, '1 Regar    2 Borrifar    3 Podar', { fontFamily: F, fontSize: '16px', color: '#f4e3b0' }).setOrigin(0.5), tm = this.add.graphics(); c.add([pl, info, hint, tm]);
    const acts = [['A planta está seca!', 0], ['Há pragas nas folhas!', 1], ['Está crescendo demais!', 2]];
    let ok = 0;
    for (let i = 0; i < 6; i++) {
      const [txt, need] = acts[Phaser.Math.Between(0, 2)]; this.dbgNeed = need; pl.setTexture('plant' + (i % 3)).clearTint(); info.setText(`${i + 1}/6  ${txt}`);
      let h; const k = new Promise((r) => { h = (e) => { if (/^Digit[1-3]$/.test(e.code)) { this.input.keyboard.off('keydown', h); r(+e.code.slice(5) - 1); } }; this.input.keyboard.on('keydown', h); });
      const t0 = performance.now(); const tick = this.time.addEvent({ delay: 50, loop: true, callback: () => { const f = Math.min(1, (performance.now() - t0) / 2400); tm.clear().fillStyle(0xe0b040, 1).fillRect(330, 370, 300 * (1 - f), 8); } });
      const a = await Promise.race([k, wait(this, 2400).then(() => -1)]); this.input.keyboard.off('keydown', h); tick.remove(); tm.clear();
      if (a === need) { ok++; pl.setTint(0x9aff9a); info.setText('Muito bem!'); } else { pl.setTint(0xff7a7a); info.setText(a < 0 ? 'Tarde demais...' : 'Cuidado errado...'); }
      await wait(this, 800);
    }
    c.destroy(); this.busy = false; this.bar.setVisible(this.playing); this.hud.setVisible(this.playing); this.stamp = performance.now(); return ok >= 4;
  }
  fishGame(id) {
    const D = { carpa: { bar: 100, sp: 90 }, truta: { bar: 78, sp: 140 }, lua: { bar: 62, sp: 210 } }[id];
    return new Promise((res) => {
      this.busy = true; this.bar.setVisible(false); this.hud.setVisible(false);
      const X = 700, Y = 110, H = 320, W = 46, c = this.add.container(0, 0).setDepth(9), g = this.add.graphics(), fi = this.add.image(X + W / 2, Y, 'ic_' + id).setScale(2);
      const tx = this.add.text(X + W / 2, Y - 34, 'Segure E, Espaço ou o mouse', { fontFamily: F, fontSize: '12px', color: '#ffe27a', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5); c.add([g, fi, tx]);
      const kE = this.input.keyboard.addKey('E'), kS = this.input.keyboard.addKey('SPACE');
      const S = { by: H - D.bar, bv: 0, fy: H / 2, ft: H / 2, nt: 0, pr: 0.3 }; this.fishS = S; this.fishD = D;
      this.fishG = (dt) => {
        const held = kE.isDown || kS.isDown || this.input.activePointer.isDown;
        S.bv = Phaser.Math.Clamp(S.bv + (held ? -620 : 520) * dt, -250, 260); S.by += S.bv * dt;
        if (S.by < 0) { S.by = 0; S.bv = 0; } if (S.by > H - D.bar) { S.by = H - D.bar; S.bv = -S.bv * 0.3; }
        S.nt -= dt; if (S.nt <= 0) { S.ft = Math.random() * (H - 24); S.nt = 0.6 + Math.random() * 1.1; }
        S.fy += Math.sign(S.ft - S.fy) * Math.min(Math.abs(S.ft - S.fy), D.sp * dt);
        const inside = S.fy + 12 >= S.by && S.fy + 12 <= S.by + D.bar; S.pr = Phaser.Math.Clamp(S.pr + (inside ? 0.25 : -0.17) * dt, 0, 1);
        g.clear(); g.fillStyle(0x0e2a48, 0.95).fillRect(X, Y, W, H); g.lineStyle(3, 0xd9b45a).strokeRect(X, Y, W, H);
        g.fillStyle(inside ? 0x6ae06a : 0x3aa03a, 0.8).fillRect(X + 3, Y + S.by, W - 6, D.bar);
        g.fillStyle(0x1b1426, 1).fillRect(X + W + 10, Y, 14, H); g.fillStyle(S.pr > 0.5 ? 0x6ae06a : S.pr > 0.25 ? 0xe0b040 : 0xe24a4a, 1).fillRect(X + W + 12, Y + H - S.pr * (H - 4) - 2, 10, S.pr * (H - 4));
        g.lineStyle(2, 0xd9b45a).strokeRect(X + W + 10, Y, 14, H); fi.setY(Y + S.fy + 12);
        if (S.pr >= 1 || S.pr <= 0) { this.fishG = null; c.destroy(); this.input.keyboard.removeKey('E'); this.input.keyboard.removeKey('SPACE'); this.busy = false; this.stamp = performance.now(); this.bar.setVisible(this.playing); this.hud.setVisible(this.playing); res(S.pr >= 1); }
      };
    });
  }
  letter(title, text) {
    return new Promise((res) => {
      const g = this.rdG; g.clear(); g.fillStyle(0xe8d8a8, 1).fillRect(190, 50, 580, 440); g.lineStyle(4, 0x6b4426).strokeRect(192, 52, 576, 436); g.lineStyle(1, 0x9a7a4a).strokeRect(202, 62, 556, 416);
      this.rdT.setText(title); this.rdB.setText(text); this.rdC.setVisible(true); this.readOpen = res; this.busy = true; this.stamp = performance.now();
    }).then(() => { if (!this.menuOpen) this.busy = false; });
  }
  credits() {
    return new Promise((res) => {
      this.busy = true; this.showHud(false);
      const r = this.add.rectangle(480, 270, 960, 540, 0x000000).setDepth(20);
      const lines = ['SAMARIA', '', 'Uma aventura em Hogwarts', '', '', 'Samuel e Maria', '', '', 'Com', 'Laís', 'Pedro', 'Arthur', 'Prof. Carlinhos', 'Dona Mel', 'Sr. Borrão', 'Violeta', 'Sra. Rubi', '', 'E todos os alunos de Hogwarts', '', '', 'Grifinória, para sempre.'];
      const t = this.add.text(480, 560, lines.join('\n'), { fontFamily: F, fontSize: '24px', color: '#f4e3b0', align: 'center', lineSpacing: 14 }).setOrigin(0.5, 0).setDepth(21);
      this.tweens.add({ targets: t, y: -t.height - 20, duration: 24000, onComplete: () => { const f = this.add.text(480, 270, 'FIM', { fontFamily: F, fontSize: '72px', fontStyle: 'bold', color: '#f4d27a' }).setOrigin(0.5).setDepth(21); this.time.delayedCall(3000, () => { r.destroy(); t.destroy(); f.destroy(); this.busy = false; res(); }); } });
    });
  }
  drawMini() {
    const h = this.scene.get('Hall'), g = this.mmG; g.clear(); if (!h || !h.M || !h.player || !h.player.active) return;
    const M = h.M, sc = Math.min(130 / M.w, 80 / M.h), w = M.w * sc, hh = M.h * sc, x0 = 948 - w - 6, y0 = 18;
    g.fillStyle(0x1b1426, 0.85).fillRect(x0 - 6, y0 - 6, w + 12, hh + 12); g.lineStyle(2, 0xd9b45a).strokeRect(x0 - 6, y0 - 6, w + 12, hh + 12); g.fillStyle(0x3a3448, 0.9).fillRect(x0, y0, w, hh);
    M.doors.forEach((d) => g.fillStyle(0x4ae06a, 1).fillRect(x0 + d.r[0] * sc, y0 + d.r[1] * sc, Math.max(3, d.r[2] * sc), Math.max(3, d.r[3] * sc)));
    h.pickups.forEach((k) => g.fillStyle(0xf2ead0, 1).fillRect(x0 + (k.x / 16) * sc - 1, y0 + (k.y / 16) * sc - 1, 3, 3));
    h.npcs.forEach((n) => g.fillStyle(n.id === State.other() ? 0xff7ab8 : 0xffd24a, 1).fillRect(x0 + (n.x / 16) * sc - 1, y0 + (n.y / 16) * sc - 1, 3, 3));
    g.fillStyle(0xffffff, 1).fillCircle(x0 + (h.player.x / 16) * sc, y0 + (h.player.y / 16) * sc, 2.5);
  }
  openPause() { this.pauseOpen = true; this.busy = true; this.ps = 0; this.bar.setVisible(false); this.pauseC.setVisible(true); this.renderPause(); }
  closePause() { this.pauseOpen = false; this.busy = false; this.pauseC.setVisible(false); this.bar.setVisible(this.playing); }
  pauseItems() { return ['Continuar', 'Salvar agora', this.scale.isFullscreen ? 'Sair da tela cheia' : 'Tela cheia', 'Voltar ao menu inicial']; }
  pauseKey(c) {
    const n = this.pauseItems().length;
    if (c === 'Escape') return this.closePause();
    if (['KeyW', 'ArrowUp'].includes(c)) this.ps = (this.ps + n - 1) % n; else if (['KeyS', 'ArrowDown'].includes(c)) this.ps = (this.ps + 1) % n;
    else if (['KeyE', 'Enter', 'Space'].includes(c)) {
      if (this.ps === 0) return this.closePause();
      if (this.ps === 1) { State.save(); this.toast('Jogo salvo!'); }
      else if (this.ps === 2) this.scale.toggleFullscreen();
      else { State.save(); this.closePause(); this.showHud(false); this.scene.get('Hall').scene.start('Menu'); return; }
    }
    this.renderPause();
  }
  renderPause() {
    this.pDyn.forEach((o) => o.destroy()); this.pDyn = []; const g = this.pauseG; g.clear(); g.fillStyle(0x000000, 0.55).fillRect(0, 0, 960, 540); box(g, 320, 130, 320, 270);
    const T = (x, y, t, st = {}) => { const e = this.add.text(x, y, t, { fontFamily: F, fontSize: '20px', color: '#f4e3b0', ...st }).setOrigin(0.5, 0); this.pauseC.add(e); this.pDyn.push(e); };
    T(480, 150, 'Pausa', { fontSize: '26px', fontStyle: 'bold', color: '#e0b040' });
    this.pauseItems().forEach((t, i) => T(480, 205 + i * 44, (i === this.ps ? '> ' : '  ') + t, { color: i === this.ps ? '#ffe27a' : '#f4e3b0' }));
  }
  openMenu(tab = 0) { if (this.menuOpen) return; this.menuOpen = true; this.busy = true; this.tab = tab; this.ms = 0; this.scrollY = 0; this.bar.setVisible(false); this.hud.setVisible(false); this.menuC.setVisible(true); this.renderMenu(); }
  closeMenu() { this.menuOpen = false; this.busy = false; this.menuC.setVisible(false); this.hud.setVisible(true); this.bar.setVisible(true); }
  menuKey(c) {
    const TABS = 7, dn = ['KeyS', 'ArrowDown'].includes(c), up = ['KeyW', 'ArrowUp'].includes(c), lf = ['KeyA', 'ArrowLeft'].includes(c), rt = ['KeyD', 'ArrowRight'].includes(c), ok = ['KeyE', 'Enter', 'Space'].includes(c);
    const setTab = (t) => { this.tab = (t + TABS) % TABS; this.ms = 0; this.scrollY = 0; };
    if (c === 'Escape') return this.closeMenu();
    if (c === 'KeyM') setTab(5); else if (c === 'KeyJ') setTab(1);
    else if (/^Digit[1-7]$/.test(c)) setTab(+c.slice(5) - 1); else if (c === 'KeyQ') setTab(this.tab - 1); else if (c === 'KeyR' || c === 'Tab') setTab(this.tab + 1);
    else if (this.tab === 0) {
      if (lf) this.ms = Math.max(0, this.ms - 1); else if (rt) this.ms = Math.min(29, this.ms + 1); else if (up) this.ms = Math.max(0, this.ms - 10); else if (dn) this.ms = Math.min(29, this.ms + 10); else if (ok) this.useIdx(this.ms);
    } else if (this.tab === 3) {
      if (up) this.ms = (this.ms + 19) % 20; else if (dn) this.ms = (this.ms + 1) % 20;
      else if (ok && (State.flags.letters || {})[this.ms]) { const m = this.ms; this.letter(`Carta ${m + 1} — ${LETTERS[m][0]}`, LETTERS[m][1].replace(/\{r\}/g, State.name('hero')).replace(/\{s\}/g, State.name(State.other()))); }
    } else if (this.tab === 5) {
      const N = this.nodes();
      if (lf || up) this.ms = (this.ms + N.length - 1) % N.length; else if (rt || dn) this.ms = (this.ms + 1) % N.length; else if (ok) return this.travel(N[this.ms]);
    } else if (this.tab === 6) {
      if (up) this.ms = (this.ms + 3) % 4; else if (dn) this.ms = (this.ms + 1) % 4;
      else if (ok) {
        if (this.ms === 0) return this.closeMenu();
        if (this.ms === 1) { State.save(); this.toast('Jogo salvo!'); } else if (this.ms === 2) this.scale.toggleFullscreen();
        else { State.save(); this.closeMenu(); this.showHud(false); this.scene.get('Hall').scene.start('Menu'); return; }
      }
    } else if (up) this.scrollY -= 56; else if (dn) this.scrollY += 56;
    this.renderMenu();
  }
  renderMenu() {
    this.mnDyn.forEach((o) => o.destroy()); this.mnDyn = []; const g = this.menuG, bg = this.bodyG; g.clear(); bg.clear();
    g.fillStyle(0x070912, 1).fillRect(0, 0, 960, 540); g.fillStyle(0x12172e, 0.7).fillRect(0, 0, 960, 58); g.fillStyle(0x000000, 0.4).fillRect(0, 504, 960, 36);
    const H = (x, y, t, st = {}, o = 0.5) => { const e = this.add.text(x, y, t, { fontFamily: F, fontSize: '14px', color: '#f4e3b0', ...st }).setOrigin(o, 0.5); this.menuC.add(e); this.mnDyn.push(e); return e; };
    let cy = 0;
    const B = (x, y, t, st = {}) => { const e = this.add.text(x, y, t, { fontFamily: F, fontSize: '15px', color: '#f4e3b0', ...st }); this.menuBody.add(e); this.mnDyn.push(e); cy = Math.max(cy, y + e.height); return e; };
    const BI = (x, y, key, sc) => { const e = this.add.image(x, y, key).setScale(sc); this.menuBody.add(e); this.mnDyn.push(e); cy = Math.max(cy, y + e.displayHeight / 2); return e; };
    ['MOCHILA', 'MISSÕES', 'AMIGOS', 'CARTAS', 'CONQUISTAS', 'MAPA', 'OPÇÕES'].forEach((n, i) => {
      const x = 120 + i * 120, on = i === this.tab; H(x, 28, n, { fontSize: '15px', fontStyle: 'bold', color: on ? '#f0d890' : '#7a7a94' });
      if (on) { g.fillStyle(0xf0d890, 1).fillRect(x - 46, 44, 92, 3); g.fillStyle(0xf0d890, 1).fillRect(x - 58, 27, 5, 5).fillRect(x + 53, 27, 5, 5); }
    });
    [[56, 'Q'], [904, 'R']].forEach(([x, k]) => { g.lineStyle(2, 0x7a6a3a).strokeRoundedRect(x - 16, 14, 32, 28, 6); H(x, 28, k, { fontSize: '14px', fontStyle: 'bold', color: '#c8b070' }); });
    g.fillStyle(0xd9b45a, 0.9).fillRect(40, 54, 880, 2);
    const nm = State.name(State.other()), tab = this.tab; let foot = 'W/S rolar   Q/R trocar de aba   Esc voltar';
    if (tab === 0) {
      foot = 'Setas movem   E usa o item   F usa o item da barra   Q/R trocam de aba';
      B(700, 6, `Galeões: ${State.galleons}`, { color: '#e0b040', fontStyle: 'bold' });
      for (let i = 0; i < 30; i++) {
        const x = 80 + (i % 10) * 62, y = 36 + ((i / 10) | 0) * 62, on = i === this.ms; bg.fillStyle(on ? 0x5a2a2a : 0x14182c, 0.95).fillRect(x, y, 56, 56); bg.lineStyle(on ? 3 : 2, on ? 0xffe27a : 0x5a4a2a).strokeRect(x + 1, y + 1, 54, 54);
        const it = State.inv[i]; if (it) { BI(x + 28, y + 28, 'ic_' + it.id, 2.8); if (it.qty > 1) B(x + 50, y + 40, String(it.qty), { fontSize: '12px', stroke: '#000', strokeThickness: 3 }).setOrigin(1, 0); }
        if (i < 10) B(x + 3, y + 2, String((i + 1) % 10), { fontSize: '10px', color: '#7a7a94' });
      }
      const it = State.inv[this.ms], d = it && ITEMS[it.id];
      B(80, 240, d ? d.n : 'Espaço vazio', { fontSize: '20px', fontStyle: 'bold', color: '#f0d890' });
      if (d) { B(80, 268, d.cat + (d.v ? `   Valor: ${d.v} galeões` : ''), { color: '#9a90b8', fontSize: '13px' }); B(80, 292, d.d, { wordWrap: { width: 740 }, lineSpacing: 6 }); }
    } else if (tab === 1) {
      let y = 6;
      QUESTS.forEach((q) => {
        const ob = objs(q, nm, State.hero); if (!ob.length) return; const done = ob.every(([k]) => State.quest.done[k]);
        B(80, y, q.title + (done ? '   (concluída)' : `   (+${q.reward} galeões)`), { fontSize: '17px', fontStyle: 'bold', color: done ? '#7a9a6a' : '#e0b040' }); y += 28;
        ob.forEach(([k, t]) => { const d = State.quest.done[k], pr = d ? '' : prog(k, State.quest, State.flags); const e = B(100, y, `${d ? '[x]' : '[ ]'} ${t}${pr ? ` (${pr})` : ''}`, { fontSize: '14px', color: d ? '#7a9a6a' : '#f4e3b0', wordWrap: { width: 720 } }); y += e.height + 6; });
        y += 12;
      });
    } else if (tab === 2) {
      let y = 6; Object.keys(State.rel).forEach((id) => {
        const r = State.rel[id]; BI(110, y + 48, portrait(this, id, 'neutral'), 1.4); B(190, y + 4, State.name(id), { fontSize: '18px', fontStyle: 'bold', color: '#f0d890' });
        let ry = y + 34; const row = (lab, v, col) => { B(190, ry, lab, { fontSize: '13px', color: '#bfae7a' }); for (let i = 0; i < 10; i++) { const h = this.add.image(300 + i * 24, ry + 8, 'heart').setScale(2.8).setTint(i < Math.floor(v / 100) ? col : 0x33333f); this.menuBody.add(h); this.mnDyn.push(h); } ry += 24; };
        row('Amizade', r.f || 0, 0xffffff); if (id === State.other()) { row('Flerte', r.l || 0, 0xff7ab8); if (State.flags.together) row('Namoro', r.n || 0, 0xff4a5a); }
        y += Math.max(110, ry - y + 14); cy = Math.max(cy, y);
      });
    } else if (tab === 3) {
      const got = State.flags.letters || {}; B(80, 4, `${Object.keys(got).length}/20 cartas encontradas   (W/S escolhe, E relê)`, { fontSize: '13px', color: '#9a90b8' });
      LETTERS.forEach((l, i) => B(90 + (i < 10 ? 0 : 420), 36 + (i % 10) * 34, `${i === this.ms ? '> ' : '  '}${i + 1}. ${got[i] ? l[0] : '???'}`, { fontSize: '16px', color: i === this.ms ? '#ffe27a' : got[i] ? '#f4e3b0' : '#6f6a7a' }));
    } else if (tab === 4) {
      const a = State.flags.ach || {}; ACHS.forEach((n, i) => B(100, 8 + i * 38, `${a[n] ? '[x]' : '[ ]'} ${n}`, { fontSize: '18px', color: a[n] ? '#e0b040' : '#6f6a7a' }));
    } else if (tab === 5) {
      foot = 'Setas escolhem   E viaja para lugares já descobertos   Q/R trocam de aba'; const N = this.nodes(), by = Object.fromEntries(N.map((n) => [n[0], n])), seen = State.flags.seen || {};
      [['hall', 'corridor'], ['hall', 'library'], ['library', 'torre'], ['corridor', 'pocoes'], ['corridor', 'herbologia'], ['corridor', 'feiticos'], ['corridor', 'common'], ['corridor', 'defesa'], ['common', 'dorm'], ['corridor', 'lake'], ['hall', 'lake'], ['lake', 'hogsmeade'], ['lake', 'forest']].forEach(([a, b]) => { if (by[a] && by[b]) bg.lineStyle(3, 0x7a5a2a).lineBetween(by[a][2], by[a][3] - 70, by[b][2], by[b][3] - 70); });
      N.forEach((n, i) => {
        const ok = seen[n[0]], cur = n[0] === State.map, sel = i === this.ms, x = n[2], y = n[3] - 70;
        bg.fillStyle(ok ? 0x2a2038 : 0x15111e, 1).fillRect(x - 62, y - 18, 124, 36); bg.lineStyle(sel ? 4 : 2, sel ? 0xffe27a : cur ? 0xe24a6a : 0x7a5a2a).strokeRect(x - 62, y - 18, 124, 36);
        B(x, y - 8, ok ? n[1] : n[0] === 'forest' && !State.flags.key ? 'Bloqueada' : '???', { fontSize: '12px', color: ok ? '#f4e3b0' : '#6f6a7a' }).setX(x - 58);
        if (cur) B(x - 58, y + 20, 'você está aqui', { fontSize: '10px', color: '#e24a6a' });
      });
      cy = 360;
    } else {
      ['Continuar', 'Salvar agora', this.scale.isFullscreen ? 'Sair da tela cheia' : 'Tela cheia', 'Voltar ao menu inicial'].forEach((t, i) => B(340, 60 + i * 52, (i === this.ms ? '> ' : '  ') + t, { fontSize: '22px', color: i === this.ms ? '#ffe27a' : '#f4e3b0' }));
      B(340, 290, 'Controles: WASD anda, Shift corre, E interage,\nX Reparo, clique do mouse lança feitiço,\nF usa item da barra, M mapa, J missões, Tab mochila.', { fontSize: '13px', color: '#9a90b8', lineSpacing: 6 });
    }
    const max = Math.max(0, cy + 20 - 430); this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, max);
    if (tab === 3) { const want = this.ms * 34 - 170; if (this.ms >= 0) this.scrollY = Phaser.Math.Clamp(want, 0, max); }
    this.menuBody.y = 70 - this.scrollY;
    if (max > 0) { g.fillStyle(0x1b1426, 1).fillRect(912, 70, 6, 430); g.fillStyle(0xd9b45a, 1).fillRect(912, 70 + (430 - 430 * (430 / (430 + max))) * (this.scrollY / max), 6, 430 * (430 / (430 + max))); }
    H(480, 520, foot, { fontSize: '12px', color: '#9a90b8' });
  }
  slotBox(g, x, y, w, on) { g.fillStyle(on ? 0x5a2a2a : 0x1b1426, 0.92).fillRect(x, y, w, w); g.lineStyle(on ? 3 : 2, on ? 0xffe27a : 0x7a5a2a).strokeRect(x + 1, y + 1, w - 2, w - 2); }
  refreshBar() {
    const g = this.barG; g.clear();
    for (let i = 0; i < 10; i++) {
      this.slotBox(g, 240 + i * 48, 486, 44, i === State.sel); const it = State.inv[i];
      this.bIc[i].setVisible(!!it); this.bQ[i].setText(it && it.qty > 1 ? it.qty : '');
      if (it) this.bIc[i].setTexture('ic_' + it.id);
    }
  }
  openInv() { this.invOpen = true; this.busy = true; this.ic = State.sel; this.bar.setVisible(false); this.hud.setVisible(false); this.inv.setVisible(true); this.renderInv(); }
  closeInv() { this.invOpen = false; this.busy = false; this.inv.setVisible(false); this.hud.setVisible(true); this.bar.setVisible(true); }
  moveInv(d) { this.ic = Phaser.Math.Clamp(this.ic + d, 0, 29); this.renderInv(); }
  useInv() {
    const it = State.inv[this.ic]; if (!it) return;
    this.useIdx(this.ic); this.renderInv();
  }
  useIdx(i) {
    const it = State.inv[i], d = it && ITEMS[it.id]; if (!d) return;
    if (d.heal) { if (State.hp >= State.maxHp) return this.toast('Sua vida já está cheia.'); State.hp = Math.min(State.maxHp, State.hp + d.heal); State.take(i); this.toast(`${d.n}: vida recuperada!`); }
    else this.toast('Esse item não pode ser usado agora.');
  }
  renderInv() {
    const g = this.invG; g.clear(); box(g, 170, 60, 620, 400);
    for (let i = 0; i < 30; i++) {
      this.slotBox(g, 195 + (i % 10) * 58, 112 + ((i / 10) | 0) * 58, 52, i === this.ic); const it = State.inv[i];
      this.invIc[i].setVisible(!!it); this.invQ[i].setText(it && it.qty > 1 ? it.qty : ''); if (it) this.invIc[i].setTexture('ic_' + it.id);
    }
    const it = State.inv[this.ic], d = it && ITEMS[it.id];
    this.invTx.setText(d ? `${d.n}  (${d.cat})\n${d.d}${d.v ? `\nValor: ${d.v} galeões` : ''}` : 'Espaço vazio');
  }
  refreshQuest() {
    const q = State.quest; if (!q.done) return;
    const nm = State.name(State.other()), g = active(q.done, nm, State.hero);
    if (!g) { this.qTitle.setText('Todas concluídas'); this.qBody.setText('Explore à vontade! Novas missões chegam nas próximas fases.'); return; }
    this.qTitle.setText(g.title);
    this.qBody.setText(objs(g, nm, State.hero).map(([k, t]) => { const pr = q.done[k] ? '' : prog(k, q, State.flags); return `${q.done[k] ? '[x]' : '[ ]'} ${t}${pr ? ` (${pr})` : ''}`; }).join('\n'));
  }
  update(t, dt) {
    if (this.fishG) this.fishG(dt / 1000);
    if (!this.playing) return;
    this.mmT -= dt; if (this.mmT <= 0) { this.mmT = 150; this.drawMini(); }
    for (let i = 0; i < 5; i++) { const v = State.hp - i * 2; this.hpIc[i].setTint(v >= 2 ? 0xffffff : v === 1 ? 0xff9a9a : 0x33333f); }
    const bk = JSON.stringify([State.inv.slice(0, 10), State.sel]); if (bk !== this.barKey) { this.barKey = bk; this.refreshBar(); }
    if (!this.busy) { State.time += (dt / 1000) * 2.4; if (State.time >= 1440) { State.time = 420; State.day++; this.toast('Um novo dia começou'); } }
    const m = Math.floor(State.time);
    this.clock.setText(`${String((m / 60) | 0).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
    this.dayTx.setText(`Dia ${State.day}   ${State.galleons} galeões`);
  }
  toast(t) {
    const y = 18 + this.nt * 46; this.nt++;
    const c = this.add.container(480, -50).setDepth(10);
    const tx = this.add.text(0, 0, t, { fontFamily: F, fontSize: '16px', color: '#f4e3b0' }).setOrigin(0.5);
    const g = this.add.graphics(); box(g, -tx.width / 2 - 16, -20, tx.width + 32, 40);
    c.add([g, tx]);
    this.tweens.add({ targets: c, y: y + 20, duration: 350, ease: 'Back.Out' });
    this.time.delayedCall(2800, () => this.tweens.add({ targets: c, alpha: 0, y: y - 10, duration: 300, onComplete: () => { c.destroy(); this.nt = Math.max(0, this.nt - 1); } }));
  }
  adv() {
    if (this.finishType) this.finishType();
    else if (this.waiter) { const w = this.waiter; this.waiter = null; w(); }
  }
  async say(lines) {
    this.busy = true; this.stamp = performance.now(); this.dlg.setVisible(true); this.bar.setVisible(false);
    const q = [...lines];
    while (q.length) {
      const l = q.shift(); await this.showLine(l);
      if (l.ch) { const c = l.ch[await this.choose(l.ch)]; c.fx && c.fx(); if (c.r) q.unshift(...c.r); }
    }
    this.dlg.setVisible(false); this.busy = false; this.bar.setVisible(this.playing); this.refreshQuest(); State.save();
  }
  async showLine(l) {
    this.nameTx.setText(l.n || ''); this.txt.setText('');
    this.pt.setVisible(!!l.s); this.pf.setVisible(!!l.s);
    if (l.s) this.pt.setTexture(portrait(this, l.s, l.e || 'neutral'));
    await new Promise((res) => {
      let i = 0; const full = l.t;
      this.finishType = () => { this.tm && this.tm.remove(); this.txt.setText(full); this.finishType = null; res(); };
      this.tm = this.time.addEvent({ delay: 22, loop: true, callback: () => { i++; this.txt.setText(full.slice(0, i)); if (i >= full.length) this.finishType && this.finishType(); } });
    });
    if (!l.ch) await new Promise((res) => { this.waiter = res; });
  }
  choose(ch) {
    return new Promise((res) => {
      let sel = 0;
      const ts = ch.map((c) => this.add.text(436, 0, '', { fontFamily: F, fontSize: '16px', color: '#cfc3a0', wordWrap: { width: 470 } }).setInteractive({ useHandCursor: true }));
      const label = (i) => ts[i].setText((i === sel ? '> ' : '  ') + `${i + 1}. ` + ch[i].t);
      ts.forEach((t, i) => label(i));
      const hTot = ts.reduce((a, t) => a + t.height + 10, 0) + 14, y0 = 342 - hTot;
      this.chG.clear(); box(this.chG, 420, y0, 510, hTot);
      let y = y0 + 12; ts.forEach((t) => { t.y = y; y += t.height + 10; });
      this.dlg.add(ts);
      const draw = () => ts.forEach((t, i) => { label(i); t.setColor(i === sel ? '#ffe27a' : '#cfc3a0'); });
      const done = (i) => { ts.forEach((t) => t.destroy()); this.chG.clear(); this.chooser = null; this.stamp = performance.now(); res(i); };
      ts.forEach((t, i) => { t.on('pointerover', () => { sel = i; draw(); }); t.on('pointerdown', () => done(i)); });
      this.chooser = { move: (d) => { sel = (sel + d + ts.length) % ts.length; draw(); }, set: (i) => { if (i < ts.length) { sel = i; draw(); done(i); } }, pick: () => done(sel) };
      draw();
    });
  }
  async card(title, sub) {
    this.busy = true; this.locked = true;
    const r = this.add.rectangle(480, 270, 960, 540, 0x000000, 1).setAlpha(0).setDepth(20);
    const a = this.add.text(480, 220, title, { fontFamily: F, fontSize: '36px', color: '#f4d27a', fontStyle: 'bold', align: 'center' }).setOrigin(0.5).setDepth(21).setAlpha(0);
    const b = this.add.text(480, 330, sub, { fontFamily: F, fontSize: '18px', color: '#f4e3b0', align: 'center', lineSpacing: 8 }).setOrigin(0.5).setDepth(21).setAlpha(0);
    this.tweens.add({ targets: r, alpha: 1, duration: 700 }); await wait(this, 800);
    this.tweens.add({ targets: [a, b], alpha: 1, duration: 600 }); await wait(this, 5000);
    this.tweens.add({ targets: [r, a, b], alpha: 0, duration: 700 }); await wait(this, 750);
    [r, a, b].forEach((o) => o.destroy()); this.locked = false; this.busy = false;
  }
}
