
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, LogIn, ShieldAlert } from 'lucide-react';

interface LoginProps {
  setIsAdmin: (isAdmin: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ setIsAdmin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'senha123') {
      setIsAdmin(true);
      localStorage.setItem('is_admin', 'true');
      navigate('/admin');
    } else {
      setError('Credenciais inválidas.');
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white dark:bg-[#1a211e] rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-white/5">
        <div className="bg-primary p-10 text-center text-white relative">
          <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none"></div>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-3xl mb-6 backdrop-blur-md">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase transform -skew-x-6">Admin Login</h2>
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-2">Área Restrita Equipe</p>
        </div>

        <form onSubmit={handleLogin} className="p-10 space-y-8">
          <div className="space-y-6">
            <div className="relative">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block ml-1">Usuário de Acesso</label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-primary opacity-50">
                  <User size={20} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 dark:border-white/10 dark:bg-background-dark/50 focus:border-primary focus:ring-0 outline-none transition font-bold"
                  placeholder="Seu usuário"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block ml-1">Senha de Segurança</label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-primary opacity-50">
                  <Lock size={20} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 dark:border-white/10 dark:bg-background-dark/50 focus:border-primary focus:ring-0 outline-none transition font-bold"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-tight rounded-2xl text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white font-black py-5 rounded-2xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-xs"
          >
            <LogIn size={20} />
            Acessar Painel
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
