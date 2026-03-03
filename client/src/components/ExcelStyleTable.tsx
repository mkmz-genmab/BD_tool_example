import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUpDown, ArrowUp, ArrowDown, Info, Circle, GripVertical } from "lucide-react";
import { ColumnConfig, getAllDrugNames } from "@/lib/tableConfig";
import ColumnFilter from "./ColumnFilter";
import FeedbackContextMenu from "./FeedbackContextMenu";

export interface DrugEntry {
  id: string;
  isNew?: boolean;
  newFields?: string[]; // Fields that have new data (show dots)
  aiSummary?: string; // AI-enhanced summary text
  [key: string]: string | boolean | string[] | undefined;
}

interface ExcelStyleTableProps {
  data: DrugEntry[];
  columns: ColumnConfig[];
  columnFilters: Record<string, string[]>;
  onColumnFilterChange: (columnKey: string, values: string[]) => void;
  onColumnReorder?: (columns: ColumnConfig[]) => void;
}

// Target synonym tooltip component that fetches from API
function TargetSynonymTooltip({ targetName, drugId }: { targetName: string; drugId: string }) {
  const { data } = useQuery<{ synonyms: string[] }>({
    queryKey: ['/api/targets', targetName, 'synonyms'],
    enabled: !!targetName,
  });

  const synonyms = data?.synonyms || [];
  const hasSynonyms = synonyms.length > 1;

  if (!hasSynonyms) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="text-muted-foreground hover:text-foreground" data-testid={`tooltip-target-${drugId}`}>
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs">
          <div className="font-semibold mb-1">Also known as:</div>
          {synonyms.filter(s => s.toLowerCase() !== targetName.toLowerCase()).slice(0, 8).map((syn, idx) => (
            <div key={idx}>{syn}</div>
          ))}
          {synonyms.length > 9 && <div className="text-muted-foreground">+{synonyms.length - 9} more</div>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default function ExcelStyleTable({ 
  data, 
  columns,
  columnFilters,
  onColumnFilterChange,
  onColumnReorder,
}: ExcelStyleTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    cellInfo: { rowId: string; columnKey: string; value: string };
  } | null>(null);
  
  // Drag-and-drop state for column reordering
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);
  const [dragOverColumnIndex, setDragOverColumnIndex] = useState<number | null>(null);
  
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColumnIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    // Make the drag image semi-transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };
  
  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedColumnIndex(null);
    setDragOverColumnIndex(null);
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedColumnIndex !== null && index !== draggedColumnIndex) {
      setDragOverColumnIndex(index);
    }
  };
  
  const handleDragLeave = () => {
    setDragOverColumnIndex(null);
  };
  
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedColumnIndex === null || draggedColumnIndex === dropIndex) {
      setDraggedColumnIndex(null);
      setDragOverColumnIndex(null);
      return;
    }
    
    // Reorder columns
    const newColumns = [...columns];
    const [draggedColumn] = newColumns.splice(draggedColumnIndex, 1);
    newColumns.splice(dropIndex, 0, draggedColumn);
    
    if (onColumnReorder) {
      onColumnReorder(newColumns);
    }
    
    setDraggedColumnIndex(null);
    setDragOverColumnIndex(null);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    rowId: string,
    columnKey: string,
    value: string
  ) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      cellInfo: { rowId, columnKey, value },
    });
  };

  const getUniqueValues = (columnKey: string): string[] => {
    const values = new Set<string>();
    data.forEach(row => {
      const val = row[columnKey];
      if (val !== undefined && val !== null && typeof val === 'string' && val.trim()) {
        values.add(val);
      }
    });
    return Array.from(values).sort();
  };

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;
    
    return [...data].sort((a, b) => {
      const aVal = String(a[sortColumn] || '');
      const bVal = String(b[sortColumn] || '');
      const comparison = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  const getStageColor = (stage: string) => {
    const stageLower = (stage || '').toLowerCase();
    if (stageLower.includes('launched') || stageLower.includes('approved')) {
      return 'bg-primary/10 text-primary border-primary/20';
    }
    if (stageLower.includes('iii')) {
      return 'bg-chart-2/10 text-chart-2 border-chart-2/20';
    }
    if (stageLower.includes('ii')) {
      return 'bg-chart-3/10 text-chart-3 border-chart-3/20';
    }
    if (stageLower.includes('i')) {
      return 'bg-chart-4/10 text-chart-4 border-chart-4/20';
    }
    return 'bg-muted text-muted-foreground border-border';
  };

  // Detect column type from config or naming:
  // - isGuessed flag or "Guessed" prefix = AI prediction (purple)
  // - isCurated flag or "(Curated)" suffix = Human curated (teal/green)
  // - Otherwise = Original data (neutral)
  const getColumnType = (column: ColumnConfig): 'guessed' | 'curated' | 'original' => {
    if (column.isGuessed) return 'guessed';
    if (column.isCurated) return 'curated';
    
    const label = column.label.toLowerCase();
    const key = column.key.toLowerCase();
    
    if (label.startsWith('guessed') || key.startsWith('guessed')) {
      return 'guessed';
    }
    if (label.includes('(curated)') || label.endsWith('curated') || key.endsWith('curated')) {
      return 'curated';
    }
    return 'original';
  };

  // Column-based background colors (not row-based)
  // No more purple for guessed columns - they're now combined into curated columns
  const getColumnBgClass = (column: ColumnConfig) => {
    const type = getColumnType(column);
    if (type === 'curated') return 'bg-[hsl(var(--ai-column))]';
    return '';
  };

  const getHeaderBgClass = (column: ColumnConfig) => {
    const type = getColumnType(column);
    if (type === 'curated') return 'bg-[hsl(var(--ai-column-header))]';
    return 'bg-muted/50';
  };
  
  // Get badge label for column type (only for curated columns now)
  const getColumnTypeBadge = (column: ColumnConfig) => {
    const type = getColumnType(column);
    if (type === 'curated') {
      return { label: 'C', className: 'text-primary bg-primary/20' };
    }
    return null;
  };

  // Find corresponding Guessed column key for a Curated column
  // Uses explicit guessedColumnKey from config, or falls back to name matching
  const findGuessedColumnKey = (curatedColumn: ColumnConfig): string | null => {
    // First check explicit config
    if (curatedColumn.guessedColumnKey) {
      return curatedColumn.guessedColumnKey;
    }
    
    // Fall back to name matching
    const label = curatedColumn.label;
    const match = label.match(/^(.+?)\s*\(Curated\)$/i);
    if (match) {
      const fieldName = match[1].trim();
      const guessedKey = columns.find(c => 
        c.label.toLowerCase() === `guessed ${fieldName.toLowerCase()}` ||
        c.key.toLowerCase() === `guessed${fieldName.replace(/\s+/g, '').toLowerCase()}`
      )?.key;
      return guessedKey || null;
    }
    return null;
  };

  // Normalize value for comparison (trim, lowercase, handle empty)
  const normalizeValue = (val: string | undefined | null): string => {
    if (!val) return '';
    return String(val).trim().toLowerCase();
  };

  // Check if values are different (for AI vs Curated comparison)
  const valuesDisagree = (curatedVal: string, guessedVal: string): boolean => {
    const normCurated = normalizeValue(curatedVal);
    const normGuessed = normalizeValue(guessedVal);
    if (!normCurated || !normGuessed) return false; // Don't show disagreement if either is empty
    return normCurated !== normGuessed;
  };

  // New info dot component - larger and magenta colored
  const NewInfoDot = () => (
    <span 
      className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-[hsl(var(--new-info))] flex-shrink-0"
      title="New/updated information"
      data-testid="dot-new-info"
    >
      <Circle className="w-2 h-2 fill-current text-[hsl(var(--new-info-foreground))]" />
    </span>
  );

  const renderCellContent = (drug: DrugEntry, column: ColumnConfig) => {
    const value = drug[column.key];
    const isNewField = drug.newFields?.includes(column.key);
    const stringValue = String(value || '');
    
    // For curated columns, check if AI prediction exists before returning empty
    const columnType = getColumnType(column);
    const guessedKey = columnType === 'curated' ? findGuessedColumnKey(column) : null;
    const guessedValue = guessedKey ? String(drug[guessedKey] || '') : '';
    const hasAiPrediction = guessedKey && guessedValue.trim() !== '';
    
    // If curated is empty but AI prediction exists, show AI value in green
    if ((value === undefined || value === null || value === '' || stringValue.trim() === '') && hasAiPrediction) {
      const maxLen = 150;
      const truncatedAi = guessedValue.length > maxLen ? guessedValue.substring(0, maxLen) + '...' : guessedValue;
      const needsTooltip = guessedValue.length > maxLen;
      
      if (needsTooltip) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-start gap-2 cursor-help">
                {isNewField && <NewInfoDot />}
                <span className="text-sm text-emerald-600 dark:text-emerald-400 line-clamp-3">
                  <span className="font-semibold">AI:</span> {truncatedAi}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-md max-h-64 overflow-auto">
              <p className="text-xs whitespace-pre-wrap text-emerald-600 dark:text-emerald-400">
                <span className="font-semibold">AI Prediction:</span> {guessedValue}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      }
      
      return (
        <div className="flex items-start gap-2">
          {isNewField && <NewInfoDot />}
          <span className="text-sm text-emerald-600 dark:text-emerald-400">
            <span className="font-semibold">AI:</span> {guessedValue}
          </span>
        </div>
      );
    }
    
    // Return dash for truly empty cells (no curated, no AI)
    if (value === undefined || value === null || value === '' || stringValue.trim() === '') {
      return <span className="text-muted-foreground">-</span>;
    }

    // Summary column with AI delta displayed as green text
    if (column.key === 'summary') {
      const maxSummaryLength = 200;
      const aiDelta = String(drug.summaryDelta || '');
      const hasAiDelta = aiDelta.trim() !== '';
      const isSummaryTruncated = stringValue.length > maxSummaryLength;
      const displaySummary = isSummaryTruncated ? stringValue.substring(0, maxSummaryLength) + '...' : stringValue;
      const maxDeltaLength = 100;
      const isDeltaTruncated = aiDelta.length > maxDeltaLength;
      const displayDelta = isDeltaTruncated ? aiDelta.substring(0, maxDeltaLength) + '...' : aiDelta;
      
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-sm space-y-1 cursor-help max-w-xs">
              <div className="flex items-start gap-2">
                {isNewField && <NewInfoDot />}
                <span className="text-foreground line-clamp-3">{displaySummary}</span>
              </div>
              {hasAiDelta && (
                <div className="text-emerald-600 dark:text-emerald-400 text-xs font-medium pl-5 line-clamp-2">
                  <span className="font-semibold">AI:</span> {displayDelta}
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-lg max-h-80 overflow-auto">
            <div className="text-xs space-y-2">
              <p className="whitespace-pre-wrap">{stringValue}</p>
              {hasAiDelta && (
                <p className="text-emerald-600 dark:text-emerald-400 border-t pt-2">
                  <span className="font-semibold">AI Update:</span> {aiDelta}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }

    // Global status column
    if (column.key === 'globalStatus') {
      return (
        <div className="flex items-center gap-2">
          {isNewField && <NewInfoDot />}
          <Badge
            variant="outline"
            className={getStageColor(stringValue)}
            data-testid={`badge-status-${drug.id}`}
          >
            {stringValue}
          </Badge>
        </div>
      );
    }

    // Target curated column with synonym tooltip (from API)
    if (column.key === 'targetCurated' || column.key === 'target') {
      return (
        <div className="flex items-center gap-2">
          {isNewField && <NewInfoDot />}
          <span>{stringValue}</span>
          <TargetSynonymTooltip targetName={stringValue} drugId={drug.id} />
        </div>
      );
    }

    // Generic drug name with info bubble for synonyms
    if (column.key === 'genericDrugName') {
      const drugSynonyms = getAllDrugNames(stringValue);
      const drugNamesValue = String(drug.drugNames || '');
      const allNames = drugNamesValue ? drugNamesValue.split(/[;,]/).map(n => n.trim()).filter(Boolean) : [];
      const hasSynonyms = drugSynonyms.length > 1 || allNames.length > 0;
      
      return (
        <div className="flex items-center gap-2">
          {drug.isNew && (
            <Badge
              variant="default"
              className="text-[10px] font-bold px-1.5 py-0 bg-[hsl(var(--new-info))] text-[hsl(var(--new-info-foreground))] border-none"
              data-testid="badge-new"
            >
              NEW
            </Badge>
          )}
          <span className="font-medium">{stringValue}</span>
          {hasSynonyms && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-primary hover:text-primary/80" data-testid={`tooltip-drug-${drug.id}`}>
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="text-xs">
                  <div className="font-semibold mb-1">Alternative Names:</div>
                  <div className="space-y-0.5">
                    {allNames.length > 0 
                      ? allNames.slice(0, 10).map((name, idx) => <div key={idx}>{name}</div>)
                      : drugSynonyms.slice(1, 10).map((syn, idx) => <div key={idx}>{syn}</div>)
                    }
                    {allNames.length > 10 && <div className="text-muted-foreground">+{allNames.length - 10} more</div>}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      );
    }

    // Record URL column - make clickable
    if (column.key === 'recordUrl' && stringValue.trim()) {
      const url = stringValue.startsWith('http') ? stringValue : `https://${stringValue}`;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 hover:underline text-sm truncate block max-w-[200px]"
          data-testid={`link-record-${drug.id}`}
        >
          View Record
        </a>
      );
    }

    // For curated columns, we already computed these at top of function
    const hasCuratedValue = stringValue.trim() !== '';
    const hasDisagreement = hasAiPrediction && hasCuratedValue && valuesDisagree(stringValue, guessedValue);

    // Default rendering with new dot - truncate long text
    const maxLength = 150;
    const isTruncated = stringValue.length > maxLength;
    const displayText = isTruncated ? stringValue.substring(0, maxLength) + '...' : stringValue;
    
    // Render AI prediction in green text below curated (only when both exist)
    const renderAiPrediction = () => {
      if (!hasAiPrediction || !hasCuratedValue) return null;
      const truncatedGuessed = guessedValue.length > 80 ? guessedValue.substring(0, 80) + '...' : guessedValue;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-[11px] mt-1 text-emerald-600 dark:text-emerald-400 cursor-help">
              <span className="font-semibold">AI:</span> {truncatedGuessed}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-md">
            <div className="text-xs space-y-1">
              <p><span className="font-semibold">AI Prediction:</span> {guessedValue}</p>
              <p><span className="font-semibold">Curated:</span> {stringValue}</p>
              {hasDisagreement && <p className="text-amber-600 dark:text-amber-400 font-medium">Values differ</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      );
    };
    
    if (isTruncated) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">
              <div className="flex items-start gap-2">
                {isNewField && <NewInfoDot />}
                <span className="text-sm line-clamp-3">{displayText}</span>
              </div>
              {renderAiPrediction()}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-md max-h-64 overflow-auto">
            <div className="text-xs space-y-2">
              <p className="whitespace-pre-wrap">{stringValue}</p>
              {hasAiPrediction && (
                <p className="text-emerald-600 dark:text-emerald-400 border-t pt-2">
                  <span className="font-semibold">AI Prediction:</span> {guessedValue}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }
    
    return (
      <div>
        <div className="flex items-start gap-2">
          {isNewField && <NewInfoDot />}
          <span className="text-sm">{stringValue}</span>
        </div>
        {renderAiPrediction()}
      </div>
    );
  };

  return (
    <>
      <div className="overflow-auto">
        <table className="w-full border-collapse table-fixed" data-testid="table-drugs">
          <thead className="sticky top-0 z-10">
            <tr className="border-b">
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`px-3 py-2 text-left overflow-hidden cursor-grab active:cursor-grabbing transition-all ${
                    index > 0 ? 'border-l border-border' : ''
                  } ${getHeaderBgClass(column)} ${
                    dragOverColumnIndex === index ? 'ring-2 ring-primary ring-inset bg-primary/10' : ''
                  } ${draggedColumnIndex === index ? 'opacity-50' : ''}`}
                  style={column.width ? { width: column.width, minWidth: column.width, maxWidth: column.width } : { minWidth: '100px' }}
                >
                  <div className="flex items-center gap-1">
                    <GripVertical className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="flex items-center gap-1 font-semibold text-xs hover-elevate active-elevate-2 px-1 py-0.5 -mx-1 -my-0.5 rounded"
                        data-testid={`button-sort-${column.key}`}
                      >
                        {column.label}
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    ) : (
                      <span className="font-semibold text-xs">{column.label}</span>
                    )}
                    {column.filterable && (
                      <ColumnFilter
                        columnKey={column.key}
                        columnLabel={column.label}
                        uniqueValues={getUniqueValues(column.key)}
                        selectedValues={columnFilters[column.key] || []}
                        onFilterChange={onColumnFilterChange}
                      />
                    )}
                    {(() => {
                      const badge = getColumnTypeBadge(column);
                      if (!badge) return null;
                      const tooltipText = getColumnType(column) === 'guessed' 
                        ? 'AI prediction (unverified)' 
                        : 'Human curated';
                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={`text-[10px] font-bold px-1 rounded ${badge.className}`}>{badge.label}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <span className="text-xs">{tooltipText}</span>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })()}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((drug, rowIndex) => (
              <tr
                key={drug.id}
                className={`border-b hover:bg-muted/20 ${rowIndex % 2 === 0 ? '' : 'bg-muted/5'}`}
                data-testid={`row-drug-${drug.id}`}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={column.key}
                    className={`px-3 py-2 align-top overflow-hidden ${colIndex > 0 ? 'border-l border-border' : ''} ${getColumnBgClass(column)}`}
                    style={column.width ? { width: column.width, minWidth: column.width, maxWidth: column.width } : { minWidth: '100px' }}
                    onContextMenu={(e) => handleContextMenu(e, drug.id, column.key, String(drug[column.key] || ''))}
                    data-testid={`cell-${column.key}-${drug.id}`}
                  >
                    {renderCellContent(drug, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contextMenu && (
        <FeedbackContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          cellInfo={contextMenu.cellInfo}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
