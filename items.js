import { CHARS } from '../config/chars.js';
import { groupOf, objs } from '../data/quests.js';
const defInv = () => { const a = Array(30).fill(null); a[0] = { id: 'wand', qty: 1 }; a[1] = { id: 'rod', qty: 1 }; a[2] = { id: 'choc', qty: 3 }; a[3] = { id: 'book', qty: 1 }; return a; };
const KEY = 'samaria_save', VER = 1;
export const State = {
  ui: null, hero: 'maria', heroLook: null, time: 420, day: 1, galleons: 0, rel: {}, flags: {}, quest: {}, pos: null, map: 'hall', inv: defInv(), sel: 0, hp: 10, maxHp: 10,
  addItem(id, q = 1) { let t = this.inv.find((x) => x && x.id === id); if (t) { t.qty += q; return true; } const i = this.inv.indexOf(null); if (i < 0) return false; this.inv[i] = { id, qty: q }; return true; },
  take(i) { const t = this.inv[i]; if (!t) return; t.qty--; if (t.qty <= 0) this.inv[i] = null; },
  init(hero, look) {
    Object.assign(this, { hero, heroLook: look, time: 420, day: 1, galleons: 0, flags: {}, pos: null, map: 'hall', inv: defInv(), sel: 0, hp: 10 });
    this.rel = { lais: { f: 0, l: 0, t: 0 }, pedro: { f: 0, l: 0, t: 0 }, [this.other()]: { f: 0, l: 0, t: 0 } };
    this.quest = { id: 'q1', done: {}, visited: {} };
  },
  other() { return this.hero === 'maria' ? 'samuel' : 'maria'; },
  name(id) { return CHARS[id === 'hero' ? this.hero : id].name; },
  look(id) { return id === 'hero' ? this.heroLook : CHARS[id]; },
  add(id, k, n) { const r = this.rel[id] || (this.rel[id] = { f: 0, l: 0, t: 0 }); r[k] = Math.max(0, Math.min(1000, (r[k] || 0) + n)); if (k === 'f' && r.f >= 100) this.ach('Primeira Amizade'); if (k === 'n' && r.n >= 1000) this.ach('Amor Verdadeiro'); this.save(); },
  hearts(id, k) { return Math.floor(this.rel[id][k] / 100); },
  complete(k) {
    const q = this.quest; if (q.done[k]) return; q.done[k] = true;
    const g = groupOf(k), vis = objs(g, '', this.hero), left = vis.filter(([x]) => !q.done[x]).length, hidden = !vis.some(([x]) => x === k);
    if (!left) this.galleons += g.reward;
    this.ui?.refreshQuest(); if (!(hidden && left)) this.ui?.toast(left ? 'Objetivo concluído' : `Missão concluída: ${g.title} (+${g.reward} galeões)`); this.save();
  },
  has() { try { const d = JSON.parse(localStorage.getItem(KEY)); return !!d && d.v === VER; } catch { return false; } },
  snap() { return { v: VER, hero: this.hero, look: this.heroLook, time: this.time, day: this.day, gal: this.galleons, rel: this.rel, flags: this.flags, quest: this.quest, pos: this.pos, map: this.map, inv: this.inv, sel: this.sel, hp: this.hp }; },
  apply(d) { Object.assign(this, { hero: d.hero, heroLook: d.look, time: d.time, day: d.day, galleons: d.gal, rel: d.rel, flags: d.flags, quest: d.quest, pos: d.pos, map: d.map || 'hall', inv: d.inv || defInv(), sel: d.sel || 0, hp: d.hp || 10 }); },
  save() { if (!this.heroLook) return; try { localStorage.setItem(KEY, JSON.stringify(this.snap())); } catch {} },
  saveSafe() { if (!this.heroLook) return; try { localStorage.setItem(KEY + '_safe', JSON.stringify(this.snap())); } catch {} },
  load(k = KEY) { try { const d = JSON.parse(localStorage.getItem(k)); if (!d || d.v !== VER) return false; this.apply(d); return true; } catch { return false; } },
  loadSafe() { if (!this.load(KEY + '_safe')) this.load(); this.save(); },
  ach(n) { const a = (this.flags.ach = this.flags.ach || {}); if (a[n]) return; a[n] = 1; this.ui?.toast('Conquista: ' + n); this.save(); },
};
