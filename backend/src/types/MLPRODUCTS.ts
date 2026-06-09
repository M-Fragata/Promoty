export interface MlProducts {
    id: String;
    title: String;
    price: number;
    originalPrice: number | null;
    coupon: String | null;
    badge: String | null;
    imageUrl: String | null;
    link: String;
    store: String;
    installments: String | null
}