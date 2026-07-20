DELETE FROM reference_catalog_parameters
WHERE catalog_id = 'demo-reference-catalog' AND catalog_version = 1;

INSERT INTO reference_catalog_parameters (
    catalog_id, catalog_version, parameter_id, display_name, original_unit,
    lower_bound_text, upper_bound_text, context_notice, display_order
) VALUES
    ('demo-reference-catalog', 1, 'leukocytes', 'Leukocytes', 'G/L', '4.0', '10.0', 'Synthetic demonstration interval; no medical meaning.', 1),
    ('demo-reference-catalog', 1, 'erythrocytes', 'Erythrocytes', 'T/L', '3.9', '5.7', 'Synthetic demonstration interval; no medical meaning.', 2),
    ('demo-reference-catalog', 1, 'hemoglobin', 'Hemoglobin', 'g/dL', '12.0', '17.5', 'Synthetic demonstration interval; no medical meaning.', 3),
    ('demo-reference-catalog', 1, 'hematocrit', 'Hematocrit', '%', '36', '52', 'Synthetic demonstration interval; no medical meaning.', 4),
    ('demo-reference-catalog', 1, 'mcv', 'MCV', 'fL', '80', '96', 'Synthetic demonstration interval; no medical meaning.', 5),
    ('demo-reference-catalog', 1, 'mch', 'MCH', 'pg', '27', '33', 'Synthetic demonstration interval; no medical meaning.', 6),
    ('demo-reference-catalog', 1, 'mchc', 'MCHC', 'g/dL', '32', '36', 'Synthetic demonstration interval; no medical meaning.', 7),
    ('demo-reference-catalog', 1, 'platelets', 'Platelets', 'G/L', '150', '400', 'Synthetic demonstration interval; no medical meaning.', 8),
    ('demo-reference-catalog', 1, 'crp', 'CRP', 'mg/L', '0', '5.0', 'Synthetic demonstration interval; no medical meaning.', 9);

INSERT INTO laboratory_parameters (id, version, canonical_display, status, source)
VALUES
    ('leukocytes', 1, 'Leukocytes', 'approved', 'Synthetic contest fixture contract'),
    ('erythrocytes', 1, 'Erythrocytes', 'approved', 'Synthetic contest fixture contract'),
    ('hemoglobin', 1, 'Hemoglobin', 'approved', 'Synthetic contest fixture contract'),
    ('hematocrit', 1, 'Hematocrit', 'approved', 'Synthetic contest fixture contract'),
    ('mcv', 1, 'MCV', 'approved', 'Synthetic contest fixture contract'),
    ('mch', 1, 'MCH', 'approved', 'Synthetic contest fixture contract'),
    ('mchc', 1, 'MCHC', 'approved', 'Synthetic contest fixture contract'),
    ('platelets', 1, 'Platelets', 'approved', 'Synthetic contest fixture contract'),
    ('fasting-glucose', 1, 'Fasting glucose', 'approved', 'Synthetic contest fixture contract'),
    ('hba1c', 1, 'HbA1c', 'approved', 'Synthetic contest fixture contract'),
    ('creatinine', 1, 'Creatinine', 'approved', 'Synthetic contest fixture contract'),
    ('triglycerides', 1, 'Triglycerides', 'approved', 'Synthetic contest fixture contract'),
    ('hdl', 1, 'HDL cholesterol', 'approved', 'Synthetic contest fixture contract'),
    ('ldl', 1, 'LDL cholesterol', 'approved', 'Synthetic contest fixture contract'),
    ('alt', 1, 'ALT', 'approved', 'Synthetic contest fixture contract'),
    ('ast', 1, 'AST', 'approved', 'Synthetic contest fixture contract'),
    ('ggt', 1, 'GGT', 'approved', 'Synthetic contest fixture contract'),
    ('crp', 1, 'CRP', 'approved', 'Synthetic contest fixture contract');

INSERT INTO laboratory_profiles (id, version, name, description, status, source)
VALUES
    ('small-blood-count', 1, 'Small Blood Count', 'Static grouping for the synthetic contest display; no diagnosis.', 'approved', 'Synthetic contest fixture contract'),
    ('general-health', 1, 'General Health', 'Static organizational grouping for the synthetic contest display; no health assessment.', 'approved', 'Synthetic contest fixture contract'),
    ('glucose-metabolism', 1, 'Glucose Metabolism', 'Static organizational grouping for the synthetic contest display; no diagnosis.', 'approved', 'Synthetic contest fixture contract'),
    ('lipid-profile', 1, 'Lipid Profile', 'Static organizational grouping for the synthetic contest display; no diagnosis.', 'approved', 'Synthetic contest fixture contract'),
    ('kidney-profile', 1, 'Kidney Profile', 'Static organizational grouping for the synthetic contest display; no diagnosis.', 'approved', 'Synthetic contest fixture contract'),
    ('liver-profile', 1, 'Liver Profile', 'Static organizational grouping for the synthetic contest display; no diagnosis.', 'approved', 'Synthetic contest fixture contract'),
    ('inflammation', 1, 'Inflammation', 'Static organizational grouping for the synthetic contest display; no diagnosis.', 'approved', 'Synthetic contest fixture contract');

INSERT INTO profile_memberships (profile_id, profile_version, parameter_id, parameter_version, role, display_order, source)
SELECT 'small-blood-count', 1, id, 1, 'display',
       CASE id WHEN 'leukocytes' THEN 1 WHEN 'erythrocytes' THEN 2 WHEN 'hemoglobin' THEN 3 WHEN 'hematocrit' THEN 4 WHEN 'mcv' THEN 5 WHEN 'mch' THEN 6 WHEN 'mchc' THEN 7 ELSE 8 END,
       'Synthetic contest fixture contract'
FROM laboratory_parameters WHERE version = 1 AND id IN ('leukocytes','erythrocytes','hemoglobin','hematocrit','mcv','mch','mchc','platelets');

INSERT INTO profile_memberships (profile_id, profile_version, parameter_id, parameter_version, role, display_order, source)
VALUES
    ('general-health', 1, 'leukocytes', 1, 'display', 1, 'Synthetic contest fixture contract'),
    ('general-health', 1, 'hemoglobin', 1, 'display', 2, 'Synthetic contest fixture contract'),
    ('general-health', 1, 'creatinine', 1, 'display', 3, 'Synthetic contest fixture contract'),
    ('general-health', 1, 'crp', 1, 'display', 4, 'Synthetic contest fixture contract'),
    ('glucose-metabolism', 1, 'fasting-glucose', 1, 'display', 1, 'Synthetic contest fixture contract'),
    ('glucose-metabolism', 1, 'hba1c', 1, 'display', 2, 'Synthetic contest fixture contract'),
    ('lipid-profile', 1, 'triglycerides', 1, 'display', 1, 'Synthetic contest fixture contract'),
    ('lipid-profile', 1, 'hdl', 1, 'display', 2, 'Synthetic contest fixture contract'),
    ('lipid-profile', 1, 'ldl', 1, 'display', 3, 'Synthetic contest fixture contract'),
    ('kidney-profile', 1, 'creatinine', 1, 'display', 1, 'Synthetic contest fixture contract'),
    ('liver-profile', 1, 'alt', 1, 'display', 1, 'Synthetic contest fixture contract'),
    ('liver-profile', 1, 'ast', 1, 'display', 2, 'Synthetic contest fixture contract'),
    ('liver-profile', 1, 'ggt', 1, 'display', 3, 'Synthetic contest fixture contract'),
    ('inflammation', 1, 'crp', 1, 'display', 1, 'Synthetic contest fixture contract');

CREATE TABLE demo_patient_profiles (
    patient_id TEXT NOT NULL,
    profile_id TEXT NOT NULL,
    profile_version INTEGER NOT NULL,
    seed_version TEXT NOT NULL,
    fixture_id TEXT NOT NULL,
    display_order INTEGER NOT NULL CHECK(display_order >= 0),
    PRIMARY KEY (patient_id, profile_id, profile_version),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id, profile_version) REFERENCES laboratory_profiles(id, version) ON DELETE RESTRICT,
    FOREIGN KEY (seed_version, fixture_id) REFERENCES demo_seed_fixtures(seed_version, fixture_id) ON DELETE CASCADE
);
