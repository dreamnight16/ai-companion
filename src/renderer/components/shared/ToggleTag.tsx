import type { ReactNode } from "react";
import { Check } from "lucide-react";

/**
 * 可选标签 —— DNDL 直角 + 品牌实色。
 * 选中状态同时用「填充色块 + 前置勾选标记 + aria-pressed」表达，不只靠颜色。
 */
type TagVariant = "primary" | "destructive" | "violet" | "amber" | "rose" | "emerald";

const variantClass: Record<TagVariant, string> = {
  primary: "ym-tag--primary",
  destructive: "ym-tag--crimson",
  violet: "ym-tag--violet",
  amber: "ym-tag--amber",
  rose: "ym-tag--orange",
  emerald: "ym-tag--emerald",
};

interface ToggleTagProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  variant?: TagVariant;
  size?: "sm" | "md" | "lg";
}

export default function ToggleTag({
  active,
  onClick,
  children,
  variant = "primary",
  size = "md",
}: ToggleTagProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        "ym-tag ym-focus",
        `ym-tag--${size}`,
        active ? variantClass[variant] : "ym-tag--idle",
      ].join(" ")}
    >
      {active && <Check size={14} aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}
