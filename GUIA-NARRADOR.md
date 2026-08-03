# Guia do Narrador de Textos

Como usar, publicar na internet e instalar no celular como aplicativo.

---

## 1. Como usar

A tela fica em **`/#/narrador`** (link "Narrador" no menu do topo).

1. **Coloque o texto**: digite, cole (Ctrl+V) ou toque em **Carregar arquivo**
   para abrir um `.txt`, `.md` ou `.csv`.
2. **Escolha a voz**: a lista já vem filtrada em português. O botão
   *Ver todos os idiomas* mostra as demais vozes do aparelho.
3. **Ajuste a fala**: velocidade (0,5x a 2x), tom e volume. O botão *Padrão*
   volta tudo ao normal.
4. **Toque em Narrar texto**. Durante a leitura a palavra falada fica
   destacada e a barra mostra o progresso. Dá para **Pausar / Retomar** ou
   **Parar**.

O texto e os ajustes ficam salvos no aparelho — ao reabrir, está tudo lá.
Nada é enviado para servidor nenhum: a voz vem do próprio dispositivo.

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

1. Junte esta branch na `main` (via Pull Request ou merge direto).
2. No GitHub, vá em **Settings → Pages**.
3. Em **Source**, escolha **GitHub Actions** e salve.
4. Pronto. A cada push na `main`, o workflow
   [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) compila e publica.
   Acompanhe na aba **Actions**.

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

Se a lista de vozes aparecer vazia ou só com vozes em inglês:

- **Android**: Configurações → Sistema → Idiomas e entrada → **Saída de
  conversão de texto em voz** → Google (Serviços de fala) → engrenagem →
  **Instalar dados de voz** → Português (Brasil). Vozes marcadas como
  *Rede* precisam de internet; as locais funcionam offline.
- **iPhone**: Ajustes → Acessibilidade → **Conteúdo Falado** → Vozes →
  Português (Brasil). Baixe uma voz (as "Aprimoradas" são bem melhores).
- **Windows**: Configurações → Hora e Idioma → Voz → Adicionar vozes.

---

## 5. Se algo não funcionar

| Sintoma | Causa provável |
| --- | --- |
| "Nenhuma voz encontrada" | Nenhuma voz instalada no sistema — veja a seção 4. |
| Não instala no iPhone | Foi aberto fora do Safari, ou o site não está em HTTPS. |
| Não aparece "Instalar" no Android | Site sem HTTPS, ou o app já está instalado. |
| Sem som no iPhone | Chave lateral no modo silencioso — o iOS silencia a leitura. |
| Para sozinho ao bloquear a tela | Comportamento normal do celular: ele suspende a página. Mantenha a tela ligada. |
| Voz "engasga" em texto longo | O texto já é dividido em blocos curtos para evitar isso; se persistir, escolha uma voz **local** em vez de uma voz de rede. |

### Limitação importante

A tecnologia usada (Web Speech API) **toca o áudio, mas não permite baixá-lo**
como MP3. Para gerar arquivos de áudio seria necessário um serviço pago de
síntese de voz.
