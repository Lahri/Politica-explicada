// Gera img/icon-192.png e img/icon-512.png. Uso: node tests/gerar-icones.cjs
const { chromium } = require('playwright');
const { writeFileSync } = require('node:fs');
const path = require('node:path');

(async () => {
const browser = await chromium.launch();
const page = await browser.newPage();
for (const tamanho of [192, 512]) {
  const dataUrl = await page.evaluate((s) => {
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1B1B1F';
    ctx.fillRect(0, 0, s, s);
    const faixas = ['#1D4ED8', '#6D28D9', '#9A3412', '#B91C1C', '#15803D'];
    const lado = s * 0.12;
    faixas.forEach((cor, i) => {
      ctx.fillStyle = cor;
      ctx.fillRect(s * 0.2 + i * lado, s * 0.66, lado, s * 0.08);
    });
    ctx.fillStyle = '#FFF8EC';
    ctx.font = `700 ${s * 0.36}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PE', s / 2, s * 0.43);
    return c.toDataURL('image/png');
  }, tamanho);
  writeFileSync(path.join(__dirname, '..', 'img', `icon-${tamanho}.png`), Buffer.from(dataUrl.split(',')[1], 'base64'));
}
await browser.close();
console.log("ícones gerados");
})();
