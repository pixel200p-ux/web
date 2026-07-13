import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Button, Input } from '../components/ui';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fn = mode === 'signin' ? signIn : signUp;
    const { error } = await fn(email, password);
    if (error) setError(error);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Portfolio Manager</h1>
          <p className="mt-1 text-sm text-slate-400">Quản lý danh mục &amp; chiến lược T+</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-2xl dark:bg-slate-800">
          <div className="mb-6 flex gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-700">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                mode === 'signin' ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-600 dark:text-white' : 'text-slate-500'
              }`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                mode === 'signup' ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-600 dark:text-white' : 'text-slate-500'
              }`}
            >
              Đăng ký
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <Input label="Mật khẩu" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
            {error && <p className="text-sm text-rose-500">{error}</p>}
            <Button type="submit" className="w-full" size="lg">
              {loading ? 'Đang xử lý...' : mode === 'signin' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-400">
            Bản thử nghiệm — Dữ liệu tĩnh (chưa Realtime)
          </p>
        </div>
      </div>
    </div>
  );
}
