import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cat, X } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  stopped: "未启动",
  downloading: "正在下载 NapCatQQ",
  extracting: "正在解压",
  configuring: "正在写入配置",
  starting: "正在启动服务",
  "waiting-qr": "等待扫码登录",
  connected: "已连接",
  error: "启动失败",
};

const STATUS_TONE: Record<string, string> = {
  connected: "ym-state-block--ok",
  error: "ym-state-block--danger",
  stopped: "ym-state-block--idle",
};

export default function NapCatSetup({ onBack }: { onBack: () => void }) {
  const [status, setStatus] = useState<Record<string, unknown>>({ status: "stopped", message: "" });
  const [qrData, setQrData] = useState<string | null>(null);

  useEffect(() => {
    window.api.getNapCatStatus().then((s: unknown) => setStatus(s as Record<string, unknown>));
    const unsub1 = window.api.on("napcat:status-changed", (s: unknown) => {
      setStatus(s as Record<string, unknown>);
    });
    const unsub2 = window.api.on("napcat:qr-ready", (data: unknown) => {
      setQrData((data as { qrData: string }).qrData);
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const handleStart = async () => {
    setQrData(null);
    const result = await window.api.startNapCat();
    if (!(result as { success: boolean }).success) {
      setStatus({ status: "error", message: (result as { error: string }).error });
    }
  };

  const s = status.status as string;
  const isWorking = ["downloading", "extracting", "configuring", "starting"].includes(s);
  const tone = STATUS_TONE[s] ?? "ym-state-block--busy";
  const message = (status.message as string) || "";

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onBack(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="ym-scrim" />
        <Dialog.Content className="ym-dialog dn-acrylic dn-elevation-3">
          <header className="ym-dialog__head">
            <div>
              <Dialog.Title className="ym-dialog__title">QQ 登录</Dialog.Title>
              <Dialog.Description className="ym-dialog__desc">
                通过 NapCatQQ 接入 QQ 私聊与群聊
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="ym-icon-btn ym-focus" aria-label="关闭 QQ 登录">
                <X size={16} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </header>

          <div className="ym-setup-panel">
            <div className={`ym-state-block ${tone}`} role="status" aria-live="polite">
              <Cat size={22} aria-hidden="true" />
              <div>
                <p className="ym-state-block__title">{STATUS_LABEL[s] || s}</p>
                {message && <p className="ym-state-block__note">{message}</p>}
              </div>
            </div>

            {(s === "waiting-qr" || qrData) && (
              <div className="ym-form">
                <p className="ym-note">
                  打开手机 QQ，用「扫一扫」扫描二维码完成登录。扫码前请确认使用的是小号。
                </p>
                <div className="ym-qr" aria-hidden="true">
                  {qrData ? "二维码地址已就绪，请在 NapCatQQ 窗口中扫描" : "正在准备二维码…"}
                </div>
                {qrData && <p className="ym-kicker">登录地址已由 NapCatQQ 提供</p>}
              </div>
            )}

            {isWorking && (
              <p className="ym-note" role="status">
                正在自动准备 NapCatQQ，首次运行需要下载，请保持网络畅通。
              </p>
            )}

            {s === "connected" && (
              <div className="ym-form">
                <p className="ym-note">QQ 已经连接，可以回到会话继续聊天。</p>
                <button type="button" className="ym-btn ym-btn--primary ym-focus" onClick={onBack}>返回会话</button>
              </div>
            )}

            {s === "error" && (
              <div className="ym-form">
                <p className="ym-alert ym-alert--danger" role="alert">{message || "启动失败"}</p>
                <button type="button" className="ym-btn ym-btn--primary ym-focus" onClick={handleStart}>重试</button>
              </div>
            )}

            {s !== "waiting-qr" && !qrData && !isWorking && s !== "connected" && s !== "error" && (
              <div className="ym-form">
                <p className="ym-note">
                  启动后需要扫码登录 QQ。QQ 接入使用第三方协议，存在封号风险，建议使用小号。
                </p>
                <button type="button" className="ym-btn ym-btn--primary ym-btn--lg ym-focus" onClick={handleStart}>
                  启动 NapCatQQ
                </button>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
