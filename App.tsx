
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { ShieldCheck, UserCheck, LogOut, Menu, X } from 'lucide-react';
import AttendanceForm from './components/AttendanceForm';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import { PresenceRecord } from './types';

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('is_admin') === 'true';
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [records, setRecords] = useState<PresenceRecord[]>(() => {
    const saved = localStorage.getItem('presence_records');
    if (saved) return JSON.parse(saved);
    return [];
  });

  useEffect(() => {
    localStorage.setItem('presence_records', JSON.stringify(records));
  }, [records]);

  const addRecord = (record: PresenceRecord) => {
    setRecords(prev => [record, ...prev]);
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('is_admin');
  };

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col selection:bg-primary/30">
        {/* Navegação Superior Estilizada */}
        <header className="bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200/60 dark:border-white/10 sticky top-0 z-50 no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link to="/" className="flex items-center gap-2 text-primary font-black italic tracking-tighter text-2xl transform -skew-x-6 hover:scale-105 transition-transform">
                <span className="bg-primary text-white px-2 py-0.5 rounded-sm">RUN</span>
                <span className="text-gray-900 dark:text-white">FLOW</span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-8">
                <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                  <UserCheck size={18} /> Atleta
                </Link>
                {isAdmin ? (
                  <>
                    <Link to="/admin" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                      <ShieldCheck size={18} /> Painel Adm
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="bg-primary text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-primary-dark transition-all font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20"
                    >
                      <LogOut size={14} /> Sair
                    </button>
                  </>
                ) : (
                  <Link to="/login" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                    <ShieldCheck size={18} /> Admin
                  </Link>
                )}
              </nav>

              <button 
                className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Menu Mobile */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white dark:bg-background-dark border-t border-gray-100 dark:border-white/10 p-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
              <nav className="flex flex-col gap-2">
                <Link 
                  to="/" 
                  className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-bold py-4 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors uppercase tracking-widest text-xs"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <UserCheck size={20} className="text-primary" /> Registrar Presença
                </Link>
                {isAdmin ? (
                  <>
                    <Link 
                      to="/admin" 
                      className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-bold py-4 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors uppercase tracking-widest text-xs"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <ShieldCheck size={20} className="text-primary" /> Dashboard Admin
                    </Link>
                    <button 
                      onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                      className="w-full text-left flex items-center gap-3 text-accent font-bold py-4 px-4 rounded-xl hover:bg-accent/5 transition-colors uppercase tracking-widest text-xs"
                    >
                      <LogOut size={20} /> Encerrar Sessão
                    </button>
                  </>
                ) : (
                  <Link 
                    to="/login" 
                    className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-bold py-4 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors uppercase tracking-widest text-xs"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <ShieldCheck size={20} className="text-primary" /> Acesso Restrito
                  </Link>
                )}
              </nav>
            </div>
          )}
        </header>

        {/* Conteúdo Central */}
        <main className="flex-grow max-w-lg mx-auto w-full px-6 py-12 relative z-10">
          <Routes>
            <Route path="/" element={<AttendanceForm onRecordAdded={addRecord} />} />
            <Route path="/login" element={<Login setIsAdmin={setIsAdmin} />} />
            <Route path="/admin" element={isAdmin ? <AdminDashboard records={records} /> : <Login setIsAdmin={setIsAdmin} />} />
          </Routes>
        </main>

        {/* Rodapé Institucional */}
        <footer className="py-16 border-t border-gray-200/60 dark:border-white/10 no-print mt-auto bg-white/40 dark:bg-black/20 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="text-center space-y-1 mb-10">
              <h3 className="text-[13px] text-gray-900 dark:text-white font-black uppercase tracking-[0.3em] leading-tight">
                Corpo de Bombeiros Militar
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-[0.2em]">
                do Distrito Federal
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="h-[2px] w-12 bg-primary/20 rounded-full"></div>
              <p className="text-[9px] text-gray-400 dark:text-gray-600 font-mono tracking-[0.4em] uppercase font-black">
                &copy; 2026 • EQUIPE CROSS COUNTRY • V2.9.2
              </p>
            </div>
          </div>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
