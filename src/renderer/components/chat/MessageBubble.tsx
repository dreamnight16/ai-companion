import { useState, useCallback, memo, useEffect, useRef } from "react";
import { Heart, Smile, ThumbsUp, ThumbsDown, MoreHorizontal } from "lucide-react";
import type { ChatMessage } from "../../hooks/useChat";
import { Avatar, AvatarFallback } from "../ui/Avatar";

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

/**
 * 消息 —— 用户消息是品牌 Teal 实色色块，伴侣消息是 Surface +
 * 左侧 Cyan 量尺。两者都是直角，用色彩与位置区分说话人。
 */
const MessageBubble = memo(function MessageBubble({
  message, showAvatar, canRegenerate, onRegenerate,
}: {
  message: ChatMessage;
  showAvatar: boolean;
  canRegenerate?: boolean;
  onRegenerate?: () => void;
}) {
  const isPartner = message.role === "partner";
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionText, setCorrectionText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => {
    setMenuPos(null);
    moreRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!menuPos) return;
    const first = menuRef.current?.querySelector<HTMLButtonElement>("button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); closeMenu(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuPos, closeMenu]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!canRegenerate || !onRegenerate) return;
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  }, [canRegenerate, onRegenerate]);

  const handleRegenerate = useCallback(() => {
    setMenuPos(null);
    onRegenerate?.();
  }, [onRegenerate]);

  const submitFeedback = useCallback(async (type: "thumbs_up" | "thumbs_down") => {
    if (feedbackSent) return;
    setFeedbackSent(true);
    try {
      await window.api.submitFeedback({ type, userMessage: "", aiReply: message.content });
    } catch { /* 反馈失败不影响继续聊天 */ }
    if (type === "thumbs_down") setShowCorrection(true);
  }, [feedbackSent, message.content]);

  const submitCorrection = useCallback(async () => {
    if (!correctionText.trim()) {
      setShowCorrection(false);
      return;
    }
    try {
      await window.api.submitFeedback({
        type: "correction",
        userMessage: "",
        aiReply: message.content,
        correctionText: correctionText.trim(),
      });
    } catch { /* 反馈失败不影响继续聊天 */ }
    setShowCorrection(false);
    setCorrectionText("");
  }, [correctionText, message.content]);

  const exportChat = useCallback(async (format: "txt" | "md") => {
    setMenuPos(null);
    await window.api.exportChat(format);
  }, []);

  return (
    <>
      <div
        className={`ym-msg ${isPartner ? "ym-msg--partner" : "ym-msg--user"}`}
        onContextMenu={handleContextMenu}
      >
        <div className="ym-msg__avatar" aria-hidden="true">
          {showAvatar ? (
            <Avatar style={{
              width: 32, height: 32,
              background: isPartner ? "var(--ym-teal-tint)" : "var(--ym-tint-strong)",
            }}>
              <AvatarFallback className="bg-transparent">
                {isPartner
                  ? <Heart size={16} style={{ color: "var(--dn-teal)" }} fill="currentColor" />
                  : <Smile size={16} />}
              </AvatarFallback>
            </Avatar>
          ) : <div style={{ width: 32 }} />}
        </div>

        <div className="ym-msg__col">
          <p className="ym-msg__bubble">{message.content}</p>

          <div className="ym-msg__meta">
            {showAvatar && (
              <time className="ym-kicker" dateTime={message.time}>{formatTime(message.time)}</time>
            )}

            {isPartner && canRegenerate && (
              <div className="ym-msg__actions">
                {!feedbackSent && (
                  <>
                    <button type="button" className="ym-icon-btn ym-icon-btn--sm ym-focus"
                      onClick={() => submitFeedback("thumbs_up")} aria-label="这条回复很好" title="这条回复很好">
                      <ThumbsUp size={15} aria-hidden="true" />
                    </button>
                    <button type="button" className="ym-icon-btn ym-icon-btn--sm ym-focus"
                      onClick={() => submitFeedback("thumbs_down")} aria-label="这条回复需要改进" title="这条回复需要改进">
                      <ThumbsDown size={15} aria-hidden="true" />
                    </button>
                  </>
                )}
                {feedbackSent && !showCorrection && <span className="ym-kicker">已记录反馈</span>}
                <button
                  ref={moreRef}
                  type="button"
                  className="ym-icon-btn ym-icon-btn--sm ym-focus"
                  aria-haspopup="menu"
                  aria-expanded={menuPos !== null}
                  onClick={(e) => {
                    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setMenuPos({ x: r.left, y: r.bottom + 4 });
                  }}
                  aria-label="更多操作"
                  title="更多操作"
                >
                  <MoreHorizontal size={15} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          {showCorrection && (
            <div className="ym-correction">
              <label className="ym-kicker" htmlFor={`ym-correction-${message.time}`}>希望 TA 怎么说</label>
              <div className="ym-correction__row">
                <input
                  id={`ym-correction-${message.time}`}
                  value={correctionText}
                  onChange={(e) => setCorrectionText(e.target.value)}
                  placeholder="写下你更希望的说法"
                  className="ym-field ym-focus"
                  onKeyDown={(e) => { if (e.key === "Enter") submitCorrection(); }}
                />
                <button type="button" onClick={submitCorrection} className="ym-btn ym-btn--primary ym-btn--sm ym-focus">
                  发送
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {menuPos && (
        <>
          <div className="ym-menu-scrim" onClick={closeMenu} />
          <div
            ref={menuRef}
            role="menu"
            aria-label="消息操作"
            className="ym-menu dn-acrylic dn-elevation-3"
            style={{ left: menuPos.x, top: menuPos.y }}
          >
            <button type="button" role="menuitem" className="ym-menu__item ym-focus" onClick={handleRegenerate}>
              重新生成
            </button>
            <button type="button" role="menuitem" className="ym-menu__item ym-focus" onClick={() => exportChat("txt")}>
              导出 TXT
            </button>
            <button type="button" role="menuitem" className="ym-menu__item ym-focus" onClick={() => exportChat("md")}>
              导出 Markdown
            </button>
          </div>
        </>
      )}
    </>
  );
});

export default MessageBubble;
