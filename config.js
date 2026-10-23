import { homedir } from 'node:os';
import { join } from 'node:path';

export const CONFIG_DIR = join(homedir(), '.was-whatsapp-web-mcp');
export const AUTH_DIR = join(CONFIG_DIR, 'session');
export const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
