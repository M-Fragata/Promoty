import { z } from 'zod'
import 'dotenv/config'

const EnvSchema = z.object({
    PORT: z.string().default('3333'),
    AMAZON_TAG: z.string(),
    SHOPEE_ID: z.string().default(''),
    DATABASE_URL: z.string(),
    WHATSAPP_GROUP_JID: z.string(),
    TELEGRAM_API_ID: z.coerce.number(),
    TELEGRAM_API_HASH: z.string(),
    AWIN_PUBLISHER_ID: z.string(),
    MELI_ID: z.string(),
    TELEGRAM_SESSION: z.string(),
    MATT_TOOL: z.string()
})

const Envirol = EnvSchema.safeParse(process.env);

if (!Envirol.success) {
    console.error("❌ Erro crítico nas variáveis de ambiente (.env):");
    // Formata os erros do Zod para mostrar exatamente qual campo quebrou
    console.error(Envirol.error.format());
    process.exit(1);
}

// Exporta as variáveis perfeitamente tipadas (e com o API_ID já como número puro!)
export const Env = Envirol.data;