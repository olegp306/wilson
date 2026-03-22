export interface ImapConnectionJson {
  host: string;
  port: number;
  user: string;
  password: string;
  /** TLS (default true for 993) */
  secure?: boolean;
}

export function parseImapSecret(encryptedSecret: string): ImapConnectionJson {
  const parsed = JSON.parse(encryptedSecret) as ImapConnectionJson;
  if (!parsed.host || !parsed.user || !parsed.password) {
    throw new Error('IMAP secret JSON must include host, user, password');
  }
  if (!parsed.port) {
    parsed.port = 993;
  }
  if (parsed.secure === undefined) {
    parsed.secure = true;
  }
  return parsed;
}
