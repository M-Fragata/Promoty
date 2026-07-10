import { z } from 'zod'
import dotenv from 'dotenv';
dotenv.config();

const EnvSchema = z.object({
    PORT: z.string().default('3333'),
    FRONTEND_URL: z.string(),
    AMAZON_TAG: z.string(),
    SHOPEE_ID: z.string().default(''),
    DATABASE_URL: z.string(),
    WHATSAPP_GROUP_JID: z.string(),
    WHATSAPP_GROUP_INVITE_GAMERS: z.string(),
    WHATSAPP_GROUP_JID_MODA_FEMININA: z.string(),
    WHATSAPP_GROUP_INVITE_MODA_FEMININA: z.string(),
    TELEGRAM_API_ID: z.coerce.number(),
    TELEGRAM_API_HASH: z.string(),
    AWIN_PUBLISHER_ID: z.string(),
    MELI_ID: z.string(),
    TELEGRAM_SESSION: z.string(),
    MATT_TOOL: z.string(),
    KUTT_API_KEY: z.string(),
    HEADLESS: z.preprocess(
        (val) => {
            if (val === 'true') return true;
            if (val === 'false') return false;
            return val;
        },
        z.boolean()
    ).default(true),//padrão produção
    SHOPEE_API_ID: z.string(),
    SHOPEE_API_PASSWORD: z.string(),
    TELEGRAM_CHAT_ID: z.string(),
    TELEGRAM_TOKEN: z.string()
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