# La Rosa del Amor 🌹

> *"Where cross-cultural love finds its voice"*

A RAG-enabled voice agent built with LiveKit that serves as a dramatic, passionate cross-cultural dating coach. Meet **Rosa Corazón** — part relationship therapist, part telenovela leading lady, all heart.

## Features

- **Voice Interaction**: Real-time speech-to-text and text-to-speech using Deepgram and ElevenLabs
- **RAG-Powered Knowledge**: Retrieves relationship psychology wisdom from uploaded PDFs using LlamaIndex
- **Tool Calling**: "Translate and Spice" function that transforms boring English into romantic Spanish
- **Dramatic Persona**: Every response delivered with telenovela-level passion
- **Live Transcript**: Real-time conversation display in the frontend

---

## Project Structure

```
cultural-casanova/
├── backend/
│   ├── agent.py              # Main LiveKit agent with RAG & tools
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Environment variables template
│   └── relationship_guide.pdf # Your PDF knowledge source (add this)
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/token/route.ts  # Token generation endpoint
│   │   │   ├── layout.tsx          # Root layout
│   │   │   ├── page.tsx            # Main page component
│   │   │   └── globals.css         # Romantic styling
│   │   └── components/
│   │       ├── VoiceRoom.tsx       # LiveKit room component
│   │       └── TranscriptPanel.tsx # Real-time transcript
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env.example
│
└── README.md
```

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **LiveKit Cloud Account**: https://cloud.livekit.io (free tier available)
- **OpenAI API Key**: https://platform.openai.com
- **Deepgram API Key**: https://console.deepgram.com (free credits available)
- **ElevenLabs API Key**: https://elevenlabs.io (free tier available)

---

## Setup Instructions

### 1. Clone and Prepare

```bash
cd cultural-casanova
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template and fill in your keys
cp .env.example .env
```

Edit `backend/.env` with your API keys:
```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
OPENAI_API_KEY=sk-your-key
DEEPGRAM_API_KEY=your_deepgram_key
ELEVEN_API_KEY=your_elevenlabs_key
```

**Add your PDF**: Place a file named `relationship_guide.pdf` in the `backend/` directory. This is your RAG knowledge source.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

---

## Running the Application

### Terminal 1: Start the Backend Agent

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python agent.py dev
```

The agent will connect to LiveKit Cloud and wait for participants.

### Terminal 2: Start the Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:3000 in your browser.

---

## How It Works

### The Persona: Rosa Corazón

Rosa is a passionate dating coach with:
- A backstory involving a summer thunderstorm in Guadalajara
- A Mexican singer mother and Spanish flamenco dancer father
- Expressions like "¡Ay, no!", "Cariño", and "Mi amor"
- A tendency to treat every question like a matter of life and death
- Wisdom from her "three great loves" that each taught her something profound
- A warm, nurturing energy like a wise older sister or cool aunt

### The RAG System

When users ask about relationship psychology, Rosa queries the PDF knowledge base:
- Uses LlamaIndex with OpenAI embeddings
- Retrieves relevant context before responding
- Delivers research-backed advice with dramatic flair

### The Tool: Translate and Spice

Users can ask Rosa to transform phrases:
- **Input**: "I like your shoes"
- **Output**: "Tus zapatos son el camino hacia las estrellas de mi corazón"

The tool uses a secondary LLM call with style options: poetic, playful, passionate, or sweet.

---

## Example Conversation

**User**: "Rosa, my Mexican girlfriend's mom doesn't seem to like me. What should I do?"

**Rosa**: "*places hand on heart* Ay, cariño! The suegra situation! This is like every great telenovela's second act... Let me consult the ancient texts of relationship wisdom...

*[RAG retrieves relevant psychology content]*

According to the sacred scrolls, building trust with Mexican family members often requires patience and demonstrating respect through actions, not just words. But here's what they DON'T tell you, mi amor — you must master the art of the compliment. And not just ANY compliment...

Would you like me to spice up a phrase for when you next see her? Something that says 'I adore your daughter AND I respect her magnificent family'?"

---

## API Reference

### Backend Tools

```python
@function_tool()
async def translate_and_spice(
    context: RunContext,
    text: str,           # English phrase to transform
    style: str = "passionate"  # poetic, playful, passionate, or sweet
) -> str:
    """Transforms boring English into romantic Spanish"""

@function_tool()
async def get_relationship_wisdom(
    context: RunContext,
    question: str  # Question about relationships/psychology
) -> str:
    """Queries the RAG knowledge base"""
```

### Frontend API

```
GET /api/token?room={room}&username={username}
```

Returns a LiveKit access token for joining rooms.

---

## Customization

### Change the Voice

In `agent.py`, modify the ElevenLabs TTS configuration:
```python
tts=elevenlabs.TTS(
    voice_id="NNLcf0MlUZirnZQqeMJ8",  # Change to any ElevenLabs voice ID
    model="eleven_turbo_v2_5",
)
```

### Adjust Personality

Edit the `ROSA_SYSTEM_PROMPT` in `agent.py` to modify Rosa's personality, backstory, or communication style.

### Add More Tools

Register additional tools by adding methods to the `RosaAgent` class with the `@function_tool()` decorator.

---

## Troubleshooting

### "No PDF knowledge base loaded"
- Ensure `relationship_guide.pdf` exists in the `backend/` directory
- Check file permissions

### Connection Issues
- Verify all API keys are correct in `.env` files
- Ensure LiveKit Cloud project is properly configured
- Check that the agent is running before starting a call

### Audio Not Working
- Grant microphone permissions in browser
- Check browser console for errors
- Verify Deepgram and ElevenLabs keys are valid

### OpenAI Quota Errors (429)
- Check your OpenAI billing at https://platform.openai.com/settings/organization/billing
- Add credits or upgrade your plan
- The agent uses `gpt-4o-mini` for cost efficiency

---

## Tech Stack

- **Backend**: Python, LiveKit Agents Framework 1.x, LlamaIndex, OpenAI
- **Frontend**: Next.js 14, React, TailwindCSS, LiveKit Components
- **STT**: Deepgram Nova-2
- **TTS**: ElevenLabs Turbo v2.5
- **LLM**: OpenAI GPT-4o-mini

---

## License

Built with love for interview purposes. May your cross-cultural romance flourish! 💕

---

*"Remember, cariño: Love knows no borders, but it DOES need a good translator. That's where Rosa comes in. ¡Adelante, mi amor!"* 🌹
