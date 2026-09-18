import asyncio, base64, os, sys
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

PROMPT = (
    "Recreate the character illustration from the reference image as faithfully as possible: the same hooded robotic mascot with a faceted "
    "purple visor face, the same luxury black trench coat with gold trims and glowing violet lining, black shirt with gold chain and 'C' pendant, "
    "'COCO AI' patch on the chest, belt, gloves, gold watch, glossy black boots with 'C' emblems. Same seated power pose on the glowing "
    "black-and-purple futuristic crate with a 'C' logo and 'COCO AI' text on its front, one leg propped up, one hand raised palm-up levitating "
    "the large glowing holographic 3D letter 'C' with energy swirls. Same premium cinematic lighting and cosmic purple / electric blue / gold "
    "color grading. High detail, clean sharp render, full character and crate fully visible with margin. "
    "ONLY CHANGE: the background must be a completely flat, solid, uniform pure bright green (#00FF00) chroma-key color — no checkerboard, "
    "no gradients, no shadows, no floor, nothing else in the background. Portrait 2:3 aspect ratio."
)

def b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()

async def main():
    chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=f"mascot-gen-{sys.argv[1]}", system_message="You are an image generator")
    chat.with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
    msg = UserMessage(text=PROMPT, file_contents=[ImageContent(b64("/app/memory/assets/ref_char3.png"))])
    text, images = await chat.send_message_multimodal_response(msg)
    print("text:", (text or "")[:100])
    for i, img in enumerate(images or []):
        out = f"/app/memory/assets/mascot_raw_{sys.argv[1]}_{i}.png"
        with open(out, "wb") as f:
            f.write(base64.b64decode(img["data"]))
        print("saved", out)

asyncio.run(main())
