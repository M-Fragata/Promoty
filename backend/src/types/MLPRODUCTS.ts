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
    installments: string | null
}