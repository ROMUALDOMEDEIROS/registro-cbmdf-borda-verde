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
- Escolha a voz (filtrada por português, com opção de ver todos os idiomas)
- Ajuste velocidade, tom e volume — as preferências e o último texto ficam salvos
- Pausar, retomar e parar, com destaque da palavra sendo lida e barra de progresso

O texto é dividido em blocos curtos antes de ser enviado ao sintetizador. Isso
contorna o corte que o Chrome aplica em falas longas e deixa os controles
responsivos. Arquivos: [`components/Narrador.tsx`](components/Narrador.tsx) e
[`services/narracaoService.ts`](services/narracaoService.ts).

**Requisitos:** Chrome, Edge, Safari ou Android atualizados, com pelo menos uma
voz instalada no sistema. Se nenhuma voz for encontrada, a tela avisa e o botão
de narrar fica desabilitado.
