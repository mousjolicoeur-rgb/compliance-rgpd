"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type Params = {
  notif_hebdo:     boolean;
  notif_risque:    boolean;
  notif_mensuel:   boolean;
  notif_frequence: string;
  conservation:    string;
  anonymisation:   boolean;
  partage_donnees: boolean;
  seuil_risque:    number;
  langue:          string;
};

const DEFAULT: Params = {
  notif_hebdo:     true,
  notif_risque:    true,
  notif_mensuel:   false,
  notif_frequence: "hebdo",
  conservation:    "6mois",
  anonymisation:   false,
  partage_donnees: true,
  seuil_risque:    50,
  langue:          "fr",
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ position: "relative", width: 40, height: 22, flexShrink: 0, cursor: "pointer", display: "inline-block" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
      />
      <span style={{
        position: "absolute", inset: 0, borderRadius: 100, cursor: "pointer",
        background: checked ? "#B07D2A" : "#D3D1C7", transition: "background 0.2s",
      }}>
        <span style={{
          position: "absolute", width: 16, height: 16, left: 3, top: 3,
          background: "#fff", borderRadius: "50%", transition: "transform 0.2s",
          transform: checked ? "translateX(18px)" : "translateX(0)",
        }} />
      </span>
    </label>
  );
}

function SettingRow({
  icon, label, description, children,
}: {
  icon: string; label: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="setting-row">
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 17, color: "#B07D2A", marginTop: 1, flexShrink: 0 }} aria-hidden="true" />
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: description ? 2 : 0 }}>{label}</div>
          {description && <div style={{ fontSize: 12, color: "#888" }}>{description}</div>}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Select({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      className="select"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export default function ParametresPage() {
  const router = useRouter();
  const supabase = createClient();

  const [params, setParams] = useState<Params>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from("parametres")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setParams({
          notif_hebdo:     data.notif_hebdo     ?? DEFAULT.notif_hebdo,
          notif_risque:    data.notif_risque     ?? DEFAULT.notif_risque,
          notif_mensuel:   data.notif_mensuel    ?? DEFAULT.notif_mensuel,
          notif_frequence: data.notif_frequence  ?? DEFAULT.notif_frequence,
          conservation:    data.conservation     ?? DEFAULT.conservation,
          anonymisation:   data.anonymisation    ?? DEFAULT.anonymisation,
          partage_donnees: data.partage_donnees  ?? DEFAULT.partage_donnees,
          seuil_risque:    data.seuil_risque     ?? DEFAULT.seuil_risque,
          langue:          data.langue           ?? DEFAULT.langue,
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const set = <K extends keyof Params>(key: K, value: Params[K]) => {
    setParams(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setSaveError("");
    const { error } = await supabase.from("parametres").upsert(
      { user_id: userId, ...params, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (error) {
      setSaveError("Erreur lors de la sauvegarde.");
    } else {
      setSaveOk(true);
      setDirty(false);
      setTimeout(() => setSaveOk(false), 2500);
    }
  };

  const handleReset = () => {
    setParams(DEFAULT);
    setDirty(true);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif" }}>
        <p style={{ color: "#888", fontSize: 13 }}>Chargement des paramètres…</p>
      </div>
    );
  }

  const seuilColor = params.seuil_risque >= 70 ? "#3B6D11" : params.seuil_risque >= 40 ? "#B07D2A" : "#A32D2D";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #F8F7F4; color: #1a1a1a; }
        .page { max-width: 680px; margin: 0 auto; padding: 32px 24px; }
        .back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #888; cursor: pointer; margin-bottom: 20px; background: none; border: none; font-family: 'DM Sans', sans-serif; }
        .back:hover { color: #B07D2A; }
        .page-title { font-family: 'DM Serif Display', serif; font-size: 24px; margin-bottom: 4px; }
        .page-sub { font-size: 13px; color: #888; margin-bottom: 28px; }
        .card { background: #fff; border: 0.5px solid #E0DDD6; border-radius: 12px; padding: 18px 22px; margin-bottom: 16px; }
        .card-title { font-size: 13px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; color: #1a1a1a; border-bottom: 0.5px solid #F1EFE8; padding-bottom: 12px; }
        .card-title i { font-size: 16px; color: #B07D2A; }
        .setting-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 11px 0; border-bottom: 0.5px solid #F1EFE8; }
        .setting-row:last-child { border-bottom: none; padding-bottom: 0; }
        .setting-row:first-of-type { padding-top: 0; }
        .select { font-size: 12px; padding: 5px 10px; border-radius: 8px; border: 0.5px solid #D3D1C7; background: #F8F7F4; color: #1a1a1a; font-family: 'DM Sans', sans-serif; cursor: pointer; outline: none; transition: border-color 0.15s; }
        .select:focus { border-color: #B07D2A; }
        .slider { -webkit-appearance: none; width: 120px; height: 4px; border-radius: 2px; outline: none; cursor: pointer; }
        .slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #B07D2A; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
        .slider::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #B07D2A; cursor: pointer; border: none; }
        .seuil-val { font-size: 12px; font-weight: 600; min-width: 36px; text-align: right; }
        .footer { display: flex; align-items: center; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
        .btn { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; padding: 9px 20px; border-radius: 8px; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.15s; }
        .btn-primary { background: #B07D2A; color: #fff; }
        .btn-primary:hover:not(:disabled) { opacity: 0.86; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-outline { background: none; border: 0.5px solid #D3D1C7; color: #888; }
        .btn-outline:hover { background: #F1EFE8; color: #1a1a1a; }
        .alert-ok { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #3B6D11; background: #EAF3DE; padding: 7px 14px; border-radius: 8px; }
        .alert-err { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #A32D2D; background: #FCEBEB; padding: 7px 14px; border-radius: 8px; }
        .dirty-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #B07D2A; margin-left: 6px; vertical-align: middle; }
        .info-box { background: #F1EFE8; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #888; margin-top: 12px; display: flex; align-items: flex-start; gap: 8px; }
        .info-box i { color: #B07D2A; font-size: 15px; flex-shrink: 0; margin-top: 1px; }
      `}</style>

      <div className="page">
        <button className="back" onClick={() => router.push("/dashboard")}>
          <i className="ti ti-arrow-left" aria-hidden="true" /> Retour au dashboard
        </button>

        <div className="page-title">
          Paramètres
          {dirty && <span className="dirty-dot" title="Modifications non sauvegardées" />}
        </div>
        <div className="page-sub">Personnalisez vos notifications, vos données et vos préférences</div>

        {/* NOTIFICATIONS */}
        <div className="card">
          <div className="card-title">
            <i className="ti ti-bell" aria-hidden="true" /> Notifications
          </div>
          <SettingRow
            icon="ti-calendar-week"
            label="Rapport hebdomadaire"
            description="Recevez un résumé chaque semaine"
          >
            <Toggle checked={params.notif_hebdo} onChange={v => set("notif_hebdo", v)} />
          </SettingRow>
          <SettingRow
            icon="ti-alert-triangle"
            label="Alerte risque critique"
            description="Notification immédiate si un document score < seuil"
          >
            <Toggle checked={params.notif_risque} onChange={v => set("notif_risque", v)} />
          </SettingRow>
          <SettingRow
            icon="ti-calendar-month"
            label="Bilan mensuel"
            description="Synthèse automatique en fin de mois"
          >
            <Toggle checked={params.notif_mensuel} onChange={v => set("notif_mensuel", v)} />
          </SettingRow>
          <SettingRow
            icon="ti-clock"
            label="Fréquence des rapports"
          >
            <Select
              value={params.notif_frequence}
              onChange={v => set("notif_frequence", v)}
              options={[
                { value: "quotidien", label: "Quotidien" },
                { value: "hebdo",     label: "Hebdomadaire" },
                { value: "mensuel",   label: "Mensuel" },
              ]}
            />
          </SettingRow>
        </div>

        {/* DONNÉES & CONFIDENTIALITÉ */}
        <div className="card">
          <div className="card-title">
            <i className="ti ti-shield-lock" aria-hidden="true" /> Données & confidentialité
          </div>
          <SettingRow
            icon="ti-database"
            label="Conservation des analyses"
            description="Durée de rétention de vos documents"
          >
            <Select
              value={params.conservation}
              onChange={v => set("conservation", v)}
              options={[
                { value: "3mois",  label: "3 mois" },
                { value: "6mois",  label: "6 mois" },
                { value: "1an",    label: "1 an" },
                { value: "illimite", label: "Illimité" },
              ]}
            />
          </SettingRow>
          <SettingRow
            icon="ti-eye-off"
            label="Anonymisation des documents"
            description="Masque les données personnelles avant analyse IA"
          >
            <Toggle checked={params.anonymisation} onChange={v => set("anonymisation", v)} />
          </SettingRow>
          <SettingRow
            icon="ti-share"
            label="Partage de données agrégées"
            description="Contribue à l'amélioration des modèles (anonymisé)"
          >
            <Toggle checked={params.partage_donnees} onChange={v => set("partage_donnees", v)} />
          </SettingRow>
          <div className="info-box">
            <i className="ti ti-info-circle" aria-hidden="true" />
            Les données partagées sont toujours anonymisées et ne contiennent jamais d'informations personnelles identifiables.
          </div>
        </div>

        {/* ANALYSE */}
        <div className="card">
          <div className="card-title">
            <i className="ti ti-sliders" aria-hidden="true" /> Préférences d'analyse
          </div>
          <SettingRow
            icon="ti-chart-bar"
            label="Seuil d'alerte risque"
            description="Score en-dessous duquel une alerte est déclenchée"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="range"
                className="slider"
                min={10}
                max={90}
                step={5}
                value={params.seuil_risque}
                style={{ background: `linear-gradient(to right, #B07D2A ${params.seuil_risque}%, #F1EFE8 ${params.seuil_risque}%)` }}
                onChange={e => set("seuil_risque", Number(e.target.value))}
              />
              <span className="seuil-val" style={{ color: seuilColor }}>{params.seuil_risque}%</span>
            </div>
          </SettingRow>
          <SettingRow
            icon="ti-language"
            label="Langue de l'interface"
          >
            <Select
              value={params.langue}
              onChange={v => set("langue", v)}
              options={[
                { value: "fr", label: "Français" },
                { value: "en", label: "English" },
              ]}
            />
          </SettingRow>
        </div>

        {/* FOOTER */}
        <div className="footer">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            <i className="ti ti-device-floppy" style={{ fontSize: 15 }} aria-hidden="true" />
            {saving ? "Sauvegarde…" : "Enregistrer les paramètres"}
          </button>
          <button className="btn btn-outline" onClick={handleReset}>
            Réinitialiser
          </button>
          {saveOk && (
            <span className="alert-ok">
              <i className="ti ti-circle-check" aria-hidden="true" /> Paramètres sauvegardés
            </span>
          )}
          {saveError && (
            <span className="alert-err">
              <i className="ti ti-alert-circle" aria-hidden="true" /> {saveError}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
