import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";

export interface DrugEntry {
  id: string;
  drugName: string;
  target: string;
  stage: string;
  moleculeType: string;
  company: string;
  indication: string;
  isNew: boolean;
}

interface DrugTableProps {
  data: DrugEntry[];
}

export default function DrugTable({ data }: DrugTableProps) {
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
    switch (stage.toLowerCase()) {
      case 'approved':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'phase iii':
        return 'bg-chart-2/10 text-chart-2 border-chart-2/20';
      case 'phase ii':
        return 'bg-chart-3/10 text-chart-3 border-chart-3/20';
      case 'phase i':
        return 'bg-chart-4/10 text-chart-4 border-chart-4/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const newEntries = data.filter(d => d.isNew);
  const regularEntries = data.filter(d => !d.isNew);
  const sortedData = [...newEntries, ...regularEntries];

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse" data-testid="table-drugs">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left">
              <button
                onClick={() => handleSort('drugName')}
                className="flex items-center gap-2 font-semibold text-sm hover-elevate active-elevate-2 px-2 py-1 -mx-2 -my-1 rounded-md"
                data-testid="button-sort-drugname"
              >
                Drug Name
                <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </th>
            <th className="px-4 py-3 text-left border-l">
              <button
                onClick={() => handleSort('target')}
                className="flex items-center gap-2 font-semibold text-sm hover-elevate active-elevate-2 px-2 py-1 -mx-2 -my-1 rounded-md"
                data-testid="button-sort-target"
              >
                Target
                <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </th>
            <th className="px-4 py-3 text-left border-l">
              <button
                onClick={() => handleSort('stage')}
                className="flex items-center gap-2 font-semibold text-sm hover-elevate active-elevate-2 px-2 py-1 -mx-2 -my-1 rounded-md"
                data-testid="button-sort-stage"
              >
                Stage of Development
                <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </th>
            <th className="px-4 py-3 text-left border-l">
              <button
                onClick={() => handleSort('moleculeType')}
                className="flex items-center gap-2 font-semibold text-sm hover-elevate active-elevate-2 px-2 py-1 -mx-2 -my-1 rounded-md"
                data-testid="button-sort-molecule"
              >
                Molecule Type
                <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </th>
            <th className="px-4 py-3 text-left border-l">
              <button
                onClick={() => handleSort('company')}
                className="flex items-center gap-2 font-semibold text-sm hover-elevate active-elevate-2 px-2 py-1 -mx-2 -my-1 rounded-md"
                data-testid="button-sort-company"
              >
                Company
                <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </th>
            <th className="px-4 py-3 text-left border-l">
              <button
                onClick={() => handleSort('indication')}
                className="flex items-center gap-2 font-semibold text-sm hover-elevate active-elevate-2 px-2 py-1 -mx-2 -my-1 rounded-md"
                data-testid="button-sort-indication"
              >
                Indication
                <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {newEntries.length > 0 && (
            <>
              {newEntries.map((drug, index) => (
                <tr
                  key={drug.id}
                  className="border-b hover-elevate bg-primary/5"
                  data-testid={`row-drug-${drug.id}`}
                >
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="default"
                        className="text-xs font-bold px-1.5 py-0.5"
                        data-testid="badge-new"
                      >
                        NEW
                      </Badge>
                      <span data-testid={`text-drugname-${drug.id}`}>{drug.drugName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-l" data-testid={`text-target-${drug.id}`}>
                    {drug.target}
                  </td>
                  <td className="px-4 py-3 border-l">
                    <Badge
                      variant="outline"
                      className={getStageColor(drug.stage)}
                      data-testid={`badge-stage-${drug.id}`}
                    >
                      {drug.stage}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 border-l text-sm" data-testid={`text-molecule-${drug.id}`}>
                    {drug.moleculeType}
                  </td>
                  <td className="px-4 py-3 border-l text-sm" data-testid={`text-company-${drug.id}`}>
                    {drug.company}
                  </td>
                  <td className="px-4 py-3 border-l text-sm" data-testid={`text-indication-${drug.id}`}>
                    {drug.indication}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={6} className="h-2 border-b-2 border-primary/20"></td>
              </tr>
            </>
          )}
          {regularEntries.map((drug, index) => (
            <tr
              key={drug.id}
              className={`border-b hover-elevate ${index % 2 === 0 ? 'bg-muted/20' : ''}`}
              data-testid={`row-drug-${drug.id}`}
            >
              <td className="px-4 py-3 font-medium" data-testid={`text-drugname-${drug.id}`}>
                {drug.drugName}
              </td>
              <td className="px-4 py-3 border-l" data-testid={`text-target-${drug.id}`}>
                {drug.target}
              </td>
              <td className="px-4 py-3 border-l">
                <Badge
                  variant="outline"
                  className={getStageColor(drug.stage)}
                  data-testid={`badge-stage-${drug.id}`}
                >
                  {drug.stage}
                </Badge>
              </td>
              <td className="px-4 py-3 border-l text-sm" data-testid={`text-molecule-${drug.id}`}>
                {drug.moleculeType}
              </td>
              <td className="px-4 py-3 border-l text-sm" data-testid={`text-company-${drug.id}`}>
                {drug.company}
              </td>
              <td className="px-4 py-3 border-l text-sm" data-testid={`text-indication-${drug.id}`}>
                {drug.indication}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
