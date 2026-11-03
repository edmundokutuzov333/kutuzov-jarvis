import { useState } from "react";
import { ConversationWorkspace } from "./ConversationWorkspace";
import { FloatingWindow } from "./FloatingWindow";
import { NoiseAtmosphere } from "./NoiseAtmosphere";
import { ProjectWindow } from "./ProjectWindow";
import { VoiceConsole } from "./VoiceConsole";
import { useLiveVoice } from "../voice/live-session";
import type { KnowledgeEntry } from "../knowledge/schema";

export function App() {
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [conversationVisible, setConversationVisible] = useState(true);
  const [activeWindow, setActiveWindow] = useState("conversation");
  const [projectWindows, setProjectWindows] = useState<KnowledgeEntry[]>([]);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceNotice, setVoiceNotice] = useState("");

  const voice = useLiveVoice({
    onInputTranscript: (text) => setVoiceTranscript(text),
    onOutputTranscript: (text) => setVoiceNotice(text.slice(-220)),
    onError: (message) => setVoiceNotice(message),
  });

  const voiceBusy = voice.state === "processing" || voice.state === "listening" || voice.state === "speaking";
  const coreBusy = assistantBusy || voiceBusy;

  function openProject(project: KnowledgeEntry) {
    setProjectWindows((current) => current.some((item) => item.id === project.id) ? current : [...current, project]);
    setActiveWindow("project-" + project.id);
  }

  function closeProject(projectId: string) {
    setProjectWindows((current) => current.filter((project) => project.id !== projectId));
    setActiveWindow("conversation");
  }

  return (
    <main className="jarvis-desktop" data-testid="jarvis-desktop">
      <div className="desktop-atmosphere" aria-hidden="true" />
      <NoiseAtmosphere patternSize={256} patternRefreshInterval={2} patternAlpha={18} />
      <header className="desktop-topbar">
        <a className="desktop-brand" href="/" aria-label="Edmundo Kutuzov, início">
          <span className="desktop-brand__mark">EK<span>.</span></span>
          <span className="desktop-brand__name">EDMUNDO KUTUZOV</span>
        </a>
        <span className="desktop-topbar__signal"><i /> LIVE CREATIVE SYSTEM</span>
      </header>

      <section className="core-stage" aria-label="Identidade visual de Edmundo Kutuzov">
        <div className="core-orb" data-testid="jarvis-core" data-state={coreBusy ? "thinking" : "idle"} role="img" aria-label={coreBusy ? "A preparar uma resposta" : "Animação visual de Edmundo Kutuzov"}>
          <div className="core-orb__aura" />
          <div className="core-orb__halo core-orb__halo--one" />
          <div className="core-orb__halo core-orb__halo--two" />
          <div className="core-orb__ring core-orb__ring--outer" />
          <div className="core-orb__ring core-orb__ring--middle" />
          <div className="core-orb__ring core-orb__ring--inner" />
          <div className="core-orb__orbit core-orb__orbit--one" />
          <div className="core-orb__orbit core-orb__orbit--two" />
          <div className="core-orb__energy">
            <span className="core-orb__plasma core-orb__plasma--one" />
            <span className="core-orb__plasma core-orb__plasma--two" />
            <span className="core-orb__plasma core-orb__plasma--three" />
            <span className="core-orb__plasma core-orb__plasma--four" />
            <span className="core-orb__filament core-orb__filament--one" />
            <span className="core-orb__filament core-orb__filament--two" />
            <span className="core-orb__filament core-orb__filament--three" />
            <span className="core-orb__light" />
          </div>
          <span className="core-orb__particle core-orb__particle--one" />
          <span className="core-orb__particle core-orb__particle--two" />
          <span className="core-orb__particle core-orb__particle--three" />
          <span className="core-orb__particle core-orb__particle--four" />
          <span className="core-orb__particle core-orb__particle--five" />
          <span className="core-orb__particle core-orb__particle--six" />
          <div className="core-orb__pulse core-orb__pulse--one" />
          <div className="core-orb__pulse core-orb__pulse--two" />
        </div>
        <div className="core-stage__identity">
          <span className="eyebrow">EDMUNDO KUTUZOV / JARVIS</span>
          <h1>Estou por aqui.</h1>
          <p>Fala comigo. Explora o meu trabalho. Abre uma janela para cada ideia.</p>
        </div>
        <VoiceConsole voice={voice} />
        {voiceNotice ? <span className="voice-console__notice" role="status">{voiceNotice}</span> : null}
      </section>

      {conversationVisible ? (
        <FloatingWindow id="conversation" title="Conversa comigo" initialClass="window--conversation" zIndex={activeWindow === "conversation" ? 30 : 20} onFocus={() => setActiveWindow("conversation")} onClose={() => setConversationVisible(false)}>
          <ConversationWorkspace historyEnabled={false} onBusyChange={setAssistantBusy} voice={voice} voiceTranscript={voiceTranscript} onOpenProject={openProject} />
        </FloatingWindow>
      ) : null}

      {projectWindows.map((project, index) => (
        <FloatingWindow
          key={project.id}
          id={"project-" + project.id}
          title={project.title}
          initialClass={"window--project window--project-" + (index % 3)}
          zIndex={activeWindow === "project-" + project.id ? 40 : 25 + index}
          onFocus={() => setActiveWindow("project-" + project.id)}
          onClose={() => closeProject(project.id)}
        >
          <ProjectWindow project={project} />
        </FloatingWindow>
      ))}

      <nav className="desktop-dock" aria-label="Opções">
        <button className={conversationVisible ? "dock-app is-open" : "dock-app"} type="button" aria-label="Abrir Conversa" aria-pressed={conversationVisible && activeWindow === "conversation"} onClick={() => { setConversationVisible(true); setActiveWindow("conversation"); }}>
          <span aria-hidden="true">◉</span>
          <small>Conversa</small>
          {conversationVisible ? <i /> : null}
        </button>
        {projectWindows.length > 0 ? <span className="desktop-dock__count">{projectWindows.length} WORK</span> : null}
      </nav>
    </main>
  );
}
