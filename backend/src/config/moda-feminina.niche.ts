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
    "sutiã", "calcinha", "conjunto feminino",

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
    "congelador", "faqueiro", "jogo de copo"
  ],
  banwords: [
    // Gênero oposto
    "masculino", "masculina", "barba", "aparelho de barbear", "pênis", "homem", "homens",
    "gilette", "barbeador", "sabão em barra",
    // Tech (evitar cruzamento com nicho gamers)
    "ferramenta", "parafuso", "broca", "serra", "furadeira",
    "ddr2", "ddr3", "ddr4", "ddr5", "placa de vídeo", "placa de video",
    "processador", "memória ram", "memoria ram", "fonte para pc",
    "gabinete gamer", "water cooler", "cooler",
    "mouse gamer", "teclado gamer", "monitor", "notebook",
    "celular", "smartphone", "ssd", "hd externo",
    // Outros
    "infantil", "pet", "cachorro", "gato", "bebedouro pet"
  ],
  limitedWords: ["air fryer"],
  minDiscount: 30,
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
  shopeeKeywordGroups: [
    // Grupo 1: Achadinhos de Cozinha & Organização
    ["organizador acrilico", "pote hermetico", "mop giratorio", "porta temperos rotativo", "organizador geladeira", "tabua de corte"],

    // Grupo 2: Casa & Decoração "Estilo Pinterest"
    ["luminaria led", "difusor de ambiente", "espelho decorativo", "capa de almofada", "manta", "quadro decorativo", "cortina"],

    // Grupo 3: Cama, Mesa & Banho
    ["pijama cetim", "jogo de cama", "toalha de banho", "trilho de mesa", "jogo americano", "jogo de toalha"],

    // Grupo 4: Moda Feminina Genérica
    ["vestido feminino", "jaqueta jeans", "calça alfaiataria", "blazer", "saia", "casaco", "moletom feminino", "shorts feminino"],

    // Grupo 5: Bolsas & Malas
    ["bolsa feminina", "mochila feminina", "carteira feminina", "maleta de maquiagem", "necessaire"],

    // Grupo 6: Calçados
    ["tênis feminino", "sandália", "chinelo feminino", "sapatilha", "bota", "rasteira"],

    // Grupo 7: Beleza & Skincare
    ["protetor solar", "hidratante", "sérum", "kit eudora", "kit boticario", "kit natura", "creme para pele"],

    // Grupo 8: Eletro de Beleza
    ["secador de cabelo", "chapinha", "babyliss", "escova alisadora", "escova rotativa"],

    // Grupo 9: Casa & Móveis (NOVO)
    ["sofá", "cadeira", "mesa", "estante", "armário", "poltrona", "rack", "gaveteiro", "luminária"],

    // Grupo 10: Eletrodomésticos (NOVO)
    ["air fryer", "aspirador", "ventilador", "liquidificador", "cafeteira", "sanduicheira", "microondas", "maquina de lavar"]
  ],
  amazonCategoryNodes: ["n:16339927011", "n:16209063011"]
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
