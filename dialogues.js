// [id, mapa, x, y, texto, galeões, item]
export const SECRETS = [
  ['s_lib', 'library', 33, 7, 'Atrás de uma pilha de livros havia uma bolsinha esquecida!', 30, null],
  ['s_dorm', 'dorm', 29, 17, 'Uma tábua solta do dormitório escondia galeões!', 45, null],
  ['s_com', 'common', 3, 10, 'Entre as almofadas da lareira, várias moedas... e um chocolate!', 35, 'choc'],
  ['s_hall', 'hall', 36, 27, 'Embaixo de um tapete esquecido no canto do salão, alguém guardou galeões.', 40, null],
  ['s_cor', 'corridor', 33, 16, 'Atrás de uma armadura havia um compartimento secreto com uma flor seca e galeões!', 40, 'flor'],
  ['s_lake', 'lake', 43, 28, 'No oco de uma árvore dos terrenos, uma bolsinha de couro cheia de galeões.', 50, null],
  ['s_hogs', 'hogsmeade', 3, 18, 'Num barril da vila, alguém escondeu um tesouro e uma poção!', 55, 'pocao'],
  ['s_for', 'forest', 6, 24, 'Um toco antigo da floresta guardava moedas e uma poção.', 60, 'pocao'],
];
export const secretCount = (F) => Object.keys(F.secrets || {}).length + (F.secret1 ? 1 : 0) + ((F.chests || {}).cave ? 1 : 0);
