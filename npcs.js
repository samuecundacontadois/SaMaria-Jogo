import { secretCount } from './secrets.js';
export const QUESTS = [
  { id: 'q1', main: 1, title: 'Um novo começo', reward: 20, obj: (n) => [['explore', 'Explorar o Grande Salão'], ['lais', 'Conhecer Laís'], ['pedro', 'Conhecer Pedro'], ['love', 'Conhecer ' + n], ['door', 'Chegar à sala comunal da Grifinória']] },
  { id: 'q2', main: 1, title: 'Primeira noite', reward: 30, obj: () => [['common', 'Entrar na sala comunal'], ['dorm', 'Encontrar seu dormitório'], ['sleep', 'Dormir na sua cama (marcada no dormitório)']] },
  { id: 'q3', title: 'Algo quebrado', reward: 25, obj: () => [['learn', 'Aprender Reparo na aula de Feitiços (Prof. Daniela)'], ['repair', 'Consertar objetos com Reparo (tecla X)']] },
  { id: 'q4', title: 'Um presente especial', reward: 20, obj: () => [['buy', 'Comprar um presente em Hogsmeade'], ['give', 'Entregar o presente a alguém']] },
  { id: 'q5', title: 'Primeira pescaria', reward: 20, obj: () => [['fish', 'Pescar peixes no lago (vara na barra)']] },
  { id: 'q6', title: 'Aula de Defesa', reward: 30, obj: () => [['class', 'Participar da aula do Prof. Carlinhos']] },
  { id: 'q14', main: 1, title: 'O Mistério do Corredor', reward: 40, obj: () => [['passage', 'Achar a passagem secreta no corredor (um quadro está diferente)'], ['key', 'Encontrar a chave do portão da Floresta']] },
  { id: 'q15', main: 1, title: 'Segredos da Floresta', reward: 80, obj: () => [['forest', 'Entrar na Floresta Proibida (portão a leste dos terrenos)'], ['creatures', 'Derrotar 6 criaturas (clique esquerdo lança feitiços)'], ['cave', 'Achar a caverna secreta (ponte quebrada: Reparo, tecla X)']] },
  { id: 'q7', main: 1, hide: { maria: ['kiss'] }, title: 'Mais que amigos', reward: 40, obj: () => [['flirt9', 'Chegar a 9 corações de flerte'], ['kiss', 'Primeiro beijo']] },
  { id: 'q8', main: 1, hide: { maria: ['proposal'] }, title: 'À beira do lago', reward: 50, obj: () => [['proposal', 'Namorar no lago (10 corações de flerte)']] },
  { id: 'q9', main: 1, title: 'Juntos em Hogwarts', reward: 40, obj: () => [['together', 'Ter um encontro como casal']] },
  { id: 'q13', main: 1, title: 'Um convite especial', reward: 40, obj: () => [['ball', 'Dançar no baile (Salão ou Sala Comunal, das 17h à meia-noite)']] },
  { id: 'q10', main: 1, hide: { maria: ['ring'] }, title: 'O Anel', reward: 0, obj: () => [['love10', 'Chegar a 10 corações de namoro'], ['ring', 'Comprar o anel em Hogsmeade (Joalheria Rubi)']] },
  { id: 'q11', main: 1, title: 'Para Sempre', reward: 100, obj: () => [['fit', 'Escolher a roupa de casamento (guarda-roupa)'], ['guests', 'Convidar Pedro e Laís'], ['wedding', 'Casar no Grande Salão']] },
  { id: 'q16', title: 'Segredos de Hogwarts', reward: 120, obj: () => [['secrets', 'Descobrir 10 lugares secretos (procure brilhos)']] },
  { id: 'q17', title: 'Aula de Poções', reward: 30, obj: () => [['pocoes', 'Participar da aula do Prof. Davi (corredor, porta leste)']] },
  { id: 'q18', title: 'Aula de Herbologia', reward: 30, obj: () => [['herb', 'Participar da aula do Prof. Biel (corredor, porta oeste)']] },
  { id: 'q19', title: 'O tornozelo da Laís', reward: 80, obj: () => [['sqlais', 'Levar uma Poção de cura para a Laís (10 corações de amizade)']] },
  { id: 'q20', title: 'Só queria namorar...', reward: 80, obj: () => [['sqpedro', 'Levar uma flor e um chocolate ao Pedro (10 corações de amizade)']] },
  { id: 'q12', title: 'Cartas de amor', reward: 100, obj: () => [['letters', 'Encontrar as 20 cartas']] },
];
export const groupOf = (k) => QUESTS.find((g) => g.obj('').some(([x]) => x === k));
export const objs = (g, n, hero) => g.obj(n).filter(([k]) => !((g.hide && g.hide[hero]) || []).includes(k));
const open = (g, done, n, hero) => objs(g, n, hero).some(([k]) => !done[k]);
export const active = (done, n, hero) => QUESTS.find((g) => g.main && open(g, done, n, hero)) || QUESTS.find((g) => open(g, done, n, hero));
export const prog = (k, q, fl) => (k === 'explore' ? `${Object.keys(q.visited).length}/3` : k === 'repair' ? `${Math.min(3, fl.fixes || 0)}/3` : k === 'fish' ? `${Math.min(3, fl.fishN || 0)}/3` : k === 'secrets' ? `${Math.min(10, secretCount(fl))}/10` : k === 'creatures' ? `${Math.min(6, fl.kills || 0)}/6` : k === 'letters' ? `${Object.keys(fl.letters || {}).length}/20` : '');
export const ACHS = ['Primeira Amizade', 'Primeiro Presente', 'Primeira Carta', 'Primeiro Peixe', 'Primeiro Feitiço', 'Mestre da Pesca', 'Primeiro Beijo', 'Primeiro Namoro', 'Amor Verdadeiro', 'SAMARIA', 'Lição de vida'];
