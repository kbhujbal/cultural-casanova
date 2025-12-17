"use client";

import {
  LiveKitRoom,
  useVoiceAssistant,
  BarVisualizer,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { useCallback, useEffect, useState } from "react";
import { RoomEvent, TranscriptionSegment, Participant } from "livekit-client";
import TranscriptPanel, { TranscriptMessage } from "./TranscriptPanel";

interface VoiceRoomProps {
  token: string;
  serverUrl: string;
  onDisconnect: () => void;
}

function VoiceAssistantUI({
  onTranscriptUpdate,
}: {
  onTranscriptUpdate: (messages: TranscriptMessage[]) => void;
}) {
  const { state, audioTrack, agentTranscriptions } = useVoiceAssistant();
  const room = useRoomContext();

  // Collect all transcriptions
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);

  // Process agent transcriptions from useVoiceAssistant
  useEffect(() => {
    if (!agentTranscriptions || agentTranscriptions.length === 0) return;

    const latestSegment = agentTranscriptions[agentTranscriptions.length - 1];

    setMessages((prev) => {
      const existingIndex = prev.findIndex(
        (m) => m.id === `agent-${latestSegment.id}`
      );

      const newMessage: TranscriptMessage = {
        id: `agent-${latestSegment.id}`,
        speaker: "agent",
        text: latestSegment.text,
        timestamp: new Date(),
        isFinal: latestSegment.final,
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newMessage;
        return updated;
      } else {
        return [...prev, newMessage];
      }
    });
  }, [agentTranscriptions]);

  // Listen to room transcription events for user speech
  useEffect(() => {
    if (!room) return;

    const handleTranscription = (
      segments: TranscriptionSegment[],
      participant?: Participant
    ) => {
      // Only process local participant (user) transcriptions here
      // Agent transcriptions are handled by agentTranscriptions above
      const isLocalParticipant = participant?.identity === room.localParticipant?.identity;

      if (!isLocalParticipant) return;

      segments.forEach((segment) => {
        setMessages((prev) => {
          const existingIndex = prev.findIndex(
            (m) => m.id === `user-${segment.id}`
          );

          const newMessage: TranscriptMessage = {
            id: `user-${segment.id}`,
            speaker: "user",
            text: segment.text,
            timestamp: new Date(),
            isFinal: segment.final,
          };

          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = newMessage;
            return updated;
          } else {
            return [...prev, newMessage];
          }
        });
      });
    };

    room.on(RoomEvent.TranscriptionReceived, handleTranscription);

    return () => {
      room.off(RoomEvent.TranscriptionReceived, handleTranscription);
    };
  }, [room]);

  // Update parent with messages
  useEffect(() => {
    onTranscriptUpdate(messages);
  }, [messages, onTranscriptUpdate]);

  // State display text
  const getStateDisplay = () => {
    switch (state) {
      case "listening":
        return { text: "Rosa is listening...", emoji: "👂" };
      case "thinking":
        return { text: "Rosa is pondering your romantic dilemma...", emoji: "🤔" };
      case "speaking":
        return { text: "Rosa is dispensing wisdom...", emoji: "🗣️" };
      case "connecting":
        return { text: "Connecting to Rosa...", emoji: "💫" };
      default:
        return { text: "Ready for romance", emoji: "🌹" };
    }
  };

  const stateInfo = getStateDisplay();

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Status Badge */}
      <div className="romantic-card rounded-full px-6 py-2 flex items-center gap-3">
        <span className="text-xl">{stateInfo.emoji}</span>
        <span className="text-gold-200 font-medium">{stateInfo.text}</span>
        <div
          className={`status-dot ${
            state === "listening" || state === "speaking"
              ? "status-connected"
              : state === "connecting" || state === "thinking"
              ? "status-connecting"
              : "status-disconnected"
          }`}
        />
      </div>

      {/* Audio Visualizer */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Decorative ring */}
        <div className="absolute inset-0 rounded-full border-2 border-gold-400/30 animate-pulse-slow" />
        <div className="absolute inset-4 rounded-full border border-gold-400/20" />

        {/* Visualizer */}
        <div className="relative z-10 w-48 h-48 rounded-full bg-gradient-to-br from-romance-600 to-romance-800 flex items-center justify-center overflow-hidden">
          {audioTrack ? (
            <BarVisualizer
              state={state}
              barCount={12}
              trackRef={audioTrack}
              className="w-full h-24"
              options={{
                minHeight: 10,
              }}
            />
          ) : (
            <div className="text-6xl rose-float">🌹</div>
          )}
        </div>

        {/* Mic pulse effect when listening */}
        {state === "listening" && (
          <div className="absolute inset-0 rounded-full mic-pulse" />
        )}
      </div>

      {/* Control Bar */}
      <VoiceAssistantControlBar controls={{ leave: false }} />
    </div>
  );
}

export default function VoiceRoom({
  token,
  serverUrl,
  onDisconnect,
}: VoiceRoomProps) {
  const [transcriptMessages, setTranscriptMessages] = useState<
    TranscriptMessage[]
  >([]);

  const handleTranscriptUpdate = useCallback((messages: TranscriptMessage[]) => {
    setTranscriptMessages(messages);
  }, []);

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={onDisconnect}
      className="h-full"
    >
      <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Left side - Voice Controls */}
        <div className="flex flex-col items-center justify-center">
          <VoiceAssistantUI onTranscriptUpdate={handleTranscriptUpdate} />

          {/* End Call Button */}
          <button
            onClick={onDisconnect}
            className="mt-8 px-8 py-3 bg-gradient-to-r from-red-600 to-red-700
                       hover:from-red-700 hover:to-red-800 text-white font-semibold
                       rounded-full transition-all duration-300 shadow-lg
                       hover:shadow-red-500/30 flex items-center gap-2"
          >
            <span>📞</span>
            End Consultation
          </button>
        </div>

        {/* Right side - Transcript */}
        <div className="h-[500px] lg:h-full">
          <TranscriptPanel messages={transcriptMessages} />
        </div>
      </div>

      {/* Audio renderer - required for hearing the agent */}
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
