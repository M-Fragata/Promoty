import type { NicheConfig } from "../types/niche.js"
import { Env } from "../utils/Envirolment.js";

export const modaFeminina: NicheConfig = {
  id: "casa-moda-feminina",
  name: "Casa e Moda Feminina",
  groupJid: Env.WHATSAPP_GROUP_JID_MODA_FEMININA,
  groupInviteLink: Env.WHATSAPP_GROUP_INVITE_MODA_FEMININA,
  keywords: [
    // 👗 Roupas de Marca / Conhecidas (Gera muita conversão no ML)
    "jaqueta hering feminina",
    "calca levis feminina",
    "moletom adidas feminino",
    "blazer feminino alfaiataria",
    "pijama cetim feminino",
    "vestido farm", // Farm vende absurdamente bem e tem alto valor/comissão
    "body loba",    // Loba/Lupo é tiro certeiro por tamanho padrão

    // 👟 Calçados (Onde elas sabem o número e compram sem medo)
    "tenis vert feminino", // Vert/Veja é febre de moda urbana
    "tenis olimpikus feminino",
    "tenis adidas feminino",
    "chinelo havaianas feminino",
    "sandalia melissa",
    "bota cano curto feminina",

    // 👜 Bolsas e Malas (Alto valor agregado)
    "bolsa santa lolla",
    "bolsa colcci feminina",
    "mala de viagem bordo",

    // 💄 Beleza & Skincare de Farmácia/Luxo (ML é forte no Envio Full disso)
    "protetor solar la roche",
    "serum cerave",
    "hidratante cetaphil",
    "kit eudora siage",
    "perfume carolina herrera feminino",
    "perfume lily boticario",

    // 🔌 Eletro de Beleza (Produtos de desejo com caixa e garantia original)
    "secador taiff",
    "chapinha babyliss pro",
    "escova secadora mondial"
  ],
  banwords: [
    "masculino", "masculina", "barba", "aparelho de barbear", "pênis", "homem", "homens",
    "gilette", "barbeador", "sabão em barra",
    "ferramenta", "parafuso", "broca", "serra", "furadeira",
    "ddr2", "ddr3", "ddr4", "ddr5", "placa de vídeo",
    "processador", "memória ram", "fonte para pc",
    "gabinete gamer", "water cooler", "cooler",
    "mouse gamer", "teclado gamer"
  ],
  limitedWords: [],
  minDiscount: 30,
  maxPrice: 3000,
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
    // Grupo 1: Achadinhos de Cozinha & Organização (Febre de vendas por impulso)
    ["organizador acrilico", "pote hermetico", "mop giratorio", "mini processador sem fio", "porta temperos rotativo", "organizador geladeira"],

    // Grupo 2: Casa & Decoração "Estilo Pinterest" (Itens leves e estéticos)
    ["luminaria led sem fio", "difusor de ambiente", "espelho decorativo", "capa de almofada", "manta sofa", "quadro decorativo minimalista"],

    // Grupo 3: Cama, Mesa & Banho (Fácil de vender por foto)
    ["pijama cetim feminino", "jogo de cama casal", "toalha de banho fio penteado", "trilho de mesa", "jogo americano mesa posta"],

    // Grupo 4: Moda Feminina Estratégica (Peças-coringa e tendências)
    ["jaqueta jeans feminina", "calca alfaiataria feminina", "blazer feminino", "vestido canelado", "casaco moletom feminino", "biquini fita"],

    // Grupo 5: Bolsas & Malas (Alto desejo)
    ["bolsa feminina", "mochila feminina", "carteira feminina", "maleta de maquiagem", "necessaire viagem"],

    // Grupo 6: Calçados Conforto & Estilo
    ["tenis feminino", "sandalia rasteira", "chinelo nuvem feminino", "sapatilha bico fino", "bota cano curto feminina"],

    // Grupo 7: Beleza & Skincare de Marca (Evitando maquiagem barata de R$ 5)
    ["protetor solar cerave", "serum la roche", "hidratante cetaphil", "kit eudora", "kit boticario", "kit natura"],

    // Grupo 8: Eletro-Portáteis de Beleza (Ticket alto e muita busca)
    ["secador de cabelo", "chapinha", "babyliss", "escova alisadora", "escova rotativa", "modelador de cachos"]
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
