// Gravar áudio pelo microfone ou abrir um arquivo de áudio e medir a duração.
const NovoAudioContext = () => new (window.AudioContext || window.webkitAudioContext)();

export async function decodificarAudio(blob) {
  const ac = NovoAudioContext();
  try {
    return await ac.decodeAudioData(await blob.arrayBuffer());
  } finally {
    ac.close();
  }
}

export const podeGravar = () => !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

export class Gravador {
  async iniciar() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    this.pedacos = [];
    this.rec = new MediaRecorder(this.stream);
    this.rec.ondataavailable = (e) => e.data.size && this.pedacos.push(e.data);
    this.rec.start();
  }

  parar() {
    return new Promise((resolve) => {
      this.rec.onstop = () => {
        this.stream.getTracks().forEach((t) => t.stop());
        resolve(new Blob(this.pedacos, { type: this.rec.mimeType || 'audio/webm' }));
      };
      this.rec.stop();
    });
  }
}
