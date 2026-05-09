import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEME_RGPD_SECURITE = `
Tu es un expert juridique specialise en RGPD et reglementation de la securite privee française.
Retourne UNIQUEMENT un JSON valide sans texte avant ni apres :
{
  "score": <0-100>,
  "niveau": <"CRITIQUE"|"ELEVE"|"MODERE"|"CONFORME">,
  "type_document": <type detecte>,
  "risques": [{"article": <ref legale>, "description": <risque>, "gravite": <"CRITIQUE"|"ELEVE"|"MODERE">}],
  "actions": [{"priorite": <1|2|3>, "action": <action>, "delai": <"Immediat"|"7 jours"|"30 jours">}],
  "points_conformes": [<elements conformes>]
}
`;

export async function analyzeDocument(text: string, contexte?: string) {
  const systemPrompt = contexte
    ? SYSTEME_RGPD_SECURITE + "\n\nCONTEXTE REGLEMENTAIRE :\n" + contexte
    : SYSTEME_RGPD_SECURITE;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Analyse ce document selon la reglementation securite privee française :\n\n${text}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type === "text") {
    const match = content.text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return { score: 0, niveau: "CRITIQUE", risques: [], actions: [], points_conformes: [] };
      }
    }
  }
  return { score: 0, niveau: "CRITIQUE", risques: [], actions: [], points_conformes: [] };
}
