import { analyzeDocument } from "@/lib/ai";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("user_id") as string;

    if (!file) {
      return Response.json({ error: "Aucun fichier" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = "";

    if (file.type === "application/pdf") {
      const pdfParse = (await import("pdf-parse")).default;
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else {
      text = buffer.toString("utf-8");
    }

    if (!text || text.trim().length < 10) {
      return Response.json({ error: "Document vide ou illisible" }, { status: 400 });
    }

    const result = await analyzeDocument(text.slice(0, 3000));

    await supabaseAdmin.from("analyses").insert({
      client_id: userId || null,
      nom_document: file.name,
      contenu_analyse: text.slice(0, 1000),
      score: result.score,
      risques: result.risques,
      actions: result.actions,
    });

    return Response.json(result);
  } catch (error) {
    console.error("Erreur upload:", error);
    return Response.json(
      { error: "Erreur traitement", details: String(error) },
      { status: 500 }
    );
  }
}