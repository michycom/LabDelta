CREATE TABLE reference_sources (
    id TEXT NOT NULL CHECK(length(trim(id)) > 0),
    version INTEGER NOT NULL CHECK(version > 0),
    source_kind TEXT NOT NULL CHECK(
        source_kind IN ('report', 'demo_catalog', 'ifcc', 'dgkl', 'local_laboratory')
    ),
    display_name TEXT NOT NULL CHECK(length(trim(display_name)) > 0),
    description TEXT NOT NULL CHECK(length(trim(description)) > 0),
    availability TEXT NOT NULL CHECK(availability IN ('active', 'future_disabled')),
    is_default INTEGER NOT NULL CHECK(is_default IN (0, 1)),
    demonstration_only INTEGER NOT NULL CHECK(demonstration_only IN (0, 1)),
    changed_on TEXT NOT NULL CHECK(length(trim(changed_on)) > 0),
    source_notice TEXT NOT NULL CHECK(length(trim(source_notice)) > 0),
    PRIMARY KEY (id, version),
    UNIQUE (source_kind, version),
    CHECK(availability = 'active' OR is_default = 0)
);

CREATE UNIQUE INDEX reference_sources_single_default_idx
ON reference_sources(is_default) WHERE is_default = 1;

CREATE TABLE reference_catalogs (
    id TEXT NOT NULL CHECK(length(trim(id)) > 0),
    version INTEGER NOT NULL CHECK(version > 0),
    reference_source_id TEXT NOT NULL,
    reference_source_version INTEGER NOT NULL,
    display_name TEXT NOT NULL CHECK(length(trim(display_name)) > 0),
    description TEXT NOT NULL CHECK(length(trim(description)) > 0),
    status TEXT NOT NULL CHECK(status IN ('active', 'retired')),
    demonstration_only INTEGER NOT NULL CHECK(demonstration_only = 1),
    changed_on TEXT NOT NULL CHECK(length(trim(changed_on)) > 0),
    provenance TEXT NOT NULL CHECK(length(trim(provenance)) > 0),
    PRIMARY KEY (id, version),
    FOREIGN KEY (reference_source_id, reference_source_version)
        REFERENCES reference_sources(id, version)
        ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE TABLE reference_catalog_parameters (
    catalog_id TEXT NOT NULL,
    catalog_version INTEGER NOT NULL,
    parameter_id TEXT NOT NULL CHECK(length(trim(parameter_id)) > 0),
    display_name TEXT NOT NULL CHECK(length(trim(display_name)) > 0),
    original_unit TEXT NOT NULL CHECK(length(trim(original_unit)) > 0),
    lower_bound_text TEXT,
    upper_bound_text TEXT,
    reference_rule_text TEXT,
    context_notice TEXT NOT NULL CHECK(length(trim(context_notice)) > 0),
    display_order INTEGER NOT NULL CHECK(display_order >= 0),
    PRIMARY KEY (catalog_id, catalog_version, parameter_id),
    UNIQUE (catalog_id, catalog_version, display_order),
    CHECK(
        (lower_bound_text IS NOT NULL AND upper_bound_text IS NOT NULL AND reference_rule_text IS NULL)
        OR (lower_bound_text IS NULL AND upper_bound_text IS NULL AND reference_rule_text IS NOT NULL)
    ),
    FOREIGN KEY (catalog_id, catalog_version)
        REFERENCES reference_catalogs(id, version)
        ON UPDATE RESTRICT ON DELETE CASCADE
);

INSERT INTO reference_sources (
    id, version, source_kind, display_name, description, availability,
    is_default, demonstration_only, changed_on, source_notice
) VALUES
    ('report-reference', 1, 'report', 'Report Reference',
     'Reference information supplied by the selected original laboratory report.',
     'active', 1, 0, '2026-07-20',
     'Default source. Original report reference information remains authoritative for the demonstration.'),
    ('demo-reference-catalog', 1, 'demo_catalog', 'Demo Reference Catalog v1',
     'Small synthetic reference catalog for the contest demonstration.',
     'active', 0, 1, '2026-07-20',
     'Demonstration catalog only. It does not replace the original report reference as the default.'),
    ('ifcc-reference', 1, 'ifcc', 'IFCC',
     'Future externally curated reference source.',
     'future_disabled', 0, 0, '2026-07-20',
     'Future catalog placeholder. No IFCC content or rules are implemented.'),
    ('dgkl-reference', 1, 'dgkl', 'DGKL',
     'Future externally curated reference source.',
     'future_disabled', 0, 0, '2026-07-20',
     'Future catalog placeholder. No DGKL content or rules are implemented.'),
    ('local-laboratory-reference', 1, 'local_laboratory', 'Local Laboratory',
     'Future locally curated laboratory reference source.',
     'future_disabled', 0, 0, '2026-07-20',
     'Future catalog placeholder. No local laboratory catalog is implemented.');

INSERT INTO reference_catalogs (
    id, version, reference_source_id, reference_source_version,
    display_name, description, status, demonstration_only,
    changed_on, provenance
) VALUES (
    'demo-reference-catalog', 1, 'demo-reference-catalog', 1,
    'Demo Reference Catalog v1',
    'Synthetic contest-only catalog; not medically curated and not for real use.',
    'active', 1, '2026-07-20',
    'LabDelta PROJECT_FOUNDATION contest demonstration extension'
);
