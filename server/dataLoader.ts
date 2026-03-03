import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// TARGET SYNONYMS FROM CSV
// ============================================

export interface TargetSynonym {
  entityType: string;
  canonicalId: string;
  canonicalSymbol: string;
  synonym: string;
  source: string;
}

// Parse the CSV and build a synonym lookup
let targetSynonymMap: Map<string, Set<string>> | null = null;
let reverseTargetLookup: Map<string, string> | null = null;

function parseSynonymValue(value: string): string[] {
  // Handle values like "['ACF', 'ASP']" or plain strings
  if (value.startsWith('[') && value.endsWith(']')) {
    try {
      // Try parsing as JSON array (with single quotes replaced)
      const jsonStr = value.replace(/'/g, '"');
      const arr = JSON.parse(jsonStr);
      return Array.isArray(arr) ? arr : [value];
    } catch {
      // If parsing fails, just return the original
      return [value];
    }
  }
  return [value];
}

export function loadTargetSynonyms(csvPath: string): void {
  if (targetSynonymMap !== null) return; // Already loaded
  
  targetSynonymMap = new Map();
  reverseTargetLookup = new Map();
  
  try {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Simple CSV parsing (handles quoted fields)
      const parts = parseCSVLine(line);
      if (parts.length < 4) continue;
      
      const [entityType, canonicalId, canonicalSymbol, synonym] = parts;
      
      if (entityType !== 'target') continue; // Only process targets
      
      const normalizedSymbol = canonicalSymbol.toLowerCase();
      
      // Initialize the synonym set for this canonical symbol
      if (!targetSynonymMap.has(normalizedSymbol)) {
        targetSynonymMap.set(normalizedSymbol, new Set([canonicalSymbol]));
      }
      
      // Parse and add synonyms
      const synonyms = parseSynonymValue(synonym);
      synonyms.forEach(syn => {
        const trimmedSyn = syn.trim();
        if (trimmedSyn) {
          targetSynonymMap!.get(normalizedSymbol)!.add(trimmedSyn);
          // Build reverse lookup: synonym -> canonical symbol
          reverseTargetLookup!.set(trimmedSyn.toLowerCase(), canonicalSymbol);
        }
      });
    }
    
    console.log(`Loaded ${targetSynonymMap.size} unique targets with synonyms`);
  } catch (error) {
    console.error('Error loading target synonyms:', error);
    targetSynonymMap = new Map();
    reverseTargetLookup = new Map();
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip the next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

export function getTargetSynonyms(targetName: string): string[] {
  if (!targetSynonymMap) return [targetName];
  
  const normalized = targetName.toLowerCase();
  
  // First, try direct lookup
  const synonyms = targetSynonymMap.get(normalized);
  if (synonyms) {
    return Array.from(synonyms);
  }
  
  // Try reverse lookup (maybe input is a synonym)
  const canonical = reverseTargetLookup?.get(normalized);
  if (canonical) {
    const canonicalSynonyms = targetSynonymMap.get(canonical.toLowerCase());
    if (canonicalSynonyms) {
      return Array.from(canonicalSynonyms);
    }
  }
  
  return [targetName]; // Return as-is if not found
}

export function findCanonicalTarget(input: string): string | null {
  if (!reverseTargetLookup) return null;
  
  const normalized = input.toLowerCase();
  
  // Check if it's already a canonical symbol
  if (targetSynonymMap?.has(normalized)) {
    return input;
  }
  
  // Look up in reverse map
  return reverseTargetLookup.get(normalized) || null;
}

export function getAllTargetTerms(): string[] {
  if (!reverseTargetLookup) return [];
  return Array.from(reverseTargetLookup.keys());
}

// ============================================
// DRUG DATA FROM EXCEL
// ============================================

export interface DrugRow {
  id: string;
  [key: string]: string | boolean | string[] | undefined;
}

// Column name mapping from Excel to internal keys
const columnMapping: Record<string, string> = {
  'Citeline Drug ID': 'citelineDrugId',
  'Generic Drug Name': 'genericDrugName',
  'Drug Names': 'drugNames',
  'Global Status': 'globalStatus',
  'Date Added': 'dateAdded',
  'Molecule Type Curated': 'moleculeTypeCurated',
  'Target Curated': 'targetCurated',
  'Payload Curated': 'payloadCurated',
  'Company Curated': 'companyCurated',
  'Drug Disease Curated': 'drugDiseaseCurated',
  'Drug Country Curated': 'drugCountryCurated',
  'Company': 'company',
  'Company HQ Country': 'companyHqCountry',
  'Drug Disease': 'drugDisease',
  'Drug Disease Group': 'drugDiseaseGroup',
  'Originator / Licensee': 'originatorLicensee',
  'Drug Country': 'drugCountry',
  'Mechanism Of Action': 'mechanismOfAction',
  'Summary': 'summary',
  'Phase I': 'phaseI',
  'Phase II': 'phaseII',
  'Phase III': 'phaseIII',
  'Development Status': 'developmentStatus',
  'Latest Change Date': 'latestChangeDate',
  'Latest Change': 'latestChange',
  'Event Date': 'eventDate',
  'Event Type': 'eventType',
  'Event Details': 'eventDetails',
  'Drug Type': 'drugType',
  'Immunoconjugate Payload': 'immunoconjugatePayload',
  'Target': 'target',
  'Target Entrez Gene ID': 'targetEntrezGeneId',
  'Trialtrove Trial Count': 'trialtroveTrialCount',
  'Record URL': 'recordUrl',
  // Special columns for features
  '_isNew': 'isNew',
  '_newFields': 'newFields',
  '_aiSummary': 'aiSummary',
};

let drugData: DrugRow[] | null = null;
let currentExcelPath: string | null = null;

export function loadDrugData(excelPath: string, forceReload = false): DrugRow[] {
  if (drugData !== null && currentExcelPath === excelPath && !forceReload) {
    return drugData;
  }
  
  try {
    // Read file as buffer and parse
    const fileBuffer = fs.readFileSync(excelPath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with header row
    const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    
    drugData = rawData.map((row, index) => {
      const mappedRow: DrugRow = {
        id: String(row['Citeline Drug ID'] || index + 1),
      };
      
      // Map each column
      for (const [excelCol, internalKey] of Object.entries(columnMapping)) {
        let value = row[excelCol];
        
        // Handle special columns
        if (internalKey === 'isNew') {
          mappedRow[internalKey] = value === true || value === 'TRUE' || value === 'true' || value === 1;
        } else if (internalKey === 'newFields') {
          if (typeof value === 'string' && value) {
            mappedRow[internalKey] = value.split(',').map(s => s.trim());
          }
        } else {
          mappedRow[internalKey] = value !== undefined ? String(value) : '';
        }
      }
      
      // Also copy any unmapped columns (for flexibility)
      for (const key of Object.keys(row)) {
        if (!columnMapping[key]) {
          const camelKey = key.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
          mappedRow[camelKey] = String(row[key] || '');
        }
      }
      
      return mappedRow;
    });
    
    currentExcelPath = excelPath;
    console.log(`Loaded ${drugData.length} drugs from Excel`);
    
    return drugData;
  } catch (error) {
    console.error('Error loading Excel file:', error);
    return [];
  }
}

export function reloadDrugData(excelPath: string): DrugRow[] {
  return loadDrugData(excelPath, true);
}

export function getLoadedDrugData(): DrugRow[] {
  return drugData || [];
}

// ============================================
// PREFERRED TERMS DICTIONARY FROM EXCEL
// ============================================

let preferredTermsMap: Map<string, string> | null = null;

export function loadPreferredTermsDictionary(excelPath: string): void {
  if (preferredTermsMap !== null) return; // Already loaded
  
  preferredTermsMap = new Map();
  
  try {
    const fileBuffer = fs.readFileSync(excelPath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    
    for (const row of rawData) {
      const synonym = String(row['synonym'] || '').trim();
      const preferredTerm = String(row['Preferred synonym'] || '').trim();
      const canonicalSymbol = String(row['canonical_symbol'] || '').trim();
      
      if (synonym && preferredTerm) {
        // Map synonym to preferred term (case-insensitive lookup)
        preferredTermsMap.set(synonym.toLowerCase(), preferredTerm);
      }
      
      // Also map canonical symbol to preferred term
      if (canonicalSymbol && preferredTerm) {
        preferredTermsMap.set(canonicalSymbol.toLowerCase(), preferredTerm);
      }
      
      // Handle array-style synonyms like "['ACF', 'ASP']"
      if (synonym.startsWith('[') && synonym.endsWith(']')) {
        try {
          const jsonStr = synonym.replace(/'/g, '"');
          const arr = JSON.parse(jsonStr);
          if (Array.isArray(arr)) {
            arr.forEach((s: string) => {
              const trimmed = String(s).trim();
              if (trimmed) {
                preferredTermsMap!.set(trimmed.toLowerCase(), preferredTerm);
              }
            });
          }
        } catch {
          // If parsing fails, already handled above
        }
      }
    }
    
    console.log(`Loaded ${preferredTermsMap.size} preferred term mappings from dictionary`);
  } catch (error) {
    console.error('Error loading preferred terms dictionary:', error);
    preferredTermsMap = new Map();
  }
}

export function getPreferredTerm(input: string): string {
  if (!preferredTermsMap || !input) return input;
  
  const normalized = input.toLowerCase().trim();
  const preferred = preferredTermsMap.get(normalized);
  
  return preferred || input;
}

export function hasPreferredTerm(input: string): boolean {
  if (!preferredTermsMap || !input) return false;
  return preferredTermsMap.has(input.toLowerCase().trim());
}

// ============================================
// CROSSTALK REFERENCE IDS (In Midaxo check)
// ============================================

let crossTalkIds: Set<string> | null = null;

export function loadCrossTalkIds(csvPath: string): void {
  if (crossTalkIds !== null) return; // Already loaded
  
  crossTalkIds = new Set();
  
  try {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Remove quotes and get the ID
      const id = line.replace(/"/g, '').trim();
      
      // Skip non-numeric IDs (like "No ID yet", "not found", etc.)
      if (id && /^\d+$/.test(id)) {
        crossTalkIds.add(id);
      }
    }
    
    console.log(`Loaded ${crossTalkIds.size} CrossTalk reference IDs`);
  } catch (error) {
    console.error('Error loading CrossTalk IDs:', error);
    crossTalkIds = new Set();
  }
}

export function isInMidaxo(drugId: string): boolean {
  if (!crossTalkIds) return false;
  return crossTalkIds.has(drugId);
}

// ============================================
// SUMMARY DELTAS (AI-generated summary updates)
// ============================================

export interface SummaryDelta {
  oldSummary: string;
  newSummary: string;
  confidence: number;
  sourceType: string;
  sourceUrl: string;
}

let summaryDeltasMap: Map<string, SummaryDelta> | null = null;

export function loadSummaryDeltas(csvPath: string): void {
  if (summaryDeltasMap !== null) return; // Already loaded
  
  summaryDeltasMap = new Map();
  
  try {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = parseCSVLine(line);
      if (parts.length < 6) continue;
      
      const [citelineDrugId, , , oldSummary, newSummary, confidence, sourceType, sourceUrl] = parts;
      
      if (citelineDrugId && newSummary) {
        summaryDeltasMap.set(citelineDrugId.trim(), {
          oldSummary: oldSummary || '',
          newSummary: newSummary.trim(),
          confidence: parseFloat(confidence) || 0,
          sourceType: sourceType || '',
          sourceUrl: sourceUrl || '',
        });
      }
    }
    
    console.log(`Loaded ${summaryDeltasMap.size} summary deltas`);
  } catch (error) {
    console.error('Error loading summary deltas:', error);
    summaryDeltasMap = new Map();
  }
}

export function getSummaryDelta(drugId: string): SummaryDelta | null {
  if (!summaryDeltasMap) return null;
  return summaryDeltasMap.get(drugId) || null;
}

export function hasSummaryDelta(drugId: string): boolean {
  if (!summaryDeltasMap) return false;
  return summaryDeltasMap.has(drugId);
}

// ============================================
// FILE PATHS (easy to change)
// ============================================

// todo: Update these paths when swapping files
export const DATA_PATHS = {
  // Override the data directory (default: ./data) or any individual file path via env.
  synonymsCsv: resolveDataPath('SYNONYMS_CSV_PATH', 'target_synonyms.csv'),
  drugDataExcel: resolveDataPath('DRUG_DATA_XLSX_PATH', 'drug_data.xlsx'),
  preferredTermsExcel: resolveDataPath('PREFERRED_TERMS_XLSX_PATH', 'preferred_terms.xlsx'),
  crossTalkCsv: resolveDataPath('CROSSTALK_CSV_PATH', 'crosstalk_ids.csv'),
  summaryDeltasCsv: resolveDataPath('SUMMARY_DELTAS_CSV_PATH', 'summary_deltas.csv'),
};

// Initialize data on module load
export function initializeData(): void {
  console.log('Initializing data loaders...');
  safeLoad('target synonyms', DATA_PATHS.synonymsCsv, () => loadTargetSynonyms(DATA_PATHS.synonymsCsv));
  safeLoad('drug data', DATA_PATHS.drugDataExcel, () => loadDrugData(DATA_PATHS.drugDataExcel));
  safeLoad('preferred terms', DATA_PATHS.preferredTermsExcel, () => loadPreferredTermsDictionary(DATA_PATHS.preferredTermsExcel));
  safeLoad('CrossTalk IDs', DATA_PATHS.crossTalkCsv, () => loadCrossTalkIds(DATA_PATHS.crossTalkCsv));
  safeLoad('summary deltas', DATA_PATHS.summaryDeltasCsv, () => loadSummaryDeltas(DATA_PATHS.summaryDeltasCsv));
}

function getDataDir(): string {
  if (process.env.DATA_DIR && process.env.DATA_DIR.trim()) {
    return path.resolve(process.env.DATA_DIR);
  }
  return path.join(process.cwd(), 'data');
}

function resolveDataPath(envVar: string, defaultFilename: string): string {
  const override = process.env[envVar];
  if (override && override.trim()) {
    return path.resolve(override.trim());
  }
  return path.join(getDataDir(), defaultFilename);
}

function safeLoad(label: string, filePath: string, loader: () => void): void {
  if (!fs.existsSync(filePath)) {
    console.warn(`[dataLoader] Missing ${label} file: ${filePath}`);
    return;
  }
  loader();
}
