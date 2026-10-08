import { AlertTriangle } from "lucide-react";

/** 起始步骤 —— 用排版表达产品定位与接下来的路径 */
export default function WelcomeStep({ next }: { next: () => void }) {
  return (
    <div className="ym-form">
      <span className="ym-kicker">梦间 / Yumema</span>
      <h1 className="ym-hero">
        一个安静的桌面空间，
        <br />
        用来聊天、整理记忆和设置日常互动。
      </h1>
      <p className="ym-note">
        你可以设置资料、说话方式和记忆，并选择应用内、QQ 或微信作为聊天入口。
        接下来的 16 步按需填写，创建后仍可以随时修改。
      </p>

      <ol className="ym-path">
        <li><span className="ym-kicker">01</span> 选择性格与说话方式</li>
        <li><span className="ym-kicker">02</span> 选择模型服务</li>
        <li><span className="ym-kicker">03</span> 连接聊天平台</li>
      </ol>

      <div className="ym-alert">
        <AlertTriangle size={16} aria-hidden="true" />
        <div>
          <p className="ym-alert__title">使用前请阅读</p>
          <ul className="ym-alert__list">
            <li>模型生成内容不代表作者立场，仅供学习娱乐</li>
            <li>QQ 接入使用第三方协议，建议使用小号</li>
            <li>模型服务可能按量计费，频繁聊天会产生费用</li>
            <li>请勿透露身份证、银行卡等敏感信息</li>
            <li>应用内伴侣不能替代真实的人际关系</li>
          </ul>
        </div>
      </div>

      <button type="button" className="ym-btn ym-btn--primary ym-btn--lg ym-focus" onClick={next}>
        开始设置
      </button>
    </div>
  );
}
