import { z } from 'zod'
import dotenv from 'dotenv';
dotenv.config();

const EnvSchema = z.object({
    PORT: z.string().default('3333'),
    FRONTEND_URL: z.string(),
    AMAZON_TAG: z.string(),
    SHOPEE_ID: z.string().default(''),
    DATABASE_URL: z.string().default(''),
    WHATSAPP_GROUP_JID_GAMERS: z.string().default(process.env.WHATSAPP_GROUP_JID || ''),
    WHATSAPP_GROUP_INVITE_GAMERS: z.string().default(''),
    WHATSAPP_GROUP_JID_MODA_FEMININA: z.string().default(''),
    WHATSAPP_GROUP_INVITE_MODA_FEMININA: z.string().default(''),
    TELEGRAM_API_ID: z.coerce.number().default(0),
    TELEGRAM_API_HASH: z.string().default(''),
    AWIN_PUBLISHER_ID: z.string().default(''),
    AWIN_CEA_MERCHANT_ID: z.string().default(''),
    AWIN_RIACHUELO_MERCHANT_ID: z.string().default(''),
    MELI_ID: z.string().default(''),
    TELEGRAM_SESSION: z.string().default(''),
    MATT_TOOL: z.string().default(''),
    KUTT_API_KEY: z.string().default(''),
    HEADLESS: z.preprocess(
        (val) => {
            if (val === 'true') return true;
            if (val === 'false') return false;
            return val;
        },
        z.boolean()
    ).default(true),//padrão produção
    SHOPEE_API_ID: z.string().default(''),
    SHOPEE_API_PASSWORD: z.string().default(''),
    TELEGRAM_CHAT_ID: z.string().default(''),
    TELEGRAM_TOKEN: z.string().default(''),
    TOKEN_AWIN: z.string().default(''),
    AWIN_DAFITI_MERCHANT_ID: z.string().default(''),
    AWIN_KABUM_MERCHANT_ID: z.string().default(''),
    AWIN_DAFITI_URL: z.string().default(''),
    AWIN_KABUM_URL: z.string().default(''),
    AWIN_ALIEXPRESS_MERCHANT_ID: z.string().default(''),
    AWIN_LOJASTORRA_MERCHANT_ID: z.string().default(''),
    ADMIN_EMAILS: z.string().default('')
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