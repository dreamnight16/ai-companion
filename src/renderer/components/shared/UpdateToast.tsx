import { useState, useEffect } from "react";
import { GlassCard } from "../ui/GlassCard";

/** 更新提示 —— Level 3 覆盖层，进度用真实下载百分比 */
export default function UpdateToast() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [version, setVersion] = useState<string>("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unsub = window.api.on("app:update-status", (data: unknown) => {
      const d = data as { type: string; message?: string; version?: string; percent?: number };
      switch (d.type) {
        case "available":
          setVersion(d.version || "");
          setStatus("available");
          setVisible(true);
          break;
        case "not-available":
          setVisible(false);
          break;
        case "progress":
          setStatus("downloading");
          setProgress(Math.round(d.percent || 0));
          break;
        case "downloaded":
          setStatus("downloaded");
          break;
        case "error":
          setStatus("error");
          setTimeout(() => setVisible(false), 3000);
          break;
      }
    });
    return unsub;
  }, []);

  const handleDownload = async () => {
    setStatus("downloading");
    await window.api.downloadUpdate();
  };

  const handleInstall = () => {
    window.api.installUpdate();
  };

  if (!visible) return null;

  return (
    <div className="ym-toast" role="status" aria-live="polite">
      <GlassCard variant="acrylic" padding="p-4">
        <div className="ym-toast__row">
          <div className="ym-toast__text">
            {status === "available" && (
              <p className="ym-kicker">发现新版本 v{version}</p>
            )}
            {status === "downloading" && (
              <>
                <p className="ym-kicker">正在下载更新 {progress}%</p>
                <div
                  className="ym-progress"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="下载进度"
                >
                  <span style={{ width: `${progress}%` }} />
                </div>
              </>
            )}
            {status === "downloaded" && (
              <p className="ym-kicker">更新已下载，重启后安装</p>
            )}
            {status === "error" && (
              <p className="ym-alert ym-alert--danger" role="alert">更新检查失败</p>
            )}
          </div>

          <div className="ym-toast__actions">
            {status === "available" && (
              <>
                <button type="button" className="ym-btn ym-btn--primary ym-btn--sm ym-focus" onClick={handleDownload}>下载</button>
                <button type="button" className="ym-btn ym-btn--ghost ym-btn--sm ym-focus" onClick={() => setVisible(false)}>稍后</button>
              </>
            )}
            {status === "downloaded" && (
              <button type="button" className="ym-btn ym-btn--primary ym-btn--sm ym-focus" onClick={handleInstall}>重启</button>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
