import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: string;
}

/** 错误兜底 —— 明确的状态色块 + 可读的原因，不使用装饰性容器 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary]", error.message);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="ym-notfound">
          <span className="ym-state-block ym-state-block--danger" role="alert">
            <AlertTriangle size={22} aria-hidden="true" />
            <span className="ym-state-block__title">界面出错了</span>
          </span>
          <p className="ym-kicker">错误详情</p>
          <p className="ym-notfound__text" style={{ wordBreak: "break-word" }}>
            {this.state.error || "未知错误"}
          </p>
          <p className="ym-note">
            可以重启应用重试。如果反复出现，请在侧栏打开反馈并描述复现步骤。
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
