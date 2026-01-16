import { PresenceRecord } from '../types';

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

export interface TabelaFrequencia {
  data: string;
  diaSemana: string;
  atleta: string;
  presenca: boolean | string;
  total: number;
}

// Enviar dados de frequência para Google Sheets
export async function enviarFrequencia(records: PresenceRecord[]): Promise<void> {
  if (!APPS_SCRIPT_URL) {
    throw new Error('VITE_APPS_SCRIPT_URL não configurada');
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'presenca',
        records: records,
      }),
    });

    console.log('Frequência enviada para Google Sheets');
  } catch (error) {
    console.error('Erro ao enviar frequência:', error);
    throw error;
  }
}

// Obter tabela de frequência do Google Sheets
export async function obterTabelaFrequencia(): Promise<TabelaFrequencia[]> {
  if (!APPS_SCRIPT_URL) {
    throw new Error('VITE_APPS_SCRIPT_URL não configurada');
  }

  try {
    const response = await fetch(
      `${APPS_SCRIPT_URL}?action=obterTabelaFrequencia`,
      {
        method: 'GET',
      }
    );

    const data = await response.json();
    return data.tabela || [];
  } catch (error) {
    console.error('Erro ao obter tabela de frequência:', error);
    return [];
  }
}

// Sincronizar registros com Google Sheets
export async function sincronizarComSheets(records: PresenceRecord[]): Promise<void> {
  try {
    await enviarFrequencia(records);
    console.log('Sincronização concluída com sucesso');
  } catch (error) {
    console.error('Erro na sincronização:', error);
    throw error;
  }
}
