// Keywords para classificação de produtos por categoria
// Baseado nas keywords dos nichos tech.niche.ts e moda-feminina.niche.ts

const KEYWORDS_CASA = [
  // Móveis
  "sofá", "sofa", "cadeira", "mesa", "cama", "armário", "armario",
  "estante", "gaveteiro", "rack", "poltrona", "criado mudo",
  "aparador", "prateleira", "cômoda", "comoda",
  // Decoração
  "luminária", "luminaria", "quadro", "espelho", "cortina",
  "tapete", "almofada", "organizador", "vaso",
  "jogo de cama", "toalha",
  // Eletrodomésticos
  "air fryer", "airfryer", "fritadeira", "liquidificador",
  "batedeira", "sanduicheira", "cafeteira", "aspirador",
  "ventilador", "panela elétrica", "maquina de lavar",
  "secadora", "microondas", "purificador de agua",
  "ferro de passar", "aspirador de pó",
  // Cozinha
  "jogo de panela", "jogo de faca", "utensílio", "panela",
  "frigideira", "forma de bolo", "tabua de corte",
  "congelador", "faqueiro", "jogo de copo",
  // Organização
  "organizador acrilico", "pote hermetico", "mop giratorio",
  "porta temperos rotativo", "organizador geladeira",
];

const KEYWORDS_MODA = [
  // Roupas
  "vestido", "saia", "jaqueta", "calça", "calca", "blusa",
  "moletom", "cardigã", "casaco", "pijama", "camiseta",
  "bermuda", "shorts", "sutiã", "calcinha", "conjunto",
  "blazer", "body",
  // Calçados
  "tênis", "tenis", "chinelo", "sandália", "bota",
  "sapatilha", "rasteira", "mocassim", "scarpin",
  // Bolsas
  "bolsa", "mochila", "carteira", "necessaire", "bandeja", "mala",
  // Acessórios
  "anel", "brinco", "pulseira", "colar",
];

const KEYWORDS_BELEZA = [
  // Skincare
  "protetor solar", "creme hidratante", "sérum", "serum",
  "loção", "base líquida", "base liquida",
  // Maquiagem
  "batom", "máscara", "mascara", "rimel", "kit maquiagem",
  // Perfumes
  "perfume", "desodorante",
  // Cabelo
  "shampoo", "secador", "chapinha", "escova secadora",
  "escova alisadora", "modelador de cachos", "babyliss",
];

const KEYWORDS_ELETRONICOS = [
  // Computação
  "notebook", "celular", "smartphone", "monitor", "placa de vídeo",
  "placa de video", "ssd", "hd", "processador", "memória ram",
  "memoria ram", "gabinete", "cooler", "fonte", "nvme",
  "water cooler", "impressora", "roteador",
  // Periféricos
  "fone", "headset", "teclado", "mouse", "webcam",
  "caixa de som", "smartwatch", "tablet",
  // Games
  "videogame", "console", "jogo de videogame", "cadeira gamer",
  "mesa gamer",
  // Energia
  "power bank", "cabo usb", "carregador", "filtro de linha",
  "no-break", "pen drive", "cartão de memória",
  // TV
  "tv", "smart tv",
  // Esportivo tech
  "whey", "creatina",
];

export type ProductCategory = "Eletrônicos" | "Casa" | "Moda" | "Beleza" | "Sem Nicho";

/**
 * Classifica um produto em uma categoria baseada no título e nicho.
 *
 * 1. Tenta matchar keywords específicas de cada categoria
 * 2. Se não matchar, usa o nicho como fallback
 * 3. Último recurso: "Eletrônicos"
 */
export function categorizeProduct(title: string, nicheId?: string): ProductCategory {
  const lower = title.toLowerCase();

  // 1. Keywords específicas (ordem importa: Beleza antes de Moda porque "kit maquiagem" pode ser ambos)
  if (KEYWORDS_BELEZA.some(kw => lower.includes(kw))) return "Beleza";
  if (KEYWORDS_CASA.some(kw => lower.includes(kw))) return "Casa";
  if (KEYWORDS_MODA.some(kw => lower.includes(kw))) return "Moda";
  if (KEYWORDS_ELETRONICOS.some(kw => lower.includes(kw))) return "Eletrônicos";

  // 2. Fallback: nicho
  if (nicheId === "tech") return "Eletrônicos";
  if (nicheId === "casa-moda-feminina") return "Casa";

  // 3. Último recurso
  return "Sem Nicho";
}
