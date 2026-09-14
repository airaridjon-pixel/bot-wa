const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // Memicu Pairing Code menggunakan Nomor Telepon
    if (!sock.authState.creds.registered) {
        console.log('\n==================================================');
        const phoneNumber = await question('MASUKKAN NOMOR HP BOT ANDA (Contoh: 628123456789): ');
        const code = await sock.requestPairingCode(phoneNumber.trim());
        console.log(`\nKODE PAIRING WHATSAPP ANDA ADALAH: ${code}`);
        console.log('==================================================\n');
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
            await sock.sendMessage(from, { text: 'Halo juga!.' });
        }
    });
}
startBot();
