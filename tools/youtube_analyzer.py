import os
import sys
import re
import json
import argparse
import urllib.request
import urllib.parse
import subprocess
from dotenv import load_dotenv

# Optional third-party imports with graceful fallbacks
try:
    from youtube_transcript_api import YouTubeTranscriptApi
except ImportError:
    YouTubeTranscriptApi = None

try:
    import yaml
except ImportError:
    yaml = None

def load_env_file():
    """Loads variables from .env file manually."""
    env_path = ".env"
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()

def extract_video_id(url_or_id):
    """Extracts the YouTube 11-character video ID from a URL or returns it directly."""
    if len(url_or_id) == 11 and re.match(r"^[a-zA-Z0-9_-]{11}$", url_or_id):
        return url_or_id
    
    # Common youtube URL patterns
    patterns = [
        r"(?:v=|\/v\/|embed\/|youtu\.be\/|shorts\/|\/embed\/|\/v=|^)([a-zA-Z0-9_-]{11})"
    ]
    for pattern in patterns:
        match = re.search(pattern, url_or_id)
        if match:
            return match.group(1)
    return None

def fetch_transcript(video_id):
    """Fetches the raw transcript using youtube-transcript-api and returns a list of dictionaries."""
    if YouTubeTranscriptApi is None:
        print("[FEHLER] 'youtube-transcript-api' ist nicht installiert.", file=sys.stderr)
        sys.exit(1)
        
    try:
        print(f"[INFO] Rufe Transkript für Video-ID {video_id} ab...")
        raw_entries = YouTubeTranscriptApi().fetch(video_id, languages=['de', 'en'])
        processed_entries = []
        for entry in raw_entries:
            if isinstance(entry, dict):
                processed_entries.append({
                    "text": entry.get("text", ""),
                    "start": entry.get("start", 0.0),
                    "duration": entry.get("duration", 0.0)
                })
            else:
                processed_entries.append({
                    "text": getattr(entry, "text", ""),
                    "start": getattr(entry, "start", 0.0),
                    "duration": getattr(entry, "duration", 0.0)
                })
        return processed_entries
    except Exception as e:
        print(f"[FEHLER] Fehler beim Abrufen des Transkripts: {e}", file=sys.stderr)
        sys.exit(1)

def chunk_transcript(entries, max_chars=12000):
    """Chunks the transcript into semantically logical segments to stay in the 'Smart Zone'."""
    chunks = []
    current_chunk = []
    current_length = 0
    
    for entry in entries:
        if isinstance(entry, dict):
            text = entry.get('text', '')
            start = entry.get('start', 0.0)
        else:
            text = getattr(entry, 'text', '')
            start = getattr(entry, 'start', 0.0)
            
        formatted_line = f"[{int(start // 60):02d}:{int(start % 60):02d}] {text}"
        
        if current_length + len(formatted_line) > max_chars and current_chunk:
            chunks.append("\n".join(current_chunk))
            current_chunk = []
            current_length = 0
            
        current_chunk.append(formatted_line)
        current_length += len(formatted_line)
        
    if current_chunk:
        chunks.append("\n".join(current_chunk))
        
    return chunks

def call_deepseek_api(prompt, system_prompt):
    """Calls the DeepSeek API using standard urllib."""
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        print("[FEHLER] Kein DEEPSEEK_API_KEY in der .env-Datei oder im System gefunden.", file=sys.stderr)
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
    
    req = urllib.request.Request(
        url, 
        data=json.dumps(data).encode("utf-8"), 
        headers=headers, 
        method="POST"
    )
    
    try:
        print("[INFO] Sende Anfrage an die DeepSeek API...")
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            return res_json['choices'][0]['message']['content']
    except urllib.error.HTTPError as e:
        print(f"[FEHLER] HTTP-Fehler beim DeepSeek API-Aufruf: {e.code} - {e.read().decode('utf-8')}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[FEHLER] Unerwarteter DeepSeek API-Fehler: {e}", file=sys.stderr)
        sys.exit(1)

def call_gemini_api(prompt, system_prompt):
    """Calls the Gemini REST API using standard urllib."""
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("[FEHLER] Kein GEMINI_API_KEY oder GOOGLE_API_KEY in der .env-Datei oder im System gefunden.", file=sys.stderr)
        sys.exit(1)
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {
        "Content-Type": "application/json"
    }
    
    data = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "systemInstruction": {
            "parts": [
                {"text": system_prompt}
            ]
        },
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }
    
    req = urllib.request.Request(
        url, 
        data=json.dumps(data).encode("utf-8"), 
        headers=headers, 
        method="POST"
    )
    
    try:
        print("[INFO] Sende Anfrage an die Gemini API (gemini-2.5-flash)...")
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            return res_json['candidates'][0]['content']['parts'][0]['text']
    except urllib.error.HTTPError as e:
        print(f"[FEHLER] HTTP-Fehler beim Gemini API-Aufruf: {e.code} - {e.read().decode('utf-8')}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[FEHLER] Unerwarteter Gemini API-Fehler: {e}", file=sys.stderr)
        sys.exit(1)

def call_llm_api(model, prompt, system_prompt):
    """Dispatches the API request to the selected model."""
    if model == "gemini":
        return call_gemini_api(prompt, system_prompt)
    else:
        return call_deepseek_api(prompt, system_prompt)

def format_as_yaml(json_data):
    """Formats Python dictionary to beautiful YAML string."""
    if yaml is not None:
        return yaml.dump(json_data, allow_unicode=True, sort_keys=False, default_flow_style=False)
    
    # Custom fallback simple YAML formatter if pyyaml is missing
    def _to_yaml(data, indent=0):
        lines = []
        spacing = " " * indent
        if isinstance(data, dict):
            for k, v in data.items():
                if isinstance(v, (dict, list)):
                    lines.append(f"{spacing}{k}:")
                    lines.append(_to_yaml(v, indent + 2))
                else:
                    if isinstance(v, str) and (":" in v or "-" in v or "#" in v or "\n" in v):
                        v = v.replace('"', '\\"')
                        lines.append(f'{spacing}{k}: "{v}"')
                    else:
                        lines.append(f"{spacing}{k}: {v}")
        elif isinstance(data, list):
            for item in data:
                if isinstance(item, (dict, list)):
                    first_line = _to_yaml(item, indent + 2).lstrip()
                    lines.append(f"{spacing}- {first_line}")
                    rest = _to_yaml(item, indent + 2).split("\n")[1:]
                    for r in rest:
                        lines.append(r)
                else:
                    lines.append(f"{spacing}- {item}")
        return "\n".join([l for l in lines if l.strip()])

    return _to_yaml(json_data)

def compile_pdf(md_path):
    """Compiles the Markdown file into a PDF using node tools/generate-pdf.js in neutral mode."""
    print(f"[INFO] Generiere PDF aus {md_path} via tools/generate-pdf.js (Neutral-Modus)...")
    try:
        result = subprocess.run(
            ["node", "tools/generate-pdf.js", md_path, "neutral"],
            capture_output=True,
            text=True,
            check=True
        )
        print(f"[ERFOLG] PDF erfolgreich generiert!")
        print(result.stdout.strip())
    except Exception as e:
        print(f"[WARNUNG] PDF-Generierung fehlgeschlagen: {e}", file=sys.stderr)
        if hasattr(e, 'stderr') and e.stderr:
            print(f"Details: {e.stderr}", file=sys.stderr)

def main():
    parser = argparse.ArgumentParser(description="Universeller YouTube Video-Transkript Extraktor, AI-Workflow/News-Analysator & PDF-Generator")
    parser.add_argument("url", help="YouTube Video-URL oder 11-stellige Video-ID")
    parser.add_argument("-o", "--output", help="Basis-Dateipfad für die Ausgabe (Standard: tasks/youtube_report.yaml)", default="tasks/youtube_report.yaml")
    parser.add_argument("-f", "--focus", help="Fokus der Analyse (z.B. 'Software-Entwicklung', 'KI-Trends', 'Wichtige Neuigkeiten')", default="Wichtige Neuigkeiten, Kernkonzepte und praxisrelevante Workflows")
    parser.add_argument("-m", "--model", choices=["deepseek", "gemini"], default="gemini", help="Das zu verwendende KI-Modell (deepseek oder gemini)")
    parser.add_argument("--raw", action="store_true", help="Nur das rohe Transkript herunterladen und als JSON speichern")
    args = parser.parse_args()
    
    load_env_file()
    
    video_id = extract_video_id(args.url)
    if not video_id:
        print("[FEHLER] Ungültige YouTube-URL oder Video-ID.", file=sys.stderr)
        sys.exit(1)
        
    print(f"[INFO] Starte Analyse für Video ID: {video_id}")
    print(f"[INFO] Analyse-Fokus: {args.focus}")
    print(f"[INFO] Gewähltes Modell: {args.model}")
    
    # Fetch transcript
    transcript_entries = fetch_transcript(video_id)
    
    if args.raw:
        raw_output = f"transcript_{video_id}.json"
        with open(raw_output, "w", encoding="utf-8") as f:
            json.dump(transcript_entries, f, ensure_ascii=False, indent=2)
        print(f"[ERFOLG] Roh-Transkript in '{raw_output}' gespeichert.")
        sys.exit(0)
        
    # Chunk transcript
    chunks = chunk_transcript(transcript_entries)
    print(f"[INFO] Transkript in {len(chunks)} Segmente unterteilt (Smart Zone).")
    
    segment_analyses = []
    
    for i, chunk in enumerate(chunks):
        print(f"[INFO] Verarbeite Segment {i+1} von {len(chunks)}...")
        
        prompt = f"""
Du bist ein erstklassiger technischer Analyst. Analysiere das folgende Videosegment-Transkript und extrahiere alle Informationen, Konzepte, Neuigkeiten und Workflows, die für das folgende Fokusthema relevant sind.

Fokusthema der Analyse: "{args.focus}"

Gib ein JSON-Objekt zurück, das GENAU dieser Struktur entspricht:
{{
  "segment_index": {i+1},
  "topics": [
    {{
      "title": "Titel des Themas",
      "relevance_weight": 0.9,
      "summary": "Präzise, dichte Zusammenfassung für nachgelagerte KI-Modelle",
      "rules_or_guidelines": [
        "Leitlinie 1: Präzise Beschreibung",
        "Leitlinie 2: Präzise Beschreibung"
      ],
      "workflows_or_steps": [
        "Schritt 1: Beschreibung",
        "Schritt 2: Beschreibung"
      ]
    }}
  ]
}}

Antworte NUR mit validem, rohem JSON. Keine Markdown-Block-Wrapper.

Transkript-Segment:
\"\"\"
{chunk}
\"\"\"
"""
        result = call_llm_api(args.model, prompt, system_prompt="You are a highly analytical technical documentation assistant. Respond ONLY with valid, raw JSON.")
        
        result = re.sub(r"^```json\s*", "", result, flags=re.MULTILINE)
        result = re.sub(r"\s*```$", "", result, flags=re.MULTILINE)
        
        try:
            analysis_dict = json.loads(result.strip())
            segment_analyses.append(analysis_dict)
        except Exception as e:
            print(f"[WARNUNG] Fehler beim Parsen von Segment {i+1}: {e}", file=sys.stderr)
            segment_analyses.append({"segment_index": i+1, "error": str(e), "raw": result})

    # Synthesis Prompt
    print("[INFO] Starte Synthese aller Segment-Analysen...")
    synthesis_prompt = f"""
Führe die folgenden Segment-Analysen eines Vortrags/Videos zusammen. Das Ziel ist es, die Informationen bezüglich des Fokusthemas optimal aufzubereiten.

Fokusthema der Analyse: "{args.focus}"

Du musst zwei unterschiedliche Versionen generieren:
1. `yaml_data`: Eine hochgradig strukturierte Datenstruktur für LLMs (YAML/JSON kompatibel).
2. `human_markdown`: Ein für den Menschen optimierter, dichter, übersichtlicher Bericht in deutscher Sprache.

Das ausgegebene JSON MUSS exakt diesem Schema entsprechen:
{{
  "yaml_data": {{
    "metadata": {{
      "source_video_id": "{video_id}",
      "analysis_focus": "{args.focus}",
      "purpose": "Universelle LLM-Workflow- und Konzept-Referenz"
    }},
    "core_philosophies_or_insights": [
      {{
        "concept": "Name des Konzepts",
        "relevance": 1.0,
        "description": "Erklärung..."
      }}
    ],
    "workflows_and_procedures": [
      {{
        "title": "Name des Workflows",
        "steps": [],
        "guardrails_or_rules": []
      }}
    ],
    "reusable_skills_or_actions": [
      {{
        "name": "Name der Aktion",
        "trigger": "Wann ausführen?",
        "instructions": []
      }}
    ]
  }},
  "human_markdown": "# Universal Video Analysis Report\\n\\n## 1. Management Summary\\n[Kurz und dicht]...\\n\\n## 2. Kern-Erkenntnisse & Philosophien (Gewichtet)\\n...\\n\\n## 3. Strukturierte Workflows & Abläufe\\n...\\n\\n## 4. Konkrete Handlungsanweisungen & Skills\\n..."
}}

Richtlinien für `human_markdown`:
- Sprache: Deutsch.
- Struktur: Extrem scannbar, mit Bullet-Points, Fettdruck und Markdown-Tabellen für die Relevanz-Gewichtungen.
- Verwende eine neutrale, professionelle Sprache (keine brandspezifischen Begriffe oder Namen außer denen im Video).

Segment-Daten:
{json.dumps(segment_analyses, ensure_ascii=False, indent=2)}
"""

    synthesis_result = call_llm_api(args.model, synthesis_prompt, system_prompt="You are a master technical analyst. Respond ONLY with valid, raw JSON.")
    synthesis_result = re.sub(r"^```json\s*", "", synthesis_result, flags=re.MULTILINE)
    synthesis_result = re.sub(r"\s*```$", "", synthesis_result, flags=re.MULTILINE)
    
    try:
        final_dict = json.loads(synthesis_result.strip())
        
        # 1. Save YAML
        yaml_string = format_as_yaml(final_dict["yaml_data"])
        yaml_path = args.output
        if not yaml_path.endswith(".yaml") and not yaml_path.endswith(".yml"):
            yaml_path = yaml_path + ".yaml"
            
        with open(yaml_path, "w", encoding="utf-8") as f:
            f.write(yaml_string)
        print(f"[ERFOLG] LLM-optimierte Form in '{yaml_path}' gespeichert.")
        
        # 2. Save Markdown (Human optimized)
        md_path = yaml_path.replace(".yaml", ".md").replace(".yml", ".md")
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(final_dict["human_markdown"])
        print(f"[ERFOLG] Menschlich-optimierte Form in '{md_path}' gespeichert.")
        
        # 3. Generate PDF
        compile_pdf(md_path)
        
    except Exception as e:
        print(f"[FEHLER] Fehler bei der finalen Synthese-Generierung: {e}", file=sys.stderr)
        fallback_path = args.output.replace(".yaml", "_fallback.json").replace(".yml", "_fallback.json")
        with open(fallback_path, "w", encoding="utf-8") as f:
            f.write(synthesis_result)
        print(f"[INFO] Rohdaten zur Sicherheit in '{fallback_path}' gespeichert.")

if __name__ == "__main__":
    main()
