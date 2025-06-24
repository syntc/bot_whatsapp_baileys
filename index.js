const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  const sock = makeWASocket({
    auth: state
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const sender = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

    console.log('📲 Mensagem recebida:', text);

    if (text && text.toLowerCase() === 'menu') {
      await sock.sendMessage(sender, { text: '👋 Olá! Aqui é o bot da sua loja de tecnologia!\n\nEscolha uma opção:\n\n1️⃣ Ver produtos\n2️⃣ Falar com atendente\n3️⃣ Saber horário de funcionamento' });
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log('❌ Conexão fechada, motivo:', reason);

      if (reason !== DisconnectReason.loggedOut) {
        startSock();
      }
    } else if (connection === 'open') {
      console.log('✅ Conectado com sucesso ao WhatsApp!');
    }
  });
}

startSock();
