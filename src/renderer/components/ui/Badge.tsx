import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "src/renderer/lib/utils";

/**
 * 标签 —— 直角，颜色表示类别，状态同时用文字说明。
 * 底色为品牌色的浅色派生，文字使用 --dn-text-primary 以保证 4.5:1。
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 border text-xs font-medium px-2.5 py-1",
  {
    variants: {
      variant: {
        default: "bg-muted text-foreground border-border",
        primary: "border-transparent ym-on-color",
        secondary: "bg-secondary text-foreground border-border",
        success: "border-transparent ym-badge-emerald",
        warning: "border-transparent ym-badge-amber",
        destructive: "border-transparent ym-badge-crimson",
        error: "border-transparent ym-badge-crimson",
        outline: "bg-transparent text-foreground border-border",
      },
      size: {
        sm: "px-2.5 py-1 text-xs",
        md: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: { variant: "default", size: "sm" },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** 状态点；颜色之外仍有文字，不依赖颜色单独表意 */
  dot?: boolean;
}

const dotClass: Record<string, string> = {
  default: "ym-status-dot",
  primary: "ym-status-dot",
  secondary: "ym-status-dot",
  success: "ym-status-dot ym-status-dot--on",
  warning: "ym-status-dot ym-status-dot--warn",
  destructive: "ym-status-dot ym-status-dot--danger",
  error: "ym-status-dot ym-status-dot--danger",
  outline: "ym-status-dot",
};

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), variant === "primary" && "bg-primary", className)} {...props}>
      {dot && <span aria-hidden="true" className={cn(dotClass[variant ?? "default"])} />}
      {children}
    </div>
  );
}

export default Badge;
export { Badge, badgeVariants };
