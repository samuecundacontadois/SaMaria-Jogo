import Phaser from 'phaser';
import { State } from '../systems/state.js';
import { CHARS } from '../config/chars.js';
import { charSheet, makeAnims } from '../utils/art.js';
import { script } from '../data/dialogues.js';
import { MAPS, T } from '../data/maps.js';
import { SCHED } from '../data/npcs.js';
import { ITEMS, GIFT, SHOPS } from '../data/items.js';
import { loveMenu, runDate, tempt, inviteGuest, lv, thief } from '../data/story.js';
import { LETTERS, SPOTS } from '../data/letters.js';
import { SECRETS, secretCount } from '../data/secrets.js';

const DIRS = ['down', 'left', 'right', 'up'];
const dirOf = (dx, dy) => (Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy > 0 ? 0 : 3);

export default class Hall extends Phaser.Scene {
  constructor() { super('Hall'); }
  create(data) {
    const s = this, ui = State.ui, id = (data && data.map) || State.map || 'hall', M = MAPS[id];
    s.mid = id; s.M = M; State.map = id; State.flags.seen = State.flags.seen || {}; State.flags.seen[id] = 1; State.flags.fixed = State.flags.fixed || {};
    s.castAt = 0; s.hurtUntil = 0; s.classActive = false; s.classLeft = 0; s.leaving = false; s.near = null;
    const W = M.w * T, H = M.h * T;
    s.cameras.main.setZoom(2); s.cameras.main.setBounds(0, 0, W, H); s.cameras.main.fadeIn(350);
    s.physics.world.setBounds(0, 0, W, H);
    s.solids = s.physics.add.staticGroup(); s.actors = []; s.npcs = []; s.npcGroup = s.physics.add.group(); s.crowd = []; s.sparks = s.physics.add.group(); s.enemies = s.physics.add.group(); s.broken = []; s.extra = []; s.pickups = []; s.follower = null;
    s.solid = (x, y, w, h) => { const z = s.add.zone(x + w / 2, y + h / 2, w, h); s.solids.add(z); return z; };
    M.build(s); s.lockT = 0;
    SECRETS.filter((x) => x[1] === id && !(State.flags.secrets || {})[x[0]]).forEach(([sid, , x, y, txt, gal, item], i) => {
      const sp = s.add.image(x * T, y * T, 'spark').setDepth(y * T).setAlpha(0.1).setScale(0.8); s.tweens.add({ targets: sp, alpha: 0.9, duration: 1100, yoyo: true, repeat: -1, delay: i * 300, hold: 900 });
      s.extra.push({ sid, x: x * T, y: y * T, r: 22, fn: () => s.findSecret(sid, txt, gal, item, sp) });
    });
    (M.enemies || []).forEach(([t, x, y]) => s.spawnEnemy(t, x * T, y * T));
    s.ring = s.add.text(0, 0, 'X', { fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: '#fff', backgroundColor: '#2a4a7a', padding: { x: 3, y: 1 } }).setOrigin(0.5).setDepth(1000).setVisible(false);

    charSheet(s, 'hero', State.heroLook); makeAnims(s, 'hero');
    const sp = data && data.at ? M.spawns[data.at] : null;
    const st = M.spawns.start || [W / T / 2, H / T / 2];
    const pos = sp ? { x: sp[0] * T, y: sp[1] * T } : State.pos || { x: st[0] * T, y: st[1] * T };
    s.player = s.actor('hero', pos.x, pos.y); s.player.dir = 0;
    s.cameras.main.startFollow(s.player, true, 0.12, 0.12);
    s.physics.add.collider(s.player, s.solids);
    s.physics.add.collider(s.npcGroup, s.solids);
    s.physics.add.collider(s.player, s.npcGroup);
    s.physics.add.collider(s.npcGroup, s.npcGroup);
    (M.crowd || []).forEach(([x, y], i) => s.addCrowd(i, x * T, y * T));
    s.physics.add.collider(s.sparks, s.solids, (sp) => sp.destroy());
    s.physics.add.overlap(s.sparks, s.enemies, (sp, e) => { sp.destroy(); e.hp--; e.setTint(0xff6666); s.time.delayedCall(120, () => e.active && e.clearTint()); if (e.hp <= 0) s.killEnemy(e); });
    s.physics.add.overlap(s.player, s.enemies, () => s.hurt());
    s.input.keyboard.on('keydown-X', () => s.reparo());
    s.input.on('pointerdown', (p) => s.attack(p));
    s.syncNpcs(); s.checkQuests(); s.syncLetters();
    if (State.flags.together && State.flags.follow) { const lid = State.other(); if (!s.npcs.find((o) => o.id === lid)) s.addNpc(lid, s.player.x - 14, s.player.y); s.setFollower(s.npcs.find((o) => o.id === lid)); }
    if (State.flags.huntActive && id !== 'forest') State.flags.huntActive = false;
    if (State.flags.huntActive) s.time.delayedCall(1200, () => State.ui.toast('Caçada! Derrote 4 criaturas com o seu par.'));
    if (State.flags.dateScene && id === ({ torre: 'torre', clareira: 'clareira' }[State.flags.datePlace] || 'lake')) s.time.delayedCall(1000, () => runDate(s));

    s.hint = s.add.text(0, 0, 'E', { fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: '#fff', backgroundColor: '#5a2a2a', padding: { x: 3, y: 1 } }).setOrigin(0.5).setDepth(1000).setVisible(false);
    s.k = s.input.keyboard.addKeys({ W: 'W', A: 'A', S: 'S', D: 'D', U: 'UP', Dn: 'DOWN', L: 'LEFT', R: 'RIGHT', SH: 'SHIFT' });
    s.input.keyboard.on('keydown-E', () => s.interact());
    s.time.addEvent({ delay: 1000, loop: true, callback: () => { State.pos = { x: s.player.x, y: s.player.y }; } });
    s.time.addEvent({ delay: 3000, loop: true, callback: () => { s.syncNpcs(); s.checkQuests(); s.syncLetters(); } });

    ui.showHud(true); State.save();
    if (!State.flags.intro) {
      State.flags.intro = true;
      s.time.delayedCall(1000, () => { ui.toast('Nova missão: Um novo começo'); ui.say([{ s: 'hero', e: 'happy', t: 'Então é isso. Estou em Hogwarts... e na Grifinória! Preciso conhecer o pessoal. (WASD anda, Shift corre, E interage.)' }]); });
    }
  }
  actor(key, x, y) {
    const a = this.physics.add.sprite(x, y, key, 0).setOrigin(0.5, 1);
    a.body.setSize(8, 6).setOffset(4, 18); a.setCollideWorldBounds(true);
    a.sh = this.add.image(x, y, 'shadow'); this.actors.push(a); return a;
  }
  addNpc(id, x, y) {
    charSheet(this, id, CHARS[id]); makeAnims(this, id);
    const n = this.actor(id, x, y); n.id = id; n.home = { x, y }; n.next = 0; n.until = 0; n.moving = false; n.dir = 0;
    this.npcGroup.add(n); n.body.setImmovable(true); this.npcs.push(n);
    n.arrow = this.add.image(x, y - 34, 'arrow').setDepth(1100); if (id === State.other()) n.arrow.setTint(0xff7ab8);
    n.tag = this.add.text(x, y - 38, State.name(id), { fontFamily: 'monospace', fontSize: '8px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(1100);
  }
  reparo() {
    const ui = State.ui; if (ui.busy || this.leaving) return;
    if (!State.flags.learned && !this.lessonActive) return ui.toast('Você ainda não aprendeu o Reparo. Procure a aula de Feitiços (Prof. Daniela).');
    const p = this.player, b = this.broken.find((o) => !o.fixed && (o.lesson ? this.lessonActive : State.flags.learned) && Math.hypot(o.x - p.x, o.y - p.y) < 56);
    if (!b) return ui.toast('Não há nada para consertar por aqui.');
    this.castUntil = this.time.now + 500; this.player.dir = b.x < this.player.x ? 1 : 2; b.fixed = true; State.flags.fixed[b.id] = 1;
    if (!b.lesson) { State.flags.fixes = (State.flags.fixes || 0) + 1; State.galleons += 5; }
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * 6.28, st = this.add.rectangle(b.x, b.y - 6, 3, 3, i % 2 ? 0xfff6c0 : 0x9ad8ff).setDepth(2000);
      this.tweens.add({ targets: st, x: b.x + Math.cos(a) * 22, y: b.y - 6 + Math.sin(a) * 22, alpha: 0, duration: 600, onComplete: () => st.destroy() });
    }
    this.tweens.add({ targets: b.img, angle: 0, duration: 300 }); b.img.clearTint(); b.deb.forEach((d) => d.destroy()); if (b.rm && b.img.sol) { this.solids.remove(b.img.sol, true, true); b.img.sol = null; }
    if (b.lesson) { ui.toast('Reparo! Muito bem!'); if (this.broken.filter((o) => o.lesson).every((o) => o.fixed)) this.finishLesson(); }
    else { ui.toast('Reparo! +5 galeões'); if ((State.flags.fixes || 0) >= 3) State.complete('repair'); ui.refreshQuest(); }
    State.save();
  }
  async offerLesson(n) {
    const ui = State.ui, t = State.time;
    if (this.mid !== 'feiticos' || State.flags.learned || this.lessonActive || t < 480 || t > 1020) return;
    await ui.say([{ s: 'daniela', n: 'Prof. Daniela', e: 'happy', t: 'Você quer aprender o feitiço Reparo? É um dos mais úteis do castelo. Eu deixei três objetos quebrados aqui para treinar!', ch: [
      { t: 'Quero aprender, professora!', r: [{ s: 'daniela', n: 'Prof. Daniela', e: 'happy', t: 'Ótimo! Chegue perto de cada objeto quebrado e aperte a tecla X. Sem pressa, a varinha entende o seu ritmo.' }], fx: () => { this.lessonActive = true; } },
      { t: 'Agora não.' }] }]);
  }
  async finishLesson() {
    this.lessonActive = false; State.flags.learned = true; State.galleons += 20; State.add('daniela', 'f', 40);
    await State.ui.say([{ s: 'daniela', n: 'Prof. Daniela', e: 'happy', t: 'Perfeito! Agora você sabe o Reparo. Use X perto de qualquer coisa quebrada pelo castelo. Aqui estão 20 galeões pelo esforço!' }]);
    State.complete('learn'); State.ui.refreshQuest();
  }
  attack(ptr) {
    const ui = State.ui; if (ui.busy || this.leaving || this.time.now < this.castAt) return; this.castAt = this.time.now + 350;
    const p = this.player, w = this.cameras.main.getWorldPoint(ptr.x, ptr.y), a = Math.atan2(w.y - (p.y - 12), w.x - p.x);
    State.ach('Primeiro Feitiço'); p.dir = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) < 0 ? 1 : 2) : Math.sin(a) > 0 ? 0 : 3;
    this.castUntil = this.time.now + 260; const sp = this.sparks.create(p.x, p.y - 12, 'spark').setDepth(1500); sp.body.setSize(6, 6); sp.setVelocity(Math.cos(a) * 240, Math.sin(a) * 240).setAngle(0);
    this.tweens.add({ targets: sp, angle: 360, duration: 500 }); this.time.delayedCall(650, () => sp.active && sp.destroy());
  }
  spawnEnemy(type, x, y) {
    const D = { pixie: { tex: 'pixie', hp: 3, sp: 42 }, spider: { tex: 'spider', hp: 4, sp: 58 }, wisp: { tex: 'wisp', hp: 3, sp: 36 } }[type];
    const e = this.enemies.create(x, y, D.tex).setDepth(1200); e.hp = D.hp; e.sp = D.sp; e.type = type; e.body.setSize(10, 10); e.setCollideWorldBounds(true);
    this.tweens.add({ targets: e, scaleY: 0.8, duration: type === 'spider' ? 160 : 110, yoyo: true, repeat: -1 });
  }
  spawnPixies(n) { for (let i = 0; i < n; i++) this.spawnEnemy('pixie', (8 + Math.random() * 12) * T, (4.5 + Math.random() * 3) * T); this.classLeft = n; }
  killEnemy(e) {
    if (!e.active || !e.body.enable) return; e.body.enable = false; State.galleons += 1; State.flags.kills = (State.flags.kills || 0) + 1;
    if (State.flags.kills >= 6) State.complete('creatures'); State.ui.refreshQuest();
    if (Math.random() < 0.15 && State.addItem('pocao')) State.ui.toast('A criatura deixou uma poção!');
    this.tweens.add({ targets: e, scale: 0, alpha: 0, duration: 250, onComplete: () => e.destroy() }); if (this.classActive) this.classLeft--;
    const F = State.flags; if (F.huntActive && (F.kills || 0) - F.huntStart >= 4) this.finishHunt();
  }
  async finishHunt() {
    const F = State.flags; F.huntActive = false; const o = State.other(); State.add(o, 'n', 100); State.ui.toast('Caçada concluída! +100 de namoro');
    await State.ui.say([{ s: o === State.hero ? 'hero' : o, n: State.name(o), e: 'happy', t: 'Que dupla incrível! Eu me diverti muito com você.' }]);
  }
  hurt() {
    if (this.time.now < this.hurtUntil || State.ui.busy || this.leaving) return;
    this.hurtUntil = this.time.now + 1100; State.hp--; this.player.setTint(0xff5555); this.time.delayedCall(250, () => this.player.clearTint());
    if (State.hp <= 0) this.faint();
  }
  faint() {
    State.hp = Math.ceil(State.maxHp / 2); this.classActive = false; this.enemies.clear(true, true); State.pos = null;
    State.ui.toast('Você desmaiou e acordou no dormitório.'); this.go('dorm', 'fromCommon');
  }
  async findSecret(sid, txt, gal, item, sp) {
    const F = State.flags; F.secrets = F.secrets || {}; if (F.secrets[sid]) return; F.secrets[sid] = 1; this.extra = this.extra.filter((o) => o.sid !== sid); sp.destroy();
    State.galleons += gal; let t = `Segredo descoberto! +${gal} galeões`; if (item && State.addItem(item)) t += ` e ${ITEMS[item].n}`;
    State.ui.toast(t); F._sc = secretCount(F); if (F._sc >= 10) State.complete('secrets'); State.ui.refreshQuest(); State.save();
    await State.ui.say([{ s: 'hero', e: 'surprised', t: txt }]);
  }
  async offerGame(n, kind) {
    const ui = State.ui, F = State.flags, t = State.time, key = 'gd_' + kind, pot = kind === 'pocoes', tn = State.name(n.id);
    if (this.mid !== kind || t < 480 || t > 1020 || F[key] === State.day) return;
    let go = false;
    await ui.say([{ s: n.id, n: tn, e: 'happy', t: pot ? 'Hoje vamos preparar uma poção! Eu mostro os ingredientes em ordem e você repete a sequência. Topa?' : 'Hoje a aula de Herbologia é prática: as plantas vão pedir cuidados e você responde rápido. Topa?', ch: [{ t: 'Topa!', fx: () => { go = true; } }, { t: 'Agora não.' }] }]);
    if (!go) return;
    const ok = pot ? await ui.potionGame() : await ui.herbGame();
    if (ok) {
      F[key] = State.day; State.galleons += 35; State.add(n.id, 'f', 30); State.addItem(pot ? 'pocao' : 'flor'); State.complete(pot ? 'pocoes' : 'herb');
      await ui.say([{ s: n.id, n: tn, e: 'happy', t: 'Muito bem! Nota máxima... ou quase. Aqui estão 35 galeões e um brinde pelo esforço.' }]);
    } else await ui.say([{ s: n.id, n: tn, e: 'neutral', t: 'Quase! Pode tentar de novo, sem pressa. Eu sei que você consegue.' }]);
  }
  async specialQuest(n) {
    const ui = State.ui, F = State.flags, id = n.id, lais = id === 'lais';
    if (lv(id, 'f') < 10 || F['sq_' + id]) return;
    const say = (e, t) => ui.say([{ s: id, n: State.name(id), e, t }]);
    if (!F['sqs_' + id]) {
      F['sqs_' + id] = true; State.save();
      return say('sad', lais ? 'Eu queria te pedir um favor... Quero ir para uma festa, mas meu tornozelo tá machucado. Uma Poção de cura resolveria! Dá para você arrumar uma? Vende na barraca da Violeta, em Hogsmeade.' : 'Posso te contar uma coisa? Só queria namorar... Mas eu preciso de coragem e de um bom presente: uma flor e um chocolate. Você me ajuda?');
    }
    const need = lais ? ['pocao'] : ['flor', 'choc'], has = need.every((k) => State.inv.some((i) => i && i.id === k));
    if (!has) return say('neutral', lais ? 'Ainda estou torcendo para conseguir aquela poção de cura... meu tornozelo agradece.' : 'Ainda estou juntando uma flor e um chocolate. Só queria namorar, sabe?');
    let give = false;
    await ui.say([{ s: 'hero', n: State.name('hero'), e: 'happy', t: lais ? 'Trouxe uma Poção de cura para o seu tornozelo!' : 'Trouxe uma flor e um chocolate para você!', ch: [{ t: 'Entregar', fx: () => { give = true; } }, { t: 'Agora não' }] }]);
    if (!give) return;
    need.forEach((k) => State.take(State.inv.findIndex((i) => i && i.id === k)));
    F['sq_' + id] = true; State.galleons += 80; State.add(id, 'f', 50); State.complete(lais ? 'sqlais' : 'sqpedro'); this.pop(n);
    return say('happy', lais ? 'Meu tornozelo! Eu vou para a festa! Valeu mesmo. Toma aqui, 80 galeões, você mereceu.' : 'Eu levei a flor e o chocolate e ela disse que prefere ficar só com os livros. Mas pelo menos eu tentei! Valeu pela ajuda. Aqui, 80 galeões.');
  }
  async offerClass(n) {
    const ui = State.ui, t = State.time;
    if (this.mid !== 'defesa' || this.classActive || State.flags.classDay === State.day || t < 480 || t > 1020) return;
    await ui.say([{ s: 'carlinhos', n: n.name || 'Prof. Carlinhos', e: 'happy', t: 'E então, salsicha? Quer participar da aula de hoje? Vamos enfrentar uns duendes da Cornualha!', ch: [
      { t: 'Quero! Aula de Defesa, vamos lá.', r: [{ s: 'carlinhos', n: 'Prof. Carlinhos', e: 'happy', t: 'Esse é o espírito, salsicha! Mire com o mouse, clique para lançar o feitiço e fuja deles. Boa sorte!' }], fx: () => { State.flags.classDay = State.day; this.classActive = true; this.classLeft = 5; this.time.delayedCall(300, () => this.spawnPixies(5)); } },
      { t: 'Agora não, professor.' }] }]);
  }
  async finishClass() {
    this.classActive = false; State.galleons += 30; State.add('carlinhos', 'f', 30);
    await State.ui.say([{ s: 'carlinhos', n: 'Prof. Carlinhos', e: 'happy', t: 'Excelente, salsicha! Nota dez. Ou nove e meio, mas não conte para os outros. Aqui está o seu prêmio: 30 galeões.' }]);
    State.complete('class');
  }
  async openShop(n) {
    const ui = State.ui; n.talking = true;
    if (n.id === 'rubi' && State.hero === 'maria') { await ui.say([{ s: 'rubi', n: 'Sra. Rubi', e: 'happy', t: 'Ah, querida! O anel de noivado quem escolhe é o seu par. Não vou estragar a surpresa.' }]); n.talking = false; return; }
    if (n.id === 'rubi' && !(State.flags.together && lv(State.other(), 'n') >= 10)) { await ui.say([{ s: 'rubi', n: 'Sra. Rubi', e: 'neutral', t: 'Anéis de noivado são para quem tem o coração pronto. Volte quando o seu amor estiver firme, querido(a).' }]); n.talking = false; return; }
    await ui.say([{ s: n.id, n: State.name(n.id), e: 'happy', t: 'Bem-vindo(a)! Olhe à vontade. Também compro peixes e outras coisas da sua mochila.' }]);
    await ui.shop(n.id); n.talking = false;
  }
  addCrowd(i, x, y) {
    const h = this.M.house != null ? this.M.house : (i * 7 + 1) % 4, key = `st${h}${(i * 3 + 1) % 4}`;
    makeAnims(this, key);
    const n = this.actor(key, x, y); n.id = key; n.home = { x, y }; n.next = Phaser.Math.Between(0, 2500); n.until = 0; n.moving = false; n.dir = Phaser.Math.Between(0, 3);
    this.npcGroup.add(n); n.body.setImmovable(true); this.crowd.push(n); this.idle(n);
  }
  dropNpc(n) {
    this.npcs = this.npcs.filter((o) => o !== n); this.actors = this.actors.filter((o) => o !== n);
    this.tweens.add({ targets: [n, n.sh, n.arrow, n.tag], alpha: 0, duration: 400, onComplete: () => { n.sh.destroy(); n.arrow.destroy(); n.tag.destroy(); n.destroy(); } }); n.body.enable = false;
  }
  syncNpcs() {
    const t = State.time, want = {};
    Object.keys(SCHED).forEach((k) => { if (k === 'ladrao' && State.flags.thiefDone) return; if (k === 'love' && State.flags.together && State.flags.follow) return; const id = k === 'love' ? State.other() : k, e = SCHED[k].find(([a, b]) => t >= a && t < b); if (e && e[2] === this.mid) want[id] = e; });
    this.npcs.filter((n) => !want[n.id] && !n.talking && !n.follow && !n.date).forEach((n) => this.dropNpc(n));
    Object.entries(want).forEach(([id, e]) => { if (!this.npcs.some((n) => n.id === id)) this.addNpc(id, e[3][0] * T, e[3][1] * T); });
  }
  checkQuests() {
    const d = State.quest.done, m = this.mid;
    if ((m === 'common' || m === 'dorm') && !d.door && ['explore', 'lais', 'pedro', 'love'].every((k) => d[k])) State.complete('door');
    if (m === 'common') State.complete('common');
    if (m === 'dorm') State.complete('dorm'); if (m === 'forest') State.complete('forest'); if (m === 'caverna') State.complete('cave');
    const o = State.other(); if (lv(o, 'l') >= 9) State.complete('flirt9'); if (State.flags.together && lv(o, 'n') >= 10) State.complete('love10'); State.flags._sc = secretCount(State.flags); if (State.flags._sc >= 10) State.complete('secrets');
  }
  setFollower(n) { n.follow = true; this.follower = n; this.npcGroup.remove(n); this.physics.add.collider(n, this.solids); }
  syncLetters() {
    const F = State.flags; F.letters = F.letters || {}; const hh = lv(State.other(), 'l');
    SPOTS.filter((sp) => sp.map === this.mid && !F.letters[sp.id] && hh >= sp.min && !this.pickups.some((k) => k.id === sp.id)).forEach((sp) => {
      const img = this.add.image(sp.x * T, sp.y * T, 'letter').setDepth(sp.y * T), g = this.add.image(sp.x * T, sp.y * T - 2, 'glow').setDepth(960).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5).setScale(0.5);
      this.tweens.add({ targets: [img, g], y: '-=3', duration: 900, yoyo: true, repeat: -1 });
      this.pickups.push({ id: sp.id, x: sp.x * T, y: sp.y * T, r: 22, img, g, fn: () => this.collectLetter(sp.id) });
    });
  }
  async collectLetter(id) {
    const k = this.pickups.find((o) => o.id === id); if (!k) return; this.pickups = this.pickups.filter((o) => o !== k); k.img.destroy(); k.g.destroy();
    const F = State.flags; F.letters[id] = 1; State.ach('Primeira Carta');
    const txt = LETTERS[id][1].replace(/\{r\}/g, State.name('hero')).replace(/\{s\}/g, State.name(State.other()));
    await State.ui.letter(`Carta ${id + 1} — ${LETTERS[id][0]}`, txt);
    if (Object.keys(F.letters).length >= 20) State.complete('letters'); State.ui.refreshQuest(); State.save();
  }
  go(map, at) {
    if (this.leaving) return; this.leaving = true; this.player.setVelocity(0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ map, at }));
    this.cameras.main.fadeOut(250, 0, 0, 0);
  }
  idle(a) { a.anims.stop(); a.setFrame(a.dir * 3); }
  update(time) {
    const ui = State.ui, p = this.player, k = this.k;
    let vx = 0, vy = 0, run = false;
    if (!ui.busy && !this.leaving) {
      vx = (k.D.isDown || k.R.isDown ? 1 : 0) - (k.A.isDown || k.L.isDown ? 1 : 0);
      vy = (k.S.isDown || k.Dn.isDown ? 1 : 0) - (k.W.isDown || k.U.isDown ? 1 : 0); run = k.SH.isDown;
    }
    const m = Math.hypot(vx, vy) || 1, sp = run ? 115 : 68;
    p.setVelocity((vx / m) * sp, (vy / m) * sp);
    if (vx || vy) { p.setFlipX(false); p.dir = vx ? (vx < 0 ? 1 : 2) : vy > 0 ? 0 : 3; p.anims.timeScale = run ? 1.6 : 1; p.anims.play('hero-' + DIRS[p.dir], true); }
    else if (time < (this.castUntil || 0)) { p.anims.stop(); p.setFrame(12); p.setFlipX(p.dir === 1); } else { p.setFlipX(false); this.idle(p); }

    [...this.npcs, ...this.crowd].forEach((n) => {
      if (n.follow) {
        if (n.talking || ui.busy) { n.setVelocity(0); this.idle(n); return; }
        const d = Math.hypot(p.x - n.x, p.y - n.y);
        if (d > 150) n.setPosition(p.x - 14, p.y); else if (d > 26) { const a = Math.atan2(p.y - n.y, p.x - n.x); n.setVelocity(Math.cos(a) * 72, Math.sin(a) * 72); n.dir = dirOf(p.x - n.x, p.y - n.y); n.anims.play(n.id + '-' + DIRS[n.dir], true); } else { n.setVelocity(0); this.idle(n); }
        return;
      }
      if (n.talking || ui.busy) { n.setVelocity(0); if (n.moving) { n.moving = false; n.next = time + 800; } this.idle(n); return; }
      if (n.moving && time > n.until) { n.setVelocity(0); n.moving = false; n.next = time + Phaser.Math.Between(1200, 3500); this.idle(n); }
      else if (!n.moving && time > n.next) {
        const a = Phaser.Math.Between(0, 3); let dx = [0, -1, 1, 0][a], dy = [1, 0, 0, -1][a];
        if (Math.hypot(n.x + dx * 16 - n.home.x, n.y + dy * 16 - n.home.y) > (n.talking === undefined && this.crowd.includes(n) ? 44 : 26)) { dx = -dx; dy = -dy; }
        n.dir = dx ? (dx < 0 ? 1 : 2) : dy > 0 ? 0 : 3; n.setVelocity(dx * 28, dy * 28); n.moving = true; n.until = time + Phaser.Math.Between(400, 800);
        n.anims.play(n.id + '-' + DIRS[n.dir], true);
      }
    });
    this.enemies.children.iterate((e) => {
      if (!e || !e.active || !e.body.enable) return; if (ui.busy) { e.setVelocity(0); return; }
      const d = Math.hypot(p.x - e.x, p.y - 8 - e.y), chase = this.classActive || d < 150; let a;
      if (chase) a = Math.atan2(p.y - 8 - e.y, p.x - e.x) + Math.sin(time / 300 + e.x) * (e.type === 'wisp' ? 1.4 : 0.9);
      else { if (time > (e.wt || 0)) { e.wt = time + Phaser.Math.Between(900, 2000); e.wa = Math.random() * 6.28; } a = e.wa; }
      const sp = chase ? e.sp : e.sp * 0.4; e.setVelocity(Math.cos(a) * sp, Math.sin(a) * sp); e.setDepth(e.y + 50);
    });
    const fo = this.follower;
    if (fo && fo.active && State.flags.follow && !ui.busy && time > (this.coT || 0)) {
      let tg = null, bd = 160; this.enemies.children.iterate((e) => { if (!e || !e.active || !e.body.enable) return; const d = Math.hypot(e.x - fo.x, e.y - fo.y); if (d < bd) { bd = d; tg = e; } });
      if (tg) { this.coT = time + 1100; const an = Math.atan2(tg.y - (fo.y - 12), tg.x - fo.x), sp2 = this.sparks.create(fo.x, fo.y - 12, 'spark').setDepth(1500).setTint(0xff7ab8); sp2.body.setSize(6, 6); sp2.setVelocity(Math.cos(an) * 240, Math.sin(an) * 240); this.time.delayedCall(650, () => sp2.active && sp2.destroy()); }
    }
    if (this.classActive && this.classLeft <= 0 && this.enemies.countActive() === 0 && !ui.busy && !this.finishing) { this.finishing = true; this.finishClass().then(() => { this.finishing = false; }); }
    const nb = this.broken.find((o) => !o.fixed && (o.lesson ? this.lessonActive : State.flags.learned) && Math.hypot(o.x - p.x, o.y - p.y) < 56);
    this.ring.setVisible(!!nb && !ui.busy); if (nb) this.ring.setPosition(nb.x, nb.y - 30);
    this.npcs.forEach((n) => { if (n.arrow && n.arrow.active) { n.arrow.setPosition(n.x, n.y - 33 + Math.sin(time / 180) * 2); n.tag.setPosition(n.x, n.y - 37); } });
    this.actors.forEach((a) => { a.setDepth(a.y); a.sh.setPosition(a.x, a.y - 1).setDepth(a.y - 1); });

    if (!this.leaving && !ui.busy) {
      const px = p.x, py = p.y - 3;
      for (const d of this.M.doors) { const [x, y, w, h] = d.r; if (px >= x * T && px <= (x + w) * T && py >= y * T && py <= (y + h) * T) { const msg = d.lock && d.lock(); if (msg) { if (time > this.lockT) { this.lockT = time + 2500; ui.toast(msg); } p.x -= 3; } else this.go(d.to, d.at); break; } }
    }
    const q = State.quest;
    if (this.mid === 'hall' && !q.done.explore) {
      const z = { staff: p.y < 8 * T && p.x > 12 * T && p.x < 28 * T, table: p.x < 12 * T && p.y > 9 * T && p.y < 26 * T, doors: p.y > 25.5 * T && p.x > 16 * T && p.x < 24 * T };
      Object.keys(z).forEach((n) => {
        if (z[n] && !q.visited[n]) {
          q.visited[n] = 1; ui.refreshQuest();
          if (Object.keys(q.visited).length >= 3) State.complete('explore'); else ui.toast(`Explorando o salão (${Object.keys(q.visited).length}/3)`);
        }
      });
    }
    let near = null, bd = 26;
    this.npcs.forEach((n) => { const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < bd) { bd = d; near = n; } });
    (this.M.things || []).concat(this.pickups, this.extra).forEach((t) => { const d = Math.hypot(t.x - p.x, t.y - p.y); if (d < t.r && d < bd + 6) { bd = d; near = t; } });
    this.near = ui.busy || this.leaving ? null : near;
    this.hint.setVisible(!!this.near);
    if (this.near) this.hint.setPosition(this.near.x, this.near.y - (this.near.fn ? 30 : 32));
  }
  interact() {
    const ui = State.ui; if (ui.busy || this.leaving || !this.near) return;
    if (this.near.fn) this.near.fn(this); else this.talkTo(this.near);
  }
  async talkTo(n) {
    const p = this.player; n.talking = true; n.setVelocity(0); n.dir = dirOf(p.x - n.x, p.y - n.y); n.setFrame(n.dir * 3);
    const rf = () => (State.rel[n.id] ? State.rel[n.id].f : 0), before = rf();
    if (n.id === 'ladrao') { await thief(this, n); return; }
    if (SHOPS[n.id]) { await this.openShop(n); return; }
    await State.ui.say(script(n.id));
    await this.offerGift(n);
    if (n.id === State.other()) await loveMenu(this, n);
    else { await inviteGuest(this, n); if (n.id === 'arthur' && State.flags.together && !State.flags.arthurTest) await tempt(this, n); }
    if (n.id === 'carlinhos') await this.offerClass(n);
    if (n.id === 'daniela') await this.offerLesson(n);
    if (n.id === 'lais' || n.id === 'pedro') await this.specialQuest(n);
    if (n.id === 'davi') await this.offerGame(n, 'pocoes');
    if (n.id === 'biel') await this.offerGame(n, 'herbologia');
    n.talking = false;
    if (rf() > before && n.active) this.pop(n);
  }
  async offerGift(n) {
    const slot = State.inv[State.sel], it = slot && ITEMS[slot.id], r = State.rel[n.id], nm = State.name(n.id);
    if (!it || !it.gift || r.g === State.day) return;
    const idx = State.sel, pts = (GIFT[n.id] || {})[slot.id] || 20;
    await State.ui.say([{ s: 'hero', e: 'neutral', t: `Quero dar ${it.n.toLowerCase()} para ${nm}?`, ch: [
      { t: `Dar ${it.n.toLowerCase()}`, fx: () => { State.take(idx); r.g = State.day; State.add(n.id, 'f', pts); State.ui.toast(`${it.n} entregue a ${nm}`); State.complete('give'); State.ach('Primeiro Presente'); if (n.id === State.other()) State.add(n.id, State.flags.together ? 'n' : 'l', Math.round(pts * 0.8)); }, r: [{ s: n.id, n: nm, e: pts >= 70 ? 'happy' : 'surprised', t: pts >= 70 ? 'Nossa, esse é dos meus favoritos! Valeu mesmo.' : 'Que gentileza! Valeu por lembrar de mim.' }] },
      { t: 'Agora não' }] }]);
  }
  pop(n) {
    const h = this.add.image(n.x, n.y - 28, 'heart').setDepth(1000);
    this.tweens.add({ targets: h, y: h.y - 14, alpha: 0, duration: 900, onComplete: () => h.destroy() });
  }
}
