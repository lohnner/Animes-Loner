from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
import json
from pathlib import Path
from urllib.request import Request, urlopen

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "Mangás" / "Dorohedoro"
DATA = json.loads((ROOT / "scripts" / "dorohedoro-volumes.json").read_text(encoding="utf-8"))


def download(volume):
    destination = OUT / f"Dorohedoro #{volume['number']}.png"
    if volume["number"] == 1 and destination.exists():
        return
    url = volume["coverSource"]
    request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=60) as response:
        raw = response.read()
    with Image.open(BytesIO(raw)) as source:
        if source.width < 100 or source.height < 150:
            isbn = url.split("/isbn/")[1].split("-")[0]
            fallback = f"https://books.google.com/books/content?vid=ISBN{isbn}&printsec=frontcover&img=1&zoom=2&source=gbs_api"
            with urlopen(Request(fallback, headers={"User-Agent": "Mozilla/5.0"}), timeout=60) as response:
                raw = response.read()
            source.close()
            source = Image.open(BytesIO(raw))
            if source.width < 100 or source.height < 150:
                raise RuntimeError(f"Capa do volume {volume['number']} não encontrada")
        image = source.convert("RGB")
        ratio = 2 / 3
        if image.width / image.height > ratio:
            width = round(image.height * ratio)
            left = (image.width - width) // 2
            image = image.crop((left, 0, left + width, image.height))
        elif image.width / image.height < ratio:
            height = round(image.width / ratio)
            top = (image.height - height) // 2
            image = image.crop((0, top, image.width, top + height))
        image.resize((500, 750), Image.Resampling.LANCZOS).save(destination, "PNG", optimize=True)


OUT.mkdir(parents=True, exist_ok=True)
with ThreadPoolExecutor(max_workers=6) as executor:
    list(executor.map(download, DATA))
print("23 capas de Dorohedoro padronizadas em 500x750 px.")
