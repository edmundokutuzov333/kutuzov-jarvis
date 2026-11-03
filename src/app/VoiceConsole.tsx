import type { LiveVoiceController } from "../voice/live-session";

interface VoiceConsoleProps {
  voice: LiveVoiceController;
}

const labels = {
  idle: "Falar com Edmundo",
  listening: "A ouvir",
  processing: "A preparar",
  speaking: "A responder",
  error: "Tentar novamente",
} as const;

export function VoiceConsole({ voice }: VoiceConsoleProps) {
  const active = voice.state === "listening" || voice.state === "processing" || voice.state === "speaking";
  return (
    <div className="voice-console" data-state={voice.state}>
      <div className="voice-console__halo" aria-hidden="true" />
      <button
        className="voice-console__button"
        type="button"
        disabled={!voice.supported}
        aria-label={active ? "Parar conversa por voz" : labels[voice.state]}
        aria-pressed={active}
        onClick={active ? voice.stop : () => void voice.start()}
      >
        <span className="voice-console__bars" aria-hidden="true">
          {Array.from({ length: 15 }, (_, index) => <i key={index} />)}
        </span>
        <span className="voice-console__label">{voice.supported ? labels[voice.state] : "Voz indisponível"}</span>
      </button>
      <span className="voice-console__hint">{active ? "Clique para parar" : "Clique para falar comigo"}</span>
    </div>
  );
}
