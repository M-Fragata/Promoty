import { StoreTag } from '../ui/StoreTag';

interface ProductCardImageProps {
  imageUrl: string | null;
  title: string;
  store: string;
}

export function ProductCardImage({
  imageUrl,
  title,
  store,
}: ProductCardImageProps) {
  return (
    <div className="relative">
      {/* Image container */}
      <div className="aspect-square overflow-hidden rounded-lg bg-surface-container-low">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-secondary text-body-md">
            Sem imagem
          </div>
        )}
      </div>

      {/* Store badge — aligns with card rounded corners */}
      <div className="absolute -top-4 -left-4 z-10">
        <StoreTag store={store} />
      </div>
    </div>
  );
}
