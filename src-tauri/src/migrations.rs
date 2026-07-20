use rusqlite::{params, Connection};

use crate::domain::PatientError;

pub(crate) const LATEST_SCHEMA_VERSION: i64 = 5;

struct Migration {
    version: i64,
    sql: &'static str,
}

const MIGRATIONS: &[Migration] = &[
    Migration {
        version: 1,
        sql: include_str!("../migrations/0001_initial_patients.sql"),
    },
    Migration {
        version: 2,
        sql: include_str!("../migrations/0002_gate_3_0_a1_persistence.sql"),
    },
    Migration {
        version: 3,
        sql: include_str!("../migrations/0003_demo_seed_tracking.sql"),
    },
    Migration {
        version: 4,
        sql: include_str!("../migrations/0004_gate_3_0_c_catalog.sql"),
    },
    Migration {
        version: 5,
        sql: include_str!("../migrations/0005_gate_3_0_completion.sql"),
    },
];

pub(crate) fn apply(connection: &mut Connection) -> Result<(), PatientError> {
    connection
        .execute_batch(
            "CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
             );",
        )
        .map_err(persistence_error)?;

    let applied_versions = {
        let mut statement = connection
            .prepare("SELECT version FROM schema_migrations ORDER BY version")
            .map_err(persistence_error)?;
        let versions = statement
            .query_map([], |row| row.get::<_, i64>(0))
            .map_err(persistence_error)?
            .collect::<Result<Vec<_>, _>>()
            .map_err(persistence_error)?;
        versions
    };

    for (index, version) in applied_versions.iter().enumerate() {
        let expected = index as i64 + 1;
        if *version != expected {
            return Err(PatientError::Persistence(format!(
                "schema migration history is not contiguous: expected version {expected}, found {version}"
            )));
        }
    }

    let current_version = applied_versions.last().copied().unwrap_or(0);
    if current_version > LATEST_SCHEMA_VERSION {
        return Err(PatientError::Persistence(format!(
            "database schema version {current_version} is newer than supported version {LATEST_SCHEMA_VERSION}"
        )));
    }

    for migration in MIGRATIONS
        .iter()
        .filter(|migration| migration.version > current_version)
    {
        let transaction = connection.transaction().map_err(persistence_error)?;
        transaction
            .execute_batch(migration.sql)
            .map_err(persistence_error)?;
        transaction
            .execute(
                "INSERT INTO schema_migrations(version, applied_at)
                 VALUES (?1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
                params![migration.version],
            )
            .map_err(persistence_error)?;
        transaction.commit().map_err(persistence_error)?;
    }

    Ok(())
}

fn persistence_error(error: rusqlite::Error) -> PatientError {
    PatientError::Persistence(error.to_string())
}
