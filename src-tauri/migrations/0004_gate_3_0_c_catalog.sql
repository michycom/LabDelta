CREATE TABLE rule_definitions (
    id TEXT NOT NULL CHECK(length(trim(id)) > 0),
    version INTEGER NOT NULL CHECK(version > 0),
    rule_kind TEXT NOT NULL CHECK(length(trim(rule_kind)) > 0),
    description TEXT NOT NULL CHECK(length(trim(description)) > 0),
    source TEXT NOT NULL CHECK(length(trim(source)) > 0),
    changed_on TEXT NOT NULL CHECK(length(trim(changed_on)) > 0),
    status TEXT NOT NULL CHECK(status IN ('draft', 'approved', 'retired')),
    scope_json TEXT,
    test_reference TEXT,
    PRIMARY KEY (id, version)
);

CREATE TABLE laboratory_parameters (
    id TEXT NOT NULL CHECK(length(trim(id)) > 0),
    version INTEGER NOT NULL CHECK(version > 0),
    canonical_display TEXT NOT NULL CHECK(length(trim(canonical_display)) > 0),
    material_context TEXT,
    method_context TEXT,
    status TEXT NOT NULL CHECK(status IN ('draft', 'approved', 'retired')),
    source TEXT NOT NULL CHECK(length(trim(source)) > 0),
    PRIMARY KEY (id, version)
);

CREATE TABLE parameter_names (
    parameter_id TEXT NOT NULL,
    parameter_version INTEGER NOT NULL,
    name TEXT NOT NULL CHECK(length(trim(name)) > 0),
    name_kind TEXT NOT NULL CHECK(name_kind IN ('original', 'alias')),
    source TEXT NOT NULL CHECK(length(trim(source)) > 0),
    PRIMARY KEY (parameter_id, parameter_version, name, name_kind),
    FOREIGN KEY (parameter_id, parameter_version)
        REFERENCES laboratory_parameters(id, version)
        ON UPDATE RESTRICT ON DELETE CASCADE
);

CREATE TABLE parameter_external_codes (
    parameter_id TEXT NOT NULL,
    parameter_version INTEGER NOT NULL,
    code_system TEXT NOT NULL CHECK(length(trim(code_system)) > 0),
    code TEXT NOT NULL CHECK(length(trim(code)) > 0),
    source TEXT NOT NULL CHECK(length(trim(source)) > 0),
    PRIMARY KEY (parameter_id, parameter_version, code_system, code),
    FOREIGN KEY (parameter_id, parameter_version)
        REFERENCES laboratory_parameters(id, version)
        ON UPDATE RESTRICT ON DELETE CASCADE
);

CREATE TABLE measurement_units (
    id TEXT NOT NULL CHECK(length(trim(id)) > 0),
    version INTEGER NOT NULL CHECK(version > 0),
    display TEXT NOT NULL CHECK(length(trim(display)) > 0),
    status TEXT NOT NULL CHECK(status IN ('draft', 'approved', 'retired')),
    source TEXT NOT NULL CHECK(length(trim(source)) > 0),
    PRIMARY KEY (id, version)
);

CREATE TABLE unit_conversion_rules (
    rule_id TEXT NOT NULL,
    rule_version INTEGER NOT NULL,
    parameter_id TEXT NOT NULL,
    parameter_version INTEGER NOT NULL,
    from_unit_id TEXT NOT NULL,
    from_unit_version INTEGER NOT NULL,
    to_unit_id TEXT NOT NULL,
    to_unit_version INTEGER NOT NULL,
    formula TEXT NOT NULL CHECK(length(trim(formula)) > 0),
    PRIMARY KEY (rule_id, rule_version),
    FOREIGN KEY (rule_id, rule_version) REFERENCES rule_definitions(id, version),
    FOREIGN KEY (parameter_id, parameter_version)
        REFERENCES laboratory_parameters(id, version),
    FOREIGN KEY (from_unit_id, from_unit_version)
        REFERENCES measurement_units(id, version),
    FOREIGN KEY (to_unit_id, to_unit_version)
        REFERENCES measurement_units(id, version)
);

CREATE TABLE laboratory_profiles (
    id TEXT NOT NULL CHECK(length(trim(id)) > 0),
    version INTEGER NOT NULL CHECK(version > 0),
    name TEXT NOT NULL CHECK(length(trim(name)) > 0),
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('draft', 'approved', 'retired')),
    source TEXT NOT NULL CHECK(length(trim(source)) > 0),
    PRIMARY KEY (id, version)
);

CREATE TABLE profile_memberships (
    profile_id TEXT NOT NULL,
    profile_version INTEGER NOT NULL,
    parameter_id TEXT NOT NULL,
    parameter_version INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(length(trim(role)) > 0),
    display_order INTEGER NOT NULL CHECK(display_order >= 0),
    source TEXT NOT NULL CHECK(length(trim(source)) > 0),
    PRIMARY KEY (profile_id, profile_version, parameter_id, parameter_version),
    FOREIGN KEY (profile_id, profile_version)
        REFERENCES laboratory_profiles(id, version)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    FOREIGN KEY (parameter_id, parameter_version)
        REFERENCES laboratory_parameters(id, version)
        ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE TABLE analysis_contracts (
    id TEXT NOT NULL CHECK(length(trim(id)) > 0),
    version INTEGER NOT NULL CHECK(version > 0),
    error_kind TEXT NOT NULL CHECK(
        error_kind IN ('not_confirmed', 'not_assessable', 'not_comparable')
    ),
    description TEXT NOT NULL CHECK(length(trim(description)) > 0),
    PRIMARY KEY (id, version)
);

CREATE TABLE analysis_contract_rule_refs (
    contract_id TEXT NOT NULL,
    contract_version INTEGER NOT NULL,
    rule_id TEXT NOT NULL,
    rule_version INTEGER NOT NULL,
    PRIMARY KEY (contract_id, contract_version, rule_id, rule_version),
    FOREIGN KEY (contract_id, contract_version)
        REFERENCES analysis_contracts(id, version) ON DELETE CASCADE,
    FOREIGN KEY (rule_id, rule_version)
        REFERENCES rule_definitions(id, version) ON DELETE RESTRICT
);

CREATE TABLE analysis_contract_input_refs (
    contract_id TEXT NOT NULL,
    contract_version INTEGER NOT NULL,
    working_value_id TEXT NOT NULL,
    original_value_id TEXT NOT NULL,
    PRIMARY KEY (contract_id, contract_version, working_value_id),
    FOREIGN KEY (contract_id, contract_version)
        REFERENCES analysis_contracts(id, version) ON DELETE CASCADE,
    FOREIGN KEY (working_value_id, original_value_id)
        REFERENCES confirmed_working_values(id, original_value_id) ON DELETE RESTRICT
);
