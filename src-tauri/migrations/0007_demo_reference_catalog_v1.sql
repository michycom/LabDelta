INSERT INTO reference_catalog_parameters (
    catalog_id, catalog_version, parameter_id, display_name, original_unit,
    lower_bound_text, upper_bound_text, context_notice, display_order
) VALUES
    ('demo-reference-catalog', 1, 'leukocytes', 'Leukocytes', 'G/L',
     '4.0', '10.0', 'Synthetic demonstration interval; no medical meaning.', 1),
    ('demo-reference-catalog', 1, 'erythrocytes', 'Erythrocytes', 'T/L',
     '3.9', '5.7', 'Synthetic demonstration interval; no medical meaning.', 2),
    ('demo-reference-catalog', 1, 'hemoglobin', 'Hemoglobin', 'g/dL',
     '12.0', '17.5', 'Synthetic demonstration interval; no medical meaning.', 3),
    ('demo-reference-catalog', 1, 'hematocrit', 'Hematocrit', '%',
     '36', '52', 'Synthetic demonstration interval; no medical meaning.', 4),
    ('demo-reference-catalog', 1, 'mcv', 'MCV', 'fL',
     '80', '96', 'Synthetic demonstration interval; no medical meaning.', 5),
    ('demo-reference-catalog', 1, 'mch', 'MCH', 'pg',
     '27', '33', 'Synthetic demonstration interval; no medical meaning.', 6),
    ('demo-reference-catalog', 1, 'mchc', 'MCHC', 'g/dL',
     '32', '36', 'Synthetic demonstration interval; no medical meaning.', 7),
    ('demo-reference-catalog', 1, 'platelets', 'Platelets', 'G/L',
     '150', '400', 'Synthetic demonstration interval; no medical meaning.', 8),
    ('demo-reference-catalog', 1, 'crp', 'CRP', 'mg/L',
     '0', '5.0', 'Synthetic demonstration interval; no medical meaning.', 9);
