import { useState, useEffect, useCallback } from "react";
import { Heart, Settings, MessageCircle, MessageSquare, Search, Send, MessageSquareHeart } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useChat } from "../hooks/useChat";
import MessageList from "../components/chat/MessageList";
import Button from "../components/ui/Button";
import SettingsDialog from "../components/shared/SettingsDialog";
import UpdateToast from "../components/shared/UpdateToast";
import SurveyDialog, { shouldShowSurvey } from "../components/shared/SurveyDialog";
import { getModels } from "../lib/models";
import NapCatSetup from "./NapCatSetup";
import WeChatSetup from "./WeChatSetup";

type ChannelState = "connected" | "busy" | "off" | "error";

const CHANNEL_LABEL: Record<ChannelState, string> = {
  connected: "已连接",
  busy: "连接中",
  off: "未启动",
  error: "异常",
};

function channelState(status: string): ChannelState {
  if (status === "connected") return "connected";
  if (["downloading", "extracting", "configuring", "starting", "waiting-qr", "checking", "pulling"].includes(status)) return "busy";
  if (status === "error" || status === "no-docker") return "error";
  return "off";
}

const RELATION_LABEL: Record<string, string> = { girlfriend: "女朋友", boyfriend: "男朋友" };
const MODE_LABEL: Record<string, string> = { direct: "直接情侣", slow_burn: "养成模式" };

/** 渠道连接状态 —— 来自主进程真实状态，不轮询、不编造 */
function useChannelStatus() {
  const [qq, setQq] = useState<string>("stopped");
  const [wechat, setWechat] = useState<string>("stopped");

  useEffect(() => {
    let mounted = true;
    window.api.getNapCatStatus().then((s: unknown) => {
      if (mounted) setQq((s as { status?: string })?.status ?? "stopped");
    }).catch(() => {});
    window.api.getWeChatStatus().then((s: unknown) => {
      if (mounted) setWechat((s as { status?: string })?.status ?? "stopped");
    }).catch(() => {});
    const unsubQq = window.api.on("napcat:status-changed", (s: unknown) => {
      setQq((s as { status?: string })?.status ?? "stopped");
    });
    const unsubWc = window.api.on("wechat:status-changed", (s: unknown) => {
      setWechat((s as { status?: string })?.status ?? "stopped");
    });
    return () => { mounted = false; unsubQq(); unsubWc(); };
  }, []);

  return { qq, wechat };
}

export default function ChatWindow() {
  const {
    messages, typing, composing, profile, messagesEndRef,
    sendMessage, regenerate, queueSize, pending, onTypingActivity,
  } = useChat();
  const channels = useChannelStatus();

  const [draft, setDraft] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showNapCat, setShowNapCat] = useState(false);
  const [showWeChat, setShowWeChat] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHits, setSearchHits] = useState<Array<{ snippet: string; role: string; timestamp: string }>>([]);
  const [searched, setSearched] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState("");
  const [appVersion, setAppVersion] = useState("");

  const doSearch = useCallback(async (query: string) => {
    const q = query.trim();
    if (q.length < 2) return;
    setSearched(true);
    const diskHits = (await window.api.searchChat(q)) as Array<{ snippet: string; role: string; timestamp: string }>;
    const localHits = messages
      .filter((m) => m.content.toLowerCase().includes(q.toLowerCase()))
      .map((m) => {
        const idx = m.content.toLowerCase().indexOf(q.toLowerCase());
        const start = Math.max(0, idx - 30);
        const end = Math.min(m.content.length, idx + q.length + 30);
        const snippet = (start > 0 ? "..." : "") + m.content.slice(start, end) + (end < m.content.length ? "..." : "");
        return { snippet, role: m.role === "partner" ? "assistant" : m.role, timestamp: m.time };
      });
    const seen = new Set<string>();
    setSearchHits([...diskHits, ...localHits]
      .filter((h) => { const key = h.snippet + h.timestamp; if (seen.has(key)) return false; seen.add(key); return true; })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 50));
  }, [messages]);

  useEffect(() => {
    let mounted = true;
    window.api.getAvatar().then((d: unknown) => { if (mounted) setAvatarData(d as string | null); });
    window.api.getConfig().then((c: unknown) => {
      if (!mounted) return;
      const ai = (c as { ai?: { model?: string } }).ai;
      if (ai?.model) setCurrentModel(ai.model);
    });
    window.api.getVersion().then((v: string) => { if (mounted) setAppVersion(v); });
    return () => { mounted = false; };
  }, []);

  // 侧栏时间：真实的本地时间，每 30 秒对齐一次
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { if (shouldShowSurvey()) setShowSurvey(true); }, []);

  const name = (profile?.name as string) || "伴侣";
  const nickname = (profile?.user_nickname as string) || "你";
  const relationship = RELATION_LABEL[profile?.relationship_type as string] || "";
  const mode = MODE_LABEL[profile?.relationship_mode as string] || "";
  const city = (profile?.city as string) || (profile?.user_city as string) || "";
  const occupation = (profile?.occupation as string) || "";

  const qqState = channelState(channels.qq);
  const wechatState = channelState(channels.wechat);

  const liveState = composing
    ? "正在输入"
    : typing
      ? "正在组织回复"
      : queueSize > 0
        ? `${queueSize} 条排队中`
        : pending
          ? "等待发送"
          : "空闲";
  const liveStateTone: ChannelState = composing || typing || queueSize > 0 || pending ? "busy" : "off";

  const placeholder = queueSize > 0
    ? `还有 ${queueSize} 条消息排队，发送后会依次回复`
    : pending
      ? "可以继续写，稍后一起发出"
      : "想聊点什么？Enter 发送，Shift+Enter 换行";
  const canSend = draft.trim().length > 0;

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage(draft.trim());
    setDraft("");
  };

  const cycleModel = async () => {
    if (!currentModel) return;
    const prev = currentModel;
    const provider = currentModel.includes("claude") ? "anthropic" : currentModel.includes("gpt") ? "openai" : null;
    const models = provider ? getModels(provider) : [currentModel];
    const next = models[((models.indexOf(currentModel) + 1) % models.length)] || models[0];
    if (next === currentModel) return;
    setCurrentModel(next);
    try {
      await window.api.updateConfig({ ai: { model: next } });
    } catch {
      setCurrentModel(prev);
    }
  };

  const pickAvatar = async () => {
    try {
      const d = await window.api.pickAvatar();
      if (d) setAvatarData(d as string);
    } catch { /* 用户取消或读取失败时保持原头像 */ }
  };

  return (
    <div className="ym-app">
      <UpdateToast />

      {/* ===== 身份色块：品牌 Teal 实色，承载真实资料与连接状态 ===== */}
      <nav className="ym-rail" aria-label="主导航">
        <div className="ym-rail__top" style={{ WebkitAppRegion: "drag" }}>
          <span className="ym-kicker ym-rail__brand">梦间 / Yumema</span>

          <button
            type="button"
            onClick={pickAvatar}
            className="ym-rail__avatar ym-focus"
            style={{ WebkitAppRegion: "no-drag" }}
            aria-label="更换伴侣头像"
            title="更换伴侣头像"
          >
            {avatarData
              ? <img src={avatarData} alt="" />
              : <Heart size={22} aria-hidden="true" />}
          </button>

          <h1 className="ym-rail__name">{name}</h1>
          <p className="ym-rail__role">
            {[relationship, mode].filter(Boolean).join(" · ") || "尚未设置关系"}
          </p>

          <div className="ym-rail__live">
            <span className="ym-status-dot" data-state={liveStateTone === "busy" ? "busy" : "off"} aria-hidden="true" />
            <span>{liveState}</span>
          </div>

          <dl className="ym-fact ym-rail__facts">
            {city && <div><dt>城市</dt><dd>{city}</dd></div>}
            {occupation && <div><dt>职业</dt><dd>{occupation}</dd></div>}
            <div><dt>称呼</dt><dd>{nickname}</dd></div>
          </dl>

          {currentModel && (
            <button
              type="button"
              onClick={cycleModel}
              className="ym-rail__model ym-focus"
              style={{ WebkitAppRegion: "no-drag" }}
              title="切换到下一个可用模型"
            >
              <span className="ym-kicker">模型</span>
              <span className="ym-rail__model-name">{currentModel}</span>
            </button>
          )}
        </div>

        <div className="ym-rail__nav" style={{ WebkitAppRegion: "no-drag" }}>
          <button type="button" className="ym-nav-item ym-focus ym-rail__item" aria-current="true">
            <MessageSquareHeart size={20} aria-hidden="true" />
            <span className="ym-rail__label">会话</span>
          </button>
          <button type="button" className="ym-nav-item ym-focus ym-rail__item" onClick={() => setShowSearch(true)}>
            <Search size={20} aria-hidden="true" />
            <span className="ym-rail__label">搜索记录</span>
          </button>
          <button type="button" className="ym-nav-item ym-focus ym-rail__item" onClick={() => setShowSettings(true)}>
            <Settings size={20} aria-hidden="true" />
            <span className="ym-rail__label">设置</span>
          </button>
          <button type="button" className="ym-nav-item ym-focus ym-rail__item" onClick={() => setShowSurvey(true)}>
            <MessageCircle size={20} aria-hidden="true" />
            <span className="ym-rail__label">反馈</span>
          </button>
        </div>

        <div className="ym-rail__channels" style={{ WebkitAppRegion: "no-drag" }}>
          <span className="ym-kicker ym-rail__section">聊天渠道</span>
          <button type="button" onClick={() => setShowNapCat(true)} className="ym-channel ym-focus">
            <MessageCircle size={18} aria-hidden="true" />
            <span className="ym-rail__label">QQ</span>
            <span className="ym-channel__state">
              <span className="ym-status-dot" data-state={qqState === "connected" ? "on" : qqState === "busy" ? "busy" : "off"} aria-hidden="true" />
              {CHANNEL_LABEL[qqState]}
            </span>
          </button>
          <button type="button" onClick={() => setShowWeChat(true)} className="ym-channel ym-focus">
            <MessageSquare size={18} aria-hidden="true" />
            <span className="ym-rail__label">微信</span>
            <span className="ym-channel__state">
              <span className="ym-status-dot" data-state={wechatState === "connected" ? "on" : wechatState === "busy" ? "busy" : "off"} aria-hidden="true" />
              {CHANNEL_LABEL[wechatState]}
            </span>
          </button>
        </div>

        <div className="ym-rail__foot" style={{ WebkitAppRegion: "no-drag" }}>
          <time className="ym-kicker" dateTime={now.toISOString()}>
            {now.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" })}
            {" · "}
            {now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
          </time>
          <span className="ym-kicker">v{appVersion || "0.0.0"}</span>
        </div>
      </nav>

      {/* ===== 会话 ===== */}
      <main className="ym-main">
        <div className="ym-stream">
          <MessageList
            messages={messages}
            typing={typing}
            composing={composing}
            messagesEndRef={messagesEndRef}
            onRegenerate={regenerate}
          />
        </div>

        <div className="ym-composer">
          <div className="ym-composer__inner">
            <label className="sr-only" htmlFor="ym-draft">消息内容</label>
            <textarea
              id="ym-draft"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                onTypingActivity();
                const el = e.target;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 120) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              placeholder={placeholder}
              className="ym-composer__field ym-focus"
            />
            <Button
              iconOnly
              variant="primary"
              onClick={handleSend}
              disabled={!canSend}
              aria-label="发送消息"
              title="发送"
            >
              <Send size={16} aria-hidden="true" />
            </Button>
          </div>
          <div className="ym-composer__meta">
            <span className="ym-kicker">应用内会话</span>
            <span className="ym-composer__hint">
              {pending || queueSize > 0 ? "发送前会合并短时间内的多条消息" : "Enter 发送 · Shift+Enter 换行"}
            </span>
          </div>
        </div>
      </main>

      {/* ===== 覆盖层：底层页面与滚动位置保持不变 ===== */}
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
      {showSurvey && <SurveyDialog onClose={() => setShowSurvey(false)} />}
      {showNapCat && <NapCatSetup onBack={() => setShowNapCat(false)} />}
      {showWeChat && <WeChatSetup onBack={() => setShowWeChat(false)} />}

      <Dialog.Root open={showSearch} onOpenChange={(open) => { if (!open) { setShowSearch(false); setSearched(false); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="ym-scrim" />
          <Dialog.Content className="ym-dialog ym-dialog--wide dn-acrylic dn-elevation-3">
            <header className="ym-dialog__head">
              <div>
                <Dialog.Title className="ym-dialog__title">搜索聊天记录</Dialog.Title>
                <Dialog.Description className="ym-dialog__desc">
                  同时检索本地保存的历史记录与当前会话
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button type="button" className="ym-icon-btn ym-focus" aria-label="关闭搜索">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </Dialog.Close>
            </header>

            <div className="ym-search">
              <div className="ym-search__bar">
                <input
                  type="search"
                  className="ym-field ym-focus"
                  placeholder="输入至少 2 个字符"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && searchQuery.trim().length >= 2) doSearch(searchQuery); }}
                  aria-label="搜索关键词"
                />
                <Button variant="primary" onClick={() => doSearch(searchQuery)} disabled={searchQuery.trim().length < 2}>
                  搜索
                </Button>
              </div>

              <div className="ym-search__results">
                {searchHits.map((hit, i) => (
                  <article key={`${hit.timestamp}-${i}`} className="ym-hit">
                    <div className="ym-hit__meta">
                      <span className="ym-kicker">{hit.role === "user" ? "我" : name}</span>
                      <span className="ym-kicker">{new Date(hit.timestamp).toLocaleString("zh-CN")}</span>
                    </div>
                    <p className="ym-hit__text">{hit.snippet}</p>
                  </article>
                ))}
                {searched && searchHits.length === 0 && (
                  <p className="ym-empty">没有匹配的消息</p>
                )}
                {!searched && (
                  <p className="ym-empty">输入关键词后按 Enter 或点击搜索</p>
                )}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
