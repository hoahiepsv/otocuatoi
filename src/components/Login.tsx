import React, { useState } from 'react';
import { User, Lock, Car, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginProps {
  onLogin: (username: string) => void;
  onQuickView: (plate: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onQuickView }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [quickPlate, setQuickPlate] = useState('');
  const [showQuickInput, setShowQuickInput] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay
    setTimeout(() => {
      if (username === 'lehoahiep' && password === 'Lhh249111') {
        onLogin(username);
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác');
      }
      setIsLoading(false);
    }, 800);
  };

  const handleQuickView = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickPlate.trim()) {
      onQuickView(quickPlate.toUpperCase().trim());
    }
  };

  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-600 p-4 rounded-2xl text-white mb-4 shadow-lg shadow-blue-200">
              <Car size={40} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-wide">BẢO TRÌ Ô TÔ</h1>
            <p className="text-slate-500 text-sm mt-1">Đăng nhập để quản lý hệ thống</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Tên đăng nhập</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                  placeholder="Nhập username..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                  placeholder="Nhập mật khẩu..."
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100"
                >
                  <ShieldAlert size={16} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center disabled:opacity-70"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'ĐĂNG NHẬP'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            {!showQuickInput ? (
              <button 
                onClick={() => setShowQuickInput(true)}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-3 rounded-xl transition-all border border-slate-200 flex items-center justify-center gap-2 text-sm"
              >
                <Car size={18} className="text-blue-500" />
                XEM NHANH NHẮC NHỞ BẢO TRÌ
              </button>
            ) : (
              <motion.form 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleQuickView} 
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nhập biển số xe:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      autoFocus
                      value={quickPlate}
                      onChange={(e) => setQuickPlate(e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold uppercase"
                      placeholder=""
                    />
                    <button 
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-black text-xs transition-all shadow-md active:scale-95"
                    >
                      XEM
                    </button>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowQuickInput(false)}
                  className="w-full text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                >
                  Quay lại đăng nhập
                </button>
              </motion.form>
            )}
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
            Create by Hoà Hiệp AI – 0983.676.470
          </p>
        </div>
      </motion.div>
    </div>
  );
};
