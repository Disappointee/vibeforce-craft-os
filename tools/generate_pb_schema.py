import sqlite3
import json
import os

def generate_schema():
    db_path = os.path.join('backend', 'pb_data', 'data.db')
    output_path = os.path.join('backend', 'schema.md')

    if not os.path.exists(db_path):
        print(f"Fehler: PocketBase DB nicht gefunden unter {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT name, type, fields FROM _collections;")
        rows = cursor.fetchall()
    except sqlite3.OperationalError:
        cursor.execute("SELECT name, type, schema FROM _collections;")
        rows = cursor.fetchall()

    markdown = "# PocketBase Datenmodell & Collections (Auto-generated)\n\n"
    markdown += "> **WICHTIG FUR KI-AGENTEN:** Dies ist die Single Source of Truth fur alle Datenbank-Queries und Typisierungen. Niemals das Schema erraten!\n\n"

    for name, c_type, fields_json in rows:
        markdown += f"## Collection: `{name}` (Typ: {c_type})\n"
        markdown += "| Feldname | Typ | Details / Relationen |\n"
        markdown += "| :--- | :--- | :--- |\n"

        fields = json.loads(fields_json) if fields_json else []
        for field in fields:
            f_name = field.get('name', 'id')
            f_type = field.get('type', 'text')

            details = []
            if field.get('required'): details.append("Required")
            if field.get('unique'): details.append("Unique")
            opts = field.get('options', {})
            if opts.get('maxSelect'): details.append(f"MaxSelect: {opts['maxSelect']}")
            if opts.get('collectionId'): details.append(f"Relation -> `{opts['collectionId']}`")

            details_str = ", ".join(details) if details else "-"
            markdown += f"| `{f_name}` | **{f_type}** | {details_str} |\n"
        markdown += "\n"

    conn.close()

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(markdown)
    print(f"Schema erfolgreich exportiert nach: {output_path}")

if __name__ == "__main__":
    generate_schema()
