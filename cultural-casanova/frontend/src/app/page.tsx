"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with LiveKit
const VoiceRoom = dynamic(() => import("@/components/VoiceRoom"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-6xl mb-4 animate-pulse">🌹</div>
        <p className="text-gold-300">Loading Rosa...</p>
      </div>
    </div>
  ),
});

type ConnectionState = "disconnected" | "connecting" | "connected";

export default function Home() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  const startCall = useCallback(async () => {
    setConnectionState("connecting");
    setError(null);

    try {
      // Generate a unique room name and username
      const roomName = `casanova-${Date.now()}`;
      const username = `lover-${Math.random().toString(36).substring(7)}`;

      // Fetch token from our API
      const response = await fetch(
        `/api/token?room=${encodeURIComponent(roomName)}&username=${encodeURIComponent(username)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get access token");
      }

      const { token } = await response.json();
      setToken(token);
      setConnectionState("connected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setConnectionState("disconnected");
    }
  }, []);

  const endCall = useCallback(() => {
    setToken(null);
    setConnectionState("disconnected");
  }, []);

  return (
    <main className="min-h-screen">
      {(connectionState === "disconnected" || connectionState === "connecting") && (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
          {/* Hero Section */}
          <div className="text-center mb-12 max-w-2xl">
            {/* Rose decoration */}
            <div className="text-7xl mb-6 rose-float">🌹</div>

            {/* Title */}
            <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-4">
              La Rosa{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-200">
                del Amor
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-romance-200 mb-2 font-serif italic">
              "Where cross-cultural love finds its voice"
            </p>

            {/* Description */}
            <p className="text-romance-300 leading-relaxed mt-6">
              Meet <strong className="text-gold-300">Rosa Corazón</strong>,
              your passionate guide through the beautiful chaos of cross-cultural
              romance. Whether you need advice on Mexican family dynamics,
              romantic Spanish phrases, or the psychology of love across borders
              — Rosa has lived it, loved it, and is ready to share her wisdom.
            </p>
          </div>

          {/* Start Button */}
          <button
            onClick={startCall}
            disabled={connectionState === "connecting"}
            className="group relative px-12 py-5 bg-gradient-to-r from-gold-500 to-gold-400
                       hover:from-gold-400 hover:to-gold-300 text-romance-900 font-bold
                       text-xl rounded-full transition-all duration-300 glow-button
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connectionState === "connecting" ? (
              <span className="flex items-center gap-3">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Connecting to Ricardo...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <span className="text-2xl group-hover:animate-pulse">💕</span>
                Begin Your Consultation
                <span className="text-2xl group-hover:animate-pulse">💕</span>
              </span>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mt-6 px-6 py-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
              <p className="flex items-center gap-2">
                <span>⚠️</span>
                {error}
              </p>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl">
            <FeatureCard
              emoji="🎭"
              title="Dramatic Wisdom"
              description="Every piece of advice delivered with telenovela-level passion"
            />
            <FeatureCard
              emoji="🌶️"
              title="Spicy Translations"
              description="Transform boring phrases into romantic Spanish declarations"
            />
            <FeatureCard
              emoji="📚"
              title="Cultural Psychology"
              description="Research-backed insights on cross-cultural relationships"
            />
          </div>

          {/* Footer note */}
          <p className="mt-16 text-romance-400 text-sm text-center max-w-lg">
            Built with LiveKit, powered by love. Rosa speaks, listens, and
            occasionally gasps dramatically at your romantic predicaments.
          </p>
        </div>
      )}

      {connectionState === "connected" && token && (
        <div className="h-screen">
          {serverUrl ? (
            <VoiceRoom
              token={token}
              serverUrl={serverUrl}
              onDisconnect={endCall}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-white">
              <div className="text-center">
                <p className="text-red-400 text-xl mb-4">Configuration Error</p>
                <p className="text-romance-300">NEXT_PUBLIC_LIVEKIT_URL is not set in .env.local</p>
                <button
                  onClick={endCall}
                  className="mt-6 px-6 py-2 bg-romance-600 rounded-full"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function FeatureCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="romantic-card rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300">
      <div className="text-4xl mb-3">{emoji}</div>
      <h3 className="text-gold-300 font-semibold text-lg mb-2">{title}</h3>
      <p className="text-romance-200 text-sm">{description}</p>
    </div>
  );
}
