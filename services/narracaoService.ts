// Serviço de narração de textos (Text-to-Speech) baseado na Web Speech API.
// Não depende de chave de API nem de rede: usa as vozes instaladas no dispositivo.

export interface OpcoesNarracao {
  voz?: SpeechSynthesisVoice | null;
  velocidade?: number; // 0.5 a 2.0
  tom?: number;        // 0.5 a 2.0
  volume?: number;     // 0.0 a 1.0
}

export interface EventosNarracao {
  aoIniciar?: () => void;
  aoProgredir?: (indiceCaractere: number, tamanhoPalavra: number) => void;
  aoTerminar?: () => void;
  aoErro?: (mensagem: string) => void;
}

export interface Bloco {
  texto: string;
  inicio: number; // posição do bloco dentro do texto original
}

// Palavras por minuto aproximadas de uma leitura em ritmo normal (pt-BR).
const PALAVRAS_POR_MINUTO = 150;

// Blocos curtos evitam o corte que o Chrome aplica em falas longas (~15s)
// e deixam pausar/parar muito mais responsivo.
const TAMANHO_MAXIMO_BLOCO = 160;

export const OPCOES_PADRAO: Required<Omit<OpcoesNarracao, 'voz'>> = {
  velocidade: 1,
  tom: 1,
  volume: 1,
};

export function narracaoDisponivel(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

const MENSAGENS_DE_ERRO: Record<string, string> = {
  'synthesis-failed': 'O motor de voz do dispositivo falhou. Verifique se há vozes instaladas no sistema.',
  'synthesis-unavailable': 'Nenhum motor de voz disponível neste dispositivo.',
  'audio-busy': 'A saída de áudio está ocupada. Tente novamente em instantes.',
  'audio-hardware': 'Nenhuma saída de áudio disponível.',
  'language-unavailable': 'O idioma da voz escolhida não está disponível.',
  'voice-unavailable': 'A voz escolhida não está mais disponível. Selecione outra.',
  'not-allowed': 'O navegador bloqueou a narração. Interaja com a página e tente de novo.',
  'network': 'Esta voz depende de conexão e a rede falhou. Escolha uma voz local.',
};

export function traduzirErro(codigo: string): string {
  return MENSAGENS_DE_ERRO[codigo] || `Falha na narração (${codigo}).`;
}

// As vozes chegam de forma assíncrona na maioria dos navegadores.
export function carregarVozes(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!narracaoDisponivel()) {
      resolve([]);
      return;
    }

    const vozes = window.speechSynthesis.getVoices();
    if (vozes.length > 0) {
      resolve(vozes);
      return;
    }

    let concluido = false;
    const finalizar = () => {
      if (concluido) return;
      concluido = true;
      window.speechSynthesis.onvoiceschanged = null;
      resolve(window.speechSynthesis.getVoices());
    };

    window.speechSynthesis.onvoiceschanged = finalizar;
    // Alguns navegadores nunca disparam o evento; garante uma saída.
    setTimeout(finalizar, 2000);
  });
}

export function vozesEmPortugues(vozes: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return vozes.filter((voz) => voz.lang.toLowerCase().startsWith('pt'));
}

export type Genero = 'feminina' | 'masculina' | 'desconhecido';
export type Qualidade = 'natural' | 'padrao' | 'robotica';

function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// O Android nomeia as vozes do Google com o gênero embutido
// (ex.: "pt-br-x-afm#female_1-local"). "female" precisa ser testado antes de
// "male", que é seu sufixo — daí a borda à esquerda em ambos os padrões.
const MARCADOR_FEMININO = /(^|[^a-z])(fe-?male|feminin[ao]|mulher)([^a-z]|$)/;
const MARCADOR_MASCULINO = /(^|[^a-z])(male|masculin[ao]|homem)([^a-z]|$)/;

// Nomes próprios usados pelos sintetizadores de Windows, iOS e Android nas
// vozes em português. Só entram aqui nomes cujo gênero é inequívoco.
const NOMES_FEMININOS = new Set([
  'luciana', 'maria', 'francisca', 'camila', 'fernanda', 'vitoria', 'leticia',
  'bianca', 'manuela', 'isabela', 'yara', 'giovanna', 'brenda', 'elza',
  'joana', 'catarina', 'ines', 'raquel', 'helena', 'cecilia', 'margarida',
]);

const NOMES_MASCULINOS = new Set([
  'daniel', 'felipe', 'ricardo', 'antonio', 'julio', 'fabio', 'thiago',
  'donato', 'humberto', 'leandro', 'valter', 'nicolau', 'eddy', 'heitor',
  'duarte', 'joaquim', 'fernando', 'macario', 'tomas',
]);

// Vozes cujo nome não carrega nenhum sinal de gênero, mas cujo timbre é
// conhecido. "Google português do Brasil" é a voz padrão do Chrome no desktop.
const GENERO_POR_NOME: Record<string, Genero> = {
  'google portugues do brasil': 'feminina',
  'google portugues': 'feminina',
};

export function generoDaVoz(voz: SpeechSynthesisVoice): Genero {
  const texto = semAcento(`${voz.name} ${voz.voiceURI}`);

  const conhecida = GENERO_POR_NOME[semAcento(voz.name).trim()];
  if (conhecida) return conhecida;

  if (MARCADOR_FEMININO.test(texto)) return 'feminina';
  if (MARCADOR_MASCULINO.test(texto)) return 'masculina';

  for (const palavra of texto.split(/[^a-z]+/)) {
    if (NOMES_FEMININOS.has(palavra)) return 'feminina';
    if (NOMES_MASCULINOS.has(palavra)) return 'masculina';
  }

  return 'desconhecido';
}

// Motores antigos (eSpeak, SAPI "Desktop", Pico) soam metálicos; os neurais
// mais recentes se anunciam no próprio nome.
const SINAIS_ROBOTICOS = /(espeak|e-speak|pico|compact|eloquence|festival|flite|desktop)/;
const SINAIS_NATURAIS = /(google|neural|natural|enhanced|aprimorad|premium|siri|wavenet|multilingual)/;

export function qualidadeDaVoz(voz: SpeechSynthesisVoice): Qualidade {
  const texto = semAcento(`${voz.name} ${voz.voiceURI}`);
  if (SINAIS_ROBOTICOS.test(texto)) return 'robotica';
  if (SINAIS_NATURAIS.test(texto)) return 'natural';
  return 'padrao';
}

const PESO_QUALIDADE: Record<Qualidade, number> = { natural: 0, padrao: 1, robotica: 2 };

// Melhor voz de um gênero: português do Brasil na frente, depois as mais
// naturais. Retorna null quando o aparelho não tem nenhuma voz desse gênero.
export function melhorVoz(vozes: SpeechSynthesisVoice[], genero: Genero): SpeechSynthesisVoice | null {
  const candidatas = vozesEmPortugues(vozes).filter((voz) => generoDaVoz(voz) === genero);
  if (candidatas.length === 0) return null;

  return [...candidatas].sort(
    (a, b) =>
      prioridadeDoIdioma(a) - prioridadeDoIdioma(b) ||
      PESO_QUALIDADE[qualidadeDaVoz(a)] - PESO_QUALIDADE[qualidadeDaVoz(b)] ||
      a.name.localeCompare(b.name, 'pt-BR'),
  )[0];
}

// Português do Brasil primeiro, depois outras variantes de português, depois
// os demais idiomas — assim a voz pré-selecionada já é a esperada aqui.
function prioridadeDoIdioma(voz: SpeechSynthesisVoice): number {
  const idioma = voz.lang.toLowerCase().replace('_', '-');
  if (idioma.startsWith('pt-br')) return 0;
  if (idioma.startsWith('pt')) return 1;
  return 2;
}

export function ordenarVozes(vozes: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return [...vozes].sort(
    (a, b) =>
      prioridadeDoIdioma(a) - prioridadeDoIdioma(b) ||
      PESO_QUALIDADE[qualidadeDaVoz(a)] - PESO_QUALIDADE[qualidadeDaVoz(b)] ||
      a.name.localeCompare(b.name, 'pt-BR'),
  );
}

export function contarPalavras(texto: string): number {
  const limpo = texto.trim();
  if (!limpo) return 0;
  return limpo.split(/\s+/).length;
}

// Estimativa de duração da narração, em segundos.
export function estimarDuracao(texto: string, velocidade: number): number {
  const palavras = contarPalavras(texto);
  if (palavras === 0) return 0;
  return Math.round((palavras / (PALAVRAS_POR_MINUTO * velocidade)) * 60);
}

export function formatarDuracao(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${minutos}:${String(resto).padStart(2, '0')}`;
}

// Quebra o texto em blocos curtos, preferindo cortes em fim de frase e,
// na falta deles, em espaços. Cada bloco guarda seu deslocamento original
// para que o destaque da palavra funcione sobre o texto completo.
export function dividirEmBlocos(texto: string, tamanhoMaximo = TAMANHO_MAXIMO_BLOCO): Bloco[] {
  const blocos: Bloco[] = [];
  let cursor = 0;

  while (cursor < texto.length) {
    const restante = texto.length - cursor;

    if (restante <= tamanhoMaximo) {
      const trecho = texto.slice(cursor);
      if (trecho.trim()) blocos.push({ texto: trecho, inicio: cursor });
      break;
    }

    const janela = texto.slice(cursor, cursor + tamanhoMaximo);
    let corte = Math.max(
      janela.lastIndexOf('. '),
      janela.lastIndexOf('! '),
      janela.lastIndexOf('? '),
      janela.lastIndexOf('\n'),
    );

    if (corte < tamanhoMaximo * 0.4) corte = janela.lastIndexOf('; ');
    if (corte < tamanhoMaximo * 0.4) corte = janela.lastIndexOf(', ');
    if (corte < tamanhoMaximo * 0.4) corte = janela.lastIndexOf(' ');
    if (corte <= 0) corte = tamanhoMaximo - 1;

    const fim = cursor + corte + 1;
    const trecho = texto.slice(cursor, fim);
    if (trecho.trim()) blocos.push({ texto: trecho, inicio: cursor });
    cursor = fim;
  }

  return blocos;
}

export class Narrador {
  private blocos: Bloco[] = [];
  private indiceBloco = 0;
  private opcoes: OpcoesNarracao = {};
  private eventos: EventosNarracao = {};
  private falando = false;
  private pausadoPeloUsuario = false;
  private manterVivo: ReturnType<typeof setInterval> | null = null;

  falar(texto: string, opcoes: OpcoesNarracao = {}, eventos: EventosNarracao = {}): void {
    if (!narracaoDisponivel()) {
      eventos.aoErro?.('Este navegador não suporta narração de textos.');
      return;
    }

    const conteudo = texto.trim();
    if (!conteudo) {
      eventos.aoErro?.('Escreva ou carregue um texto antes de narrar.');
      return;
    }

    this.parar();

    this.blocos = dividirEmBlocos(texto);
    this.indiceBloco = 0;
    this.opcoes = opcoes;
    this.eventos = eventos;
    this.falando = true;
    this.pausadoPeloUsuario = false;

    eventos.aoIniciar?.();
    this.iniciarManterVivo();
    this.falarBlocoAtual();
  }

  private falarBlocoAtual(): void {
    const bloco = this.blocos[this.indiceBloco];

    if (!bloco) {
      this.encerrar();
      this.eventos.aoTerminar?.();
      return;
    }

    const fala = new SpeechSynthesisUtterance(bloco.texto);
    fala.rate = this.opcoes.velocidade ?? OPCOES_PADRAO.velocidade;
    fala.pitch = this.opcoes.tom ?? OPCOES_PADRAO.tom;
    fala.volume = this.opcoes.volume ?? OPCOES_PADRAO.volume;
    fala.lang = this.opcoes.voz?.lang ?? 'pt-BR';

    // A lista de vozes pode ser recarregada pelo navegador, invalidando a
    // referência guardada; nesse caso seguimos apenas com o idioma.
    if (this.opcoes.voz) {
      try {
        fala.voice = this.opcoes.voz;
      } catch {
        this.opcoes.voz = null;
      }
    }

    fala.onboundary = (evento) => {
      if (evento.name && evento.name !== 'word') return;
      const tamanho = evento.charLength ?? this.medirPalavra(bloco.texto, evento.charIndex);
      this.eventos.aoProgredir?.(bloco.inicio + evento.charIndex, tamanho);
    };

    fala.onend = () => {
      if (!this.falando) return;
      this.indiceBloco += 1;
      this.falarBlocoAtual();
    };

    fala.onerror = (evento) => {
      // "interrupted"/"canceled" acontecem quando o próprio usuário para a narração.
      if (evento.error === 'interrupted' || evento.error === 'canceled') return;
      this.encerrar();
      this.eventos.aoErro?.(traduzirErro(evento.error));
    };

    window.speechSynthesis.speak(fala);
  }

  private medirPalavra(texto: string, indice: number): number {
    const resto = texto.slice(indice);
    const fim = resto.search(/\s/);
    return fim === -1 ? resto.length : fim;
  }

  // O Chrome suspende a fila de fala depois de alguns segundos em segundo
  // plano; um resume() periódico mantém a narração viva.
  private iniciarManterVivo(): void {
    this.pararManterVivo();
    this.manterVivo = setInterval(() => {
      if (!this.falando || this.pausadoPeloUsuario) return;
      window.speechSynthesis.resume();
    }, 8000);
  }

  private pararManterVivo(): void {
    if (this.manterVivo !== null) {
      clearInterval(this.manterVivo);
      this.manterVivo = null;
    }
  }

  private encerrar(): void {
    this.falando = false;
    this.pausadoPeloUsuario = false;
    this.pararManterVivo();
  }

  pausar(): void {
    if (!narracaoDisponivel() || !this.falando) return;
    this.pausadoPeloUsuario = true;
    window.speechSynthesis.pause();
  }

  retomar(): void {
    if (!narracaoDisponivel() || !this.falando) return;
    this.pausadoPeloUsuario = false;
    window.speechSynthesis.resume();
  }

  parar(): void {
    if (!narracaoDisponivel()) return;
    this.encerrar();
    this.blocos = [];
    this.indiceBloco = 0;
    window.speechSynthesis.cancel();
  }

  estaFalando(): boolean {
    return this.falando;
  }

  estaPausado(): boolean {
    return this.pausadoPeloUsuario;
  }
}
