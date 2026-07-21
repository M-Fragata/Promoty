import type { NicheConfig } from "../types/niche.js"
import { Env } from "../utils/Envirolment.js";

export const modaFeminina: NicheConfig = {
  id: "casa-moda-feminina",
  name: "Casa e Moda Feminina",
  groupJid: Env.WHATSAPP_GROUP_JID_MODA_FEMININA,
  groupInviteLink: Env.WHATSAPP_GROUP_INVITE_MODA_FEMININA,
  keywords: [
    // 👗 Moda Feminina Genérica (captura ampla)
    "vestido", "saia", "jaqueta feminina", "jaqueta jeans",
    "calça feminina", "calça alfaiataria", "blusa feminina",
    "moletom feminino", "cardigã", "casaco feminino",
    "pijama", "camiseta feminina", "bermuda feminina", "shorts feminino",
    "sutiã", "calcinha", "conjunto feminino", "regata", "cropped",

    // 👗 Roupas de Marca (conversão alta)
    "jaqueta hering", "calca levis", "moletom adidas",
    "blazer alfaiataria", "pijama cetim",
    "vestido farm", "body loba",

    // 👟 Calçados (expandido)
    "tênis feminino", "chinelo feminino", "sandália", "bota feminina",
    "sapatilha", "rasteira", "mocassim", "scarpin",
    "tenis olimpikus", "tenis adidas", "chinelo havaianas",
    "sandalia melissa", "bota cano curto",

    // 👜 Bolsas e Malas (expandido)
    "bolsa feminina", "mochila feminina", "carteira feminina",
    "necessaire", "bolsa couro", "bandeja",
    "bolsa santa lolla", "bolsa colcci", "mala de viagem",

    // 💄 Beleza & Skincare (expandido)
    "protetor solar", "creme hidratante", "sérum", "loção",
    "base líquida", "batom", "máscara", "rimel", "kit maquiagem",
    "perfume feminino", "desodorante", "shampoo",
    "protetor solar la roche", "serum cerave", "hidratante cetaphil",
    "kit eudora", "perfume carolina herrera", "perfume lily boticario",

    // 🔌 Eletro de Beleza
    "secador", "chapinha", "escova secadora", "escova alisadora",
    "modelador de cachos", "babyliss",
    "secador taiff", "chapinha babyliss", "escova mondial",

    // 🏠 Casa & Móveis (NOVO)
    "sofá", "sofa", "cadeira", "mesa", "cama", "armário", "armario",
    "estante", "gaveteiro", "rack", "poltrona", "criado mudo",
    "aparador", "prateleira", "cômoda", "comoda",
    "luminária", "luminaria", "quadro", "espelho", "cortina",
    "tapete", "almofada", "organizador", "vaso",
    "jogo de cama", "toalha", "cortina",

    // 🔌 Eletrodomésticos (NOVO)
    "air fryer", "airfryer", "fritadeira", "liquidificador",
    "batedeira", "sanduicheira", "cafeteira", "aspirador",
    "ventilador", "panela elétrica", "maquina de lavar",
    "secadora", "microondas", "purificador de agua",
    "ferro de passar", "aspirador de pó",

    // 🍳 Cozinha & Utilidades
    "jogo de panela", "jogo de faca", "utensílio", "panela",
    "frigideira", "forma de bolo", "tabua de corte",
    "congelador", "faqueiro", "jogo de copo",

    // Eletrônicos
    "smartphone", "celular", "notebook", "tv",

    //esportivo
    "whey", "creatina", "bicicleta ergométrica"
  ],
  banwords: [
    // Gênero oposto
    "masculino", "masculina", "barba", "aparelho de barbear", "pênis", "homem", "homens",
    "gilette", "barbeador", "sabão em barra",
    // Tech (evitar cruzamento com nicho gamers)
    "ferramenta", "parafuso", "broca", "serra", "furadeira",
    "ddr2", "ddr3", "ddr4", "ddr5", "placa de vídeo", "placa de video", "aparador de pelos",
    "processador", "memória ram", "memoria ram", "fonte para pc",
    "gabinete gamer", "water cooler", "cooler",
    "mouse gamer", "teclado gamer", "monitor", "ssd", "hd externo", "digitalizadora", "cabo smartwatch", "tela para", "pelicula", "película", "suporte de celular", "suporte celular", "suporte p/ celular", "suporte para celular", "suporte tablet",
    // Outros
    "infantil", "pet", "cachorro", "gato", "bebedouro pet", "escritorio", "escritório", "combo poderoso", "caderno", "ventilador de mão", "ventilador portátil" , "stitch", "gorro de tricô", "mini chapinha", "copo de liquidificador", "cinto"
  ],
  limitedWords: ["mini ventilador"],
  minDiscount: 40,
  maxPrice: 4500,
  mlCategoryIds: [
    "MLB1579", // Casa, Móveis e Decoração
    "MLB1585", // Móveis
    "MLB5726", // Eletrodomésticos
    "MLB1430", // Moda Feminina
    "MLB1246", // Beleza
    "MLB149036", // Eletrodomésticos de Cozinha
    "MLB11769", // Perfumes
  ],
  mlUrls: [
    // Lote 0: Casa, Móveis e Decoração (p1, p2)
    [
      "https://www.mercadolivre.com.br/ofertas?category=MLB1579&page=1&promotion_type=lightning",
      "https://www.mercadolivre.com.br/ofertas?category=MLB1579&page=2&promotion_type=lightning",
    ],
    // Lote 1: Moda Feminina (p1, p2)
    [
      "https://www.mercadolivre.com.br/ofertas?category=MLB1430&page=1&promotion_type=lightning",
      "https://www.mercadolivre.com.br/ofertas?category=MLB1430&page=2&promotion_type=lightning",
    ],
    // Lote 2: Moda Feminina (p3) + Eletrodomésticos (p1)
    [
      "https://www.mercadolivre.com.br/ofertas?category=MLB1430&page=3&promotion_type=lightning",
      "https://www.mercadolivre.com.br/ofertas?category=MLB5726&page=1&promotion_type=lightning",
    ],
    // Lote 3: Eletrodomésticos (p2) + Beleza (p1)
    [
      "https://www.mercadolivre.com.br/ofertas?category=MLB5726&page=2&promotion_type=lightning",
      "https://www.mercadolivre.com.br/ofertas?category=MLB1246&page=1&promotion_type=lightning",
    ],
    // Lote 4: Ofertas do Dia
    [
      "https://www.mercadolivre.com.br/ofertas?category=MLB1579&container_id=MLB779362-1&promotion_type=deal_of_the_day",
      "https://www.mercadolivre.com.br/ofertas?category=MLB1430&container_id=MLB779362-1&promotion_type=deal_of_the_day",
    ],
  ],
  shopeeKeywordGroups: [
    // Grupo 1: Achadinhos de Cozinha & Organização
    ["organizador acrilico", "organizador", "pote hermetico", "pote", "mop giratorio", "mop", "porta temperos rotativo", "organizador geladeira", "tabua de corte", "tábua de corte"],

    // Grupo 2: Casa & Decoração "Estilo Pinterest"
    ["luminaria led", "luminária led", "difusor de ambiente", "espelho decorativo", "espelho", "capa de almofada", "manta", "quadro decorativo", "quadro", "cortina"],

    // Grupo 3: Cama, Mesa & Banho
    ["pijama cetim", "pijama", "jogo de cama", "toalha de banho", "toalha", "trilho de mesa", "jogo americano", "jogo de toalha"],

    // Grupo 4: Moda Feminina Genérica
    ["vestido feminino", "vestido", "jaqueta jeans", "calça alfaiataria", "calça", "blazer", "saia", "casaco", "moletom feminino", "moletom", "shorts feminino"],

    // Grupo 5: Bolsas & Malas
    ["bolsa feminina", "bolsa", "mochila feminina", "mochila", "carteira feminina", "carteira", "maleta de maquiagem", "necessaire", "bolsa couro"],

    // Grupo 6: Calçados
    ["tênis feminino", "tênis", "sandália", "chinelo feminino", "chinelo", "sapatilha", "bota", "rasteira", "mocassim", "scarpin"],

    // Grupo 7: Beleza & Skincare
    ["protetor solar", "hidratante", "hidratante facial", "sérum", "sérum facial", "kit eudora", "kit boticario", "kit natura", "creme para pele", "creme facial"],

    // Grupo 8: Eletro de Beleza
    ["secador de cabelo", "secador", "chapinha", "chapinha profissional", "babyliss", "escova alisadora", "escova rotativa", "escova secadora"],

    // Grupo 9: Casa & Móveis (REESCRITO - mais específicos)
    ["sofá retrátil", "sofá", "poltrona conforto", "poltrona", "mesa de jantar", "mesa", "estante organização", "estante", "armário", "armario", "rack tv", "rack", "gaveteiro", "criado mudo", "prateleira", "tv", "smartphone"],

    // Grupo 10: Eletrodomésticos (CORRIGIDO - com variações)
    ["air fryer", "airfryer", "fritadeira air fryer", "aspirador robô", "aspirador robot", "aspirador portátil", "aspirador", "ventilador", "liquidificador", "cafeteira", "sanduicheira", "microondas", "máquina de lavar", "maquina de lavar"]
  ],
  shopeeCategoriesGroup: [
    // Grupo 0: Móveis
    [
      { id: 101166, name: 'Almofadas' },
      { id: 101171, name: 'Bancos, Cadeiras e Banquetas' },
      { id: 101172, name: 'Sofás' },
      { id: 101173, name: 'Armários e Gabinetes' },
      { id: 101174, name: 'Prateleiras e Racks' },
    ],
    // Grupo 1: Organizadores
    [
      { id: 101253, name: 'Cabides' },
      { id: 101254, name: 'Caixas, Bolsas e Cestas' },
      { id: 101257, name: 'Sacos e Cestos de Roupa' },
      { id: 101259, name: 'Organizadores de Guarda-Roupas' },
    ],
    // Grupo 2: Fragrância da Casa
    [
      { id: 101127, name: 'Purificadores de Ar' },
      { id: 101128, name: 'Óleos Essenciais' },
      { id: 101129, name: 'Difusores' },
    ],
    // Grupo 3: Roupas Femininas
    [
      { id: 100350, name: 'Blusas' },
      { id: 100352, name: 'Calças' },
      { id: 100353, name: 'Shorts' },
      { id: 100354, name: 'Saias' },
      { id: 100355, name: 'Vestidos' },
      { id: 100356, name: 'Jeans' },
      { id: 100380, name: 'Lingerie e Roupa Íntima' },
    ],
    // Grupo 4: Acessórios de Moda
    [
      { id: 100021, name: 'Anéis' },
      { id: 100022, name: 'Brincos' },
      { id: 100023, name: 'Pulseiras' },
      { id: 100024, name: 'Colares' },
    ],
    // Grupo 5: Beleza
    [
      { id: 101651, name: 'Espelhos' },
      { id: 101653, name: 'Pincéis de Maquiagem' },
      { id: 101654, name: 'Esponjas e Aplicadores' },
      { id: 101661, name: 'Massagem Facial' },
      { id: 101662, name: 'Limpeza Facial' },
    ],
    // Grupo 6: Eletrodomésticos
    [
      { id: 100175, name: 'Ferros de Passar e Vaporizadores' },
      { id: 100177, name: 'Aspiradores de Pó' },
      { id: 100458, name: 'Purificadores e Umidificador de Ar' },
    ],
  ],
  amazonCategoryNodes: ["n:16191000011", "n:17365811011", "n:16194414011", "n:16522082011"],
  amazonUrls: [
    // Lote 0: Casa - Móveis (p1, p2)
    [
      "https://www.amazon.com.br/s?i=home&rh=n%3A16191000011%2Cn%3A17100530011%2Cp_n_deal_type%3A23565493011&dc&page=1",
      "https://www.amazon.com.br/s?i=home&rh=n%3A16191000011%2Cn%3A17100530011%2Cp_n_deal_type%3A23565493011&dc&page=2",
    ],
    // Lote 1: Casa - Cozinha + Decoração
    [
      "https://www.amazon.com.br/s?i=home&rh=n%3A16191000011%2Cn%3A23783015011%2Cp_n_deal_type%3A23565493011&dc&page=1",
      "https://www.amazon.com.br/s?i=home&rh=n%3A16191000011%2Cn%3A17100531011%2Cp_n_deal_type%3A23565493011&dc&page=1",
    ],
    // Lote 2: Moda Feminina (p1, p2)
    [
      "https://www.amazon.com.br/s?i=fashion&rh=n%3A17365811011%2Cn%3A17681969011%2Cp_n_deal_type%3A23565493011&dc&page=1",
      "https://www.amazon.com.br/s?i=fashion&rh=n%3A17365811011%2Cn%3A17681969011%2Cp_n_deal_type%3A23565493011&dc&page=2",
    ],
    // Lote 3: Beleza - Perfumes + Maquiagem
    [
      "https://www.amazon.com.br/s?i=beauty&rh=n%3A16194414011%2Cn%3A16754347011%2Cp_n_deal_type%3A23565493011&dc&page=1",
      "https://www.amazon.com.br/s?i=beauty&rh=n%3A16194414011%2Cn%3A16754350011%2Cp_n_deal_type%3A23565493011&dc&page=1",
    ],
    // Lote 4: Eletrodomésticos (p1, p2)
    [
      "https://www.amazon.com.br/s?i=appliances&rh=n%3A16522082011%2Cp_n_deal_type%3A23565493011&dc&page=1",
      "https://www.amazon.com.br/s?i=appliances&rh=n%3A16522082011%2Cp_n_deal_type%3A23565493011&dc&page=2",
    ],
  ],
}

/*
  🔍 Lojas oficiais Shopee para pesquisar (nicho Casa e Moda Feminina):
  Para adicionar, criar métodos similares ao GetPichauShop/GetTerabyteShop no ShopeePromosController:

  - shopID Loja Oficial Electrolux: 959459901
  - shopID Loja Oficial Mondial: 982709540
  - shopID Loja Oficial Britânia: 1149542380
  - shopID Loja Oficial Oster: 647578520
  - shopID Loja Oficial Polishop: 1388059532
  - shopID Loja Oficial Nike: 434647926
  - shopID Loja Oficial Adidas: 1927724212
  - shopID Loja Oficial Renner: 926508650
  - shopID Loja Oficial Riachuelo: 1061425027
  - shopID Loja Oficial Lojas Americanas: 1110314373
  - shopID Loja Oficial Magalu: 3000010742
  - shopID Loja Oficial Multilaser: 375506506
  - shopID Loja Oficial WAP (eletro): 957067351

  💡 Depois de escolher, adicione no ShopeePromosController com:
  - GET /shopee/{loja} → busca productOfferV2(shopId: X, limit: 15, page: N)
  - Use productMatchesAnyNiche() para filtrar
*/
