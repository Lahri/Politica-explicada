// Os 5 quadros do projeto. A cor é usada na faixa do topo (com texto branco)
// e nos destaques; todas têm contraste AA com branco e com o fundo creme.
export const QUADROS = [
  {
    id: 'cobrar',
    nome: 'De quem cobrar?',
    emoji: '🏛️',
    cor: '#1D4ED8',
    dica: 'Explique quem é responsável por resolver cada problema.',
    telas: ['Pergunta ou problema do dia a dia 👇', 'Problema → **quem resolve**. Quem fiscaliza: **…**', 'Salva e manda no grupo da família!'],
  },
  {
    id: 'traduzindo',
    nome: 'Traduzindo',
    emoji: '📖',
    cor: '#6D28D9',
    dica: 'Uma palavra difícil por vez, explicada em uma frase simples.',
    telas: ['O que é **PALAVRA**? 👇', '**PALAVRA** é…', 'Na prática, isso significa…', 'Manda pra quem vive confundindo 😉'],
  },
  {
    id: 'investigado',
    nome: 'Quem está sendo investigado',
    emoji: '🔎',
    cor: '#9A3412',
    dica: 'Use sempre fonte oficial e o termo exato: investigado, réu ou condenado.',
    telas: [
      '🔎 Quem está sendo investigado: **[NOME], [CARGO]**',
      '**Por quê:** [o que se apura, em uma frase]',
      '**Situação:** [investigado / réu / condenado]\n**Quem investiga:** [PF, MP, STF…]',
      '**Desde:** [data]\n**Fonte:** link na legenda',
      'Investigado **não é** condenado. Acompanhe e cobre transparência. 👀',
    ],
  },
  {
    id: 'verdade',
    nome: 'É verdade?',
    emoji: '🧐',
    cor: '#B91C1C',
    dica: 'O boato, o veredito da agência de checagem e uma dica para desconfiar.',
    telas: ['"Boato que está circulando" Será? 🤔', '❌ **Falso.** O que realmente aconteceu…', 'Quem checou: **…** Links na legenda.', 'Dica: …'],
  },
  {
    id: 'agora',
    nome: 'Faça agora',
    emoji: '✅',
    cor: '#15803D',
    dica: 'Uma ação simples, em passos curtos, que qualquer pessoa consegue fazer.',
    telas: ['Você sabia que dá pra… 📱', '1️⃣ …', '2️⃣ …', '3️⃣ …', 'Fez? Conta nos comentários! 👇'],
  },
];

export const quadroPorId = (id) => QUADROS.find((q) => q.id === id) || QUADROS[0];
