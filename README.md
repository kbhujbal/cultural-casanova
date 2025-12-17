# La Rosa del Amor (LiveKit Voice Agent)

A RAG-enabled real-time voice agent built for the Bluejay take-home challenge. The agent ("Rosa") acts as a dramatic cross-cultural relationship coach, utilizing RAG to reference psychology texts and tool calling to perform translations.

## 🏗️ Architecture & Tech Stack

The system is built on the **LiveKit Agents Framework** (Python) to handle real-time orchestration.

* **Orchestration:** LiveKit Cloud
* **STT:** Deepgram Nova-2 (chosen for low latency <300ms)
* **LLM:** OpenAI GPT-4o-mini (balanced for speed vs. personality consistency)
* **TTS:** ElevenLabs Turbo v2.5 (custom voice ID for accent retention)
* **RAG:** LlamaIndex (referencing `relationship_guide.pdf`)
* **Frontend:** Next.js + LiveKit Components

## 📂 Project Structure

```text
/
├── backend/
│   ├── agent.py                # Main Worker: Handles RAG, Tools, and Context
│   ├── relationship_guide.pdf  # Vector Store Knowledge Base
│   └── requirements.txt        # Python dependencies
│
├── frontend/
│   ├── src/components/         # VoiceRoom and Transcript UI
│   └── src/app/                # Next.js Pages and API Routes
│
└── README.md