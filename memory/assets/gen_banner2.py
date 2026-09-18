import asyncio, base64, os, sys
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

PROMPT = (
    "Create a professional ultra-wide banner illustration (aspect ratio about 16:5) in the same style, composition and quality as the reference: "
    "a glowing crystalline low-poly BULL on the LEFT (facing right, geometric faceted body, glowing eyes) and a glowing crystalline low-poly BEAR "
    "on the RIGHT (facing left, roaring). "
    "IMPORTANT: NO candlestick chart, NO candles, NO bars, NO graph in the middle. The CENTER is a clean, calm, empty space with only soft "
    "flowing violet light waves / aurora ribbons and a faint starry nebula, leaving room for UI elements. "
    "COLOR GRADING must match a premium cosmic-purple fintech website: background deep purple-black (#0b0618 to #1a0f3d) with violet nebula "
    "(#6d3bff, #8b5cff, #b48cff). The bull glows in a mint-teal tint blended with violet edges; the bear glows in a rose-magenta tint blended with "
    "violet edges, so both animals harmonise with the purple palette (avoid pure saturated green/red). "
    "Cinematic, sharp, high detail, clean edges, no frame border lines, no text, no letters, no logos, no watermark. Full-bleed edge to edge."
)

def b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()

async def main():
    chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=f"banner-gen-{sys.argv[1]}", system_message="You are an image generator")
    chat.with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
    msg = UserMessage(text=PROMPT, file_contents=[ImageContent(b64("/app/memory/assets/ref_bullbear.webp"))])
    text, images = await chat.send_message_multimodal_response(msg)
    print("text:", (text or "")[:100])
    for i, img in enumerate(images or []):
        out = f"/app/memory/assets/banner_raw_{sys.argv[1]}_{i}.png"
        with open(out, "wb") as f:
            f.write(base64.b64decode(img["data"]))
        print("saved", out)

asyncio.run(main())
