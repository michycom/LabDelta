INSERT INTO reference_catalog_parameters (
    catalog_id, catalog_version, parameter_id, display_name, original_unit,
    lower_bound_text, upper_bound_text, context_notice, display_order
) VALUES
    ('demo-reference-catalog', 1, 'demo-marker-alpha', 'Demo-Marker Alpha', 'demo-unit-A',
     '10', '20', 'Synthetic demonstration interval; no medical meaning.', 1),
    ('demo-reference-catalog', 1, 'demo-marker-beta', 'Demo-Marker Beta', 'demo-unit-B',
     '2', '5', 'Synthetic demonstration interval; no medical meaning.', 2),
    ('demo-reference-catalog', 1, 'demo-marker-gamma', 'Demo-Marker Gamma', 'demo-unit-C',
     '30', '60', 'Synthetic demonstration interval; no medical meaning.', 3),
    ('demo-reference-catalog', 1, 'demo-marker-delta', 'Demo-Marker Delta', 'demo-unit-D',
     '4', '8', 'Synthetic demonstration interval; no medical meaning.', 4),
    ('demo-reference-catalog', 1, 'demo-marker-epsilon', 'Demo-Marker Epsilon', 'demo-unit-E',
     '100', '180', 'Synthetic demonstration interval; no medical meaning.', 5),
    ('demo-reference-catalog', 1, 'demo-marker-zeta', 'Demo-Marker Zeta', 'demo-unit-F',
     '0.5', '1.5', 'Synthetic demonstration interval; no medical meaning.', 6),
    ('demo-reference-catalog', 1, 'demo-marker-eta', 'Demo-Marker Eta', 'demo-unit-G',
     '7', '12', 'Synthetic demonstration interval; no medical meaning.', 7),
    ('demo-reference-catalog', 1, 'demo-marker-theta', 'Demo-Marker Theta', 'demo-unit-H',
     '40', '90', 'Synthetic demonstration interval; no medical meaning.', 8),
    ('demo-reference-catalog', 1, 'demo-marker-iota', 'Demo-Marker Iota', 'demo-unit-I',
     '1', '3', 'Synthetic demonstration interval; no medical meaning.', 9);
