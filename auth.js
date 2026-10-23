import { mkdir, writeFile, chmod, readFile, rm } from 'node:fs/promises';
import { CONFIG_DIR, AUTH_DIR, CONFIG_FILE } from './config.js';

export async function runAuthFlow() {
  console.log('\n=== WhatsApp Web / Personal MCP — Setup ===\n');
  console.log('Initializing WhatsApp Web session...');

  const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = await import('@whiskeysockets/baileys');
  const qrcode = (await import('qrcode-terminal')).default;
  const { default: pino } = await import('pino');

  // Clean up any stale/incomplete session files before starting fresh pairing
  await rm(AUTH_DIR, { recursive: true, force: true });
  await mkdir(AUTH_DIR, { recursive: true, mode: 0o700 });
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  return new Promise((resolve, reject) => {
    let resolved = false;

    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      browser: ['Ubuntu', 'Chrome', '20.0.04'],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('\nScan this QR code with WhatsApp on your phone:');
        console.log('  1. Open WhatsApp on your phone');
        console.log('  2. Tap Settings (or 3 dots) -> Linked Devices -> Link a Device');
        console.log('  3. Point your camera at this QR code:\n');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'open') {
        const userId = sock.user?.id || '(unknown)';
        console.log(`\n✓ Successfully connected to WhatsApp! Logged in as: ${userId}`);

        const payload = {
          linked: true,
          user_id: userId,
          saved_at: new Date().toISOString(),
        };

        await writeFile(CONFIG_FILE, JSON.stringify(payload, null, 2), { mode: 0o600 });
        try { await chmod(CONFIG_FILE, 0o600); } catch {}

        console.log(`✓ Session saved to ${AUTH_DIR}\n`);
        console.log('Add this configuration to your AI client:\n');
        console.log(JSON.stringify({
          mcpServers: {
            'WhatsApp Web MCP': {
              command: 'npx',
              args: ['-y', 'github:mnsmasum62786/was-whatsapp-web-mcp'],
            },
          },
        }, null, 2));

        resolved = true;
        sock.end();
        resolve();
      } else if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        if (statusCode === DisconnectReason.loggedOut) {
          console.error('\nSession logged out. Run auth again.');
          if (!resolved) reject(new Error('Session logged out'));
        } else if (!resolved) {
          // brief reconnect delay
          console.log('Reconnecting...');
        }
      }
    });
  });
}

export async function readConfigFile() {
  try {
    return JSON.parse(await readFile(CONFIG_FILE, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

export async function deleteConfigFile() {
  try {
    await rm(CONFIG_DIR, { recursive: true, force: true });
    return true;
  } catch (e) {
    if (e.code === 'ENOENT') return false;
    throw e;
  }
}
