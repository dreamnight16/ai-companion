import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Container, X } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  stopped: "未启动",
  checking: "正在检查 Docker",
  pulling: "正在拉取镜像",
  starting: "正在启动容器",
  "waiting-qr": "等待服务就绪",
  connected: "运行中",
  error: "启动失败",
  "no-docker": "未检测到 Docker",
};

const STATUS_TONE: Record<string, string> = {
  connected: "ym-state-block--ok",
  error: "ym-state-block--danger",
  "no-docker": "ym-state-block--warn",
  stopped: "ym-state-block--idle",
};

export default function WeChatSetup({ onBack }: { onBack: () => void }) {
  const [status, setStatus] = useState<Record<string, unknown>>({ status: "stopped", message: "" });

  useEffect(() => {
    window.api.getWeChatStatus().then((s: unknown) => setStatus(s as Record<string, unknown>));
    const unsub = window.api.on("wechat:status-changed", (s: unknown) => {
      setStatus(s as Record<string, unknown>);
    });
    return () => { unsub(); };
  }, []);

  const handleStart = async () => {
    const result = await window.api.startWeChat();
    if (!(result as { success: boolean }).success) {
      setStatus({ status: "error", message: (result as { error: string }).error });
    }
  };

  const handleStop = async () => {
    await window.api.stopWeChat();
  };

  const s = status.status as string;
  const isWorking = ["checking", "pulling", "starting"].includes(s);
  const tone = STATUS_TONE[s] ?? "ym-state-block--busy";
  const message = (status.message as string) || "";

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onBack(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="ym-scrim" />
        <Dialog.Content className="ym-dialog dn-acrylic dn-elevation-3">
          <header className="ym-dialog__head">
            <div>
              <Dialog.Title className="ym-dialog__title">微信登录</Dialog.Title>
              <Dialog.Description className="ym-dialog__desc">
                通过 Docker 运行 Gewechat 服务接入微信
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="ym-icon-btn ym-focus" aria-label="关闭微信登录">
                <X size={16} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </header>

          <div className="ym-setup-panel">
            <div className={`ym-state-block ${tone}`} role="status" aria-live="polite">
              <Container size={22} aria-hidden="true" />
              <div>
                <p className="ym-state-block__title">{STATUS_LABEL[s] || s}</p>
                {message && <p className="ym-state-block__note">{message}</p>}
              </div>
            </div>

            {isWorking && (
              <p className="ym-note" role="status">
                正在自动准备 Gewechat 容器，首次运行需要拉取镜像，请保持网络畅通。
              </p>
            )}

            {s === "waiting-qr" && (
              <p className="ym-note">服务启动中，请确认 Docker Desktop 正在运行。</p>
            )}

            {s === "connected" && (
              <div className="ym-form">
                <p className="ym-note">微信适配服务正在运行，可以回到会话继续聊天。</p>
                <div className="ym-form__row">
                  <button type="button" className="ym-btn ym-btn--primary ym-focus" onClick={onBack}>返回会话</button>
                  <button type="button" className="ym-btn ym-btn--ghost ym-focus" onClick={handleStop}>停止服务</button>
                </div>
              </div>
            )}

            {s === "error" && (
              <div className="ym-form">
                <p className="ym-alert ym-alert--danger" role="alert">{message || "启动失败"}</p>
                <button type="button" className="ym-btn ym-btn--primary ym-focus" onClick={handleStart}>重试</button>
              </div>
            )}

            {s === "no-docker" && (
              <div className="ym-form">
                <p className="ym-alert">
                  未检测到 Docker。微信接入需要 Docker 环境运行 Gewechat 服务，请先安装 Docker Desktop。
                </p>
                <button type="button" className="ym-btn ym-btn--primary ym-focus" onClick={handleStart}>重新检测</button>
              </div>
            )}

            {s !== "waiting-qr" && !isWorking && s !== "connected" && s !== "error" && s !== "no-docker" && (
              <div className="ym-form">
                <p className="ym-note">
                  启动后由应用自动运行 Gewechat 容器，需要预先安装 Docker Desktop。
                </p>
                <button type="button" className="ym-btn ym-btn--primary ym-btn--lg ym-focus" onClick={handleStart}>
                  启动微信服务
                </button>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
