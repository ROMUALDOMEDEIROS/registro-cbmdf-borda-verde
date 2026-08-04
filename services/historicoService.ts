// Histórico dos textos e PDFs já abertos, guardado só no navegador.
// Serve para retomar um documento longo de onde a leitura parou.

export interface ItemHistorico {
  id: string;
  titulo: string;
  texto: string;
  origem: 'texto' | 'pdf';
  criadoEm: number;
  posicao: number; // caractere onde a última narração parou
}

const CHAVE = 'narrador_historico';

// O localStorage costuma ter 5 MB por origem. Estes tetos deixam margem para
// as preferências e para o texto em edição, que moram na mesma cota.
const MAXIMO_ITENS = 20;
const MAXIMO_CARACTERES = 400_000;

export function lerHistorico(): ItemHistorico[] {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return [];
    const lista = JSON.parse(bruto);
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function gravar(itens: ItemHistorico[]): ItemHistorico[] {
  let lista = itens.slice(0, MAXIMO_ITENS);

  // Se a cota estourar, vai descartando os mais antigos até caber.
  while (lista.length > 0) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(lista));
      return lista;
    } catch {
      lista = lista.slice(0, -1);
    }
  }

  localStorage.removeItem(CHAVE);
  return [];
}

export function registrar(
  itens: ItemHistorico[],
  entrada: { titulo: string; texto: string; origem: 'texto' | 'pdf' },
): ItemHistorico[] {
  if (entrada.texto.length > MAXIMO_CARACTERES) return itens;

  const novo: ItemHistorico = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    titulo: entrada.titulo.trim() || 'Sem título',
    texto: entrada.texto,
    origem: entrada.origem,
    criadoEm: Date.now(),
    posicao: 0,
  };

  // Reabrir o mesmo documento atualiza a entrada em vez de duplicá-la.
  return gravar([novo, ...itens.filter((item) => item.texto !== entrada.texto)]);
}

export function marcarPosicao(
  itens: ItemHistorico[],
  id: string,
  posicao: number,
): ItemHistorico[] {
  return gravar(itens.map((item) => (item.id === id ? { ...item, posicao } : item)));
}

export function remover(itens: ItemHistorico[], id: string): ItemHistorico[] {
  return gravar(itens.filter((item) => item.id !== id));
}

export function limpar(): ItemHistorico[] {
  localStorage.removeItem(CHAVE);
  return [];
}

export function formatarData(momento: number): string {
  return new Date(momento).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
