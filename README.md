# WhatsApp Web / Personal MCP (`was-whatsapp-web-mcp`)

A self-contained, cross-platform Model Context Protocol (MCP) server for personal and business WhatsApp accounts via terminal QR code pairing. Built on pure WebSockets via Baileys (zero Chromium/Puppeteer overhead). Exposes 4 tools allowing AI coding assistants (Claude Desktop, Cursor, Antigravity, VS Code, Zed, etc.) to send messages, forward media, verify phone numbers, and check status using your linked WhatsApp number. Built by Web Analytics Solution.

## Prerequisites

| | Required | How to install |
|---|---|---|
| **Node.js 18+** | running `npx` | Mac: `brew install node` · Windows: https://nodejs.org · Linux: `apt install nodejs npm` |
| **Git** | letting `npx` clone from GitHub | Mac: `brew install git` (or first `git --version` triggers Xcode tools) · Windows: https://git-scm.com · Linux: `apt install git` |
| **WhatsApp on Phone** | to scan QR code | Android or iPhone |
| **Terminal access** | for pairing | Walked through below |

## Quick Start — 3 Steps

### Step 1 — Pair via Terminal QR Code

Run the interactive authorization command in your terminal:

```bash
npx -y github:mnsmasum62786/was-whatsapp-web-mcp auth
```

1. A QR code will display directly in your terminal.
2. Open WhatsApp on your phone.
3. Tap **Settings** (or the 3 dots on Android) > **Linked Devices** > **Link a Device**.
4. Point your camera at the terminal QR code to scan it.
5. The session will be encrypted and saved locally at `~/.was-whatsapp-web-mcp/session/`.

### Step 2 — Add to Your AI Client

Add the following configuration to your AI client's MCP configuration JSON file:

```json
{
  "mcpServers": {
    "WhatsApp Web MCP": {
      "command": "npx",
      "args": ["-y", "github:mnsmasum62786/was-whatsapp-web-mcp"]
    }
  }
}
```

#### Configuration File Locations by Client:
- **Claude Desktop (Mac)**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Claude Desktop (Windows)**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Cursor**: `~/.cursor/mcp.json` (or via Cursor Settings -> MCP)
- **Google Antigravity / Windsurf**: `~/.gemini/antigravity/mcp.json` or `~/.codeium/windsurf/mcp_config.json`

## What You Can Ask the AI

### Messaging & Notifications
- *"Send a WhatsApp message to `+15551234567` saying: 'Hey, I am testing my AI agent on WhatsApp!'."*
- *"Send an image from `https://example.com/chart.png` to `+15551234567` with caption 'Monthly Report'."*
- *"Send a PDF contract from `https://example.com/contract.pdf` to group `120363024849202@g.us`."*

### Validation & Status
- *"Check if `+15551234567` is registered on WhatsApp."*
- *"Show my current WhatsApp connection status and linked phone number."*

## All Tools (4 Total)

| Category | Tools | Description |
|---|---|---|
| **Messaging** | `wa_web_send_message` | Send a text message to any phone number or group JID. |
| | `wa_web_send_media` | Send image, video, audio, or document to a phone number or group JID via URL. |
| **Verification** | `wa_web_check_number` | Check if a phone number exists on WhatsApp and get their verified JID. |
| | `wa_web_get_status` | View connection state and connected phone details. |

## CLI Commands

You can run these commands directly via `npx -y github:mnsmasum62786/was-whatsapp-web-mcp <command>`:

- `auth` — Display QR code in terminal and pair with your WhatsApp phone.
- `status` — Show whether your WhatsApp session is linked and file paths.
- `logout` — Delete the local session directory (`~/.was-whatsapp-web-mcp/`).
- `help` — Print command line usage.

## Troubleshooting

### 1. "WhatsApp Web MCP — not configured yet"
- **Cause**: The server was started before pairing your device.
- **Fix**: Open your terminal and run `npx -y github:mnsmasum62786/was-whatsapp-web-mcp auth`.

### 2. "WhatsApp connection timed out (15s)"
- **Cause**: Your phone might be offline or disconnected from Wi-Fi/cellular data.
- **Fix**: Open WhatsApp on your phone to refresh connection and retry.

### 3. Windows PowerShell Execution Policy Error
If you see an error like `npx.ps1 cannot be loaded because running scripts is disabled`:
- **Fix**: Run the following command in PowerShell:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```

### 4. Cache Issues after Updates
To force clear the npx cache and download the latest release:
- **Windows (PowerShell)**:
  ```powershell
  Remove-Item -Recurse -Force "$env:LOCALAPPDATA\npm-cache" -ErrorAction SilentlyContinue
  npm cache clean --force
  ```
- **Mac / Linux**:
  ```bash
  rm -rf ~/.npm/_npx
  npm cache clean --force
  ```

## License

MIT License. Built by [Web Analytics Solution](https://webanalyticsbd.com/).
