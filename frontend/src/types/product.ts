import { z } from 'zod';

export interface MlProducts {
  id: string;
  title: string;
  price: number;
  originalPrice: number | null;
  coupon: string | null;
  badge: string | null;
  imageUrl: string | null;
  link: string;
  store: string;
  installments: string | null;
  description?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  shipping?: {
    free: boolean;
    estimatedDays?: number | null;
  } | null;
  relatedProducts?: MlProducts[];
}

const ShippingSchema = z.object({
  free: z.boolean(),
  estimatedDays: z.number().nullable().optional(),
});

export const MlProductsSchema: z.ZodType<MlProducts> = z.lazy(() =>
  z.object({
    id: z.string(),
    title: z.string(),
    price: z.number(),
    originalPrice: z.number().nullable(),
    coupon: z.string().nullable(),
    badge: z.string().nullable(),
    imageUrl: z.string().nullable(),
    link: z.string().url(),
    store: z.string(),
    installments: z.string().nullable(),
    description: z.string().nullable().optional(),
    rating: z.number().nullable().optional(),
    reviewCount: z.number().nullable().optional(),
    shipping: ShippingSchema.nullable().optional(),
    relatedProducts: z.array(MlProductsSchema).optional(),
  })
);

export type MlProductsArray = MlProducts[];

export const MlProductsArraySchema = z.array(MlProductsSchema);
