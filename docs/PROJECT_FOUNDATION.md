# Project Foundation

Status: **verbindliche Grundlage für die weitere Entwicklung von LabDelta**

Dieses Dokument konsolidiert die bestehenden Anforderungen in `docs/` und ergänzt die danach verbindlich getroffenen Entscheidungen. Bei einem inhaltlichen Widerspruch hat dieses Dokument Vorrang, bis das betroffene ältere Dokument angepasst wurde. Historische Beobachtungen in `docs/CODEX_BUILD_LOG.md` bleiben historische Fakten und sind keine normative Produktspezifikation.

Die hier festgelegten Grenzen dürfen nicht durch technische Annahmen, Demonstrationsdaten oder nicht kuratierte medizinische Regeln erweitert werden.

## 1. Status und Zweck

LabDelta ist ein öffentlich einsehbares Forschungs- und Demonstrationsprojekt für eine lokale, plattformübergreifende Desktop-Anwendung und soll künftig unter einer Open-Source-Lizenz bereitgestellt werden. Das Repository ist bereits öffentlich. Da noch keine Lizenz ausgewählt wurde, ist der öffentlich sichtbare Quellcode derzeit nicht zur Nutzung, Veränderung oder Weiterverbreitung freigegeben. Die konkrete Open-Source-Lizenz ist vor der ersten lizenzierten Veröffentlichung festzulegen.

Der gegenwärtige Zweck ist ausschließlich die nachvollziehbare Demonstration, wie bereits in Laborberichten enthaltene Informationen strukturiert, gegenübergestellt, gruppiert und auf ihre Originalquelle zurückgeführt werden können. Bis zu einem späteren fachlichen und regulatorischen Review arbeitet die Anwendung ausschließlich mit synthetischen Testdaten.

LabDelta ist:

- nicht klinisch validiert;
- nicht als Medizinprodukt zertifiziert oder freigegeben;
- nicht für medizinische Nutzung freigegeben;
- nicht für Entscheidungen über reale Personen bestimmt.

LabDelta erstellt keine:

- Diagnose oder Differenzialdiagnose;
- Krankheitswahrscheinlichkeit;
- Prognose oder Vorhersage;
- Kausalitätsaussage;
- Therapie-, Behandlungs- oder Medikationsempfehlung;
- Empfehlung zusätzlicher Tests oder Untersuchungen;
- sonstige medizinische Handlungsempfehlung.

Die Anwendung darf insbesondere nicht zur Vorbereitung, Unterstützung, Bestätigung oder Verwerfung medizinischer Entscheidungen verwendet werden. Für die Demonstration sind ausschließlich die unveränderten synthetischen Originaldokumente der freigegebenen Fixtures gegenüber daraus abgeleiteten Demo-Anzeigen maßgeblich. LabDelta enthält keine realen Originalbefunde und bildet kein freigegebenes reales klinisches Nutzungsszenario ab.

Der aktuelle Implementierungsstand umfasst die Tauri-/React-Anwendungshülle, statische synthetische Laboransichten und lokale SQLite-Patientenverwaltung. Persistierte Laborberichte, das vollständige Provenienzmodell, der kontrollierte Fixture-Import und die deterministische Analyse sind noch nicht umgesetzt.

## 2. Unverrückbare Projektgrundsätze

1. **Ausschließlich synthetische Daten:** Bis zu einem späteren fachlichen und regulatorischen Review dürfen keine realen Patienten- oder Laborberichtsdaten verarbeitet werden.
2. **Lokal und offline:** Patientendaten, Demo-Daten, Quelldokumente und Analyseergebnisse verbleiben lokal. Es gibt keine Laufzeit-Cloudverarbeitung, keine patientenbezogenen Netzwerkanfragen und keine Telemetrie.
3. **Keine Laufzeit-KI:** Es gibt kein Runtime-LLM und keine Blackbox-Entscheidung. Analyse und Priorisierung sind deterministisch, versioniert, testbar und erklärbar.
4. **Originale bleiben unverändert:** Originaldokumente, Originalwerte, Originaleinheiten, Originalreferenzbereiche und Originalbezeichnungen werden nicht überschrieben.
5. **Vollständige Provenienz:** Jeder strukturierte oder abgeleitete Wert bleibt auf Bericht, Dokument und Fundstelle zurückführbar.
6. **Keine stillen Annahmen:** Fehlende Werte, Referenzbereiche, Identitäten, Parameterzuordnungen, Einheiten, Materialien, Methoden oder Umrechnungen werden nicht erfunden.
7. **Keine stille Patientenzuordnung:** Eine endgültige Zuordnung darf nie unbemerkt geändert werden. Unbestätigte Importe dürfen nur vorübergehend im Importprozess unzugeordnet sein.
8. **Businesslogik nur einmal:** Fachliche Regeln liegen ausschließlich im Rust-Kern. React stellt Zustände und Erklärungen dar, berechnet aber keine zweite fachliche Wahrheit.
9. **Stabile Identitäten:** Fachliche Entitäten und Regeln besitzen stabile interne IDs. Änderungen erzeugen neue Versionen oder protokollierte Korrekturen statt stiller Überschreibung.
10. **Geordnete Migrationen:** Jede Schemaänderung ist versioniert, geordnet, transaktional und gegen bestehende Daten getestet.
11. **Starke Typen und explizite Fehler:** Nicht bewertbar, nicht vergleichbar, unbestätigt, mehrdeutig und fehlend sind eigenständige Zustände und keine leeren Erfolgswerte.
12. **Kleine, getrennte Module:** UI, Tauri-Commands, Persistenz, Demo-Seed, Fixture-Import, Regelkatalog und Analyse bleiben klar getrennt.
13. **Tests je Stage:** Jede Stage erhält reproduzierbare Unit-, Persistenz-, Vertrags- und UI-Tests sowie die vereinbarten Build-, Lint- und Type-Check-Gates.
14. **Keine medizinische Aufwertung durch Sprache:** „Außerhalb des gelieferten Referenzbereichs“ darf nicht als „krank“ bezeichnet werden. Profile, Aufmerksamkeit und Trends sind keine Diagnosen.
15. **Arbeitsfähige Zwischenstände:** Die Entwicklung erfolgt sequenziell. Nach jeder Stage bleibt ein überprüfbarer, funktionsfähiger Teilstand erhalten.

## 3. Demo-Modus und Disclaimer

### 3.1 Zulässige Daten

Bis zu einem späteren fachlichen und regulatorischen Review gilt ein geschlossener Demo-Modus:

- Beliebige echte Patientenberichte dürfen nicht importiert werden, auch nicht als vermeintlich anonymisierte oder pseudonymisierte Beispiele.
- Importiert werden dürfen nur mitgelieferte oder ausdrücklich vom Projekt freigegebene Fixtures.
- Jedes zulässige Fixture benötigt eine stabile Fixture-ID, eine eindeutige Demo-Kennung, eine Version und eine hinterlegte Prüfsumme.
- Die Anwendung prüft Demo-Kennung und Prüfsumme fail-closed gegen ein versioniertes Freigabemanifest. Nicht bekannte, veränderte oder nicht eindeutig als Demo gekennzeichnete Dateien werden nicht als Quelle oder strukturierte Daten persistiert.
- Demo-Fixtures enthalten ausschließlich fiktive Personen, Laborberichte und Werte.

Die konkrete Prüfsummenmethode und der Freigabeprozess sind vor Gate 3.0B festzulegen; sie dürfen nicht ad hoc im Seed- oder Importcode entstehen.

### 3.2 Reproduzierbarer Demo-Seed

Ein definierter Teil der Demo-Daten wird beim ersten Start reproduzierbar geladen. Der Seed muss:

- versioniert sein;
- ausschließlich freigegebene Fixture-Inhalte verwenden;
- deterministische stabile IDs und Beziehungen erzeugen;
- bei gleicher Seed-Version denselben fachlichen Datenbestand erzeugen;
- idempotent sein und bei Wiederholung keine Duplikate erzeugen;
- seine Seed-Version und die verwendeten Fixture-Prüfsummen dokumentieren.

Welche Fixtures zum initialen Seed gehören und wie spätere Seed-Versionen mit bereits lokal veränderten Demo-Daten umgehen, bleibt vor Gate 3.0B festzulegen.

### 3.3 Architektonische Trennung

Die folgenden Pfade sind getrennte Module mit getrennten Verträgen und dürfen nicht durch einen gemeinsamen ungeprüften Einstieg vermischt werden:

1. **Demo-Seed:** reproduzierbare Erstbefüllung aus eingebetteten, freigegebenen Fixtures;
2. **Demo-Fixture-Import:** der in Stage 4 vorgesehene kontrollierte Import freigegebener Fixtures;
3. **späterer realer Importpfad:** gegenwärtig nicht freigegeben, nicht implementiert und außerhalb der aktuellen Stages.

Ein späterer realer Importpfad darf erst nach ausdrücklichem fachlichem und regulatorischem Review geplant werden. Er darf weder die Freigabelogik des Demo-Seeds umgehen noch durch bloßes Entfernen einer UI-Sperre aktiviert werden können.

### 3.4 Verbindliche Kennzeichnung und Hinweise

Überall innerhalb der Anwendung ist dauerhaft und deutlich sichtbar:

> Demo – ausschließlich synthetische Testdaten

Beim ersten Start wird vor der eigentlichen Anwendung ein vorgeschalteter Hinweis angezeigt. Zusätzlich bleibt innerhalb jeder Anwendungssicht eine dauerhafte Kennzeichnung bestehen. Der Hinweis muss mindestens eindeutig erklären:

- LabDelta ist ein Forschungs- und Demonstrationsprojekt;
- LabDelta ist nicht klinisch validiert und nicht für medizinische Nutzung freigegeben;
- es werden ausschließlich synthetische Testdaten verarbeitet;
- für die Demonstration sind ausschließlich die mitgelieferten synthetischen Originaldokumente gegenüber daraus abgeleiteten Demo-Anzeigen maßgeblich;
- alle dargestellten Personen, Befunde und Nutzungsszenarien sind synthetisch; es wird kein reales klinisches Nutzungsszenario dargestellt oder freigegeben;
- die Software darf nicht für medizinische Entscheidungen genutzt werden;
- die Software erstellt keine Diagnose, Prognose oder Empfehlung;
- Disclaimer und Zweckbestimmung sind keine regulatorische Prüfung, Zertifizierung oder Freigabe.

Der Disclaimer darf nicht als Ersatz für fachliche Validierung, Konformitätsbewertung oder regulatorische Freigabe dargestellt werden. Die genaue Formulierung, Lokalisierung und etwaige lokale Speicherung der erstmaligen Kenntnisnahme sind noch festzulegen.

## 4. Begriffe

| Begriff | Verbindliche Bedeutung |
| --- | --- |
| Reale Daten | Daten oder Dokumente, die ganz oder teilweise von einer realen Person oder realen Versorgungssituation stammen; im aktuellen Projektbetrieb verboten |
| Synthetische Testdaten | Vollständig fiktive Daten ohne Bezug zu einer realen Person |
| Demo-Fixture | Versionierter, vom Projekt freigegebener synthetischer Quelldatensatz mit Fixture-ID, Demo-Kennung und Prüfsumme |
| Demo-Seed | Reproduzierbare Erstbefüllung der lokalen Datenbank aus einer festgelegten Menge freigegebener Fixtures |
| Originaldokument | Unveränderte Quelldatei eines freigegebenen Demo-Fixtures |
| Originalwert | Exakte, unveränderte Darstellung eines Parameters, Werts, einer Einheit, eines Referenzbereichs oder Flags im Originaldokument |
| Automatische Extraktion | Versioniertes Parserergebnis aus dem Originaldokument einschließlich Konfidenz, Parser-Version und Fundstelle |
| Verifizierter Arbeitswert | Für die aktuelle Demo-Version ausdrücklich bestätigte strukturierte Repräsentation, die für weitere Verarbeitung zugelassen ist |
| Korrektur | Protokollierte Änderung eines extrahierten oder verifizierten Arbeitsfelds; sie verändert niemals Originaldokument oder Originalwert |
| Laborparameter | Stabil identifizierte Messgröße mit kanonischer Anzeige sowie erhaltenen Originalbezeichnungen und Aliasbeziehungen |
| Referenzstatus | Unabhängige Einordnung gegenüber dem vom jeweiligen Bericht gelieferten Referenzbereich: unterhalb, innerhalb, oberhalb oder nicht bewertbar |
| Mathematische Veränderung | Vergleichbarer numerischer Unterschied: höher, niedriger, stabil oder kein Vergleich; ohne automatische medizinische Bedeutung |
| Medizinisch bewertete Richtung | Günstiger, ungünstiger oder unbestimmt; nur auf Grundlage einer ausdrücklich fachlich kuratierten, anwendbaren Regel |
| Vergleichbar | Zwei Werte erfüllen alle freigegebenen Regeln für Parameteridentität, Einheit, Material, Methode, Kontext, Qualität und Chronologie |
| Trend | Deterministische Beschreibung mehrerer vergleichbarer Punkte; keine Prognose und keine Extrapolation |
| Profil | Versionierte organisatorische Ansicht aus statischen Parameterzuordnungen; keine Diagnose |
| Regel | Stabil identifizierte, versionierte und erklärbare Vorschrift für Klassifikation, Normalisierung, Umrechnung, Vergleich, medizinisch bewertete Richtung oder Priorisierung |
| Analyseausgabe | Reproduzierbares Ergebnis aus eindeutig referenzierten Quelldaten und Regelversionen |
| Offene Auffälligkeit | Älterer, weiterhin anzuzeigender Fall nach einer noch festzulegenden, versionierten Offen-/Erledigt-Regel |
| Provenienz | Vollständige Rückverfolgbarkeit von Anzeige oder Analyse über Arbeitswert und Extraktion bis zu Bericht, Dokument und Fundstelle |

Für die aktuelle Demo-Version ist ausschließlich eine ausdrückliche Bestätigung zulässig. Eine Extraktionskonfidenz darf die Prüfung unterstützen oder priorisieren, bewirkt aber unabhängig von ihrer Höhe keine automatische Freigabe für Analyse. Ob eine spätere automatische Freigabe aufgrund einer Konfidenzschwelle zulässig sein kann, bleibt einem späteren fachlichen und regulatorischen Review vorbehalten.

## 5. Daten- und Provenienzmodell

### 5.1 Patient

Ein Patient besitzt mindestens:

- stabile UUID;
- eindeutige Demo-Zuordnung;
- Anzeigename;
- Geburtsdatum;
- Geschlecht beziehungsweise Referenzkontext;
- optionale externe Kennung;
- Erstellungs- und Änderungszeitpunkte;
- Archivstatus und gegebenenfalls Archivierungszeitpunkt.

Größe und Gewicht werden optional und zeitbezogen vorgesehen. Jeder solche Eintrag benötigt Zeitpunkt, Originalwert, Originaleinheit, Provenienz und Verifizierungsstatus. Größe oder Gewicht dürfen nur für eine ausdrücklich definierte, versionierte Berechnung verwendet werden. Blutdruck und andere Vitalparameter gehören nicht zu Stage 3.

### 5.2 Fixture-Freigabe und Seed

Das Datenmodell muss ein versioniertes Fixture-Freigabemanifest und einen Seed-Nachweis abbilden. Erforderlich sind mindestens:

- Fixture-ID und Fixture-Version;
- eindeutige Demo-Kennung;
- Prüfsumme jedes Quellartefakts;
- Freigabestatus und Freigabequelle;
- Seed-Version;
- beim Seed verwendete Fixture-Versionen und Prüfsummen;
- Zeitpunkt und Ergebnis des Seed-Laufs.

Die zulässigen Werte des Freigabestatus und die Freigabeverantwortung sind noch festzulegen.

### 5.3 Laborbericht und Originaldokument

Ein Laborbericht besitzt mindestens:

- stabile UUID;
- Patienten-UUID oder ausschließlich während eines noch nicht bestätigten Imports einen temporären unzugeordneten Zustand;
- Probenentnahmezeitpunkt;
- Laboreingangszeitpunkt, sofern geliefert;
- Berichts-/Freigabezeitpunkt, sofern geliefert;
- Revisionsnummer, sofern geliefert;
- Laborbezeichnung;
- Quelltyp und ursprünglichen Dateinamen;
- Verweis auf das unveränderliche Originaldokument;
- Fixture-ID, Fixture-Version, Demo-Kennung und geprüfte Prüfsumme;
- extrahierte Identität;
- Status des Identitätsabgleichs und manuelle Bestätigung;
- Importzeitpunkt;
- stabile Berichtsversion und Provenienz.

Das Originaldokument wird unverändert gespeichert. Inhalt, Prüfsumme und ursprüngliche Metadaten werden nicht überschrieben. Ein erneuter Parserlauf erzeugt eine neue Extraktionsversion, keine Änderung am Original.

### 5.4 Laborwert mit drei getrennten Ebenen

Jeder Laborwert besitzt eine stabile Ergebnis-ID und drei logisch getrennte Ebenen:

1. **Originalquelle**
   - exakte Originalbezeichnung;
   - exakter Originalwert beziehungsweise Originaltext;
   - Originaleinheit;
   - Originalreferenzbereich oder Originalregel;
   - originales Laborflag;
   - geliefertes Material und Methode, soweit vorhanden;
   - Dokument, Bericht, Seite oder Zeile;
   - möglichst Fundstelle, Koordinaten oder unveränderter Textausschnitt.
2. **Automatische Extraktion**
   - extrahierte strukturierte Felder;
   - Parser-ID und Parser-Version;
   - Extraktionszeitpunkt;
   - Konfidenz oder expliziter Unsicherheitsstatus je Feld;
   - erkannte Kandidaten und Mehrdeutigkeiten;
   - Verweis auf die Originalquelle.
3. **Verifizierter Arbeitswert**
   - für Verarbeitung ausgewählte strukturierte Felder;
   - expliziter Bestätigungsstatus, getrennt von der Extraktionskonfidenz;
   - kanonische Parameter-ID, sofern eindeutig zugeordnet;
   - normalisierte Einheit, sofern eindeutig und regelbasiert;
   - Vergleichseignung mit erklärtem Grund;
   - Verweise auf angewendete Mapping-, Normalisierungs- und Umrechnungsregeln.

Alle automatisch extrahierten Felder dürfen manuell korrigiert werden. Jede Korrektur wird append-only mit mindestens folgenden Angaben protokolliert:

- Korrektur-ID;
- betroffenes Ergebnis und Feld;
- alter Wert;
- neuer Wert;
- Zeitpunkt;
- optionaler Grund.

Eine Korrektur verändert weder Originaldokument noch Originalwert. Frühere Extraktions- und Arbeitswertversionen bleiben nachvollziehbar. Diese Korrekturhistorie ist eine fachliche Provenienzanforderung und darf nicht als regulatorisch vollständiges Audit-Log bezeichnet werden.

### 5.5 Zulässige Analysegrundlage

In der aktuellen Demo-Version darf Analyse ausschließlich ausdrücklich bestätigte Arbeitswerte verwenden. Eine hohe Extraktionskonfidenz ersetzt diese Bestätigung nicht. Unbestätigte, mehrdeutige oder nicht sicher normalisierte Werte bleiben sichtbar und überprüfbar, werden aber von betroffenen Vergleichen und Analysen ausgeschlossen.

Jede Analyseausgabe referenziert:

- die verwendeten Arbeitswert-IDs und deren Versionen;
- die zugehörigen Extraktionen;
- Bericht, Originaldokument und Fundstellen;
- alle angewendeten Regel-IDs und Regelversionen;
- die Version der Analyse-Engine;
- den Erzeugungszeitpunkt.

Abgeleitete Ergebnisse dürfen reproduzierbar neu berechnet werden. Werden sie gespeichert, dürfen sie nicht von ihren Eingaben oder Regelversionen getrennt werden.

### 5.6 Integrität

- Fremdschlüssel verhindern verwaiste Berichte, Ergebnisse, Korrekturen, Profilbezüge und Analyseausgaben.
- Persistenz eines bestätigten Imports erfolgt transaktional.
- Rohquellen und Originalfelder sind nach der Aufnahme unveränderlich.
- Eine Änderung der Patientenzuordnung ist kein gewöhnliches Feld-Update und darf nie still erfolgen.
- Nur noch nicht bestätigte Importe dürfen temporär unzugeordnet existieren.
- Strukturierte Fehlerkategorien unterscheiden mindestens Validierung, Nicht gefunden, Mehrdeutigkeit, Nicht vergleichbar, Nicht bestätigt, Fixture nicht freigegeben, Prüfsummenfehler und Persistenzfehler. Die endgültige Fehler-Taxonomie ist vor Implementierung des jeweiligen Moduls festzulegen.

## 6. Regel- und Versionsmodell

Jede Regel für Klassifikation, Normalisierung, Umrechnung, Vergleichsentscheidung, medizinisch bewertete Richtung oder Dashboard-Priorisierung besitzt mindestens:

- stabile Regel-ID;
- Version;
- eindeutige Beschreibung;
- Quelle;
- Änderungsdatum;
- Status.

Zusätzlich muss maschinenlesbar erkennbar sein:

- für welchen Parameter, Kontext oder Regeltyp die Regel gilt;
- welche Eingaben sie benötigt;
- welches Ergebnis oder welcher Ausschlussgrund entstehen kann;
- welche ältere Regelversion sie gegebenenfalls ersetzt;
- durch welche Tests ihre deterministische Umsetzung abgesichert ist.

Regelversionen werden nicht still überschrieben. Eine Änderung erzeugt eine neue Version; bestehende Analyseausgaben behalten den Verweis auf die tatsächlich verwendete Version. Der Status bestimmt, ob eine Regel für Demo-Analysen verwendet werden darf. Das verbindliche Statusvokabular ist noch festzulegen.

Jede Analyseausgabe enthält neben dem Ergebnis eine Erklärung mit:

- angewendeter Regel-ID und Version;
- verwendeten Quelldaten und Provenienzverweisen;
- relevanten Zwischenschritten oder Ausschlussgründen;
- Engine-Version;
- eindeutiger, nicht diagnostischer Beschreibung.

Gleiche bestätigte Eingangsdaten, gleiche Regelversionen und gleiche Engine-Version müssen dieselbe fachliche Ausgabe ergeben. Locale, Systemzeit, UI-Zustand oder Reihenfolge einer Datenbankabfrage dürfen das Ergebnis nicht unbemerkt verändern.

Es gibt keine versteckten Gewichtungen, impliziten Standardkonversionen oder Blackbox-Priorisierung. Medizinisch relevante Tabellen werden nicht im Code improvisiert, sondern als versionierte kuratierte Daten eingebunden.

## 7. Laborparameter und Einheiten

### 7.1 Parameteridentität

Jeder Laborparameter besitzt:

- stabile interne Parameter-ID;
- kanonische Anzeige;
- erhaltene Originalbezeichnungen;
- explizite Aliasnamen;
- optionale, kuratierte externe Codes;
- Material- und Methodenkontext, soweit für Identität oder Vergleichbarkeit erforderlich;
- Version und Provenienz der Zuordnung.

LOINC ist die bevorzugte Orientierung für externe Parametercodes. LOINC darf nicht ungeprüft vollständig übernommen oder allein aufgrund ähnlicher Bezeichnungen automatisch zugeordnet werden. Jede verwendete Zuordnung benötigt fachliche Prüfung, Quelle, Version und Tests.

Unbekannte oder mehrdeutige Parameter bleiben unter ihrer Originalbezeichnung erhalten. Ohne eindeutige Zuordnung erfolgt kein stiller Vergleich und keine Profilmitgliedschaft.

### 7.2 Einheiten und Umrechnungen

Einheiten werden eindeutig und versioniert normalisiert, vorzugsweise UCUM-orientiert. Dabei gelten:

- Originalwert, Originaleinheit und Originalreferenzbereich bleiben unverändert erhalten;
- eine normalisierte Einheit ist eine zusätzliche Arbeitswert-Ebene;
- Umrechnungen erfolgen nur durch explizite, versionierte, getestete und parameterbezogene Regeln;
- es gibt keine globale Umrechnung allein aufgrund ähnlich aussehender Einheitensymbole;
- Umrechnungsregel und verwendete Faktoren werden in der Ausgabe referenziert;
- bei nicht sicher vergleichbaren Einheiten, Materialien oder Methoden erfolgt kein Vergleich.

Dieses Dokument legt keine Konversionsfaktoren fest.

### 7.3 Referenzkontext

Für den Referenzkontext gilt:

- maßgeblich ist zunächst der vom jeweiligen Bericht gelieferte Referenzbereich oder die gelieferte Referenzregel;
- Alter wird zum Zeitpunkt der Probenentnahme berechnet und nur durch eine ausdrücklich kuratierte Regel berücksichtigt;
- Geschlecht beziehungsweise Referenzkontext wird nur durch eine ausdrücklich kuratierte Regel berücksichtigt;
- situationsabhängige Regeln dürfen nur mit eindeutig vorhandenen und bestätigten Eingaben angewendet werden;
- Größe und Gewicht sind optional, zeitbezogen und nur für ausdrücklich definierte Berechnungen zulässig;
- fehlender Kontext wird nicht ergänzt oder geschätzt.

Blutdruck und andere Vitalparameter werden in Stage 3 weder modelliert noch analysiert.

## 8. Vergleichs- und Trendregeln

### 8.1 Getrennte Dimensionen

Referenzstatus, mathematische Veränderung und medizinisch bewertete Richtung sind getrennte Dimensionen:

| Dimension | Zulässige Zustände | Bedeutung |
| --- | --- | --- |
| Referenzstatus | unterhalb, innerhalb, oberhalb, nicht bewertbar | Einordnung ausschließlich gegenüber dem gelieferten Referenzbereich beziehungsweise der gelieferten Regel |
| Mathematische Veränderung | höher, niedriger, stabil, kein Vergleich | Numerische Gegenüberstellung vergleichbarer Werte ohne automatische medizinische Wertung |
| Medizinisch bewertete Richtung | günstiger, ungünstiger, unbestimmt | Nur bei anwendbarer fachlich kuratierter Regel |

Qualitative oder mehrdeutige Ergebnisse sind keine zusätzlichen Referenzstatuswerte. Sie führen, soweit kein kuratiertes Bewertungsverfahren vorliegt, zum Referenzstatus „nicht bewertbar“ und behalten einen getrennten Datenqualitäts- beziehungsweise Begründungsstatus.

„Außerhalb des Referenzbereichs“ wird niemals mit „krank“ gleichgesetzt. Innerhalb des Referenzbereichs wird niemals automatisch mit gesund, unauffällig oder medizinisch irrelevant gleichgesetzt.

### 8.2 Auswahl des Vergleichswerts

Verglichen wird nur mit dem unmittelbar vorhergehenden vergleichbaren Ergebnis. Vergleichbarkeit setzt mindestens voraus:

- eindeutige kanonische Parameteridentität;
- kompatible beziehungsweise ausdrücklich regelbasiert normalisierte Einheit;
- kompatibles Material und kompatible Methode, soweit relevant;
- ausdrücklich bestätigte Arbeitswerte;
- eindeutige Berichtschronologie;
- nicht ausgeschlossene Vergleichseignung.

Ein geänderter Referenzbereich verhindert nicht automatisch jede mathematische Gegenüberstellung, wird aber immer sichtbar als Warnung und in der Erklärung ausgewiesen. Statusübergänge beziehen sich jeweils auf den Referenzbereich des zugehörigen Berichts.

### 8.3 Differenzen und Stabilität

- Die absolute Differenz wird immer angezeigt, sofern die Werte vergleichbar sind.
- Es gibt keinen universellen Prozent-Grenzwert für Stabilität oder Auffälligkeit.
- Stabilität und auffällige Veränderung verwenden ausschließlich parameterspezifische, versionierte Schwellen oder validierte Reference Change Values.
- Fehlt eine validierte Schwelle, wird nur die mathematische Änderung gezeigt, ohne medizinische Relevanzbewertung.
- Eine Prozentänderung bei null oder sehr kleinen Vorwerten wird nur angezeigt, wenn eine parameterspezifische Mindestgröße definiert ist.
- Fehlt diese Mindestgröße oder ist sie nicht erfüllt, lautet die Ausgabe: „relative Veränderung nicht sinnvoll berechenbar“.
- Prozentänderung allein darf weder medizinische Bedeutung noch Dashboard-Priorität auslösen.
- Rechenpräzision, Rundung und die technische Behandlung exakter Gleichheit müssen vor Implementierung verbindlich festgelegt und versioniert werden.

### 8.4 Kurz- und Langzeittrend

Kurzfristig sind höher, niedriger, stabil oder kein Vergleich zulässig. Ein langfristiger Trend benötigt mindestens drei vergleichbare Punkte und kann wiederholt steigend, wiederholt fallend, weitgehend stabil, variabel oder wegen unzureichender Daten nicht bestimmbar sein.

Eine Stabilitäts- oder Richtungsbewertung darf nur die für den Parameter freigegebene Regel verwenden. Ohne geeignete Regel bleiben die mathematischen Einzeländerungen sichtbar; eine medizinische Trendbedeutung wird nicht abgeleitet.

Es gibt keine Vorhersage und keine Extrapolation. Jeder Trend nennt die verwendeten Punkte, Ausschlüsse, Regelversionen und Quelldaten.

## 9. Profile und Priorisierung

### 9.1 Laborprofile

- Profile sind organisatorische Ansichten und Gruppierungen, keine Diagnosen.
- Parameter dürfen mehreren Profilen angehören.
- Profilmitgliedschaften sind statisch, versioniert und unabhängig vom aktuellen Messwert.
- Jede Mitgliedschaft besitzt Profil-ID, Parameter-ID, Rolle (`core`, `supporting` oder `context`), Anzeigeordnung, Version und Provenienz.
- Ein fehlendes Profilmitglied wird ausschließlich als nicht vorhanden dargestellt, niemals als erforderlich oder empfohlen.
- Richtungsabhängige Bedeutung ist keine Eigenschaft der Profilmitgliedschaft. Sie darf nur als separate fachlich kuratierte Regel existieren.
- Nicht kuratierte oder nicht freigegebene Profile und Mitgliedschaften werden nicht für Analyse oder Priorisierung verwendet.

Die initialen Profilnamen aus `docs/04_LABORATORY_PROFILES.md` sind der bestehende Vorschlag für die fachliche Kuration, aber noch kein freigegebener Katalog. Profilnamen, Parameterzuordnungen, Rollen und Anzeigeordnungen bleiben medizinische Reviewpunkte und werden in diesem Dokument nicht erfunden.

### 9.2 Dashboard-Priorisierung

Das Dashboard priorisiert aktuelle Berichte. Die Definition der Aktualitätsgruppen ist versioniert festzulegen. Innerhalb derselben Aktualitätsgruppe gilt verbindlich folgende Reihenfolge:

1. vom Labor als kritisch markierte Werte;
2. Werte außerhalb des gelieferten Referenzbereichs;
3. Übergang von innerhalb nach außerhalb;
4. weitere Verschlechterung außerhalb;
5. auffällige Veränderung innerhalb des Referenzbereichs;
6. Verbesserung, aber weiterhin außerhalb;
7. übrige Fälle.

Dabei gelten zusätzlich:

- Ein kritisches Laborflag wird ausschließlich aus dem Originalbericht übernommen und nicht von LabDelta erzeugt.
- „Verschlechterung“, „Verbesserung“ und „auffällige Veränderung“ dürfen nur verwendet werden, wenn eine passende fachlich kuratierte Regel vorliegt.
- Fehlt diese Regel, löst der Fall die davon abhängige Kategorie nicht aus; die mathematische Änderung bleibt sichtbar.
- Prozentänderung allein löst keine Priorisierung aus.
- Jede Priorisierung nennt Aktualitätsgruppe, Prioritätskategorie, verwendete Werte und angewendete Regelversionen.
- Es gibt keine versteckte Gewichtung und keinen diagnostischen Risiko- oder Krankheitsscore.
- Jede Laborwertzeile erscheint einmal und zeigt alle zutreffenden Profil-Tags. Fälle dürfen für mehrere Parameter aufgeklappt werden.
- Dashboard-Schweregrade und verbleibende Gleichstandsregeln sind medizinisch beziehungsweise fachlich zu kuratieren.

Zusätzlich zum aktuellen Dashboard gibt es eine zweite Ansicht **„Offene Auffälligkeiten“**, damit ältere relevante Fälle nicht durch neuere Berichte verschwinden. Die Kriterien für offen, erledigt und die Reihenfolge innerhalb dieser Ansicht müssen versioniert festgelegt werden.

## 10. Löschung und Chronologie

### 10.1 Patientenarchivierung und endgültige Löschung

Es gibt zwei getrennte Aktionen:

1. **Archivieren:** Patient und sämtliche zugehörigen Daten bleiben erhalten. Der Archivstatus wird explizit gespeichert; Sichtbarkeit, Filterung und eine mögliche Reaktivierung bleiben festzulegen.
2. **Endgültig löschen:** Nach doppelter Bestätigung werden Patient und alle zugehörigen strukturierten Daten, Quelldokumente, Extraktionen, Arbeitswerte, Korrekturen, patientenbezogenen Profilableitungen, Importzustände und gespeicherten Analyseausgaben vollständig gelöscht. Gemeinsam genutzte versionierte Parameter-, Profil- und Regelkataloge bleiben erhalten.

Die endgültige Löschung erfolgt transaktional. Entweder werden alle zugehörigen Daten gelöscht oder keine. Es entstehen keine verwaisten medizinischen Berichte, Ergebnisse, Dokumente, Korrekturen oder Analyseausgaben.

Nur noch nicht bestätigte Importe dürfen vorübergehend unzugeordnet existieren. Bestätigte Berichte besitzen immer genau eine gültige Patientenzuordnung. Das Verhalten eines späteren Demo-Seeds nach einer endgültigen Löschung sowie Wortlaut und Mechanik der doppelten Bestätigung sind noch festzulegen.

### 10.2 Berichtschronologie

Die deterministische Reihenfolge verwendet nacheinander:

1. Probenentnahmezeitpunkt;
2. Laboreingangszeitpunkt;
3. Berichts-/Freigabezeitpunkt;
4. Revisionsnummer;
5. Importzeitpunkt;
6. stabile ID.

Jeder Zeitpunkt bewahrt die tatsächlich gelieferte Präzision und Zeitzoneninformation. Fehlende Uhrzeiten, Zeitzonen oder Zeitpunkte werden nicht erfunden. Die genaue technische Sortierregel für fehlende Felder ist noch festzulegen.

Wenn die medizinische Reihenfolge mehrerer Ergebnisse desselben Tages anhand der gelieferten Daten unklar bleibt, wird keine medizinische Reihenfolge erfunden. Importzeitpunkt und stabile ID dürfen eine reproduzierbare technische Anzeigeordnung herstellen, aber nicht als medizinische Chronologie oder als Grundlage eines irreführenden Vorher-/Nachher-Vergleichs ausgegeben werden. Die Mehrdeutigkeit bleibt sichtbar und kann den Vergleich ausschließen.

Das Alter wird aus Geburtsdatum und Probenentnahmezeitpunkt bestimmt. Fehlt ein hinreichend genauer Probenentnahmezeitpunkt, darf kein genaueres Alter oder altersabhängiger Referenzkontext angenommen werden.

## 11. Stage-Grenzen

### Stage 1 — Anwendungshülle

Die Tauri-/React-Anwendungshülle und die statischen synthetischen Mockup-Ansichten sind umgesetzt. Statische Anzeigen sind keine validierte Analyseausgabe und dürfen nicht als Regelquelle verwendet werden.

### Stage 2 — Lokale Patientenverwaltung

Lokale SQLite-Patientenverwaltung ist umgesetzt. Vor weiterer fachlicher Datenmodellierung muss sie an den verbindlichen Demo-Modus sowie die getrennten Aktionen Archivieren und endgültig Löschen angepasst werden. Eine einfache Einzelbestätigung für endgültige Löschung erfüllt diese Grundlage nicht.

### Stage 3 — Datenfundament und anschließend regelgebundene Analyse

Stage 3 beginnt zwingend mit drei sequenziellen, jeweils kontrollierbaren Teilpaketen:

1. **Gate 3.0A — Persistenzgrundlage**
   - geordnete Migrationen;
   - vollständige persistente Grundentitäten für Patienten, zeitbezogene Größe/Gewicht, Laborberichte und Laborwerte;
   - getrennte Ebenen für Originalquelle, automatische Extraktion und Arbeitswert mit explizitem Bestätigungsstatus;
   - Originaldaten, Korrekturhistorie und Provenienz;
   - stabile IDs, Fremdschlüssel, Transaktionen, Archivierung, endgültige Löschung und Berichtschronologie.
2. **Gate 3.0B — Demogrundlage**
   - Fixture-Freigabemanifest mit Demo-Kennung und Prüfsummen;
   - reproduzierbare JSON-, CSV- und Text-PDF-Fixtures;
   - versionierter, deterministischer und idempotenter Demo-Seed;
   - klare Trennung zwischen Demo-Seed, späterem kontrolliertem Demo-Fixture-Import und einem nicht implementierten Realimportpfad;
   - Erststart-Disclaimer und dauerhafte Demo-Kennzeichnung;
   - ausdrückliche Bestätigung als einzige Analysefreigabe für Arbeitswerte der aktuellen Demo-Version.
3. **Gate 3.0C — Kataloggrundlage**
   - persistente Strukturen für Parameter, Originalbezeichnungen, Aliase und externe Codes;
   - Einheiten- und Konversionsregelmetadaten ohne erfundene Faktoren;
   - Profile und statische, versionierte Mitgliedschaften ohne erfundene Zuordnungen;
   - allgemeines Regel- und Versionsmodell mit stabiler ID, Version, Beschreibung, Quelle, Änderungsdatum und Status;
   - strukturierte Fehler- und Provenienzverträge für spätere Analyseausgaben.

Gate 3.0 ist erst abgeschlossen, wenn Gate 3.0A, 3.0B und 3.0C jeweils abgenommen wurden. Keines der drei Teilpakete implementiert medizinische Analyse oder Priorisierung. Danach darf ein Analysemodul nur für solche Klassifikationen, Normalisierungen, Umrechnungen, Vergleichsentscheidungen, Trends und Priorisierungen umgesetzt werden, deren betroffene Regeln eindeutig festgelegt, kuratiert, versioniert und testbar sind. Nicht freigegebene Regeln führen zu explizit nicht bewertbaren oder nicht vergleichbaren Zuständen, nicht zu Standardannahmen.

### Stage 4 — Kontrollierter Demo-Fixture-Import

Stage 4 implementiert ausschließlich den kontrollierten Import mitgelieferter oder vom Projekt freigegebener Demo-Fixtures. Enthalten sind Fixture-Prüfung, Hash-/Duplikatprüfung, Parser, Identitätsabgleich, Review, Korrekturen, Bestätigung und transaktionale Persistenz für synthetische Daten.

Stage 4 implementiert keinen allgemeinen Import realer Patientenberichte. Ein späterer realer Importpfad liegt außerhalb des aktuellen Entwicklungsplans und benötigt ein separates fachliches und regulatorisches Review.

### Stage 5 — Erklärbare Demo-Fertigstellung

Stage 5 implementiert:

- Originaldokument-Viewer mit Provenienzverknüpfung;
- Charts aus bestätigten, vergleichbaren Demo-Werten;
- kontinuierliche Integration;
- finale Dokumentation und Contest-Paket;
- plattformübergreifenden finalen Demo-Build und Smoke-Tests.

Stage 5 erweitert den Demo-Modus nicht auf reale Daten.

## 12. Medizinisch zu kuratierende Tabellen

Die folgenden Tabellen sind verbindliche Abhängigkeiten, aber inhaltlich noch offen. Sie dürfen weder aus den Stage-1-Mockups noch aus allgemeinen Annahmen abgeleitet werden. Jeder Eintrag benötigt die Regelmetadaten aus Abschnitt 6.

| Tabelle | Zu kuratierender Inhalt | Darf vor Freigabe nicht bewirken |
| --- | --- | --- |
| Parameterspezifische Stabilitätsschwellen / Reference Change Values | Parameter, Kontext, Schwelle oder RCV, Einheit, Mindestvorwert, Quelle und Gültigkeit | Stabilitäts-, Auffälligkeits- oder Trendbewertung |
| Parameterkatalog | Stabile interne ID, kanonische Anzeige, Material, Methode und Kontext | automatische kanonische Zuordnung |
| Alias- und LOINC-Zuordnungen | Originalalias, interne Parameter-ID, geprüfter LOINC-Bezug, Quelle und Version | ungeprüftes Mapping oder Vergleich |
| Einheitentabelle und Konversionen | Originaleinheit, normalisierte Einheit, Parameterbezug, explizite Formel/Faktor, Gültigkeitsbedingungen und Quelle | stille Normalisierung oder Umrechnung |
| Profilkatalog und Mitgliedschaften | Profil-ID, Name, Beschreibung, Parameter-ID, Rolle, Anzeigeordnung, Version und Provenienz | Profilaggregation oder fehlende-Werte-Aussage |
| Richtungsabhängige Bedeutung | Parameter, Kontext und Regel für günstiger, ungünstiger oder unbestimmt | medizinische Wertung einer mathematischen Änderung |
| Dashboard-Schweregrade | Kriterien, Prioritätsbezug, Erklärung und Gleichstandsregeln | Schweregrad, Gewichtung oder farbliche medizinische Wertung |
| Alters-, geschlechts- und situationsabhängige Referenzregeln | Kontextbedingungen, Zeitbezug, gelieferte beziehungsweise kuratierte Regel und Quelle | kontextabhängige Klassifikation |

Solange ein erforderlicher Eintrag fehlt oder nicht freigegeben ist, bleibt die betroffene Ausgabe mathematisch, nicht bewertbar oder nicht vergleichbar. Es werden keine medizinischen Grenzwerte, Konversionsfaktoren oder Profilzuordnungen aus diesem Dokument abgeleitet.

## 13. Abnahmekriterien für Gate 3.0

Die Teilpakete werden sequenziell in der Reihenfolge 3.0A, 3.0B und 3.0C umgesetzt und jeweils separat abgenommen. Gate 3.0 ist erst abgeschlossen, wenn alle drei Teilpakete und die gemeinsamen Abschlussbedingungen erfüllt sind.

### Gate 3.0A — Persistenzgrundlage

1. **Geordnete Migrationen:** Eine neue Datenbank erreicht reproduzierbar das aktuelle Schema; eine bestehende Version-1-Datenbank migriert ohne Verlust oder Änderung bestehender Patienten-IDs.
2. **Persistente Grundentitäten:** Patienten, zeitbezogene optionale Größen-/Gewichtsangaben, Berichte, Originaldokumente, Originalwert-Ebenen, Extraktionsversionen, Arbeitswerte und Korrekturen sind modelliert.
3. **Stabile IDs und Beziehungen:** Alle fachlichen Entitäten besitzen stabile IDs; Fremdschlüssel und Transaktionen verhindern verwaiste Datensätze.
4. **Unveränderliche Originale:** Tests belegen, dass Originaldokumente und Originalfelder nicht überschrieben werden können und Korrekturen ausschließlich neue protokollierte Zustände erzeugen.
5. **Drei Ebenen pro Wert:** Originalquelle, automatische Extraktion und ausdrücklich bestätigbarer Arbeitswert sind getrennt gespeichert und vollständig miteinander verknüpft.
6. **Provenienz:** Jeder Arbeitswert verweist auf Bericht, Dokument, Seite oder Zeile und möglichst Fundstelle/Textausschnitt; spätere Analyseverträge können Eingabe- und Regelreferenzen tragen.
7. **Archivierung und Löschung:** Archivierung erhält sämtliche Daten; endgültige Löschung benötigt doppelte Bestätigung und entfernt transaktional alle abhängigen Daten ohne Waisen. Gemeinsam genutzte Katalogdaten bleiben erhalten.
8. **Chronologie:** Alle sechs Ordnungsmerkmale sind modelliert. Tests decken fehlende Zeitangaben, Revisionen, gleiche Tage und die Trennung zwischen technischer Anzeigeordnung und medizinischer Reihenfolge ab.
9. **Persistenz- und Fehlerverträge:** Validierung, Nicht gefunden, Mehrdeutigkeit, Bestätigungsstatus und Persistenzfehler sind strukturiert. Tests decken Erstellen, Wiederöffnen, Migration, Transaktionsrollback, Korrekturhistorie und Löschungskaskade ab.
10. **Frontend-Verträge:** UI-Vertragstests decken Lade-/Leer-/Fehlerzustände, Archivierung und doppelte Löschbestätigung ab.

### Gate 3.0B — Demogrundlage

1. **Demo-Fixture-Schutz:** Fixture-ID, Demo-Kennung und Prüfsumme werden gegen ein versioniertes Freigabemanifest geprüft. Nicht freigegebene oder veränderte Dateien werden fail-closed abgewiesen; Fixture-Freigabe- und Prüfsummenfehler sind strukturierte Fehlerzustände.
2. **Reproduzierbarer Seed:** Der Erststart-Seed ist versioniert, deterministisch und idempotent; wiederholtes Ausführen erzeugt keine Duplikate. Seed-Versionen und verwendete Fixture-Prüfsummen werden nachgewiesen.
3. **Architektonische Trennung:** Demo-Seed und kontrollierter Demo-Fixture-Import besitzen getrennte Verträge. Ein möglicher späterer Realimport benötigt eine weitere, eigenständige Architekturgrenze; Gate 3.0B implementiert keinen realen Importpfad und keinen lediglich deaktivierten Realimportcode.
4. **Disclaimer:** Der vorgeschaltete Erststarthinweis und die dauerhafte Kennzeichnung „Demo – ausschließlich synthetische Testdaten“ sind vorhanden. Sie stellen klar, dass synthetische Originaldokumente nur für die Demonstration gegenüber abgeleiteten Demo-Anzeigen maßgeblich sind und kein reales klinisches Nutzungsszenario dargestellt wird.
5. **Kanonische Fixtures:** JSON, CSV und auswählbarer Text-PDF werden aus einer gemeinsamen synthetischen Quelle reproduzierbar erzeugt. Erwartungsdaten prüfen Struktur, Provenienz und Persistenz; Analyseerwartungen werden erst für freigegebene Regeln ergänzt.
6. **Keine echten Daten:** Tests belegen die Ablehnung nicht freigegebener Quellen; Test- und Review-Prozesse verwenden ausschließlich synthetische Fixtures.
7. **Nur ausdrückliche Bestätigung:** Für die aktuelle Demo-Version ist ausschließlich ein ausdrücklich bestätigter Arbeitswert für spätere Analyse zugelassen. Tests belegen, dass auch eine hohe Extraktionskonfidenz keine automatische Freigabe erzeugt.
8. **Demo-UI-Verträge:** UI-Tests decken Erststart-Disclaimer, dauerhafte Demo-Kennzeichnung und die eindeutige synthetische Zweckbestimmung ab.
9. **Demo-Persistenztests:** Tests decken Freigabemanifest, Prüfsummenfehler, Seed-Idempotenz und die Trennung der Demo-Pfade ab.

### Gate 3.0C — Kataloggrundlage

1. **Parameterstrukturen:** Stabile interne Parameter-IDs, kanonische Anzeigen, Originalbezeichnungen, Aliase, optionale externe Codes sowie Material- und Methodenkontext sind versionierbar modelliert.
2. **Einheitenstrukturen:** Originaleinheiten, normalisierte Einheiten und parameterbezogene Konversionsregelmetadaten sind modelliert, ohne Konversionsfaktoren oder Vergleichbarkeit zu erfinden.
3. **Profilstrukturen:** Profile und statische, versionierte Mitgliedschaften mit Rollen und Anzeigeordnung sind modelliert, ohne ungeprüfte Profilzuordnungen zu hinterlegen.
4. **Regelmetadaten:** Jede spätere Regel kann stabile ID, Version, Beschreibung, Quelle, Änderungsdatum, Status, Geltungsbereich und Testbezug tragen.
5. **Analyseverträge:** Fehlerzustände für nicht bestätigte, nicht bewertbare und nicht vergleichbare Daten sowie Provenienzverweise auf Eingaben und Regelversionen sind strukturiert, ohne Analyse zu implementieren.
6. **Keine Platzhalterkuration:** Medizinisch zu kuratierende Tabellen bleiben bis zu ihrer Freigabe leer beziehungsweise ausdrücklich nicht freigegeben. Es werden keine Platzhalterwerte, Grenzwerte, Konversionsfaktoren oder Profilzuordnungen angelegt.
7. **Katalogtests:** Migration, Speicherung, Wiederöffnung, Versionierung und Referenzintegrität der Katalog- und Regelmetadaten sind getestet.

### Gemeinsame Abschlussbedingungen

1. **Keine Analyse vor Regelklarheit:** Gate 3.0A, 3.0B und 3.0C enthalten keine fachliche Analyse oder Priorisierung.
2. **Regressions-Gates:** Nach jedem Teilpaket bestehen `cargo fmt --check`, `cargo check`, `cargo test`, `cargo clippy --all-targets -- -D warnings`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, relevante Tauri-Validierung und `git diff --check`.
3. **Kein Scope-Vorgriff:** PDF-Parsing, allgemeiner Endnutzerimport, Analyse, Charts und Originaldokument-Viewer sind nicht Teil von Gate 3.0.

## Abgleich mit den bestehenden Dokumenten

### Gefundene Widersprüche

1. **Zweck und Nutzung:** `00_VISION.md`, `01_PRODUCT_SPECIFICATION.md` und `10_CONTEST_STRATEGY.md` sprechen von einer Hilfe beziehungsweise einem Werkzeug für medizinische Fachpersonen. Verbindlich ist jetzt ein Forschungs- und Demonstrationsprojekt, das nicht für medizinische Nutzung oder Entscheidungen freigegeben ist.
2. **Importumfang:** `01_PRODUCT_SPECIFICATION.md`, `02_UI_SPECIFICATION.md`, `05_IMPORT_WORKFLOW.md`, `07_ARCHITECTURE.md`, `12_CODEX_MASTER_PROMPT.md`, `13_UI_STATE_INVENTORY.md` und `14_DEMO_SCRIPT.md` beschreiben einen allgemeinen CSV-/JSON-/Text-PDF-Import. Verbindlich ist für Stage 4 ausschließlich der kontrollierte Import freigegebener synthetischer Demo-Fixtures.
3. **Open-Source- und Lizenzstatus:** `10_CONTEST_STRATEGY.md` und `14_DEMO_SCRIPT.md` nennen eine geplante Open-Source-Ausrichtung, unterscheiden aber nicht zwischen öffentlicher Einsehbarkeit und lizenzierter Freigabe. Das Repository ist bereits öffentlich; ohne ausgewählte Lizenz ist der Quellcode derzeit dennoch nicht zur Nutzung, Veränderung oder Weiterverbreitung freigegeben.
4. **Referenzstatus:** `06_ANALYSIS_ENGINE.md` führt `qualitative` und `ambiguous` neben `below/within/above/unavailable` als Current-result-Zustände. Verbindlich sind vier Referenzstatuswerte; qualitativ und mehrdeutig sind getrennte Daten-/Begründungszustände und führen ohne kuratierte Regel zu „nicht bewertbar“.
5. **Priorisierung:** `02_UI_SPECIFICATION.md`, `06_ANALYSIS_ENGINE.md` und die Mockups verwenden einen allgemeinen Attention Score beziehungsweise eine Sortierung nach Bedeutung/Relevanz. Verbindlich sind die Prioritätsreihenfolge aus Abschnitt 9, ein Verbot der Priorisierung allein durch Prozentänderung und eine zweite Ansicht für offene Auffälligkeiten.
6. **Stabilität und Trends:** `06_ANALYSIS_ENGINE.md` benennt stabil, steigend und fallend ohne parameterspezifische Schwellenregel. Verbindlich sind parameterspezifische versionierte Schwellen oder validierte RCVs; ohne sie wird keine medizinische Relevanz abgeleitet.
7. **Provenienzmodell:** `03_DATA_MODEL.md` beschreibt einen einzelnen strukturierten LaboratoryResult-Datensatz. Verbindlich sind getrennte Ebenen für Originalquelle, automatische Extraktion und verifizierten Arbeitswert sowie eine append-only Korrekturhistorie.
8. **Patientenlöschung:** `STAGE3_PLAN.md` führt die Löschsemantik als ungelöste Frage; die aktuelle Anwendung löscht nach einer Bestätigung. Verbindlich sind Archivieren sowie endgültiges Löschen nach doppelter Bestätigung und vollständiger transaktionaler Entfernung aller abhängigen Daten.
9. **Berichtschronologie:** `STAGE3_PLAN.md` führt die Reihenfolge gleicher Berichtsdaten als ungelöst. Die sechs Ordnungsmerkmale sind jetzt festgelegt; bei medizinisch unklarer Reihenfolge desselben Tages darf keine Reihenfolge erfunden werden.
10. **Stage-3-Reihenfolge:** `STAGE3_PLAN.md` plant Analysearbeit unmittelbar nach einem Datenfundament. Verbindlich ist zusätzlich, dass kein betroffenes Analysemodul vor eindeutiger Festlegung seiner medizinischen und fachlichen Regeln umgesetzt wird.
11. **Stage-4-Grenze:** `STAGE3_PLAN.md` beschreibt Stage 4 als funktionalen Dateiimport mit allgemeinem Importcharakter. Verbindlich ist ausschließlich der kontrollierte Demo-Fixture-Import.
12. **Mockups:** Beide Mockups enthalten keine dauerhafte Kennzeichnung „Demo – ausschließlich synthetische Testdaten“, zeigen einen allgemeinen Dateiimport und verwenden nicht kuratierte Prioritäts-/Schweregradanzeigen. Außerdem zeigen sie ein Profil „Vitamine & Supplemente“, das nicht im initialen Katalog aus `04_LABORATORY_PROFILES.md` steht.
13. **Korrekturhistorie und Audit-Begriff:** `08_SECURITY_AND_REGULATORY_LIMITS.md` beansprucht kein Audit-Log. Die nun erforderliche Korrekturhistorie ist verbindliche Provenienz, bleibt aber ausdrücklich kein regulatorisch vollständiges Audit-Log.
14. **Aktueller Demo-Datenschutz:** Die vorhandene Patientenverwaltung erlaubt freie Patienteneingaben ohne Fixture-Freigabe oder Demo-Kennung. Das entspricht nicht dem nun verbindlichen geschlossenen Demo-Modus und muss vor einer weiteren Datenverarbeitung begrenzt werden.

### Dokumente, die später angepasst werden müssen

- `00_VISION.md`: Zweck auf reine Forschung/Demonstration und fehlende Freigabe für medizinische Nutzung präzisieren.
- `01_PRODUCT_SPECIFICATION.md`: Demo-only-Betrieb, Fixture-Allowlist, Disclaimer, drei Wertebenen, Archivierung/Löschung und offene Auffälligkeiten aufnehmen.
- `02_UI_SPECIFICATION.md`: dauerhafte Demo-Kennzeichnung, Erststart-Hinweis, verbindliche Prioritätsreihenfolge, zweite Dashboard-Ansicht, Archivierung und doppelte Löschbestätigung ergänzen.
- `03_DATA_MODEL.md`: Provenienzebenen, Korrekturhistorie, Regelmetadaten, Fixture-/Seed-Modell, Chronologie, Archivstatus und zeitbezogene Größe/Gewicht ergänzen.
- `04_LABORATORY_PROFILES.md`: Kuration, Regelmetadaten, statische versionierte Mitgliedschaften und Trennung richtungsabhängiger Regeln präzisieren.
- `05_IMPORT_WORKFLOW.md`: auf freigegebene Demo-Fixtures begrenzen und Seed, Freigabemanifest, Korrekturhistorie sowie Trennung eines späteren Realimports aufnehmen.
- `06_ANALYSIS_ENGINE.md`: getrennte Dimensionen, parameterspezifische Schwellen/RCVs, Prozent-Sonderfall, Regelreferenzen, neue Prioritätsreihenfolge und Chronologie ergänzen.
- `07_ARCHITECTURE.md`: Demo-Seed, Demo-Fixture-Import, Provenienzebenen, Regelregistry und nicht implementierten Realimport klar trennen.
- `08_SECURITY_AND_REGULATORY_LIMITS.md`: fehlende medizinische Nutzungsfreigabe, verpflichtenden Disclaimer und Abgrenzung zwischen Korrekturhistorie und regulatorischem Audit-Log ergänzen.
- `09_TEST_DATA_SPECIFICATION.md`: Fixture-ID, Demo-Kennung, Prüfsummenmanifest, Seed-Reproduzierbarkeit, drei Provenienzebenen und nach Teilpaketen getrennte Gate-3.0-Erwartungsdaten ergänzen.
- `10_CONTEST_STRATEGY.md`: öffentliches Repository, noch fehlende Lizenzfreigabe, Demo-only-Nutzung und fehlende medizinische Freigabe präzisieren.
- `11_ARCHITECTURE_PRINCIPLES.md`: geschlossenen Demo-Modus, Regelmetadaten, drei Provenienzebenen und Verbot nicht kuratierter Analyse ergänzen.
- `12_CODEX_MASTER_PROMPT.md`: aktuellen Projektstand sowie Gate 3.0A/3.0B/3.0C und die neuen Grenzen für Stage 3, Stage 4 und Stage 5 einarbeiten.
- `13_UI_STATE_INVENTORY.md`: Erststart-Disclaimer, dauerhafte Demo-Kennzeichnung, Fixture-Ablehnung, Archivierung, doppelte Löschung und offene Auffälligkeiten ergänzen.
- `14_DEMO_SCRIPT.md`: ausschließlich freigegebene synthetische Fixtures, sichtbare Demo-Kennzeichnung und fehlende medizinische Nutzungsfreigabe ausdrücklich zeigen.
- `STAGE3_PLAN.md`: inzwischen entschiedene Löschung und Chronologie übernehmen, Gate 3.0 in Persistenz-, Demo- und Kataloggrundlage teilen, ausschließlich bestätigte Arbeitswerte vorsehen und Stage 4 auf Demo-Fixtures begrenzen.
- `mockups/dashboard-global-overview.png` und `mockups/patient-detail-and-import.png`: Demo-Kennzeichnung, Disclaimer-Zugang, neue Priorisierung, offene Auffälligkeiten und Demo-Fixture-Import sichtbar machen; nicht autorisierte Profilanzeigen entfernen oder nach Kuration ersetzen.
- `README.md`: öffentliches Repository, fehlende Erlaubnis zur Nutzung/Veränderung/Weiterverbreitung ohne Lizenz, geschlossenen Demo-Modus und fehlende Freigabe für medizinische Nutzung ausweisen.

`CODEX_BUILD_LOG.md` bleibt als historisches Protokoll unverändert. Seine Stage-1-Aussagen sind nicht als aktueller Funktions- oder Validierungsstand zu lesen.

### Offene Entscheidungen

#### Erforderlich vor Gate 3.0

Diese Entscheidungen müssen jeweils vor dem Teilpaket geklärt sein, das sie benötigt:

1. endgültiger Wortlaut, Sprachen und lokale Kenntnisnahme-Logik des Erststart-Disclaimers;
2. Prüfsummenalgorithmus, Format des Fixture-Freigabemanifests, Freigabeverantwortung und Widerrufsprozess;
3. Inhalt der initialen Seed-Menge sowie Update-, Rücksetz- und Wiederherstellungsverhalten späterer Seed-Versionen;
4. verbindliches Regelstatus-Vokabular und formaler Freigabeprozess für Regelversionen;
5. technische numerische Speicherung und verlustfreie Repräsentation von Original- und Arbeitswerten;
6. Statusmodell und Interaktion für die ausdrückliche Bestätigung eines Arbeitswerts; eine automatische Freigabe durch Extraktionskonfidenz ist für die aktuelle Demo ausgeschlossen;
7. technische Sortierung bei fehlenden Zeitfeldern, Datumspräzision, Zeitzonen und Revisionsformaten;
8. genaue Archivierungs-, Reaktivierungs- und Filterinteraktion;
9. Wortlaut und Mechanik der doppelten Löschbestätigung sowie Verhalten des Demo-Seeds nach endgültiger Löschung;
10. standardisierte Fundstellenrepräsentation für PDF-Seiten, CSV-Zeilen, JSON-Pfade, Koordinaten und Textausschnitte;
11. zulässige Speicherwerte und Semantik des Geschlechts-/Referenzkontexts sowie der optionalen zeitbezogenen Größen- und Gewichtsdaten.

#### Erforderlich vor Analyse

1. Rechenpräzision, Rundungsregeln und Behandlung exakter Gleichheit;
2. parameterspezifische Stabilitätsschwellen und validierte Reference Change Values;
3. kuratierter Parameterkatalog einschließlich Material- und Methodenkontext;
4. geprüfte Alias- und LOINC-Zuordnungen;
5. UCUM-orientierte Einheitentabelle und parameterbezogene Konversionsregeln;
6. kuratierter Profilkatalog mit Mitgliedschaften, Rollen und Anzeigeordnung;
7. Regeln für günstiger, ungünstiger und unbestimmt;
8. Dashboard-Schweregrade, Aktualitätsgruppen und Gleichstandsregeln;
9. eindeutige Zuordnung bei überlappenden Dashboard-Kriterien, insbesondere „außerhalb“ gegenüber „Übergang von innerhalb nach außerhalb“;
10. Kriterien für offen und erledigt in der Ansicht „Offene Auffälligkeiten“;
11. alters-, geschlechts- und situationsabhängige Referenzregeln.

#### Erforderlich erst vor späterem Realbetrieb

1. konkrete Open-Source-Lizenz vor der ersten lizenzierten Veröffentlichung; dies ist ein eigenständiges Veröffentlichungs-Gate und wird früher fällig, falls eine lizenzierte Veröffentlichung vor einem Realbetrieb erfolgt;
2. fachliche und regulatorische Entscheidung, ob eine automatische Arbeitswertfreigabe aufgrund einer Konfidenzschwelle jemals zulässig sein kann, und gegebenenfalls deren versionierte Kriterien;
3. fachliche, regulatorische, datenschutzrechtliche und sicherheitstechnische Freigabekriterien für einen späteren Import oder eine Verarbeitung realer Daten.

Keine dieser offenen Entscheidungen darf durch Platzhalterwerte, allgemeine medizinische Annahmen oder aus den Mockups abgeleitete Regeln vorweggenommen werden.
