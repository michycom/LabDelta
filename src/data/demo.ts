import type { LabResult, LaboratoryProfile, PatientSummary } from "../types";

export const patients: PatientSummary[] = [
  { id: "P-10023", name: "Müller, Anna", birthDate: "12.03.1985", latestReport: "12.05.2025", flagged: "8 / 34", profiles: ["Inflammation", "Iron metabolism", "Liver", "Thyroid"], severity: "marked", changes: [{ parameter: "CRP", delta: "+120%", direction: "risen" }, { parameter: "Ferritin", delta: "−45%", direction: "fallen" }, { parameter: "Leukocytes", delta: "−20%", direction: "fallen" }] },
  { id: "P-10018", name: "Weber, Martin", birthDate: "27.08.1974", latestReport: "09.05.2025", flagged: "7 / 33", profiles: ["Inflammation", "Iron metabolism", "Liver"], severity: "marked", changes: [{ parameter: "CRP", delta: "+95%", direction: "risen" }, { parameter: "Ferritin", delta: "−30%", direction: "fallen" }, { parameter: "ALT (GPT)", delta: "+25%", direction: "risen" }] },
  { id: "P-10031", name: "Schmidt, Klaus", birthDate: "04.11.1968", latestReport: "11.05.2025", flagged: "6 / 31", profiles: ["Inflammation", "Thyroid"], severity: "attention", changes: [{ parameter: "TSH", delta: "+18%", direction: "risen" }, { parameter: "Leukocytes", delta: "−15%", direction: "fallen" }, { parameter: "CRP", delta: "+60%", direction: "risen" }] },
  { id: "P-10009", name: "Becker, Lisa", birthDate: "19.01.1992", latestReport: "10.05.2025", flagged: "5 / 29", profiles: ["Renal function", "Electrolytes"], severity: "attention", changes: [{ parameter: "Potassium", delta: "+18%", direction: "risen" }, { parameter: "Creatinine", delta: "+12%", direction: "risen" }, { parameter: "Sodium", delta: "−6%", direction: "fallen" }] },
  { id: "P-10041", name: "Fischer, Julia", birthDate: "08.09.1988", latestReport: "07.05.2025", flagged: "4 / 28", profiles: ["Thyroid"], severity: "normal", changes: [{ parameter: "TSH", delta: "−8%", direction: "fallen" }] },
  { id: "P-10012", name: "Hoffmann, Peter", birthDate: "30.05.1959", latestReport: "06.05.2025", flagged: "3 / 32", profiles: ["Renal function", "Liver"], severity: "normal", changes: [{ parameter: "Uric acid", delta: "+28%", direction: "risen" }, { parameter: "ALT (GPT)", delta: "+20%", direction: "risen" }] }
];

export const results: LabResult[] = [
  { parameter: "CRP", previous: "2.1 mg/l", current: "4.6 mg/l", reference: "< 5.0 mg/l", position: "upper third", delta: "+120%", direction: "risen", tendency: "rising", history: "since 4 reports", severity: "marked" },
  { parameter: "Ferritin", previous: "118 µg/l", current: "65 µg/l", reference: "30–300 µg/l", position: "lower third", delta: "−45%", direction: "fallen", tendency: "falling", history: "since 3 reports", severity: "marked" },
  { parameter: "ALT (GPT)", previous: "28 U/l", current: "38 U/l", reference: "< 40 U/l", position: "upper third", delta: "+36%", direction: "risen", tendency: "rising", history: "since 2 reports", severity: "attention" },
  { parameter: "Leukocytes", previous: "4.0 K/µl", current: "3.2 K/µl", reference: "4.0–10.0 K/µl", position: "below reference", delta: "−20%", direction: "fallen", tendency: "falling", history: "since 3 reports", severity: "attention" },
  { parameter: "Vitamin B12", previous: "262 pg/ml", current: "215 pg/ml", reference: "200–950 pg/ml", position: "middle third", delta: "−18%", direction: "fallen", tendency: "slightly rising", history: "since 5 reports", severity: "slight" },
  { parameter: "TSH", previous: "1.2 mU/l", current: "1.2 mU/l", reference: "0.4–4.0 mU/l", position: "middle third", delta: "0%", direction: "stable", tendency: "stable", history: "since 6 reports", severity: "slight" },
  { parameter: "Potassium", previous: "4.4 mmol/l", current: "5.2 mmol/l", reference: "3.5–5.1 mmol/l", position: "above reference", delta: "+18%", direction: "risen", tendency: "rising", history: "since 2 reports", severity: "marked" }
];

export const profiles: LaboratoryProfile[] = [
  { name: "Inflammation", affected: "3 / 5 values affected", status: "Attention", severity: "marked" },
  { name: "Iron metabolism", affected: "2 / 6 values affected", status: "Slight attention", severity: "attention" },
  { name: "Liver", affected: "2 / 5 values affected", status: "Slight attention", severity: "attention" },
  { name: "Renal function", affected: "1 / 4 values affected", status: "Slight attention", severity: "attention" },
  { name: "Thyroid", affected: "1 / 4 values affected", status: "Normal", severity: "normal" },
  { name: "Electrolytes", affected: "1 / 6 values affected", status: "Slight attention", severity: "attention" },
  { name: "Cardiac markers", affected: "0 / 4 values affected", status: "Normal", severity: "normal" },
  { name: "Vitamins & trace elements", affected: "0 / 7 values affected", status: "Normal", severity: "normal" }
];

