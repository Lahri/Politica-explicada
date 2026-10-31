// Configurações guardadas só neste aparelho (inclui a chave do Google).
import { PERSONAGENS } from './personagens.js';

const CHAVE = 'pe:config';

const padrao = () => ({
  googleKey: '',
  vozes: Object.fromEntries(Object.values(PERSONAGENS).map((p) => [p.id, { ...p.voz }])),
});

export function lerConfig() {
  const base = padrao();
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE)) || {};
    return { ...base, ...salvo, vozes: Object.fromEntries(Object.keys(base.vozes).map((id) => [id, { ...base.vozes[id], ...salvo.vozes?.[id] }])) };
  } catch {
    return base;
  }
}

export function salvarConfig(config) {
  localStorage.setItem(CHAVE, JSON.stringify(config));
}
