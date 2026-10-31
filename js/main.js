import { MARCA } from './marca.js';
import { QUADROS, quadroPorId } from './quadros.js';
import { desenharTela, carregarFontes, canvasParaBlob, textoLimpo } from './render.js';
import { decodificarAudio, podeGravar, Gravador } from './audio.js';
import { gerarVideo, formatoDeVideo } from './video.js';
import { listarRascunhos, salvarRascunho, apagarRascunho, exportarRascunhos, importarRascunhos, novoId } from './rascunhos.js';
import { PERSONAGENS, AVISO_IA, AVISO_IA_LEGENDA, carregarPersonagens } from './personagens.js';
import { lerConfig, salvarConfig } from './config.js';
import { gerarFalas, textoParaFala, listarVozes, sintetizar } from './voz.js';

const $ = (sel) => document.querySelector(sel);
const el = (tag, props = {}, ...filhos) => {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...filhos);
  return e;
};

let exemplos = [];
let estado = null; // rascunho atual
let audio = null; // { blob, buffer }
let telaAtual = 0;
let formatoPrevia = 'carrossel';
let gravador = null;

// ---------- estado ----------

function rascunhoVazio(quadroId = QUADROS[0].id) {
  const q = quadroPorId(quadroId);
  return { id: novoId(), quadro: q.id, titulo: '', telas: [...q.telas], quem: [], falas: [], legenda: '', fontes: [{ nome: '', url: '' }], hashtags: MARCA.hashtags, tempos: [] };
}

function abrir(rascunho, { copia = false } = {}) {
  estado = structuredClone(rascunho);
  if (copia) estado.id = novoId();
  estado.fontes ??= [];
  sincronizar();
  telaAtual = 0;
  audio = null;
  $('#player-audio').hidden = true;
  renderTudo();
}

// Listas que andam junto com as telas (uma posição por tela).
const PARALELAS = { tempos: 4, quem: '', falas: '' };

function sincronizar() {
  const n = estado.telas.length;
  for (const [campo, padrao] of Object.entries(PARALELAS)) {
    const lista = (estado[campo] || []).slice(0, n);
    while (lista.length < n) lista.push(padrao);
    estado[campo] = lista;
  }
}

function moverTela(de, para) {
  for (const campo of ['telas', ...Object.keys(PARALELAS)]) {
    const [item] = estado[campo].splice(de, 1);
    estado[campo].splice(para, 0, item);
  }
}

function apagarTela(i) {
  for (const campo of ['telas', ...Object.keys(PARALELAS)]) estado[campo].splice(i, 1);
}

const usaPersonagens = () => estado.quem.some(Boolean);

let timerSalvar;
function alterou({ telas = false } = {}) {
  sincronizar();
  if (telas) renderTelas();
  renderTempos();
  renderPrevia();
  renderAvisos();
  renderLegenda();
  clearTimeout(timerSalvar);
  timerSalvar = setTimeout(() => {
    salvarRascunho(estado);
    renderListaAbrir();
    $('#status-salvo').textContent = 'Rascunho salvo neste aparelho ✓';
  }, 400);
}

// ---------- render ----------

function renderTudo() {
  renderListaAbrir();
  renderQuadros();
  $('#inp-titulo').value = estado.titulo;
  $('#inp-legenda').value = estado.legenda;
  $('#inp-hashtags').value = estado.hashtags;
  renderTelas();
  renderFontes();
  renderTempos();
  renderPrevia();
  renderAvisos();
  renderLegenda();
  $('#resultado').replaceChildren();
  $('#status-gerar').textContent = '';
  $('#status-salvo').textContent = '';
}

const nomeRascunho = (r) => r.titulo || textoLimpo(r.telas[0] || '').slice(0, 40) || 'Sem título';

function renderListaAbrir() {
  const sel = $('#sel-abrir');
  const salvos = listarRascunhos();
  sel.replaceChildren(
    el('option', { value: '', textContent: 'Escolha…' }),
    el('optgroup', { label: 'Meus rascunhos' }, ...(salvos.length ? salvos.map((r) => el('option', { value: 'r:' + r.id, textContent: nomeRascunho(r), selected: r.id === estado?.id })) : [el('option', { disabled: true, textContent: '(nenhum ainda)' })])),
    el('optgroup', { label: 'Exemplos prontos' }, ...exemplos.map((r) => el('option', { value: 'e:' + r.id, textContent: `${quadroPorId(r.quadro).emoji} ${r.titulo}` }))),
  );
}

function renderQuadros() {
  const q = quadroPorId(estado.quadro);
  $('#quadros').replaceChildren(
    ...QUADROS.map((item) => {
      const b = el('button', { type: 'button', className: 'quadro', textContent: `${item.emoji} ${item.nome}` });
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(item.id === estado.quadro));
      b.dataset.quadro = item.id;
      b.style.setProperty('--cor', item.cor);
      b.onclick = () => trocarQuadro(item.id);
      return b;
    }),
  );
  $('#dica-quadro').textContent = q.dica;
}

function trocarQuadro(id) {
  const textosPadrao = (q) => JSON.stringify(q.telas);
  const atual = quadroPorId(estado.quadro);
  // Se as telas ainda são o modelo do quadro anterior, troca pelo modelo do novo.
  const novo = quadroPorId(id);
  if (JSON.stringify(estado.telas) === textosPadrao(atual)) estado.telas = [...novo.telas];
  estado.quadro = id;
  renderQuadros();
  alterou({ telas: true });
}

// Caixa de texto cresce junto com o texto, para não esconder nada.
function crescer(area) {
  area.style.height = 'auto';
  area.style.height = area.scrollHeight + 4 + 'px';
}

function renderTelas() {
  const lista = $('#telas');
  lista.replaceChildren(
    ...estado.telas.map((texto, i) => {
      const area = el('textarea', { rows: 3, value: texto, className: 'tela-texto' });
      area.setAttribute('aria-label', `Texto da tela ${i + 1}`);
      area.oninput = () => {
        estado.telas[i] = area.value;
        telaAtual = i;
        crescer(area);
        alterou();
      };
      area.onfocus = () => {
        telaAtual = i;
        renderPrevia();
      };
      const mini = (rotulo, titulo, acao, desabilitado = false) => {
        const b = el('button', { type: 'button', className: 'botao secundario mini', textContent: rotulo, disabled: desabilitado, title: titulo });
        b.setAttribute('aria-label', `${titulo} (tela ${i + 1})`);
        b.onclick = acao;
        return b;
      };
      const mover = (d) => () => {
        moverTela(i, i + d);
        telaAtual = i + d;
        alterou({ telas: true });
      };

      // Quem fala nesta tela
      const opcoesQuem = [['', 'Ninguém'], ...Object.values(PERSONAGENS).map((p) => [p.id, `${p.emoji} ${p.nome}`])];
      const grupo = el('div', { className: 'segmentado quem' });
      grupo.setAttribute('role', 'group');
      grupo.setAttribute('aria-label', `Quem fala na tela ${i + 1}`);
      for (const [id, rotulo] of opcoesQuem) {
        const b = el('button', { type: 'button', textContent: rotulo });
        b.setAttribute('aria-pressed', String(estado.quem[i] === id));
        b.onclick = () => {
          estado.quem[i] = id;
          telaAtual = i;
          alterou({ telas: true });
        };
        grupo.append(b);
      }
      const fala = el('textarea', { rows: 2, value: estado.falas[i], placeholder: 'Se deixar vazio, a personagem lê o texto da tela.' });
      fala.setAttribute('aria-label', `Fala da personagem na tela ${i + 1}`);
      fala.oninput = () => {
        estado.falas[i] = fala.value;
        crescer(fala);
        alterou();
      };
      const blocoFala = el('details', { className: 'fala', open: !!estado.falas[i] }, el('summary', { textContent: '🗣️ Fala diferente do texto (opcional)' }), fala);
      blocoFala.hidden = !estado.quem[i];

      return el(
        'li',
        { className: i === telaAtual ? 'atual' : '' },
        el('div', { className: 'linha' }, el('span', { className: 'rotulo-inline', textContent: 'Quem fala:' }), grupo),
        area,
        blocoFala,
        el(
          'div',
          { className: 'acoes' },
          mini('↑', 'Subir', mover(-1), i === 0),
          mini('↓', 'Descer', mover(1), i === estado.telas.length - 1),
          mini('✕', 'Apagar', () => {
            apagarTela(i);
            telaAtual = Math.min(telaAtual, estado.telas.length - 1);
            alterou({ telas: true });
          }, estado.telas.length === 1),
        ),
      );
    }),
  );
  lista.querySelectorAll('textarea').forEach(crescer);
  $('#sel-tela-status').replaceChildren(...estado.telas.map((_, i) => el('option', { value: i, textContent: i + 1 })));
}

function renderFontes() {
  $('#fontes').replaceChildren(
    ...estado.fontes.map((f, i) => {
      const nome = el('input', { type: 'text', value: f.nome, placeholder: 'Nome da fonte (ex.: Aos Fatos)' });
      nome.setAttribute('aria-label', `Nome da fonte ${i + 1}`);
      const url = el('input', { type: 'url', value: f.url, placeholder: 'https://…', inputMode: 'url' });
      url.setAttribute('aria-label', `Link da fonte ${i + 1}`);
      nome.oninput = () => { f.nome = nome.value; alterou(); };
      url.oninput = () => { f.url = url.value.trim(); alterou(); };
      const apagar = el('button', { type: 'button', className: 'botao secundario mini', textContent: '✕' });
      apagar.setAttribute('aria-label', `Apagar fonte ${i + 1}`);
      apagar.onclick = () => { estado.fontes.splice(i, 1); renderFontes(); alterou(); };
      return el('div', { className: 'fonte' }, nome, url, apagar);
    }),
  );
}

function renderTempos() {
  $('#tempos').replaceChildren(
    ...estado.telas.map((texto, i) => {
      const inp = el('input', { type: 'number', min: 1, max: 60, step: 0.5, value: estado.tempos[i] });
      inp.setAttribute('aria-label', `Segundos da tela ${i + 1}`);
      inp.oninput = () => {
        const v = parseFloat(inp.value);
        if (v > 0) { estado.tempos[i] = v; renderTempoTotal(); salvarDepois(); }
      };
      return el('li', {}, el('span', { textContent: `${i + 1}. ${textoLimpo(texto)}` }), inp);
    }),
  );
  renderTempoTotal();
}

function salvarDepois() {
  clearTimeout(timerSalvar);
  timerSalvar = setTimeout(() => salvarRascunho(estado), 400);
}

function renderTempoTotal() {
  const soma = estado.tempos.reduce((a, b) => a + b, 0);
  let txt = `Vídeo com ${soma.toFixed(1)} s de telas`;
  if (audio) txt += ` · áudio de ${audio.buffer.duration.toFixed(1)} s`;
  if (audio && audio.buffer.duration > soma + 0.5) txt += ' (a última tela fica até o áudio acabar)';
  $('#tempo-total').textContent = txt + '.';
}

function renderPrevia() {
  telaAtual = Math.max(0, Math.min(telaAtual, estado.telas.length - 1));
  const { cortado } = desenharTela($('#canvas-previa'), {
    quadro: quadroPorId(estado.quadro),
    texto: estado.telas[telaAtual],
    indice: telaAtual,
    total: estado.telas.length,
    formato: formatoPrevia,
    personagem: estado.quem[telaAtual],
  });
  $('#prev-num').textContent = `${telaAtual + 1} de ${estado.telas.length}`;
  $('#aviso-corte').hidden = !cortado;
  document.querySelectorAll('#telas li').forEach((li, i) => li.classList.toggle('atual', i === telaAtual));
}

const temCampoAberto = () => estado.telas.some((t) => /\[[^\]]+\]/.test(t)) || estado.fontes.some((f) => /\[[^\]]+\]/.test(f.nome));
const temFonte = () => estado.fontes.some((f) => /^https?:\/\/\S+\.\S+/.test(f.url));

function renderAvisos() {
  $('#aviso-modelo').hidden = !temCampoAberto();
  $('#aviso-fonte').hidden = temFonte();
}

function montarLegenda() {
  const corpo =
    estado.legenda.trim() ||
    estado.telas.map((t, i) => (estado.quem[i] ? `${PERSONAGENS[estado.quem[i]].nome}: ` : '') + textoLimpo(t)).join('\n\n');
  const fontes = estado.fontes.filter((f) => f.nome.trim() || f.url).map((f) => `• ${f.nome.trim()}${f.url ? (f.nome.trim() ? ': ' : '') + f.url : ''}`);
  const aviso = usaPersonagens() ? (audio?.ia ? AVISO_IA_LEGENDA : 'Dona Cida e Zé são personagens fictícios.') : '';
  return [corpo, fontes.length ? 'Fontes:\n' + fontes.join('\n') : '', aviso, estado.hashtags.trim()].filter(Boolean).join('\n\n');
}

function renderLegenda() {
  $('#previa-legenda').textContent = montarLegenda();
}

// ---------- gerar e compartilhar ----------

const slug = () =>
  (nomeRascunho(estado) || 'conteudo')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'conteudo';

function conferirAntes() {
  const problemas = [];
  if (temCampoAberto()) problemas.push('ainda tem campos [entre colchetes] para preencher');
  if (!temFonte()) problemas.push('não tem fonte com link');
  if (!problemas.length) return true;
  return confirm(`Atenção: ${problemas.join(' e ')}. Quer gerar mesmo assim?`);
}

async function compartilhar(arquivos) {
  if (navigator.canShare?.({ files: arquivos })) {
    try {
      await navigator.share({ files: arquivos, text: montarLegenda() });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  baixar(arquivos);
}

function baixar(arquivos) {
  arquivos.forEach((f, i) =>
    setTimeout(() => {
      const a = el('a', { href: URL.createObjectURL(f), download: f.name });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    }, i * 300),
  );
}

function mostrarResultado(arquivos, visual, nota = '') {
  const podeCompartilhar = !!navigator.canShare?.({ files: arquivos });
  const botoes = el('div', { className: 'linha' });
  if (podeCompartilhar) {
    const b = el('button', { type: 'button', className: 'botao', textContent: '📤 Compartilhar' });
    b.onclick = () => compartilhar(arquivos);
    botoes.append(b);
  }
  const d = el('button', { type: 'button', className: 'botao secundario', textContent: arquivos.length > 1 ? `⬇️ Baixar as ${arquivos.length}` : '⬇️ Baixar' });
  d.onclick = () => baixar(arquivos);
  botoes.append(d);
  $('#resultado').replaceChildren(visual, botoes, ...(nota ? [el('p', { className: 'ajuda', textContent: nota })] : []));
}

async function gerarImagens(formato, indices) {
  const q = quadroPorId(estado.quadro);
  const arquivos = [];
  for (const i of indices) {
    const c = document.createElement('canvas');
    desenharTela(c, { quadro: q, texto: estado.telas[i], indice: i, total: estado.telas.length, formato, personagem: estado.quem[i] });
    const blob = await canvasParaBlob(c);
    const sufixo = indices.length > 1 ? `-${i + 1}` : '';
    arquivos.push(new File([blob], `${slug()}-${formato}${sufixo}.png`, { type: 'image/png' }));
  }
  return arquivos;
}

async function aoGerarCarrossel() {
  if (!conferirAntes()) return;
  const arquivos = await gerarImagens('carrossel', estado.telas.map((_, i) => i));
  const grade = el('div', { className: 'miniaturas' }, ...arquivos.map((f, i) => el('img', { src: URL.createObjectURL(f), alt: `Tela ${i + 1} do carrossel` })));
  mostrarResultado(arquivos, grade, 'No Instagram: novo post → selecione as imagens na ordem → cole a legenda.');
  $('#status-gerar').textContent = `Carrossel pronto: ${arquivos.length} imagens.`;
}

async function aoGerarStatus() {
  if (!conferirAntes()) return;
  const i = Number($('#sel-tela-status').value) || 0;
  const arquivos = await gerarImagens('status', [i]);
  const img = el('img', { src: URL.createObjectURL(arquivos[0]), alt: 'Card de status', style: 'max-width:240px;display:block;margin:10px auto' });
  mostrarResultado(arquivos, img, 'No WhatsApp: Atualizações → Meu status → escolha a imagem.');
  $('#status-gerar').textContent = 'Card de status pronto.';
}

let gerandoVideo = false;
async function aoGerarVideo() {
  if (gerandoVideo || !conferirAntes()) return;
  // Mudou o texto depois de gerar as vozes? Gera de novo (falas iguais vêm do cache, sem custo).
  if (audio?.ia && audio.assinatura !== assinaturaFalas()) {
    if (!(await aoGerarVozes())) return;
  }
  if (!audio && !confirm('Ainda não tem áudio (vozes ou gravação). Gerar o vídeo sem som?')) return;
  gerandoVideo = true;
  const botao = $('#btn-video');
  botao.disabled = true;
  const barra = $('#progresso');
  barra.hidden = false;
  barra.value = 0;
  $('#status-gerar').textContent = 'Gerando o vídeo… mantenha esta tela aberta até terminar.';
  try {
    const { blob, mime, duracao } = await gerarVideo({
      quadro: quadroPorId(estado.quadro),
      telas: estado.telas,
      quem: estado.quem,
      tempos: estado.tempos,
      audio: audio?.buffer,
      selo: audio?.ia ? AVISO_IA : usaPersonagens() ? 'personagens fictícios' : '',
      aoProgredir: (f) => (barra.value = f),
    });
    const ext = mime.startsWith('video/mp4') ? 'mp4' : 'webm';
    const arquivo = new File([blob], `${slug()}-video.${ext}`, { type: blob.type });
    const video = el('video', { src: URL.createObjectURL(arquivo), controls: true, playsInline: true });
    video.dataset.formato = ext;
    const nota = ext === 'mp4' ? 'Vídeo em MP4: pronto para TikTok, Reels e status.' : 'Este navegador gerou o vídeo em WebM. Se o app não aceitar, tente gerar pelo Chrome atualizado ou pelo Safari.';
    mostrarResultado([arquivo], video, nota);
    $('#status-gerar').textContent = `Vídeo pronto (${duracao.toFixed(1)} s, ${ext.toUpperCase()}).`;
  } catch (e) {
    $('#status-gerar').textContent = '❌ ' + e.message;
  } finally {
    barra.hidden = true;
    botao.disabled = false;
    gerandoVideo = false;
  }
}

async function aoCopiarLegenda() {
  const texto = montarLegenda();
  try {
    await navigator.clipboard.writeText(texto);
    $('#status-gerar').textContent = 'Legenda copiada ✓ É só colar no post.';
  } catch {
    $('#previa-legenda').closest('details').open = true;
    $('#status-gerar').textContent = 'Não deu para copiar automaticamente. Selecione o texto da legenda abaixo e copie.';
  }
}

// ---------- vozes de IA ----------

let config = lerConfig();

function falasParaGerar() {
  return estado.telas.map((t, i) => {
    const quem = estado.quem[i];
    if (!quem) return null;
    const texto = textoParaFala(estado.falas[i]?.trim() || t);
    return texto ? { texto, voz: config.vozes[quem] } : null;
  });
}

const assinaturaFalas = () => JSON.stringify(falasParaGerar());

async function aoGerarVozes() {
  if (!usaPersonagens()) {
    $('#status-audio').textContent = 'Escolha quem fala (Dona Cida ou Zé) em pelo menos uma tela, no passo 2.';
    return false;
  }
  if (!config.googleKey) {
    $('#config').open = true;
    $('#config').scrollIntoView({ behavior: 'smooth' });
    $('#status-config').textContent = 'Cole aqui a sua chave do Google para gerar as vozes.';
    return false;
  }
  const botao = $('#btn-vozes');
  botao.disabled = true;
  try {
    const falas = falasParaGerar();
    const { buffer, blob, tempos } = await gerarFalas({
      falas,
      chave: config.googleKey,
      aoProgredir: (i, n) => ($('#status-audio').textContent = i < n ? `🔊 Gerando a voz da tela ${i + 1} de ${n}…` : 'Juntando as falas…'),
    });
    audio = { blob, buffer, ia: true, assinatura: JSON.stringify(falas) };
    estado.tempos = tempos;
    const player = $('#player-audio');
    player.src = URL.createObjectURL(blob);
    player.hidden = false;
    renderTempos();
    renderLegenda();
    salvarDepois();
    $('#status-audio').textContent = `Vozes prontas ✓ (${buffer.duration.toFixed(1)} s). Ouça para conferir. Os tempos das telas já foram ajustados.`;
    return true;
  } catch (e) {
    $('#status-audio').textContent = '❌ Não consegui gerar as vozes: ' + e.message;
    return false;
  } finally {
    botao.disabled = false;
  }
}

function renderConfig() {
  $('#inp-chave').value = config.googleKey;
  $('#config-vozes').replaceChildren(
    ...Object.values(PERSONAGENS).map((p) => {
      const voz = config.vozes[p.id];
      const sel = el('select', { id: `voz-${p.id}` }, el('option', { value: voz.name, textContent: voz.name }));
      sel.onchange = () => { voz.name = sel.value; salvarConfig(config); };
      const vel = el('input', { type: 'range', min: 0.7, max: 1.3, step: 0.05, value: voz.speakingRate });
      const velTxt = el('span', { textContent: `${voz.speakingRate}×` });
      vel.oninput = () => { voz.speakingRate = Number(vel.value); velTxt.textContent = `${vel.value}×`; salvarConfig(config); };
      vel.setAttribute('aria-label', `Velocidade da voz de ${p.nome}`);
      sel.setAttribute('aria-label', `Voz de ${p.nome}`);
      const ouvir = el('button', { type: 'button', className: 'botao secundario', textContent: '▶️ Ouvir' });
      ouvir.onclick = () => ouvirAmostra(p);
      return el(
        'div',
        { className: 'config-voz' },
        el('img', { src: p.imagem, alt: '', width: 64, height: 64 }),
        el('div', {}, el('strong', { textContent: p.nome }), sel, el('div', { className: 'linha' }, el('span', { className: 'rotulo-inline', textContent: 'Velocidade' }), vel, velTxt), ouvir),
      );
    }),
  );
}

async function carregarVozes() {
  if (!config.googleKey) return;
  try {
    const vozes = await listarVozes(config.googleKey);
    for (const p of Object.values(PERSONAGENS)) {
      const atual = config.vozes[p.id].name;
      const sel = $(`#voz-${p.id}`);
      sel.replaceChildren(...vozes.map((v) => el('option', { value: v.name, textContent: `${v.name.replace('pt-BR-', '')} (${v.genero})`, selected: v.name === atual })));
      if (!vozes.some((v) => v.name === atual)) sel.prepend(el('option', { value: atual, textContent: `${atual} (indisponível)`, selected: true }));
    }
    $('#status-config').textContent = `Chave funcionando ✓ ${vozes.length} vozes em português disponíveis.`;
  } catch (e) {
    $('#status-config').textContent = '❌ ' + e.message;
  }
}

async function ouvirAmostra(p) {
  if (!config.googleKey) {
    $('#status-config').textContent = 'Cole a chave primeiro.';
    return;
  }
  const frase = p.id === 'cida' ? 'Oi, meu bem! Eu sou a Dona Cida. Vem que eu te explico.' : 'E aí! Eu sou o Zé. Bora entender o que tá rolando?';
  try {
    const buffer = await sintetizar(frase, config.vozes[p.id], config.googleKey);
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const src = ac.createBufferSource();
    src.buffer = buffer;
    src.connect(ac.destination);
    src.onended = () => ac.close();
    src.start();
  } catch (e) {
    $('#status-config').textContent = '❌ ' + e.message;
  }
}

// ---------- áudio ----------

async function usarAudio(blob, origem) {
  try {
    const buffer = await decodificarAudio(blob);
    audio = { blob, buffer };
    const player = $('#player-audio');
    player.src = URL.createObjectURL(blob);
    player.hidden = false;
    renderLegenda();
    $('#status-audio').textContent = `Áudio ${origem} ✓ (${buffer.duration.toFixed(1)} s). Ouça para conferir.`;
    dividirIgualmente();
  } catch {
    $('#status-audio').textContent = '❌ Não consegui abrir esse áudio. Tente gravar aqui mesmo ou usar outro arquivo (mp3, m4a ou wav).';
  }
}

function dividirIgualmente() {
  if (!audio) {
    $('#status-audio').textContent = 'Grave ou escolha um áudio primeiro.';
    return;
  }
  const n = estado.telas.length;
  const cada = Math.max(1, Math.round((audio.buffer.duration / n) * 10) / 10);
  estado.tempos = Array(n).fill(cada);
  renderTempos();
  salvarDepois();
}

async function aoGravar() {
  const botao = $('#btn-gravar');
  if (!gravador) {
    try {
      gravador = new Gravador();
      await gravador.iniciar();
      botao.textContent = '⏹️ Parar gravação';
      botao.classList.add('perigo');
      $('#status-audio').textContent = '🔴 Gravando… leia as telas e toque em "Parar" no fim.';
    } catch {
      gravador = null;
      $('#status-audio').textContent = '❌ Não consegui usar o microfone. Verifique a permissão do navegador.';
    }
    return;
  }
  const blob = await gravador.parar();
  gravador = null;
  botao.textContent = '🎙️ Gravar de novo';
  botao.classList.remove('perigo');
  usarAudio(blob, 'gravado');
}

// ---------- eventos ----------

function ligarEventos() {
  $('#btn-novo').onclick = () => abrir(rascunhoVazio(estado?.quadro));
  $('#sel-abrir').onchange = (e) => {
    const [tipo, id] = [e.target.value.slice(0, 1), e.target.value.slice(2)];
    if (tipo === 'r') abrir(listarRascunhos().find((r) => r.id === id));
    if (tipo === 'e') abrir(exemplos.find((r) => r.id === id), { copia: true });
  };
  $('#btn-apagar').onclick = () => {
    if (!confirm('Apagar este rascunho deste aparelho?')) return;
    clearTimeout(timerSalvar);
    apagarRascunho(estado.id);
    abrir(rascunhoVazio(estado.quadro));
  };
  $('#btn-exportar').onclick = () => baixar([new File([exportarRascunhos()], `rascunhos-${new Date().toISOString().slice(0, 10)}.json`, { type: 'application/json' })]);
  $('#arq-importar').onchange = async (e) => {
    const arq = e.target.files[0];
    if (!arq) return;
    try {
      const n = importarRascunhos(await arq.text());
      renderListaAbrir();
      $('#status-salvo').textContent = `${n} rascunho(s) restaurado(s) ✓`;
    } catch (err) {
      $('#status-salvo').textContent = '❌ ' + err.message;
    }
    e.target.value = '';
  };

  $('#inp-titulo').oninput = (e) => { estado.titulo = e.target.value; alterou(); };
  $('#inp-legenda').oninput = (e) => { estado.legenda = e.target.value; alterou(); };
  $('#inp-hashtags').oninput = (e) => { estado.hashtags = e.target.value; alterou(); };
  $('#btn-add-tela').onclick = () => {
    estado.telas.push('');
    telaAtual = estado.telas.length - 1;
    alterou({ telas: true });
    document.querySelectorAll('.tela-texto')[telaAtual].focus();
  };
  $('#btn-add-fonte').onclick = () => { estado.fontes.push({ nome: '', url: '' }); renderFontes(); alterou(); };

  document.querySelectorAll('.segmentado button').forEach((b) => {
    b.onclick = () => {
      formatoPrevia = b.dataset.formato;
      document.querySelectorAll('.segmentado button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      renderPrevia();
    };
  });
  $('#prev-ant').onclick = () => { telaAtual = Math.max(0, telaAtual - 1); renderPrevia(); };
  $('#prev-prox').onclick = () => { telaAtual = Math.min(estado.telas.length - 1, telaAtual + 1); renderPrevia(); };

  $('#btn-gravar').onclick = aoGravar;
  if (!podeGravar()) {
    $('#btn-gravar').disabled = true;
    $('#btn-gravar').title = 'Este navegador não permite gravar. Use "Usar áudio salvo".';
  }
  $('#arq-audio').onchange = (e) => e.target.files[0] && usarAudio(e.target.files[0], 'carregado');
  $('#btn-dividir').onclick = dividirIgualmente;
  $('#btn-vozes').onclick = aoGerarVozes;

  $('#btn-salvar-chave').onclick = () => {
    config.googleKey = $('#inp-chave').value.trim();
    salvarConfig(config);
    $('#status-config').textContent = config.googleKey ? 'Chave guardada neste aparelho. Testando…' : 'Chave apagada deste aparelho.';
    carregarVozes();
  };

  $('#btn-carrossel').onclick = aoGerarCarrossel;
  $('#btn-status').onclick = aoGerarStatus;
  $('#btn-video').onclick = aoGerarVideo;
  $('#btn-legenda').onclick = aoCopiarLegenda;
  if (!formatoDeVideo()) {
    $('#btn-video').disabled = true;
    $('#btn-video').title = 'Este navegador não consegue gravar vídeo.';
  }
}

async function iniciar() {
  $('#marca-nome').textContent = MARCA.nome;
  document.title = `Fábrica de conteúdo · ${MARCA.nome}`;
  ligarEventos();
  try {
    exemplos = await (await fetch('data/exemplos.json')).json();
  } catch {
    exemplos = [];
  }
  await Promise.all([carregarFontes(), carregarPersonagens()]);
  renderConfig();
  carregarVozes();
  const salvos = listarRascunhos();
  if (salvos.length) abrir(salvos[0]);
  else if (exemplos.length) abrir(exemplos[0], { copia: true });
  else abrir(rascunhoVazio());

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

// Usado pelos testes automáticos.
window.__fabrica = {
  get estado() { return estado; },
  get audio() { return audio; },
  usarAudio,
};

iniciar();
