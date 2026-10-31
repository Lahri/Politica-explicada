// Testes de ponta a ponta. Uso: node tests/testes.cjs  (gera prints e arquivos em tests/saida/)
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const SAIDA = path.join(__dirname, 'saida');
const PORTA = 8765;
const URL_APP = `http://localhost:${PORTA}/`;
fs.mkdirSync(SAIDA, { recursive: true });

let falhas = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) falhas++;
};

function ffprobe(arquivo) {
  const json = execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', arquivo]).toString();
  const info = JSON.parse(json);
  const video = info.streams.find((s) => s.codec_type === 'video');
  const audio = info.streams.find((s) => s.codec_type === 'audio');
  let duracao = parseFloat(info.format.duration);
  if (!duracao) {
    // WebM do MediaRecorder não grava a duração no cabeçalho: mede decodificando.
    const out = execFileSync('ffprobe', ['-v', 'error', '-count_packets', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', arquivo]).toString();
    duracao = parseInt(out, 10) / 30;
  }
  return { w: video?.width, h: video?.height, temAudio: !!audio, duracao, codec: video?.codec_name };
}

// Cria um WAV de teste (tom de 440 Hz) dentro da página e entrega ao app.
async function carregarAudioTeste(page, segundos) {
  await page.evaluate(async (s) => {
    const taxa = 44100;
    const n = taxa * s;
    const buf = new ArrayBuffer(44 + n * 2);
    const v = new DataView(buf);
    const str = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, taxa, true); v.setUint32(28, taxa * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    str(36, 'data'); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.sin((2 * Math.PI * 440 * i) / taxa) * 8000, true);
    await window.__fabrica.usarAudio(new Blob([buf], { type: 'audio/wav' }), 'de teste');
  }, segundos);
}

async function salvarBlobDoElemento(page, seletor, destino) {
  const base64 = await page.$eval(seletor, async (e) => {
    const b = await (await fetch(e.src)).blob();
    return await new Promise((r) => {
      const fr = new FileReader();
      fr.onload = () => r(fr.result.split(',')[1]);
      fr.readAsDataURL(b);
    });
  });
  fs.writeFileSync(destino, Buffer.from(base64, 'base64'));
}

async function abrirExemplo(page, id) {
  await page.selectOption('#sel-abrir', `e:${id}`);
  await page.waitForTimeout(100);
}

async function testarVideo(browser, { forcarWebm }) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2 });
  if (forcarWebm) {
    await ctx.addInitScript(() => {
      const original = MediaRecorder.isTypeSupported.bind(MediaRecorder);
      MediaRecorder.isTypeSupported = (m) => !m.startsWith('video/mp4') && original(m);
    });
  }
  const page = await ctx.newPage();
  page.on('dialog', (d) => d.accept());
  await page.goto(URL_APP);
  await page.waitForFunction(() => window.__fabrica?.estado);
  await abrirExemplo(page, 'exemplo-verdade');
  await carregarAudioTeste(page, 4);
  const tempos = await page.evaluate(() => window.__fabrica.estado.tempos);
  ok(tempos.every((t) => t === 1), `áudio de 4 s dividido em ${tempos.length} telas (${tempos.join(', ')})`);
  await page.click('#btn-video');
  await page.waitForSelector('#resultado video', { timeout: 30000 });
  const formato = await page.$eval('#resultado video', (v) => v.dataset.formato);
  const arq = path.join(SAIDA, `video-teste.${formato}`);
  await salvarBlobDoElemento(page, '#resultado video', arq);
  const info = ffprobe(arq);
  const esperado = forcarWebm ? 'webm' : 'mp4';
  ok(formato === esperado, `vídeo gerado em ${formato.toUpperCase()} (esperado ${esperado.toUpperCase()}, codec ${info.codec})`);
  ok(info.w === 1080 && info.h === 1920, `vídeo ${formato} com 1080×1920 (veio ${info.w}×${info.h})`);
  ok(info.temAudio, `vídeo ${formato} tem trilha de áudio`);
  ok(Math.abs(info.duracao - 5) <= 0.6, `vídeo ${formato} dura ~5 s, soma dos tempos (veio ${info.duracao.toFixed(2)} s)`);
  await ctx.close();
}

(async () => {
  const servidor = spawn('python3', ['-m', 'http.server', String(PORTA), '--bind', '127.0.0.1'], { cwd: RAIZ, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800));
  const browser = await chromium.launch();
  try {
    // ---------- interface no celular + imagens ----------
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    const erros = [];
    page.on('pageerror', (e) => erros.push(e.message));
    page.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
    page.on('dialog', (d) => d.accept());
    await page.goto(URL_APP);
    await page.waitForFunction(() => window.__fabrica?.estado);
    await page.screenshot({ path: path.join(SAIDA, 'app-celular.png'), fullPage: true });

    const exemplos = JSON.parse(fs.readFileSync(path.join(RAIZ, 'data/exemplos.json'), 'utf8'));
    for (const ex of exemplos) {
      await abrirExemplo(page, ex.id);
      // Nenhuma tela de exemplo pode ficar com texto cortado, em nenhum formato.
      const cortes = await page.evaluate(async (ex) => {
        const { desenharTela } = await import('./js/render.js');
        const { quadroPorId } = await import('./js/quadros.js');
        const r = [];
        for (const formato of ['carrossel', 'status'])
          ex.telas.forEach((texto, indice) => {
            const { cortado } = desenharTela(document.createElement('canvas'), { quadro: quadroPorId(ex.quadro), texto, indice, total: ex.telas.length, formato });
            if (cortado) r.push(`${formato} ${indice + 1}`);
          });
        return r;
      }, ex);
      ok(cortes.length === 0, `${ex.id}: nenhum texto cortado${cortes.length ? ' → ' + cortes.join(', ') : ''}`);
      ok(ex.id === 'exemplo-investigado' || ex.fontes.every((f) => /^https:\/\//.test(f.url)), `${ex.id}: todas as fontes têm link`);

      await page.click('#btn-carrossel');
      await page.waitForSelector('#resultado img');
      const dims = await page.$$eval('#resultado img', (imgs) => Promise.all(imgs.map((i) => i.decode().then(() => [i.naturalWidth, i.naturalHeight]))));
      ok(dims.length === ex.telas.length && dims.every(([w, h]) => w === 1080 && h === 1350), `${ex.id}: carrossel com ${dims.length} imagens 1080×1350`);
      for (let i = 0; i < dims.length; i++) await salvarBlobDoElemento(page, `#resultado img:nth-child(${i + 1})`, path.join(SAIDA, `${ex.id}-carrossel-${i + 1}.png`));

      await page.click('#btn-status');
      await page.waitForSelector('#resultado img[alt="Card de status"]');
      const st = await page.$eval('#resultado img', (i) => i.decode().then(() => [i.naturalWidth, i.naturalHeight]));
      ok(st[0] === 1080 && st[1] === 1920, `${ex.id}: card de status 1080×1920`);
      await salvarBlobDoElemento(page, '#resultado img', path.join(SAIDA, `${ex.id}-status.png`));
    }

    // Modelo "investigado" precisa avisar dos campos a preencher.
    await abrirExemplo(page, 'exemplo-investigado');
    ok(await page.isVisible('#aviso-modelo'), 'modelo "investigado" mostra aviso de [campos] a preencher');

    // Legenda inclui as fontes.
    await abrirExemplo(page, 'exemplo-verdade');
    const legenda = await page.textContent('#previa-legenda');
    ok(legenda.includes('Fontes:') && legenda.includes('aosfatos.org'), 'legenda inclui a lista de fontes');

    // ---------- rascunhos ----------
    await page.fill('#inp-titulo', 'Rascunho de teste');
    await page.fill('.tela-texto >> nth=0', 'Texto **editado** no teste');
    await page.waitForTimeout(700);
    await page.reload();
    await page.waitForFunction(() => window.__fabrica?.estado);
    const aberto = await page.evaluate(() => window.__fabrica.estado);
    ok(aberto.titulo === 'Rascunho de teste' && aberto.telas[0] === 'Texto **editado** no teste', 'rascunho salvo e reaberto depois de recarregar');
    const opcoes = await page.$$eval('#sel-abrir option', (os) => os.map((o) => o.textContent));
    ok(opcoes.includes('Rascunho de teste'), 'rascunho aparece na lista "Meus rascunhos"');

    const backup = await page.evaluate(async () => {
      const m = await import('./js/rascunhos.js');
      const texto = await m.exportarRascunhos().text();
      localStorage.clear();
      const n = m.importarRascunhos(texto);
      return { n, titulo: m.listarRascunhos()[0]?.titulo };
    });
    ok(backup.n >= 1 && backup.titulo === 'Rascunho de teste', 'backup: exportar e importar mantém os rascunhos');

    // ---------- offline ----------
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => window.__fabrica?.estado);
    await ctx.setOffline(true);
    await page.reload();
    await page.waitForFunction(() => window.__fabrica?.estado, null, { timeout: 5000 });
    await page.click('#btn-carrossel');
    await page.waitForSelector('#resultado img');
    ok(true, 'sem internet: o app abre e gera o carrossel');
    await ctx.setOffline(false);

    ok(erros.length === 0, `sem erros no console${erros.length ? ': ' + erros.join(' | ') : ''}`);
    await ctx.close();

    // ---------- vídeo ----------
    await testarVideo(browser, { forcarWebm: false });
    await testarVideo(browser, { forcarWebm: true });
  } catch (e) {
    console.error(e);
    falhas++;
  } finally {
    await browser.close();
    servidor.kill();
  }
  console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo!');
  process.exit(falhas ? 1 : 0);
})();
