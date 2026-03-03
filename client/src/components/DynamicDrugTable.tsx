import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUpDown, Info } from "lucide-react";
import { useState } from "react";
import { ColumnConfig, getAllTargetNames } from "@/lib/tableConfig";

export interface DrugEntry {
  id: string;
  isNew: boolean;
  [key: string]: string | boolean | undefined;
}

interface DynamicDrugTableProps {
  data: DrugEntry[];
  columns: ColumnConfig[];
}

export default function DynamicDrugTable({ data, columns }: DynamicDrugTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getStageColor = (stage: string) => {
    const stageLower = (stage || '').toLowerCase();
    if (stageLower.includes('approved')) {
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

  const newEntries = data.filter(d => d.isNew);
  const regularEntries = data.filter(d => !d.isNew);

  const renderCellContent = (drug: DrugEntry, column: ColumnConfig) => {
    const value = drug[column.key];
    if (value === undefined || value === null) return '-';
    
    const stringValue = String(value);

    // Special rendering for stage column
    if (column.key === 'stage') {
      return (
        <Badge
          variant="outline"
          className={getStageColor(stringValue)}
          data-testid={`badge-stage-${drug.id}`}
        >
          {stringValue}
        </Badge>
      );
    }

    // Special rendering for target column with synonym tooltip
    if (column.key === 'target') {
      const synonyms = getAllTargetNames(stringValue);
      const hasSynonyms = synonyms.length > 1;
      
      return (
        <div className="flex items-center gap-1">
          <span>{stringValue}</span>
          {hasSynonyms && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground" data-testid={`tooltip-synonyms-${drug.id}`}>
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div className="font-semibold mb-1">Also known as:</div>
                  {synonyms.slice(1).map((syn, idx) => (
                    <div key={idx}>{syn}</div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      );
    }

    return stringValue;
  };

  const renderRow = (drug: DrugEntry, index: number, isNewEntry: boolean) => (
    <tr
      key={drug.id}
      className={`border-b hover-elevate ${isNewEntry ? 'bg-primary/5' : index % 2 === 0 ? 'bg-muted/20' : ''}`}
      data-testid={`row-drug-${drug.id}`}
    >
      {columns.map((column, colIndex) => (
        <td
          key={column.key}
          className={`px-4 py-3 ${colIndex > 0 ? 'border-l' : ''} ${column.key === 'drugName' ? 'font-medium' : 'text-sm'}`}
          style={column.width ? { minWidth: column.width } : undefined}
          data-testid={`text-${column.key}-${drug.id}`}
        >
          {column.key === 'drugName' && isNewEntry ? (
            <div className="flex items-center gap-2">
              <Badge
                variant="default"
                className="text-xs font-bold px-1.5 py-0.5"
                data-testid="badge-new"
              >
                NEW
              </Badge>
              <span>{String(drug[column.key] || '')}</span>
            </div>
          ) : (
            renderCellContent(drug, column)
          )}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse" data-testid="table-drugs">
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((column, index) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-left ${index > 0 ? 'border-l' : ''}`}
                style={column.width ? { minWidth: column.width } : undefined}
              >
                {column.sortable ? (
                  <button
                    onClick={() => handleSort(column.key)}
                    className="flex items-center gap-2 font-semibold text-sm hover-elevate active-elevate-2 px-2 py-1 -mx-2 -my-1 rounded-md"
                    data-testid={`button-sort-${column.key}`}
                  >
                    {column.label}
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                  </button>
                ) : (
                  <span className="font-semibold text-sm">{column.label}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {newEntries.length > 0 && (
            <>
              {newEntries.map((drug, index) => renderRow(drug, index, true))}
              <tr>
                <td colSpan={columns.length} className="h-2 border-b-2 border-primary/20"></td>
              </tr>
            </>
          )}
          {regularEntries.map((drug, index) => renderRow(drug, index, false))}
        </tbody>
      </table>
    </div>
  );
}
