import type { NicheConfig } from "../types/niche.js"
import { Env } from "../utils/Envirolment.js";

export const techNiche: NicheConfig = {
  id: "tech",
  name: "Tech",
  groupJid: Env.WHATSAPP_GROUP_JID_GAMERS,
  groupInviteLink: Env.WHATSAPP_GROUP_INVITE_GAMERS,
  keywords: [
    "notebook", "celular", "smartphone", "monitor", "placa de vídeo",
    "ssd", "hd", "fone", "headset", "teclado", "mouse", "webcam",
    "caixa de som bluetooth", "smartwatch", "tablet", "processador",
    "memória ram", "gabinete gamer", "cooler", "fonte para pc",
    "impressora", "roteador", "tv", "videogame", "console",
    "jogo de videogame", "cadeira gamer", "cadeira ergonomica",
    "cadeira de escritório", "mesa gamer", "power bank", "cabo usb",
    "carregador portátil", "suporte para notebook", "microfone",
    "filtro de linha", "no-break", "pen drive", "cartão de memória",
    "nvme", "water cooler", "whey", "creatina"
  ],
  banwords: [
    "capa", "capinha", "pés", "ipad", "cabo smartwatch",
    "ferramenta", "tela para", "pelicula", "película",
    "filament", "filamento", "ring light", "corda", "cordão",
    "cordao", "limpador", "removedor", "remoção", "extração",
    "case", "suporte de celular", "suporte celular", "suporte p/ celular", "suporte para celular", "fashion",
    "suporte tablet", "infantil", "rato", "bebedouros", "bebedouro",
    "conversor", "lapela", "ddr2", "ddr3", "suporte gpu",
    "mulher", "feminino", "ventilador de m", "mini ventilador", "mala de bordo", "papel fotografico", "papel fotográfico"
  ],
  limitedWords: ["Carregador", "smartwatch", "power bank"],
  minDiscount: 35,
  maxPrice: 4500,
  mlCategoryIds: ["MLB1648", "MLB1051"],
  mlUrls: [
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
  ],
  shopeeKeywordGroups: [
    ["teclado", "teclado gamer", "teclado bluetooth", "mouse", "mouse gamer", "mouse wireless"],
    ["fone", "fone bluetooth", "headset", "headset gamer", "microfone", "microfone gamer"],
    ["ssd", "ssd 1tb", "ssd 500gb", "nvme", "nvme 1tb", "hd externo", "pen drive"],
    ["processador", "processador amd", "processador intel", "memória ram", "memoria ram", "placa de vídeo", "placa de video"],
    ["gabinete gamer", "gabinete", "fonte para pc", "fonte gamer", "cooler", "cooler gamer", "water cooler"],
    ["monitor", "monitor gamer", "monitor 144hz", "tv", "smart tv", "webcam", "webcam gamer"],
    ["celular", "smartphone", "tablet", "notebook", "notebook gamer"],
    ["cadeira gamer", "cadeira ergonomica", "cadeira ergonômica", "cadeira de escritório", "mesa gamer", "mesa para computador"]
  ],
  shopeeCategoriesGroup: [],
  amazonCategoryNodes: ["n:16339926011", "n:16364750011", "n:16364755011", "n:16364756011"],
  amazonUrls: [
    // Grupo 0: Componentes de PC (GPU, Placa Mãe, Processadores, Memórias DDR5, Memórias DDR4)
    [
      "https://www.amazon.com.br/s?i=computers&rh=n%3A16339926011%2Cn%3A16364750011%2Cn%3A16364811011%2Cp_n_deal_type%3A23565493011&dc&page=1",
      "https://www.amazon.com.br/s?i=computers&rh=n%3A16339926011%2Cn%3A16364750011%2Cn%3A16364815011%2Cp_n_deal_type%3A23565493011&dc&page=1",
      "https://www.amazon.com.br/s?i=computers&rh=n%3A16339926011%2Cn%3A16364750011%2Cn%3A16364803011%2Cp_n_deal_type%3A23565493011&dc&page=1",
      "https://www.amazon.com.br/s?k=memoria+ram+ddr5&i=computers&rh=p_n_deal_type%3A23565493011&dc&page=1",
      "https://www.amazon.com.br/s?k=memoria+ram+ddr4&i=computers&rh=p_n_deal_type%3A23565493011&dc&page=1",
    ],
    // Grupo 1: Gabinetes, Fontes e Coolers
    [
      "https://www.amazon.com.br/s?i=computers&rh=n%3A16339926011%2Cn%3A16364750011%2Cn%3A16364807011%2Cp_n_deal_type%3A23565493011&dc&page=1",
      "https://www.amazon.com.br/s?i=computers&rh=n%3A16339926011%2Cn%3A16364750011%2Cn%3A16364806011%2Cp_n_deal_type%3A23565493011&dc&page=1",
      "https://www.amazon.com.br/s?i=computers&rh=n%3A16339926011%2Cn%3A16364750011%2Cn%3A16364817011%2Cp_n_deal_type%3A23565493011&dc&page=1",
    ],
    // Grupo 2: Notebooks, Desktops e Tablets
    [
      "https://www.amazon.com.br/s?i=computers&rh=n%3A16339926011%2Cn%3A16364755011%2Cp_n_deal_type%3A23565493011&dc&page=1",
      "https://www.amazon.com.br/s?i=computers&rh=n%3A16339926011%2Cn%3A16364751011%2Cp_n_deal_type%3A23565493011&dc&page=1",
      "https://www.amazon.com.br/s?i=computers&rh=n%3A16339926011%2Cn%3A16364762011%2Cp_n_deal_type%3A23565493011&dc&page=1",
    ],
    // Grupo 3: Monitores
    [
      "https://www.amazon.com.br/s?i=computers&rh=n%3A16339926011%2Cn%3A16364756011%2Cp_n_deal_type%3A23565493011&dc&page=1",
    ],
    // Grupo 4: Smartphones e TVs
    [
      "https://www.amazon.com.br/s?k=smartphone&i=electronics&rh=p_n_deal_type%3A23565493011&dc&page=1",
      "https://www.amazon.com.br/s?k=tv&i=electronics&rh=p_n_deal_type%3A23565493011&dc&page=1",
    ],
  ],
}
