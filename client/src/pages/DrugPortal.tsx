import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "@/components/SearchBar";
import StatusToggle from "@/components/StatusToggle";
import FilterDropdown from "@/components/FilterDropdown";
import ExcelStyleTable, { DrugEntry } from "@/components/ExcelStyleTable";
import LegendModal from "@/components/LegendModal";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, LayoutList, LayoutGrid, RefreshCw, Loader2 } from "lucide-react";
import { conciseColumns, detailedColumns, ColumnConfig } from "@/lib/tableConfig";
import { useToast } from "@/hooks/use-toast";

export default function DrugPortal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [viewMode, setViewMode] = useState<"detailed" | "concise">("detailed");
  const [detailedColumnOrder, setDetailedColumnOrder] = useState<ColumnConfig[]>(detailedColumns);
  const [conciseColumnOrder, setConciseColumnOrder] = useState<ColumnConfig[]>(conciseColumns);
  const [targetFilter, setTargetFilter] = useState<string[]>([]);
  const [moleculeTypeFilter, setMoleculeTypeFilter] = useState<string[]>([]);
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch drug data from API
  const { data: drugData = [], isLoading, refetch, isRefetching } = useQuery<DrugEntry[]>({
    queryKey: ['/api/drugs'],
  });

  // Fallback mock data if API returns empty
  const mockData: DrugEntry[] = [
    {
      id: "491",
      citelineDrugId: "491",
      genericDrugName: "panitumumab",
      drugNames: "ABX EGF; ABX-EGF; AMG 954; Vectibix",
      globalStatus: "Launched",
      dateAdded: "2025-02-15",
      moleculeTypeCurated: "Protein--mAb",
      targetCurated: "EGFR",
      payloadCurated: "",
      companyCurated: "Amgen, Beta Pharma, GSK, Takeda",
      drugDiseaseCurated: "Cancer, colorectal",
      drugCountryCurated: "USA, UK, Japan, India",
      company: "Amgen",
      companyHqCountry: "USA",
      drugDisease: "Cancer, colorectal",
      drugDiseaseGroup: "Anticancer",
      originatorLicensee: "Originator",
      drugCountry: "USA; UK; Japan",
      mechanismOfAction: "EGFR antagonist",
      summary: "Panitumumab (ABX-EGF) is a fully human IgG2 MAb against EGFR, developed by Amgen for the treatment of cancer.",
      aiSummary: "First-in-class fully human anti-EGFR antibody with companion diagnostic for colorectal cancer.",
      developmentStatus: "Active",
      latestChangeDate: "2025-03-07",
      latestChange: "Ongoing development confirmed",
      drugType: "Biological > Protein",
      target: "EGFR",
      status: "Active",
      isNew: true,
      newFields: ["latestChange", "aiSummary"],
    },
    {
      id: "2001",
      citelineDrugId: "2001",
      genericDrugName: "pembrolizumab",
      drugNames: "Keytruda; MK-3475; Lambrolizumab",
      globalStatus: "Launched",
      moleculeTypeCurated: "Protein--mAb",
      targetCurated: "PD-1",
      companyCurated: "Merck & Co.",
      drugDiseaseCurated: "Melanoma; NSCLC; Head and Neck Cancer",
      company: "Merck & Co.",
      mechanismOfAction: "PD-1 antagonist",
      summary: "Pembrolizumab is a humanized IgG4 monoclonal antibody against PD-1 for multiple cancer types.",
      aiSummary: "Leading checkpoint inhibitor with broadest FDA-approved indications in oncology.",
      developmentStatus: "Active",
      target: "PD-1",
      status: "Active",
      isNew: true,
      newFields: ["drugDiseaseCurated", "latestChange"],
    },
    {
      id: "2002",
      citelineDrugId: "2002",
      genericDrugName: "trastuzumab deruxtecan",
      drugNames: "Enhertu; DS-8201; T-DXd",
      globalStatus: "Launched",
      moleculeTypeCurated: "ADC",
      targetCurated: "HER2",
      payloadCurated: "chemo - topo 1 inhibitor - DXd",
      companyCurated: "Daiichi Sankyo, AstraZeneca",
      drugDiseaseCurated: "Breast Cancer; Gastric Cancer; NSCLC",
      company: "Daiichi Sankyo",
      mechanismOfAction: "HER2 antagonist; Topoisomerase I inhibitor",
      summary: "Trastuzumab deruxtecan is an antibody-drug conjugate targeting HER2 with a topoisomerase I inhibitor payload.",
      aiSummary: "Breakthrough ADC with bystander effect showing activity in HER2-low tumors.",
      developmentStatus: "Active",
      target: "HER2",
      status: "Active",
      isNew: false,
      newFields: ["payloadCurated"],
    },
  ];

  const displayData = drugData.length > 0 ? drugData : mockData;

  const handleColumnFilterChange = (columnKey: string, values: string[]) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnKey]: values,
    }));
  };

  const activeColumns = viewMode === "detailed" ? detailedColumnOrder : conciseColumnOrder;
  
  const handleColumnReorder = (newColumns: ColumnConfig[]) => {
    if (viewMode === "detailed") {
      setDetailedColumnOrder(newColumns);
    } else {
      setConciseColumnOrder(newColumns);
    }
  };

  // Helper to extract targets from a drug entry
  const extractTargets = (drug: DrugEntry): string[] => {
    // Prefer curated target, fall back to raw target
    const targetValue = String(drug.targetCurated || drug.target || '').trim();
    if (!targetValue || targetValue === 'Unspecified') return [];
    // Split by newline or semicolon for multi-target entries
    return targetValue.split(/[\n;]/).map(t => t.trim()).filter(t => t && t !== 'Unspecified');
  };

  // Extract unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    const targets = new Set<string>();
    const moleculeTypes = new Set<string>();
    const stages = new Set<string>();

    displayData.forEach((drug) => {
      // Target - use curated first, fall back to raw
      extractTargets(drug).forEach(t => targets.add(t));

      // Molecule type - use GuessedMoleculeType or MoleculeTypeCurated
      const moleculeType = String(drug.GuessedMoleculeType || drug.MoleculeTypeCurated || drug.moleculeTypeCurated || '').trim();
      if (moleculeType) moleculeTypes.add(moleculeType);

      // Stage - use globalStatus
      const stage = String(drug.globalStatus || '').trim();
      if (stage) stages.add(stage);
    });

    return {
      targets: Array.from(targets).sort(),
      moleculeTypes: Array.from(moleculeTypes).sort(),
      stages: Array.from(stages).sort(),
    };
  }, [displayData]);

  const filteredData = useMemo(() => {
    return displayData.filter((drug) => {
      // Search filter (drug name, synonyms, target)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const drugNameMatch = String(drug.genericDrugName || '').toLowerCase().includes(query);
        const drugNamesMatch = String(drug.drugNames || '').toLowerCase().includes(query);
        const targetMatch = String(drug.targetCurated || '').toLowerCase().includes(query);
        const targetRawMatch = String(drug.target || '').toLowerCase().includes(query);
        const companyMatch = String(drug.companyCurated || drug.company || '').toLowerCase().includes(query);
        
        if (!drugNameMatch && !drugNamesMatch && !targetMatch && !targetRawMatch && !companyMatch) {
          return false;
        }
      }

      // Status filter (legacy toggle)
      if (statusFilter !== "all") {
        const drugStatus = String(drug.developmentStatus || drug.status || '').toLowerCase();
        if (statusFilter === "active" && drugStatus !== "active") return false;
        if (statusFilter === "inactive" && drugStatus !== "inactive") return false;
      }

      // Target filter
      if (targetFilter.length > 0) {
        const drugTargets = extractTargets(drug);
        const hasMatch = targetFilter.some(tf => drugTargets.includes(tf));
        if (!hasMatch) return false;
      }

      // Molecule type filter
      if (moleculeTypeFilter.length > 0) {
        const drugMoleculeType = String(drug.GuessedMoleculeType || drug.MoleculeTypeCurated || drug.moleculeTypeCurated || '').trim();
        if (!moleculeTypeFilter.includes(drugMoleculeType)) return false;
      }

      // Stage filter
      if (stageFilter.length > 0) {
        const drugStage = String(drug.globalStatus || '').trim();
        if (!stageFilter.includes(drugStage)) return false;
      }

      // Column filters
      for (const [columnKey, selectedValues] of Object.entries(columnFilters)) {
        if (selectedValues.length > 0) {
          const cellValue = String(drug[columnKey] || '');
          if (!selectedValues.includes(cellValue)) {
            return false;
          }
        }
      }

      return true;
    });
  }, [searchQuery, statusFilter, targetFilter, moleculeTypeFilter, stageFilter, columnFilters, displayData]);

  const handleExport = () => {
    const exportData = filteredData.map(row => {
      const exportRow: Record<string, string> = {};
      activeColumns.forEach(col => {
        exportRow[col.label] = String(row[col.key] || '');
      });
      return exportRow;
    });
    
    console.log('Exporting filtered view:', exportData.length, 'rows');
    
    toast({
      title: "Export Ready",
      description: `${exportData.length} rows exported to console (demo mode)`,
    });
  };

  const handleReload = async () => {
    try {
      const res = await fetch('/api/drugs/reload', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        await refetch();
        toast({
          title: "Data Reloaded",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        title: "Reload Failed",
        description: "Could not reload data from Excel",
        variant: "destructive",
      });
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTargetFilter([]);
    setMoleculeTypeFilter([]);
    setStageFilter([]);
    setColumnFilters({});
    toast({
      title: "Filters cleared",
      description: "All filters have been reset",
    });
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || 
    targetFilter.length > 0 || moleculeTypeFilter.length > 0 || stageFilter.length > 0 ||
    Object.values(columnFilters).some(v => v.length > 0);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Demo Snapshot Notice */}
      <div className="bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-center text-sm" data-testid="banner-demo-notice">
        <span className="text-amber-800 dark:text-amber-200 font-medium">
          Demo snapshot - ~1/10 of dataset loaded
        </span>
        <span className="text-amber-600 dark:text-amber-400 ml-3">
          Data as of Dec 2025
        </span>
      </div>
      
      {/* Header */}
      <header className="border-b bg-background px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold" data-testid="text-title">Drug Database Portal</h1>
          <p className="text-xs text-muted-foreground mt-0.5" data-testid="text-count">
            {isLoading ? 'Loading...' : `Showing ${filteredData.length} of ${displayData.length} entries`}
            {drugData.length === 0 && !isLoading && ' (demo data)'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <ToggleGroup 
              type="single" 
              value={viewMode} 
              onValueChange={(val) => val && setViewMode(val as "detailed" | "concise")}
              className="border rounded-md"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value="detailed"
                    className="px-3 py-1.5 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground gap-1.5"
                    data-testid="toggle-detailed-view"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Detailed
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Show all columns including raw Citeline data</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value="concise"
                    className="px-3 py-1.5 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground gap-1.5"
                    data-testid="toggle-concise-view"
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                    Concise
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Show only essential columns for quick review</p>
                </TooltipContent>
              </Tooltip>
            </ToggleGroup>
          </div>
          
          <LegendModal />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={handleReload} 
                size="sm" 
                variant="outline"
                disabled={isRefetching}
                data-testid="button-reload"
              >
                {isRefetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Reload data from Excel file</p>
            </TooltipContent>
          </Tooltip>
          
          <Button onClick={handleExport} size="sm" data-testid="button-export" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="border-b bg-card px-4 py-3 space-y-3">
        {/* Row 1: Search and Status */}
        <div className="flex flex-wrap items-center gap-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search drugs, targets, synonyms..."
          />
          
          <StatusToggle value={statusFilter} onChange={setStatusFilter} />
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground text-xs"
              data-testid="button-clear-all-filters"
            >
              Clear all filters
            </Button>
          )}

          <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-4 bg-[hsl(var(--ai-column))] rounded border"></span> Curated
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-4 bg-muted/50 rounded border"></span> Original
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">AI:</span> AI Prediction
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[hsl(var(--new-info))]"></span> New info
            </span>
            <span>Right-click for feedback</span>
          </div>
        </div>

        {/* Row 2: Target, Molecule Type, Stage Filters */}
        <div className="flex flex-wrap items-end gap-4">
          <FilterDropdown
            label="Target"
            options={filterOptions.targets}
            selectedValues={targetFilter}
            onChange={setTargetFilter}
            placeholder="Search targets..."
            testId="filter-target"
          />
          
          <FilterDropdown
            label="Molecule Type"
            options={filterOptions.moleculeTypes}
            selectedValues={moleculeTypeFilter}
            onChange={setMoleculeTypeFilter}
            placeholder="Search molecule types..."
            testId="filter-molecule-type"
          />
          
          <FilterDropdown
            label="Stage of Development"
            options={filterOptions.stages}
            selectedValues={stageFilter}
            onChange={setStageFilter}
            placeholder="Search stages..."
            testId="filter-stage"
          />
        </div>
      </div>

      {/* Data Table */}
      <main className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ExcelStyleTable
            data={filteredData}
            columns={activeColumns}
            columnFilters={columnFilters}
            onColumnFilterChange={handleColumnFilterChange}
            onColumnReorder={handleColumnReorder}
          />
        )}
      </main>
    </div>
  );
}
