const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // Nomor telepon Anda langsung dimasukkan di sini secara otomatis
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            const phoneNumber = "6285182323201";
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log('\n==================================================');
                console.log(`KODE PAIRING WHATSAPP ANDA ADALAH: ${code}`);
                console.log('==================================================\n');
            } catch (err) {
                console.log("Gagal meminta kode pairing: ", err);
            }
        }, 5000); // Menunggu 5 detik agar koneksi stabil
    }

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') console.log('Bot WhatsApp SUKSES terhubung!');
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages;
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (text && text.toLowerCase() === 'halo') {
            await sock.sendMessage(from, { text: 'Halo juga! Ini balasan otomatis dari bot gratisan saya.' });
        }
    });
}
startBot();
