
import React, { useState } from 'react';
import { validatePresence, getBrasiliaDate, formatFullDate, formatTime, getDayName } from '../utils';
import { PresenceRecord, ATHLETES_LIST } from '../types';

interface AttendanceFormProps {
  onRecordAdded: (record: PresenceRecord) => void;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({ onRecordAdded }) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const ADMIN_BYPASS_CODE = 'romos2228';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputName = name.trim();
    
    if (!inputName) {
      setStatus('error');
      setMessage('Por favor, informe seu nome.');
      return;
    }

    const isAdminBypass = inputName.toLowerCase().endsWith(ADMIN_BYPASS_CODE.toLowerCase());
    
    if (isAdminBypass) {
      const typedNamePart = inputName.slice(0, inputName.length - ADMIN_BYPASS_CODE.length).trim();
      
      // Tenta encontrar o nome oficial na lista se o admin digitar apenas parte dele
      const officialName = ATHLETES_LIST.find(n => 
        n.toLowerCase().includes(typedNamePart.toLowerCase())
      ) || typedNamePart;

      if (!typedNamePart) {
        setStatus('error');
        setMessage('Por favor, informe um nome antes da senha.');
        return;
      }

      setStatus('loading');
      setMessage('Processando registro de administrador...');

      setTimeout(() => {
        const now = getBrasiliaDate();
        const record: PresenceRecord = {
          id: crypto.randomUUID(),
          name: officialName,
          timestamp: Date.now(),
          latitude: -15.8336,
          longitude: -47.9375,
          distanceFromCenter: 0,
          isSunday: now.getDay() === 0,
          status: 'valid',
          dateString: formatFullDate(now),
          timeString: formatTime(now),
          dayOfWeek: getDayName(now.getDay()),
          monthKey: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        };

        onRecordAdded(record);
        setStatus('success');
        setMessage(`[ADMIN] Registro forçado para ${officialName}!`);
        setName('');
      }, 800);
      return;
    }

    // Fluxo Normal
    setStatus('loading');
    setMessage('Validando localização...');

    if (!navigator.geolocation) {
      setStatus('error');
      setMessage('Geolocalização não suportada.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const validation = validatePresence(latitude, longitude);

        if (!validation.allowed) {
          setStatus('error');
          setMessage(validation.reason || 'Registro não permitido.');
          return;
        }

        const now = getBrasiliaDate();
        const record: PresenceRecord = {
          id: crypto.randomUUID(),
          name: inputName,
          timestamp: Date.now(),
          latitude,
          longitude,
          distanceFromCenter: validation.details?.distance || 0,
          isSunday: validation.details?.isSunday || false,
          status: 'valid',
          dateString: formatFullDate(now),
          timeString: formatTime(now),
          dayOfWeek: getDayName(now.getDay()),
          monthKey: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        };

        onRecordAdded(record);
        setStatus('success');
        setMessage(`Presença confirmada às ${record.timeString}!`);
        setName('');
      },
      (error) => {
        let msg = 'Erro de localização.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Ative o GPS para registrar sua presença.';
        }
        setStatus('error');
        setMessage(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-700">
      <header className="flex flex-col items-center mb-10">
        <span className="text-[10px] font-black tracking-[0.4em] text-gray-500 dark:text-gray-400 uppercase mb-2">Equipe</span>
        <div className="flex flex-col items-center">
          <div className="relative flex items-center justify-center -space-x-1">
            <span className="text-4xl md:text-5xl font-black italic tracking-tighter text-primary z-10 transform -skew-x-6">CROSS</span>
            <div className="relative ml-2">
              <div className="absolute inset-0 bg-gray-900 dark:bg-white transform -skew-x-12 rounded-sm shadow-lg"></div>
              <span className="relative block text-4xl md:text-5xl font-black italic tracking-tighter text-white dark:text-background-dark px-3 py-1 transform -skew-x-6">COUNTRY</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 w-full justify-center">
            <div className="h-[2px] w-8 bg-primary/40 rounded-full"></div>
            <span className="text-xs font-black tracking-widest text-gray-500 dark:text-gray-400">CBMDF</span>
            <div className="h-[2px] w-8 bg-primary/40 rounded-full"></div>
          </div>
        </div>
      </header>

      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tight">Registre sua<br/>presença</h1>
      </div>

      <form onSubmit={handleRegister} className="w-full space-y-6">
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary/50 rounded-2xl opacity-10 group-focus-within:opacity-100 transition duration-500 blur"></div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary">
              <span className="material-symbols-outlined text-[20px]">person_search</span>
            </div>
            <input
              list="athletes-list"
              type="text"
              className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-[#1a211e] border-2 border-primary/20 dark:border-primary/30 text-gray-900 dark:text-white placeholder-gray-400 rounded-2xl focus:outline-none focus:border-primary focus:ring-0 transition-all font-bold shadow-sm"
              placeholder="Digite seu nome para buscar..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={status === 'loading' || status === 'success'}
              autoComplete="off"
            />
            <datalist id="athletes-list">
              {ATHLETES_LIST.map(athlete => (
                <option key={athlete} value={athlete} />
              ))}
            </datalist>
          </div>
        </div>

        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className={`group relative w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl text-sm font-black text-white transition-all duration-200 uppercase tracking-widest shadow-xl active:scale-[0.98] ${
            status === 'success' 
            ? 'bg-primary cursor-default' 
            : 'bg-accent hover:bg-[#d95228] shadow-[0_8px_20px_-6px_rgba(240,99,53,0.5)]'
          }`}
        >
          <span className="absolute left-0 inset-y-0 flex items-center pl-4 opacity-70">
            <span className="material-symbols-outlined">
              {status === 'loading' ? 'sync' : status === 'success' ? 'check_circle' : 'bolt'}
            </span>
          </span>
          {status === 'loading' ? 'Validando...' : status === 'success' ? 'Confirmado!' : 'Confirmar Presença'}
        </button>

        {status !== 'idle' && (
          <div className={`flex items-start gap-3 p-4 rounded-xl border-2 animate-in zoom-in-95 duration-200 ${
            status === 'success' ? 'bg-green-50/50 border-green-200 text-green-700' : 
            status === 'error' ? 'bg-red-50/50 border-red-200 text-red-700' : 
            'bg-primary/5 border-primary/20 text-primary'
          }`}>
             <span className="material-symbols-outlined text-[20px] mt-0.5">
              {status === 'success' ? 'check_circle' : status === 'error' ? 'warning' : 'info'}
            </span>
            <p className="text-xs font-black uppercase tracking-tight">{message}</p>
          </div>
        )}
      </form>

      <div className="mt-12">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 shadow-sm backdrop-blur-sm">
            <span className="material-symbols-outlined text-primary mb-1 text-[20px]">location_on</span>
            <span className="text-[8px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 font-black text-center mb-1">Local</span>
            <span className="text-[10px] font-black text-gray-800 dark:text-gray-200 text-center leading-tight">CECAF (Sem Dom)</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 shadow-sm backdrop-blur-sm">
            <span className="material-symbols-outlined text-primary mb-1 text-[20px]">schedule</span>
            <span className="text-[8px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 font-black text-center mb-1">Horário</span>
            <span className="text-[10px] font-black text-gray-800 dark:text-gray-200 text-center leading-tight">06h às 12h</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 shadow-sm backdrop-blur-sm">
            <span className="material-symbols-outlined text-primary mb-1 text-[20px]">calendar_month</span>
            <span className="text-[8px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 font-black text-center mb-1">Dias</span>
            <span className="text-[10px] font-black text-gray-800 dark:text-gray-200 text-center leading-tight">Ter, Qui, Dom</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceForm;
