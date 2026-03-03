# Data Files

These files are the default runtime inputs for the portal:

- `drug_data.xlsx`: Main drug rows shown in the table.
- `target_synonyms.csv`: Canonical target synonym dictionary.
- `preferred_terms.xlsx`: Preferred-term mapping dictionary.
- `crosstalk_ids.csv`: Citeline IDs used for Midaxo/CrossTalk flagging.
- `summary_deltas.csv`: AI/new-summary deltas keyed by Citeline ID.

You can override these defaults via `.env` path variables.
