// Extração de texto de PDFs para narração. O pdf.js é carregado sob demanda
// para não pesar no primeiro acesso, e o worker vem do próprio build — nada de
// CDN, para que a leitura continue funcionando offline.

export interface TextoExtraido {
  titulo: string;
  texto: string;
  paginas: number;
}

export interface OpcoesExtracao {
  aoProgredir?: (pagina: number, total: number) => void;
  cancelado?: () => boolean;
}

type ModuloPdf = typeof import('pdfjs-dist');

let moduloPdf: Promise<ModuloPdf> | null = null;

function carregarPdfJs(): Promise<ModuloPdf> {
  moduloPdf ??= (async () => {
    const [pdfjs, worker] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]);
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    return pdfjs;
  })();
  return moduloPdf;
}

export function ehPdf(arquivo: File): boolean {
  return arquivo.type === 'application/pdf' || /\.pdf$/i.test(arquivo.name);
}

// Um item do pdf.js é um fragmento de linha, não uma frase: o texto só fica
// legível se as linhas forem remontadas e depois reagrupadas em parágrafos.
export async function extrairTextoDePdf(
  arquivo: File,
  opcoes: OpcoesExtracao = {},
): Promise<TextoExtraido> {
  const pdfjs = await carregarPdfJs();
  const dados = await arquivo.arrayBuffer();

  const documento = await pdfjs.getDocument({ data: dados, useSystemFonts: true }).promise;

  try {
    const paginas: string[] = [];

    for (let numero = 1; numero <= documento.numPages; numero++) {
      if (opcoes.cancelado?.()) break;

      const pagina = await documento.getPage(numero);
      const conteudo = await pagina.getTextContent();

      const linhas: Linha[] = [];
      let atual = '';
      let base = 0;

      for (const item of conteudo.items) {
        if (!('str' in item)) continue;
        if (!atual) base = item.transform[5];
        atual += item.str;
        if (item.hasEOL) {
          linhas.push({ texto: atual, base });
          atual = '';
        }
      }
      if (atual) linhas.push({ texto: atual, base });

      pagina.cleanup();
      paginas.push(juntarLinhas(linhas));
      opcoes.aoProgredir?.(numero, documento.numPages);
    }

    return {
      titulo: arquivo.name.replace(/\.pdf$/i, ''),
      texto: limparTexto(paginas.filter(Boolean).join('\n\n')),
      paginas: documento.numPages,
    };
  } finally {
    await documento.destroy();
  }
}

interface Linha {
  texto: string;
  base: number; // coordenada vertical da linha de base, em pontos
}

// Uma linha que não termina em pontuação é continuação da seguinte. Palavras
// cortadas por hífen no fim da linha são recompostas: sem isso o sintetizador
// lê "narra- ção" como duas palavras.
function juntarLinhas(linhas: Linha[]): string {
  const salto = espacamentoTipico(linhas) * 1.5;
  let texto = '';
  let anterior: number | null = null;

  for (const { texto: bruta, base } of linhas) {
    const linha = bruta.trim();
    const distante = anterior !== null && salto > 0 && anterior - base > salto;
    anterior = base;

    if (!linha) {
      if (texto && !texto.endsWith('\n\n')) texto += '\n\n';
      continue;
    }

    // Espaço vertical maior que o normal separa título de parágrafo: sem a
    // quebra, o sintetizador leria os dois como uma frase só.
    if (distante && texto && !texto.endsWith('\n\n')) texto += '\n\n';

    if (!texto || texto.endsWith('\n\n')) {
      texto += linha;
    } else if (/[\p{Ll}\p{N}]-$/u.test(texto)) {
      texto = texto.slice(0, -1) + linha;
    } else {
      texto += ' ' + linha;
    }

    if (/[.!?:;]["')\]]?$/.test(linha)) texto += '\n\n';
  }

  return texto.trim();
}

// Mediana das distâncias entre linhas consecutivas — resistente aos saltos de
// coluna e de parágrafo, que são justamente o que queremos detectar.
function espacamentoTipico(linhas: Linha[]): number {
  const distancias = linhas
    .slice(1)
    .map((linha, i) => linhas[i].base - linha.base)
    .filter((d) => d > 0)
    .sort((a, b) => a - b);

  return distancias.length === 0 ? 0 : distancias[Math.floor(distancias.length / 2)];
}

function limparTexto(texto: string): string {
  return texto
    .replace(/\r\n?/g, '\n')
    .replace(/­/g, '') // hífen condicional: invisível na tela, atrapalha a fala
    .replace(/[ \t ]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
