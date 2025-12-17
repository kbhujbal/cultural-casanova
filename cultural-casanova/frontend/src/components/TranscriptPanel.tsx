"use client";

import { useEffect, useRef, useMemo } from "react";

export interface TranscriptMessage {
  id: string;
  speaker: "agent" | "user";
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

interface TranscriptPanelProps {
  messages: TranscriptMessage[];
}

export default function TranscriptPanel({ messages }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Combine consecutive messages from the same speaker and filter out empty/interim duplicates
  const consolidatedMessages = useMemo(() => {
    // Only show final messages, or the latest interim message
    const finalMessages = messages.filter((msg) => msg.isFinal);
    const interimMessages = messages.filter((msg) => !msg.isFinal);

    // Get unique interim messages (latest per speaker)
    const latestInterim: TranscriptMessage[] = [];
    const seenSpeakers = new Set<string>();

    for (let i = interimMessages.length - 1; i >= 0; i--) {
      const msg = interimMessages[i];
      if (!seenSpeakers.has(msg.speaker)) {
        seenSpeakers.add(msg.speaker);
        latestInterim.unshift(msg);
      }
    }

    // Combine final messages with latest interim
    const allMessages = [...finalMessages, ...latestInterim];

    // Sort by timestamp
    allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return allMessages;
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [consolidatedMessages]);

  return (
    <div className="romantic-card rounded-2xl p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
        <span className="text-2xl">💬</span>
        <h2 className="text-gold-300 font-display text-lg font-semibold">
          Love Letters (Transcript)
        </h2>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto transcript-container space-y-3 pr-2"
      >
        {consolidatedMessages.length === 0 ? (
          <div className="text-center text-white/50 italic py-8">
            <p className="text-3xl mb-2">🌹</p>
            <p>Your romantic conversation will appear here...</p>
            <p className="text-sm mt-1">Start speaking to Ricardo!</p>
          </div>
        ) : (
          consolidatedMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.speaker === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                  msg.speaker === "agent"
                    ? "message-agent rounded-tl-sm"
                    : "message-user rounded-tr-sm"
                } ${!msg.isFinal ? "opacity-70" : ""}`}
              >
                {/* Speaker label */}
                <div
                  className={`text-xs font-semibold mb-1 ${
                    msg.speaker === "agent"
                      ? "text-romance-900"
                      : "text-white/80"
                  }`}
                >
                  {msg.speaker === "agent" ? "🌹 Rosa" : "You"}
                </div>

                {/* Message text */}
                <p className="text-sm leading-relaxed">
                  {msg.text}
                  {!msg.isFinal && (
                    <span className="ml-1 animate-pulse">▋</span>
                  )}
                </p>

                {/* Timestamp */}
                <div
                  className={`text-xs mt-1 ${
                    msg.speaker === "agent"
                      ? "text-romance-800/60"
                      : "text-white/50"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
