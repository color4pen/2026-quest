import { Message } from '../types/game';
import { MessageLog } from './MessageLog';

interface GameInfoProps {
  messages: Message[];
}

export function GameInfo({ messages }: GameInfoProps) {
  return (
    <div className="right-panel log-only">
      <MessageLog messages={messages} />
    </div>
  );
}
