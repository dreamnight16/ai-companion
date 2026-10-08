import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="ym-notfound">
      <Compass size={28} aria-hidden="true" />
      <p className="ym-kicker">梦的边界</p>
      <h1 className="ym-notfound__code">404</h1>
      <p className="ym-notfound__text">
        这个地址没有对应的页面。你可以回到会话继续聊天，或重新完成一次初始化设置。
      </p>
      <div className="ym-form__row">
        <Link to="/chat" className="ym-btn ym-btn--primary ym-focus">回到会话</Link>
        <Link to="/setup" className="ym-btn ym-btn--outline ym-focus">重新设置</Link>
      </div>
    </div>
  );
}
