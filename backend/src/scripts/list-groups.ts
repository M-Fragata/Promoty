import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys"
import pino from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function listGroups() {
    const authFolder = path.resolve(__dirname, '../../auth_info_baileys');
    const { state } = await useMultiFileAuthState(authFolder);

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: true,
        defaultQueryTimeoutMs: undefined
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr } = update;

        if (qr) {
            console.log('\n📱 Escaneie o QR Code para conectar...\n');
        }

        if (connection === 'open') {
            console.log('\n✅ Conectado! Buscando grupos...\n');

            const groups = await sock.groupFetchAllParticipating();

            console.log('='.repeat(60));
            console.log('📋 GRUPOS DISPONÍVEIS:');
            console.log('='.repeat(60));

            for (const [jid, info] of Object.entries(groups)) {
                console.log(`\n📱 Nome: ${info.subject}`);
                console.log(`   JID: ${jid}`);
                console.log(`   Membros: ${info.size}`);
                console.log('-'.repeat(60));
            }

            console.log(`\n✅ Total: ${Object.keys(groups).length} grupos encontrados.`);
            console.log('\n💡 Copie o JID do grupo desejado e adicione no .env:\n');
            console.log('   WHATSAPP_GROUP_JID_CASA_MODA="<JID_AQUI>"');
            console.log('   WHATSAPP_GROUP_INVITE_CASA_MODA="<LINK_DE_CONVITE_AQUI>"\n');

            process.exit(0);
        }
    });
}

listGroups().catch(console.error);
