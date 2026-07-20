#!/usr/bin/env python3
"""Generate deterministic CSV and selectable-text PDF from approved JSON fixtures."""

import csv
import hashlib
import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_DIR = ROOT / "fixtures" / "demo_seed" / "v1"
JSON_NAMES = ("daniel-power.json", "dirk-mayer.json", "eva-mittel.json")
CSV_PATH = FIXTURE_DIR / "approved-demo-reports.csv"
PDF_PATH = FIXTURE_DIR / "approved-demo-reports.pdf"
MANIFEST_PATH = FIXTURE_DIR / "derived-artifacts.json"


def load_fixtures():
    return [json.loads((FIXTURE_DIR / name).read_text(encoding="utf-8")) for name in JSON_NAMES]


def rows(fixtures):
    for fixture in fixtures:
        for report in fixture["reports"]:
            for value in report["values"]:
                yield {
                    "fixture_id": fixture["fixtureId"],
                    "fixture_version": fixture["fixtureVersion"],
                    "demo_marker": fixture["demoMarker"],
                    "patient_name": fixture["patient"]["displayName"],
                    "demo_patient_id": fixture["patient"]["externalIdentifier"],
                    "report_key": report["sourceKey"],
                    "specimen_collected_at": report["specimenCollectedAt"],
                    "laboratory_name": report["laboratoryName"],
                    "parameter": value["originalParameterName"],
                    "original_value": value["originalValue"],
                    "original_unit": value["unit"],
                    "supplied_reference": value["referenceRange"],
                    "confirmation": value["confirmation"],
                    "source_location": value["sourceLocation"]["jsonPath"],
                }


def write_csv(fixtures):
    fieldnames = list(next(iter(rows(fixtures))).keys())
    with CSV_PATH.open("w", encoding="utf-8", newline="") as output:
        writer = csv.DictWriter(output, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows(fixtures))


def write_pdf(fixtures):
    styles = getSampleStyleSheet()
    document = SimpleDocTemplate(
        str(PDF_PATH), pagesize=A4, rightMargin=16 * mm, leftMargin=16 * mm,
        topMargin=15 * mm, bottomMargin=15 * mm, title="LabDelta approved synthetic demo reports",
        author="LabDelta", subject="Synthetic contest fixtures", invariant=1,
    )
    story = [
        Paragraph("LabDelta - Approved Synthetic Demo Reports", styles["Title"]),
        Spacer(1, 4 * mm),
        Paragraph("Demo - exclusively synthetic test data. Research and demonstration project; not clinically validated and not released for medical use.", styles["BodyText"]),
        Spacer(1, 5 * mm),
    ]
    for fixture_index, fixture in enumerate(fixtures):
        if fixture_index:
            story.append(PageBreak())
        patient = fixture["patient"]
        story.extend([
            Paragraph(patient["displayName"], styles["Heading1"]),
            Paragraph(f"Demo ID: {patient['externalIdentifier']} | Date of birth: {patient['dateOfBirth']} | Fixture: {fixture['fixtureId']} v{fixture['fixtureVersion']}", styles["BodyText"]),
            Spacer(1, 4 * mm),
        ])
        for report_index, report in enumerate(fixture["reports"]):
            if report_index:
                story.append(PageBreak())
            data = [["Parameter", "Original value", "Unit", "Supplied reference", "Source location"]]
            for value in report["values"]:
                data.append([
                    value["originalParameterName"], value["originalValue"], value["unit"],
                    value["referenceRange"], value["sourceLocation"]["jsonPath"],
                ])
            table = Table(data, colWidths=[43 * mm, 25 * mm, 27 * mm, 34 * mm, 43 * mm], repeatRows=1)
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#16324F")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#9AA7B2")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F3F6F8")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]))
            story.extend([
                Paragraph(f"Report {report['specimenCollectedAt']}", styles["Heading2"]),
                Paragraph(f"{report['laboratoryName']} | Revision {report['revisionNumber']} | Source key: {report['sourceKey']}", styles["BodyText"]),
                Spacer(1, 2 * mm), table, Spacer(1, 4 * mm),
            ])
    document.build(story)


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_manifest():
    manifest = {
        "manifestVersion": "1",
        "demoMarker": "LABDELTA_SYNTHETIC_DEMO_V1",
        "generatedFrom": list(JSON_NAMES),
        "artifacts": [
            {"path": CSV_PATH.name, "mediaType": "text/csv", "sha256": sha256(CSV_PATH)},
            {"path": PDF_PATH.name, "mediaType": "application/pdf", "sha256": sha256(PDF_PATH)},
        ],
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    fixtures = load_fixtures()
    write_csv(fixtures)
    write_pdf(fixtures)
    write_manifest()
