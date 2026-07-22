import html, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
wiki = html.unescape((ROOT / ".tmp-mha-wikipedia.html").read_text(encoding="utf-8"))
shueisha = (ROOT / ".tmp-mha-shueisha.html").read_text(encoding="utf-8")
serialized = re.search(r'^var ssd = (.*);$', shueisha, re.MULTILINE)
if not serialized: raise RuntimeError("Metadados da Shueisha não encontrados")
items = json.loads(serialized.group(1))["data"]["item_datas"]
official = {int(float(item["volume_number"])): item for item in items}
chunks = re.split(r'"VolumeNumber"', wiki)[1:43]
if len(chunks) != 42 or len(official) != 42: raise RuntimeError(f"Esperados 42 volumes: wiki={len(chunks)}, Shueisha={len(official)}")
starts = []
for index, chunk in enumerate(chunks, 1):
    number = int(re.search(r'"wt":"(\d{1,2})"', chunk).group(1))
    start = int(re.search(r'Numbered list\|start=\s*(\d+)', chunk).group(1))
    if number != index: raise RuntimeError(f"Ordem inesperada no volume {number}")
    starts.append(start)
volumes = []
for index in range(42):
    number = index + 1; item = official[number]
    image = item["image_url"].replace("/240/", "/1200/")
    last = starts[index + 1] - 1 if index < 41 else 430
    volumes.append({"number": number, "releaseDate": item["paper_release_date"], "chapters": [starts[index], last], "bonusChapters": 1 if number == 42 else 0, "pageCount": 184 if number == 42 else 192, "coverSource": image})
(ROOT / "scripts" / "my-hero-academia-volumes.json").write_text(json.dumps(volumes, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("My Hero Academia: 42 volumes, capítulos 1 a 430 e epílogo 431.")
