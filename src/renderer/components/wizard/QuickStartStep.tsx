import { useState } from "react";
import Button from "../ui/Button";
import type { WizardData } from "../../hooks/useSetupWizard";
import { getTemplates, type RoleTemplate } from "@sixtdreamnight/companion-engine/role-templates";

export default function QuickStartStep({
  next, updateParseField, update,
}: {
  next: () => void;
  updateParseField: (key: string, value: unknown) => void;
  update: (d: Record<string, unknown>) => void;
}) {
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");

  const applyTemplate = (t: RoleTemplate) => {
    update({
      name: t.profile.name,
      partnerGender: t.profile.partner_gender,
      relationshipType: t.profile.relationship_type,
    });
    updateParseField("age", t.profile.age);
    updateParseField("city", t.profile.city);
    updateParseField("occupation", t.profile.occupation);
    updateParseField("temperament", t.profile.temperament);
    updateParseField("hobbies", t.profile.hobbies);
    updateParseField("daily_life", t.profile.daily_life);
    updateParseField("quirks", t.profile.quirks);
    updateParseField("speaking_style", t.profile.speaking_style);
    next();
  };

  const handleImport = async () => {
    setImporting(true);
    setImportError("");
    try {
      const result = await window.api.importCard();
      const r = result as { success?: boolean; data?: Record<string, unknown>; error?: string };
      if (r.success && r.data) {
        const d = r.data;
        if (d.name) update({ name: d.name });
        if (d.age) updateParseField("age", d.age);
        if (d.city) updateParseField("city", d.city);
        if (d.occupation) updateParseField("occupation", d.occupation);
        if (d.temperament) updateParseField("temperament", d.temperament);
        if (d.hobbies) updateParseField("hobbies", d.hobbies);
        if (d.daily_life) updateParseField("daily_life", d.daily_life);
        if (d.quirks) updateParseField("quirks", d.quirks);
        if (d.speaking_style) updateParseField("speaking_style", d.speaking_style);
        next();
      } else if (r.error && r.error !== "已取消") {
        setImportError(r.error);
      }
    } catch {
      setImportError("导入失败，请重试");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="ym-form">
      <header className="ym-step-head">
        <h2 className="ym-step-title">选择角色模板</h2>
        <p className="ym-note">选一个喜欢的起点，后面可以自定义修改；也可以直接从空白创建。</p>
      </header>

      <div className="ym-options">
        {getTemplates().map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => applyTemplate(t)}
            className="ym-option ym-focus"
          >
            <span className="ym-option__rule" aria-hidden="true" />
            <span className="ym-option__body">
              <span className="ym-option__label">{t.label}</span>
              <span className="ym-option__desc">{t.desc}</span>
            </span>
          </button>
        ))}
      </div>

      <hr className="ym-rule" />

      <Button variant="outline" size="lg" className="w-full" onClick={handleImport} disabled={importing}>
        {importing ? "导入中..." : "导入角色卡 (JSON/PNG)"}
      </Button>
      {importError && <p className="ym-alert ym-alert--danger" role="alert">{importError}</p>}

      <Button variant="ghost" size="lg" className="w-full" onClick={next}>
        从空白创建
      </Button>
    </div>
  );
}
