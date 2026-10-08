import * as React from "react";
import { cn } from "src/renderer/lib/utils";

/**
 * 输入框 —— 直角、Surface 底、可辨识边界（--dn-control-border），
 * 焦点环使用 DNDL 焦点色。
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input ref={ref} type={type} className={cn("ym-field ym-focus", className)} {...props} />
  ),
);
Input.displayName = "Input";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn("ym-field ym-focus", className)} {...props} />
));
Textarea.displayName = "Textarea";

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  /** 输入控件的 id，用于把 label 与控件关联 */
  htmlFor?: string;
}

function Field({ label, hint, error, children, className = "", htmlFor }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label htmlFor={htmlFor} className="ym-kicker text-muted-foreground">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p className="text-xs flex items-start gap-1.5" role="alert">
          <span aria-hidden="true" className="ym-error-mark">!</span>
          <span className="text-foreground">{error}</span>
        </p>
      )}
    </div>
  );
}

export { Input, Textarea, Field };
