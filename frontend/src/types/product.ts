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
}

export const MlProductsSchema = z.object({
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
});

export type MlProductsArray = MlProducts[];

export const MlProductsArraySchema = z.array(MlProductsSchema);