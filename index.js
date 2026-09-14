const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys'); // Sesuaikan library WA-mu jika berbeda
const pino = require('pino');
const express = require('express');

// ==========================================
// 1. MEMBUAT SERVER WEB MINI (AGAR RAILWAY TETAP AKTIF)
// ==========================================
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot WhatsApp Aktif & Sehat!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Web server sukses berjalan di port ${port}`);
});

// ==========================================
// 2. FUNGSI UTAMA BOT WHATSAPP
// ==========================================
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ["Ubuntu", "Chrome", "20.0.0.4"]
  });

  // Logika meminta kode pairing jika belum terdaftar
  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      const phoneNumber = "6285182323201"; // Nomor HP Bot kamu
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        console.log('\n====================================');
        console.log(`KODE PAIRING WHATSAPP ANDA ADALAH: ${code}`);
        console.log('====================================\n');
      } catch (err) {
        console.log("Gagal meminta kode pairing:", err);
      }
    }, 8000); // Menunggu 8 detik setelah server Express jalan
  }

  sock.ev.on('creds.update', saveCreds);
}

// ==========================================
// 3. MENJALANKAN BOT (PENTING: JANGAN DIHAPUS)
// ==========================================
startBot();
