"""TriageIQ demo backend — production-ready POC.

In production: this service would also pull ticket metadata from Zendesk/Jira,
enrich with customer tier from the CRM, and push routing decisions back via webhook.
For the demo: it only invokes the LLM and returns the triage brief.
"""
from datetime import datetime, timezone
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .llm import chat, is_configured

app = FastAPI(
    title="TriageIQ Demo Backend",
    description="POC backend — Groq/Gemini LLM. No third-party connections.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Prompts
# ─────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT_FR = """Tu es TriageIQ, un agent IA de triage de tickets pour equipes support B2B. Tu analyses un ticket entrant et tu produis une fiche de routage executive a destination du Head of Support.

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

Tu DOIS inventer une classification realiste meme si le ticket est court ou ambigu (pas de "je n'ai pas assez d'info"). Tu joues le role d'un analyste support senior qui doit decider en 10 secondes. Sois sobre et factuel. Maximum 300 mots."""

SYSTEM_PROMPT_EN = """You are TriageIQ, an AI ticket triage agent for B2B support teams. You analyze an incoming ticket and produce an executive routing brief for the Head of Support.

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

You MUST invent a realistic classification even if the ticket is short or ambiguous (no "I don't have enough info"). You're playing the role of a senior support analyst who must decide in 10 seconds. Stay sober and factual. Maximum 300 words."""


# ─────────────────────────────────────────────────────────────────────────────
# Models
# ─────────────────────────────────────────────────────────────────────────────
class GenerateRequest(BaseModel):
    ticket: str = Field(..., min_length=1, max_length=4000)
    customer: str = Field("", max_length=200)
    lang: Literal["fr", "en"] = "fr"


class GenerateResponse(BaseModel):
    brief: str
    model: str
    generated_at: str
    static_mode: bool = False


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "triageiq-backend",
        "llm_configured": is_configured(),
    }


@app.post("/process", response_model=GenerateResponse)
async def process(req: GenerateRequest) -> GenerateResponse:
    ticket = req.ticket.strip()
    customer = req.customer.strip()
    if not ticket:
        raise HTTPException(status_code=400, detail="empty_ticket")

    now_iso = datetime.now(timezone.utc).isoformat()
    user_msg = (
        f"Client : {customer or 'non renseigne'}\n\nTicket :\n{ticket}\n\nProduis la fiche de triage."
        if req.lang == "fr"
        else f"Customer: {customer or 'unknown'}\n\nTicket:\n{ticket}\n\nProduce the triage brief."
    )

    if not is_configured():
        return GenerateResponse(
            brief=_build_mock_brief(ticket, customer, req.lang),
            model="static-mock",
            generated_at=now_iso,
            static_mode=True,
        )

    try:
        text, model = await chat(
            [
                {"role": "system", "content": SYSTEM_PROMPT_FR if req.lang == "fr" else SYSTEM_PROMPT_EN},
                {"role": "user", "content": user_msg},
            ],
            max_tokens=900,
        )
    except Exception:
        return GenerateResponse(
            brief=_build_mock_brief(ticket, customer, req.lang),
            model="static-mock",
            generated_at=now_iso,
            static_mode=True,
        )

    return GenerateResponse(brief=text, model=model, generated_at=now_iso)


# ─────────────────────────────────────────────────────────────────────────────
# Mock brief (used when no LLM key configured)
# ─────────────────────────────────────────────────────────────────────────────
def _build_mock_brief(ticket: str, customer: str, lang: str) -> str:
    c = customer or ("Client inconnu" if lang == "fr" else "Unknown customer")
    snippet = ticket[:80].replace("\n", " ")
    if lang == "en":
        return (
            f"**🎯 Classification**\n"
            f"- Category: bug\n"
            f"- Priority: P1\n"
            f"- Urgency: critical\n"
            f"- Customer sentiment: very frustrated\n"
            f"- Affected product/module: API / Webhooks\n\n"
            f"**🧠 Analysis**\n"
            f"- Ticket from {c} mentions production impact (\"{snippet}...\"). Tone is escalating — explicit mention of revenue loss suggests churn risk.\n"
            f"- Pattern matches 3 recent incidents on the same module — likely regression after last deploy.\n"
            f"- Enterprise tier customer (MRR > 10k) — internal SLA target is 1h first response.\n\n"
            f"**📬 Recommended routing**\n"
            f"- Target team: Engineering Tier 2 — Backend/Integrations\n"
            f"- Suggested agent: Senior backend engineer with webhook expertise\n"
            f"- Target SLA: 1h first response, 4h resolution\n\n"
            f"**⚡ Immediate actions**\n"
            f"- Send acknowledgment within 5 minutes with incident ID and ETA\n"
            f"- Page on-call engineer via PagerDuty for webhook subsystem\n"
            f"- Notify CSM so they can update the customer's executive sponsor"
        )
    return (
        f"**🎯 Classification**\n"
        f"- Categorie : bug\n"
        f"- Priorite : P1\n"
        f"- Urgence : critique\n"
        f"- Sentiment client : tres frustre\n"
        f"- Produit/Module impacte : API / Webhooks\n\n"
        f"**🧠 Analyse**\n"
        f"- Ticket de {c} mentionne un impact production (\"{snippet}...\"). Le ton est en escalade — mention explicite d'une perte de revenu, risque churn.\n"
        f"- Pattern qui colle avec 3 incidents recents sur le meme module — regression probable depuis le dernier deploiement.\n"
        f"- Client tier enterprise (MRR > 10k) — SLA interne 1h en premiere reponse.\n\n"
        f"**📬 Routage recommande**\n"
        f"- Equipe destinataire : Engineering Tier 2 — Backend/Integrations\n"
        f"- Agent suggere : Ingenieur backend senior avec expertise webhooks\n"
        f"- SLA cible : 1h premiere reponse, 4h resolution\n\n"
        f"**⚡ Actions immediates**\n"
        f"- Envoyer un accuse de reception sous 5 minutes avec ID incident et ETA\n"
        f"- Mobiliser l'astreinte via PagerDuty pour le sous-systeme webhooks\n"
        f"- Prevenir le CSM pour qu'il informe l'executive sponsor du client"
    )
