# TriageIQ — Triage intelligent de tickets IT & gestion des incidents

> Les incidents critiques résolus en minutes, pas en heures. Zéro ticket perdu dans la pile.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat&logo=redis)](https://redis.io)

---

## Vue d'ensemble

TriageIQ est une plateforme de triage et gestion des incidents IT. Elle classifie automatiquement les tickets par priorité (P1-P4) via NLP, gère les SLAs en temps réel, attribue les tickets aux bonnes équipes selon la compétence et la charge, et détecte les incidents majeurs (corrélation de tickets similaires).

**Domaine :** IT Service Management (ITSM) / DevOps  
**Port VM :** 3009 | **Sous-domaine :** triageiq.wikolabs.com

---

## Stack technique

| Couche | Technologie | Rôle |
|--------|------------|------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS | Incident board, SLA monitor, on-call dashboard |
| Backend | FastAPI (Python 3.11), Uvicorn | API incidents, routing, SLA engine |
| NLP | spaCy + scikit-learn | Classification priorité + équipe |
| Real-time | WebSocket + Redis Pub/Sub | Alertes P1 en temps réel |
| Base de données | PostgreSQL 16 | Tickets, incidents, SLA logs |
| Cache | Redis 7 | Pub/Sub alertes, file on-call |
| Scheduler | APScheduler | SLA breach detection (scan every 1 min) |
| Infra | Docker Compose, Nginx | VM mono-repo (port 3009) |

### backend/requirements.txt
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
spacy==3.7.4
scikit-learn==1.4.2
asyncpg==0.29.0
sqlalchemy[asyncio]==2.0.30
redis==5.0.4
apscheduler==3.10.4
pydantic==2.7.1
pandas==2.2.2
python-dateutil==2.9.0
```

---

## Architecture mono-repo

```
triageiq/
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx              # Incident board P1-P4 + SLA status
│   │   ├── incidents/[id]/       # Détail incident + timeline
│   │   ├── oncall/               # Planning on-call + escalation
│   │   └── analytics/            # MTTR, SLA compliance, volume
│   └── src/components/
│       ├── IncidentBoard.tsx     # Kanban P1/P2/P3/P4 avec SLA timer
│       ├── SlaTimer.tsx          # Compte à rebours SLA rouge/orange/vert
│       ├── RoutingBadge.tsx      # Équipe assignée + expertise match
│       ├── CorrelationAlert.tsx  # "5 tickets similaires détectés → INCIDENT"
│       └── MttrChart.tsx         # Mean Time to Resolve par équipe
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── tickets.py        # CRUD tickets + prioritization
│   │   │   ├── incidents.py      # Corrélation + incident majeur
│   │   │   └── oncall.py         # Planning escalation
│   │   ├── services/
│   │   │   ├── classifier.py     # spaCy + sklearn priority classifier
│   │   │   ├── sla_engine.py     # SLA breach detection + escalation
│   │   │   ├── correlation.py    # Clustering tickets similaires
│   │   │   └── routing.py        # Assignment par expertise/charge
│   │   └── models/
│   │       ├── ticket.py
│   │       └── incident.py
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml
└── .github/workflows/deploy.yml
```

---

## Diagrammes UML

### Architecture système

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#dc2626', 'primaryTextColor': '#fff', 'primaryBorderColor': '#b91c1c', 'lineColor': '#374151', 'secondaryColor': '#fef2f2'}}}%%
flowchart TB
    subgraph VM["🖥️ VM — Docker Compose (port 3009)"]
        NEXT["Next.js 14\nIncident Board"]
        API["FastAPI + WebSocket"]
        SCHED["APScheduler\nSLA check every 1min"]

        subgraph TRIAGE["🚨 Triage Engine"]
            CLASS["spaCy + sklearn\nPriority P1-P4"]
            CORREL["Clustering\nIncident detection"]
            SLA["SLA Engine\nBreach + escalation"]
            ROUTE["Routing\nExpertise + load"]
        end

        PG[("PostgreSQL\nTickets + Incidents")]
        REDIS[("Redis\nPub/Sub Alertes P1")]
    end

    ALERTS["On-Call Team\nSMS/Slack"] --> REDIS
    SCHED --> SLA
```

### Séquence — Triage d'un incident P1

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#dc2626', 'primaryTextColor': '#fff', 'lineColor': '#374151'}}}%%
sequenceDiagram
    participant MON as Monitoring
    participant API as FastAPI
    participant CLASS as Classifier
    participant CORREL as Correlation
    participant SLA as SLA Engine
    participant ONCALL as On-Call

    MON->>API: POST /tickets {title: "Serveur prod DOWN", source: "alertmanager"}

    API->>CLASS: classify_priority(title, body, source)
    CLASS-->>API: priority=P1, confidence=0.97, team=infrastructure

    API->>CORREL: find_similar(ticket, window=15min)
    CORREL-->>API: similar_count=4

    alt similar_count >= 3
        API->>API: create_incident(major=true, affected_tickets=[...])
        API->>REDIS: PUBLISH p1_alert {incident_id, title}
        REDIS-->>ONCALL: push notification + SMS
    end

    API->>SLA: start_sla_timer(ticket_id, priority=P1, breach_at=now+15min)
    SLA-->>API: sla_deadline=14:47:00

    API-->>MON: {ticket_id: "T-0091", priority: "P1", assigned_to: "infra_team", sla_deadline: "14:47"}
```

### Modèle de données (ER)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#dc2626', 'primaryTextColor': '#fff', 'lineColor': '#374151'}}}%%
erDiagram
    TICKET {
        uuid id PK
        string title
        text description
        string priority
        float priority_confidence
        string team_assigned
        string status
        string source
        timestamp sla_deadline
        boolean sla_breached
        int resolution_time_minutes
        timestamp created_at
        timestamp resolved_at
    }
    INCIDENT {
        uuid id PK
        string title
        boolean is_major
        int affected_tickets_count
        string status
        string postmortem_url
        timestamp detected_at
        timestamp resolved_at
    }
    SLA_POLICY {
        string priority PK
        int first_response_minutes
        int resolution_minutes
        string escalation_contacts
    }
    ON_CALL_SCHEDULE {
        uuid id PK
        string team
        string member_name
        timestamp start_time
        timestamp end_time
    }

    TICKET }o--o| INCIDENT : "part_of"
    TICKET }o--|| SLA_POLICY : "governs"
```

### Cycle de vie d'un ticket

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#dc2626', 'primaryTextColor': '#fff', 'lineColor': '#374151'}}}%%
stateDiagram-v2
    [*] --> NEW : ticket reçu
    NEW --> ASSIGNED : classification + routing
    ASSIGNED --> IN_PROGRESS : agent prend en charge
    IN_PROGRESS --> ESCALATED : SLA breach OU complexity
    ESCALATED --> IN_PROGRESS : équipe L2/L3 prend
    IN_PROGRESS --> RESOLVED : fix déployé
    RESOLVED --> CLOSED : confirmation client (24h)
    RESOLVED --> REOPENED : problème récurrent
    REOPENED --> IN_PROGRESS : réouverture
    CLOSED --> [*]
```

---

## PRD

### Problème
Les équipes IT reçoivent des dizaines de tickets par heure. Sans triage automatique, les P1 se noient dans la masse. Les SLAs sont breachés sans que personne ne soit alerté. L'on-call manager ne sait pas quel ingénieur contacter en premier.

### Solution
TriageIQ classifie chaque ticket en < 1 seconde (P1-P4), démarre le chrono SLA, route vers la bonne équipe selon la compétence et la charge, et détecte automatiquement les incidents majeurs par corrélation. Les alertes P1 réveillent l'on-call en < 30 secondes.

### Utilisateurs cibles
| Persona | Besoin |
|---------|--------|
| Ingénieur On-Call | Être alerté immédiatement sur les P1, voir l'état global |
| Support IT L1 | File de tickets priorisée, SLA visible |
| Manager ITSM | MTTR, SLA compliance, volume par équipe |

### OKRs
- SLA P1 (15 min) respecté à 95%
- MTTR réduit de 40%
- Zéro P1 non détecté dans la masse des tickets

---

## User Stories

```
US-01 [On-Call] En tant qu'ingénieur on-call,
      je veux recevoir une alerte SMS dans les 30 secondes
      quand un ticket P1 est créé ou qu'un incident majeur est détecté
      afin de réagir immédiatement.

US-02 [L1 Support] En tant qu'agent L1,
      je veux voir mes tickets triés par priorité avec le chrono SLA
      afin de traiter les P1 en premier et ne jamais breacher.

US-03 [Manager] En tant que manager ITSM,
      je veux voir le MTTR par équipe et par priorité ce mois
      afin d'identifier quelle équipe a besoin de renfort.

US-04 [Système] En tant que système de corrélation,
      je veux détecter quand 3+ tickets similaires arrivent en 15 minutes
      et créer automatiquement un incident majeur
      afin d'éviter que chaque ingénieur traite le même problème séparément.

US-05 [Ingénieur] En tant qu'ingénieur,
      je veux que l'assignation soit automatique selon mon expertise
      (infra, backend, frontend, DB) et ma charge actuelle
      afin d'avoir une distribution équitable.
```

---

## Règles métier

| # | Règle | Description | Simulable UI |
|---|-------|-------------|-------------|
| R1 | SLA P1 | FRT 15 min, résolution 4h | ✅ Chrono P1 |
| R2 | SLA P2 | FRT 1h, résolution 8h | ✅ Chrono P2 |
| R3 | SLA P3/P4 | FRT 4h/8h, résolution 24h/72h | ✅ Chrono chart |
| R4 | Escalation breach | SLA ≥ 80% écoulé → escalade manager automatique | ✅ Escalation |
| R5 | Incident detection | ≥ 3 tickets similaires en 15min → incident majeur | ✅ Cluster demo |
| R6 | Auto-assign | Routing par expertise × charge × on-call | ✅ Load balancer |
| R7 | P1 notification | SMS + WebSocket push en < 30 secondes | ✅ Push demo |
| R8 | Postmortem | Incident résolu → postmortem obligatoire (template) | ✅ Template |
| R9 | Maintenance window | Tickets non-urgents suspendus pendant maintenance | ✅ MW toggle |
| R10 | Duplicate detect | Ticket similaire > 85% → fusionner ou lier | ✅ Merge UI |

---

## Spécification API

**Base URL :** `http://triageiq.wikolabs.com/api/v1`

### POST /tickets
```json
{"title": "API Gateway 503", "description": "...", "source": "datadog", "environment": "prod"}
// Response: {"ticket_id": "T-0091", "priority": "P1", "assigned_to": "infra_team", "sla_deadline": "2024-03-15T14:47:00Z", "incident_created": true}
```

### GET /incidents/active
```json
// Response: {"incidents": [{"id": "INC-042", "priority": "P1", "affected_tickets": 4, "status": "in_progress", "elapsed_minutes": 8}]}
```

### GET /metrics
```json
// Response: {"mttr_p1_avg_minutes": 42, "sla_compliance_p1": 0.94, "open_tickets": 23, "p1_count": 2}
```

---

## Simulation UI

| Composant | Description |
|-----------|-------------|
| **Incident Board** | Colonnes P1/P2/P3/P4 avec chrono SLA animé (vert→orange→rouge) |
| **SLA Timer** | Compte à rebours par ticket avec alerte visuelle |
| **Correlation Alert** | Bandeau rouge "Incident détecté : 4 tickets similaires en 12 min" |
| **MTTR Chart** | Recharts : MTTR par équipe sur 30 jours |
| **On-Call Roster** | Planning semaine avec engineer disponible en surbrillance |

---

## Déploiement

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16-alpine
    environment: {POSTGRES_DB: triageiq, POSTGRES_USER: tq_user, POSTGRES_PASSWORD: "${POSTGRES_PASSWORD}"}
  redis:
    image: redis:7-alpine
  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql+asyncpg://tq_user:${POSTGRES_PASSWORD}@postgres/triageiq
      REDIS_URL: redis://redis:6379
    depends_on: [postgres, redis]
    expose: ["8000"]
  frontend:
    build: ./frontend
    expose: ["3000"]
  nginx:
    image: nginx:alpine
    ports: ["3009:80"]
volumes:
  pg_data:
```

---

## Roadmap

### Phase 1 — MVP
- [ ] Classification priorité (règles + NLP)
- [ ] Incident board avec SLA timers
- [ ] Alertes WebSocket P1

### Phase 2 — Automatisation
- [ ] Corrélation incidents (clustering)
- [ ] Escalation automatique SLA breach
- [ ] On-call scheduling

### Phase 3 — Intelligence
- [ ] Prédiction recurrence (ML)
- [ ] Auto-remediation (runbooks)
- [ ] Intégration PagerDuty / OpsGenie

---

*Un produit [Wikolabs](https://wikolabs.com) — Intelligence artificielle appliquée aux métiers*
