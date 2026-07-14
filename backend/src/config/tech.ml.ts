// URLs do Mercado Livre APENAS para o nicho Tech
// Cada "Lote" contém 2 URLs de categorias Tech
export const techMlUrls: string[][] = [
    // Lote 0: Informática (p1, p2)
    [
        "https://www.mercadolivre.com.br/ofertas?category=MLB1648&page=1&promotion_type=lightning",
        "https://www.mercadolivre.com.br/ofertas?category=MLB1648&page=2&promotion_type=lightning",
    ],

    // Lote 1: Informática (p3) + Celulares (p1)
    [
        "https://www.mercadolivre.com.br/ofertas?category=MLB1648&page=3&promotion_type=lightning",
        "https://www.mercadolivre.com.br/ofertas?container_id=MLB779535-1&page=1",
    ],

    // Lote 2: Celulares (p2) + TVs (p1)
    [
        "https://www.mercadolivre.com.br/ofertas?container_id=MLB779535-1&page=2",
        "https://www.mercadolivre.com.br/ofertas?container_id=MLB779539-1&page=1",
    ],

    // Lote 3: TVs (p2) + Informática (p4)
    [
        "https://www.mercadolivre.com.br/ofertas?container_id=MLB779539-1&page=2",
        "https://www.mercadolivre.com.br/ofertas?category=MLB1648&page=4&promotion_type=lightning",
    ],

    // Lote 4: Ofertas do Dia
    [
        "https://www.mercadolivre.com.br/ofertas?category=MLB1648&container_id=MLB779362-1&promotion_type=deal_of_the_day",
        "https://www.mercadolivre.com.br/ofertas?category=MLB1051&container_id=MLB779362-1&promotion_type=deal_of_the_day",
    ],
];
