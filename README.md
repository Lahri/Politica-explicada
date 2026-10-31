# Fábrica de conteúdo · Política Explicada

Ferramenta no navegador para criar conteúdos simples sobre política, para **WhatsApp, Instagram e TikTok**, com a sua voz.

Você escolhe o quadro, escreve as telas, grava o áudio e recebe:

- 🖼️ **Carrossel para o Instagram**: imagens 1080×1350, uma por tela
- 📱 **Card de status ou stories**: imagem 1080×1920
- 🎬 **Vídeo vertical** (TikTok, Reels, status): as telas em sequência com o seu áudio
- 📋 **Legenda pronta**, com as fontes e as hashtags

Não precisa de cadastro. Os textos são sempre seus; a IA só entra nas **vozes** das personagens, e só se você configurar. Nada sai do seu aparelho, a não ser o texto das falas enviado ao Google para virar voz. Depois da primeira visita, funciona sem internet, menos a geração de vozes.

## Os 5 quadros

| Quadro | Para quê |
|---|---|
| 🏛️ De quem cobrar? | Quem é responsável por resolver cada problema |
| 📖 Traduzindo | Uma palavra difícil por vez, em linguagem simples |
| 🔎 Quem está sendo investigado | Quem, por quê, situação, quem investiga, desde quando, fonte |
| 🧐 É verdade? | O boato, o veredito da agência de checagem e uma dica |
| ✅ Faça agora | Uma ação cidadã simples, passo a passo |

Quatro exemplos prontos e o modelo do "investigado" aparecem em **Começar → ou abrir → Exemplos prontos**.

## A dupla: Dona Cida e Zé

| | Personagem | Jeito |
|---|---|---|
| 👵🏽 | **Dona Cida** | Vizinha aposentada, ex-merendeira de escola pública. Explica com paciência, chama todo mundo de "meu bem". |
| 🛵 | **Zé** | Entregador de aplicativo, jovem e curioso. Faz as perguntas que todo mundo tem. |

**Normalmente o Zé pergunta e a Dona Cida explica.** Em cada tela você escolhe quem fala. A ilustração aparece no card, e no vídeo a fala sai com a voz da personagem.

**Transparência:** os vídeos com vozes de IA mostram o selo "🔊 vozes geradas por IA · personagens fictícios", e a legenda também avisa. Não tire esse aviso: ele protege a credibilidade do projeto. Em período eleitoral, ele é exigido pelas regras do TSE para propaganda.

## Vozes de IA (Google Cloud): como criar a chave

Isso é feito uma vez só, de preferência no computador. Os nomes dos menus podem mudar um pouco.

1. Entre em **console.cloud.google.com** com a sua conta Google e **crie um projeto** (ex.: "politica-explicada").
2. Ative o **faturamento** (Billing). O Google pede cartão mesmo para usar só a cota grátis mensal. Dica: crie um **alerta de orçamento** (Budgets & alerts) de R$ 10 para ser avisada se passar disso.
3. Em **APIs e serviços → Biblioteca**, procure **Cloud Text-to-Speech API** e clique em **Ativar**.
4. Em **APIs e serviços → Credenciais**, clique em **Criar credenciais → Chave de API**.
5. **Proteja a chave** (muito importante). Clique na chave criada e:
   - em **Restrições de aplicativo**, escolha **Sites (referenciadores HTTP)** e adicione `https://lahri.github.io/*`;
   - em **Restrições de API**, escolha **Restringir chave** e marque só a **Cloud Text-to-Speech API**.
6. Copie a chave (começa com `AIza…`), abra a fábrica, vá em **3 → ⚙️ Configurações das vozes**, cole e toque em **Guardar**. Aparece "Chave funcionando ✓".
7. Ali mesmo dá para trocar a voz de cada personagem, ajustar a velocidade e tocar **▶️ Ouvir**.

A chave fica guardada **só no seu aparelho**. Se trocar de celular, cole de novo. Falas que não mudaram não são geradas de novo, o que economiza a cota.

## Como usar (no celular)

1. Abra o link do site. Dica: no menu do navegador, use **"Adicionar à tela inicial"** para ele virar um app.
2. **Escolha o quadro.**
3. **Escreva as telas**: uma ideia por tela, frases curtas. Coloque `**entre asteriscos**` o que quer destacar. A prévia mostra como fica.
4. **Coloque as fontes** com link. A ferramenta avisa se faltar.
5. **Áudio:** toque em **🔊 Gerar vozes** para a Dona Cida e o Zé falarem. O vídeo se ajusta sozinho ao tempo de cada fala. Se preferir a sua própria voz, abra "Ou use a sua própria voz" e grave (🎙️) ou use um áudio já gravado (📎).
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

Tudo fica em [`js/marca.js`](js/marca.js). As cores e os ícones de cada quadro ficam em [`js/quadros.js`](js/quadros.js), e as personagens e as vozes padrão em [`js/personagens.js`](js/personagens.js).
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
