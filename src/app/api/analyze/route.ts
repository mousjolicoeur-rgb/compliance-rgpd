import { analyzeDocument } from "@/lib/ai";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Charger la reglementation depuis Supabase
    const { data: reglements } = await supabaseAdmin
      .from("reglements")
      .select("code, source, article, titre, contenu, niveau_risque")
      .in("secteur", ["tous", "securite_privee"]);

    const { data: risques } = await supabaseAdmin
      .from("categories_risques")
      .select("type_donnee, description, gravite, action_corrective, delai")
      .eq("secteur", "securite_privee");

    const contextReglementaire = `
REGLEMENTS APPLICABLES :
${reglements?.map(r => `[${r.code}] ${r.source} - ${r.article} - ${r.titre} : ${r.contenu}`).join("\n")}

CATEGORIES DE RISQUES CONNUES :
${risques?.map(r => `- ${r.type_donnee} (${r.gravite}) : ${r.description} => Action : ${r.action_corrective} | Delai : ${r.delai}`).join("\n")}
    `;

    const result = await analyzeDocument(body.text, contextReglementaire);

    await supabaseAdmin.from("analyses").insert({
      client_id: body.client_id || null,
      nom_document: body.nom_document || "Document sans nom",
      contenu_analyse: body.text?.slice(0, 1000),
      score: result.score,
      risques: result.risques,
      actions: result.actions,
    });

    return Response.json(result);
  } catch (error) {
    console.error("Erreur analyse:", error);
    return Response.json(
      { error: "Erreur lors de l analyse", details: String(error) },
      { status: 500 }
    );
  }
}