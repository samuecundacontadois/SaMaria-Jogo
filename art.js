export const ITEMS = {
  wand: { n: 'Varinha', cat: 'Ferramenta', d: 'Uma varinha de azevinho. X conserta (Reparo), o clique do mouse lança feitiços.', v: 0 },
  rod: { n: 'Vara de pesca', cat: 'Ferramenta', d: 'Selecione na barra, vá até o trapiche e aperte E.', v: 0 },
  choc: { n: 'Chocolate', cat: 'Presente', d: 'Todo mundo gosta. Dá para comer (+2 de vida) ou presentear.', v: 10, buy: 20, gift: true, heal: 2 },
  book: { n: 'Livro', cat: 'Presente', d: 'Um livro de capa azul sobre criaturas mágicas.', v: 22, buy: 45, gift: true },
  flor: { n: 'Flor do jardim', cat: 'Presente', d: 'Uma flor colhida em Hogsmeade.', v: 5, buy: 10, gift: true },
  pocao: { n: 'Poção de cura', cat: 'Poção', d: 'Recupera 5 de vida.', v: 15, buy: 30, heal: 5 },
  anel: { n: 'Anel de noivado', cat: 'Objeto de missão', d: 'Um anel de ouro com uma pequena esmeralda. Guarde com cuidado.', v: 0, buy: 300 },
  chave: { n: 'Chave do portão', cat: 'Objeto de missão', d: 'Uma chave antiga e pesada. Abre o portão da Floresta Proibida.', v: 0 },
  roupa_roxa: { n: 'Capa roxa', cat: 'Roupa', d: 'Uma capa roxa de tecido macio. Vai para o seu guarda-roupa.', v: 0, buy: 60, outfit: '#6b4a8a' },
  roupa_vinho: { n: 'Capa vinho', cat: 'Roupa', d: 'Uma capa cor de vinho. Vai para o seu guarda-roupa.', v: 0, buy: 60, outfit: '#5a1a3a' },
  roupa_dourada: { n: 'Capa dourada', cat: 'Roupa', d: 'Uma capa dourada elegante. Vai para o seu guarda-roupa.', v: 0, buy: 90, outfit: '#a8842a' },
  oculos: { n: 'Óculos redondos', cat: 'Acessório', d: 'Óculos redondos de aro fino. Liga e desliga no guarda-roupa.', v: 0, buy: 50, outfit: 'glasses' },
  carpa: { n: 'Carpa', cat: 'Peixe', d: 'Uma carpa gorda do Lago Negro.', v: 20 },
  truta: { n: 'Truta do lago', cat: 'Peixe', d: 'Rápida e prateada.', v: 35 },
  lua: { n: 'Peixe-lua', cat: 'Peixe mágico', d: 'Brilha como a lua. Raro.', v: 90 },
};
export const GIFT = {
  maria: { choc: 80, book: 80, flor: 50 }, samuel: { choc: 80, book: 20, flor: 20 }, lais: { choc: 40, book: 30, flor: 60 },
  pedro: { choc: 50, book: 10, flor: 20 }, arthur: { choc: 30, book: 50, flor: 20 }, carlinhos: { choc: 40, book: 40, flor: 20 }, daniela: { choc: 40, book: 70, flor: 50 },
};
export const SHOPS = { mel: ['choc'], borrao: ['book'], violeta: ['flor', 'pocao'], rubi: ['anel'], retalho: ['roupa_roxa', 'roupa_vinho', 'roupa_dourada', 'oculos'] };
