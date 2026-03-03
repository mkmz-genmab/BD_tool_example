# Drug Database Portal - Landscaping Tool

A pharmaceutical drug database portal mockup with Excel-like functionality for viewing, filtering, and providing feedback on drug data.

## Overview

This tool displays Citeline drug data with AI-curated enrichments, featuring:
- Two view modes (Concise/Detailed)
- Column-based color coding (AI-curated = teal, raw Citeline = gray)
- Target synonym lookup from dictionary
- Right-click feedback system with "use for training" option
- Excel-style column filtering and search

## Data Sources

### 1. Target Synonyms Dictionary (CSV)
**File:** `data/target_synonyms.csv`

Contains ~44,000 unique targets with their synonyms from HGNC. Used for:
- Displaying synonym info bubbles on target columns
- Search matching (finding drugs by target synonym)

### 2. Drug Data (Excel)
**File:** `data/drug_data.xlsx`

Contains the actual drug data to display in the table. 

**To swap the Excel file:**
1. Replace `data/drug_data.xlsx`, or set `DRUG_DATA_XLSX_PATH` in `.env`.
2. Restart the server or click the Reload button in the UI.

### Special Excel Columns for Features:
| Column | Purpose |
|--------|---------|
| `_isNew` | Set to TRUE to show "NEW" badge on row |
| `_newFields` | Comma-separated column names to show magenta dot (e.g., "targetCurated,payloadCurated") |
| `_aiSummary` | AI-enhanced text shown in teal below the main Summary |

## API Endpoints

- `GET /api/drugs` - Get all drug data
- `POST /api/drugs/reload` - Reload data from Excel file
- `GET /api/targets/:name/synonyms` - Get synonyms for a target
- `POST /api/feedback` - Submit feedback on a cell
- `GET /api/feedback` - Get all submitted feedback

## Architecture

```
client/
  src/
    pages/DrugPortal.tsx     # Main page component
    components/
      ExcelStyleTable.tsx    # Data table with filtering
      LegendModal.tsx        # Classification guide
      FeedbackContextMenu.tsx # Right-click feedback form
      SearchBar.tsx          # Global search
      ColumnFilter.tsx       # Column filter dropdowns
      StatusToggle.tsx       # Active/Inactive filter
    lib/
      tableConfig.ts         # Column definitions

server/
  dataLoader.ts              # CSV and Excel loading
  routes.ts                  # API endpoints
```

## Column Configuration

Columns are defined in `client/src/lib/tableConfig.ts`:
- `conciseColumns` - Essential columns for quick review
- `detailedColumns` - All columns including raw Citeline data

Each column can be marked as:
- `isCurated: true` - Shows with teal/green background (AI-curated)
- `isRaw: true` - Shows with gray background (raw Citeline)
- `sortable: true` - Enables sorting
- `filterable: true` - Enables Excel-style filter dropdown

## Visual Indicators

- **Teal/Green background** - AI-curated columns
- **Gray background** - Raw Citeline columns
- **Magenta dot** - New/updated field data
- **NEW badge** - Newly added drug entry
- **AI badge** - AI-curated column header
- **Info icon** - Click for synonyms/alternative names
