# Synthetic Contest Fixtures v2

Status: **approved demonstration data for `contest-demo-v2`**

All identities, reports, measurements, values, intervals, and laboratories in
this fixture set are fully synthetic. The cases demonstrate data structure,
mathematical change, supplied-report intervals, and provenance only. They do
not state diagnoses, health status, prognosis, treatment, or medical meaning.

## Eva Mittel

- Fictional 25-year-old person with female reference context.
- Explicitly confirmed fixture measurements: 160 cm and 45 kg, each linked to
  its original fixture value and source location.
- Two complete small blood counts. All small-blood-count values lie within the
  synthetic interval supplied by their respective report; changes are small
  mathematical differences only.
- Static profiles: Small Blood Count and General Health.

## Dirk Mayer

- Fictional person with male reference context and three reports.
- Each report contains a complete small blood count plus fasting glucose,
  HbA1c, creatinine, triglycerides, HDL cholesterol, and LDL cholesterol.
- The latest report contains multiple values mathematically outside its own
  supplied synthetic interval. Fasting glucose increases across all three
  reports. The application does not attach medical meaning to either fact.
- Static profiles: Small Blood Count, Glucose Metabolism, Lipid Profile, and
  Kidney Profile.

## Daniel Power

- Fictional person with male reference context and two reports.
- Each report contains a complete small blood count plus ALT, AST, GGT, CRP,
  and creatinine.
- ALT is mathematically outside the supplied synthetic report rule. CRP changes
  mathematically between reports while remaining within the supplied synthetic
  report rule. No medical interpretation is produced.
- Static profiles: Small Blood Count, Liver Profile, Inflammation, and General
  Health.

## Profile transparency

Profiles are versioned static organizational groupings. Patient assignments
come directly from the approved fixture and are displayed with the profile
version and parameter membership. They are not inferred from values and do not
represent diagnoses, risk categories, scores, or recommendations.
