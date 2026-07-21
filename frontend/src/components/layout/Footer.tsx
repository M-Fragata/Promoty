import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-card-bg border-t border-card-border mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 mb-15 lg:mb-0">
        <div className="flex flex-col items-center text-center gap-4">
          {/* Disclaimer de Afiliado */}
          <p className="text-text-secondary text-body-md leading-relaxed max-w-3xl">
            Como associado da Amazon, eu recebo por compras qualificadas.
            Somos um agregador de ofertas independente. Participamos do Programa de Associados
            da Amazon e de outros programas de afiliados de e-commerce. Os links neste site
            podem conter IDs de rastreamento de afiliados.
          </p>

          {/* Links úteis */}
          <div className="flex flex-wrap justify-center gap-4 text-label-bold">
            <Link
              to="/sobre"
              className="text-text-secondary hover:text-brand transition-colors"
            >
              Sobre nós
            </Link>
            <Link
              to="/privacidade"
              className="text-text-secondary hover:text-brand transition-colors"
            >
              Política de Privacidade
            </Link>
            <Link
              to="/termos"
              className="text-text-secondary hover:text-brand transition-colors"
            >
              Termos de Uso
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-text-secondary text-label-sm">
            © {new Date().getFullYear()} Fragata Ofertas. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
