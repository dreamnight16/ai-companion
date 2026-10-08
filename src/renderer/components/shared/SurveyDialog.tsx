import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import ToggleTag from "../shared/ToggleTag";

const STORAGE_KEY = "yumema_survey";
const TRIGGER_COUNT = 20;
const DISMISS_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export function shouldShowSurvey(): boolean {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (data.dismissed) {
      const dismissedAt = data.dismissedAt || 0;
      if (Date.now() - dismissedAt < DISMISS_DURATION) return false;
      data.dismissed = false;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    const count = data.msgCount || 0;
    return count >= TRIGGER_COUNT && !data.submitted;
  } catch {
    return false;
  }
}

export function incrementMsgCount() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    data.msgCount = (data.msgCount || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // 本地计数失败不影响聊天
  }
}

/** 满意度量表：数字 + 文字标签，键盘可用，不只靠颜色或图形 */
const RATINGS = [
  { value: 1, label: "很差" },
  { value: 2, label: "不太好" },
  { value: 3, label: "一般" },
  { value: 4, label: "不错" },
  { value: 5, label: "很棒" },
];

const FEATURES = ["应用内聊天", "QQ 机器人", "微信机器人"];
const PROBLEMS = [
  "QQ 无法连接",
  "回复答非所问",
  "回复太慢",
  "软件闪退/卡死",
  "安装失败",
  "设置太复杂",
  "界面不好看",
];

export default function SurveyDialog({ onClose }: { onClose: () => void }) {
  const [satisfaction, setSatisfaction] = useState(0);
  const [features, setFeatures] = useState<string[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [otherProblem, setOtherProblem] = useState("");
  const [missing, setMissing] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggle = (list: string[], set: (v: string[]) => void, item: string) => {
    set(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleSubmit = async () => {
    try {
      await window.api.submitSurvey({
        satisfaction,
        features,
        problems: otherProblem ? [...problems, otherProblem] : problems,
        missing,
        notes,
      });
    } catch {
      // 反馈即便发送失败也保留本地状态，避免重复打扰
    }
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      data.submitted = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
    setSubmitted(true);
  };

  const handleDismiss = () => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      data.dismissed = true;
      data.dismissedAt = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
    onClose();
  };

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="ym-scrim" />
        <Dialog.Content className="ym-dialog dn-acrylic dn-elevation-3">
          <header className="ym-dialog__head">
            <div>
              <Dialog.Title className="ym-dialog__title">
                {submitted ? "感谢你的反馈" : "帮助我们改进"}
              </Dialog.Title>
              <Dialog.Description className="ym-dialog__desc">
                {submitted ? "反馈已经记录，会用于后续版本" : "关于使用体验的几个问题，都是选填"}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="ym-icon-btn ym-focus" aria-label="关闭反馈">
                <X size={16} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </header>

          {submitted ? (
            <div className="ym-setup-panel">
              <p className="ym-note">
                你的意见会帮助我们让 Yumema 变得更好。如果还想补充，可以随时从侧栏重新打开反馈。
              </p>
              <button type="button" className="ym-btn ym-btn--primary ym-focus" onClick={onClose}>完成</button>
            </div>
          ) : (
            <>
              <div className="ym-setup-panel" style={{ overflowY: "auto" }}>
                <section className="ym-form">
                  <h3 className="ym-section-title">你对 Yumema 的整体感受？</h3>
                  <div className="ym-rating" role="group" aria-label="整体满意度">
                    {RATINGS.map((r) => (
                      <ToggleTag
                        key={r.value}
                        active={satisfaction === r.value}
                        onClick={() => setSatisfaction(r.value)}
                        size="lg"
                      >
                        {r.value} · {r.label}
                      </ToggleTag>
                    ))}
                  </div>
                </section>

                <section className="ym-form">
                  <h3 className="ym-section-title">你主要使用哪些功能？</h3>
                  <div className="ym-form__tags">
                    {FEATURES.map((f) => (
                      <ToggleTag key={f} active={features.includes(f)} onClick={() => toggle(features, setFeatures, f)}>
                        {f}
                      </ToggleTag>
                    ))}
                  </div>
                </section>

                <section className="ym-form">
                  <h3 className="ym-section-title">遇到了哪些问题？</h3>
                  <div className="ym-form__tags">
                    {PROBLEMS.map((p) => (
                      <ToggleTag key={p} active={problems.includes(p)} onClick={() => toggle(problems, setProblems, p)} variant="destructive">
                        {p}
                      </ToggleTag>
                    ))}
                  </div>
                  <input
                    type="text"
                    aria-label="其他问题"
                    value={otherProblem}
                    onChange={(e) => setOtherProblem(e.target.value)}
                    placeholder="其他问题..."
                    className="ym-field ym-focus"
                  />
                </section>

                <section className="ym-form">
                  <h3 className="ym-section-title">缺少什么功能？</h3>
                  <input
                    type="text"
                    aria-label="缺少的功能"
                    value={missing}
                    onChange={(e) => setMissing(e.target.value)}
                    placeholder="例如：语音消息、多语言..."
                    className="ym-field ym-focus"
                  />
                </section>

                <section className="ym-form">
                  <h3 className="ym-section-title">还有什么想说的？</h3>
                  <textarea
                    aria-label="补充说明"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="任何想法都可以告诉我们..."
                    rows={3}
                    className="ym-field ym-focus"
                  />
                </section>
              </div>

              <div className="ym-dialog__actions">
                <button
                  type="button"
                  className="ym-btn ym-btn--primary ym-focus"
                  onClick={handleSubmit}
                  disabled={satisfaction === 0}
                >
                  提交反馈
                </button>
                <button type="button" className="ym-btn ym-btn--ghost ym-focus" onClick={handleDismiss}>
                  不再提示
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
