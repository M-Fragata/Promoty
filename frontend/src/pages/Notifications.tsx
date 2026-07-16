import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellOff, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MobileNav } from '../components/layout/MobileNav';
import { Header } from '../components/layout/Header';

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/notificacoes' } });
      return;
    }

    // Simular carregamento de notificações
    // Por enquanto, sempre retorna vazio
    setIsLoading(true);
    const timer = setTimeout(() => {
      setNotifications([]);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="md:mt-5 pt-16 lg:pt-16 pb-24 lg:pb-8">
        <div className="mx-auto max-w-3xl px-4 md:px-6">

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && notifications.length === 0 && (
            <div className="bg-card-bg border border-card-border rounded-xl p-8 text-center mt-5">
              <BellOff className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <h2 className="text-headline-sm text-text-primary font-headline-sm mb-2">
                Nenhuma notificação
              </h2>
              <p className="text-body-md text-text-secondary mb-4">
                Você não possui nenhuma notificação no momento.
              </p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="cursor-pointer text-brand hover:underline font-semibold"
              >
                Ver ofertas
              </button>
            </div>
          )}

          {/* Notifications List */}
          {!isLoading && notifications.length > 0 && (
            <div className="flex flex-col gap-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-card-bg border border-card-border rounded-xl p-4 ${
                    !notification.read ? 'border-l-4 border-l-brand' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Bell className="w-5 h-5 text-text-secondary mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-text-primary mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-body-md text-text-secondary">
                        {notification.message}
                      </p>
                      <time className="text-xs text-text-secondary mt-2 block">
                        {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                      </time>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
