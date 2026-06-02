# Universal Video Analysis Report

## 1. Management Summary
Dieser Bericht fasst die Kernkonzepte und praktischen Workflows rund um CSS Subgrid zusammen. Subgrid ermöglicht konsistente Ausrichtung in verschachtelten Grid-Layouts und ist seit 2023 browserübergreifend verfügbar. Die Analyse zeigt, wie Subgrid in Karten, Formularen und Artikeln eingesetzt wird, und gibt Best Practices sowie Fallbacks für ältere Browser.

## 2. Kern-Erkenntnisse & Philosophien (Gewichtet)

| Konzept | Relevanz | Beschreibung |
|---------|----------|--------------|
| **CSS Subgrid: Nested Grid Alignment** | 0.95 | Subgrid übernimmt die Spuren des übergeordneten Grids und löst Ausrichtungsprobleme in verschachtelten Layouts. Aktiviert durch `grid-template-columns: subgrid` oder `grid-template-rows: subgrid`. |
| **Praktische Anwendungsfälle für Subgrid** | 0.85 | Ideal für Kartenlayouts (gleiche Höhe von Titeln, Bildern, Buttons), Formulare (einheitliche Label-/Eingabebreiten) und Artikel (konsistente vertikale Rhythmik). |
| **Häufige Fallstricke und Best Practices** | 0.75 | Subgrid nur auf der benötigten Achse anwenden, Verschachtelungstiefe auf 2 Ebenen begrenzen, numerische Linien bevorzugen, Fallback mit @supports bereitstellen. |

## 3. Strukturierte Workflows & Abläufe

### Subgrid implementieren
1. Übergeordnetes Grid mit `display: grid` und gewünschten Spalten/Zeilen definieren.
2. Kind-Element mit `display: grid` versehen.
3. Auf dem Kind-Element `grid-template-rows: subgrid` oder `grid-template-columns: subgrid` setzen.
4. Für beide Achsen beide Eigenschaften explizit deklarieren.
5. Mit `@supports (grid-template-rows: subgrid)` eine Fallback-Regel für ältere Browser hinzufügen.

**Guardrails:**
- Subgrid nur auf der auszurichtenden Achse anwenden.
- Verschachtelung auf maximal zwei Ebenen beschränken.
- Bevorzugt numerische Liniennummern verwenden.
- Fallback mit @supports implementieren.
- Bei Problemen Grid-Overlay-Ansicht in Entwicklertools nutzen.

### Subgrid für Kartenlayouts
1. Übergeordnetes Grid mit Spalten für die Karten definieren.
2. Jede Karte als Subgrid auf den Zeilen definieren.

### Subgrid für Formulare
1. Übergeordnetes Grid mit Spalten für Label, Input und Hilfetext definieren.
2. Jede Formularzeile als Subgrid auf den Spalten definieren.

### Subgrid für Artikel-Layouts
1. Übergeordnetes Grid mit Zeilen-Tracks für konsistente Rhythmik definieren.
2. Jede Sektion als Subgrid auf den Zeilen definieren.

## 4. Konkrete Handlungsanweisungen & Skills

### Subgrid implementieren
- **Auslöser:** Wenn ein verschachteltes Layout inkonsistente Ausrichtung aufweist und Subgrid in allen modernen Browsern unterstützt wird.
- **Schritte:**
  1. Übergeordnetes Grid mit `display: grid` und gewünschten Spalten/Zeilen definieren.
  2. Kind-Element mit `display: grid` versehen.
  3. Auf dem Kind-Element `grid-template-rows: subgrid` oder `grid-template-columns: subgrid` setzen.
  4. Für beide Achsen beide Eigenschaften explizit deklarieren.
  5. Mit `@supports (grid-template-rows: subgrid)` eine Fallback-Regel für ältere Browser hinzufügen.

### Subgrid-Fallback bereitstellen
- **Auslöser:** Wenn Browser ohne Subgrid-Unterstützung unterstützt werden müssen.
- **Schritte:**
  1. Zuerst normales Grid ohne Subgrid definieren.
  2. Dann mit `@supports (grid-template-rows: subgrid)` die Subgrid-Regel überschreiben.

### Subgrid debuggen
- **Auslöser:** Wenn die Ausrichtung nicht wie erwartet funktioniert.
- **Schritte:**
  1. Grid-Overlay-Ansicht in den Entwicklertools aktivieren.
  2. Prüfen, ob Subgrid auf der richtigen Achse deklariert ist.
  3. Verschachtelungstiefe überprüfen (maximal zwei Ebenen).
  4. Numerische Liniennummern statt benannter Linien verwenden.