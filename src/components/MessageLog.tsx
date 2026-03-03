import { Message } from '../types/game';

interface MessageLogProps {
  messages: Message[];
}

export function MessageLog({ messages }: MessageLogProps) {
  // 新しいメッセージを上に表示（配列を逆順に）
  const reversedMessages = [...messages].reverse();

  return (
    <div className="message-log">
      <div className="message-log-header">
        <span className="log-title">ログ</span>
      </div>
      <div className="message-log-content">
        {reversedMessages.map((msg) => (
          <div key={msg.id} className={`message ${msg.type}`}>
            {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
}
