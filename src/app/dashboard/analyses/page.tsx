"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type Analyse = {
  id: string;
  nom: string;
  type: string;
  score: number | null;
  statut: "ok" | "warn" | "risk" | "pending";
  created_at: string;
};

type SortKey = "date" | "score-desc" | "score-asc" | "name";
type FilterKey = "all" | "ok" | "warn" | "risk" | "pending";

const PAGE_SIZE = 10;

function Badge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; className: string }> = {
    ok:      { label: "Conforme",      className: "badge-ok" },
    warn:    { label: "Attention",     className: "badge-warn" },
    risk:    { label: "Risque élevé",  className: "badge-risk" },
    pending: { label: "En traitement", className: "badge-pending" },
  };
  const { label, className } = map[statut] ?? map.pending;
  return <span className={`badge ${className}`}>{label}</span>;
}

function ScoreCell({ score, statut }: { score: number | null; statut: string }) {
  if (score === null) return <span style={{ color: "#bbb" }}>—</span>;
  const color = statut === "ok" ? "#3B6D11" : statut === "warn" ? "#B07D2A" : "#A32D2D";
  return <span style={{ fontWeight: 600, color }}>{score}%</span>;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return "À l'instant";
  if (h < 24) return `Il y a ${h}h`;
  if (d === 1) return "Hier";
  if (d < 7) return `Il y a ${d}j`;
  return `Il y a ${Math.floor(d / 7)} sem.`;
}

export default function AnalysesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [analyses, setAnalyses] = useState<Analyse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("date");
  const [page, setPage] = useState(1);

  const loadAnalyses = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data } = await supabase
      .from("analyses")
      .select("id, nom_document, type, score, statut, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setAnalyses(
      (data ?? []).map((row) => ({
        id:         row.id,
        nom:        row.nom_document as string,
        type:       (row.type as string) || "DOC",
        score:      row.score as number | null,
        statut:     (row.statut as Analyse["statut"]) || "pending",
        created_at: row.created_at as string,
      }))
    );
    setLoading(false);
  };

  useEffect(() => { loadAnalyses(); }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cette analyse ?")) return;
    await supabase.from("analyses").delete().eq("id", id);
    setAnalyses(prev => prev.filter(a => a.id !== id));
  };

  const filtered = useMemo(() => {
    let list = [...analyses];
    if (filter !== "all") list = list.filter(a => a.statut === filter);
    if (search.trim()) list = list.filter(a => a.nom.toLowerCase().includes(search.toLowerCase()));
    if (sort === "score-desc") list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    if (sort === "score-asc")  list.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
    if (sort === "name")       list.sort((a, b) => a.nom.localeCompare(b.nom));
    return list;
  }, [analyses, filter, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = {
    total:   analyses.length,
    ok:      analyses.filter(a => a.statut === "ok").length,
    risk:    analyses.filter(a => a.statut === "risk").length,
    pending: analyses.filter(a => a.statut === "pending").length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #F8F7F4; color: #1a1a1a; }
        .page { padding: 28px 32px; max-width: 1100px; }
        .back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #888; cursor: pointer; margin-bottom: 16px; background: none; border: none; font-family: 'DM Sans', sans-serif; }
        .back:hover { color: #B07D2A; }
        .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 4px; }
        .title { font-family: 'DM Serif Display', serif; font-size: 24px; }
        .sub { font-size: 13px; color: #888; margin-bottom: 20px; }
        .new-btn { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; padding: 8px 16px; border-radius: 8px; background: #B07D2A; color: #fff; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .new-btn:hover { opacity: 0.88; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
        .stat { background: #F1EFE8; border-radius: 10px; padding: 12px 16px; }
        .stat-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px; }
        .stat-val { font-size: 22px; font-weight: 600; }
        .toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
        .search { flex: 1; min-width: 180px; display: flex; align-items: center; gap: 8px; padding: 7px 12px; border-radius: 8px; border: 0.5px solid #D3D1C7; background: #fff; }
        .search input { background: none; border: none; outline: none; font-size: 13px; color: #1a1a1a; font-family: 'DM Sans', sans-serif; width: 100%; }
        .filter { font-size: 12px; padding: 6px 14px; border-radius: 100px; border: 0.5px solid #D3D1C7; background: none; cursor: pointer; font-family: 'DM Sans', sans-serif; color: #888; transition: all 0.15s; white-space: nowrap; }
        .filter.active { background: #B07D2A15; border-color: #B07D2A; color: #B07D2A; font-weight: 500; }
        .filter:hover:not(.active) { background: #F1EFE8; }
        .sort-sel { font-size: 12px; padding: 6px 10px; border-radius: 8px; border: 0.5px solid #D3D1C7; background: #F8F7F4; color: #888; font-family: 'DM Sans', sans-serif; cursor: pointer; }
        .table { background: #fff; border: 0.5px solid #E0DDD6; border-radius: 12px; overflow: hidden; }
        .thead { display: grid; grid-template-columns: 2fr 70px 130px 80px 100px; padding: 10px 20px; border-bottom: 0.5px solid #E0DDD6; background: #F8F7F4; }
        .th { font-size: 11px; font-weight: 500; color: #888; text-transform: uppercase; letter-spacing: 0.4px; }
        .row { display: grid; grid-template-columns: 2fr 70px 130px 80px 100px; padding: 12px 20px; border-bottom: 0.5px solid #F1EFE8; align-items: center; transition: background 0.12s; }
        .row:last-child { border-bottom: none; }
        .row:hover { background: #F8F7F4; }
        .doc-name { font-size: 13px; font-weight: 500; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 340px; }
        .doc-meta { font-size: 11px; color: #aaa; display: flex; align-items: center; gap: 6px; }
        .file-tag { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; padding: 1px 6px; border-radius: 100px; background: #F1EFE8; color: #888; }
        .badge { font-size: 11px; padding: 3px 9px; border-radius: 100px; font-weight: 500; }
        .badge-ok      { background: #EAF3DE; color: #3B6D11; }
        .badge-warn    { background: #FAEEDA; color: #854F0B; }
        .badge-risk    { background: #FCEBEB; color: #A32D2D; }
        .badge-pending { background: #F1EFE8;  color: #888; }
        .action-btn { width: 28px; height: 28px; border-radius: 6px; border: 0.5px solid #E0DDD6; background: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; color: #888; transition: all 0.15s; margin-right: 4px; }
        .action-btn:hover { background: #F1EFE8; color: #1a1a1a; }
        .action-btn.del:hover { background: #FCEBEB; color: #A32D2D; border-color: #F09595; }
        .empty { padding: 48px; text-align: center; color: #888; font-size: 13px; }
        .pagination { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-top: 0.5px solid #E0DDD6; font-size: 12px; color: #888; }
        .page-btns { display: flex; gap: 4px; }
        .page-btn { width: 28px; height: 28px; border-radius: 6px; border: 0.5px solid #E0DDD6; background: none; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; font-family: 'DM Sans', sans-serif; color: #888; }
        .page-btn.active { background: #B07D2A; border-color: #B07D2A; color: #fff; }
        .page-btn:hover:not(.active) { background: #F1EFE8; }
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .loading { padding: 48px; text-align: center; color: #888; font-size: 13px; }
        @media (max-width: 768px) {
          .stats { grid-template-columns: repeat(2,1fr); }
          .thead, .row { grid-template-columns: 1fr 120px 90px; }
          .th:nth-child(2), .row > *:nth-child(2),
          .th:nth-child(4), .row > *:nth-child(4) { display: none; }
        }
      `}</style>

      <div className="page">
        <button className="back" onClick={() => router.push("/dashboard")}>
          <i className="ti ti-arrow-left" aria-hidden="true" /> Retour au dashboard
        </button>

        <div className="header">
          <div className="title">Mes analyses</div>
          <button className="new-btn" onClick={() => router.push("/analyse")}>
            <i className="ti ti-plus" style={{ fontSize: 15 }} aria-hidden="true" />
            Nouvelle analyse
          </button>
        </div>
        <div className="sub">Historique complet de vos documents analysés</div>

        {/* STATS */}
        <div className="stats">
          <div className="stat">
            <div className="stat-label">Total</div>
            <div className="stat-val">{stats.total}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Conformes</div>
            <div className="stat-val" style={{ color: "#3B6D11" }}>{stats.ok}</div>
          </div>
          <div className="stat">
            <div className="stat-label">À risque</div>
            <div className="stat-val" style={{ color: "#A32D2D" }}>{stats.risk}</div>
          </div>
          <div className="stat">
            <div className="stat-label">En attente</div>
            <div className="stat-val" style={{ color: "#B07D2A" }}>{stats.pending}</div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="toolbar">
          <div className="search">
            <i className="ti ti-search" style={{ fontSize: 16, color: "#aaa" }} aria-hidden="true" />
            <input
              type="text"
              placeholder="Rechercher un document…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          {(["all", "ok", "warn", "risk", "pending"] as FilterKey[]).map(f => (
            <button
              key={f}
              className={`filter${filter === f ? " active" : ""}`}
              onClick={() => { setFilter(f); setPage(1); }}
            >
              {{ all: "Tous", ok: "Conformes", warn: "Attention", risk: "Risque élevé", pending: "En attente" }[f]}
            </button>
          ))}
          <select className="sort-sel" value={sort} onChange={e => setSort(e.target.value as SortKey)}>
            <option value="date">Plus récents</option>
            <option value="score-desc">Score ↑</option>
            <option value="score-asc">Score ↓</option>
            <option value="name">Nom A–Z</option>
          </select>
        </div>

        {/* TABLE */}
        <div className="table">
          <div className="thead">
            <div className="th">Document</div>
            <div className="th">Type</div>
            <div className="th">Statut</div>
            <div className="th">Score</div>
            <div className="th">Actions</div>
          </div>

          {loading ? (
            <div className="loading">
              <i className="ti ti-loader" style={{ fontSize: 20, marginBottom: 8, display: "block" }} aria-hidden="true" />
              Chargement des analyses…
            </div>
          ) : paginated.length === 0 ? (
            <div className="empty">
              <i className="ti ti-file-off" style={{ fontSize: 28, marginBottom: 10, display: "block" }} aria-hidden="true" />
              Aucune analyse trouvée.
              <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
                <button className="new-btn" onClick={() => router.push("/analyse")}>
                  <i className="ti ti-plus" aria-hidden="true" /> Lancer une analyse
                </button>
              </div>
            </div>
          ) : (
            paginated.map(a => (
              <div key={a.id} className="row">
                <div>
                  <div className="doc-name">{a.nom}</div>
                  <div className="doc-meta">
                    <span className="file-tag">
                      <i className="ti ti-file" style={{ fontSize: 10 }} aria-hidden="true" />
                      {a.type}
                    </span>
                    {timeAgo(a.created_at)}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>{a.type}</div>
                <div><Badge statut={a.statut} /></div>
                <div><ScoreCell score={a.score} statut={a.statut} /></div>
                <div>
                  <button
                    className="action-btn"
                    title="Voir le rapport"
                    onClick={() => router.push(`/dashboard/analyses/${a.id}`)}
                  >
                    <i className="ti ti-eye" aria-hidden="true" />
                  </button>
                  <button className="action-btn" title="Télécharger">
                    <i className="ti ti-download" aria-hidden="true" />
                  </button>
                  <button
                    className="action-btn del"
                    title="Supprimer"
                    onClick={e => { e.stopPropagation(); handleDelete(a.id); }}
                  >
                    <i className="ti ti-trash" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))
          )}

          <div className="pagination">
            <span>
              {filtered.length} analyse{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
            </span>
            <div className="page-btns">
              <button
                className="page-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <i className="ti ti-chevron-left" style={{ fontSize: 13 }} aria-hidden="true" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  className={`page-btn${page === n ? " active" : ""}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                className="page-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <i className="ti ti-chevron-right" style={{ fontSize: 13 }} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
