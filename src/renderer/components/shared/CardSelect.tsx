import { Check } from "lucide-react";

interface Option<T extends string> {
  value: T;
  label: string;
  desc?: string;
  icon?: string;
}

/**
 * 选项块 —— 用信息本身构成界面：标题、说明、选中标记。
 * 选中态用品牌色左侧量尺 + 浅色底 + 勾选标记，不只靠颜色。
 */
export default function CardSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2" role="radiogroup">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            data-active={active}
            className="ym-option ym-focus"
          >
            <span className="ym-option__rule" aria-hidden="true" />
            <span className="ym-option__body">
              <span className="ym-option__label">{opt.label}</span>
              {opt.desc && <span className="ym-option__desc">{opt.desc}</span>}
            </span>
            {active && (
              <span className="ym-option__mark" aria-hidden="true">
                <Check size={16} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
