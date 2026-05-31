import { NextResponse } from "next/server";
import { chat, isConfigured } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT_FR = `Tu es TriageIQ, un agent IA de triage de tickets pour equipes support B2B. Tu analyses un ticket entrant et tu produis une fiche de routage executive a destination du Head of Support.

Format de sortie exact en MARKDOWN :
**🎯 Classification**
- Categorie : [bug | demande de fonctionnalite | onboarding | facturation | incident | autre]
- Priorite : [P1 | P2 | P3 | P4]
- Urgence : [critique | elevee | moyenne | faible]
- Sentiment client : [calme | frustre | tres frustre]
- Produit/Module impacte : [zone du produit]

**🧠 Analyse**
- [2-3 puces qui expliquent POURQUOI cette priorite et cette categorie — references au texte du ticket, indices SLA, risque churn ou impact business]

**📬 Routage recommande**
- Equipe destinataire : [equipe + tier]
- Agent suggere : [profil type, ex: "ingenieur backend senior avec experience integration"]
- SLA cible : [duree]

**⚡ Actions immediates**
- [2-3 actions concretes : reponse type, escalade, requete d'info supplementaire, etc.]

Tu DOIS inventer une classification realiste meme si le ticket est court ou ambigu (pas de "je n'ai pas assez d'info"). Tu joues le role d'un analyste support senior qui doit decider en 10 secondes. Sois sobre et factuel. Maximum 300 mots.`;

const SYSTEM_PROMPT_EN = `You are TriageIQ, an AI ticket triage agent for B2B support teams. You analyze an incoming ticket and produce an executive routing brief for the Head of Support.

Exact MARKDOWN output format:
**🎯 Classification**
- Category: [bug | feature request | onboarding | billing | incident | other]
- Priority: [P1 | P2 | P3 | P4]
- Urgency: [critical | high | medium | low]
- Customer sentiment: [calm | frustrated | very frustrated]
- Affected product/module: [product area]

**🧠 Analysis**
- [2-3 bullets explaining WHY this priority and category — refer to the ticket text, SLA hints, churn risk or business impact]

**📬 Recommended routing**
- Target team: [team + tier]
- Suggested agent: [profile, e.g. "senior backend engineer with integration experience"]
- Target SLA: [duration]

**⚡ Immediate actions**
- [2-3 concrete actions: canned response, escalation, request more info, etc.]

You MUST invent a realistic classification even if the ticket is short or ambiguous (no "I don't have enough info"). You're playing the role of a senior support analyst who must decide in 10 seconds. Stay sober and factual. Maximum 300 words.`;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const ticket: string = typeof body.ticket === "string" ? body.ticket.slice(0, 4000) : "";
    const customer: string = typeof body.customer === "string" ? body.customer.slice(0, 200) : "";
    const lang: "fr" | "en" = body.lang === "en" ? "en" : "fr";

    if (!ticket.trim()) {
      return NextResponse.json(
        { error: lang === "fr" ? "Collez le texte du ticket." : "Paste the ticket text." },
        { status: 400 }
      );
    }

    if (!isConfigured()) {
      return NextResponse.json(
        {
          error: "llm_not_configured",
          message: lang === "fr"
            ? "Demo en mode statique — la cle LLM sera configuree au prochain deploiement."
            : "Static demo mode — LLM key will be configured at next deploy.",
          mockBrief: buildMockBrief(ticket, customer, lang),
        },
        { status: 200 }
      );
    }

    const userMsg = lang === "fr"
      ? `Client : ${customer || "non renseigne"}\n\nTicket :\n${ticket}\n\nProduis la fiche de triage.`
      : `Customer: ${customer || "unknown"}\n\nTicket:\n${ticket}\n\nProduce the triage brief.`;

    const { text, model } = await chat(
      [
        { role: "system", content: lang === "fr" ? SYSTEM_PROMPT_FR : SYSTEM_PROMPT_EN },
        { role: "user", content: userMsg },
      ],
      900
    );

    return NextResponse.json({ brief: text, model, generatedAt: new Date().toISOString() });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function buildMockBrief(ticket: string, customer: string, lang: "fr" | "en"): string {
  const c = customer || (lang === "fr" ? "Client inconnu" : "Unknown customer");
  const snippet = ticket.slice(0, 80).replace(/\n/g, " ");
  if (lang === "en") {
    return `**🎯 Classification**\n- Category: bug\n- Priority: P1\n- Urgency: critical\n- Customer sentiment: very frustrated\n- Affected product/module: API / Webhooks\n\n**🧠 Analysis**\n- Ticket from ${c} mentions production impact ("${snippet}..."). Tone is escalating — explicit mention of revenue loss suggests churn risk.\n- Pattern matches 3 recent incidents on the same module — likely regression after last deploy.\n- Enterprise tier customer (MRR > 10k) — internal SLA target is 1h first response.\n\n**📬 Recommended routing**\n- Target team: Engineering Tier 2 — Backend/Integrations\n- Suggested agent: Senior backend engineer with webhook expertise\n- Target SLA: 1h first response, 4h resolution\n\n**⚡ Immediate actions**\n- Send acknowledgment within 5 minutes with incident ID and ETA\n- Page on-call engineer via PagerDuty for webhook subsystem\n- Notify CSM so they can update the customer's executive sponsor`;
  }
  return `**🎯 Classification**\n- Categorie : bug\n- Priorite : P1\n- Urgence : critique\n- Sentiment client : tres frustre\n- Produit/Module impacte : API / Webhooks\n\n**🧠 Analyse**\n- Ticket de ${c} mentionne un impact production ("${snippet}..."). Le ton est en escalade — mention explicite d'une perte de revenu, risque churn.\n- Pattern qui colle avec 3 incidents recents sur le meme module — regression probable depuis le dernier deploiement.\n- Client tier enterprise (MRR > 10k) — SLA interne 1h en premiere reponse.\n\n**📬 Routage recommande**\n- Equipe destinataire : Engineering Tier 2 — Backend/Integrations\n- Agent suggere : Ingenieur backend senior avec expertise webhooks\n- SLA cible : 1h premiere reponse, 4h resolution\n\n**⚡ Actions immediates**\n- Envoyer un accuse de reception sous 5 minutes avec ID incident et ETA\n- Mobiliser l'astreinte via PagerDuty pour le sous-systeme webhooks\n- Prevenir le CSM pour qu'il informe l'executive sponsor du client`;
}
