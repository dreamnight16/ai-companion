import { type RefObject, useEffect, useMemo, memo } from "react";
import { Heart } from "lucide-react";
import type { ChatMessage } from "../../hooks/useChat";
import MessageBubble from "./MessageBubble";
import { Avatar, AvatarFallback } from "../ui/Avatar";

function formatDateLabel(ts: string): string | null {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (target.getTime() === today.getTime()) return "今天";
  if (target.getTime() === yesterday.getTime()) return "昨天";
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

interface GroupedMessages {
  label: string | null;
  messages: { msg: ChatMessage; idx: number }[];
}

function groupByDate(messages: ChatMessage[]): GroupedMessages[] {
  const groups: GroupedMessages[] = [];
  let lastLabel: string | null = null;
  messages.forEach((msg, idx) => {
    const label = formatDateLabel(msg.time);
    if (label !== lastLabel) {
      groups.push({ label, messages: [] });
      lastLabel = label;
    }
    groups[groups.length - 1].messages.push({ msg, idx });
  });
  return groups;
}

const MessageList = memo(function MessageList({
  messages, typing, composing, messagesEndRef, onRegenerate,
}: {
  messages: ChatMessage[];
  typing: boolean;
  composing: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onRegenerate?: () => void;
}) {
  const groups = useMemo(() => groupByDate(messages), [messages]);
  // 只有最后一条 AI 消息可以重新生成
  const lastAssistantIdx = messages.map(m => m.role).lastIndexOf("partner");

  useEffect(() => {
    const el = messagesEndRef.current;
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, composing, messagesEndRef]);

  if (messages.length === 0) {
    return (
      <div className="ym-empty-state">
        <span className="ym-kicker">会话</span>
        <h2 className="ym-empty-state__title">还没有对话</h2>
        <p className="ym-empty-state__text">
          发送第一条消息，TA 会按你设置的资料、说话方式和记忆回复。
          记忆会在设置中逐条列出，可以随时查看和修改。
        </p>
      </div>
    );
  }

  return (
    <div role="log" aria-live="polite" aria-label="聊天消息">
      {groups.map((group, gi) => (
        <section key={gi} className="ym-daygroup">
          {group.label && (
            <h2 className="ym-daygroup__label">
              <span className="ym-kicker">{group.label}</span>
            </h2>
          )}
          {group.messages.map(({ msg, idx }, mi) => (
            <MessageBubble
              key={`${msg.time}-${idx}`}
              message={msg}
              showAvatar={mi === 0 || group.messages[mi - 1]?.msg.role !== msg.role}
              canRegenerate={idx === lastAssistantIdx && msg.role === "partner"}
              onRegenerate={onRegenerate}
            />
          ))}
        </section>
      ))}

      {(typing || composing) && (
        <div className="ym-msg ym-msg--partner">
          <Avatar style={{ width: 32, height: 32, background: "var(--ym-teal-tint)" }}>
            <AvatarFallback className="bg-transparent">
              <Heart size={16} style={{ color: "var(--dn-teal)" }} fill="currentColor" aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
          <div className="ym-msg__col">
            <p className="ym-typing" role="status">
              <span>正在组织回复</span>
              <span className="bounce-dot" aria-hidden="true" />
              <span className="bounce-dot" aria-hidden="true" />
              <span className="bounce-dot" aria-hidden="true" />
            </p>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
});

export default MessageList;
