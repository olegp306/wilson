/** Outbound notifications (not the Telegraf user bot). */
export interface TelegramTransport {
  sendText(chatId: string, text: string): Promise<void>;
}
