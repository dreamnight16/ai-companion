import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import CardSelect from "../shared/CardSelect";

export default function RelationshipModeStep({
  data, update, riskRead, setRiskRead,
}: {
  data: { relationshipMode: "direct" | "slow_burn" };
  update: (d: Partial<{ relationshipMode: string }>) => void;
  riskRead: boolean;
  setRiskRead: (v: boolean) => void;
}) {
  const [showRisk, setShowRisk] = useState(false);

  const options = [
    { value: "direct" as const, label: "直接成为情侣", desc: "上来就是恋人，甜蜜日常" },
    { value: "slow_burn" as const, label: "养成模式", desc: "从陌生人开始，慢慢培养感情" },
  ];

  return (
    <div className="ym-form">
      <header className="ym-step-head">
        <h2 className="ym-step-title">你希望怎么开始你们的关系？</h2>
        <p className="ym-note">选择你们故事的起点，之后可以随时在设置中调整。</p>
      </header>

      <CardSelect options={options} value={data.relationshipMode} onChange={(v) => update({ relationshipMode: v })} />

      <section className="ym-panel ym-form" style={{ padding: "var(--ym-space-4)" }}>
        <button
          type="button"
          className="ym-disclosure ym-focus"
          aria-expanded={showRisk}
          onClick={() => setShowRisk(!showRisk)}
        >
          <span className="ym-disclosure__label">
            <AlertTriangle size={16} aria-hidden="true" />
            重要风险提示（请务必阅读）
          </span>
          <span className="ym-disclosure__chevron" aria-hidden="true" data-open={showRisk}>▾</span>
        </button>

        {showRisk && (
          <div className="ym-form" style={{ paddingTop: "var(--ym-space-3)" }}>
            <p className="ym-note"><strong>先说清楚：</strong>模型生成的内容只代表这次对话，不代表作者立场；软件用于学习和娱乐。</p>
            <p className="ym-note"><strong>账号安全：</strong>QQ 接入使用第三方协议，存在被封号风险，强烈建议使用小号。</p>
            <p className="ym-note"><strong>费用：</strong>模型服务可能按量收费，聊得多就会多花一些。</p>
            <p className="ym-note"><strong>情感健康：</strong>TA 是软件里的对话角色，不能替代现实中的关系和陪伴。</p>
            <p className="ym-note"><strong>隐私：</strong>消息会发给你选择的服务商处理，请不要放入身份证、银行卡等敏感信息。</p>

            <label className="ym-checkbox">
              <input
                type="checkbox"
                checked={riskRead}
                onChange={(e) => setRiskRead(e.target.checked)}
              />
              <span>我已阅读并理解以上风险提示</span>
            </label>
          </div>
        )}
      </section>
    </div>
  );
}
