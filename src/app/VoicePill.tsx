import type { VoiceState } from "../voice/live-session";

interface VoicePillProps {
  state: VoiceState;
  supported: boolean;
  onStart: () => void;
  onStop: () => void;
}

const labels: Record<VoiceState, string> = {
  idle: "Falar com o JARVIS",
  listening: "A ouvir",
  processing: "A preparar",
  speaking: "A responder",
  error: "Tentar voz novamente",
};

export function VoicePill({ state, supported, onStart, onStop }: VoicePillProps) {
  const active = state === "listening" || state === "processing" || state === "speaking";
  return (
    <div className="voice-pill" data-state={state}>
      <button
        className="voice-pill__button"
        type="button"
        disabled={!supported}
        aria-label={active ? "Parar conversa por voz" : labels[state]}
        aria-pressed={active}
        onClick={active ? onStop : onStart}
      >
        <span className="voice-pill__orb" aria-hidden="true">
          <i /><i /><i /><i /><i />
        </span>
        <span>{supported ? labels[state] : "Voz indisponível neste browser"}</span>
        <small>{active ? "Clique para parar" : "Microfone"}</small>
      </button>
    </div>
  );
}
