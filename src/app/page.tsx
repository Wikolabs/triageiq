export default function Home() {
  const tickets = {
    critical: [
      { id: "T-0091", title: "Serveur prod DOWN", time: "2 min", sla: "15 min" },
      { id: "T-0087", title: "Auth API 500 errors", time: "8 min", sla: "15 min" },
    ],
    high: [
      { id: "T-0094", title: "Déploiement bloqué CI/CD", time: "22 min", sla: "2h" },
      { id: "T-0089", title: "VPN inaccessible RH", time: "35 min", sla: "2h" },
    ],
    medium: [
      { id: "T-0098", title: "Reset password Jira", time: "1h", sla: "8h" },
      { id: "T-0096", title: "Accès Drive partagé", time: "1h20", sla: "8h" },
    ],
  };

  return (
    <main style={{ color: "#1e293b" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200">
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.6rem", letterSpacing: "-0.02em", color: "#475569" }}>
          TriageIQ
        </span>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button data-cal-link="wikolabs-team/30min" data-cal-namespace="wk30min" data-cal-config='{"layout":"month_view"}' type="button" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: "#475569" }}>
            📅 Réserver un créneau →
          </button>
          <a href="https://wa.me/261386626100?text=Bonjour%2C%20je%20souhaite%20discuter%20de%20TriageIQ%20avec%20Wikolabs." target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: "#25d366", borderColor: "#25d366" }}>
            💬 WhatsApp →
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-12">
        <div className="inline-block px-3 py-1 rounded-md text-sm font-semibold mb-4" style={{ background: "#e2e8f0", color: "#475569" }}>
          Triage IA — IT Support
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(2.5rem,6vw,5rem)", lineHeight: 1, letterSpacing: "-0.03em", color: "#1e293b" }} className="mb-4">
          0 ticket non traité.<br /><span style={{ color: "#475569" }}>Jamais.</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-xl mb-6">
          TriageIQ classe, priorise et route chaque ticket entrant en moins de 3 secondes. Fini les files d'attente, les SLA ratés et le chaos des priorités.
        </p>
        <div className="flex gap-8 mb-8">
          {[["94%", "SLA respectés"], ["3s", "temps de triage"], ["-60%", "charge manuelle"]].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, color: "#475569" }}>{v}</div>
              <div className="text-sm text-slate-500">{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button data-cal-link="wikolabs-team/30min" data-cal-namespace="wk30min" data-cal-config='{"layout":"month_view"}' type="button" target="_blank" rel="noopener noreferrer" className="inline-block px-7 py-3.5 rounded-lg text-white font-semibold text-lg" style={{ background: "#475569" }}>
            📅 Réserver un créneau →
          </button>
          <a href="https://wa.me/261386626100?text=Bonjour%2C%20je%20souhaite%20discuter%20de%20TriageIQ%20avec%20Wikolabs." target="_blank" rel="noopener noreferrer" className="inline-block px-7 py-3.5 rounded-lg text-white font-semibold text-lg" style={{ background: "#25d366", borderColor: "#25d366" }}>
            💬 WhatsApp →
          </a>
        </div>
      </section>

      {/* Kanban Mockup */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="ml-2 text-sm text-slate-500 font-medium">TriageIQ — File tickets en direct</span>
          </div>
          <div className="grid grid-cols-3 gap-0 divide-x divide-slate-100">
            {/* Critical */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Critical</span>
                <span className="ml-auto bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-semibold">{tickets.critical.length}</span>
              </div>
              <div className="space-y-2">
                {tickets.critical.map((t) => (
                  <div key={t.id} className="border border-red-200 rounded-lg p-3 bg-red-50">
                    <div className="text-xs text-red-400 mb-1">{t.id}</div>
                    <div className="text-sm font-semibold text-slate-800">{t.title}</div>
                    <div className="text-xs text-slate-500 mt-1">Il y a {t.time} — SLA: {t.sla}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* High */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">High</span>
                <span className="ml-auto bg-amber-100 text-amber-600 text-xs px-2 py-0.5 rounded-full font-semibold">{tickets.high.length}</span>
              </div>
              <div className="space-y-2">
                {tickets.high.map((t) => (
                  <div key={t.id} className="border border-amber-200 rounded-lg p-3 bg-amber-50">
                    <div className="text-xs text-amber-400 mb-1">{t.id}</div>
                    <div className="text-sm font-semibold text-slate-800">{t.title}</div>
                    <div className="text-xs text-slate-500 mt-1">Il y a {t.time} — SLA: {t.sla}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Medium */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Medium</span>
                <span className="ml-auto bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full font-semibold">{tickets.medium.length}</span>
              </div>
              <div className="space-y-2">
                {tickets.medium.map((t) => (
                  <div key={t.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                    <div className="text-xs text-slate-400 mb-1">{t.id}</div>
                    <div className="text-sm font-semibold text-slate-800">{t.title}</div>
                    <div className="text-xs text-slate-500 mt-1">Il y a {t.time} — SLA: {t.sla}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2rem", color: "#1e293b" }} className="text-center mb-10">
            L'intelligence au coeur de votre support
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "⚡", title: "Classification automatique", desc: "Catégorie, urgence et équipe assignée déterminées en 3s dès la réception du ticket, via LLM fine-tuné." },
              { icon: "📊", title: "SLA Monitoring temps réel", desc: "Alertes avant dépassement, escalades automatiques et rapports hebdomadaires de performance par équipe." },
              { icon: "🔀", title: "Routage multicanal", desc: "Email, Slack, Jira, Zendesk — TriageIQ capte tout et envoie chaque ticket au bon endroit, toujours." },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-xl border border-slate-200">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "#1e293b" }} className="mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center" style={{ background: "#1e293b" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2.2rem", color: "white" }} className="mb-3">
          Votre backlog, vidé. Vos SLA, respectés.
        </h2>
        <p className="text-slate-400 mb-8">Audit gratuit de votre flux tickets en 48h.</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button data-cal-link="wikolabs-team/30min" data-cal-namespace="wk30min" data-cal-config='{"layout":"month_view"}' type="button" target="_blank" rel="noopener noreferrer" className="inline-block px-8 py-4 rounded-lg font-semibold text-lg" style={{ background: "#475569", color: "white" }}>
            📅 Réserver un créneau →
          </button>
          <a href="https://wa.me/261386626100?text=Bonjour%2C%20je%20souhaite%20discuter%20de%20TriageIQ%20avec%20Wikolabs." target="_blank" rel="noopener noreferrer" className="inline-block px-8 py-4 rounded-lg font-semibold text-lg" style={{ background: "#25d366", borderColor: "#25d366" }}>
            💬 WhatsApp →
          </a>
        </div>
      </section>

      <footer className="text-center py-6 text-sm text-slate-400 bg-white border-t border-slate-100">
        <p>&copy; 2025 TriageIQ &mdash; Un produit Wikolabs</p>
        <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs text-slate-400">
          <a href="mailto:team@wikolabs.com" className="hover:text-slate-600 transition-colors">team@wikolabs.com</a>
          <span>·</span>
          <a href="tel:+261386626100" className="hover:text-slate-600 transition-colors">+261 38 66 261 00</a>
          <span>·</span>
          <button data-cal-link="wikolabs-team/30min" data-cal-namespace="wk30min" data-cal-config='{"layout":"month_view"}' type="button" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors" style={{cursor:"pointer",background:"none",border:"none",padding:0,font:"inherit",color:"inherit",textDecoration:"none"}}>Prendre RDV</button>
        </div>
      </footer>
    </main>
  );
}
