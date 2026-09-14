const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    // Menyimpan sesi login agar tidak perlu scan/pairing ulang jika panel restart
    const { state, saveCreds } = await useMultiFileAuthState('session_bot');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false // Kita matikan QR karena pakai Pairing Code
    });

    // LOGIKA UNTUK PAIRING CODE LEWAT TERMINAL PANEL
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            const phoneNumber = await question('Masukkan nomor WhatsApp kamu (contoh: 62812345678): ');
            const code = await sock.requestPairingCode(phoneNumber.trim());
            console.log(`\n👉 KODE TAUTAN ANDA: ${code}\n`);
            console.log('Masukkan kode di atas ke WhatsApp iPhone Anda (Perangkat Tertaut > Tautkan dengan nomor telepon saja)');
        }, 3000);
    }

    // MEMANTAU LOG KONEKSI
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus, mencoba menghubungkan ulang...', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('Selamat! Bot WhatsApp Anda telah ONLINE 24 Jam!');
        }
    });

    // MENYIMPAN KREDENSIAL OTOMATIS
    sock.ev.on('creds.update', saveCreds);

    // LOGIKA AUTO-RESPONDER (MEMBALAS PESAN)
    sock.ev.on('messages.upsert', async (chat) => {
        try {
            const m = chat.messages[0];
            if (!m.message || m.key.fromMe) return; // Mengabaikan pesan dari bot sendiri

            const from = m.key.remoteJid;
            // Mendapatkan teks pesan baik dari chat pribadi atau grup
            const body = m.message.conversation || m.message.extendedTextMessage?.text || '';

            // FITUR RESPOND KATA KUNCI
            if (body === '!ping') {
                await sock.sendMessage(from, { text: 'Pong! 🏓 Bot kamu berhasil aktif dan merespon dengan cepat!' });
            } else if (body === 'halo' || body === 'Halo') {
                await sock.sendMessage(from, { text: 'Halo juga! Ada yang bisa bot bantu?' });
            }
        } catch (error) {
            console.error('Error saat membaca pesan:', error);
        }
    });
}

startBot();
