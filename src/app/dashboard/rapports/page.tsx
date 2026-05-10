"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type Rapport = {
  id: string;
  titre: string;
  type: string;
  format: string;
  destinataire: string | null;
  score_global: number | null;
  nb_analyses: number;
  created_at: string;
};

type ReportType = "mensuel" | "risques" | "csv" | "bilan";

type AnalyseRow = {
  id: string;
  nom_document: string;
  score: number | null;
  statut: string;
  created_at: string;
};

const REPORT_TYPES: { key: ReportType; label: string; icon: string; description: string }[] = [
  { key: "mensuel", label: "Rapport mensuel",    icon: "ti-calendar-month",  description: "Synthèse du mois en cours" },
  { key: "risques", label: "Risques critiques",  icon: "ti-alert-triangle",  description: "Documents score < 50%" },
  { key: "csv",     label: "Export complet CSV", icon: "ti-table-export",    description: "Toutes vos analyses" },
  { key: "bilan",   label: "Bilan de conformité",icon: "ti-clipboard-check", description: "Vue globale RGPD" },
];

const TITRE_MAP: Record<ReportType, () => string> = {
  mensuel: () => `Rapport mensuel — ${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
  risques: () => `Rapport risques critiques — ${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
  csv:     () => `Export complet CSV — ${new Date().toLocaleDateString("fr-FR")}`,
  bilan:   () => `Bilan de conformité — ${new Date().toLocaleDateString("fr-FR")}`,
};

const FORMAT_MAP: Record<ReportType, string> = {
  mensuel: "PDF", risques: "Résumé", csv: "CSV", bilan: "PDF",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function FormatBadge({ format }: { format: string }) {
  const cls = format === "PDF" ? "fmt-pdf" : format === "CSV" ? "fmt-csv" : "fmt-txt";
  return <span className={`badge ${cls}`}>{format}</span>;
}

function avgScore(rows: AnalyseRow[]): number {
  const scored = rows.filter(a => a.score !== null);
  if (!scored.length) return 0;
  return Math.round(scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length);
}

export default function RapportsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ReportType>("mensuel");
  const [generating, setGenerating] = useState(false);
  const [genOk, setGenOk] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [emailDest, setEmailDest] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendOk, setSendOk] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser({ id: user.id, email: user.email ?? "" });
      const { data } = await supabase
        .from("rapports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setRapports(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const stats = {
    total:  rapports.length,
    emails: rapports.filter(r => r.destinataire).length,
    mois:   rapports.filter(r => {
      const d = new Date(r.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer ce rapport ?")) return;
    await supabase.from("rapports").delete().eq("id", id);
    setRapports(prev => prev.filter(r => r.id !== id));
  };

  const fetchAnalyses = async (userId: string): Promise<AnalyseRow[]> => {
    const { data } = await supabase
      .from("analyses")
      .select("id, nom_document, score, statut, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? []) as AnalyseRow[];
  };

  const saveRapport = async (opts: {
    titre: string; type: string; format: string;
    destinataire?: string; scoreGlobal: number; nbAnalyses: number;
  }): Promise<Rapport | null> => {
    if (!user) return null;
    const { data } = await supabase.from("rapports").insert({
      user_id:      user.id,
      titre:        opts.titre,
      type:         opts.type,
      format:       opts.format,
      destinataire: opts.destinataire ?? null,
      score_global: opts.scoreGlobal,
      nb_analyses:  opts.nbAnalyses,
    }).select().single();
    return data as Rapport | null;
  };

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);

    const analyses = await fetchAnalyses(user.id);
    const scoreGlobal = avgScore(analyses);
    const titre = TITRE_MAP[selectedType]();
    const format = FORMAT_MAP[selectedType];

    if (selectedType === "csv") {
      const csv = [
        "Nom,Score,Statut,Date",
        ...analyses.map(a =>
          `"${a.nom_document}",${a.score ?? ""},${a.statut},"${new Date(a.created_at).toLocaleDateString("fr-FR")}"`
        ),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "analyses-compliance-rgpd.csv";
      link.click();
      URL.revokeObjectURL(url);
    }

    const newRapport = await saveRapport({ titre, type: selectedType, format, scoreGlobal, nbAnalyses: analyses.length });
    if (newRapport) setRapports(prev => [newRapport, ...prev]);

    setGenerating(false);
    setGenOk(true);
    setTimeout(() => setGenOk(false), 3000);
  };

  const handleSendEmail = async () => {
    if (!emailDest.trim() || !user) return;
    setSendingEmail(true);

    const analyses = await fetchAnalyses(user.id);
    const scoreGlobal = avgScore(analyses);

    await fetch("/api/send-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to:             emailDest,
        format:         FORMAT_MAP[selectedType],
        options:        ["Score global de conformité", "Liste des analyses récentes"],
        user_email:     user.email,
        score_moyen:    scoreGlobal,
        total_analyses: analyses.length,
        analyses:       analyses.slice(0, 5),
      }),
    });

    const titre = TITRE_MAP[selectedType]();
    const newRapport = await saveRapport({
      titre, type: selectedType, format: FORMAT_MAP[selectedType],
      destinataire: emailDest, scoreGlobal, nbAnalyses: analyses.length,
    });
    if (newRapport) setRapports(prev => [newRapport, ...prev]);

    setSendingEmail(false);
    setEmailModal(false);
    setEmailDest("");
    setSendOk(true);
    setTimeout(() => setSendOk(false), 3000);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #F8F7F4; color: #1a1a1a; }
        .page { padding: 28px 32px; max-width: 900px; }
        .back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #888; cursor: pointer; margin-bottom: 16px; background: none; border: none; font-family: 'DM Sans', sans-serif; }
        .back:hover { color: #B07D2A; }
        .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 4px; }
        .title { font-family: 'DM Serif Display', serif; font-size: 24px; }
        .sub { font-size: 13px; color: #888; margin-bottom: 20px; }
        .btn { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; padding: 8px 16px; border-radius: 8px; background: #B07D2A; color: #fff; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.15s; }
        .btn:hover:not(:disabled) { opacity: 0.88; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-outline { background: none; border: 0.5px solid #D3D1C7; color: #1a1a1a; }
        .btn-outline:hover:not(:disabled) { background: #F1EFE8; opacity: 1; }
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
        .stat { background: #F1EFE8; border-radius: 10px; padding: 14px 16px; }
        .stat-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px; }
        .stat-val { font-size: 22px; font-weight: 600; }
        .card { background: #fff; border: 0.5px solid #E0DDD6; border-radius: 12px; padding: 18px 22px; margin-bottom: 16px; }
        .card-title { font-size: 13px; font-weight: 500; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        .card-title i { color: #B07D2A; font-size: 16px; }
        .table { border: 0.5px solid #E0DDD6; border-radius: 10px; overflow: hidden; }
        .thead { display: grid; grid-template-columns: 2fr 80px 130px 95px 95px; padding: 8px 14px; background: #F8F7F4; border-bottom: 0.5px solid #E0DDD6; }
        .th { font-size: 11px; font-weight: 500; color: #888; text-transform: uppercase; letter-spacing: 0.4px; }
        .row { display: grid; grid-template-columns: 2fr 80px 130px 95px 95px; padding: 11px 14px; border-bottom: 0.5px solid #F1EFE8; align-items: center; transition: background 0.12s; }
        .row:last-child { border-bottom: none; }
        .row:hover { background: #F8F7F4; }
        .doc-name { font-size: 13px; font-weight: 500; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px; }
        .doc-meta { font-size: 11px; color: #aaa; }
        .badge { font-size: 11px; padding: 3px 9px; border-radius: 100px; font-weight: 500; }
        .fmt-pdf { background: #FCEBEB; color: #A32D2D; }
        .fmt-txt { background: #E6F1FB; color: #185FA5; }
        .fmt-csv { background: #EAF3DE; color: #3B6D11; }
        .action-btn { width: 28px; height: 28px; border-radius: 6px; border: 0.5px solid #E0DDD6; background: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; color: #888; transition: all 0.15s; margin-right: 3px; }
        .action-btn:hover { background: #F1EFE8; color: #1a1a1a; }
        .action-btn.del:hover { background: #FCEBEB; color: #A32D2D; border-color: #F09595; }
        .gen-area { border: 0.5px dashed #D3D1C7; border-radius: 10px; padding: 24px; text-align: center; }
        .gen-icon { font-size: 30px; color: #bbb; margin-bottom: 10px; }
        .gen-title { font-size: 14px; font-weight: 500; margin-bottom: 6px; }
        .gen-sub { font-size: 12px; color: #888; margin-bottom: 18px; }
        .type-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
        .type-btn { padding: 10px 8px; border-radius: 8px; border: 0.5px solid #E0DDD6; background: none; cursor: pointer; font-family: 'DM Sans', sans-serif; text-align: center; transition: all 0.15s; }
        .type-btn:hover { border-color: #B07D2A55; background: #F8F7F4; }
        .type-btn.selected { border-color: #B07D2A; background: #B07D2A10; }
        .type-btn i { font-size: 20px; display: block; margin-bottom: 6px; color: #888; }
        .type-btn.selected i { color: #B07D2A; }
        .type-btn span { font-size: 12px; color: #555; display: block; line-height: 1.3; }
        .type-btn small { font-size: 10px; color: #aaa; }
        .cta-row { display: flex; gap: 8px; justify-content: center; margin-top: 16px; }
        .alert-ok { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #3B6D11; background: #EAF3DE; padding: 8px 14px; border-radius: 8px; margin-top: 12px; justify-content: center; }
        .empty { padding: 32px; text-align: center; color: #888; font-size: 13px; }
        .loading { padding: 32px; text-align: center; color: #888; font-size: 13px; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .modal { background: #fff; border-radius: 14px; padding: 24px 28px; width: 380px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
        .modal-title { font-size: 15px; font-weight: 500; margin-bottom: 6px; }
        .modal-sub { font-size: 12px; color: #888; margin-bottom: 16px; }
        .modal-input { width: 100%; font-size: 13px; padding: 8px 12px; border-radius: 8px; border: 0.5px solid #D3D1C7; background: #F8F7F4; font-family: 'DM Sans', sans-serif; outline: none; margin-bottom: 12px; }
        .modal-input:focus { border-color: #B07D2A; }
        .modal-row { display: flex; gap: 8px; }
        @media (max-width: 700px) {
          .type-grid { grid-template-columns: repeat(2, 1fr); }
          .thead, .row { grid-template-columns: 2fr 80px 90px; }
          .th:nth-child(3), .row > *:nth-child(3),
          .th:nth-child(4), .row > *:nth-child(4) { display: none; }
        }
      `}</style>

      <div className="page">
        <button className="back" onClick={() => router.push("/dashboard")}>
          <i className="ti ti-arrow-left" aria-hidden="true" /> Retour au dashboard
        </button>

        <div className="header">
          <div>
            <div className="title">Rapports</div>
            <div className="sub">Historique de vos exports et rapports générés</div>
          </div>
          <button
            className="btn"
            onClick={() => document.getElementById("gen-section")?.scrollIntoView({ behavior: "smooth" })}
          >
            <i className="ti ti-file-plus" style={{ fontSize: 15 }} aria-hidden="true" />
            Générer un rapport
          </button>
        </div>

        {/* STATS */}
        <div className="stats">
          <div className="stat">
            <div className="stat-label">Rapports générés</div>
            <div className="stat-val">{stats.total}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Envoyés par email</div>
            <div className="stat-val">{stats.emails}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Ce mois</div>
            <div className="stat-val">{stats.mois}</div>
          </div>
        </div>

        {/* HISTORIQUE */}
        <div className="card">
          <div className="card-title">
            <i className="ti ti-history" aria-hidden="true" /> Historique des exports
          </div>
          <div className="table">
            <div className="thead">
              <div className="th">Rapport</div>
              <div className="th">Format</div>
              <div className="th">Envoyé à</div>
              <div className="th">Date</div>
              <div className="th">Actions</div>
            </div>
            {loading ? (
              <div className="loading">
                <i className="ti ti-loader" style={{ fontSize: 20, display: "block", marginBottom: 8 }} aria-hidden="true" />
                Chargement…
              </div>
            ) : rapports.length === 0 ? (
              <div className="empty">
                <i className="ti ti-file-off" style={{ fontSize: 24, marginBottom: 8, display: "block" }} aria-hidden="true" />
                Aucun rapport généré pour l'instant.
              </div>
            ) : rapports.map(r => (
              <div key={r.id} className="row">
                <div>
                  <div className="doc-name">{r.titre}</div>
                  <div className="doc-meta">
                    {r.score_global !== null ? `Score : ${r.score_global}%` : ""}
                    {r.nb_analyses ? ` · ${r.nb_analyses} analyses` : ""}
                  </div>
                </div>
                <div><FormatBadge format={r.format} /></div>
                <div style={{ fontSize: 12, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.destinataire ?? "—"}
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>{formatDate(r.created_at)}</div>
                <div>
                  <button className="action-btn" title="Télécharger">
                    <i className="ti ti-download" aria-hidden="true" />
                  </button>
                  <button
                    className="action-btn"
                    title="Renvoyer par email"
                    onClick={() => { setSelectedType(r.type as ReportType); setEmailModal(true); }}
                  >
                    <i className="ti ti-send" aria-hidden="true" />
                  </button>
                  <button
                    className="action-btn del"
                    title="Supprimer"
                    onClick={() => handleDelete(r.id)}
                  >
                    <i className="ti ti-trash" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GÉNÉRER */}
        <div className="card" id="gen-section">
          <div className="card-title">
            <i className="ti ti-file-plus" aria-hidden="true" /> Générer un nouveau rapport
          </div>
          <div className="gen-area">
            <div className="gen-icon"><i className="ti ti-report-analytics" aria-hidden="true" /></div>
            <div className="gen-title">Choisissez le type de rapport</div>
            <div className="gen-sub">
              Le rapport sera généré depuis vos analyses et téléchargé ou envoyé par email.
            </div>
            <div className="type-grid">
              {REPORT_TYPES.map(t => (
                <button
                  key={t.key}
                  className={`type-btn${selectedType === t.key ? " selected" : ""}`}
                  onClick={() => setSelectedType(t.key)}
                >
                  <i className={`ti ${t.icon}`} aria-hidden="true" />
                  <span>{t.label}</span>
                  <small>{t.description}</small>
                </button>
              ))}
            </div>
            <div className="cta-row">
              <button className="btn" onClick={handleGenerate} disabled={generating}>
                <i className="ti ti-download" style={{ fontSize: 14 }} aria-hidden="true" />
                {generating ? "Génération…" : "Télécharger"}
              </button>
              <button className="btn btn-outline" onClick={() => setEmailModal(true)}>
                <i className="ti ti-send" style={{ fontSize: 14 }} aria-hidden="true" />
                Envoyer par email
              </button>
            </div>
            {genOk && (
              <div className="alert-ok">
                <i className="ti ti-circle-check" aria-hidden="true" /> Rapport généré et enregistré !
              </div>
            )}
            {sendOk && (
              <div className="alert-ok">
                <i className="ti ti-mail" aria-hidden="true" /> Rapport envoyé par email !
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL EMAIL */}
      {emailModal && (
        <div className="modal-overlay" onClick={() => setEmailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Envoyer le rapport par email</div>
            <div className="modal-sub">
              Le rapport <strong>{TITRE_MAP[selectedType]()}</strong> sera généré et envoyé à l'adresse indiquée.
            </div>
            <input
              className="modal-input"
              type="email"
              placeholder="destinataire@exemple.fr"
              value={emailDest}
              onChange={e => setEmailDest(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSendEmail()}
              autoFocus
            />
            <div className="modal-row">
              <button
                className="btn"
                style={{ flex: 1 }}
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailDest.trim()}
              >
                <i className="ti ti-send" style={{ fontSize: 14 }} aria-hidden="true" />
                {sendingEmail ? "Envoi…" : "Envoyer"}
              </button>
              <button className="btn btn-outline" onClick={() => setEmailModal(false)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
