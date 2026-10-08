import { useState, useEffect, useCallback, useRef } from "react";
import { Select, Slider } from "@radix-ui/themes";
import * as Tabs from "@radix-ui/react-tabs";
import * as Dialog from "@radix-ui/react-dialog";
import { Heart, X } from "lucide-react";
import { Input, Field } from "../ui/Input";
import ToggleTag from "../shared/ToggleTag";
import { getModels, isCustomModelProvider } from "../../lib/models";

// ---- 角色卡编辑的标签选项 ----
const TEMPERAMENT_TAGS = ["温柔", "活泼", "傲娇", "高冷", "粘人", "腹黑", "天然呆", "毒舌", "元气", "慵懒"];
const HOBBY_TAGS = ["游戏", "动漫", "音乐", "电影", "阅读", "运动", "美食", "旅行", "摄影", "画画", "写作", "编程"];
const DAILY_TAGS = ["上班族朝九晚五", "学生党上课泡图书馆", "自由职业宅家", "夜猫子晚上活动", "早起型早上活跃"];
const QUIRK_TAGS = ["路痴", "怕黑", "吃货", "起床困难户", "丢三落四", "爱干净", "拖延症", "脸盲"];

const TABS = [
  { value: "ai", label: "模型服务", desc: "选择生成回复的模型与内容过滤强度" },
  { value: "memory", label: "记忆", desc: "TA 记住的关于你的事，可以逐条增删改" },
  { value: "character", label: "角色卡", desc: "资料、性格、爱好与说话方式" },
  { value: "data", label: "数据", desc: "导入导出与重置" },
  { value: "about", label: "关于", desc: "版本与项目信息" },
];

const CONFIDENCE_LABEL: Record<string, string> = { high: "可信度高", medium: "可信度中", low: "可信度低" };

export default function SettingsDialog({ onClose }: { onClose: () => void }) {
  const [resetStep, setResetStep] = useState(0);
  const [resetInput, setResetInput] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [appVersion, setAppVersion] = useState("");
  const [aiProvider, setAiProvider] = useState("anthropic");
  const [aiModel, setAiModel] = useState("");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiBaseUrl, setAiBaseUrl] = useState("");
  const [aiMaxTokens, setAiMaxTokens] = useState([2048]);
  const [aiTemperature, setAiTemperature] = useState([0.85]);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);
  const [aiError, setAiError] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [contentFilter, setContentFilter] = useState<"strict" | "moderate" | "off">("strict");
  const [tab, setTab] = useState("ai");

  // 角色卡编辑状态
  const [profileAge, setProfileAge] = useState(0);
  const [profileCity, setProfileCity] = useState("");
  const [profileOccupation, setProfileOccupation] = useState("");
  const [profileEducation, setProfileEducation] = useState("");
  const [profileMajor, setProfileMajor] = useState("");
  const [profileTemperament, setProfileTemperament] = useState("");
  const [profileHobbies, setProfileHobbies] = useState<string[]>([]);
  const [profileDailyLife, setProfileDailyLife] = useState("");
  const [profileQuirks, setProfileQuirks] = useState<string[]>([]);
  const [profileSpeakingStyle, setProfileSpeakingStyle] = useState("");
  const [profileMemeStyle, setProfileMemeStyle] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [memoryFacts, setMemoryFacts] = useState<Array<{ topic: string; content: string; confidence: string; mentions: number }>>([]);
  const [newTopic, setNewTopic] = useState("");
  const [newContent, setNewContent] = useState("");

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => { fn(); timers.current = timers.current.filter((t) => t !== id); }, ms);
    timers.current.push(id);
    return id;
  }, []);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const toggleTag = useCallback((list: string[], set: (v: string[]) => void, item: string) => {
    set(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    window.api.getVersion().then((v: string) => {
      if (!ac.signal.aborted) setAppVersion(v);
    });
    return () => ac.abort();
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    window.api.getConfig().then((c: unknown) => {
      if (ac.signal.aborted) return;
      const cfg = c as Record<string, unknown>;
      const ai = cfg.ai as Record<string, unknown> | undefined;
      if (ai) {
        setAiProvider((ai.provider as string) || "anthropic");
        setAiModel((ai.model as string) || "");
        setAiApiKey((ai.apiKey as string) || "");
        setHasApiKey(!!(ai.hasApiKey as boolean));
        setAiBaseUrl((ai.baseUrl as string) || "");
        setAiMaxTokens([(ai.maxTokens as number) || 2048]);
        setAiTemperature([(ai.temperature as number) || 0.85]);
      }
      const filter = cfg.contentFilter as string | undefined;
      if (filter === "strict" || filter === "moderate" || filter === "off") {
        setContentFilter(filter);
      }
    });
    return () => ac.abort();
  }, []);

  // 加载记忆
  useEffect(() => {
    const ac = new AbortController();
    window.api.getMemoryFacts?.().then((facts: unknown) => {
      if (!ac.signal.aborted && Array.isArray(facts)) setMemoryFacts(facts as typeof memoryFacts);
    });
    return () => ac.abort();
  }, []);

  // 加载角色卡
  useEffect(() => {
    const ac = new AbortController();
    window.api.getState().then((s: unknown) => {
      if (ac.signal.aborted) return;
      const state = s as { profile: Record<string, unknown> | null };
      const p = state?.profile;
      if (p) {
        setProfileAge((p.age as number) || 0);
        setProfileCity((p.city as string) || "");
        setProfileOccupation((p.occupation as string) || "");
        setProfileEducation((p.education as string) || "");
        setProfileMajor((p.major as string) || "");
        setProfileTemperament((p.temperament as string) || "");
        setProfileHobbies(Array.isArray(p.hobbies) ? p.hobbies as string[] : []);
        setProfileDailyLife((p.daily_life as string) || "");
        setProfileQuirks(Array.isArray(p.quirks) ? p.quirks as string[] : []);
        setProfileSpeakingStyle((p.speaking_style as string) || "");
        setProfileMemeStyle((p.meme_style as string) || "");
      }
    });
    return () => ac.abort();
  }, []);

  const handleAiSave = async () => {
    setAiSaving(true);
    setAiSaved(false);
    setAiError("");
    try {
      const result = await window.api.updateConfig({
        ai: {
          provider: aiProvider,
          model: aiModel,
          apiKey: aiApiKey,
          baseUrl: aiBaseUrl || undefined,
          maxTokens: aiMaxTokens[0],
          temperature: aiTemperature[0],
        },
        contentFilter,
      });
      const r = result as { success?: boolean; error?: string };
      if (r && typeof r === "object" && r.success === false) {
        setAiError(r.error || "保存失败");
      } else {
        setAiSaved(true);
        scheduleTimeout(() => setAiSaved(false), 2000);
      }
    } catch {
      setAiError("保存失败，请重试");
    } finally {
      setAiSaving(false);
    }
  };

  const handleReset = async () => {
    if (resetStep === 0) {
      setResetStep(1);
      return;
    }
    if (resetStep === 1 && resetInput === "RESET") {
      setResetLoading(true);
      try {
        const result = await window.api.resetAllData();
        if ((result as { success: boolean }).success) {
          window.location.hash = "#/setup";
          window.location.reload();
        } else {
          alert("重置失败: " + ((result as { error?: string }).error || "未知错误"));
        }
      } catch (err) {
        alert("重置失败: " + String(err));
      }
      setResetLoading(false);
    }
  };

  const handleResetCancel = () => {
    setResetStep(0);
    setResetInput("");
    setResetLoading(false);
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileSaved(false);
    setProfileError("");
    const result = await window.api.updateProfile({
      age: profileAge,
      city: profileCity,
      occupation: profileOccupation,
      education: profileEducation,
      major: profileMajor,
      temperament: profileTemperament,
      hobbies: profileHobbies,
      daily_life: profileDailyLife,
      quirks: profileQuirks,
      speaking_style: profileSpeakingStyle,
      meme_style: profileMemeStyle,
    });
    setProfileSaving(false);
    const r = result as { success: boolean; error?: string };
    if (r.success) {
      setProfileSaved(true);
      scheduleTimeout(() => setProfileSaved(false), 2000);
    } else {
      setProfileError(r.error || "保存失败");
    }
  };

  const addMemory = async () => {
    try {
      const result = await window.api.updateMemoryFact({ topic: newTopic.trim(), content: newContent.trim() });
      const r = result as { success?: boolean; data?: typeof memoryFacts; error?: string };
      if (r.success && r.data) {
        setMemoryFacts(r.data);
        setNewTopic("");
        setNewContent("");
      } else {
        alert(r.error || "添加失败");
      }
    } catch (err) { alert("添加失败: " + String(err)); }
  };

  const removeMemory = async (topic: string) => {
    try {
      const result = await window.api.deleteMemoryFact(topic);
      const r = result as { success?: boolean; data?: typeof memoryFacts; error?: string };
      if (r.success && r.data) setMemoryFacts(r.data);
      else alert(r.error || "删除失败");
    } catch (err) { alert("删除失败: " + String(err)); }
  };

  const activeTab = TABS.find((t) => t.value === tab) ?? TABS[0];

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="ym-scrim" />
        <Dialog.Content className="ym-dialog ym-dialog--settings dn-acrylic dn-elevation-3" style={{ WebkitAppRegion: "no-drag" }}>
          <header className="ym-dialog__head">
            <div>
              <Dialog.Title className="ym-dialog__title">设置</Dialog.Title>
              <Dialog.Description className="ym-dialog__desc">{activeTab.desc}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="ym-icon-btn ym-focus" aria-label="关闭设置">
                <X size={16} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </header>

          <Tabs.Root value={tab} onValueChange={setTab} orientation="vertical" className="ym-settings">
            <Tabs.List className="ym-settings__nav" aria-label="设置分类">
              {TABS.map((t) => (
                <Tabs.Trigger key={t.value} value={t.value} className="ym-settings__tab ym-focus">
                  {t.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <div className="ym-settings__panel">
              <Tabs.Content value="ai" className="ym-settings__content">
                <div className="ym-form">
                  <Field label="服务商" htmlFor="ym-ai-provider">
                    <Select.Root value={aiProvider} onValueChange={(v) => { setAiProvider(v); setAiModel(""); }}>
                      <Select.Trigger id="ym-ai-provider" />
                      <Select.Content className="vp-select-content">
                        <Select.Item value="anthropic">Claude (Anthropic)</Select.Item>
                        <Select.Item value="openai">OpenAI (GPT 系列)</Select.Item>
                        <Select.Item value="openai-compatible">其他兼容接口</Select.Item>
                        <Select.Item value="ollama">Ollama (本地)</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </Field>

                  {aiProvider !== "openai-compatible" && aiProvider !== "ollama" && getModels(aiProvider).length > 0 && (
                    <Field label="模型" htmlFor="ym-ai-model">
                      <Select.Root value={aiModel} onValueChange={setAiModel}>
                        <Select.Trigger id="ym-ai-model" placeholder="选择模型..." />
                        <Select.Content className="vp-select-content">
                          {getModels(aiProvider).map((m) => (
                            <Select.Item key={m} value={m}>{m}</Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    </Field>
                  )}

                  {isCustomModelProvider(aiProvider) && (
                    <Field label="模型名称" htmlFor="ym-ai-model-name">
                      <Input
                        id="ym-ai-model-name"
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        placeholder={aiProvider === "ollama" ? "llama3 / qwen2.5" : "deepseek-chat / gpt-4o-mini"}
                      />
                    </Field>
                  )}

                  <Field
                    label={aiProvider === "ollama" ? "API Key（本地可留空）" : "API Key"}
                    htmlFor="ym-ai-key"
                    hint={hasApiKey && aiProvider !== "ollama" ? "已保存密钥，留空则继续使用现有密钥" : undefined}
                  >
                    <div className="ym-form__row">
                      <Input
                        id="ym-ai-key"
                        type="password"
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                        placeholder={aiProvider === "ollama" ? "ollama 本地无需密钥" : hasApiKey ? "输入新密钥可更换..." : "sk-..."}
                      />
                      {hasApiKey && aiProvider !== "ollama" && (
                        <span className="ym-badge-emerald ym-form__flag">已配置密钥</span>
                      )}
                    </div>
                  </Field>

                  {isCustomModelProvider(aiProvider) && (
                    <Field label="API 地址" htmlFor="ym-ai-base">
                      <Input
                        id="ym-ai-base"
                        value={aiBaseUrl}
                        onChange={(e) => setAiBaseUrl(e.target.value)}
                        placeholder={aiProvider === "ollama" ? "http://localhost:11434/v1" : "https://api.deepseek.com"}
                      />
                    </Field>
                  )}

                  <Field label={`最大输出 Token — ${aiMaxTokens[0]}`} htmlFor="ym-ai-tokens">
                    <Slider id="ym-ai-tokens" value={aiMaxTokens} onValueChange={setAiMaxTokens} min={256} max={8192} step={256} />
                    <div className="ym-form__scale">
                      <span className="ym-kicker">256</span>
                      <span className="ym-kicker">8192</span>
                    </div>
                  </Field>

                  <Field label={`温度 — ${aiTemperature[0].toFixed(2)}`} htmlFor="ym-ai-temp">
                    <Slider id="ym-ai-temp" value={aiTemperature} onValueChange={setAiTemperature} min={0} max={2} step={0.05} />
                    <div className="ym-form__scale">
                      <span className="ym-kicker">0 更精确</span>
                      <span className="ym-kicker">2 更发散</span>
                    </div>
                  </Field>

                  <Field label="内容过滤" htmlFor="ym-ai-filter">
                    <Select.Root value={contentFilter} onValueChange={(v) => setContentFilter(v as typeof contentFilter)}>
                      <Select.Trigger id="ym-ai-filter" />
                      <Select.Content className="vp-select-content">
                        <Select.Item value="strict">严格 — 拦截所有不安全内容</Select.Item>
                        <Select.Item value="moderate">适中 — 仅拦截违法/色情内容</Select.Item>
                        <Select.Item value="off">关闭 — 不做内容过滤</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </Field>

                  {aiError && (
                    <p className="ym-alert ym-alert--danger" role="alert">{aiError}</p>
                  )}

                  <button
                    type="button"
                    className="ym-btn ym-btn--primary ym-focus"
                    onClick={handleAiSave}
                    disabled={aiSaving || (aiProvider !== "ollama" && !aiApiKey.trim() && !hasApiKey)}
                  >
                    {aiSaved ? "已保存" : aiSaving ? "保存中..." : "保存模型配置"}
                  </button>
                </div>
              </Tabs.Content>

              <Tabs.Content value="memory" className="ym-settings__content">
                <div className="ym-form">
                  <h3 className="ym-section-title">伴侣的记忆</h3>
                  <p className="ym-note">TA 记住的关于你的事，可以查看、修改或删除。</p>

                  {memoryFacts.map((fact) => (
                    <article key={fact.topic} className="ym-memory">
                      <div className="ym-memory__head">
                        <span className="ym-memory__topic">{fact.topic}</span>
                        <span
                          className={
                            fact.confidence === "high" ? "ym-badge-emerald ym-memory__conf"
                              : fact.confidence === "medium" ? "ym-badge-amber ym-memory__conf"
                                : "ym-memory__conf ym-memory__conf--low"
                          }
                        >
                          {CONFIDENCE_LABEL[fact.confidence] || "可信度未知"}
                        </span>
                        <span className="ym-kicker">提及 {fact.mentions} 次</span>
                        <button
                          type="button"
                          className="ym-btn ym-btn--link ym-focus ym-memory__delete"
                          onClick={() => removeMemory(fact.topic)}
                        >
                          删除
                        </button>
                      </div>
                      <p className="ym-memory__body">{fact.content}</p>
                    </article>
                  ))}

                  {memoryFacts.length === 0 && (
                    <p className="ym-empty">还没有记忆 — 多和 TA 聊聊天，重要的内容会被记住</p>
                  )}

                  <section className="ym-panel ym-form" style={{ padding: "var(--ym-space-5)" }}>
                    <h4 className="ym-section-title">添加记忆</h4>
                    <Field label="话题" htmlFor="ym-memory-topic">
                      <Input
                        id="ym-memory-topic"
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        placeholder="如：喜欢的食物"
                      />
                    </Field>
                    <Field label="内容" htmlFor="ym-memory-content">
                      <Input
                        id="ym-memory-content"
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="如：最喜欢吃火锅，尤其是麻辣锅"
                      />
                    </Field>
                    <button
                      type="button"
                      className="ym-btn ym-btn--primary ym-focus"
                      disabled={!newTopic.trim() || !newContent.trim()}
                      onClick={addMemory}
                    >
                      添加
                    </button>
                  </section>
                </div>
              </Tabs.Content>

              <Tabs.Content value="character" className="ym-settings__content">
                <div className="ym-form">
                  <div className="ym-form__grid">
                    <Field label="年龄" htmlFor="ym-p-age">
                      <Input
                        id="ym-p-age"
                        type="number"
                        value={profileAge ? String(profileAge) : ""}
                        onChange={(e) => setProfileAge(Number(e.target.value) || 0)}
                      />
                    </Field>
                    <Field label="城市" htmlFor="ym-p-city">
                      <Input id="ym-p-city" value={profileCity} onChange={(e) => setProfileCity(e.target.value)} />
                    </Field>
                    <Field label="职业" htmlFor="ym-p-occupation">
                      <Input id="ym-p-occupation" value={profileOccupation} onChange={(e) => setProfileOccupation(e.target.value)} />
                    </Field>
                    <Field label="学历" htmlFor="ym-p-education">
                      <Input id="ym-p-education" value={profileEducation} onChange={(e) => setProfileEducation(e.target.value)} />
                    </Field>
                  </div>

                  <Field label="专业" htmlFor="ym-p-major">
                    <Input id="ym-p-major" value={profileMajor} onChange={(e) => setProfileMajor(e.target.value)} />
                  </Field>

                  <Field label="性格标签" hint="可以多选，也可以直接输入自定义描述">
                    <div className="ym-form__tags">
                      {TEMPERAMENT_TAGS.map((t) => (
                        <ToggleTag key={t} active={profileTemperament.includes(t)} onClick={() => toggleTag(
                          profileTemperament ? profileTemperament.split("、") : [],
                          (v) => setProfileTemperament(v.join("、")),
                          t,
                        )}>{t}</ToggleTag>
                      ))}
                    </div>
                    <Input
                      aria-label="自定义性格"
                      value={profileTemperament}
                      onChange={(e) => setProfileTemperament(e.target.value)}
                      placeholder="或自定义输入性格..."
                    />
                  </Field>

                  <Field label="爱好" hint="自定义内容可用「、」分隔；回车添加">
                    <div className="ym-form__tags">
                      {HOBBY_TAGS.map((h) => (
                        <ToggleTag key={h} active={profileHobbies.includes(h)} onClick={() => toggleTag(profileHobbies, setProfileHobbies, h)}>{h}</ToggleTag>
                      ))}
                    </div>
                    <div className="ym-form__tags">
                      {profileHobbies.filter((h) => !HOBBY_TAGS.includes(h)).map((h) => (
                        <span key={h} className="ym-custom-tag">
                          {h}
                          <button
                            type="button"
                            className="ym-focus"
                            aria-label={`移除爱好 ${h}`}
                            onClick={() => setProfileHobbies(profileHobbies.filter((i) => i !== h))}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <Input
                      aria-label="添加自定义爱好"
                      placeholder="输入自定义爱好后回车添加..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && !profileHobbies.includes(val)) {
                            setProfileHobbies([...profileHobbies, val]);
                            (e.target as HTMLInputElement).value = "";
                          }
                        }
                      }}
                    />
                  </Field>

                  <Field label="日常节奏">
                    <div className="ym-form__tags">
                      {DAILY_TAGS.map((d) => (
                        <ToggleTag key={d} active={profileDailyLife === d} onClick={() => setProfileDailyLife(profileDailyLife === d ? "" : d)}>{d}</ToggleTag>
                      ))}
                    </div>
                    <Input
                      aria-label="自定义日常节奏"
                      value={profileDailyLife}
                      onChange={(e) => setProfileDailyLife(e.target.value)}
                      placeholder="或自定义输入..."
                    />
                  </Field>

                  <Field label="小特点" hint="自定义内容可用「、」分隔；回车添加">
                    <div className="ym-form__tags">
                      {QUIRK_TAGS.map((q) => (
                        <ToggleTag key={q} active={profileQuirks.includes(q)} onClick={() => toggleTag(profileQuirks, setProfileQuirks, q)} variant="amber">{q}</ToggleTag>
                      ))}
                    </div>
                    <div className="ym-form__tags">
                      {profileQuirks.filter((q) => !QUIRK_TAGS.includes(q)).map((q) => (
                        <span key={q} className="ym-custom-tag ym-custom-tag--amber">
                          {q}
                          <button
                            type="button"
                            className="ym-focus"
                            aria-label={`移除小特点 ${q}`}
                            onClick={() => setProfileQuirks(profileQuirks.filter((i) => i !== q))}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <Input
                      aria-label="添加自定义小特点"
                      placeholder="输入自定义特点后回车添加..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && !profileQuirks.includes(val)) {
                            setProfileQuirks([...profileQuirks, val]);
                            (e.target as HTMLInputElement).value = "";
                          }
                        }
                      }}
                    />
                  </Field>

                  <Field label="说话风格" htmlFor="ym-p-speaking">
                    <Input id="ym-p-speaking" value={profileSpeakingStyle} onChange={(e) => setProfileSpeakingStyle(e.target.value)} />
                  </Field>

                  <Field label="梗风格" htmlFor="ym-p-meme">
                    <Input
                      id="ym-p-meme"
                      value={profileMemeStyle}
                      onChange={(e) => setProfileMemeStyle(e.target.value)}
                      placeholder="如：贴吧老哥、微博吃瓜、小红书体..."
                    />
                  </Field>

                  {profileError && <p className="ym-alert ym-alert--danger" role="alert">{profileError}</p>}

                  <button
                    type="button"
                    className="ym-btn ym-btn--primary ym-focus"
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                  >
                    {profileSaved ? "已保存" : profileSaving ? "保存中..." : "保存角色卡"}
                  </button>
                </div>
              </Tabs.Content>

              <Tabs.Content value="data" className="ym-settings__content">
                <div className="ym-form">
                  <h3 className="ym-section-title">角色卡</h3>
                  <div className="ym-form__row">
                    <button type="button" className="ym-btn ym-btn--outline ym-focus" onClick={async () => {
                      const r = await window.api.exportProfile() as { success: boolean; error?: string };
                      if (!r.success) alert(r.error);
                    }}>导出角色卡</button>
                    <button type="button" className="ym-btn ym-btn--outline ym-focus" onClick={async () => {
                      const r = await window.api.importProfile() as { success: boolean; error?: string };
                      if (!r.success) alert(r.error);
                      else { alert("导入成功，请重启应用"); onClose(); }
                    }}>导入角色卡</button>
                  </div>

                  <h3 className="ym-section-title">聊天记录</h3>
                  <div className="ym-form__row">
                    <button type="button" className="ym-btn ym-btn--outline ym-focus" onClick={async () => {
                      const r = await window.api.exportChat("json") as { success: boolean; error?: string };
                      if (!r.success) alert(r.error);
                    }}>导出 JSON</button>
                    <button type="button" className="ym-btn ym-btn--outline ym-focus" onClick={async () => {
                      const r = await window.api.exportChat("txt") as { success: boolean; error?: string };
                      if (!r.success) alert(r.error);
                    }}>导出 TXT</button>
                  </div>

                  <h3 className="ym-section-title">重置</h3>
                  <p className="ym-note">
                    重置会删除角色卡、模型配置、聊天记录与记忆数据，操作后需要重新完成初始化设置。
                  </p>

                  {resetStep === 0 && (
                    <button type="button" className="ym-btn ym-btn--outline ym-focus" onClick={handleReset}>
                      重置所有数据...
                    </button>
                  )}

                  {resetStep === 1 && (
                    <div className="ym-danger-zone">
                      <p className="ym-danger-zone__title">
                        <span className="ym-error-mark" aria-hidden="true">!</span>
                        此操作不可撤销，所有数据将被永久删除
                      </p>
                      <Field label='输入 "RESET" 以确认' htmlFor="ym-reset-input">
                        <Input
                          id="ym-reset-input"
                          value={resetInput}
                          onChange={(e) => setResetInput(e.target.value)}
                          placeholder="RESET"
                        />
                      </Field>
                      <div className="ym-form__row">
                        <button
                          type="button"
                          className="ym-btn ym-btn--danger ym-focus"
                          disabled={resetInput !== "RESET" || resetLoading}
                          onClick={handleReset}
                        >
                          {resetLoading ? "删除中..." : "确认删除"}
                        </button>
                        <button type="button" className="ym-btn ym-btn--ghost ym-focus" onClick={handleResetCancel}>
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Tabs.Content>

              <Tabs.Content value="about" className="ym-settings__content">
                <div className="ym-form">
                  <div className="ym-about">
                    <span className="ym-about__mark" aria-hidden="true">
                      <Heart size={24} fill="currentColor" />
                    </span>
                    <div>
                      <p className="ym-about__name">梦间 / Yumema</p>
                      <p className="ym-kicker">v{appVersion || "0.0.0"}</p>
                    </div>
                  </div>

                  <dl className="ym-fact ym-about__facts">
                    <div><dt>形态</dt><dd>桌面伴侣应用 · Electron + React</dd></div>
                    <div><dt>作者</dt><dd>梦夜十六</dd></div>
                    <div><dt>协议</dt><dd>GPL-3.0</dd></div>
                    <div><dt>仓库</dt><dd>github.com/dreamnight16/ai-companion</dd></div>
                    <div><dt>反馈</dt><dd>erk163@163.com</dd></div>
                  </dl>

                  <p className="ym-note">
                    Copyright (c) 2026 DreamNight。对话内容由所选模型生成，请自行判断。
                  </p>
                </div>
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
