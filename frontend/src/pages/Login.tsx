import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { PageShell } from '../components/layout/PageShell';

type TabType = 'login' | 'register';

export function Login() {
  const [activeTab, setActiveTab] = useState<TabType>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar se há uma mensagem de retorno
  const from = (location.state as { from?: string })?.from || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await api.login({
        email: loginEmail,
        password: loginPassword,
      });

      login(result.token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar senhas
    if (registerPassword !== registerConfirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (registerPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const result = await api.register({
        name: registerName,
        email: registerEmail,
        password: registerPassword,
      });

      login(result.token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageShell>
      {/* Content */}
      <div className="flex items-center justify-center">
        <div className="w-full max-w-md">

          {/* Card */}
          <div className="bg-card-bg border border-card-border rounded-xl p-6 shadow-sm">
            {/* Tabs */}
            <div className="flex border-b border-card-border mb-6">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(null); }}
                className={`flex-1 pb-3 text-label-bold font-semibold transition-colors ${
                  activeTab === 'login'
                    ? 'text-brand border-b-2 border-brand'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setError(null); }}
                className={`flex-1 pb-3 text-label-bold font-semibold transition-colors ${
                  activeTab === 'register'
                    ? 'text-brand border-b-2 border-brand'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Criar Conta
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-label-sm text-text-secondary mb-1.5">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-card-border text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-label-sm text-text-secondary mb-1.5">
                    Senha
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-card-border text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                    placeholder="Sua senha"
                  />
                </div>

                <Button type="submit" fullWidth disabled={isLoading}>
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label htmlFor="register-name" className="block text-label-sm text-text-secondary mb-1.5">
                    Nome
                  </label>
                  <input
                    id="register-name"
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-card-border text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                    placeholder="Seu nome"
                  />
                </div>

                <div>
                  <label htmlFor="register-email" className="block text-label-sm text-text-secondary mb-1.5">
                    Email
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-card-border text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="register-password" className="block text-label-sm text-text-secondary mb-1.5">
                    Senha
                  </label>
                  <input
                    id="register-password"
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-card-border text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label htmlFor="register-confirm-password" className="block text-label-sm text-text-secondary mb-1.5">
                    Confirmar Senha
                  </label>
                  <input
                    id="register-confirm-password"
                    type="password"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-card-border text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                    placeholder="Repita a senha"
                  />
                </div>

                <Button type="submit" fullWidth disabled={isLoading}>
                  {isLoading ? 'Criando conta...' : 'Criar Conta'}
                </Button>
              </form>
            )}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-card-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card-bg text-text-secondary">ou</span>
              </div>
            </div>

            {/* Google Login Placeholder */}
            <Button variant="secondary" fullWidth disabled>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Entrar com Google
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
