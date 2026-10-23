# Changelog

## 1.0.0 — 2026-10-23

### New Features
- Initial release of `was-whatsapp-web-mcp` — Shareable WhatsApp Web / Personal MCP server.
- Interactive terminal QR code scan authentication (`auth` command) without requiring Chromium/Puppeteer.
- Lightweight socket connection via `@whiskeysockets/baileys`.
- 4 tools:
  - Text messaging to phone numbers or groups (`wa_web_send_message`)
  - Media sending (image, video, document, audio) via direct URL (`wa_web_send_media`)
  - WhatsApp user registration check (`wa_web_check_number`)
  - Connection and logged-in account status (`wa_web_get_status`)
- Secure local session storage at `~/.was-whatsapp-web-mcp/session/`.
- Full cross-platform compatibility (Mac, Windows, Linux).
