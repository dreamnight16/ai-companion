import { AlertTriangle, MessageCircle } from "lucide-react";
import { useSetupWizard } from "../hooks/useSetupWizard";
import { usePlatform } from "../hooks/usePlatform";
import WelcomeStep from "../components/wizard/WelcomeStep";
import QuickStartStep from "../components/wizard/QuickStartStep";
import PartnerNameStep from "../components/wizard/PartnerNameStep";
import PartnerDescriptionStep from "../components/wizard/PartnerDescriptionStep";
import UserGenderStep from "../components/wizard/UserGenderStep";
import PartnerGenderStep from "../components/wizard/PartnerGenderStep";
import RelationshipTypeStep from "../components/wizard/RelationshipTypeStep";
import RelationshipModeStep from "../components/wizard/RelationshipModeStep";
import TimezoneStep from "../components/wizard/TimezoneStep";
import UserCityStep from "../components/wizard/UserCityStep";
import NicknameStep from "../components/wizard/NicknameStep";
import SpeakingStyleStep from "../components/wizard/SpeakingStyleStep";
import MemeStyleStep from "../components/wizard/MemeStyleStep";
import AIProviderStep from "../components/wizard/AIProviderStep";
import PlatformSetupStep from "../components/wizard/PlatformSetupStep";
import SummaryStep from "../components/wizard/SummaryStep";

/** 步骤顺序与标签 —— 与下面的组件数组一一对应，用于左侧的定位信息 */
const STEPS = [
  { Component: WelcomeStep, group: "开始", label: "关于梦间" },
  { Component: QuickStartStep, group: "开始", label: "角色模板" },
  { Component: PartnerNameStep, group: "角色", label: "名字" },
  { Component: PartnerDescriptionStep, group: "角色", label: "角色卡" },
  { Component: UserGenderStep, group: "关系", label: "你的性别" },
  { Component: PartnerGenderStep, group: "关系", label: "TA 的性别" },
  { Component: RelationshipTypeStep, group: "关系", label: "关系类型" },
  { Component: RelationshipModeStep, group: "关系", label: "相处模式" },
  { Component: TimezoneStep, group: "日常", label: "时区" },
  { Component: UserCityStep, group: "日常", label: "城市" },
  { Component: NicknameStep, group: "日常", label: "称呼" },
  { Component: SpeakingStyleStep, group: "说话方式", label: "说话习惯" },
  { Component: MemeStyleStep, group: "说话方式", label: "梗风格" },
  { Component: AIProviderStep, group: "服务", label: "模型服务" },
  { Component: PlatformSetupStep, group: "服务", label: "聊天平台" },
  { Component: SummaryStep, group: "服务", label: "确认并创建" },
];

export default function SetupWizard() {
  const platform = usePlatform();
  const wizard = useSetupWizard();
  const { step, canNext, back, next, transitioning, transitionTimedOut, saveProfile } = wizard;
  const { Component: StepComponent, group, label } = STEPS[step];
  const total = STEPS.length;
  const topInset = platform === "darwin" ? 56 : 28;

  if (transitioning) {
    return (
      <div className="ym-setup ym-setup--busy">
        <div className="ym-setup__rail">
          <span className="ym-kicker" style={{ opacity: 0.85 }}>梦间 / Yumema</span>
          <p className="ym-setup__rail-title">
            {transitionTimedOut ? "启动超时" : "正在准备聊天空间"}
          </p>
          <p className="ym-setup__rail-note">
            {transitionTimedOut
              ? "窗口切换可能未响应，可以重试或重新打开应用。"
              : "资料已经保存，正在打开聊天窗口。"}
          </p>
        </div>
        <div className="ym-setup__body" role="status" aria-live="polite">
          <div className="ym-setup__content">
            {transitionTimedOut ? (
              <>
                <p className="ym-alert">
                  <AlertTriangle size={16} aria-hidden="true" />
                  窗口切换没有完成
                </p>
                <button type="button" className="ym-btn ym-btn--primary ym-btn--lg ym-focus" onClick={saveProfile}>
                  重试打开聊天窗口
                </button>
              </>
            ) : (
              <p className="ym-setup__status">
                <MessageCircle size={16} aria-hidden="true" />
                一切准备就绪
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ym-setup">
      {/* 左：品牌实色色块，用排版表达「走到第几步、这一步在做什么」 */}
      <aside className="ym-setup__rail" style={{ paddingTop: topInset }}>
        <span className="ym-kicker" style={{ opacity: 0.85 }}>梦间 / Yumema</span>

        <p className="ym-setup__step-group ym-kicker">{group}</p>

        <p className="ym-setup__step-number">
          <span className="ym-setup__step-current">{String(step + 1).padStart(2, "0")}</span>
          <span className="ym-setup__step-total">/{String(total).padStart(2, "0")}</span>
        </p>

        <p className="ym-setup__step-label">{label}</p>

        <ol className="ym-setup__scale" aria-label="设置进度">
          {STEPS.map((s, i) => (
            <li
              key={s.label}
              className="ym-setup__mark"
              data-state={i === step ? "current" : i < step ? "done" : "todo"}
              title={`${i + 1}. ${s.group} · ${s.label}`}
            >
              <span className="sr-only">
                {i + 1}. {s.group} · {s.label}
                {i === step ? "（当前）" : i < step ? "（已完成）" : "（未开始）"}
              </span>
            </li>
          ))}
        </ol>

        <p className="ym-setup__rail-note">
          16 步都按需填写，创建后仍可在设置里修改角色卡、模型与记忆。
        </p>
      </aside>

      {/* 右：内容区，步骤内容直接落在 Canvas 上，不再套一层装饰容器 */}
      <div className="ym-setup__body">
        <div className="ym-setup__content">
          <div className="fade-in" key={step}>
            {/* 各步骤按需取用向导状态；与既有实现一致地透传整个 wizard 对象 */}
            <StepComponent {...(wizard as any)} />
          </div>
        </div>

        <div className="ym-setup__actions">
          <div className="ym-setup__actions-inner">
            <div>
              {step > 0 && (
                <button type="button" className="ym-btn ym-btn--ghost ym-focus" onClick={back}>
                  ← 上一步
                </button>
              )}
            </div>
            <span className="ym-kicker" aria-hidden="true">
              {step + 1} / {total}
            </span>
            <div>
              {step < total - 1 && (
                <button
                  type="button"
                  className="ym-btn ym-btn--primary ym-focus"
                  onClick={next}
                  disabled={!canNext}
                >
                  下一步
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
