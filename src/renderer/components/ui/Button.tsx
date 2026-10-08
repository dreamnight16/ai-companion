import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * 按钮 —— DNDL 直角几何 + 品牌实色色块。
 *
 * 主操作是实色 Teal 色块，文字使用 --dn-text-on-color；
 * 次要操作使用 Surface + 可辨识边界；危险操作使用 Crimson 实色。
 * 不再经由 Radix Themes 取色，避免品牌色与组件库色板不一致。
 */
type Variant =
  | "default" | "primary" | "solid"
  | "secondary" | "soft"
  | "outline" | "ghost" | "link"
  | "destructive" | "danger";

type Size = "default" | "sm" | "lg" | "icon";

const VARIANT_CLASS: Record<string, string> = {
  default: "ym-btn ym-btn--primary",
  primary: "ym-btn ym-btn--primary",
  solid: "ym-btn ym-btn--primary",
  secondary: "ym-btn ym-btn--secondary",
  soft: "ym-btn ym-btn--soft",
  outline: "ym-btn ym-btn--outline",
  ghost: "ym-btn ym-btn--ghost",
  link: "ym-btn ym-btn--link",
  destructive: "ym-btn ym-btn--danger",
  danger: "ym-btn ym-btn--danger",
};

const SIZE_CLASS: Record<string, string> = {
  sm: "ym-btn--sm",
  default: "ym-btn--md",
  lg: "ym-btn--lg",
  icon: "ym-btn--icon",
};

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  variant?: Variant | string;
  size?: Size | string;
  loading?: boolean;
  iconOnly?: boolean;
  /** Radix 时代的遗留属性，本组件忽略（颜色由语义 variant 决定） */
  color?: string;
  children?: ReactNode;
}

const Button = ({
  variant = "primary",
  size = "default",
  loading,
  disabled,
  iconOnly,
  color: _color,
  className = "",
  children,
  ...props
}: ButtonProps) => {
  const classes = [
    VARIANT_CLASS[variant] ?? VARIANT_CLASS.primary,
    SIZE_CLASS[iconOnly ? "icon" : size] ?? SIZE_CLASS.default,
    "ym-focus",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? "处理中…" : children}
    </button>
  );
};
Button.displayName = "Button";

export { Button };
export type { ButtonProps };
export default Button;
