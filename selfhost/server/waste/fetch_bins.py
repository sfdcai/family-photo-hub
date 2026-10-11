"""Bridge to the community `waste_collection_schedule` council scrapers
(github.com/mampfes/hacs_waste_collection_schedule), used without Home Assistant.

  python3 fetch_bins.py list            -> [{id, title, country, example}]
  python3 fetch_bins.py fetch '<json>'  -> [{date, type}]   json = {"source": "...", "args": {...}}
"""
import ast
import datetime
import importlib
import json
import os
import sys
from pathlib import Path

ROOT = Path(os.environ.get("WCS_DIR", "/opt/wcs")) / "custom_components" / "waste_collection_schedule"
sys.path.insert(0, str(ROOT))
SOURCES = ROOT / "waste_collection_schedule" / "source"


def list_sources(country):
    out = []
    for f in sorted(SOURCES.glob("*.py")):
        if f.name.startswith("_"):
            continue
        try:
            tree = ast.parse(f.read_text(encoding="utf-8"))
        except Exception:
            continue
        meta = {}
        for node in tree.body:
            if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
                name = node.targets[0].id
                if name in ("TITLE", "COUNTRY", "TEST_CASES"):
                    try:
                        meta[name] = ast.literal_eval(node.value)
                    except Exception:
                        pass
        if country and meta.get("COUNTRY") != country and not f.stem.endswith(f"_{country}"):
            continue
        cases = meta.get("TEST_CASES") or {}
        example = next(iter(cases.values()), {}) if isinstance(cases, dict) else {}
        out.append({"id": f.stem, "title": meta.get("TITLE", f.stem), "country": meta.get("COUNTRY", ""),
                    "example": {k: v for k, v in example.items() if isinstance(v, (str, int, float))}})
    return out


def fetch(source, args):
    if not source.replace("_", "").isalnum():
        raise ValueError("Unknown council source")
    mod = importlib.import_module(f"waste_collection_schedule.source.{source}")
    entries = mod.Source(**args).fetch()
    today = datetime.date.today()
    rows = [{"date": e.date.isoformat(), "type": str(e.type)} for e in entries if e.date >= today - datetime.timedelta(days=1)]
    return sorted(rows, key=lambda r: r["date"])


if __name__ == "__main__":
    try:
        if sys.argv[1] == "list":
            print(json.dumps(list_sources(sys.argv[2] if len(sys.argv) > 2 else "uk")))
        else:
            req = json.loads(sys.argv[2])
            print(json.dumps(fetch(req["source"], req.get("args") or {})))
    except Exception as err:  # noqa: BLE001
        print(json.dumps({"error": f"{type(err).__name__}: {err}"}))
        sys.exit(1)
