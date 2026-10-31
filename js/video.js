// Gera um vídeo vertical (1080×1920) com as telas em sequência e o áudio por baixo.
// Usa canvas.captureStream + MediaRecorder; prefere MP4 quando o navegador grava MP4.
import { desenharTela, FORMATOS } from './render.js';

const CANDIDATOS = [
  'video/mp4;codecs="avc1.42E01E, mp4a.40.2"',
  'video/mp4;codecs=avc1,mp4a',
  'video/mp4',
  'video/webm;codecs="vp9,opus"',
  'video/webm;codecs="vp8,opus"',
  'video/webm',
];

export function formatoDeVideo() {
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return null;
  return CANDIDATOS.find((m) => MediaRecorder.isTypeSupported(m)) || null;
}

const FADE = 0.35; // segundos de transição entre telas

/**
 * @param {{quadro, telas: string[], tempos: number[], audio?: AudioBuffer, aoProgredir?: (f: number) => void}} opcoes
 * @returns {Promise<{blob: Blob, mime: string, duracao: number}>}
 */
export async function gerarVideo({ quadro, telas, tempos, audio, aoProgredir = () => {} }) {
  const mime = formatoDeVideo();
  if (!mime) throw new Error('Este navegador não consegue gravar vídeo. Tente pelo Chrome ou Safari atualizados.');

  const { w, h } = FORMATOS.status;
  const quadros = telas.map((texto, indice) => {
    const c = document.createElement('canvas');
    desenharTela(c, { quadro, texto, indice, total: telas.length, formato: 'status' });
    return c;
  });

  // Se o áudio for mais longo que a soma dos tempos, a última tela fica mais tempo.
  const inicios = [];
  let soma = 0;
  for (const t of tempos) {
    inicios.push(soma);
    soma += t;
  }
  const duracao = Math.max(soma, audio ? audio.duration : 0);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const desenhar = (t) => {
    let i = 0;
    while (i < inicios.length - 1 && t >= inicios[i + 1]) i++;
    const local = t - inicios[i];
    ctx.globalAlpha = 1;
    if (i > 0 && local < FADE) {
      ctx.drawImage(quadros[i - 1], 0, 0);
      ctx.globalAlpha = local / FADE;
    }
    ctx.drawImage(quadros[i], 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = quadro.cor;
    ctx.fillRect(0, h - 14, (w * Math.min(t, duracao)) / duracao, 14);
  };

  const ac = new (window.AudioContext || window.webkitAudioContext)();
  const destino = ac.createMediaStreamDestination();
  let fonteAudio = null;
  if (audio) {
    fonteAudio = ac.createBufferSource();
    fonteAudio.buffer = audio;
    fonteAudio.connect(destino);
  }

  desenhar(0);
  const stream = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...(audio ? destino.stream.getAudioTracks() : [])]);
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
  const pedacos = [];
  rec.ondataavailable = (e) => e.data.size && pedacos.push(e.data);
  const terminou = new Promise((resolve) => (rec.onstop = resolve));

  await ac.resume();
  rec.start(250);
  const t0 = ac.currentTime + 0.05;
  fonteAudio?.start(t0);

  await new Promise((resolve) => {
    const passo = () => {
      const t = Math.max(0, ac.currentTime - t0);
      desenhar(t);
      aoProgredir(Math.min(1, t / duracao));
      if (t >= duracao) resolve();
      else requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  });

  rec.stop();
  await terminou;
  stream.getTracks().forEach((t) => t.stop());
  ac.close();
  return { blob: new Blob(pedacos, { type: mime.split(';')[0] }), mime, duracao };
}
