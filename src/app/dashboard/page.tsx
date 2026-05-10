"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

const SCORE_DETAIL = [
  { label: "Consentements", val: 85, color: "#4A8C3F" },
  { label: "Sécurité données", val: 72, color: "#B07D2A" },
  { label: "Transferts hors UE", val: 48, color: "#A32D2D" },
  { label: "DPO & registre", val: 90, color: "#4A8C3F" },
];

const FORMATS = ["PDF", "Résumé texte", "CSV"];

const CONTENT_OPTIONS_DEFAULT = [
  { label: "Score global de conformité", checked: true },
  { label: "Détail par catégorie", checked: true },
  { label: "Liste des analyses récentes", checked: true },
  { label: "Points de risque critiques", checked: false },
  { label: "Recommandations IA", checked: false },
];

type Analyse = {
  id: string;
  nom_document: string;
  created_at: string;
  score: number | null;
};

function getStatut(score: number | null): "ok" | "warn" | "risk" | "pending" {
  if (score === null) return "pending";
  if (score >= 75) return "ok";
  if (score >= 50) return "warn";
  return "risk";
}

function getFileType(nom: string): string {
  const ext = nom.split(".").pop()?.toUpperCase();
  return ext === "PDF" || ext === "TXT" ? ext : "DOC";
}

function formatRelativeDate(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `Il y a ${Math.max(1, Math.floor(diff / 60))}min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 172800) return "Hier";
  return `Il y a ${Math.floor(diff / 86400)}j`;
}

function Badge({ score }: { score: number | null }) {
  const statut = getStatut(score);
  if (statut === "ok") return <span className="badge badge-ok">Conforme · {score}%</span>;
  if (statut === "warn") return <span className="badge badge-warn">Attention · {score}%</span>;
  if (statut === "risk") return <span className="badge badge-risk">Risque élevé · {score}%</span>;
  return <span className="badge badge-pending">En traitement</span>;
}

export default function Dashboard() {
  const [user, setUser] = useState<{ email?: string; user_metadata?: { nom_societe?: string } } | null>(null);
  const [analyses, setAnalyses] = useState<Analyse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFormat, setActiveFormat] = useState("PDF");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");
  const [options, setOptions] = useState(CONTENT_OPTIONS_DEFAULT.map((o) => ({ ...o })));
  const [activeNav, setActiveNav] = useState("Dashboard");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      const { data } = await supabase
        .from("analyses")
        .select("id, nom_document, created_at, score")
        .order("created_at", { ascending: false })
        .limit(20);
      setAnalyses(data || []);
      setLoading(false);
    };
    init();
  }, []);

  const scored = analyses.filter((a) => a.score !== null);
  const total = analyses.length;
  const scoreMoyen = scored.length > 0
    ? Math.round(scored.reduce((acc, a) => acc + (a.score ?? 0), 0) / scored.length)
    : 0;
  const critiques = analyses.filter((a) => a.score !== null && a.score < 50).length;
  const enAttente = analyses.filter((a) => a.score === null).length;

  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (scoreMoyen / 100) * circumference;

  const avatarInitials = user?.user_metadata?.nom_societe
    ? user.user_metadata.nom_societe.slice(0, 2).toUpperCase()
    : (user?.email ?? "?").slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSend = async () => {
    if (!email.trim()) return;
    setSending(true);
    setSendError("");
    try {
      const res = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          format: activeFormat,
          options: options.filter((o) => o.checked).map((o) => o.label),
          user_email: user?.email,
          score_moyen: scoreMoyen,
          total_analyses: total,
          analyses: analyses.slice(0, 5),
        }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      setSent(true);
      setEmail("");
      setTimeout(() => setSent(false), 4000);
    } catch {
      setSendError("Erreur lors de l'envoi. Vérifiez l'adresse et réessayez.");
    } finally {
      setSending(false);
    }
  };

  const toggleOption = (i: number) => {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, checked: !o.checked } : o)));
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif" }}>
        <p style={{ color: "#888" }}>Chargement...</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #F8F7F4; color: #1a1a1a; }
        .shell { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

        .topbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; border-bottom: 0.5px solid #E0DDD6; background: #fff; flex-shrink: 0; }
        .logo { font-family: 'DM Serif Display', serif; font-size: 20px; color: #1a1a1a; }
        .logo span { color: #B07D2A; }
        .top-nav { display: flex; gap: 4px; }
        .top-nav button { font-size: 13px; color: #888; padding: 5px 14px; border-radius: 8px; border: none; background: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .top-nav button.active { background: #F1EFE8; color: #1a1a1a; font-weight: 500; }
        .top-nav button:hover:not(.active) { background: #F1EFE8; }
        .topbar-right { display: flex; align-items: center; gap: 10px; }
        .user-email { font-size: 12px; color: #888; }
        .avatar { width: 32px; height: 32px; border-radius: 50%; background: #B07D2A22; border: 0.5px solid #B07D2A55; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: #B07D2A; cursor: pointer; }
        .logout-btn { font-size: 12px; color: #aaa; background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; padding: 4px 8px; border-radius: 6px; transition: color 0.15s; }
        .logout-btn:hover { color: #A32D2D; }

        .body { display: flex; flex: 1; overflow: hidden; }

        .sidebar { width: 190px; border-right: 0.5px solid #E0DDD6; padding: 16px 12px; background: #fff; display: flex; flex-direction: column; flex-shrink: 0; overflow-y: auto; }
        .sidebar-section { font-size: 10px; font-weight: 600; letter-spacing: 0.8px; color: #aaa; text-transform: uppercase; padding: 14px 10px 4px; }
        .sidebar-item { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 8px; font-size: 13px; cursor: pointer; margin-bottom: 2px; color: #666; transition: all 0.15s; }
        .sidebar-item.active { background: #F1EFE8; color: #1a1a1a; font-weight: 500; }
        .sidebar-item:hover:not(.active) { background: #F1EFE8; color: #1a1a1a; }
        .plan-badge { background: #FAEEDA; border-radius: 8px; padding: 10px 12px; margin-top: auto; }
        .plan-badge-title { font-size: 11px; font-weight: 600; color: #854F0B; margin-bottom: 3px; }
        .plan-badge-sub { font-size: 11px; color: #BA7517; margin-bottom: 8px; }
        .plan-bar-bg { height: 4px; background: #FAC77550; border-radius: 2px; overflow: hidden; }
        .plan-bar { width: 40%; height: 100%; background: #B07D2A; border-radius: 2px; }

        .main { flex: 1; overflow-y: auto; padding: 24px 28px; }
        .page-title { font-family: 'DM Serif Display', serif; font-size: 24px; margin-bottom: 4px; }
        .page-sub { font-size: 13px; color: #888; margin-bottom: 24px; }

        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .kpi { background: #F1EFE8; border-radius: 10px; padding: 16px; }
        .kpi-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .kpi-val { font-size: 28px; font-weight: 600; line-height: 1; margin-bottom: 4px; }
        .kpi-trend { font-size: 11px; }
        .trend-up { color: #3B6D11; }
        .trend-warn { color: #B07D2A; }
        .trend-danger { color: #A32D2D; }

        .grid2 { display: grid; grid-template-columns: 1fr 290px; gap: 18px; margin-bottom: 18px; }
        .card { background: #fff; border: 0.5px solid #E0DDD6; border-radius: 12px; padding: 18px 22px; }
        .card-title { font-size: 13px; font-weight: 500; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; }
        .card-title a { font-size: 12px; font-weight: 400; color: #aaa; text-decoration: none; }
        .card-title a:hover { color: #B07D2A; }

        .ana-row { display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 0.5px solid #F1EFE8; cursor: pointer; transition: opacity 0.15s; }
        .ana-row:last-child { border-bottom: none; }
        .ana-row:hover { opacity: 0.75; }
        .ana-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .ana-name { font-size: 13px; font-weight: 500; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 320px; }
        .ana-meta { font-size: 11px; color: #aaa; }
        .file-tag { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; padding: 2px 6px; border-radius: 100px; background: #F1EFE8; color: #888; margin-left: 4px; }
        .empty-state { text-align: center; padding: 32px 0; color: #bbb; font-size: 13px; }

        .badge { font-size: 11px; padding: 3px 9px; border-radius: 100px; font-weight: 500; flex-shrink: 0; margin-left: auto; }
        .badge-ok { background: #EAF3DE; color: #3B6D11; }
        .badge-warn { background: #FAEEDA; color: #854F0B; }
        .badge-risk { background: #FCEBEB; color: #A32D2D; }
        .badge-pending { background: #F1EFE8; color: #888; }

        .score-wrap { display: flex; flex-direction: column; align-items: center; padding: 4px 0; }
        .score-circle { position: relative; width: 120px; height: 120px; margin-bottom: 12px; }
        .score-num { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'DM Serif Display', serif; font-size: 30px; line-height: 1; }
        .score-num small { font-family: 'DM Sans', sans-serif; font-size: 11px; color: #aaa; font-style: normal; margin-top: 2px; }
        .score-satisf { font-size: 13px; font-weight: 600; color: #B07D2A; margin-bottom: 14px; }
        .score-rows { width: 100%; display: flex; flex-direction: column; gap: 9px; }
        .score-row { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #666; }
        .bar-bg { width: 80px; height: 4px; background: #F1EFE8; border-radius: 2px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 2px; }

        .upload-zone { border: 0.5px dashed #C8C6BE; border-radius: 12px; padding: 22px; text-align: center; cursor: pointer; transition: background 0.15s; }
        .upload-zone:hover { background: #F1EFE8; }
        .upload-icon { font-size: 26px; color: #bbb; margin-bottom: 8px; }
        .upload-text { font-size: 13px; color: #666; margin-bottom: 4px; }
        .upload-hint { font-size: 11px; color: #bbb; }
        .upload-btn { display: inline-block; margin-top: 12px; font-size: 12px; font-weight: 500; padding: 6px 16px; border-radius: 8px; border: 0.5px solid #B07D2A; color: #B07D2A; cursor: pointer; background: none; font-family: 'DM Sans', sans-serif; transition: background 0.15s; }
        .upload-btn:hover { background: #B07D2A15; }

        .export-card { background: #fff; border: 0.5px solid #E0DDD6; border-radius: 12px; padding: 18px 22px; }
        .export-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .export-header-left { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; }
        .export-header-icon { color: #B07D2A; font-size: 18px; }
        .export-header-right { font-size: 11px; color: #bbb; }
        .export-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .export-section-label { font-size: 11px; font-weight: 500; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
        .export-check { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #555; padding: 6px 0; border-bottom: 0.5px solid #F1EFE8; cursor: pointer; }
        .export-check:last-of-type { border-bottom: none; }
        .export-check input { accent-color: #B07D2A; width: 14px; height: 14px; cursor: pointer; flex-shrink: 0; }
        .format-tabs { display: flex; gap: 6px; margin-bottom: 16px; }
        .fmt-tab { font-size: 11px; padding: 4px 12px; border-radius: 100px; border: 0.5px solid #D3D1C7; background: none; cursor: pointer; font-family: 'DM Sans', sans-serif; color: #888; transition: all 0.15s; }
        .fmt-tab.active { background: #B07D2A15; border-color: #B07D2A; color: #B07D2A; font-weight: 500; }
        .fmt-tab:hover:not(.active) { background: #F1EFE8; }
        .dest-input { width: 100%; font-size: 13px; padding: 8px 12px; border-radius: 8px; border: 0.5px solid #D3D1C7; background: #F8F7F4; color: #1a1a1a; font-family: 'DM Sans', sans-serif; outline: none; margin-bottom: 10px; transition: border-color 0.15s; }
        .dest-input:focus { border-color: #B07D2A; }
        .send-btn { width: 100%; padding: 9px; border-radius: 8px; background: #B07D2A; color: #fff; font-size: 13px; font-weight: 500; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: center; gap: 6px; transition: opacity 0.15s; }
        .send-btn:hover:not(:disabled) { opacity: 0.88; }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .send-success { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #3B6D11; background: #EAF3DE; padding: 8px 12px; border-radius: 8px; margin-top: 8px; }
        .send-error { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #A32D2D; background: #FCEBEB; padding: 8px 12px; border-radius: 8px; margin-top: 8px; }

        @media (max-width: 900px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .grid2 { grid-template-columns: 1fr; }
          .export-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="shell">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="logo">Compliance<span>RGPD</span></div>
          <div className="top-nav">
            {[
              { label: "Dashboard",   href: "/dashboard" },
              { label: "Analyses",    href: "/dashboard/analyses" },
              { label: "Rapports",    href: "/dashboard/rapports" },
              { label: "Paramètres", href: "/dashboard/parametres" },
            ].map(({ label, href }) => (
              <button
                key={label}
                className={activeNav === label ? "active" : ""}
                onClick={() => { setActiveNav(label); router.push(href); }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="topbar-right">
            <span className="user-email">{user?.email}</span>
            <div className="avatar">{avatarInitials}</div>
            <button className="logout-btn" onClick={handleLogout}>Déconnexion</button>
          </div>
        </div>

        <div className="body">
          {/* SIDEBAR */}
          <div className="sidebar">
            <div className="sidebar-section">Navigation</div>
            {[
              { icon: "ti-layout-dashboard", label: "Tableau de bord", href: "/dashboard" },
              { icon: "ti-file-search",      label: "Mes analyses",    href: "/dashboard/analyses" },
              { icon: "ti-upload",           label: "Nouvelle analyse", href: "/analyse" },
              { icon: "ti-chart-bar",        label: "Rapports",         href: "/dashboard/rapports" },
            ].map(({ icon, label, href }) => (
              <div
                key={label}
                className={`sidebar-item${label === "Tableau de bord" ? " active" : ""}`}
                onClick={() => router.push(href)}
              >
                <i className={`ti ${icon}`} aria-hidden="true" />
                {label}
              </div>
            ))}
            <div className="sidebar-section">Compte</div>
            {[
              { icon: "ti-user",        label: "Mon profil",  href: "/dashboard/profil" },
              { icon: "ti-credit-card", label: "Abonnement",  href: "/abonnement" },
              { icon: "ti-settings",    label: "Paramètres",  href: "/dashboard/parametres" },
            ].map(({ icon, label, href }) => (
              <div key={label} className="sidebar-item" onClick={() => router.push(href)}>
                <i className={`ti ${icon}`} aria-hidden="true" />
                {label}
              </div>
            ))}
            <div className="plan-badge" style={{ marginTop: "auto" }}>
              <div className="plan-badge-title">Plan Business</div>
              <div className="plan-badge-sub">{Math.max(0, 50 - total)} analyses restantes</div>
              <div className="plan-bar-bg">
                <div className="plan-bar" style={{ width: `${Math.min(100, (total / 50) * 100)}%` }} />
              </div>
            </div>
          </div>

          {/* MAIN */}
          <div className="main">
            <div className="page-title">Tableau de bord</div>
            <div className="page-sub">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Bonjour 👋
            </div>

            {/* KPIs */}
            <div className="kpi-grid">
              <div className="kpi">
                <div className="kpi-label">Analyses totales</div>
                <div className="kpi-val">{total}</div>
                <div className="kpi-trend trend-up">Documents analysés</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">Score moyen</div>
                <div className="kpi-val">{scoreMoyen}<span style={{ fontSize: 14, fontWeight: 400 }}>%</span></div>
                <div className={`kpi-trend ${scoreMoyen >= 70 ? "trend-up" : scoreMoyen >= 50 ? "trend-warn" : "trend-danger"}`}>
                  {scoreMoyen >= 70 ? "Satisfaisant" : scoreMoyen >= 50 ? "À améliorer" : "Risque élevé"}
                </div>
              </div>
              <div className="kpi">
                <div className="kpi-label">Risques critiques</div>
                <div className="kpi-val">{critiques}</div>
                <div className={`kpi-trend ${critiques === 0 ? "trend-up" : "trend-danger"}`}>
                  {critiques === 0 ? "Aucun risque détecté" : "⚠ Nécessitent action"}
                </div>
              </div>
              <div className="kpi">
                <div className="kpi-label">En attente</div>
                <div className="kpi-val">{enAttente}</div>
                <div className={`kpi-trend ${enAttente === 0 ? "trend-up" : "trend-warn"}`}>
                  {enAttente === 0 ? "Tout est traité" : "⏳ Traitement en cours"}
                </div>
              </div>
            </div>

            {/* GRID 2 COL */}
            <div className="grid2">
              {/* Analyses récentes */}
              <div className="card">
                <div className="card-title">
                  Analyses récentes
                  <a href="/analyses">Voir tout →</a>
                </div>
                {analyses.length === 0 ? (
                  <div className="empty-state">
                    <i className="ti ti-file-off" style={{ fontSize: 28, display: "block", marginBottom: 8 }} aria-hidden="true" />
                    Aucune analyse pour le moment.<br />
                    <span style={{ color: "#B07D2A", cursor: "pointer" }} onClick={() => router.push("/analyse")}>
                      Analyser votre premier document →
                    </span>
                  </div>
                ) : (
                  analyses.slice(0, 5).map((a) => {
                    const statut = getStatut(a.score);
                    return (
                      <div key={a.id} className="ana-row">
                        <div
                          className="ana-icon"
                          style={{
                            background:
                              statut === "ok" ? "#EAF3DE" :
                              statut === "warn" ? "#FAEEDA" :
                              statut === "risk" ? "#FCEBEB" : "#F1EFE8",
                          }}
                        >
                          <i
                            className={`ti ${statut === "pending" ? "ti-loader" : "ti-file-text"}`}
                            style={{
                              color:
                                statut === "ok" ? "#3B6D11" :
                                statut === "warn" ? "#854F0B" :
                                statut === "risk" ? "#A32D2D" : "#888",
                              fontSize: 16,
                            }}
                            aria-hidden="true"
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="ana-name">{a.nom_document}</div>
                          <div className="ana-meta">
                            {formatRelativeDate(a.created_at)}
                            <span className="file-tag">
                              <i className="ti ti-file" aria-hidden="true" style={{ fontSize: 10 }} />
                              {getFileType(a.nom_document)}
                            </span>
                          </div>
                        </div>
                        <Badge score={a.score} />
                      </div>
                    );
                  })
                )}
              </div>

              {/* Score + Upload */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="card">
                  <div className="card-title">
                    Score de conformité
                    <span style={{ fontWeight: 400, fontSize: 12, color: "#bbb" }}>Ce mois</span>
                  </div>
                  <div className="score-wrap">
                    <div className="score-circle">
                      <svg viewBox="0 0 120 120" width="120" height="120">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="#F1EFE8" strokeWidth="10" />
                        <circle
                          cx="60" cy="60" r="50" fill="none"
                          stroke="#B07D2A" strokeWidth="10"
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                          strokeLinecap="round"
                          transform="rotate(-90 60 60)"
                        />
                      </svg>
                      <div className="score-num">{scoreMoyen}<small>/ 100</small></div>
                    </div>
                    <div className="score-satisf">
                      {scoreMoyen >= 75 ? "Satisfaisant" : scoreMoyen >= 50 ? "À améliorer" : scoreMoyen > 0 ? "Insuffisant" : "Aucune donnée"}
                    </div>
                    <div className="score-rows">
                      {SCORE_DETAIL.map((s) => (
                        <div key={s.label} className="score-row">
                          <span>{s.label}</span>
                          <div className="bar-bg">
                            <div className="bar-fill" style={{ width: `${s.val}%`, background: s.color }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 500, minWidth: 28, textAlign: "right" }}>{s.val}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="upload-zone" onClick={() => router.push("/analyse")}>
                  <div className="upload-icon"><i className="ti ti-cloud-upload" aria-hidden="true" /></div>
                  <div className="upload-text">Analyser un nouveau document</div>
                  <div className="upload-hint">PDF, TXT · max 10 Mo</div>
                  <button className="upload-btn">Choisir un fichier →</button>
                </div>
              </div>
            </div>

            {/* EXPORT EMAIL */}
            <div className="export-card">
              <div className="export-header">
                <div className="export-header-left">
                  <i className="ti ti-mail-forward export-header-icon" aria-hidden="true" />
                  Exporter un rapport par e-mail
                </div>
                <div className="export-header-right">PDF ou résumé texte</div>
              </div>

              <div className="export-grid">
                <div>
                  <div className="export-section-label">Contenu à inclure</div>
                  {options.map((o, i) => (
                    <label key={o.label} className="export-check">
                      <input
                        type="checkbox"
                        checked={o.checked}
                        onChange={() => toggleOption(i)}
                      />
                      {o.label}
                    </label>
                  ))}
                </div>

                <div>
                  <div className="export-section-label">Format d'export</div>
                  <div className="format-tabs">
                    {FORMATS.map((f) => (
                      <button
                        key={f}
                        className={`fmt-tab${activeFormat === f ? " active" : ""}`}
                        onClick={() => setActiveFormat(f)}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  <div className="export-section-label">Destinataires</div>
                  <input
                    className="dest-input"
                    type="email"
                    placeholder="DPO, direction, client…"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  />
                  <button className="send-btn" onClick={handleSend} disabled={sending || !email.trim()}>
                    <i className="ti ti-send" style={{ fontSize: 15 }} aria-hidden="true" />
                    {sending ? "Envoi en cours…" : "Envoyer le rapport"}
                  </button>
                  {sent && (
                    <div className="send-success">
                      <i className="ti ti-circle-check" style={{ fontSize: 16 }} aria-hidden="true" />
                      Rapport envoyé avec succès !
                    </div>
                  )}
                  {sendError && (
                    <div className="send-error">
                      <i className="ti ti-alert-circle" style={{ fontSize: 16 }} aria-hidden="true" />
                      {sendError}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
