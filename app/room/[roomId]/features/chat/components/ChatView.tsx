"use client";

import type { RefObject } from "react";
import type { Message } from "../types";
import { formatTime, getAvColor } from "../utils";

type ChatViewProps = {
  messages: Message[];
  sessionId: string;
  input: string;
  chatScrollRef: RefObject<HTMLDivElement | null>;
  bottomRef: RefObject<HTMLDivElement | null>;
  composingRef: RefObject<boolean>;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
};

export function ChatView({
  messages,
  sessionId,
  input,
  chatScrollRef,
  bottomRef,
  composingRef,
  onInputChange,
  onSendMessage,
}: ChatViewProps) {
  return (
    <div className="page active chat-page">
      <div className="chat-messages" ref={chatScrollRef}>
        {messages.length === 0 && <p className="empty-chat">아직 메시지가 없어요. 첫 메시지를 보내보세요!</p>}
        {messages.map((msg) => {
          const isMe = msg.session_id === sessionId;
          const safeName = msg.display_name?.trim() || "익명";
          return (
            <div key={msg.id} className={`msg${isMe ? " me" : ""}`}>
              <div className={`av ${getAvColor(safeName)}`}>{safeName[0]}</div>
              <div className="bubble-wrap">
                {!isMe && <span className="sender-name">{safeName}</span>}
                <div className="bubble">{msg.content}</div>
                <div className="msg-meta">{formatTime(msg.created_at)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-row sticky-input">
        <input
          className="chat-input"
          placeholder="메시지를 입력하세요..."
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onCompositionStart={() => { composingRef.current = true; }}
          onCompositionEnd={() => { composingRef.current = false; }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !composingRef.current) onSendMessage();
          }}
          autoComplete="off"
        />
        <button className="send-btn" onClick={onSendMessage}>
          <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  );
}
