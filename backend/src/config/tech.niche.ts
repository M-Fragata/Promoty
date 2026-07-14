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
    "nvme", "water cooler"
  ],
  banwords: [
    "capa", "capinha", "pés", "ipad", "cabo smartwatch",
    "ferramenta", "tela para", "pelicula", "película",
    "filament", "filamento", "ring light", "corda", "cordão",
    "cordao", "limpador", "removedor", "remoção", "extração",
    "case", "suporte de celular", "suporte celular", "suporte p/ celular", "suporte para celular", "fashion",
    "suporte tablet", "infantil", "rato", "bebedouros", "bebedouro",
    "conversor", "lapela", "ddr2", "ddr3", "suporte gpu",
    "mulher", "feminino", "ventilador de m", "mini ventilador"
  ],
  limitedWords: ["Carregador", "smartwatch", "power bank"],
  minDiscount: 35,
  maxPrice: 4500,
  mlCategoryIds: ["MLB1648", "MLB1051"],
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
  amazonCategoryNodes: ["n:16339927011", "n:16209063011"]
}
