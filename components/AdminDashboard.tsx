
import React, { useState, useMemo, useEffect } from 'react';
import { Download, Filter, Users } from 'lucide-react';
import { PresenceRecord, TRAINING_CONFIG, ATHLETES_LIST } from '../types';
import { getDayName } from '../utils';
import { sincronizarComSheets } from '../services/frequenciaService';

interface AdminDashboardProps {
  records: PresenceRecord[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ records }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    records.forEach(r => months.add(r.monthKey));
    const now = new Date();
    months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [records]);

  // Datas de treino do mês
  const trainingDatesInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const dates: Date[] = [];
    const date = new Date(year, month - 1, 1);
    
    while (date.getMonth() === month - 1) {
      if (TRAINING_CONFIG.ALLOWED_DAYS.includes(date.getDay())) {
        dates.push(new Date(date));
      }
      date.setDate(date.getDate() + 1);
    }
    return dates;
  }, [selectedMonth]);

  // CRITICAL: Mapeia todos os atletas da ATHLETES_LIST para a tabela
  const tableData = useMemo(() => {
    const filteredRecords = records.filter(r => r.monthKey === selectedMonth);
    
    // Gera o mapa de presenças para todos os atletas oficiais
    return ATHLETES_LIST.map(athleteName => {
      const athletePresences: { [dateStr: string]: boolean } = {};
      let totalCount = 0;
      
      trainingDatesInMonth.forEach(date => {
        const dateStr = date.toLocaleDateString('pt-BR');
        // Verifica se o atleta tem registro nessa data
        const hasRecord = filteredRecords.some(r => 
          r.name.toLowerCase() === athleteName.toLowerCase() && 
          r.dateString === dateStr
        );
        
        if (hasRecord) {
          athletePresences[dateStr] = true;
          totalCount++;
        }
      });

      return {
        name: athleteName,
        presences: athletePresences,
        total: totalCount
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [records, selectedMonth, trainingDatesInMonth]);

    // Sincronizar frequência com Google Sheets quando records mudam
  useEffect(() => {
    if (records && records.length > 0) {
      sincronizarComSheets(records).catch(err => console.error('Erro ao sincronizar:', err));
    }
  }, [records]);

  const handleExportExcel = () => {
    const header1 = ["Atleta/data", ...trainingDatesInMonth.map(d => d.toLocaleDateString('pt-BR')), "Total"];
    const header2 = ["Dia da semana", ...trainingDatesInMonth.map(d => getDayName(d.getDay()).split('-')[0].toLowerCase()), ""];

    const rows = tableData.map(data => {
      const row = [data.name];
      trainingDatesInMonth.forEach(d => {
        row.push(data.presences[d.toLocaleDateString('pt-BR')] ? 'x' : '');
      });
      row.push(data.total.toString());
      return row;
    });

    const wsData = [header2, header1, ...rows];
    const ws = (window as any).XLSX.utils.aoa_to_sheet(wsData);
    const wb = (window as any).XLSX.utils.book_new();
    (window as any).XLSX.utils.book_append_sheet(wb, ws, "Frequência Cross Country");
    (window as any).XLSX.writeFile(wb, `Frequencia_${selectedMonth}.xlsx`);
  };

  const getMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 no-print px-2">
        <h2 className="text-2xl font-black italic tracking-tighter text-gray-900 dark:text-white uppercase transform -skew-x-6">
          Gestão de Frequência
        </h2>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <select 
              className="appearance-none bg-white dark:bg-[#1a211e] border-2 border-gray-100 dark:border-white/10 rounded-xl px-4 py-2 pr-10 text-[10px] font-black uppercase tracking-widest focus:border-primary outline-none cursor-pointer transition"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {availableMonths.map(m => (
                <option key={m} value={m}>{getMonthLabel(m)}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-2.5 text-primary pointer-events-none" size={14} />
          </div>

          <button 
            onClick={handleExportExcel}
            className="bg-[#217346] hover:bg-[#1a5c38] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition shadow-lg shadow-green-900/10"
          >
            <Download size={14} /> Exportar Excel
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a211e] rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/5">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-white/10">
          <table className="w-full border-collapse text-[10px] font-medium min-w-max">
            <thead>
              <tr>
                <th colSpan={trainingDatesInMonth.length + 2} className="bg-[#C6EFCE] dark:bg-green-900/30 text-gray-800 dark:text-green-100 py-1 text-center border border-gray-300 dark:border-white/10 italic">
                  {getMonthLabel(selectedMonth).toLowerCase()}s
                </th>
              </tr>
              <tr className="bg-[#BDD7EE] dark:bg-blue-900/30 text-gray-800 dark:text-blue-100">
                <th className="border border-gray-300 dark:border-white/10 px-3 py-1.5 text-left font-normal">dia da semana</th>
                {trainingDatesInMonth.map((date, i) => (
                  <th key={i} className="border border-gray-300 dark:border-white/10 px-2 py-1.5 text-center font-normal">
                    {getDayName(date.getDay()).split('-')[0].toLowerCase()}
                  </th>
                ))}
                <th className="border border-gray-300 dark:border-white/10 px-2 py-1.5 text-center font-normal">frequencia</th>
              </tr>
              <tr className="bg-[#F8CBAD] dark:bg-orange-900/30 text-gray-800 dark:text-orange-100">
                <th className="border border-gray-300 dark:border-white/10 px-3 py-1.5 text-left font-normal">Atleta/data</th>
                {trainingDatesInMonth.map((date, i) => (
                  <th key={i} className="border border-gray-300 dark:border-white/10 px-2 py-1.5 text-center font-normal">
                    {date.toLocaleDateString('pt-BR')}
                  </th>
                ))}
                <th className="border border-gray-300 dark:border-white/10 px-2 py-1.5 text-center font-normal bg-[#BDD7EE] dark:bg-blue-900/40">total</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-transparent">
              {tableData.map((athlete) => (
                <tr key={athlete.name} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="border border-gray-300 dark:border-white/10 px-2 py-0.5 text-gray-900 dark:text-gray-100 font-bold whitespace-nowrap">
                    {athlete.name.toLowerCase()}
                  </td>
                  {trainingDatesInMonth.map((date, i) => {
                    const dStr = date.toLocaleDateString('pt-BR');
                    return (
                      <td key={i} className="border border-gray-300 dark:border-white/10 px-1 py-0.5 text-center font-black text-gray-800 dark:text-white">
                        {athlete.presences[dStr] ? 'x' : ''}
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 dark:border-white/10 px-2 py-0.5 text-center font-black bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white">
                    {athlete.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2 p-4 bg-primary/5 rounded-xl border border-primary/20 no-print">
        <Users className="text-primary" size={20} />
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">
          Exibindo lista oficial fixa: {ATHLETES_LIST.length} atletas cadastrados.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
