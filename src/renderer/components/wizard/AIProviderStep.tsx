import { Input, Field } from "../ui/Input";
import { Flex } from "@radix-ui/themes";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select";
import { Slider } from "../ui/slider";
import CardSelect from "../shared/CardSelect";

const PROVIDERS = [
  { value: "anthropic" as const, label: "Claude (Anthropic)", desc: "适合中文对话、总结和较长的上下文" },
  { value: "openai" as const, label: "OpenAI (GPT 系列)", desc: "生态成熟，适合日常对话和通用任务" },
  { value: "openai-compatible" as const, label: "其他兼容接口", desc: "可接入 DeepSeek、硅基流动等服务" },
  { value: "ollama" as const, label: "Ollama（本地）", desc: "模型运行在自己的设备上，可不填密钥" },
];

const ANTHROPIC_MODELS = [
  { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
  { value: "claude-opus-4-20250514", label: "Claude Opus 4" },
  { value: "claude-haiku-4-20250514", label: "Claude Haiku 4" },
];

const OPENAI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
];

function getModels(provider: string) {
  if (provider === "anthropic") return ANTHROPIC_MODELS;
  if (provider === "openai") return OPENAI_MODELS;
  return [];
}

interface Props {
  data: {
    aiProvider: string;
    aiModel: string;
    aiApiKey: string;
    aiBaseUrl: string;
    aiMaxTokens: number;
    aiTemperature: number;
  };
  update: (d: Partial<{
    aiProvider: string;
    aiModel: string;
    aiApiKey: string;
    aiBaseUrl: string;
    aiMaxTokens: number;
    aiTemperature: number;
  }>) => void;
}

export default function AIProviderStep({ data, update }: Props) {
  const models = getModels(data.aiProvider);
  const isCustomProvider = data.aiProvider === "openai-compatible" || data.aiProvider === "ollama";

  return (
    <Flex direction="column" gap="8">
      <Flex direction="column" gap="2">
        <h2 className="text-lg font-semibold">选择模型服务</h2>
        <p className="text-sm text-muted-foreground">模型只负责生成回复，资料、记忆和聊天记录仍由本地应用管理。</p>
      </Flex>

      <CardSelect
        options={PROVIDERS}
        value={data.aiProvider}
        onChange={(v) => update({ aiProvider: v, aiModel: "" })}
      />

      <Flex direction="column" gap="3">
        {/* Model Select */}
        {!isCustomProvider && models.length > 0 && (
          <Field label="模型">
            <Select
              value={data.aiModel}
              onValueChange={(v) => update({ aiModel: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择模型..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>可用模型</SelectLabel>
                  {models.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        )}

        {isCustomProvider && (
          <Field label="模型名称">
            <Input
              type="text"
              value={data.aiModel}
              onChange={(e) => update({ aiModel: e.target.value })}
              placeholder={data.aiProvider === "ollama" ? "qwen3.5:9b / llama3" : "deepseek-chat / gpt-4o-mini / ..."}
            />
          </Field>
        )}

        <Field label={data.aiProvider === "ollama" ? "API Key（可选）" : "API Key"}>
          <Input
            type="password"
            value={data.aiApiKey}
            onChange={(e) => update({ aiApiKey: e.target.value })}
            placeholder={data.aiProvider === "ollama" ? "本地 Ollama 通常无需密钥" : "sk-..."}
          />
        </Field>

        {isCustomProvider && (
          <div className="fade-in">
            <Field label="API 地址">
              <Input
                type="text"
                value={data.aiBaseUrl}
                onChange={(e) => update({ aiBaseUrl: e.target.value })}
                placeholder={data.aiProvider === "ollama" ? "http://localhost:11434/v1" : "https://api.deepseek.com"}
              />
            </Field>
          </div>
        )}

        {/* Max Tokens Slider */}
        <Field label={`最大输出 Token: ${data.aiMaxTokens}`}>
          <Slider
            value={[data.aiMaxTokens]}
            onValueChange={([v]) => update({ aiMaxTokens: v })}
            min={256}
            max={8192}
            step={256}
            className="mt-2"
          />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>256</span>
            <span>8192</span>
          </div>
        </Field>

        {/* Temperature Slider */}
        <Field label={`温度: ${data.aiTemperature.toFixed(2)}`}>
          <Slider
            value={[data.aiTemperature]}
            onValueChange={([v]) => update({ aiTemperature: v })}
            min={0}
            max={2}
            step={0.05}
            className="mt-2"
          />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>0 (精确)</span>
            <span>2 (创意)</span>
          </div>
        </Field>
      </Flex>
    </Flex>
  );
}
