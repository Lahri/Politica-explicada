// Vozes de IA pelo Google Cloud Text-to-Speech, chamado direto do navegador com a chave da usuária.
import { decodificarAudio } from './audio.js';

const API = 'https://texttospeech.googleapis.com/v1';
const PAUSA = 0.35; // silêncio entre uma fala e outra (segundos)
const TELA_MUDA = 2; // segundos para tela sem fala

// Texto que a personagem vai falar: sem emojis, sem asteriscos e com símbolos trocados por palavras.
export function textoParaFala(texto) {
  return texto
    .replace(/\*\*/g, '')
    .replace(/[0-9]️?⃣/g, '') // 1️⃣ 2️⃣ …
    .replace(/\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic}|\p{Emoji_Modifier})*/gu, '')
    .replace(/\s*(→|->)\s*/g, ': ')
    .replace(/\s*=\s*/g, ' é ')
    .replace(/\s*\n\s*/g, '. ')
    .replace(/\.\s*\./g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function chamar(caminho, chave, opcoes = {}) {
  const resp = await fetch(`${API}/${caminho}${caminho.includes('?') ? '&' : '?'}key=${encodeURIComponent(chave)}`, opcoes);
  if (!resp.ok) {
    let msg = `erro ${resp.status}`;
    try {
      msg = (await resp.json()).error?.message || msg;
    } catch {}
    if (resp.status === 403 || resp.status === 400) msg += ' (confira a chave e se a API Text-to-Speech está ativada)';
    throw new Error(msg);
  }
  return resp.json();
}

export async function listarVozes(chave) {
  const { voices = [] } = await chamar('voices?languageCode=pt-BR', chave);
  return voices
    .filter((v) => v.languageCodes.includes('pt-BR'))
    .map((v) => ({ name: v.name, genero: v.ssmlGender === 'FEMALE' ? 'feminina' : v.ssmlGender === 'MALE' ? 'masculina' : '' }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const cache = new Map(); // evita pagar duas vezes pela mesma fala

export async function sintetizar(texto, voz, chave) {
  const id = JSON.stringify([texto, voz]);
  if (cache.has(id)) return cache.get(id);
  const audioConfig = { audioEncoding: 'MP3', speakingRate: voz.speakingRate };
  // Algumas vozes (ex.: Chirp) não aceitam mudar o tom.
  if (voz.pitch && !/Chirp/i.test(voz.name)) audioConfig.pitch = voz.pitch;
  const { audioContent } = await chamar('text:synthesize', chave, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: { text: texto }, voice: { languageCode: 'pt-BR', name: voz.name }, audioConfig }),
  });
  const bytes = Uint8Array.from(atob(audioContent), (c) => c.charCodeAt(0));
  const buffer = await decodificarAudio(new Blob([bytes], { type: 'audio/mpeg' }));
  cache.set(id, buffer);
  return buffer;
}

/**
 * Gera a fala de cada tela e junta tudo num áudio só.
 * @param {{falas: {texto: string, voz: object}|null[], chave: string, aoProgredir?: (i:number, n:number) => void}} op
 * @returns {Promise<{buffer: AudioBuffer, blob: Blob, tempos: number[]}>} tempos = segundos de cada tela
 */
export async function gerarFalas({ falas, chave, aoProgredir = () => {} }) {
  const trechos = [];
  for (let i = 0; i < falas.length; i++) {
    aoProgredir(i, falas.length);
    trechos.push(falas[i] ? await sintetizar(falas[i].texto, falas[i].voz, chave) : null);
  }
  aoProgredir(falas.length, falas.length);

  const taxa = trechos.find(Boolean)?.sampleRate || 44100;
  const tempos = trechos.map((b) => (b ? b.duration + PAUSA : TELA_MUDA));
  const total = Math.ceil(tempos.reduce((a, b) => a + b, 0) * taxa);
  const saida = new Float32Array(total);
  let pos = 0;
  trechos.forEach((b, i) => {
    if (b) saida.set(reamostrar(b, taxa).subarray(0, total - pos), pos);
    pos += Math.round(tempos[i] * taxa);
  });

  const ac = new OfflineAudioContext(1, total, taxa);
  const buffer = ac.createBuffer(1, total, taxa);
  buffer.copyToChannel(saida, 0);
  return { buffer, blob: paraWav(saida, taxa), tempos: tempos.map((t) => Math.round(t * 100) / 100) };
}

// Mistura para mono e ajusta a taxa de amostragem (simples, linear).
function reamostrar(b, taxa) {
  const mono = new Float32Array(b.length);
  for (let c = 0; c < b.numberOfChannels; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < b.length; i++) mono[i] += d[i] / b.numberOfChannels;
  }
  if (b.sampleRate === taxa) return mono;
  const n = Math.round((b.length * taxa) / b.sampleRate);
  const out = new Float32Array(n);
  const r = b.sampleRate / taxa;
  for (let i = 0; i < n; i++) {
    const x = i * r;
    const j = Math.floor(x);
    out[i] = (mono[j] || 0) + ((mono[j + 1] || 0) - (mono[j] || 0)) * (x - j);
  }
  return out;
}

function paraWav(amostras, taxa) {
  const v = new DataView(new ArrayBuffer(44 + amostras.length * 2));
  const str = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 36 + amostras.length * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, taxa, true); v.setUint32(28, taxa * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, amostras.length * 2, true);
  amostras.forEach((s, i) => v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 0x7fff, true));
  return new Blob([v.buffer], { type: 'audio/wav' });
}
