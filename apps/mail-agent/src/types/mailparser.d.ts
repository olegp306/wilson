declare module 'mailparser' {
  export interface AddressObject {
    value?: Array<{ address?: string; name?: string }>;
  }
  export interface ParsedMail {
    subject?: string;
    date?: Date;
    text?: string;
    from?: AddressObject;
    messageId?: string;
  }
  export function simpleParser(source: Buffer | string): Promise<ParsedMail>;
}
