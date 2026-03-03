// Dynamic column configuration

export interface ColumnConfig {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  isCurated?: boolean; // Human-curated columns (green headers)
  isGuessed?: boolean; // AI-predicted columns (purple)
  isRaw?: boolean; // Raw Citeline columns (gray)
  guessedColumnKey?: string; // For curated columns, link to the corresponding AI prediction column
}

// CONCISE VIEW: Must-have columns including ALL green/curated columns
export const conciseColumns: ColumnConfig[] = [
  // Key identifiers
  { key: "genericDrugName", label: "Generic Drug Name", width: "180px", sortable: true, filterable: true, isRaw: true },
  { key: "globalStatus", label: "Global Status", width: "120px", sortable: true, filterable: true, isRaw: true },
  
  // ALL AI-Curated (Green) Columns grouped together
  { key: "targetCurated", label: "Target", width: "200px", sortable: true, filterable: true, isCurated: true },
  { key: "mechanismOfAction", label: "MoA", width: "200px", filterable: true, isCurated: true },
  { key: "MoleculeTypeCurated", label: "Molecule Type", width: "220px", sortable: true, filterable: true, isCurated: true, guessedColumnKey: "GuessedMoleculeType" },
  { key: "PayloadTypeCurated", label: "Payload Type", width: "220px", sortable: true, filterable: true, isCurated: true, guessedColumnKey: "GuessedPayloadType" },
  { key: "MaskingFeaturesCurated", label: "Conditional Activation", width: "220px", sortable: true, filterable: true, isCurated: true, guessedColumnKey: "GuessedMaskingType" },
  { key: "companyCurated", label: "Company", width: "180px", sortable: true, filterable: true, isCurated: true },
  { key: "countryCurated", label: "Country", width: "120px", sortable: true, filterable: true, isCurated: true },
  { key: "summary", label: "Summary", width: "350px", filterable: true, isCurated: true, guessedColumnKey: "summaryDelta" },
  { key: "dateAdded", label: "Date Added", width: "100px", sortable: true, isCurated: true },
];

// DETAILED VIEW: All columns
// AI-Curated columns first (green headers), then raw Citeline columns (gray headers) at back
export const detailedColumns: ColumnConfig[] = [
  // Identifiers (Raw)
  { key: "citelineDrugId", label: "Citeline Drug ID", width: "120px", sortable: true, filterable: true, isRaw: true },
  { key: "inMidaxo", label: "In Midaxo", width: "120px", sortable: true, filterable: true, isRaw: true },
  { key: "genericDrugName", label: "Generic Drug Name", width: "180px", sortable: true, filterable: true, isRaw: true },
  { key: "globalStatus", label: "Global Status", width: "120px", sortable: true, filterable: true, isRaw: true },
  
  // ALL AI-Curated (Green) Columns grouped together
  { key: "targetCurated", label: "Target", width: "200px", sortable: true, filterable: true, isCurated: true },
  { key: "mechanismOfAction", label: "MoA", width: "220px", filterable: true, isCurated: true },
  { key: "MoleculeTypeCurated", label: "Molecule Type", width: "240px", sortable: true, filterable: true, isCurated: true, guessedColumnKey: "GuessedMoleculeType" },
  { key: "PayloadTypeCurated", label: "Payload Type", width: "240px", sortable: true, filterable: true, isCurated: true, guessedColumnKey: "GuessedPayloadType" },
  { key: "MaskingFeaturesCurated", label: "Conditional Activation", width: "240px", sortable: true, filterable: true, isCurated: true, guessedColumnKey: "GuessedMaskingType" },
  { key: "companyCurated", label: "Company", width: "200px", sortable: true, filterable: true, isCurated: true },
  { key: "countryCurated", label: "Country", width: "120px", sortable: true, filterable: true, isCurated: true },
  { key: "drugDiseaseCurated", label: "Indication", width: "200px", sortable: true, filterable: true, isCurated: true },
  { key: "summary", label: "Summary", width: "400px", filterable: true, isCurated: true, guessedColumnKey: "summaryDelta" },
  { key: "dateAdded", label: "Date Added", width: "100px", sortable: true, isCurated: true },
  
  // Raw Citeline Columns (grouped together at back - gray headers)
  { key: "target", label: "Target (Citeline)", width: "200px", sortable: true, filterable: true, isRaw: true },
  { key: "company", label: "Company (Citeline)", width: "200px", sortable: true, filterable: true, isRaw: true },
  { key: "companyHqCountry", label: "Country (Citeline)", width: "150px", sortable: true, filterable: true, isRaw: true },
  { key: "drugDisease", label: "Drug Disease", width: "200px", filterable: true, isRaw: true },
  { key: "drugDiseaseGroup", label: "Drug Disease Group", width: "150px", sortable: true, filterable: true, isRaw: true },
  { key: "originatorLicensee", label: "Originator / Licensee", width: "150px", sortable: true, filterable: true, isRaw: true },
  { key: "drugCountry", label: "Drug Country", width: "180px", filterable: true, isRaw: true },
  
  // Phase columns
  { key: "phaseI", label: "Phase I", width: "80px", sortable: true, filterable: true, isRaw: true },
  { key: "phaseII", label: "Phase II", width: "80px", sortable: true, filterable: true, isRaw: true },
  { key: "phaseIII", label: "Phase III", width: "80px", sortable: true, filterable: true, isRaw: true },
  
  // Status and events
  { key: "developmentStatus", label: "Development Status", width: "150px", sortable: true, filterable: true, isRaw: true },
  { key: "latestChangeDate", label: "Latest Change Date", width: "130px", sortable: true, isRaw: true },
  { key: "latestChange", label: "Latest Change", width: "250px", filterable: true, isRaw: true },
  { key: "eventDate", label: "Event Date", width: "100px", sortable: true, isRaw: true },
  { key: "eventType", label: "Event Type", width: "180px", filterable: true, isRaw: true },
  { key: "eventDetails", label: "Event Details", width: "250px", filterable: true, isRaw: true },
  
  // Additional columns
  { key: "drugType", label: "Drug Type", width: "200px", sortable: true, filterable: true, isRaw: true },
  { key: "immunoconjugatePayload", label: "Immunoconjugate Payload", width: "180px", filterable: true, isRaw: true },
  { key: "targetEntrezGeneId", label: "Target Entrez Gene ID", width: "150px", sortable: true, isRaw: true },
  { key: "trialtroveTtrialCount", label: "Trialtrove Trial Count", width: "150px", sortable: true, isRaw: true },
  { key: "recordUrl", label: "Record URL", width: "120px", isRaw: true },
  
  // Drug Names moved to back (de-emphasized)
  { key: "drugNames", label: "Drug Names", width: "200px", sortable: true, filterable: true, isRaw: true },
];

// Default columns (for backward compatibility)
export const defaultColumns = detailedColumns;

// Target synonyms mapping
export const targetSynonyms: Record<string, string[]> = {
  "EGFR": ["ErbB-1", "HER1", "Epidermal Growth Factor Receptor"],
  "HER2": ["ErbB-2", "neu", "ERBB2"],
  "PD-1": ["PDCD1", "CD279", "Programmed Cell Death 1"],
  "PD-L1": ["B7-H1", "CD274"],
  "VEGF": ["Vascular Endothelial Growth Factor", "VEGF-A"],
  "CD20": ["B-lymphocyte antigen CD20", "MS4A1"],
  "BCR-ABL": ["Philadelphia chromosome", "BCR-ABL1"],
  "interleukin 2 receptor subunit alpha": ["IL2RA", "CD25"],
  "TROP2": ["TACSTD2", "Trophoblast cell surface antigen 2"],
};

// Drug name synonyms mapping
export const drugSynonyms: Record<string, string[]> = {
  "panitumumab": ["Vectibix", "ABX-EGF", "AMG 954"],
  "aldesleukin": ["Proleukin", "IL-2", "interleukin-2"],
  "pembrolizumab": ["Keytruda", "MK-3475", "Lambrolizumab"],
  "nivolumab": ["Opdivo", "BMS-936558", "MDX-1106"],
  "trastuzumab": ["Herceptin", "R-597"],
  "trastuzumab deruxtecan": ["Enhertu", "DS-8201", "T-DXd"],
  "bevacizumab": ["Avastin", "rhuMAb-VEGF"],
  "rituximab": ["Rituxan", "MabThera", "IDEC-C2B8"],
  "osimertinib": ["Tagrisso", "AZD9291"],
  "sacituzumab govitecan": ["Trodelvy", "IMMU-132"],
};

// Function to find canonical target name from any synonym
export function findCanonicalTarget(input: string): string | null {
  const normalizedInput = input.toLowerCase().trim();
  
  for (const canonical of Object.keys(targetSynonyms)) {
    if (canonical.toLowerCase() === normalizedInput) {
      return canonical;
    }
  }
  
  for (const [canonical, synonyms] of Object.entries(targetSynonyms)) {
    for (const synonym of synonyms) {
      if (synonym.toLowerCase() === normalizedInput) {
        return canonical;
      }
    }
  }
  
  return null;
}

// Function to find canonical drug name from any synonym
export function findCanonicalDrug(input: string): string | null {
  const normalizedInput = input.toLowerCase().trim();
  
  for (const canonical of Object.keys(drugSynonyms)) {
    if (canonical.toLowerCase() === normalizedInput) {
      return canonical;
    }
  }
  
  for (const [canonical, synonyms] of Object.entries(drugSynonyms)) {
    for (const synonym of synonyms) {
      if (synonym.toLowerCase() === normalizedInput) {
        return canonical;
      }
    }
  }
  
  return null;
}

// Get all synonyms for searching
export function getAllSearchableTerms(): string[] {
  const terms: string[] = [];
  
  // Add all drug names and synonyms
  for (const [canonical, synonyms] of Object.entries(drugSynonyms)) {
    terms.push(canonical);
    terms.push(...synonyms);
  }
  
  // Add all target names and synonyms
  for (const [canonical, synonyms] of Object.entries(targetSynonyms)) {
    terms.push(canonical);
    terms.push(...synonyms);
  }
  
  return Array.from(new Set(terms));
}

// Function to get all synonyms for a target
export function getAllTargetNames(canonical: string): string[] {
  const synonyms = targetSynonyms[canonical];
  if (synonyms) {
    return [canonical, ...synonyms];
  }
  return [canonical];
}

// Function to get all synonyms for a drug
export function getAllDrugNames(canonical: string): string[] {
  const synonyms = drugSynonyms[canonical];
  if (synonyms) {
    return [canonical, ...synonyms];
  }
  return [canonical];
}

// Payload categories based on the classification rules
export const payloadCategories = {
  chemo: {
    label: "Chemotherapy",
    subcategories: [
      { key: "topo1", label: "Topo 1 Inhibitor", examples: ["DXd", "Exatecan", "SN-38", "Tistecan"] },
      { key: "transcription", label: "Transcription/Translation Inhibitor", examples: ["tariridoxin"] },
      { key: "tubulin", label: "Tubulin Inhibitor", examples: ["MMAE", "MMAF", "AS269", "Maytansine"] },
      { key: "dna", label: "DNA Targeting", examples: ["Calicheamicin", "PBD dimers"] },
    ],
  },
  immuneModulating: {
    label: "Immune Modulating",
    subcategories: [
      { key: "tlr", label: "TLR Agonist", examples: ["CpG7909"] },
      { key: "sting", label: "STING Agonist", examples: [] },
    ],
  },
  radioisotope: {
    label: "Radioisotope",
    subcategories: [],
    examples: ["Lutetium-177", "Actinium-225"],
  },
  other: {
    label: "Other",
    subcategories: [],
    examples: ["light-activated dye - IR700"],
  },
};

// Masking categories
export const maskingCategories = [
  { key: "ph", label: "pH-dependent activation", description: "Activated by pH changes in tumor microenvironment" },
  { key: "binding", label: "Binding-dependent activation", description: "Activated upon target binding" },
  { key: "protease", label: "Protease-dependent masking", description: "Unmasked by specific proteases" },
];

// Molecule type categories
export const moleculeTypes = [
  { value: "Protein--mAb", label: "Protein - Monoclonal Antibody" },
  { value: "Protein--bispecific", label: "Protein - Bispecific Antibody" },
  { value: "Protein--Recombinant", label: "Protein - Recombinant" },
  { value: "ADC", label: "ADC (Antibody-Drug Conjugate)" },
  { value: "Small Molecule", label: "Small Molecule" },
  { value: "cell-therapy", label: "Cell Therapy" },
  { value: "gene-therapy", label: "Gene Therapy" },
  { value: "vaccine", label: "Vaccine" },
];

// Development stages
export const developmentStages = [
  { value: "Preclinical", label: "Preclinical" },
  { value: "Phase I", label: "Phase I" },
  { value: "Phase II", label: "Phase II" },
  { value: "Phase III", label: "Phase III" },
  { value: "Pre-registration", label: "Pre-registration" },
  { value: "Launched", label: "Launched/Approved" },
];

// Status options for Active/Inactive toggle
export const statusOptions = [
  { value: "all", label: "All Assets" },
  { value: "active", label: "Active Only" },
  { value: "inactive", label: "Inactive Only" },
];
