import type { NicheConfig } from "../types/niche.js";
import { Env } from "../utils/Envirolment.js";
import { techNiche } from "./tech.niche.js";
import { modaFeminina } from "./moda-feminina.niche.js";

let cachedNiches: NicheConfig[] | null = null;

export function getActiveNiches(): NicheConfig[] {
  if (cachedNiches) return cachedNiches;

  const niches: NicheConfig[] = [];

  niches.push({
    ...techNiche,
    groupJid: Env.WHATSAPP_GROUP_JID_GAMERS,
  });

  niches.push({
    ...modaFeminina,
    groupJid: Env.WHATSAPP_GROUP_JID_MODA_FEMININA,
    groupInviteLink: Env.WHATSAPP_GROUP_INVITE_MODA_FEMININA,
  });

  cachedNiches = niches;
  return niches;
}

export function getNicheById(id: string): NicheConfig | undefined {
  return getActiveNiches().find((n) => n.id === id);
}
