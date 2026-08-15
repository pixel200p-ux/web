import { useState } from 'react';
import './PixelAssistant.css';

type Message = {
  id: number;
  role: 'pixel' | 'user';
  text: string;
};

export default function PixelAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'pixel',
      text: 'Là tôi đây, Pixel. 👋',
    },
    {
      id: 2,
      role: 'pixel',
      text: 'Tôi đang sẵn sàng hỗ trợ bạn.',
    },
  ]);

  const sendMessage = () => {
    const text = input.trim();

    if (!text) return;

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        role: 'user',
        text,
      },
      {
        id: Date.now() + 1,
        role: 'pixel',
        text: 'Tôi đã nhận được yêu cầu của bạn. AI của tôi sẽ được kết nối ở bước tiếp theo.',
      },
    ]);

    setInput('');
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="pixel-assistant">
      {isOpen && (
        <div className="pixel-chat">
          {/* Header */}
          <div className="pixel-chat-header">
            <div className="pixel-profile">
              <div className="pixel-avatar pixel-avatar-small">
                <span>✦</span>
              </div>

              <div>
                <div className="pixel-name">Pixel</div>
                <div className="pixel-status">
                  <span className="pixel-status-dot" />
                  Trợ lý của bạn
                </div>
              </div>
            </div>

            <button
              type="button"
              className="pixel-close"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng Pixel"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="pixel-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`pixel-message-row ${
                  message.role === 'user'
                    ? 'pixel-message-user'
                    : 'pixel-message-pixel'
                }`}
              >
                {message.role === 'pixel' && (
                  <div className="pixel-avatar pixel-avatar-message">
                    <span>✦</span>
                  </div>
                )}

                <div
                  className={`pixel-message ${
                    message.role === 'user'
                      ? 'pixel-user-bubble'
                      : 'pixel-bubble'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="pixel-input-area">
            <input
              type="text"
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Nói gì đó với Pixel..."
              className="pixel-input"
            />

            <button
              type="button"
              className="pixel-send"
              onClick={sendMessage}
              aria-label="Gửi"
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {/* Floating Pixel */}
      <button
        type="button"
        className={`pixel-floating ${
          isOpen ? 'pixel-floating-open' : ''
        }`}
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Mở Pixel"
      >
        <div className="pixel-avatar pixel-avatar-large">
          <span>✦</span>
        </div>

        {!isOpen && (
          <span className="pixel-floating-label">
            Pixel
          </span>
        )}
      </button>
    </div>
  );
}