import type { ReactNode, CSSProperties } from "react";

/**
 * 面板 —— DNDL 层级语言。
 *
 * variant="surface"（默认）：Level 1 实色 Surface，用于页面内区块。
 * variant="solid"：同样是不透明 Surface，用于表单/列表内的紧凑区块。
 * variant="acrylic"：Level 3 覆盖层材质，必须叠加在不透明回退之上
 *   （回退逻辑在 materials.css 的 .dn-acrylic 内，随浏览器能力和用户偏好切换）。
 *
 * 保留 variant="glass" 作为 acrylic 的旧名，避免破坏既有引用。
 */
type Variant = "surface" | "solid" | "acrylic" | "glass";

interface GlassCardProps {
  children: ReactNode;
  variant?: Variant;
  /** Tailwind 内边距类，覆盖 variant 默认值 */
  padding?: string;
  className?: string;
  style?: CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}

export function GlassCard({
  children,
  variant = "surface",
  padding,
  className = "",
  style,
  onClick,
}: GlassCardProps) {
  const interactiveProps = onClick
    ? {
        role: "button" as const,
        tabIndex: 0,
        onClick,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(e as unknown as React.MouseEvent);
          }
        },
      }
    : {};

  const isAcrylic = variant === "acrylic" || variant === "glass";
  const defaultPadding = variant === "solid" ? "p-4" : "p-6";

  return (
    <div
      className={[
        isAcrylic ? "dn-acrylic dn-elevation-3" : "ym-panel",
        onClick ? "ym-focus cursor-pointer" : "",
        className,
      ].filter(Boolean).join(" ")}
      style={style}
      {...interactiveProps}
    >
      <div className={padding ?? defaultPadding}>{children}</div>
    </div>
  );
}

/** 面板/弹窗标题栏：左侧标题 + 右侧关闭按钮（≥44px 触控目标） */
interface HeaderProps {
  title: string;
  onClose: () => void;
  /** 标题右侧的补充说明，例如当前所在产品区域 */
  meta?: ReactNode;
}

export function CardHeader({ title, onClose, meta }: HeaderProps) {
  return (
    <div
      className="flex items-center justify-between gap-4 border-b border-border"
      style={{ padding: "14px 20px", WebkitAppRegion: "no-drag" }}
    >
      <div className="min-w-0 flex flex-col">
        <h3 className="text-base font-medium truncate">{title}</h3>
        {meta && <span className="ym-kicker text-muted-foreground">{meta}</span>}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="ym-icon-btn ym-focus"
        aria-label="关闭"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

/**
 * 覆盖层遮罩：不透明遮罩（--dn-overlay），不使用模糊，
 * 底层页面保持原样不清空（关闭后状态与滚动位置不变）。
 */
interface OverlayProps {
  children: ReactNode;
  onClose: () => void;
  offset?: string;
}

export function DialogOverlay({ children, onClose, offset = "pt-20" }: OverlayProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center ${offset} fade-in`}
      style={{ background: "var(--dn-overlay)", WebkitAppRegion: "no-drag" }}
      onClick={onClose}
    >
      {children}
    </div>
  );
}
