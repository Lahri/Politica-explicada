// Rascunhos salvos no próprio aparelho (localStorage). O áudio não é salvo.
const CHAVE = 'pe:rascunhos';

export function listarRascunhos() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || [];
  } catch {
    return [];
  }
}

function gravar(lista) {
  localStorage.setItem(CHAVE, JSON.stringify(lista));
}

export function salvarRascunho(rascunho) {
  const lista = listarRascunhos().filter((r) => r.id !== rascunho.id);
  lista.unshift({ ...rascunho, atualizado: new Date().toISOString() });
  gravar(lista);
}

export function apagarRascunho(id) {
  gravar(listarRascunhos().filter((r) => r.id !== id));
}

export function exportarRascunhos() {
  return new Blob([JSON.stringify(listarRascunhos(), null, 2)], { type: 'application/json' });
}

// Junta os rascunhos importados aos atuais (o importado vence em caso de mesmo id).
export function importarRascunhos(texto) {
  const importados = JSON.parse(texto);
  if (!Array.isArray(importados) || importados.some((r) => !r.id || !Array.isArray(r.telas))) {
    throw new Error('Arquivo de rascunhos inválido.');
  }
  const ids = new Set(importados.map((r) => r.id));
  gravar([...importados, ...listarRascunhos().filter((r) => !ids.has(r.id))]);
  return importados.length;
}

export const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
