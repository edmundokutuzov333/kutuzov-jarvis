export function SessionInfoPanel() {
  return (
    <section className="session-panel" aria-labelledby="session-panel-title">
      <div className="session-panel__eyebrow">JARVIS / SESSION PROTOCOL</div>
      <h2 id="session-panel-title">Uma conversa nova, sempre.</h2>
      <p>Esta sessão é efémera: quando entra no site, começa de novo e não encontra conversas antigas.</p>
      <div className="session-panel__list">
        <div><strong>Sem histórico persistente</strong><span>As mensagens não são guardadas como memória do visitante.</span></div>
        <div><strong>Voz por consentimento</strong><span>O microfone só é activado quando escolhe falar com o JARVIS.</span></div>
        <div><strong>Conhecimento público</strong><span>As respostas sobre Edmundo são baseadas no portefólio e em fontes públicas verificadas.</span></div>
      </div>
      <p className="session-panel__status">Estado: sessão limpa · voz pronta quando activar</p>
    </section>
  );
}
