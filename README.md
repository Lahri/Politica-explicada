# Fábrica de conteúdo · Política Explicada

Ferramenta no navegador para criar conteúdos simples sobre política, para **WhatsApp, Instagram e TikTok**, com a sua voz.

Você escolhe o quadro, escreve as telas, grava o áudio e recebe:

- 🖼️ **Carrossel para o Instagram**: imagens 1080×1350, uma por tela
- 📱 **Card de status ou stories**: imagem 1080×1920
- 🎬 **Vídeo vertical** (TikTok, Reels, status): as telas em sequência com o seu áudio
- 📋 **Legenda pronta**, com as fontes e as hashtags

Não precisa de cadastro e não usa IA. Nada sai do seu aparelho, e depois da primeira visita funciona sem internet.

## Os 5 quadros

| Quadro | Para quê |
|---|---|
| 🏛️ De quem cobrar? | Quem é responsável por resolver cada problema |
| 📖 Traduzindo | Uma palavra difícil por vez, em linguagem simples |
| 🔎 Quem está sendo investigado | Quem, por quê, situação, quem investiga, desde quando, fonte |
| 🧐 É verdade? | O boato, o veredito da agência de checagem e uma dica |
| ✅ Faça agora | Uma ação cidadã simples, passo a passo |

Quatro exemplos prontos e o modelo do "investigado" aparecem em **Começar → ou abrir → Exemplos prontos**.

## Como usar (no celular)

1. Abra o link do site. Dica: no menu do navegador, use **"Adicionar à tela inicial"** para ele virar um app.
2. **Escolha o quadro.**
3. **Escreva as telas**: uma ideia por tela, frases curtas. Coloque `**entre asteriscos**` o que quer destacar. A prévia mostra como fica.
4. **Coloque as fontes** com link. A ferramenta avisa se faltar.
5. **Grave o áudio** (🎙️) lendo as telas, ou use um áudio já gravado (📎). O tempo de cada tela é dividido sozinho, e você pode ajustar.
6. **Gere** o carrossel, o card ou o vídeo e toque em **Compartilhar** para mandar direto ao WhatsApp ou ao Instagram. Se o celular não oferecer essa opção, use **Baixar**.
7. **Copie a legenda** e cole no post.

Os rascunhos ficam salvos **só neste aparelho e navegador**. Use "Backup dos rascunhos" para guardar uma cópia. O áudio não é salvo no rascunho.

## Regras de ouro do conteúdo

- Todo conteúdo tem **fonte**, de preferência oficial (TSE, STF, PF, MPF, Senado, Câmara) ou de agência de checagem.
- Use o termo exato: **investigado ≠ réu ≠ condenado**.
- Separe **fato** de **opinião**.
- A mesma régua para todos os lados.
- Errou? Corrija publicamente.

## Trocar o nome, o @ e as cores

Tudo fica em [`js/marca.js`](js/marca.js). As cores e os ícones de cada quadro ficam em [`js/quadros.js`](js/quadros.js).
Depois de mudar, aumente a `VERSAO` em [`sw.js`](sw.js) para os celulares baixarem a versão nova.

## Publicar (GitHub Pages)

No GitHub: **Settings → Pages → Branch: `main` / `(root)` → Save**. Em 1 ou 2 minutos o site fica em
`https://SEU-USUARIO.github.io/politica-explicada/`.

## Para quem for mexer no código

HTML, CSS e JavaScript puros, sem build. Para rodar localmente:

```sh
python3 -m http.server 8000   # abre em http://localhost:8000
node tests/testes.cjs         # testes de ponta a ponta (Playwright); gera prints em tests/saida/
node tests/gerar-icones.cjs   # recria os ícones do app
```

O vídeo é gerado com `canvas.captureStream()` + `MediaRecorder`. A ferramenta usa MP4 quando o navegador grava MP4 (Chrome e Safari atualizados); se não der, grava em WebM e avisa.

Fonte: [Atkinson Hyperlegible](https://brailleinstitute.org/freefont) (SIL Open Font License, em `fonts/OFL.txt`).
