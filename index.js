const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

    if (text.toLowerCase() === 'oi' || text.toLowerCase() === 'menu') {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `👋 Olá! Seja bem-vindo à nossa loja de tecnologia!  

Digite uma das opções abaixo:

1️⃣ Ver produtos 📱
2️⃣ Falar com um atendente 👨‍💻
3️⃣ Saber horário de funcionamento 🕒`
      });
    }

    if (text === '1') {
      await sock.sendMessage(msg.key.remoteJid, { text: '🛒 Confira nossos produtos aqui: https://seusite.com.br' });
    }

    if (text === '2') {
      await sock.sendMessage(msg.key.remoteJid, { text: '👨‍💻 Um atendente irá falar com você em breve!' });
    }

    if (text === '3') {
      await sock.sendMessage(msg.key.remoteJid, { text: '🕒 Nosso horário de funcionamento: Segunda a Sexta, das 9h às 18h.' });
    }
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Conexão encerrada. Reconectando?', shouldReconnect);
      if (shouldReconnect) startSock();
    } else if (connection === 'open') {
      console.log('✅ Conectado ao WhatsApp!');
    }
  });
}

startSock();
