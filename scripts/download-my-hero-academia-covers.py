from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
import json
from pathlib import Path
from time import sleep
from urllib.request import Request, urlopen
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/"Mangás"/"My Hero Academia"; OUT.mkdir(parents=True,exist_ok=True)
volumes=json.loads((ROOT/"scripts"/"my-hero-academia-volumes.json").read_text(encoding="utf-8"))
def download(v):
    for attempt in range(5):
        try:
            with urlopen(Request(v["coverSource"],headers={"User-Agent":"Mozilla/5.0"}),timeout=60) as response: raw=response.read()
            break
        except Exception:
            if attempt==4: raise
            sleep(2+attempt*2)
    with Image.open(BytesIO(raw)) as source:
        image=source.convert("RGB"); ratio=2/3
        if image.width/image.height>ratio:
            width=round(image.height*ratio); left=(image.width-width)//2; image=image.crop((left,0,left+width,image.height))
        elif image.width/image.height<ratio:
            height=round(image.width/ratio); top=(image.height-height)//2; image=image.crop((0,top,image.width,top+height))
        image.resize((500,750),Image.Resampling.LANCZOS).save(OUT/f"My Hero Academia #{v['number']}.png","PNG",optimize=True)
    return v["number"]
with ThreadPoolExecutor(max_workers=4) as executor: completed=list(executor.map(download,volumes))
print(f"{len(completed)} capas oficiais padronizadas em 500x750 px.")
