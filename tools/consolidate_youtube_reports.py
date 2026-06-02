import os
import sys
import re
import json
import argparse
import urllib.request
import subprocess
from dotenv import load_dotenv
from glob import glob as glob_files

try:
    import yaml as _yaml_lib
except ImportError:
    _yaml_lib = None

def load_env_file():
    env_path = ".env"
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()

def call_deepseek_api(prompt, system_prompt):
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        print("[FEHLER] Kein DEEPSEEK_API_KEY gesetzt.", file=sys.stderr)
        sys.exit(1)

    url = "https://api.deepseek.com/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"}
    }
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
    try:
        print("[INFO] Sende Konsolidierungs-Anfrage an die DeepSeek API...")
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            return res_json['choices'][0]['message']['content']
    except urllib.error.HTTPError as e:
        print(f"[FEHLER] HTTP-Fehler DeepSeek: {e.code} - {e.read().decode('utf-8')}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[FEHLER] DeepSeek API-Fehler: {e}", file=sys.stderr)
        sys.exit(1)

def call_gemini_api(prompt, system_prompt):
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("[FEHLER] Kein GEMINI_API_KEY oder GOOGLE_API_KEY gesetzt.", file=sys.stderr)
        sys.exit(1)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2}
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
    try:
        print("[INFO] Sende Konsolidierungs-Anfrage an die Gemini API...")
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            return res_json['candidates'][0]['content']['parts'][0]['text']
    except urllib.error.HTTPError as e:
        print(f"[FEHLER] HTTP-Fehler Gemini: {e.code} - {e.read().decode('utf-8')}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[FEHLER] Gemini API-Fehler: {e}", file=sys.stderr)
        sys.exit(1)

def call_llm_api(model, prompt, system_prompt):
    if model == "gemini":
        return call_gemini_api(prompt, system_prompt)
    return call_deepseek_api(prompt, system_prompt)

def read_yaml_file(path):
    if _yaml_lib is not None:
        with open(path, "r", encoding="utf-8") as f:
            return _yaml_lib.safe_load(f)
    content = json.load(open(path, "r", encoding="utf-8"))
    return content

def format_as_yaml(data):
    if _yaml_lib is not None:
        return _yaml_lib.dump(data, allow_unicode=True, sort_keys=False, default_flow_style=False)

    def _to_yaml(d, indent=0):
        lines = []
        spacing = " " * indent
        if isinstance(d, dict):
            for k, v in d.items():
                if isinstance(v, (dict, list)):
                    lines.append(f"{spacing}{k}:")
                    lines.append(_to_yaml(v, indent + 2))
                else:
                    s = str(v)
                    if any(c in s for c in [":", "-", "#", "\n"]):
                        s = s.replace('"', '\\"')
                        lines.append(f'{spacing}{k}: "{s}"')
                    else:
                        lines.append(f"{spacing}{k}: {s}")
        elif isinstance(d, list):
            for item in d:
                if isinstance(item, (dict, list)):
                    first = _to_yaml(item, indent + 2).lstrip()
                    lines.append(f"{spacing}- {first}")
                    rest = _to_yaml(item, indent + 2).split("\n")[1:]
                    for r in rest:
                        lines.append(r)
                else:
                    lines.append(f"{spacing}- {item}")
        return "\n".join([l for l in lines if l.strip()])
    return _to_yaml(data)

def compile_pdf(md_path):
    print(f"[INFO] Generiere PDF aus {md_path} via tools/generate-pdf.js (Neutral-Modus)...")
    try:
        result = subprocess.run(
            ["node", "tools/generate-pdf.js", md_path, "neutral"],
            capture_output=True, text=True, check=True
        )
        print(f"[ERFOLG] PDF erfolgreich generiert!")
        print(result.stdout.strip())
    except Exception as e:
        print(f"[WARNUNG] PDF-Generierung fehlgeschlagen: {e}", file=sys.stderr)
        if hasattr(e, 'stderr') and e.stderr:
            print(f"Details: {e.stderr}", file=sys.stderr)

def main():
    parser = argparse.ArgumentParser(description="Konsolidiert mehrere YouTube-Analyse-YAML-Reports in einen Meta-Report mit Querverbindungen.")
    parser.add_argument("inputs", nargs="+", help="Pfade zu den YAML-Report-Dateien (z.B. tasks/youtube_report_*.yaml)")
    parser.add_argument("-o", "--output", help="Basis-Dateipfad für die Konsolidierungs-Ausgabe (Standard: tasks/consolidated_report.yaml)", default="tasks/consolidated_report.yaml")
    parser.add_argument("-f", "--focus", help="Fokus der Konsolidierung", default="Querverbindungen, Synergien, Widersprüche und komplementäre Einsichten zwischen den Quellen")
    parser.add_argument("-m", "--model", choices=["deepseek", "gemini"], default="deepseek", help="KI-Modell (deepseek oder gemini)")
    args = parser.parse_args()

    load_env_file()

    expanded = []
    for pat in args.inputs:
        matches = glob_files(pat) if any(c in pat for c in "*?[]") else [pat]
        expanded.extend(matches)

    if not expanded:
        print("[FEHLER] Keine YAML-Dateien gefunden.", file=sys.stderr)
        sys.exit(1)

    print(f"[INFO] Lade {len(expanded)} Report(s):")
    reports = []
    for path in expanded:
        print(f"  - {path}")
        try:
            reports.append({"source_file": path, "data": read_yaml_file(path)})
        except Exception as e:
            print(f"  [WARNUNG] Fehler beim Lesen von {path}: {e}")

    if not reports:
        print("[FEHLER] Keine Reports lesbar.", file=sys.stderr)
        sys.exit(1)

    reports_json = json.dumps([r["data"] for r in reports], ensure_ascii=False, indent=2)

    prompt = f"""
Du bist ein erstklassiger Meta-Analyst. Dir liegen {len(reports)} strukturierte YAML-Analyse-Reports von verschiedenen YouTube-Videos vor.
Deine Aufgabe: Erstelle eine tiefgehende Konsolidierung, die Querverbindungen, Synergien, Widersprüche und komplementäre Einsichten zwischen allen Quellen identifiziert.

Konsolidierungs-Fokus: "{args.focus}"

Generiere ZWEI Versionen innerhalb eines JSON-Objekts:

1. `yaml_data` — Strukturierte, gewichtete Daten für LLMs:
{{
  "metadata": {{
    "source_reports": ["path1.yaml", "path2.yaml", ...],
    "consolidation_focus": "{args.focus}",
    "total_sources": {len(reports)},
    "purpose": "Konsolidierte Meta-Referenz aus {len(reports)} Quellen"
  }},
  "cross_cutting_themes": [
    {{
      "theme": "Name des Querschnittsthemas",
      "cross_relevance": 1.0,
      "present_in_sources": ["source1", "source2"],
      "synthesis": "Synthetisierte Kernaussage über alle Quellen",
      "source_contributions": [
        {{ "source": "path1", "specific_insight": "Was diese Quelle beisteuert", "weight": 0.8 }}
      ]
    }}
  ],
  "synergies": [
    {{
      "synergy_name": "Name der Synergie",
      "strength": 0.95,
      "description": "Wie sich die Quellen gegenseitig verstärken",
      "combined_power": "Was erreicht wird, wenn man alle Quellen zusammen betrachtet",
      "involved_sources": ["source1", "source2"]
    }}
  ],
  "contradictions_or_tensions": [
    {{
      "topic": "Thema mit Widerspruch",
      "severity": "minor|moderate|major",
      "position_a": {{ "source": "path1", "claim": "...", "confidence": 0.8 }},
      "position_b": {{ "source": "path2", "claim": "...", "confidence": 0.7 }},
      "resolution_hypothesis": "Mögliche Auflösung oder Kontext"
    }}
  ],
  "consolidated_workflows": [
    {{
      "title": "Quellenübergreifender Workflow",
      "aggregated_steps": [],
      "source_workflows_merged": ["ref1", "ref2"],
      "completeness_score": 0.85
    }}
  ],
  "master_reference": {{
    "all_concepts_ranked": [
      {{
        "concept": "Name",
        "global_relevance": 0.95,
        "source_count": 3,
        "most_authoritative_source": "path1",
        "synthesized_definition": "..."
      }}
    ],
    "top_actionable_insights": [
      {{
        "insight": "...",
        "priority": "immediate|short_term|strategic",
        "backed_by_sources": ["source1", "source2"],
        "confidence": 0.9
      }}
    ]
  }}
}}

2. `human_markdown` — Deutscher, scannbarer Meta-Report mit:
- Executive Summary (3 Sätze)
- Querschnittsthemen-Tabelle (Theme | Cross-Relevanz | Quellen)
- Synergie-Matrix
- Widersprüche & kritische Prüfpunkte
- Konsolidierte Master-Workflows
- Globales Konzept-Ranking (Top 10 mit Relevanz-Scores und Quellenanzahl)
- Top 5 Actionable Insights mit Priorität

Wichtige Regeln:
- Jedes Konzept/Thema MUSS einen cross_relevance/global_relevance Score (0.0-1.0) haben.
- Identifiziere ECHTE Widersprüche, nicht nur unterschiedliche Perspektiven.
- Bei Synergien: erkläre wie 1+1>2 entsteht.
- human_markdown MUSS in Deutsch sein, mit Markdown-Tabellen, Bullet-Points und Fettdruck.
- Antworte NUR mit validem JSON. Kein Markdown-Wrapper.

Quell-Reports:
{reports_json}
"""

    result = call_llm_api(args.model, prompt, "You are a master meta-analyst specialized in cross-referencing and synthesizing multiple sources. Respond ONLY with valid, raw JSON.")
    result = re.sub(r"^```json\s*", "", result, flags=re.MULTILINE)
    result = re.sub(r"\s*```$", "", result, flags=re.MULTILINE)

    try:
        final = json.loads(result.strip())

        yaml_path = args.output
        if not yaml_path.endswith(".yaml") and not yaml_path.endswith(".yml"):
            yaml_path += ".yaml"

        yaml_str = format_as_yaml(final["yaml_data"])
        with open(yaml_path, "w", encoding="utf-8") as f:
            f.write(yaml_str)
        print(f"[ERFOLG] Konsolidiertes YAML in '{yaml_path}' gespeichert.")

        md_path = yaml_path.replace(".yaml", ".md").replace(".yml", ".md")
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(final["human_markdown"])
        print(f"[ERFOLG] Konsolidierter Markdown-Report in '{md_path}' gespeichert.")

        compile_pdf(md_path)

    except Exception as e:
        print(f"[FEHLER] Synthese-Fehler: {e}", file=sys.stderr)
        fallback = args.output.replace(".yaml", "_fallback.json").replace(".yml", "_fallback.json")
        with open(fallback, "w", encoding="utf-8") as f:
            f.write(result)
        print(f"[INFO] Rohdaten in '{fallback}' gespeichert.")

if __name__ == "__main__":
    main()
