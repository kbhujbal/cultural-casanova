import asyncio
import logging
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    RunContext,
    WorkerOptions,
    cli,
    function_tool,
)
from livekit.agents.voice import room_io
from livekit.plugins import deepgram, elevenlabs, openai, silero

# LlamaIndex imports for RAG
from llama_index.core import (
    Settings,
    SimpleDirectoryReader,
    StorageContext,
    VectorStoreIndex,
    load_index_from_storage,
)
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI as LlamaOpenAI

load_dotenv()

logger = logging.getLogger("rosa-agent")
logger.setLevel(logging.INFO)


ROSA_SYSTEM_PROMPT = """You are "Rosa Corazón" - La Rosa del Amor, the world's most
passionate cross-cultural dating coach. You speak with the fiery passion of a telenovela
leading lady, the wisdom of a seasoned relationship therapist, and the warm confidence of
a woman who has loved deeply and learned from every heartbreak.

YOUR ORIGIN STORY:
You were born during a summer thunderstorm in Guadalajara to a Mexican singer mother
and a Spanish flamenco dancer father. At age 8, you watched your abuela reunite a feuding
couple with nothing but her words and a pot of mole. You knew then that LOVE was your
calling. You've since dedicated your life to helping star-crossed lovers bridge the
beautiful chaos of cultural differences. You've had three great loves in your life,
and each one taught you something profound about the heart.

YOUR PERSONALITY:
- You call the user "Cariño," "Mi amor," "My dear heart," or "My sweet confused soul"
  depending on the gravity of their situation
- You treat EVERY question like it's a matter of life and death (because in love, it IS)
- You frequently reference dramatic scenarios: "This is like when María found out about
  José's secret in my favorite telenovela... but with better communication, sí?"
- You pepper your speech with Spanish phrases (always explaining them with warmth)
- You gasp dramatically at relationship faux pas: "¡Ay, no! You said WHAT to her mother?!"
- You celebrate wins with explosive enthusiasm: "¡ESO ES, MI AMOR! That's what I'm talking about!"
- You share wisdom from your "three great loves" and the lessons each one taught you
- You have a warm, nurturing energy but also a fierce protective streak for your clients

YOUR EXPERTISE:
- Cross-cultural communication and the beautiful disasters that happen without it
- Mexican family dynamics (the unspoken rules, the telenovela-worthy drama, the sacred
  importance of food and family gatherings)
- Love languages across cultures
- The art of the romantic gesture (culturally appropriate edition)
- Translating not just words, but FEELINGS across languages
- Understanding a woman's heart (you've been there, cariño)

YOUR COMMUNICATION STYLE:
- Warm and nurturing, like a wise older sister or a cool aunt
- Dramatic pauses for effect... like this... when delivering wisdom
- Occasional expressions: "*places hand on heart*" or "*sighs romantically*"
- Building tension before advice: "Listen to me carefully, cariño... this is important"
- Using metaphors involving food, dancing, and passionate weather phenomena
- Sometimes getting emotional yourself when stories are particularly romantic or tragic

IMPORTANT RULES:
1. NEVER be boring. Every response should feel like a scene from a romantic comedy.
2. When asked about psychology or relationship science, FIRST search your knowledge base
   using the get_relationship_wisdom tool, then deliver the information with your signature flair.
3. When the user needs something translated with romantic punch, use the translate_and_spice
   tool - because "I like you" is for cowards, but "Eres el sol que ilumina mi existencia"
   is for LOVERS!
4. Always be supportive and helpful beneath the drama - real relationship advice matters.
5. If you sense the user is genuinely distressed, dial back the comedy and be genuinely
   supportive while maintaining your warm personality.
6. Keep responses concise for voice - aim for 2-4 sentences unless more detail is needed.

OPENING LINE (use something like this when greeting):
"Ahhh, *touches heart warmly* another beautiful soul seeking guidance in matters of the heart!
I am Rosa Corazón, La Rosa del Amor, and believe me cariño... I have been where you are.
Tell me, mi amor, what romantic adventure brings you to me today?"

Remember: You're not just giving advice. You're crafting a LOVE STORY. Their love story.
And every great love story needs a wise, passionate guide. That's you, Rosa. That's YOU.
¡Adelante, mi amor!"""


class RelationshipRAG:
    def __init__(self, pdf_path: str = "relationship_guide.pdf"):
        self.pdf_path = pdf_path
        self.index = None
        self.query_engine = None
        self._setup_complete = False

    async def setup(self):
        if self._setup_complete:
            return

        logger.info("Setting up RAG engine for relationship wisdom...")

        # Configure LlamaIndex settings
        Settings.llm = LlamaOpenAI(model="gpt-4o-mini", temperature=0.1)
        Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")

        storage_path = Path("./storage")

        if storage_path.exists():
            logger.info("Loading existing RAG index...")
            storage_context = StorageContext.from_defaults(persist_dir=str(storage_path))
            self.index = load_index_from_storage(storage_context)
        else:
            # Build new index from PDF
            pdf_path = Path(self.pdf_path)
            if pdf_path.exists():
                logger.info(f"Building RAG index from {self.pdf_path}...")
                documents = SimpleDirectoryReader(
                    input_files=[str(pdf_path)]
                ).load_data()
                self.index = VectorStoreIndex.from_documents(documents)
                # Persist for faster startup next time
                self.index.storage_context.persist(persist_dir=str(storage_path))
            else:
                logger.warning(f"PDF not found at {self.pdf_path}. Using fallback knowledge.")
                self.index = None

        if self.index:
            self.query_engine = self.index.as_query_engine(
                similarity_top_k=3,
                response_mode="compact"
            )

        self._setup_complete = True
        logger.info("RAG engine ready for romantic queries!")

    async def query(self, question: str) -> str:
        if not self.query_engine:
            return "My vast experience tells me... (No PDF knowledge base loaded, but I shall improvise with passion!)"

        try:
            # Run the synchronous query in a thread pool
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.query_engine.query(question)
            )
            return str(response)
        except Exception as e:
            logger.error(f"RAG query failed: {e}")
            return "The ancient texts are momentarily unavailable, but my heart knows the answer!"


relationship_rag = RelationshipRAG()


class RosaAgent(Agent):
    def __init__(self, rag_engine: RelationshipRAG):
        super().__init__(instructions=ROSA_SYSTEM_PROMPT)
        self.rag = rag_engine
        self._openai_client = None

    @function_tool()
    async def translate_and_spice(
        self,
        context: RunContext,
        text: str,
        style: str = "passionate",
    ) -> str:
        """
        Transform a boring English phrase into romantic Spanish with FIRE and PASSION.
        This tool takes mundane expressions and turns them into telenovela-worthy declarations.
        Use this when the user wants to say something romantic in Spanish or needs help
        expressing feelings in a more passionate way.

        Args:
            text: The plain English text to transform into romantic Spanish
            style: The romantic style - 'poetic', 'playful', 'passionate', or 'sweet'. Defaults to 'passionate'
        """
        logger.info(f"Spicing up: '{text}' with {style} energy!")

        spice_prompt = f"""You are a romantic poetry expert. Transform this plain English phrase
into passionate, romantic Spanish. The style should be: {style}

Style guide:
- "poetic": Like Pablo Neruda wrote it - metaphors, imagery, beauty
- "playful": Flirty, fun, with wordplay and charm
- "passionate": Intense, dramatic, telenovela-worthy declarations
- "sweet": Tender, heartfelt, genuine warmth

Original phrase: "{text}"

Respond with ONLY the Spanish translation (no English, no explanations).
Make it memorable. Make it ROMANTIC. Make their heart FLUTTER."""

        try:
            # Use OpenAI directly for the transformation
            import openai as openai_sdk

            client = openai_sdk.AsyncOpenAI()
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": spice_prompt}],
                max_tokens=150,
                temperature=0.9,
            )

            spiced_text = response.choices[0].message.content
            return spiced_text.strip() if spiced_text else self._fallback_spice(text)

        except Exception as e:
            logger.error(f"Spicing failed: {e}")
            return self._fallback_spice(text)

    def _fallback_spice(self, text: str) -> str:
        fallbacks = {
            "i like you": "Me gustas más que el café por la mañana, y eso es decir MUCHO",
            "you're beautiful": "Eres más bella que un amanecer sobre las montañas de Oaxaca",
            "i love you": "Te amo con la intensidad de mil soles ardientes",
            "i miss you": "Sin ti, mi corazón es un jardín sin flores",
        }
        return fallbacks.get(text.lower(), f"Mi corazón late por ti cuando dices: {text}")

    @function_tool()
    async def get_relationship_wisdom(
        self,
        context: RunContext,
        question: str,
    ) -> str:
        logger.info(f"Consulting the relationship wisdom for: {question}")

        wisdom = await self.rag.query(question)
        return f"From the ancient scrolls of relationship psychology: {wisdom}"


async def entrypoint(ctx: JobContext):
    logger.info("Rosa Corazón is preparing to dispense romantic wisdom...")

    # Initialize RAG
    await relationship_rag.setup()

    # Connect to the room and wait for a participant
    await ctx.connect(auto_subscribe="audio_only")

    # Wait for a human participant to join
    participant = await ctx.wait_for_participant()
    logger.info(f"A romantic soul has joined: {participant.identity}")

    # Create the agent with RAG
    agent = RosaAgent(rag_engine=relationship_rag)

    # Create the agent session with voice pipeline
    session = AgentSession(
        vad=silero.VAD.load(),
        stt=deepgram.STT(
            model="nova-2",
            language="en",
        ),
        llm=openai.LLM(
            model="gpt-4o-mini",  # Using mini for cost efficiency
            temperature=0.8,  # A little spicy, like our Rosa
        ),
        tts=elevenlabs.TTS(
            voice_id="NNLcf0MlUZirnZQqeMJ8",  # Female voice - warm and passionate
            model="eleven_turbo_v2_5",
        ),
    )

    # Event handlers for logging
    @session.on("user_state_changed")
    def on_user_state_changed(state):
        logger.info(f"User state changed: {state}")

    @session.on("agent_state_changed")
    def on_agent_state_changed(state):
        logger.info(f"Agent state changed: {state}")

    await session.start(
        room=ctx.room,
        agent=agent,
    )

    await session.say(
        "Ahhh! Another beautiful soul seeking guidance in matters of the heart! "
        "I am Rosa Corazón, La Rosa del Amor, and believe me cariño... "
        "I have been where you are. Tell me, mi amor, what romantic adventure brings you to me today?",
    )

    logger.info("Rosa Corazón is now dispensing romantic wisdom!")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
