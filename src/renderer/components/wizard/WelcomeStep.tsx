import { Flex, Text, Heading, Button, Callout } from "@radix-ui/themes";
import { MessageCircle, AlertTriangle } from "lucide-react";

export default function WelcomeStep({ next }: { next: () => void }) {
  return (
    <Flex direction="column" gap="6">
      <Flex direction="column" align="center" gap="4">
        <Flex
          width="64px" height="64px" align="center" justify="center"
          style={{ borderRadius: "var(--radius-4)", background: "var(--accent-3)" }}
        >
          <MessageCircle size={28} color="var(--accent-9)" />
        </Flex>

        <Flex direction="column" align="center" gap="2">
          <Heading
            size="6"
            style={{ color: "var(--foreground)" }}
          >
            梦间 / Yumema
          </Heading>
          <Text size="2" color="gray">设置一个属于你的桌面聊天空间</Text>
        </Flex>

        <Text size="2" color="gray" align="center" style={{ maxWidth: 280 }}>
          你可以设置资料、说话方式和记忆，并选择应用内、QQ 或微信作为聊天入口。接下来 16 步完成配置。
        </Text>

        <Flex gap="2" style={{ fontSize: 12, color: "var(--gray-10)" }}>
          <span>选择性格</span>
          <span>→</span>
          <span>选择模型</span>
          <span>→</span>
          <span>连接平台</span>
        </Flex>
      </Flex>

      <Callout.Root color="amber">
        <Callout.Icon>
          <AlertTriangle size={16} />
        </Callout.Icon>
        <Callout.Text>
          <Flex direction="column" gap="2">
            <Text weight="medium" size="1">使用前请阅读</Text>
            <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12, lineHeight: 1.6 }}>
              <li>模型生成内容不代表作者立场，仅供学习娱乐</li>
              <li>QQ 使用第三方协议，建议使用小号</li>
              <li>模型服务可能按量计费，频繁聊天会产生费用</li>
              <li>请勿透露身份证、银行卡等敏感信息</li>
              <li>应用内伴侣不能替代真实人际关系</li>
            </ul>
          </Flex>
        </Callout.Text>
      </Callout.Root>

      <Flex direction="column" gap="3">
        <Button size="4" onClick={next} style={{ width: "100%" }}>
          开始设置
        </Button>
        <Text size="1" color="gray" align="center">16 步配置，按需填写即可</Text>
      </Flex>
    </Flex>
  );
}
