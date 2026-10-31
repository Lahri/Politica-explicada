// A dupla do projeto. A Dona Cida explica, o Zé pergunta.
// "voz" é o padrão do Google Cloud Text-to-Speech; dá para trocar nas Configurações.
export const PERSONAGENS = {
  cida: {
    id: 'cida',
    nome: 'Dona Cida',
    emoji: '👵🏽',
    imagem: 'img/cida.svg',
    cor: '#6D28D9',
    voz: { name: 'pt-BR-Neural2-C', speakingRate: 0.95, pitch: -2 },
  },
  ze: {
    id: 'ze',
    nome: 'Zé',
    emoji: '🛵',
    imagem: 'img/ze.svg',
    cor: '#15803D',
    voz: { name: 'pt-BR-Neural2-B', speakingRate: 1.08, pitch: 0 },
  },
};

export const AVISO_IA = '🔊 vozes geradas por IA · personagens fictícios';
export const AVISO_IA_LEGENDA = 'Dona Cida e Zé são personagens fictícios; as vozes são geradas por inteligência artificial.';

const imagens = {};

export async function carregarPersonagens() {
  await Promise.all(
    Object.values(PERSONAGENS).map(
      (p) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve((imagens[p.id] = img));
          img.onerror = () => resolve(null);
          img.src = p.imagem;
        }),
    ),
  );
}

export const imagemDe = (id) => imagens[id] || null;
