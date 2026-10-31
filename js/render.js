// Desenha uma tela (card) no canvas. Texto entre **asteriscos** sai em negrito
// e na cor do quadro. Quebras de linha do texto são respeitadas.
import { MARCA } from './marca.js';

export const FORMATOS = {
  carrossel: { w: 1080, h: 1350 },
  status: { w: 1080, h: 1920 },
};

const FAMILIA = '"Atkinson Hyperlegible", system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
const fonte = (negrito, tamanho) => `${negrito ? 700 : 400} ${tamanho}px ${FAMILIA}`;

export async function carregarFontes() {
  if (!document.fonts) return;
  await Promise.all([document.fonts.load(fonte(false, 40)), document.fonts.load(fonte(true, 40))]);
}

export const textoLimpo = (texto) => texto.replace(/\*\*/g, '');

// Converte o texto em parágrafos de palavras: { t, negrito, espaco }.
// "espaco" indica se havia espaço antes da palavra (para não separar "culpada**." de ".").
function palavras(texto) {
  return texto.split('\n').map((paragrafo) => {
    const lista = [];
    let negrito = false;
    let espaco = false;
    paragrafo.split('**').forEach((trecho, i) => {
      if (i > 0) negrito = !negrito;
      for (const parte of trecho.match(/\S+|\s+/g) || []) {
        if (/^\s+$/.test(parte)) espaco = true;
        else {
          lista.push({ t: parte, negrito, espaco });
          espaco = false;
        }
      }
    });
    return lista;
  });
}

function montarLinhas(ctx, paragrafos, tamanho, larguraMax) {
  const linhas = [];
  let estourou = false;
  for (const paragrafo of paragrafos) {
    let linha = [];
    let x = 0;
    for (const p of paragrafo) {
      ctx.font = fonte(p.negrito, tamanho);
      const largura = ctx.measureText(p.t).width;
      ctx.font = fonte(false, tamanho);
      let espaco = p.espaco && linha.length ? ctx.measureText(' ').width : 0;
      if (linha.length && p.espaco && x + espaco + largura > larguraMax) {
        linhas.push({ itens: linha, largura: x });
        linha = [];
        x = 0;
        espaco = 0;
      }
      if (largura > larguraMax) estourou = true;
      linha.push({ ...p, x: x + espaco });
      x += espaco + largura;
    }
    linhas.push({ itens: linha, largura: x });
  }
  return { linhas, estourou };
}

// Escolhe o maior tamanho de fonte em que o texto cabe na caixa.
function ajustar(ctx, texto, caixa, tamanhoMax) {
  const paragrafos = palavras(texto);
  for (let tamanho = tamanhoMax; tamanho >= 34; tamanho -= 2) {
    const { linhas, estourou } = montarLinhas(ctx, paragrafos, tamanho, caixa.w);
    const altura = linhas.length * tamanho * 1.28;
    if (!estourou && altura <= caixa.h) return { linhas, tamanho, altura };
  }
  const { linhas } = montarLinhas(ctx, paragrafos, 34, caixa.w);
  return { linhas, tamanho: 34, altura: linhas.length * 34 * 1.28, cortado: true };
}

/**
 * Desenha uma tela.
 * @param {HTMLCanvasElement} canvas
 * @param {{quadro, texto, indice, total, formato: 'carrossel'|'status'}} opcoes
 * @returns {{cortado: boolean}} cortado = texto não coube nem no menor tamanho
 */
export function desenharTela(canvas, { quadro, texto, indice, total, formato }) {
  const { w, h } = FORMATOS[formato];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const capa = indice === 0;

  ctx.fillStyle = MARCA.fundo;
  ctx.fillRect(0, 0, w, h);

  // Faixa do topo com o nome do quadro
  const faixa = formato === 'status' ? 200 : 150;
  ctx.fillStyle = quadro.cor;
  ctx.fillRect(0, 0, w, faixa);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = fonte(true, 54);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(`${quadro.emoji}  ${quadro.nome}`, 80, faixa / 2 + 4, w - 160);

  // Texto principal, centralizado na vertical
  const rodape = formato === 'status' ? 220 : 170;
  const caixa = { x: 90, y: faixa + 70, w: w - 180, h: h - faixa - 70 - rodape };
  const maximo = capa ? (formato === 'status' ? 112 : 100) : formato === 'status' ? 92 : 80;
  const { linhas, tamanho, altura, cortado } = ajustar(ctx, texto, caixa, maximo);
  const alturaLinha = tamanho * 1.28;
  let y = caixa.y + Math.max(0, (caixa.h - altura) / 2) + alturaLinha / 2;
  ctx.textBaseline = 'middle';
  for (const linha of linhas) {
    const inicio = capa ? caixa.x + (caixa.w - linha.largura) / 2 : caixa.x;
    for (const p of linha.itens) {
      ctx.font = fonte(p.negrito, tamanho);
      ctx.fillStyle = p.negrito ? quadro.cor : MARCA.texto;
      ctx.fillText(p.t, inicio + p.x, y);
    }
    y += alturaLinha;
  }

  // Rodapé: @ do projeto, numeração e dica de arrastar na capa do carrossel
  const yRodape = h - rodape / 2;
  ctx.font = fonte(true, 38);
  ctx.fillStyle = MARCA.textoSuave;
  ctx.textAlign = 'left';
  ctx.fillText(MARCA.arroba, 90, yRodape);
  if (total > 1) {
    ctx.textAlign = 'right';
    ctx.fillText(capa && formato === 'carrossel' ? 'Arrasta pro lado ➜' : `${indice + 1}/${total}`, w - 90, yRodape);
  }
  ctx.textAlign = 'left';
  return { cortado: !!cortado };
}

export function canvasParaBlob(canvas, tipo = 'image/png') {
  return new Promise((resolve) => canvas.toBlob(resolve, tipo));
}
