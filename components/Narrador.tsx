
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  AudioLines,
  Play,
  Pause,
  Square,
  Upload,
  Trash2,
  Volume2,
  Gauge,
  Music2,
  RotateCcw,
  AlertTriangle,
  FileText,
  Sparkles,
  History,
  X,
  FileType2,
} from 'lucide-react';
import {
  Narrador as MotorNarracao,
  OPCOES_PADRAO,
  carregarVozes,
  contarPalavras,
  estimarDuracao,
  formatarDuracao,
  generoDaVoz,
  melhorVoz,
  narracaoDisponivel,
  ordenarVozes,
  qualidadeDaVoz,
  type Genero,
} from '../services/narracaoService';
import { ehPdf, extrairTextoDePdf } from '../services/pdfService';
import {
  formatarData,
  lerHistorico,
  limpar as limparHistorico,
  marcarPosicao,
  registrar,
  remover,
  type ItemHistorico,
} from '../services/historicoService';

const CHAVE_TEXTO = 'narrador_texto';
const CHAVE_PREFERENCIAS = 'narrador_preferencias';
const EXTENSOES_ACEITAS = '.txt,.md,.csv,.pdf,text/plain,application/pdf';

interface Preferencias {
  vozURI: string;
  velocidade: number;
  tom: number;
  volume: number;
  apenasPortugues: boolean;
}

const DESCRICAO_GENERO: Record<Genero, string> = {
  feminina: 'feminina',
  masculina: 'masculina',
  desconhecido: 'gênero indefinido',
};

const DESCRICAO_QUALIDADE: Record<ReturnType<typeof qualidadeDaVoz>, string> = {
  natural: 'natural',
  padrao: 'comum',
  robotica: 'robótica',
};

// Título de um texto colado: a primeira linha com conteúdo, encurtada.
function tituloDoTexto(texto: string): string {
  const linha = texto.split('\n').find((l) => l.trim()) || '';
  const limpo = linha.trim();
  return limpo.length > 60 ? `${limpo.slice(0, 60)}…` : limpo;
}

const PREFERENCIAS_PADRAO: Preferencias = {
  vozURI: '',
  velocidade: OPCOES_PADRAO.velocidade,
  tom: OPCOES_PADRAO.tom,
  volume: OPCOES_PADRAO.volume,
  apenasPortugues: true,
};

const Narrador: React.FC = () => {
  const [texto, setTexto] = useState<string>(() => localStorage.getItem(CHAVE_TEXTO) || '');
  const [preferencias, setPreferencias] = useState<Preferencias>(() => {
    const salvas = localStorage.getItem(CHAVE_PREFERENCIAS);
    return salvas ? { ...PREFERENCIAS_PADRAO, ...JSON.parse(salvas) } : PREFERENCIAS_PADRAO;
  });

  const [vozes, setVozes] = useState<SpeechSynthesisVoice[]>([]);
  const [vozesCarregadas, setVozesCarregadas] = useState(false);
  const [narrando, setNarrando] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [posicao, setPosicao] = useState<{ inicio: number; fim: number } | null>(null);
  const [erro, setErro] = useState('');

  // Ao reabrir o app, o texto restaurado é reconectado ao seu documento no
  // histórico — é isso que faz a retomada sobreviver ao fechar o navegador.
  const [inicial] = useState(() => {
    const lista = lerHistorico();
    const documento = lista.find((item) => item.texto === texto) ?? null;
    return { lista, id: documento?.id ?? null, posicao: documento?.posicao ?? 0 };
  });

  const [historico, setHistorico] = useState<ItemHistorico[]>(inicial.lista);
  const [documentoAtual, setDocumentoAtual] = useState<string | null>(inicial.id);
  const [retomarDe, setRetomarDe] = useState(inicial.posicao);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [extraindo, setExtraindo] = useState<{ pagina: number; total: number } | null>(null);

  const motor = useRef<MotorNarracao | null>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);
  const ultimaPosicao = useRef(0);
  const suportado = narracaoDisponivel();

  if (motor.current === null) {
    motor.current = new MotorNarracao();
  }

  useEffect(() => {
    if (!suportado) {
      setErro('Este navegador não suporta narração de textos. Use Chrome, Edge ou Safari atualizados.');
      return;
    }

    let ativo = true;
    carregarVozes().then((lista) => {
      if (!ativo) return;
      setVozes(ordenarVozes(lista));
      setVozesCarregadas(true);
      if (lista.length === 0) {
        setErro('Nenhuma voz de narração foi encontrada neste dispositivo. Instale vozes nas configurações do sistema.');
      }
    });

    return () => {
      ativo = false;
      motor.current?.parar();
    };
  }, [suportado]);

  useEffect(() => {
    localStorage.setItem(CHAVE_TEXTO, texto);
  }, [texto]);

  useEffect(() => {
    localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(preferencias));
  }, [preferencias]);

  const vozesVisiveis = useMemo(() => {
    const emPortugues = vozes.filter((voz) => voz.lang.toLowerCase().startsWith('pt'));
    if (preferencias.apenasPortugues && emPortugues.length > 0) return emPortugues;
    return vozes;
  }, [vozes, preferencias.apenasPortugues]);

  const vozSelecionada = useMemo(() => {
    return (
      vozesVisiveis.find((voz) => voz.voiceURI === preferencias.vozURI) ||
      vozesVisiveis[0] ||
      null
    );
  }, [vozesVisiveis, preferencias.vozURI]);

  // Melhor voz natural de cada gênero em português, para a escolha rápida.
  const sugestoes = useMemo(
    () => ({
      feminina: melhorVoz(vozes, 'feminina'),
      masculina: melhorVoz(vozes, 'masculina'),
    }),
    [vozes],
  );

  const faltando = vozesCarregadas && vozes.length > 0
    ? (['feminina', 'masculina'] as const).filter((genero) => !sugestoes[genero])
    : [];

  const palavras = contarPalavras(texto);
  const duracao = estimarDuracao(texto, preferencias.velocidade);
  const progresso = posicao && texto.length > 0 ? Math.min(100, (posicao.fim / texto.length) * 100) : 0;

  const atualizarPreferencia = <C extends keyof Preferencias>(campo: C, valor: Preferencias[C]) => {
    setPreferencias((atual) => ({ ...atual, [campo]: valor }));
  };

  // Guarda onde a leitura parou, para que o documento possa ser retomado depois.
  const salvarPosicao = (valor: number, documento = documentoAtual) => {
    setRetomarDe(valor);
    if (documento) setHistorico((atual) => marcarPosicao(atual, documento, valor));
  };

  const iniciar = () => {
    setErro('');
    setPosicao(null);
    ultimaPosicao.current = retomarDe;

    // Texto digitado ou colado só entra no histórico quando é de fato narrado.
    let documento = documentoAtual;
    if (!documento) {
      const atualizado = registrar(historico, { titulo: tituloDoTexto(texto), texto, origem: 'texto' });
      setHistorico(atualizado);
      documento = atualizado[0]?.texto === texto ? atualizado[0].id : null;
      setDocumentoAtual(documento);
    }

    motor.current?.falar(
      texto,
      {
        voz: vozSelecionada,
        velocidade: preferencias.velocidade,
        tom: preferencias.tom,
        volume: preferencias.volume,
        inicio: retomarDe,
      },
      {
        aoIniciar: () => {
          setNarrando(true);
          setPausado(false);
        },
        aoProgredir: (indice, tamanho) => {
          ultimaPosicao.current = indice;
          setPosicao({ inicio: indice, fim: indice + tamanho });
        },
        aoTerminar: () => {
          setNarrando(false);
          setPausado(false);
          setPosicao(null);
          ultimaPosicao.current = 0;
          salvarPosicao(0, documento);
        },
        aoErro: (mensagem) => {
          setErro(mensagem);
          setNarrando(false);
          setPausado(false);
          setPosicao(null);
        },
      },
    );
  };

  const alternarPausa = () => {
    if (pausado) {
      motor.current?.retomar();
      setPausado(false);
    } else {
      motor.current?.pausar();
      setPausado(true);
      salvarPosicao(ultimaPosicao.current);
    }
  };

  const parar = () => {
    const parou = narrando;
    motor.current?.parar();
    setNarrando(false);
    setPausado(false);
    setPosicao(null);
    if (parou) salvarPosicao(ultimaPosicao.current);
  };

  const limpar = () => {
    parar();
    setTexto('');
    setErro('');
    setDocumentoAtual(null);
    setRetomarDe(0);
  };

  // Substitui o texto em edição sem apagar o que já estava no histórico.
  const abrir = (conteudo: string, documento: string | null, posicaoInicial: number) => {
    motor.current?.parar();
    setNarrando(false);
    setPausado(false);
    setPosicao(null);
    setTexto(conteudo);
    setDocumentoAtual(documento);
    setRetomarDe(posicaoInicial);
    ultimaPosicao.current = posicaoInicial;
    setErro('');
  };

  const carregarArquivo = async (evento: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!arquivo) return;

    try {
      let conteudo: string;
      let titulo: string;
      let origem: 'texto' | 'pdf';

      if (ehPdf(arquivo)) {
        setExtraindo({ pagina: 0, total: 0 });
        const extraido = await extrairTextoDePdf(arquivo, {
          aoProgredir: (pagina, total) => setExtraindo({ pagina, total }),
        });
        if (!extraido.texto.trim()) {
          setErro(
            'Este PDF não tem texto selecionável — provavelmente é um documento digitalizado. Seria preciso passá-lo por um programa de OCR antes de narrar.',
          );
          return;
        }
        conteudo = extraido.texto;
        titulo = extraido.titulo;
        origem = 'pdf';
      } else {
        conteudo = await arquivo.text();
        titulo = arquivo.name.replace(/\.[^.]+$/, '');
        origem = 'texto';
      }

      const atualizado = registrar(historico, { titulo, texto: conteudo, origem });
      setHistorico(atualizado);
      abrir(conteudo, atualizado[0]?.texto === conteudo ? atualizado[0].id : null, 0);
    } catch {
      setErro('Não foi possível ler o arquivo selecionado.');
    } finally {
      setExtraindo(null);
    }
  };

  const restaurarAjustes = () => {
    setPreferencias((atual) => ({
      ...atual,
      velocidade: OPCOES_PADRAO.velocidade,
      tom: OPCOES_PADRAO.tom,
      volume: OPCOES_PADRAO.volume,
    }));
  };

  const controle = (
    rotulo: string,
    icone: React.ReactNode,
    campo: 'velocidade' | 'tom' | 'volume',
    min: number,
    max: number,
    passo: number,
    formatar: (valor: number) => string,
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="text-primary opacity-60">{icone}</span>
          {rotulo}
        </label>
        <span className="text-[11px] font-black text-primary tabular-nums">{formatar(preferencias[campo])}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={passo}
        value={preferencias[campo]}
        onChange={(e) => atualizarPreferencia(campo, Number(e.target.value))}
        className="w-full accent-primary cursor-pointer"
      />
    </div>
  );

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white dark:bg-[#1a211e] rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-white/5">
        <div className="bg-primary p-10 text-center text-white relative">
          <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none"></div>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-3xl mb-6 backdrop-blur-md">
            <AudioLines size={40} />
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase transform -skew-x-6">Narrador</h2>
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-2">Texto e PDF em Voz Alta</p>
        </div>

        <div className="p-10 space-y-8">
          {/* Texto: editável quando parado, com destaque da palavra durante a narração */}
          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Texto para narrar
              </label>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] tabular-nums">
                {palavras} {palavras === 1 ? 'palavra' : 'palavras'} • ~{formatarDuracao(duracao)}
              </span>
            </div>

            {narrando ? (
              <div className="w-full min-h-[220px] max-h-[420px] overflow-y-auto px-4 py-4 rounded-2xl border-2 border-primary dark:bg-background-dark/50 font-medium leading-relaxed whitespace-pre-wrap">
                {posicao ? (
                  <>
                    <span className="text-gray-400 dark:text-gray-500">{texto.slice(0, posicao.inicio)}</span>
                    <mark className="bg-primary/20 text-primary dark:text-white rounded px-0.5 font-black">
                      {texto.slice(posicao.inicio, posicao.fim)}
                    </mark>
                    <span>{texto.slice(posicao.fim)}</span>
                  </>
                ) : (
                  texto
                )}
              </div>
            ) : (
              <textarea
                value={texto}
                onChange={(e) => {
                  setTexto(e.target.value);
                  // Texto editado deixa de ser o documento do histórico.
                  setDocumentoAtual(null);
                  setRetomarDe(0);
                }}
                rows={9}
                className="w-full px-4 py-4 rounded-2xl border-2 border-gray-100 dark:border-white/10 dark:bg-background-dark/50 focus:border-primary focus:ring-0 outline-none transition font-medium leading-relaxed resize-y"
                placeholder="Cole aqui o texto, digite ou carregue um PDF ou arquivo .txt..."
              />
            )}

            {narrando && (
              <div className="h-1.5 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-200"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            )}
          </div>

          {/* Retomada: só aparece quando há leitura interrompida no meio do texto */}
          {!narrando && retomarDe > 0 && retomarDe < texto.length && (
            <div className="flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-primary/5 border-2 border-primary/20">
              <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                Leitura parou em {Math.round((retomarDe / texto.length) * 100)}% do texto.
              </span>
              <button
                type="button"
                onClick={() => salvarPosicao(0)}
                className="shrink-0 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary-dark transition-colors"
              >
                Começar do início
              </button>
            </div>
          )}

          {/* Ações do texto */}
          {/* Empilha em duas linhas quando a tela é estreita demais para os três */}
          <div className="flex flex-wrap gap-3 [&>button]:flex-1 [&>button]:min-w-[7.5rem]">
            <input
              ref={arquivoRef}
              type="file"
              accept={EXTENSOES_ACEITAS}
              onChange={carregarArquivo}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => arquivoRef.current?.click()}
              disabled={!!extraindo || narrando}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary transition-all font-black uppercase tracking-[0.2em] text-[10px] disabled:opacity-40"
            >
              <Upload size={16} /> {extraindo ? 'Lendo PDF' : 'Arquivo'}
            </button>
            <button
              type="button"
              onClick={() => setMostrarHistorico((atual) => !atual)}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all font-black uppercase tracking-[0.2em] text-[10px] ${
                mostrarHistorico
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary'
              }`}
            >
              <History size={16} /> Histórico
              {historico.length > 0 && (
                <span className="tabular-nums opacity-60">{historico.length}</span>
              )}
            </button>
            <button
              type="button"
              onClick={limpar}
              disabled={!texto}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-accent hover:text-accent transition-all font-black uppercase tracking-[0.2em] text-[10px] disabled:opacity-40 disabled:hover:border-gray-100 disabled:hover:text-gray-600"
            >
              <Trash2 size={16} /> Limpar
            </button>
          </div>

          {extraindo && (
            <div className="space-y-2 px-5 py-4 rounded-2xl bg-gray-50 dark:bg-background-dark/40 border border-gray-100 dark:border-white/5">
              <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">
                {extraindo.total > 0
                  ? `Extraindo texto — página ${extraindo.pagina} de ${extraindo.total}`
                  : 'Abrindo o PDF…'}
              </span>
              <div className="h-1.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-200"
                  style={{
                    width: extraindo.total > 0 ? `${(extraindo.pagina / extraindo.total) * 100}%` : '10%',
                  }}
                />
              </div>
            </div>
          )}

          {mostrarHistorico && (
            <div className="rounded-3xl bg-gray-50 dark:bg-background-dark/40 border border-gray-100 dark:border-white/5 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">
                  Textos e PDFs abertos
                </span>
                {historico.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setHistorico(limparHistorico());
                      setDocumentoAtual(null);
                    }}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-accent transition-colors"
                  >
                    Apagar tudo
                  </button>
                )}
              </div>

              {historico.length === 0 ? (
                <p className="px-6 pb-6 text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                  Ainda não há nada aqui. Os textos narrados e os PDFs carregados ficam guardados
                  neste aparelho para você retomar depois de onde parou.
                </p>
              ) : (
                <ul className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5">
                  {historico.map((item) => (
                    <li key={item.id} className="flex items-center gap-2 px-6 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          abrir(item.texto, item.id, item.posicao);
                          setMostrarHistorico(false);
                        }}
                        disabled={narrando}
                        className="flex-1 min-w-0 text-left group disabled:opacity-40"
                      >
                        <span className="flex items-center gap-2">
                          {item.origem === 'pdf' ? (
                            <FileType2 size={13} className="shrink-0 text-primary" />
                          ) : (
                            <FileText size={13} className="shrink-0 text-gray-400" />
                          )}
                          <span className="truncate text-xs font-bold group-hover:text-primary transition-colors">
                            {item.titulo}
                          </span>
                        </span>
                        <span className="block mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 tabular-nums">
                          {formatarData(item.criadoEm)} • {contarPalavras(item.texto)} palavras
                          {item.posicao > 0 &&
                            ` • parou em ${Math.round((item.posicao / item.texto.length) * 100)}%`}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHistorico(remover(historico, item.id));
                          if (documentoAtual === item.id) setDocumentoAtual(null);
                        }}
                        aria-label={`Remover ${item.titulo}`}
                        className="shrink-0 p-2 rounded-xl text-gray-400 hover:text-accent hover:bg-accent/5 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Seleção de voz */}
          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Voz</label>
              <button
                type="button"
                onClick={() => atualizarPreferencia('apenasPortugues', !preferencias.apenasPortugues)}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary-dark transition-colors"
              >
                {preferencias.apenasPortugues ? 'Ver todos os idiomas' : 'Somente português'}
              </button>
            </div>

            {/* Escolha rápida: a voz mais natural de cada gênero em português */}
            <div className="grid grid-cols-2 gap-3">
              {(['feminina', 'masculina'] as const).map((genero) => {
                const sugestao = sugestoes[genero];
                const ativa = !!sugestao && sugestao.voiceURI === vozSelecionada?.voiceURI;

                return (
                  <button
                    key={genero}
                    type="button"
                    onClick={() => sugestao && atualizarPreferencia('vozURI', sugestao.voiceURI)}
                    disabled={!sugestao || narrando}
                    className={`p-4 rounded-2xl border-2 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      ativa
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-100 dark:border-white/10 hover:border-primary'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                      {genero === 'feminina' ? 'Feminina' : 'Masculina'}
                      {sugestao && qualidadeDaVoz(sugestao) === 'natural' && (
                        <Sparkles size={11} className="text-primary" />
                      )}
                    </span>
                    <span className="block mt-1 text-xs font-bold truncate">
                      {sugestao ? sugestao.name : 'Não instalada'}
                    </span>
                  </button>
                );
              })}
            </div>

            <select
              value={vozSelecionada?.voiceURI || ''}
              onChange={(e) => atualizarPreferencia('vozURI', e.target.value)}
              disabled={narrando || vozesVisiveis.length === 0}
              className="w-full px-4 py-4 rounded-2xl border-2 border-gray-100 dark:border-white/10 dark:bg-background-dark/50 focus:border-primary focus:ring-0 outline-none transition font-bold disabled:opacity-60"
            >
              {vozesVisiveis.length === 0 ? (
                <option value="">Nenhuma voz encontrada neste dispositivo</option>
              ) : (
                vozesVisiveis.map((voz) => (
                  <option key={voz.voiceURI} value={voz.voiceURI}>
                    {voz.name} ({voz.lang}) — {DESCRICAO_GENERO[generoDaVoz(voz)]} ·{' '}
                    {DESCRICAO_QUALIDADE[qualidadeDaVoz(voz)]}
                  </option>
                ))
              )}
            </select>

            {faltando.length > 0 && (
              <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 font-medium px-1">
                Este aparelho não tem voz{faltando.length === 1 ? '' : 'es'}{' '}
                <strong>{faltando.map((g) => DESCRICAO_GENERO[g]).join(' nem ')}</strong> em português.
                Instale mais vozes nas configurações do sistema — o guia explica o caminho em cada
                plataforma.
              </p>
            )}
          </div>

          {/* Ajustes de fala */}
          <div className="space-y-6 p-6 rounded-3xl bg-gray-50 dark:bg-background-dark/40 border border-gray-100 dark:border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">
                Ajustes de fala
              </span>
              <button
                type="button"
                onClick={restaurarAjustes}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-primary transition-colors"
              >
                <RotateCcw size={12} /> Padrão
              </button>
            </div>

            {controle('Velocidade', <Gauge size={14} />, 'velocidade', 0.5, 2, 0.1, (v) => `${v.toFixed(1)}x`)}
            {controle('Tom', <Music2 size={14} />, 'tom', 0.5, 2, 0.1, (v) => v.toFixed(1))}
            {controle('Volume', <Volume2 size={14} />, 'volume', 0, 1, 0.05, (v) => `${Math.round(v * 100)}%`)}
          </div>

          {erro && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-tight rounded-2xl flex items-center gap-3">
              <AlertTriangle size={18} className="shrink-0" />
              {erro}
            </div>
          )}

          {/* Controles de reprodução */}
          {narrando ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={alternarPausa}
                className="flex-1 bg-primary hover:bg-primary-dark text-white font-black py-5 rounded-2xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-xs"
              >
                {pausado ? <Play size={20} /> : <Pause size={20} />}
                {pausado ? 'Retomar' : 'Pausar'}
              </button>
              <button
                type="button"
                onClick={parar}
                className="flex-1 bg-accent hover:brightness-95 text-white font-black py-5 rounded-2xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-xs"
              >
                <Square size={18} /> Parar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={iniciar}
              disabled={!suportado || !texto.trim() || (vozesCarregadas && vozes.length === 0)}
              className="w-full bg-primary hover:bg-primary-dark text-white font-black py-5 rounded-2xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play size={20} />
              {retomarDe > 0 && retomarDe < texto.length ? 'Retomar leitura' : 'Narrar texto'}
            </button>
          )}

          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-[0.15em] text-center flex items-center justify-center gap-2">
            <FileText size={12} />
            As vozes vêm do próprio dispositivo — funciona offline
          </p>
        </div>
      </div>
    </div>
  );
};

export default Narrador;
