import Phaser from 'phaser';
import { State } from '../systems/state.js';
import { CHARS } from '../config/chars.js';
import { charSheet } from '../utils/art.js';
import { wait, tween } from '../utils/async.js';

const T = 16;
export const lv = (id, k) => Math.floor((((State.rel[id] || {})[k]) || 0) / 100);
const sp = (id) => (id === State.hero ? 'hero' : id);
const L = (id, e, t, x = {}) => ({ s: sp(id), n: State.name(sp(id)), e, t, ...x });
const pts = (id) => (State.flags.together ? 'n' : 'l');

function hearts(s, x, y) {
  for (let i = 0; i < 9; i++) {
    const h = s.add.image(x + (i - 4) * 5, y, 'heart').setScale(1).setDepth(3000);
    s.tweens.add({ targets: h, y: y - 30 - (i % 3) * 10, x: h.x + (i % 2 ? 10 : -10), alpha: 0, duration: 1400, delay: i * 90, onComplete: () => h.destroy() });
  }
}
async function cinematicStart(s, n, zoom = 3) {
  const ui = State.ui; ui.busy = true; ui.showHud(false); ui.busy = true;
  s.player.setVelocity(0); s.player.body.enable = false; n.body.enable = false; n.setVelocity(0); n.talking = true; n.follow = false;
  const p = s.player, mx = p.x + 7;
  s.cameras.main.stopFollow(); s.cameras.main.pan(mx, p.y - 8, 700); s.cameras.main.zoomTo(zoom, 900);
  p.dir = 2; p.anims.stop(); p.setFrame(6);
  n.anims.play(n.id + '-left', true);
  await tween(s, { targets: n, x: p.x + 14, y: p.y, duration: 900 }); n.anims.stop(); n.dir = 1; n.setFrame(3);
  ui.busy = false;
}
async function cinematicEnd(s, n) {
  s.cameras.main.zoomTo(2, 800); s.cameras.main.startFollow(s.player, true, 0.12, 0.12);
  s.player.body.enable = true; n.body.enable = true; n.talking = false; State.ui.showHud(true); State.save();
}
async function kissAnim(s, n) {
  const p = s.player, cx = (p.x + n.x) / 2;
  s.cameras.main.flash(350, 255, 220, 235);
  s.tweens.add({ targets: p, x: cx - 3, duration: 500 }); s.tweens.add({ targets: n, x: cx + 3, duration: 500 });
  await wait(s, 600); hearts(s, cx, p.y - 24); await wait(s, 1800);
  s.tweens.add({ targets: p, x: cx - 7, duration: 400 }); s.tweens.add({ targets: n, x: cx + 7, duration: 400 }); await wait(s, 500);
}

/* ---------- menu de conversa com o par romântico ---------- */
export async function loveMenu(s, n) {
  const ui = State.ui, id = n.id, r = State.rel[id], F = State.flags, me = State.hero;
  if (r.td !== State.day) { r.td = State.day; State.add(id, pts(id), 20); }
  const kissReady = lv(id, 'l') >= 9 && !F.kissed;
  if (me === 'maria' && F.together && lv(id, 'n') >= 10 && !F.ring) return ringSurprise(s, n);
  if (me === 'maria' && kissReady) return kiss(s, n);
  const opts = [];
  if (r.fl !== State.day) opts.push(['flirt', 'Flertar (um elogio)']);
  if (r.d !== State.day) { opts.push(['date', 'Convidar para um encontro no lago']); opts.push(['stars', 'Convidar para ver as estrelas (à noite)']); opts.push(['clearing', 'Levar para a clareira escondida na floresta']); }
  if (F.together && F.key && r.hu !== State.day) opts.push(['hunt', 'Caçar criaturas na floresta, juntos']);
  if (me === 'samuel' && kissReady) opts.push(['kiss', 'Pedir um beijo']);
  if ((lv(id, 'l') >= 4 || F.together) && r.hg !== State.day) opts.push(['hug', 'Dar um abraço']);
  if (!F.ball) opts.push(['ball', 'Convidar para o baile']);
  if (F.together) opts.push([F.follow ? 'stay' : 'follow', F.follow ? 'Pode ficar por aqui' : 'Vem comigo pelo castelo']);
  if (F.ring && F.fit && F.inv_lais && F.inv_pedro && !F.married) opts.push(['wed', 'Casar agora, aqui no Grande Salão']);
  opts.push(['none', 'Nada, só queria ver você.']);
  let act = 'none';
  await ui.say([{ s: 'hero', n: State.name('hero'), e: 'neutral', t: '(O que eu faço?)', ch: opts.map(([k, t]) => ({ t, fx: () => { act = k; } })) }]);
  if (act === 'flirt') await flirt(s, n);
  else if (act === 'date') await date(s, n, 'lake');
  else if (act === 'stars') await date(s, n, 'torre');
  else if (act === 'clearing') await date(s, n, 'clareira');
  else if (act === 'hunt') await hunt(s, n);
  else if (act === 'kiss') await kiss(s, n);
  else if (act === 'ball') await ball(s, n);
  else if (act === 'hug') await hug(s, n);
  else if (act === 'follow' || act === 'stay') {
    F.follow = act === 'follow'; if (F.follow) s.setFollower(n); else n.follow = false;
    await ui.say([L(id, 'happy', F.follow ? 'Claro! Vou com você.' : 'Tudo bem, te espero por aqui.')]);
  } else if (act === 'wed') await wedding(s, n);
}

const SETS = [
  [['Seu sorriso ilumina até o Grande Salão.', 50, 'embarrassed', 'Ah... você fala cada coisa. Mas gostei.'], ['Você é... legal.', 20, 'neutral', 'Legal. Anotado.'], ['Seu cabelo está... diferente hoje.', -20, 'angry', 'Diferente como, exatamente?']],
  [['Eu gosto muito de conversar com você.', 50, 'happy', 'Eu também gosto. Mais do que deveria admitir.'], ['Você sabe onde fica a cozinha?', 10, 'neutral', 'Fica na cozinha. Vou fingir que perguntou de propósito.'], ['Você está com cara de quem não dormiu.', -20, 'sad', 'Nossa. Valeu pela sinceridade.']],
  [['Perto de você o dia passa mais rápido.', 50, 'embarrassed', 'Para... meu rosto está pegando fogo.'], ['Gostei do seu uniforme.', 20, 'happy', 'É igual ao de todo mundo, mas valeu.'], ['Você tem um jeito esquisito de andar.', -20, 'angry', 'Esquisito?! Eu ando perfeitamente bem.']],
  [['Eu me distraio fácil, mas com você eu presto atenção em tudo.', 50, 'happy', 'Esse é o melhor elogio indireto que eu já ouvi.'], ['Você tem... um nariz.', 10, 'neutral', 'Eu tenho. Valeu por notar. Eu acho.'], ['Você não é tão legal quanto dizem.', -20, 'angry', 'Uau. Que gentil. Vou fingir que não ouvi.']],
  [['Se eu pudesse escolher alguém para ficar preso comigo na biblioteca, seria você.', 50, 'embarrassed', 'Isso é muito romântico e muito estranho. Gostei.'], ['Você faz bem para o meu dia.', 30, 'happy', 'Isso foi fofo. Guarda mais dessas para amanhã.'], ['Você anda de um jeito engraçado.', -20, 'angry', 'Engraçado como?! Eu ando de um jeito sério e elegante!']],
  [['Posso te contar um segredo? Eu fico feliz só de te ver de longe.', 50, 'embarrassed', 'Para... eu vou ficar sem graça no meio do corredor.'], ['Seu cabelo está bonito.', 25, 'happy', 'Valeu! Eu passei cinco minutos nele. Ou meia hora.'], ['Você sempre atrasa, né?', -20, 'sad', 'Eu chego no meu tempo. Mas tá.']],
  [['Hogwarts tem mil encantos, mas você está no topo da lista.', 50, 'happy', 'Mil encantos e você me colocou no topo? Vou ficar convencido.'], ['O dia está bonito.', 10, 'neutral', 'Está. Valeu pelas notícias meteorológicas.'], ['Eu imaginava você de outro jeito.', -20, 'angry', 'Eu sou exatamente do jeito que eu preciso ser, tá?']],
  [['Quando você ri, os candelabros parecem acender mais forte.', 50, 'embarrassed', 'Isso é bonito demais. Para, que eu vou chorar.'], ['Você é uma pessoa interessante.', 20, 'neutral', 'Interessante bom ou interessante estranho? Vou assumir que é o bom.'], ['Seu uniforme está amassado.', -20, 'angry', 'Está estiloso e amassado, é diferente!']],
];
async function flirt(s, n) {
  const ui = State.ui, id = n.id, F = State.flags; let si = Math.floor(Math.random() * SETS.length); if (si === F.lastFlirt) si = (si + 1) % SETS.length; F.lastFlirt = si;
  const set = SETS[si]; let k = 0;
  await ui.say([{ s: 'hero', n: State.name('hero'), e: 'neutral', t: '(Pensar em um elogio...)', ch: set.map((o, i) => ({ t: o[0], fx: () => { k = i; } })) }]);
  const [t, p, e, rep] = set[k];
  await ui.say([L(State.hero, 'neutral', t), L(id, e, rep)]);
  State.rel[id].fl = State.day; State.add(id, pts(id), p);
  if (p > 0) s.pop(n);
}
const PLACE = { lake: { x: 18.5, y: 21.7, d: 2, pan: [19.1, 20.8] }, torre: { x: 13.4, y: 10.4, d: 3, pan: [14, 9.6] }, clareira: { x: 13.8, y: 10.6, d: 3, pan: [14.4, 9.8] } };
const DATES = {
  lake: [
    { open: 'Gosto daqui. A água fica prateada quando escurece, parece que o castelo está com sono.', q: ['Contar uma história engraçada', 'Ficar em silêncio, olhando o lago', 'Falar sobre o futuro'], r: [['Hahaha! Essa foi ótima. Eu vou lembrar disso para sempre.', 'happy'], ['É bom isso. Ficar assim, sem precisar falar nada.', 'embarrassed'], ['O futuro... Eu já imaginei uns quantos fins de tarde assim, com você.', 'embarrassed']] },
    { open: 'Olha o reflexo da lua na água. Parece um caminho que vai até o outro lado do mundo.', q: ['Jogar uma pedrinha para ver as ondas', 'Perguntar qual é o seu maior sonho', 'Cantarolar uma música baixinho'], r: [['Plof! Fez três ondinhas. Eu fiz uma e meia.', 'happy'], ['Meu maior sonho? Ter dias assim, com gente assim, por muito tempo.', 'embarrassed'], ['Eu não conheço a música, mas conheço o seu jeito de cantar e já gostei.', 'happy']] },
    { open: 'Dizem que mora uma lula gigante aqui embaixo. Eu prefiro acreditar que é só um peixão tímido.', q: ['Fingir que viu um tentáculo', 'Contar o dia mais engraçado em Hogwarts', 'Encostar o ombro no ombro'], r: [['Aaaah! Não faz isso! ...Tá, eu ri. Só um pouquinho.', 'surprised'], ['Esse dia merece virar lenda do castelo. Conta de novo depois.', 'happy'], ['Isso aqui é bem confortável. Pode ficar.', 'embarrassed']] },
  ],
  torre: [
    { open: 'Daqui dá para ver até a constelação do Dragão. É a minha parte favorita da noite.', q: ['Apontar constelações', 'Fazer um pedido para uma estrela cadente', 'Chegar bem pertinho para ver o céu'], r: [['Você sabe todas! Eu só conheço duas, e uma delas é a Lua.', 'happy'], ['Se eu contar o pedido, não se realiza. Mas você vai adivinhar fácil.', 'embarrassed'], ['Assim é perfeito. O céu fica melhor quando é dividido.', 'embarrassed']] },
    { open: 'Está vendo aquela estrela mais brilhante? Eu escolhi ela como a nossa.', q: ['Perguntar o nome dela', 'Dizer que a nossa é a mais bonita', 'Emprestar o casaco'], r: [['Ainda não tem nome. Pode batizar, mas tem que ser um nome bom.', 'happy'], ['Convencido! Mas concordo.', 'embarrassed'], ['Que gentileza. Eu estava com um pouco de frio mesmo.', 'embarrassed']] },
    { open: 'A noite aqui em cima é tão silenciosa que dá para ouvir o castelo respirando.', q: ['Fechar os olhos e escutar', 'Contar uma lenda inventada sobre as estrelas', 'Segurar a mão'], r: [['Eu ouvi um ronco... acho que era o Pedro dormindo lá embaixo.', 'happy'], ['Essa lenda é ridícula. Conta outra!', 'happy'], ['A sua mão é quentinha. Não solte.', 'embarrassed']] },
  ],
  clareira: [
    { open: 'Aqui ninguém nos encontra. Só os vaga-lumes sabem deste lugar.', q: ['Seguir um vaga-lume', 'Fazer um desejo para a lagoa', 'Deitar na grama e olhar o céu'], r: [['Ele nos levou direto para um cogumelo brilhante. Gênio.', 'happy'], ['Se eu contar o desejo, a lagoa para de ouvir. Mas você é a razão dele.', 'embarrassed'], ['Daqui o céu parece mais perto. Ou é você que está mais perto.', 'embarrassed']] },
    { open: 'Esse lugar é nosso. Pensei em dar um nome: Clareira do Meio da Floresta Proibida.', q: ['Achar o nome muito comprido', 'Sugerir "Cantinho Secreto"', 'Dizer que o nome é perfeito'], r: [['Comprido, mas honesto. Nomes bons contam a história.', 'happy'], ['Cantinho Secreto... Aceito! Anotado no mapa do coração.', 'embarrassed'], ['Eu sabia que você ia gostar. Temos o mesmo péssimo gosto para nomes.', 'happy']] },
    { open: 'Olha, a lagoa está brilhando! Acho que gostou de nós.', q: ['Jogar uma flor na água', 'Pedir silêncio para ouvir a floresta', 'Dar um abraço apertado'], r: [['A flor flutuou! Isso é sinal de sorte, eu acredito.', 'happy'], ['Dá para ouvir tudo daqui: folhas, grilos... e o seu coração, eu acho.', 'embarrassed'], ['Esse abraço vale mais do que qualquer feitiço.', 'embarrassed']] },
  ],
};
async function date(s, n, place) {
  const F = State.flags;
  if (place === 'torre' && State.time < 1080) return State.ui.say([L(n.id, 'happy', 'As estrelas só aparecem à noite. Me chama depois das 18h!')]);
  if (place === 'clareira' && !F.key) return State.ui.say([L(n.id, 'happy', 'Conheço um lugar escondido na floresta... mas o portão está trancado. Quando você achar a chave, eu levo você lá.')]);
  State.saveSafe(); F.dateScene = n.id; F.datePlace = place; State.rel[n.id].d = State.day;
  const t = { lake: 'Um encontro no lago? Adorei a ideia. Vamos!', torre: 'Ver as estrelas na Torre de Astronomia? Que ideia linda. Vamos!', clareira: 'Uma clareira escondida na floresta? Segredo nosso. Vamos!' }[place];
  await State.ui.say([L(n.id, 'happy', t)]); State.save();
  if (place === 'torre') s.go('torre', 'fromLibrary'); else if (place === 'clareira') s.go('clareira', 'fromForest'); else s.go('lake', 'fromHall');
}
async function hunt(s, n) {
  const F = State.flags; State.saveSafe(); F.follow = true; F.huntActive = true; F.huntStart = F.kills || 0; State.rel[n.id].hu = State.day;
  await State.ui.say([L(n.id, 'happy', 'Uma caçada na Floresta Proibida? Eu topo! Vou ficar do seu lado e ajudar com os feitiços.')]); State.save(); s.go('forest', 'fromLake');
}
export async function thief(s, n) {
  const ui = State.ui; let buy = false;
  await ui.say([{ s: 'ladrao', n: 'Vendedor suspeito', e: 'happy', t: 'Psiu... quer comprar uma poção que acelera o amor? Só 150 galeões. Funciona na hora, juro!', ch: [{ t: 'Comprar (150 galeões)', fx: () => { buy = true; } }, { t: 'Recusar' }] }]);
  if (!buy) return ui.say([{ s: 'ladrao', n: 'Vendedor suspeito', e: 'neutral', t: 'Hm... talvez seja uma boa decisão. O amor tem o próprio tempo.' }]);
  if (State.galleons < 150) return ui.say([{ s: 'ladrao', n: 'Vendedor suspeito', e: 'neutral', t: 'Sem 150 galeões não tem poção. Volta quando tiver.' }]);
  const lost = Math.min(State.galleons, 300);
  await ui.say([{ s: 'ladrao', n: 'Vendedor suspeito', e: 'happy', t: 'Muito bem! Mas a lição é: você não pode apressar o amor... Obrigado pelos galeões!' }]);
  State.galleons -= lost; State.flags.thiefDone = true; ui.toast(`O ladrão fugiu com ${lost} galeões!`); State.ach('Lição de vida');
  n.talking = true; n.setVelocity(-90, 0); n.anims.play('ladrao-left', true); s.time.delayedCall(900, () => s.dropNpc(n)); State.save();
}
export async function runDate(s) {
  const ui = State.ui, F = State.flags, id = F.dateScene, me = State.hero; F.dateScene = null; const place = F.datePlace || 'lake', PL = PLACE[place];
  const p = s.player; let n = s.npcs.find((o) => o.id === id);
  if (!n) { s.addNpc(id, (PL.x + 1.2) * T, PL.y * T); n = s.npcs.find((o) => o.id === id); }
  ui.busy = true; p.body.enable = false; n.body.enable = false; n.date = true; n.talking = true; n.follow = false;
  const px = PL.x * T, py = PL.y * T; p.setPosition(px, py); n.setPosition(px + 1.2 * T, py); p.dir = PL.d; n.dir = PL.d; p.setFrame(PL.d * 3); n.setFrame(PL.d * 3);
  s.cameras.main.stopFollow(); s.cameras.main.pan(PL.pan[0] * T, PL.pan[1] * T, 600); s.cameras.main.zoomTo(2.6, 800);
  await wait(s, 900); ui.busy = false;
  const sets = DATES[place]; let si = Math.floor(Math.random() * sets.length); if (si === F.lastDate) si = (si + 1) % sets.length; F.lastDate = si; const D = sets[si]; let c = 0;
  await ui.say([L(id, 'happy', D.open), { s: 'hero', n: State.name('hero'), e: 'neutral', t: '(Sobre o que conversar?)', ch: D.q.map((t, i) => ({ t, fx: () => { c = i; } })) }]);
  await ui.say([L(id, D.r[c][1], D.r[c][0]), L(id, 'happy', 'Gostei de estar aqui com você.')]);
  State.add(id, pts(id), 100); s.pop(n); if (F.together) State.complete('together');
  const ready = F.kissed && lv(id, 'l') >= 10 && !F.together;
  if (place !== 'lake') { /* sem pedido fora do lago */ }
  else if (me === 'maria' && ready) await proposal(s, n);
  else if (me === 'samuel' && !F.together && lv(id, 'l') >= 5) {
    let ask = false;
    await ui.say([{ s: 'hero', n: State.name('hero'), e: 'neutral', t: '(O clima está bom. Será que eu peço?)', ch: [{ t: 'Pedir em namoro', fx: () => { ask = true; } }, { t: 'Só aproveitar o momento' }] }]);
    if (ask) { if (ready) await proposal(s, n); else await reject(s, n); }
  }
  p.body.enable = true; n.body.enable = true; n.talking = false; n.date = false;
  s.cameras.main.zoomTo(2, 800); s.cameras.main.startFollow(p, true, 0.12, 0.12); State.save();
}
async function proposal(s, n) {
  const ui = State.ui, F = State.flags, id = n.id;
  s.cameras.main.zoomTo(3, 900); await wait(s, 700);
  await ui.say([
    L('samuel', 'embarrassed', 'Maria, desde o dia em que a gente se conheceu no Grande Salão, tudo ficou mais leve. Eu quero estar ao seu lado todos os dias, rir das suas piadas e ouvir cada história. Maria... quer namorar comigo?'),
    L('maria', 'surprised', 'Samuel...'), L('maria', 'happy', 'Eu quero sim. Claro que eu quero!'), L('samuel', 'happy', 'Sério? Então eu sou a pessoa mais feliz de Hogwarts agora.')]);
  s.cameras.main.flash(400, 255, 230, 240); hearts(s, s.player.x + 6, s.player.y - 20);
  F.together = true; State.rel[id].n = 0; State.ach('Primeiro Namoro'); State.complete('proposal');
  await wait(s, 1500); ui.toast('Vocês estão namorando! A barra de Namoro foi desbloqueada.');
}
async function reject(s, n) {
  await State.ui.say([L('samuel', 'sad', 'Maria... quer namorar comigo?'), L('maria', 'sad', 'Samuel, eu gosto muito de você, mas ainda não é a hora. Desculpa.')]);
  await gameOver(s, 'O pedido foi recusado. Voltando ao último ponto seguro...');
}
export async function kiss(s, n) {
  const ui = State.ui, F = State.flags; await cinematicStart(s, n);
  await ui.say([
    L('samuel', 'embarrassed', 'Maria... posso te contar uma coisa? Eu não paro de pensar em você desde aquele primeiro dia no Grande Salão.'),
    L('maria', 'embarrassed', 'Eu também não, Samuel. Eu ficava tentando disfarçar, mas acho que não deu certo.'),
    L('samuel', 'happy', 'Posso te dar um beijo?'), L('maria', 'happy', 'Pode.')]);
  ui.busy = true; await kissAnim(s, n); ui.busy = false;
  await ui.say([L('maria', 'embarrassed', 'Uau... isso foi...'), L('samuel', 'happy', 'Eu devia ter feito isso muito antes.')]);
  F.kissed = true; State.ach('Primeiro Beijo'); State.complete('kiss'); await cinematicEnd(s, n);
}
export async function tempt(s, n) {
  const ui = State.ui, F = State.flags; let yes = false; State.saveSafe();
  await ui.say([{ s: 'arthur', n: 'Arthur', e: 'happy', t: `Ei... ${State.name(State.other())} não está por aqui, né? Que tal darmos uma volta só nós dois, sem ninguém saber?`, ch: [{ t: 'Aceitar o convite', fx: () => { yes = true; } }, { t: 'Recusar. Eu estou com alguém.' }] }]);
  F.arthurTest = true;
  if (yes) return gameOver(s, 'Você traiu a confiança de quem amava. Voltando ao último ponto seguro...');
  await ui.say([{ s: 'arthur', n: 'Arthur', e: 'surprised', t: 'Calma, calma! Era só um teste. Respeito demais isso. Seu par tem sorte.' }]); State.add('arthur', 'f', 30);
}
export async function gameOver(s, msg) {
  const ui = State.ui; ui.busy = true; s.cameras.main.fadeOut(1300, 0, 0, 0); await wait(s, 1500);
  ui.toast(msg); State.loadSafe(); ui.busy = false; ui.showHud(true); s.scene.restart({ map: State.map });
}

/* ---------- convites, anel e casamento ---------- */
export async function inviteGuest(s, n) {
  const ui = State.ui, F = State.flags, id = n.id; if (!F.ring || F['inv_' + id] || id === State.other()) return;
  let yes = false;
  await ui.say([{ s: 'hero', n: State.name('hero'), e: 'happy', t: `Eu preciso te contar uma coisa, ${State.name(id)}. Eu vou me casar! Você aceita conduzir a cerimônia comigo e ${id === 'lais' ? 'o Pedro' : 'a Laís'}?`, ch: [{ t: 'Convidar', fx: () => { yes = true; } }, { t: 'Ainda não' }] }]);
  if (!yes) return;
  F['inv_' + id] = true;
  await ui.say([{ s: id, n: State.name(id), e: 'surprised', t: id === 'lais' ? 'QUÊ?! Eu sabia! Eu SABIA! Claro que eu aceito, vai ser a melhor cerimônia da história de Hogwarts.' : 'Cara... eu juro que não vou chorar. Aceito! Pode contar comigo para tudo.' }]);
  if (F.inv_lais && F.inv_pedro) State.complete('guests');
}
export async function wedding(s, n) {
  const ui = State.ui, F = State.flags, me = State.hero;
  if (s.mid !== 'hall') return ui.say([L(n.id, 'neutral', 'Vamos fazer isso no Grande Salão, onde tudo começou.')]);
  await cinematicStart(s, n, 2.6); ui.busy = true;
  const wd = (id) => (id === 'maria' ? 'dress' : 'suit');
  charSheet(s, 'hero', { ...State.heroLook, wedding: wd(State.hero) }); charSheet(s, n.id, { ...CHARS[n.id], wedding: wd(n.id) });
  [...s.npcs, ...s.crowd].filter((o) => o !== n).forEach((o) => { o.setVisible(false); o.sh.setVisible(false); });
  s.player.setPosition(19.3 * T, 12 * T); n.setPosition(20.7 * T, 12 * T); s.player.dir = 3; n.dir = 3; s.player.setFrame(9); n.setFrame(9);
  const mk = (id, x) => { charSheet(s, id, CHARS[id]); const a = s.add.sprite(x * T, 10 * T, id, 0).setOrigin(0.5, 1).setDepth(10 * T); a.setFrame(0); return a; };
  const lais = mk('lais', 21.3), pedro = mk('pedro', 18.7);
  s.cameras.main.pan(20 * T, 11 * T, 900); await wait(s, 1000); ui.busy = false;
  await ui.say([
    { s: 'pedro', n: 'Pedro', e: 'happy', t: 'Gente... eu juro que não vou chorar. Estou só com algo no olho.' },
    { s: 'lais', n: 'Laís', e: 'happy', t: 'Hoje a gente celebra o amor de Samuel e Maria. Quem diria, naquele primeiro dia no Grande Salão...' },
    { s: 'pedro', n: 'Pedro e Laís', e: 'happy', t: 'Pode beijar a noiva!' }]);
  s.player.dir = 2; n.dir = 1; s.player.setFrame(6); n.setFrame(3);
  s.tweens.add({ targets: [pedro, lais], y: '-=4', duration: 200, yoyo: true, repeat: 4 });
  ui.busy = true; await tween(s, { targets: n, x: s.player.x + 14, duration: 500 }); await kissAnim(s, n);
  s.cameras.main.fadeOut(2200, 0, 0, 0); await wait(s, 2400);
  F.married = true; State.complete('wedding'); State.ach('SAMARIA'); State.save();
  await ui.credits();
  ui.busy = false; s.scene.start('Menu');
}

export async function ball(s, n) {
  const ui = State.ui, F = State.flags, id = n.id;
  if (s.mid !== 'hall' && s.mid !== 'common') return ui.say([L(id, 'happy', 'O baile é no Grande Salão ou na Sala Comunal da Grifinória. Vamos para lá!')]);
  if (State.time < 1020 || State.time > 1380) return ui.say([L(id, 'happy', 'O baile só começa à noite, depois das 17h e antes da meia-noite. Me chama nessa hora!')]);
  if (lv(id, 'l') < 6 && !F.together) return ui.say([L(id, 'embarrassed', 'Um baile? Hm... ainda é cedo para isso, não acha?')]);
  await cinematicStart(s, n, 2.6); ui.busy = true;
  const W = s.M.w * T, H = s.M.h * T, ov = s.add.rectangle(0, 0, W, H, 0x2a1050, 0.38).setOrigin(0).setDepth(2500);
  const cols = [0xff7ab8, 0x9ad8ff, 0xffd24a, 0xb08aff];
  for (let i = 0; i < 16; i++) { const g = s.add.image(s.player.x + (i - 8) * 14, s.player.y - 30 - (i % 4) * 12, 'glow').setDepth(2600).setBlendMode(Phaser.BlendModes.ADD).setTint(cols[i % 4]).setAlpha(0.5).setScale(0.6); s.tweens.add({ targets: g, alpha: 0.15, scale: 0.9, duration: 500 + i * 40, yoyo: true, repeat: -1 }); ov.on('destroy', () => g.destroy()); }
  ui.busy = false;
  await ui.say([L(id, 'happy', 'Tem música, luzes e você aqui na minha frente. O que mais eu poderia querer?'), L(State.hero, 'embarrassed', 'Não sei dançar direito... mas topo tentar.')]);
  ui.busy = true; const p = s.player, cx = (p.x + n.x) / 2;
  s.tweens.add({ targets: p, x: cx - 6, duration: 400 }); s.tweens.add({ targets: n, x: cx + 6, duration: 400 }); await wait(s, 500);
  s.tweens.add({ targets: [p, n], y: '-=3', duration: 260, yoyo: true, repeat: 9 });
  for (let i = 0; i < 6; i++) { p.dir = i % 2 ? 2 : 1; n.dir = i % 2 ? 1 : 2; p.setFrame(p.dir * 3); n.setFrame(n.dir * 3); s.tweens.add({ targets: p, x: p.x + (i % 2 ? 8 : -8), duration: 300, yoyo: true }); s.tweens.add({ targets: n, x: n.x + (i % 2 ? -8 : 8), duration: 300, yoyo: true }); if (i % 2) hearts(s, cx, p.y - 24); await wait(s, 650); }
  ui.busy = false;
  await ui.say([L(id, 'happy', 'Você dançou melhor do que disse que dançava.'), L(State.hero, 'happy', 'Foi a companhia. Eu só segui o ritmo.')]);
  ov.destroy(); F.ball = true; State.add(id, pts(id), 150); State.complete('ball'); await cinematicEnd(s, n);
}

async function hug(s, n) {
  const ui = State.ui, id = n.id; await cinematicStart(s, n, 3.2); ui.busy = true;
  const p = s.player, cx = (p.x + n.x) / 2;
  s.tweens.add({ targets: p, x: cx - 4, duration: 400 }); s.tweens.add({ targets: n, x: cx + 4, duration: 400 }); await wait(s, 450);
  p.setFrame(13); n.setFrame(13); n.setFlipX(true); hearts(s, cx, p.y - 26); await wait(s, 2000); ui.busy = false;
  await ui.say([L(id, 'happy', 'Eu precisava mesmo desse abraço. Obrigado por aparecer.'.replace('Obrigado', id === 'maria' ? 'Obrigada' : 'Obrigado'))]);
  n.setFlipX(false); State.rel[id].hg = State.day; State.add(id, pts(id), 40); await cinematicEnd(s, n);
}

async function ringSurprise(s, n) {
  const ui = State.ui, F = State.flags; await cinematicStart(s, n, 3);
  await ui.say([
    L('samuel', 'embarrassed', 'Maria... eu escondi isso de você por vários dias. Fui até Hogsmeade, escolhi com todo o cuidado e juntei cada galeão.'),
    L('samuel', 'happy', 'Você quer ser a minha esposa?'), L('maria', 'surprised', 'Samuel...'), L('maria', 'happy', 'Claro que eu quero! Claro que eu quero!')]);
  s.cameras.main.flash(400, 255, 230, 240); hearts(s, s.player.x + 6, s.player.y - 20);
  F.ring = true; State.complete('ring'); State.ui.toast('Samuel entregou o anel de noivado!'); await cinematicEnd(s, n);
}
