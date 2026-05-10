export default async function Page({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;

  const titles: Record<string, string> = {
    analyses:   "Mes analyses",
    rapports:   "Rapports",
    profil:     "Mon profil",
    parametres: "Paramètres",
  };

  const title = titles[page] ?? page;

  return (
    <div style={{ padding: 40, fontFamily: "DM Sans, sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>{title}</h1>
      <p style={{ color: "#888", fontSize: 14 }}>Page en cours de construction.</p>
    </div>
  );
}
