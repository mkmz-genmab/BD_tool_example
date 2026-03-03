import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  initializeData, 
  getLoadedDrugData, 
  getTargetSynonyms, 
  findCanonicalTarget,
  reloadDrugData,
  getPreferredTerm,
  isInMidaxo,
  getSummaryDelta,
  DATA_PATHS
} from "./dataLoader";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize data loaders
  initializeData();
  const parsedSampleFraction = Number(process.env.DRUG_SAMPLE_FRACTION || "1");
  const sampleFraction = Number.isFinite(parsedSampleFraction)
    ? Math.max(0.01, Math.min(1, parsedSampleFraction))
    : 1;
  const injectDemoNewInfo = process.env.INJECT_DEMO_NEW_INFO === "true";

  // Helper to deduplicate comma/semicolon/newline separated values
  function deduplicateValues(value: string): string {
    if (!value) return '';
    const values = value.split(/[;,\n\r]+/).map(v => v.trim()).filter(Boolean);
    const unique = Array.from(new Set(values));
    return unique.join('; ');
  }

  // Get all drug data. Optional sampling is controlled by DRUG_SAMPLE_FRACTION.
  app.get('/api/drugs', (req, res) => {
    try {
      const allDrugs = getLoadedDrugData();
      // Use a seeded random for consistent new info dots
      const seededRandom = (id: string) => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
          hash = ((hash << 5) - hash) + id.charCodeAt(i);
          hash |= 0;
        }
        return Math.abs(hash);
      };
      
      // Prioritize drugs with summary deltas, then fill with others.
      const drugsWithDeltas = allDrugs.filter(d => getSummaryDelta(d.id) !== null);
      const drugsWithoutDeltas = allDrugs.filter(d => getSummaryDelta(d.id) === null);
      const targetCount = Math.ceil(allDrugs.length * sampleFraction);
      const remainingSlots = Math.max(0, targetCount - drugsWithDeltas.length);
      const selectedDrugs = [...drugsWithDeltas, ...drugsWithoutDeltas.slice(0, remainingSlots)];
      
      const drugs = selectedDrugs.map(drug => {
        const summaryDelta = getSummaryDelta(drug.id);
        
        // Generate random new info dots for ~15% of drugs (sparse but noticeable)
        const hash = seededRandom(drug.id);
        const hasNewInfo = injectDemoNewInfo && hash % 7 === 0; // Roughly 1 in 7 drugs when enabled
        
        // Pick random curated fields to mark as new (1-3 fields)
        const possibleNewFields = ['targetCurated', 'mechanismOfAction', 'companyCurated', 'countryCurated', 'summary'];
        const randomNewFields: string[] = [];
        if (hasNewInfo) {
          const numFields = (hash % 3) + 1; // 1-3 fields
          for (let i = 0; i < numFields && i < possibleNewFields.length; i++) {
            const fieldIndex = (hash + i * 17) % possibleNewFields.length;
            if (!randomNewFields.includes(possibleNewFields[fieldIndex])) {
              randomNewFields.push(possibleNewFields[fieldIndex]);
            }
          }
        }
        
        // Merge existing newFields with random ones
        const existingNewFields = Array.isArray(drug.newFields) ? drug.newFields : [];
        const mergedNewFields = Array.from(new Set([...existingNewFields, ...randomNewFields]));
        
        // Apply preferred terms to target names
        const rawTarget = String(drug.target || '');
        const targetParts = rawTarget.split(/[;,\n\r]+/).map(t => t.trim()).filter(Boolean);
        const preferredTargets = targetParts.map(t => getPreferredTerm(t));
        const uniquePreferredTargets = Array.from(new Set(preferredTargets));
        
        return {
          ...drug,
          inMidaxo: isInMidaxo(drug.id) ? 'yes' : 'no',
          // Add curated columns (deduplicated versions from raw Citeline data)
          // Use preferred synonym for targets when available
          targetCurated: uniquePreferredTargets.join('; '),
          companyCurated: deduplicateValues(String(drug.company || '')),
          countryCurated: deduplicateValues(String(drug.companyHqCountry || drug.drugCountry || '')),
          // Add summary delta as AI prediction (shown as green text)
          summaryDelta: summaryDelta?.newSummary || '',
          summaryDeltaConfidence: summaryDelta?.confidence || 0,
          // Merge existing and random new info dots
          newFields: mergedNewFields.length > 0 ? mergedNewFields : undefined,
        };
      });
      res.json(drugs);
    } catch (error) {
      console.error('Error fetching drugs:', error);
      res.status(500).json({ error: 'Failed to load drug data' });
    }
  });

  // Reload drug data from Excel (useful after file update)
  app.post('/api/drugs/reload', (req, res) => {
    try {
      const drugs = reloadDrugData(DATA_PATHS.drugDataExcel);
      res.json({ 
        success: true, 
        count: drugs.length,
        message: `Reloaded ${drugs.length} drugs from Excel`
      });
    } catch (error) {
      console.error('Error reloading drugs:', error);
      res.status(500).json({ error: 'Failed to reload drug data' });
    }
  });

  // Get synonyms for a target
  app.get('/api/targets/:name/synonyms', (req, res) => {
    try {
      const { name } = req.params;
      const synonyms = getTargetSynonyms(name);
      const canonical = findCanonicalTarget(name);
      const preferredTerm = getPreferredTerm(name);
      res.json({
        input: name,
        canonical: canonical || name,
        preferredTerm,
        synonyms,
      });
    } catch (error) {
      console.error('Error fetching target synonyms:', error);
      res.status(500).json({ error: 'Failed to get target synonyms' });
    }
  });

  // Get preferred term for any molecule/target name
  app.get('/api/preferred-term/:name', (req, res) => {
    try {
      const { name } = req.params;
      const preferredTerm = getPreferredTerm(name);
      res.json({
        input: name,
        preferredTerm,
        hasPreferred: preferredTerm !== name,
      });
    } catch (error) {
      console.error('Error fetching preferred term:', error);
      res.status(500).json({ error: 'Failed to get preferred term' });
    }
  });

  // Feedback submission endpoint (stores in memory for demo)
  const feedbackStore: Array<{
    timestamp: string;
    rowId: string;
    column: string;
    originalValue: string;
    feedback: string;
    useForTraining: boolean;
  }> = [];

  app.post('/api/feedback', (req, res) => {
    try {
      const { rowId, column, originalValue, feedback, useForTraining } = req.body;
      
      const entry = {
        timestamp: new Date().toISOString(),
        rowId,
        column,
        originalValue,
        feedback,
        useForTraining: Boolean(useForTraining),
      };
      
      feedbackStore.push(entry);
      console.log('Feedback received:', entry);
      
      res.json({ success: true, id: feedbackStore.length });
    } catch (error) {
      console.error('Error storing feedback:', error);
      res.status(500).json({ error: 'Failed to store feedback' });
    }
  });

  // Get all feedback (for admin/review purposes)
  app.get('/api/feedback', (req, res) => {
    res.json(feedbackStore);
  });

  const httpServer = createServer(app);

  return httpServer;
}
