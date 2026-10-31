# Política Explicada: onde estamos

> Resumo do projeto em 31/10/2026, para continuar pelo computador.
> Repositório: https://github.com/Lahri/politica-explicada
> Site (depois de ativar o Pages): https://lahri.github.io/politica-explicada/

---

## 1. A ideia

**Política explicada de um jeito que qualquer pessoa entenda**: quem cobrar, quem está sendo investigado e por quê, o que significam as palavras difíceis, o que é verdade e o que dá para fazer.

- **Público:** qualquer escolaridade, sobretudo quem "só sabe mexer em rede social".
- **Onde o conteúdo chega:** WhatsApp, Instagram e TikTok. A informação vai até a pessoa, sem ela precisar procurar.
- **Diferencial:** as agências checam os fatos; o nosso projeto **explica e ajuda a agir**, com conversa e sem briga.

### Princípios
1. Todo conteúdo tem **fonte**, de preferência oficial (TSE, STF, PF, MPF, Senado, Câmara) ou de agência de checagem.
2. **Termo exato:** investigado ≠ réu ≠ condenado.
3. **A mesma régua para todos os lados.** Ter lado é legítimo, mas o fato vem antes.
4. **Não humilhar** quem pensa diferente.
5. **Transparência:** avisar quando a voz é de IA e que as personagens são fictícias.
6. Errou? **Corrigir publicamente.**

---

## 2. Decisões tomadas

| Tema | Decisão |
|---|---|
| Formato | Fábrica de conteúdo no navegador, que gera carrossel, card de status, vídeo e legenda |
| Quadros | 🏛️ De quem cobrar? · 📖 Traduzindo · 🔎 Quem está sendo investigado · 🧐 É verdade? · ✅ Faça agora |
| Personagens | **Dona Cida** 👵🏽 (vizinha aposentada, ex-merendeira, explica com carinho) e **Zé** 🛵 (entregador jovem, faz as perguntas) |
| Voz | **Vozes de IA do Google Cloud** (Text-to-Speech). A gravação da própria voz continua como opção |
| Nome | **Provisório:** "Política Explicada" / @politicaexplicada. Troca-se em `js/marca.js` |
| Textos | Escritos e revisados por você. A IA entra só na voz |
| Começo | Só o Congresso. A parte municipal fica para depois |

---

## 3. O que já está pronto

A **fábrica de conteúdo** já está no GitHub:

- Escolher o quadro, escrever as telas (`**negrito**` destaca) e ver a prévia.
- Escolher **quem fala** em cada tela (Dona Cida, Zé ou ninguém), com fala opcional diferente do texto.
- **🔊 Gerar vozes:** cria a voz de cada fala e ajusta o vídeo sozinho. Só regera as falas que mudaram.
- Gerar o **carrossel** (1080×1350), o **card de status** (1080×1920) e o **vídeo** (1080×1920, com áudio).
- **Legenda pronta** com as fontes, o aviso de IA e as hashtags. Botões de **compartilhar** e **baixar**.
- Avisos quando falta fonte, quando ficaram campos [entre colchetes] ou quando o texto não cabe.
- Rascunhos salvos no aparelho, com backup. Funciona offline (menos a geração de vozes).
- **4 exemplos** em diálogo (Traduzindo, De quem cobrar?, É verdade?, Faça agora) e o **modelo** do "investigado".
- Testes automáticos passando. Acessibilidade 100 no Lighthouse.

Detalhes de uso e da chave do Google: veja o [README](README.md).

---

## 4. Checklist para continuar no PC

### ☐ A. Ativar o site (GitHub Pages)
1. Abra https://github.com/Lahri/politica-explicada/settings/pages
2. **Source:** Deploy from a branch → **Branch:** `main` / `(root)` → **Save**
3. Em 1 a 2 minutos, o site abre em https://lahri.github.io/politica-explicada/

### ☐ B. Criar a chave do Google (vozes)
> ⚠️ **Não use o assistente** ("Tipo de credencial / Qual API você usa?"). Ele leva à conta de serviço, que não serve aqui.

1. **Confira o projeto:** no topo do https://console.cloud.google.com deve aparecer **politica-explicada**. Se for outro, troque.
2. **Ative a API:** abra https://console.cloud.google.com/apis/library/texttospeech.googleapis.com e clique em **Ativar** (se aparecer "Gerenciar", já está ativada).
3. **Crie a chave:** abra https://console.cloud.google.com/apis/credentials → **+ Criar credenciais** → **Chave de API**. Não escolha "Ajuda para escolher".
4. **Copie** a chave (começa com `AIza…`).
5. **Proteja a chave:** clique nela para editar e configure:
   - Restrições de aplicativos: **Sites** → adicionar `https://lahri.github.io/*`
   - Restrições de API: **Restringir chave** → só **Cloud Text-to-Speech API**
   - **Salvar**
6. **Cole na fábrica:** abra o site → **3 → ⚙️ Configurações das vozes** → cole → **Guardar**. Deve aparecer "Chave funcionando ✓".

> 🔒 Nunca mande a chave no chat nem coloque no GitHub. Ela fica só no campo da ferramenta.
> Cada aparelho guarda a sua: cole no PC **e** no celular, se for usar nos dois.

### ☐ C. Apagar a conta de serviço criada sem querer
1. Abra https://console.cloud.google.com/iam-admin/serviceaccounts
2. Marque a conta criada hoje → 🗑️ **Excluir** → confirme.
3. **Não** dê nenhum papel (como "Owner") a ela.

### ☐ D. Entender a cobrança de R$ 125 ("Google Cloud" no cartão)
- Não é uso de voz: nada foi gerado ainda.
- Pode ser **pré-pagamento** (vira crédito) ou **reserva temporária** (estornada sozinha). Só o Google confirma.
- **Não encerre a conta de faturamento** antes de falar com o suporte.
- Suporte de faturamento (gratuito): https://cloud.google.com/support/billing
- Mensagem pronta:

> Olá! Criei uma conta de faturamento do Google Cloud em 31/10/2026 e apareceu uma cobrança de R$ 125 com o nome "Google Cloud" no meu cartão. Ainda não usei nenhum serviço. Gostaria de saber o que é essa cobrança (pré-pagamento, verificação ou outra coisa) e, se não for necessária, solicito o reembolso.

- Crie também um **alerta de orçamento** de R$ 10: Faturamento → Orçamentos e alertas.
- **Plano B:** se não quiser seguir com o Google, dá para trocar as vozes para o **ElevenLabs**, que não pede cartão no plano grátis.

### ☐ E. Testar e me contar
1. No site, abra o exemplo **🧐 Urna votando sozinha?**
2. Em **⚙️ Configurações**, toque em **▶️ Ouvir** a Dona Cida e o Zé. Gostou das vozes e da velocidade?
3. **🔊 Gerar vozes** → **🎬 Vídeo**. Deixe a tela aberta até terminar.
4. **📤 Compartilhar** → WhatsApp → mande para você mesma. **O vídeo abre? O som está certo?**
5. Teste também no **celular**: é lá que o vídeo vai ser postado.

Me conte o resultado, com print se der algum erro ❌.

---

## 5. Pendências e riscos

| Item | Situação |
|---|---|
| Vídeo no celular | Testado só no navegador de testes. **Falta confirmar** se o MP4 abre no WhatsApp, TikTok e Instagram. Se não abrir, há um plano B técnico |
| Vozes de IA | Testadas só com Google **simulado** (a rede de testes bloqueia o Google). Falta ouvir de verdade |
| Exemplos | Fatos conferidos pela busca na web, sem abrir as páginas originais. **Revise antes de postar** |
| Cobrança | R$ 125 a esclarecer com o Google (item D) |
| Nome do projeto | Provisório |

---

## 6. Próximas fases

### Fase 2: Pautas do Congresso por assunto (pedido da Larissa)
- A pessoa **escolhe os assuntos** que importam para ela (trabalho, saúde, educação, segurança…).
- Mostra **o que está para votar**, com dados oficiais abertos da **Câmara** (dadosabertos.camara.leg.br) e do **Senado** (legis.senado.leg.br/dadosabertos), em linguagem simples.
- Botões **"votar na consulta pública"** e **"falar com meu deputado ou senador"**.
- **Como levar um projeto para votação**, com os caminhos reais:
  - Senado (e-Cidadania): ideia legislativa com **20 mil apoios em 4 meses** vira sugestão analisada.
  - Câmara: sugestão legislativa pela comissão de participação.
  - **Lei de iniciativa popular:** assinaturas de 1% do eleitorado nacional.
- **"O que eu posso fazer"** por tema: conselhos, ouvidorias, audiências públicas, consultas.
- A Dona Cida e o Zé explicando cada pauta.
- Limite: a rede de testes bloqueia os sites do governo, então o teste com dados reais será no seu navegador.

### Depois
- **Pautas da cidade:** começar por algumas cidades (muitas Câmaras Municipais usam o sistema SAPL, que tem dados abertos).
- **Site-biblioteca:** tudo o que já foi publicado, organizado pelos 5 quadros, para o link da bio.
- **Nome e identidade visual** definitivos. Talvez contratar um ilustrador para a Dona Cida e o Zé.
- **Banco de roteiros:** rascunhos semanais com fontes para você revisar.

---

## 7. Contexto político (pesquisa de 31/10/2026)

- **Presidência:** Lula (PT) reeleito no 2º turno em 25/10, com **51,79%** contra **48,21%** de Flávio Bolsonaro (PL). Foi uma virada: Flávio tinha liderado o 1º turno. É o 4º mandato de Lula, até o fim de 2030. ([CNN Portugal](https://cnnportugal.iol.pt/mundo/eleicoesbrasil2026/resultados/2volta), [Wikipédia](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_2026))
- **Congresso (posse em fev./2027):** o PL tem a maior bancada da Câmara (121) e projeção de 28 senadores. A federação PT-PCdoB-PV tem 88 deputados. O Congresso ficou mais à direita. ([TV Senado](https://www12.senado.leg.br/tv/programas/noticias-1/2026/10/eleicoes-2026-veja-como-ficou-a-composicao-partidaria-da-camara), [Congresso em Foco](https://www.congressoemfoco.com.br/noticia/122910/veja-como-fica-o-tamanho-dos-partidos-no-congresso-apos-as-eleicoes))
- **Pautas de 2027:** PEC da Segurança Pública, vaga de Barroso no STF, Orçamento, ajuste fiscal, reforma tributária (CBS), escala 6x1; do lado do Centrão, maioridade penal e reforma do Judiciário. ([Congresso em Foco](https://www.congressoemfoco.com.br/noticia/123668/congresso-economia-e-stf-sete-desafios-de-lula-a-partir-de-2027), [InfoMoney](https://www.infomoney.com.br/politica/o-que-esperar-do-quarto-governo-lula-congresso-ajuste-fiscal-e-promessas-no-radar/))
- **Esquerda:** sem sucessor definido para 2030. Nomes citados: Haddad, Camilo Santana, Rafael Fonteles, Boulos, João Campos, Erika Hilton e outros. ([CNN Brasil](https://www.cnnbrasil.com.br/eleicoes/reeleicao-de-lula-da-folego-a-esquerda-que-buscara-sucessor-para-2030/))
- **Desinformação agora:** alegações de fraude nas urnas, como o vídeo antigo de 2014 e um "laudo" falso, e o boato recorrente de que "Lula vai fechar igrejas". Também houve muitos deepfakes com IA na eleição. ([Lupa](https://www.agencialupa.org/eleicoes/2026/10/30/documento-falso-distorce-dados-do-tse-para-alegar-fraude-na-eleicao-presidencial-de-2026/), [Aos Fatos](https://www.aosfatos.org/noticias/video-nao-mostra-urna-registrando-votos-sozinha/), [Fato ou Boato – TSE](https://www.justicaeleitoral.jus.br/fato-ou-boato/checagens))
- **Para lembrar:** no último debate, as agências acharam erros **dos dois lados** ([EG News](https://egnews.com.br/noticia/48559-o-que-era-verdade-no-ultimo-debate-quatro-agencias-quase-60-verificacoes-erros)). Usar a mesma régua dá credibilidade.

---

## 8. Mapa dos arquivos (para quem for mexer no código)

| Arquivo | O que é |
|---|---|
| `index.html`, `css/app.css` | A tela da fábrica |
| `js/main.js` | Fluxo e botões |
| `js/quadros.js` | Os 5 quadros (cores, ícones, modelos) |
| `js/personagens.js`, `img/cida.svg`, `img/ze.svg` | Dona Cida e Zé (ilustração, vozes padrão, avisos) |
| `js/voz.js`, `js/config.js` | Vozes do Google e configurações |
| `js/render.js` | Desenho dos cards |
| `js/video.js`, `js/audio.js` | Vídeo e áudio |
| `js/rascunhos.js` | Rascunhos e backup |
| `js/marca.js` | **Nome, @ e cores do projeto** |
| `data/exemplos.json` | Exemplos prontos |
| `sw.js` | Uso offline (aumente a `VERSAO` a cada mudança) |
| `tests/testes.cjs` | Testes automáticos (`node tests/testes.cjs`) |
