const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');

// Membuat server web mini agar Railway tidak mematikan container secara paksa
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot WhatsApp Aktif & Sehat!');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Web server sukses berjalan di port ${port}`);
});

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

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
        }, 8000); // Menunggu 8 detik agar server siap
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
