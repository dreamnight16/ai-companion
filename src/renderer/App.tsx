import { HashRouter, Routes, Route } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import SetupWizard from "./pages/SetupWizard";
import ChatWindow from "./pages/ChatWindow";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/shared/ErrorBoundary";

/**
 * 应用根：DNDL v1.0 是浅色品牌基准，界面固定使用品牌浅色主题。
 * 品牌色板与核心语言不在产品内改动，产品自定义的只有布局与信息密度。
 */
export default function App() {
  return (
    <ErrorBoundary>
      <Theme
        accentColor="teal"
        grayColor="sage"
        radius="none"
        scaling="100%"
        appearance="light"
      >
        <HashRouter>
          <Routes>
            <Route path="/setup" element={<SetupWizard />} />
            <Route path="/chat" element={<ChatWindow />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </Theme>
    </ErrorBoundary>
  );
}
