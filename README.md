<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Ec1p3w9iaBDD7xnXDIsTEp-kezdlyZyG

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Narrador de Textos (`/#/narrador`)

Lê qualquer texto em voz alta usando a Web Speech API do navegador. Não usa chave
de API, não envia o texto para nenhum servidor e funciona offline — as vozes são
as instaladas no próprio dispositivo.

- Digite, cole ou carregue um arquivo `.txt` / `.md` / `.csv`
- Escolha entre uma voz **feminina** e uma **masculina** em português do Brasil,
  selecionadas automaticamente entre as mais naturais do aparelho — a lista
  completa rotula cada voz por gênero e por qualidade (natural, comum, robótica)
- Ajuste velocidade, tom e volume — as preferências e o último texto ficam salvos
- Pausar, retomar e parar, com destaque da palavra sendo lida e barra de progresso

O texto é dividido em blocos curtos antes de ser enviado ao sintetizador. Isso
contorna o corte que o Chrome aplica em falas longas e deixa os controles
responsivos. Arquivos: [`components/Narrador.tsx`](components/Narrador.tsx) e
[`services/narracaoService.ts`](services/narracaoService.ts).

**Requisitos:** Chrome, Edge, Safari ou Android atualizados, com pelo menos uma
voz instalada no sistema. Se nenhuma voz for encontrada, a tela avisa e o botão
de narrar fica desabilitado.

📖 **[Guia completo](GUIA-NARRADOR.md)** — como usar, publicar e instalar no celular.

## Instalação como aplicativo (PWA)

O app pode ser instalado na tela inicial do celular, abrir em tela cheia e
funcionar offline. Isso exige que o site esteja publicado em HTTPS.

- [`public/manifest.webmanifest`](public/manifest.webmanifest) — nome, ícones e
  atalhos. Por padrão o ícone abre direto no narrador.
- [`public/sw.js`](public/sw.js) — service worker que guarda a interface em
  cache, lendo o `index.html` para descobrir os arquivos gerados pelo build.
- [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) — a cada push na
  `main`, compila o app e envia o resultado para a branch `gh-pages`, de onde o
  GitHub Pages serve o site. Não exige configuração manual.
