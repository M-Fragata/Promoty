import { Trash2, ExternalLink, Pencil } from 'lucide-react';
import { useState } from 'react';
import { ProductCardImage } from './ProductCardImage';
import { PriceDisplay } from '../ui/PriceDisplay';
import { parseBadge } from '../../utils/badge';
import type { MlProducts } from '../../types/product';

const CATEGORIES = ['Eletrônicos', 'Casa', 'Moda', 'Beleza', 'Sem Nicho'];
const CATEGORIES_MAP: Record<string, string> = {
  'Eletrônicos': 'Eletrônicos',
  'Casa': 'Casa',
  'Moda': 'Moda',
  'Beleza': 'Beleza',
  'Sem Nicho': 'Sem Nicho',
};

interface ProductAdminCardProps {
  product: MlProducts;
  onDelete: (id: string) => Promise<void>;
  onUpdateCategory: (id: string, category: string) => Promise<void>;
}

export function ProductAdminCard({ product, onDelete, onUpdateCategory }: ProductAdminCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(product.category || 'Sem Nicho');
  const [isSaving, setIsSaving] = useState(false);
  const { discount } = parseBadge(product.badge);

  const categoryLabel = CATEGORIES_MAP[product.category ?? ''] || 'Sem Nicho';

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Excluir "${product.title}" permanentemente?`)) return;
    setIsDeleting(true);
    try {
      await onDelete(product.id);
    } catch (err) {
      console.error('Erro ao excluir:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveCategory = async () => {
    if (selectedCategory === product.category) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onUpdateCategory(product.id, selectedCategory);
      setIsEditing(false);
    } catch (err) {
      console.error('Erro ao atualizar categoria:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article className="flex flex-col gap-3 rounded-lg bg-card-bg border border-card-border p-3 shadow-sm">
      <ProductCardImage
        imageUrl={product.imageUrl}
        title={product.title}
        store={product.store}
      />

      <div className="px-1">
        <h3 className="text-label-bold text-sm text-text-primary line-clamp-2">
          {product.title}
        </h3>

        <div className="mt-2 flex flex-wrap gap-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-2 py-0.5 text-label-xs text-text-secondary">
            {product.store}
          </span>
          {product.coupon && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-label-xs text-green-600">
              {product.coupon}
            </span>
          )}
        </div>
      </div>

      <PriceDisplay
        price={product.price}
        originalPrice={product.originalPrice}
        installments={product.installments}
        discountLabel={discount}
      />

      <div className="px-1">
        <label className="text-label-xs text-text-secondary mb-1 block">Categoria</label>
        {isEditing ? (
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 rounded-md border border-card-border bg-surface-container-low px-2 py-1 text-label-xs text-text-primary"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              onClick={handleSaveCategory}
              disabled={isSaving}
              className="rounded-md bg-green-500 px-2 py-1 text-label-xs text-white hover:bg-green-600 disabled:opacity-50"
            >
              {isSaving ? '...' : '✓'}
            </button>
            <button
              onClick={() => { setIsEditing(false); setSelectedCategory(product.category || 'Sem Nicho'); }}
              className="rounded-md bg-surface-container-low px-2 py-1 text-label-xs text-text-secondary hover:bg-surface-container"
            >
              ✗
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-2 py-1 text-label-xs text-text-secondary hover:bg-surface-container"
          >
            <Pencil className="w-3 h-3" />
            {categoryLabel}
          </button>
        )}
      </div>

      <div className="mt-auto flex gap-2">
        <a
          href={product.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-md text-label-bold font-semibold transition-colors duration-150 bg-text-primary text-card-bg hover:opacity-90 shadow-sm"
        >
          Ver
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-red-300 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
          title="Excluir produto"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
}
