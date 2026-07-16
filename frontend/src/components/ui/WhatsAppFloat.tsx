import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { WHATSAPP_GROUPS } from '../../utils/constants';

export function WhatsAppFloat() {
  const [isOpen, setIsOpen] = useState(false);

  if (WHATSAPP_GROUPS.length === 0) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={clsx(
          'fixed bottom-20 right-4 z-40',
          'lg:hidden',
          'w-14 h-14 rounded-full',
          'bg-[#25D366] hover:bg-[#20bd5a] active:scale-95',
          'flex items-center justify-center',
          'shadow-[0_4px_12px_rgba(37,211,102,0.4)]',
          'transition-all duration-200'
        )}
        aria-label="Nossos Grupos WhatsApp"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>

      {/* Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card-bg rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
                <h2 className="font-label-bold text-label-bold text-text-primary">
                  Nossos Grupos
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md hover:bg-surface-container-high transition-colors text-text-secondary"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Groups */}
            <div className="px-5 py-4 flex flex-col gap-3">
              {WHATSAPP_GROUPS.map((group) => (
                <a
                  key={group.name}
                  href={group.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clsx(
                    'flex items-center gap-3 p-4 rounded-xl',
                    'bg-surface-container-low border border-card-border',
                    'hover:bg-surface-container transition-colors',
                    'active:scale-[0.98]'
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/15 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 text-[#25D366]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-bold text-label-bold text-text-primary">
                      {group.name}
                    </span>
                    <span className="text-label-sm text-text-secondary">
                      Entrar no grupo
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
