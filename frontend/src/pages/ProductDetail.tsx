import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, CreditCard, ExternalLink } from 'lucide-react';
import { FavoriteButton } from '../components/product/FavoriteButton';
import { ShareButton } from '../components/product/ShareButton';
import { RelatedProducts } from '../components/product/RelatedProducts';
import { ProductDetailSkeleton } from '../components/product/ProductDetailSkeleton';
import { PageShell } from '../components/layout/PageShell';
import { Button } from '../components/ui/Button';
import { StoreTag } from '../components/ui/StoreTag';
import { formatPrice, calculateDiscount } from '../utils/format';
import { api } from '../services/api';
import type { MlProducts } from '../types/product';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<MlProducts | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<MlProducts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    api.getProductById(id)
      .then((data) => {
        setProduct(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Erro ao buscar produto');
        setIsLoading(false);
      });
  }, [id]);

  // Fetch related products (same category, excluding current)
  useEffect(() => {
    if (!product) return;

    api.getDeals(1, product.category ? [product.category] : [])
      .then((result) => {
        const related = result.products
          .filter((p) => p.category === product.category && p.id !== product.id)
          .slice(0, 5);
        setRelatedProducts(related);
      })
      .catch(() => {
        // Ignore errors for related products
      });
  }, [product]);

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-text-secondary">{error || 'Produto não encontrado'}</p>
          <Button onClick={handleBack}>Voltar</Button>
        </div>
      </PageShell>
    );
  }

  const discount = calculateDiscount(product.originalPrice, product.price);

  return (
    <PageShell>

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row gap-stack-lg bg-card-bg rounded-xl p-4 md:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.04)] mb-stack-lg">
        {/* Product Image */}
        <div className="w-full md:w-1/2 lg:w-2/5 aspect-square relative rounded-lg overflow-hidden bg-surface-container-low border border-card-border flex items-center justify-center p-4">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-text-secondary">
              Sem imagem
            </div>
          )}

          {/* Store tag - top left */}
          <div className="absolute top-2 left-3 z-10">
            <StoreTag store={product.store} />
          </div>

          {/* Favorite button - top right */}
          <div className="absolute top-5 right-5 z-10">
            <FavoriteButton productId={product.id} size="lg" />
          </div>
        </div>

        {/* Product Details */}
        <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col">
          {/* Title */}
          <div className="mb-4">
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-text-primary mb-3">
              {product.title}
            </h1>
          </div>

          {/* Price Block */}
          <div className="bg-surface-container-lowest p-5 rounded-lg border border-card-border mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent-green/10 rounded-bl-full -z-0" />
            <div className="relative z-10 flex flex-col">
              <div className="flex items-end gap-3 mb-1">
                {product.originalPrice && (
                  <span className="text-text-secondary line-through text-body-md">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
                {discount > 0 && (
                  <span className="bg-accent-green text-accent-green-on font-label-bold text-label-bold px-2 py-0.5 rounded">
                    <strong>{discount}% OFF</strong>
                  </span>
                )}
              </div>
              <span className="price-display text-4xl mb-1">
                {formatPrice(product.price)}
              </span>
              {product.installments && (
                <div className="text-text-secondary text-sm flex items-center gap-1">
                  <CreditCard className="w-4 h-4" />
                  {product.installments}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto pt-4 border-t border-card-border flex gap-3">
            <a
              href={product.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-text-primary text-card-bg font-label-bold text-label-bold h-12 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm active:scale-[0.98]"
            >
              <ShoppingCart className="w-5 h-5" />
              Ir para Loja
              <ExternalLink className="w-5 h-5" />
            </a>

            <ShareButton
              productTitle={product.title}
              productLink={product.link}
              size="lg"
            />
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <RelatedProducts products={relatedProducts} />
      )}
    </PageShell>
  );
}
