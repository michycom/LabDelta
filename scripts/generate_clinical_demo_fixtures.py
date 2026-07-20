#!/usr/bin/env python3
"""Generate the three deterministic, fully synthetic contest fixtures."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "fixtures" / "demo_seed" / "v1"
NOTICE = "Fully synthetic fixture. Supplied reference text is demonstration source data, not a medical rule."

SMALL_BLOOD_COUNT = [
    ("leukocytes", "Leukocytes", "G/L", "4.0-10.0"),
    ("erythrocytes", "Erythrocytes", "T/L", "3.9-5.2"),
    ("hemoglobin", "Hemoglobin", "g/dL", "12.0-16.0"),
    ("hematocrit", "Hematocrit", "%", "36-46"),
    ("mcv", "MCV", "fL", "80-96"),
    ("mch", "MCH", "pg", "27-33"),
    ("mchc", "MCHC", "g/dL", "32-36"),
    ("platelets", "Platelets", "G/L", "150-400"),
]


def report(key, date, laboratory, values):
    rows = []
    for index, (source_key, name, value, unit, reference) in enumerate(values):
        rows.append({
            "sourceKey": source_key,
            "originalParameterName": name,
            "originalValue": str(value),
            "unit": unit,
            "referenceRange": reference,
            "confirmation": "explicit",
            "sourceLocation": {
                "jsonPath": f"$.reports[REPORT_INDEX].values[{index}]",
                "textExcerpt": f"{name}: {value} {unit}; supplied synthetic report reference {reference}",
            },
        })
    return {
        "sourceKey": key,
        "laboratoryName": laboratory,
        "specimenCollectedAt": f"{date}T08:00:00Z",
        "laboratoryReceivedAt": f"{date}T09:00:00Z",
        "reportReleasedAt": f"{date}T12:00:00Z",
        "revisionNumber": "1",
        "importedAt": f"{date}T16:00:00Z",
        "values": rows,
    }


def blood(values, references=SMALL_BLOOD_COUNT):
    return [(key, name, value, unit, reference) for (key, name, unit, reference), value in zip(references, values)]


def fixture(fixture_id, patient, body, profiles, reports):
    for report_index, item in enumerate(reports):
        for value in item["values"]:
            value["sourceLocation"]["jsonPath"] = value["sourceLocation"]["jsonPath"].replace("REPORT_INDEX", str(report_index))
    return {
        "schemaVersion": "2",
        "fixtureId": fixture_id,
        "fixtureVersion": "2",
        "demoMarker": "LABDELTA_SYNTHETIC_DEMO_V1",
        "sourceNotice": NOTICE,
        "patient": patient,
        "bodyMeasurements": body,
        "profileIds": profiles,
        "reports": reports,
    }


def main():
    eva = fixture(
        "labdelta-demo-eva-mittel",
        {"sourceKey": "patient-eva-mittel", "displayName": "Eva Mittel", "dateOfBirth": "2001-03-12", "sexReferenceContext": "female", "externalIdentifier": "DEMO-EVA"},
        [
            {"sourceKey": "height", "kind": "height", "measuredAt": "2026-01-15T08:00:00Z", "originalValue": "160", "originalUnit": "cm", "verification": "explicit"},
            {"sourceKey": "weight", "kind": "weight", "measuredAt": "2026-01-15T08:00:00Z", "originalValue": "45", "originalUnit": "kg", "verification": "explicit"},
        ],
        ["small-blood-count", "general-health"],
        [
            report("eva-report-2026-01-15", "2026-01-15", "LabDelta Synthetic Laboratory Central", blood(["6.2", "4.55", "13.6", "41.0", "90", "29.9", "33.2", "245"]) + [
                ("height", "Height", "160", "cm", "Not supplied"),
                ("weight", "Weight", "45", "kg", "Not supplied"),
            ]),
            report("eva-report-2026-06-15", "2026-06-15", "LabDelta Synthetic Laboratory Central", blood(["6.4", "4.50", "13.4", "40.5", "90", "29.8", "33.1", "252"])),
        ],
    )

    male_blood = [
        ("leukocytes", "Leukocytes", "G/L", "4.0-10.0"), ("erythrocytes", "Erythrocytes", "T/L", "4.3-5.7"),
        ("hemoglobin", "Hemoglobin", "g/dL", "13.5-17.5"), ("hematocrit", "Hematocrit", "%", "40-52"),
        ("mcv", "MCV", "fL", "80-96"), ("mch", "MCH", "pg", "27-33"),
        ("mchc", "MCHC", "g/dL", "32-36"), ("platelets", "Platelets", "G/L", "150-400"),
    ]
    dirk_extra = [
        ("fasting-glucose", "Fasting glucose", "mg/dL", "70-99"), ("hba1c", "HbA1c", "%", "4.0-5.6"),
        ("creatinine", "Creatinine", "mg/dL", "0.7-1.3"), ("triglycerides", "Triglycerides", "mg/dL", "<150"),
        ("hdl", "HDL cholesterol", "mg/dL", "40-80"), ("ldl", "LDL cholesterol", "mg/dL", "<130"),
    ]
    dirk = fixture(
        "labdelta-demo-dirk-mayer",
        {"sourceKey": "patient-dirk-mayer", "displayName": "Dirk Mayer", "dateOfBirth": "1978-09-04", "sexReferenceContext": "male", "externalIdentifier": "DEMO-DIRK"},
        [],
        ["small-blood-count", "glucose-metabolism", "lipid-profile", "kidney-profile"],
        [
            report("dirk-report-2025-08-05", "2025-08-05", "LabDelta Synthetic Laboratory North", blood(["7.0", "5.10", "15.2", "46", "90", "29.8", "33.0", "238"], male_blood) + blood(["108", "5.6", "1.0", "150", "48", "112"], dirk_extra)),
            report("dirk-report-2026-01-10", "2026-01-10", "LabDelta Synthetic Laboratory North", blood(["7.2", "5.05", "15.0", "45", "89", "29.7", "33.2", "244"], male_blood) + blood(["118", "5.9", "1.1", "182", "46", "125"], dirk_extra)),
            report("dirk-report-2026-06-20", "2026-06-20", "LabDelta Synthetic Laboratory North", blood(["7.1", "5.00", "14.9", "45", "90", "29.8", "33.1", "248"], male_blood) + blood(["132", "6.3", "1.2", "215", "43", "139"], dirk_extra)),
        ],
    )

    daniel_extra = [
        ("alt", "ALT", "U/L", "<50"), ("ast", "AST", "U/L", "<40"), ("ggt", "GGT", "U/L", "<60"),
        ("crp", "CRP", "mg/L", "<5.0"), ("creatinine", "Creatinine", "mg/dL", "0.7-1.3"),
    ]
    daniel = fixture(
        "labdelta-demo-daniel-power",
        {"sourceKey": "patient-daniel-power", "displayName": "Daniel Power", "dateOfBirth": "1989-12-18", "sexReferenceContext": "male", "externalIdentifier": "DEMO-DANIEL"},
        [],
        ["small-blood-count", "liver-profile", "inflammation", "general-health"],
        [
            report("daniel-report-2026-02-12", "2026-02-12", "LabDelta Synthetic Laboratory West", blood(["6.8", "4.90", "14.7", "44", "90", "30.0", "33.4", "226"], male_blood) + blood(["58", "29", "35", "2.1", "0.95"], daniel_extra)),
            report("daniel-report-2026-06-12", "2026-06-12", "LabDelta Synthetic Laboratory West", blood(["6.9", "4.88", "14.6", "44", "90", "29.9", "33.2", "231"], male_blood) + blood(["52", "31", "38", "2.8", "1.02"], daniel_extra)),
        ],
    )

    for filename, data in [("eva-mittel.json", eva), ("dirk-mayer.json", dirk), ("daniel-power.json", daniel)]:
        (OUT / filename).write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
