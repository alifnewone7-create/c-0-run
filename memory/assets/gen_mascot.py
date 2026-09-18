import asyncio, base64, os, sys
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

PROMPT = (
    "Create a full-body 2D character illustration of a mascot named COCO AI, in exactly the same art style, rendering quality, "
    "proportions and neon color palette as the FIRST reference image (a stylized techwear character with glowing purple/blue accents). "
    "CHARACTER: a sleek humanoid ROBOT. Its head must be modeled after the SECOND reference image: a dark faceted hooded head with sharp "
    "angular purple armor plating and a single glowing violet visor slit instead of a human face — no human skin, no human eyes, no hair. "
    "OUTFIT: copy the luxury outfit of the FIRST reference exactly — long black designer trench coat with gold-trimmed lapels and edges, "
    "violet glowing inner lining, black dress shirt with tie and gold chain, gold-buckled belt with 'C' emblem, tailored black trousers with "
    "a 'COCO AI' strap, luxury gold wristwatch, glossy black-gold designer sneakers with purple glow. "
    "POSE: stylish, elegant high-fashion power pose — full body, three-quarter stance, coat flowing slightly as if in wind, one gloved hand "
    "casually in the trouser pocket, the other hand raised palm-up levitating a large glowing holographic 3D letter 'C' "
    "(crystal-like violet-to-blue gradient with energy swirl). Cool, confident, luxurious attitude. "
    "COLOR GRADING: deep cosmic purple (#6d3bff, #8b5cff, #b48cff), electric blue rim light, black base, subtle magenta highlights, "
    "cinematic glow — matching a premium purple fintech website. "
    "BACKGROUND: completely flat, solid, uniform pure bright green (#00FF00) chroma-key background, no shadows on the ground, no floor, "
    "no gradients, no extra objects, nothing else. Entire character fully visible with margin, feet included. Portrait 2:3 aspect ratio. "
    "No text other than a small 'COCO AI' label on the jacket chest."
)

def b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()

async def main():
    chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=f"mascot-gen-{sys.argv[1]}", system_message="You are an image generator")
    chat.with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
    msg = UserMessage(text=PROMPT, file_contents=[ImageContent(b64("/app/memory/assets/ref_char2.png")), ImageContent(b64("/app/frontend/public/coco-profile.png"))])
    text, images = await chat.send_message_multimodal_response(msg)
    print("text:", (text or "")[:100])
    for i, img in enumerate(images or []):
        out = f"/app/memory/assets/mascot_raw_{sys.argv[1]}_{i}.png"
        with open(out, "wb") as f:
            f.write(base64.b64decode(img["data"]))
        print("saved", out)

asyncio.run(main())
