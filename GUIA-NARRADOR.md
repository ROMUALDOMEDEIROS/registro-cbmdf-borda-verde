# Guia do Narrador de Textos

Como usar, publicar na internet e instalar no celular como aplicativo.

---

## 1. Como usar

A tela fica em **`/#/narrador`** (link "Narrador" no menu do topo).

1. **Coloque o texto**: digite, cole (Ctrl+V) ou toque em **Arquivo** para abrir
   um **PDF**, `.txt`, `.md` ou `.csv`. Ao abrir um PDF, uma barra mostra o
   andamento página a página; o texto extraído aparece no editor e pode ser
   corrigido antes da leitura.
2. **Escolha a voz**: dois botões — **Feminina** e **Masculina** — já apontam
   para a melhor voz de cada gênero em português do Brasil instalada no
   aparelho. A estrela (✦) marca as vozes neurais, que soam bem menos
   robóticas. A lista abaixo traz todas as vozes, cada uma rotulada com gênero
   e qualidade (*natural*, *comum* ou *robótica*); o botão *Ver todos os
   idiomas* mostra também as de outros idiomas.

   Se um dos botões aparecer como **Não instalada**, o aparelho não tem voz
   daquele gênero em português — a seção 4 explica como instalar.
3. **Ajuste a fala**: velocidade (0,5x a 2x), tom e volume. O botão *Padrão*
   volta tudo ao normal.
4. **Toque em Narrar texto**. Durante a leitura a palavra falada fica
   destacada e a barra mostra o progresso. Dá para **Pausar / Retomar** ou
   **Parar**.

O texto e os ajustes ficam salvos no aparelho — ao reabrir, está tudo lá.
Nada é enviado para servidor nenhum: a voz vem do próprio dispositivo.

### Histórico e retomada

O botão **Histórico** lista os textos e PDFs já abertos, com data e número de
palavras. Tocar em um deles traz o documento de volta para o editor.

Sempre que a leitura é pausada ou parada, o ponto exato fica gravado. Ao voltar
ao documento — mesmo depois de fechar o navegador — aparece o aviso *"Leitura
parou em X% do texto"* e o botão passa a dizer **Retomar leitura**. Para ler
desde o começo, use **Começar do início**. Isso é o que torna prático narrar um
PDF de dezenas de páginas em várias sessões.

Tudo isso fica só no aparelho. O botão **Apagar tudo** limpa a lista, e o **X**
ao lado de cada item remove só aquele documento.

### Rodando no seu computador

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000/#/narrador`.

---

## 2. Como publicar na internet

Para instalar no celular é **obrigatório** que o site esteja em HTTPS.
O repositório já vem com a publicação automática configurada.

### GitHub Pages (já configurado, gratuito)

Não é preciso mexer em nada: a cada push na `main`, o workflow
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) compila o app e
envia o resultado para a branch `gh-pages`, de onde o Pages serve o site.
Acompanhe na aba **Actions**.

O workflow publica por branch em vez de usar o artefato do Pages porque **criar**
o site do Pages exige permissão de administração do repositório, que o GitHub
nunca concede ao token do Actions. Já a publicação por branch precisa apenas de
escrita no repositório — e a própria existência da branch `gh-pages` ativa o
Pages. Por isso não é necessário passar por **Settings → Pages**.

O endereço final será:

```
https://romualdomedeiros.github.io/registro-cbmdf-borda-verde/#/narrador
```

> **Segredos (opcional):** o narrador não precisa de nenhum. Se quiser que a
> parte de presença continue enviando dados para a planilha, cadastre em
> **Settings → Secrets and variables → Actions** os segredos
> `VITE_APPS_SCRIPT_URL` e `GEMINI_API_KEY`. Sem eles o build funciona
> normalmente e só o envio para a planilha fica indisponível.

### Alternativas

- **Netlify / Vercel**: rode `npm run build` e arraste a pasta `dist` para o
  site deles. Publica em segundos, com HTTPS.
- O build usa caminhos relativos (`base: './'`), então funciona tanto na raiz
  de um domínio quanto em subpasta.

---

## 3. Como instalar no celular

Depois de publicado, abra o endereço no celular. O app se instala como PWA:
ganha ícone na tela inicial, abre em tela cheia (sem barra do navegador) e
funciona **offline**.

### Android (Chrome)

1. Abra o endereço no **Chrome**.
2. Menu **⋮** → **Instalar aplicativo** (ou *Adicionar à tela inicial*).
3. Confirme. O ícone verde aparece junto dos outros apps.

### iPhone / iPad (Safari)

No iOS **só funciona pelo Safari** — Chrome e Firefox não instalam PWA.

1. Abra o endereço no **Safari**.
2. Toque em **Compartilhar** (quadrado com seta para cima).
3. **Adicionar à Tela de Início** → **Adicionar**.

O ícone abre direto no narrador. Para que ele abra na tela de presença,
troque `start_url` em [`public/manifest.webmanifest`](public/manifest.webmanifest)
de `"./index.html#/narrador"` para `"./index.html#/"`.

---

## 4. Instalando vozes em português

Vale a pena fazer isso mesmo que já haja alguma voz: as vozes que vêm de
fábrica costumam ser as antigas e metálicas. Nos caminhos abaixo, baixe **uma
voz feminina e uma masculina** para ter as duas opções no app.

- **Android**: Configurações → Sistema → Idiomas e entrada → **Saída de
  conversão de texto em voz** → Google (Serviços de fala) → engrenagem →
  **Instalar dados de voz** → Português (Brasil). A tela lista várias vozes
  numeradas — algumas femininas, outras masculinas. Vozes marcadas como
  *Rede* precisam de internet; as locais funcionam offline.
- **iPhone**: Ajustes → Acessibilidade → **Conteúdo Falado** → Vozes →
  Português (Brasil). Baixe as **Aprimoradas** ou **Premium**: a diferença
  para a voz padrão é grande. O iOS traz *Luciana* (feminina) e, dependendo da
  versão, uma voz masculina na mesma lista.
- **Windows**: Configurações → Hora e Idioma → Voz → Adicionar vozes. No
  Windows 11, procure as vozes **(Natural)** — no português do Brasil são
  *Francisca* (feminina) e *Antônio* (masculina).

> **Por que o app não instala as vozes sozinho:** a Web Speech API, usada aqui,
> só consegue *usar* as vozes já presentes no sistema. Instalar uma voz nova é
> uma ação do sistema operacional, fora do alcance de qualquer página web. Em
> compensação, nada é enviado para servidores e a narração funciona offline.

---

## 5. Se algo não funcionar

| Sintoma | Causa provável |
| --- | --- |
| "Nenhuma voz encontrada" | Nenhuma voz instalada no sistema — veja a seção 4. |
| Botão "Masculina" (ou "Feminina") diz *Não instalada* | O aparelho só tem voz de um gênero em português. Instale a outra pela seção 4. |
| A voz soa metálica | A lista rotula cada voz. Escolha uma marcada como *natural*; se não houver nenhuma, instale pela seção 4. |
| Não instala no iPhone | Foi aberto fora do Safari, ou o site não está em HTTPS. |
| Não aparece "Instalar" no Android | Site sem HTTPS, ou o app já está instalado. |
| Sem som no iPhone | Chave lateral no modo silencioso — o iOS silencia a leitura. |
| Para sozinho ao bloquear a tela | Comportamento normal do celular: ele suspende a página. Mantenha a tela ligada. |
| Voz "engasga" em texto longo | O texto já é dividido em blocos curtos para evitar isso; se persistir, escolha uma voz **local** em vez de uma voz de rede. |
| "Este PDF não tem texto selecionável" | O arquivo é um documento digitalizado (imagem das páginas). É preciso passá-lo antes por um programa de OCR, que converte a imagem em texto. |
| PDF sai com palavras emendadas ou fora de ordem | PDFs com colunas, tabelas ou muitos quadros confundem a extração. O texto fica no editor e pode ser corrigido à mão antes de narrar. |
| PDF não abre na versão de arquivo único | O `narrador-standalone.html` busca o leitor de PDF na internet da primeira vez. Conecte-se uma vez e depois funciona offline. A versão publicada como app não tem essa limitação. |

### Limitação importante

A tecnologia usada (Web Speech API) **toca o áudio, mas não permite baixá-lo**
como MP3. Para gerar arquivos de áudio seria necessário um serviço pago de
síntese de voz.
