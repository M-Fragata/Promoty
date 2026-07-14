import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Copy, Trash2, Check, ExternalLink, ShoppingCart, Package, Store } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api, type CreatedLink } from '../services/api';
import { MobileNav } from '../components/layout/MobileNav';
import { Header } from '../components/layout/Header';
import { clsx } from 'clsx';

const STORE_ICONS: Record<string, typeof ShoppingCart> = {
  mercadolivre: ShoppingCart,
  amazon: Package,
  shopee: Store,
};

const STORE_COLORS: Record<string, string> = {
  mercadolivre: 'text-yellow-500',
  amazon: 'text-orange-500',
  shopee: 'text-pink-500',
  other: 'text-text-secondary',
};

export function CreatedLinks() {
  const [links, setLinks] = useState<CreatedLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const loadLinks = useCallback(async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/links-criados' } });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await api.getLinks();
      setLinks(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar links');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  const handleCreateLink = async () => {
    if (!urlInput.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const newLink = await api.createLink(urlInput.trim());
      setLinks((prev) => [newLink, ...prev]);
      setUrlInput('');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar link');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteLink(id);
      setLinks((prev) => prev.filter((link) => link.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar link');
    }
  };

  const handleCopy = async (link: CreatedLink) => {
    const textToCopy = link.shortUrl || link.affiliateUrl;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError('Erro ao copiar link');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="mt-5 pt-16 lg:pt-16 pb-24 lg:pb-8">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          {/* Create Link Section */}
          <section className="mb-6">
            <div className="bg-card-bg rounded-xl shadow-sm border border-card-border p-4">
              <h2 className="text-label-bold text-text-secondary uppercase tracking-wider mb-3">
                Criar novo link
              </h2>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Cole a URL do produto aqui..."
                  className="flex-1 px-4 py-3 rounded-lg bg-surface-container-low border border-card-border text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateLink()}
                />
                <button
                  type="button"
                  onClick={handleCreateLink}
                  disabled={isCreating || !urlInput.trim()}
                  className={clsx(
                    'px-6 py-3 rounded-lg font-medium transition-all',
                    isCreating || !urlInput.trim()
                      ? 'bg-surface-container-high text-text-secondary cursor-not-allowed'
                      : 'bg-brand text-on-primary hover:bg-brand/90 active:scale-95'
                  )}
                >
                  {isCreating ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                      Criando...
                    </span>
                  ) : (
                    'Criar'
                  )}
                </button>
              </div>
              <p className="text-xs text-text-secondary mt-2">
                Suporta Mercado Livre, Amazon, Shopee.
              </p>
            </div>
          </section>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card-bg rounded-xl border border-card-border p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface-container-high rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 bg-surface-container-high rounded w-1/3 mb-2" />
                      <div className="h-3 bg-surface-container-high rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && links.length === 0 && (
            <div className="bg-card-bg border border-card-border rounded-xl p-8 text-center">
              <Link2 className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <h2 className="text-headline-sm text-text-primary font-headline-sm mb-2">
                Nenhum link criado
              </h2>
              <p className="text-body-md text-text-secondary">
                Cole uma URL de produto acima para criar seu primeiro link com afiliado!
              </p>
            </div>
          )}

          {/* Links List */}
          {!isLoading && !error && links.length > 0 && (
            <div className="space-y-3">
              {links.map((link) => {
                const StoreIcon = STORE_ICONS[link.store] || Link2;
                const storeColor = STORE_COLORS[link.store] || 'text-text-secondary';

                return (
                  <div
                    key={link.id}
                    className="bg-card-bg rounded-xl shadow-sm border border-card-border p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      {/* Store Icon */}
                      <div className={clsx('p-2 bg-surface-container-low rounded-lg', storeColor)}>
                        <StoreIcon className="w-5 h-5" />
                      </div>

                      {/* Link Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-text-secondary bg-surface-container-low px-2 py-0.5 rounded">
                            {link.storeLabel}
                          </span>
                          <span className="text-xs text-text-secondary">
                            {formatDate(link.createdAt)}
                          </span>
                        </div>

                        {/* Short URL */}
                        <div className="flex items-center gap-2 mb-2">
                          <a
                            href={link.shortUrl || link.affiliateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand font-medium truncate hover:underline flex items-center gap-1"
                          >
                            {link.shortUrl || link.affiliateUrl}
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        </div>

                        {/* Stats & Actions */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-secondary">
                            {link.clickCount} {link.clickCount === 1 ? 'clique' : 'cliques'}
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Copy Button */}
                            <button
                              type="button"
                              onClick={() => handleCopy(link)}
                              className={clsx(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                copiedId === link.id
                                  ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                  : 'bg-surface-container-low text-text-secondary hover:bg-surface-container-high border border-card-border'
                              )}
                            >
                              {copiedId === link.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  Copiado!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  Copiar
                                </>
                              )}
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDelete(link.id)}
                              className="p-1.5 rounded-lg text-text-secondary hover:bg-red-500/10 hover:text-red-500 transition-colors"
                              aria-label="Excluir link"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
