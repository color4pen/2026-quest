import { Message, MessageType, MAX_MESSAGES } from '../types/game';

/**
 * メッセージログを管理するクラス
 */
export class MessageManager {
  private messages: Message[] = [];
  private messageId: number = 0;

  /**
   * メッセージを追加
   */
  public add(text: string, type: MessageType): void {
    this.messages.push({
      id: this.messageId++,
      text,
      type,
    });

    if (this.messages.length > MAX_MESSAGES) {
      this.messages = this.messages.slice(-MAX_MESSAGES);
    }
  }

  /**
   * 全メッセージを取得
   */
  public getMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * メッセージをクリア
   */
  public clear(): void {
    this.messages = [];
    this.messageId = 0;
  }
}
