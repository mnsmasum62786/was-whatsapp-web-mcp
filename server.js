#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { AUTH_DIR } from './config.js';

const credsFile = join(AUTH_DIR, 'creds.json');
if (!existsSync(credsFile)) {
  console.error(
    'WhatsApp Web MCP — not configured yet.\n\n' +
    'Run:  npx -y github:mnsmasum62786/was-whatsapp-web-mcp auth\n'
  );
  process.exit(1);
}

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = await import('@whiskeysockets/baileys');
const { default: pino } = await import('pino');

const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

let socketInstance = null;
let isReady = false;
let readyPromiseResolve = null;
const readyPromise = new Promise((resolve) => {
  readyPromiseResolve = resolve;
});

function formatJid(target) {
  const clean = String(target).trim();
  if (clean.endsWith('@s.whatsapp.net') || clean.endsWith('@g.us')) {
    return clean;
  }
  const digitsOnly = clean.replace(/[^\d]/g, '');
  return `${digitsOnly}@s.whatsapp.net`;
}

function connectSocket() {
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['Antigravity MCP', 'Chrome', '131.0.0'],
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      isReady = true;
      if (readyPromiseResolve) readyPromiseResolve(sock);
    } else if (connection === 'close') {
      isReady = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode !== DisconnectReason.loggedOut) {
        setTimeout(connectSocket, 3000);
      }
    }
  });

  socketInstance = sock;
  return sock;
}

connectSocket();

async function getActiveSocket() {
  if (isReady && socketInstance) return socketInstance;
  // Wait up to 15 seconds for socket ready
  return await Promise.race([
    readyPromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('WhatsApp connection timed out (15s). Ensure your phone is connected to the internet.')), 15000)),
  ]);
}

function asTextResult(data) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const MAX = 60000;
  if (text.length > MAX) {
    return {
      content: [{
        type: 'text',
        text: text.slice(0, MAX) + `\n\n... [truncated ${text.length - MAX} chars]`,
      }],
    };
  }
  return { content: [{ type: 'text', text }] };
}

function asError(err) {
  return {
    isError: true,
    content: [{
      type: 'text',
      text: 'WhatsApp Web error:\n' + JSON.stringify({
        message: err?.message || String(err),
      }, null, 2),
    }],
  };
}

const tools = [
  {
    name: 'wa_web_send_message',
    description: 'Send a WhatsApp text message to any phone number or group using your linked personal or business WhatsApp account.',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient phone number with country code (e.g. "+15551234567" or "8801700000000") or group JID' },
        text: { type: 'string', description: 'Message content' },
      },
      required: ['to', 'text'],
    },
  },
  {
    name: 'wa_web_send_media',
    description: 'Send media (image, video, document, or audio) to a recipient or group via direct URL.',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient phone number or group JID' },
        type: { type: 'string', enum: ['image', 'video', 'document', 'audio'], description: 'Type of media' },
        url: { type: 'string', description: 'Direct URL to media file' },
        caption: { type: 'string', description: 'Optional caption' },
        fileName: { type: 'string', description: 'Optional filename for documents' },
      },
      required: ['to', 'type', 'url'],
    },
  },
  {
    name: 'wa_web_check_number',
    description: 'Check if a phone number is registered on WhatsApp and get their verified WhatsApp JID.',
    inputSchema: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'Phone number to verify (with country code)' },
      },
      required: ['phone'],
    },
  },
  {
    name: 'wa_web_get_status',
    description: 'Get current WhatsApp Web link status and your logged-in account information.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

async function handleCall(name, args) {
  const sock = await getActiveSocket();

  switch (name) {
    case 'wa_web_send_message': {
      const jid = formatJid(args.to);
      const res = await sock.sendMessage(jid, { text: args.text });
      return asTextResult({
        success: true,
        messageId: res?.key?.id,
        recipient: jid,
        timestamp: res?.messageTimestamp,
      });
    }

    case 'wa_web_send_media': {
      const jid = formatJid(args.to);
      const content = {
        [args.type]: { url: args.url },
      };
      if (args.caption) content.caption = args.caption;
      if (args.fileName && args.type === 'document') content.fileName = args.fileName;

      const res = await sock.sendMessage(jid, content);
      return asTextResult({
        success: true,
        messageId: res?.key?.id,
        recipient: jid,
      });
    }

    case 'wa_web_check_number': {
      const clean = String(args.phone).replace(/[^\d]/g, '');
      const results = await sock.onWhatsApp(clean);
      return asTextResult(results || []);
    }

    case 'wa_web_get_status': {
      return asTextResult({
        status: isReady ? 'connected' : 'connecting',
        user: sock.user || null,
      });
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

const server = new Server(
  { name: 'was-whatsapp-web-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  try {
    return await handleCall(req.params.name, req.params.arguments || {});
  } catch (err) {
    return asError(err);
  }
});

await server.connect(new StdioServerTransport());
console.error(`was-whatsapp-web-mcp v1.0.0 ready — ${tools.length} tools loaded`);
