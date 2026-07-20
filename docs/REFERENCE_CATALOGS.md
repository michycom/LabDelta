# Reference Catalog Architecture

Status: **contest implementation, version 1**

Reference catalogs are local, versioned display sources. They do not modify
original report data, do not introduce medical analysis, and do not silently
replace the reference information supplied by a laboratory report.

## ReferenceSource contract

Every source has a stable ID and version, a source kind, display name,
description, availability, default flag, demonstration flag, change date, and
source notice. A partial unique index permits exactly one configured default.
Disabled future sources cannot become the default.

| Source | Version | Availability | Default | Content implemented |
| --- | ---: | --- | --- | --- |
| Report Reference | 1 | Active | Yes | Supplied original-report reference text |
| Demo Reference Catalog v1 | 1 | Active | No | Nine synthetic contest parameters |
| IFCC | 1 | Future - disabled | No | None |
| DGKL | 1 | Future - disabled | No | None |
| Local Laboratory | 1 | Future - disabled | No | None |

`Report Reference` remains the startup and fallback selection. Its values come
from immutable original report fields and provenance already stored by Gate
3.0. The Demo Reference Catalog is an optional contest display catalog. It is
never applied automatically to report values.

## Demo Reference Catalog v1

The catalog contains Leukocytes, Erythrocytes, Hemoglobin, Hematocrit, MCV,
MCH, MCHC, Platelets, and CRP. Units and intervals are synthetic contest data;
they are not presented as generally applicable medical reference values. Every
row states that its interval has no medical meaning. The catalog and every
entry are tied to catalog version 1 and a deterministic display order.

No real parameter mapping, standard code, clinical reference interval,
conversion, patient-context rule, or medical interpretation is implied. The
catalog exists exclusively to make source selection visible and explainable in
the contest demonstration.

## Persistence boundaries

- `reference_sources` describes all current and future source choices.
- `reference_catalogs` exists only for implemented, versioned catalog content.
- `reference_catalog_parameters` stores immutable version-bound entries.
- IFCC, DGKL, and Local Laboratory have no rows in either catalog-content
  table.
- The Rust read model owns source availability and catalog reads. React only
  renders the returned state and maintains the temporary UI selection.
