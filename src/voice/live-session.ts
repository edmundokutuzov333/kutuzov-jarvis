import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceState = "idle" | "listening" | "processing" | "speaking" | "error";

interface LiveTokenPayload {
  token: string;
  model: string;
}

interface VoiceCallbacks {
  onInputTranscript?: (text: string) => void;
  onOutputTranscript?: (text: string) => void;
  onError?: (message: string) => void;
}

const LIVE_ENDPOINT = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function pcm16FromFloat32(input: Float32Array): Uint8Array {
  const output = new Int16Array(input.length);
  for (let index = 0; index < input.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, input[index] ?? 0));
    output[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return new Uint8Array(output.buffer);
}

function pcm16ToFloat32(bytes: Uint8Array): Float32Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const output = new Float32Array(Math.floor(bytes.byteLength / 2));
  for (let index = 0; index < output.length; index += 1) {
    output[index] = view.getInt16(index * 2, true) / 0x8000;
  }
  return output;
}

async function getLiveToken(signal?: AbortSignal): Promise<LiveTokenPayload> {
  const response = await fetch("/api/live-token", {
    method: "POST",
    headers: { Accept: "application/json" },
    signal,
  });
  const payload = await response.json() as Partial<LiveTokenPayload> & { message?: string };
  if (!response.ok || typeof payload.token !== "string" || typeof payload.model !== "string") {
    throw new Error(payload.message || "A sessão de voz não está disponível.");
  }
  return { token: payload.token, model: payload.model };
}

export interface LiveVoiceController {
  state: VoiceState;
  supported: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

export function useLiveVoice(callbacks: VoiceCallbacks = {}): LiveVoiceController {
  const [state, setState] = useState<VoiceState>("idle");
  const [supported] = useState(() => typeof window !== "undefined" && "WebSocket" in window && "AudioContext" in window && "mediaDevices" in navigator);
  const socketRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextAudioTimeRef = useRef(0);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const cleanup = useCallback(() => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    socketRef.current?.close();
    processorRef.current = null;
    sourceRef.current = null;
    mediaStreamRef.current = null;
    socketRef.current = null;
    void contextRef.current?.close();
    contextRef.current = null;
  }, []);

  const stop = useCallback(() => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
    }
    cleanup();
    setState("idle");
  }, [cleanup]);

  const start = useCallback(async () => {
    if (!supported || socketRef.current) return;
    setState("processing");

    try {
      const token = await getLiveToken();
      const socket = new WebSocket(LIVE_ENDPOINT + "?access_token=" + encodeURIComponent(token.token));
      socketRef.current = socket;

      const context = new AudioContext();
      contextRef.current = context;
      await context.resume();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      mediaStreamRef.current = stream;

      socket.onopen = () => {
        socket.send(JSON.stringify({
          setup: {
            model: token.model,
            generationConfig: { responseModalities: ["AUDIO"] },
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } } },
            systemInstruction: {
              parts: [{
                text: "You are Edmundo Kutuzov's personal voice assistant. Speak as Edmundo in first person only when the verified knowledge supports it. Detect Portuguese or English automatically. In Portuguese, use natural Mozambican Portuguese phrasing and cadence, with a calm masculine voice. Be concise, warm, creatively precise, and never invent clients, projects, roles, dates or metrics. If a fact is not in the public knowledge base, say that you do not have confirmed information. Focus on helping visitors understand the person, his projects and how to start a collaboration.",
              }],
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        }));
        setState("listening");
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(String(event.data)) as {
          serverContent?: {
            modelTurn?: { parts?: Array<{ inlineData?: { data?: string }; text?: string }> };
            inputTranscription?: { text?: string };
            outputTranscription?: { text?: string };
            turnComplete?: boolean;
            interrupted?: boolean;
          };
          error?: { message?: string };
        };
        const content = message.serverContent;
        if (message.error) throw new Error(message.error.message || "A sessão de voz falhou.");
        if (content?.inputTranscription?.text) callbacksRef.current.onInputTranscript?.(content.inputTranscription.text);
        if (content?.outputTranscription?.text) callbacksRef.current.onOutputTranscript?.(content.outputTranscription.text);
        const parts = content?.modelTurn?.parts ?? [];
        const audioParts = parts.filter((part) => part.inlineData?.data);
        if (audioParts.length > 0) {
          setState("speaking");
          for (const part of audioParts) {
            const pcm = pcm16ToFloat32(fromBase64(part.inlineData?.data || ""));
            const buffer = context.createBuffer(1, pcm.length, 24_000);
            buffer.copyToChannel(pcm, 0);
            const node = context.createBufferSource();
            node.buffer = buffer;
            node.connect(context.destination);
            const startAt = Math.max(context.currentTime + 0.02, nextAudioTimeRef.current);
            node.start(startAt);
            nextAudioTimeRef.current = startAt + buffer.duration;
            node.onended = () => {
              if (context.currentTime >= nextAudioTimeRef.current - 0.04) setState("listening");
            };
          }
        }
        if (content?.turnComplete && audioParts.length === 0) setState("listening");
      };

      socket.onerror = () => {
        callbacksRef.current.onError?.("A ligação de voz foi interrompida.");
        cleanup();
        setState("error");
      };

      socket.onclose = () => {
        if (socketRef.current === socket) {
          socketRef.current = null;
          setState("idle");
        }
      };

      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (event) => {
        if (socket.readyState !== WebSocket.OPEN) return;
        const bytes = pcm16FromFloat32(event.inputBuffer.getChannelData(0));
        socket.send(JSON.stringify({ realtimeInput: { audio: { data: toBase64(bytes), mimeType: "audio/pcm;rate=16000" } } }));
      };
      source.connect(processor);
      processor.connect(context.destination);
      sourceRef.current = source;
      processorRef.current = processor;
    } catch (error) {
      cleanup();
      setState("error");
      callbacksRef.current.onError?.(error instanceof Error ? error.message : "Não consegui iniciar a voz.");
    }
  }, [cleanup, supported]);

  useEffect(() => cleanup, [cleanup]);

  return { state, supported, start, stop };
}
