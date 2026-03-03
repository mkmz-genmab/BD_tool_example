import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface DrugFiltersProps {
  targetFilter: string;
  stageFilter: string;
  moleculeFilter: string;
  onTargetChange: (value: string) => void;
  onStageChange: (value: string) => void;
  onMoleculeChange: (value: string) => void;
  onClearFilters: () => void;
}

export default function DrugFilters({
  targetFilter,
  stageFilter,
  moleculeFilter,
  onTargetChange,
  onStageChange,
  onMoleculeChange,
  onClearFilters,
}: DrugFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-6 p-6 border-b bg-card">
      <div className="flex-1 min-w-[200px]">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 block">
          Target
        </Label>
        <Select value={targetFilter} onValueChange={onTargetChange}>
          <SelectTrigger data-testid="select-target" className="w-full">
            <SelectValue placeholder="All targets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All targets</SelectItem>
            <SelectItem value="egfr">EGFR</SelectItem>
            <SelectItem value="pd1">PD-1</SelectItem>
            <SelectItem value="her2">HER2</SelectItem>
            <SelectItem value="bcr-abl">BCR-ABL</SelectItem>
            <SelectItem value="vegf">VEGF</SelectItem>
            <SelectItem value="cd20">CD20</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 block">
          Stage of Development
        </Label>
        <Select value={stageFilter} onValueChange={onStageChange}>
          <SelectTrigger data-testid="select-stage" className="w-full">
            <SelectValue placeholder="All stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            <SelectItem value="preclinical">Preclinical</SelectItem>
            <SelectItem value="phase1">Phase I</SelectItem>
            <SelectItem value="phase2">Phase II</SelectItem>
            <SelectItem value="phase3">Phase III</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 block">
          Molecule Type
        </Label>
        <Select value={moleculeFilter} onValueChange={onMoleculeChange}>
          <SelectTrigger data-testid="select-molecule" className="w-full">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="small-molecule">Small Molecule</SelectItem>
            <SelectItem value="monoclonal-antibody">Monoclonal Antibody</SelectItem>
            <SelectItem value="biologic">Biologic</SelectItem>
            <SelectItem value="gene-therapy">Gene Therapy</SelectItem>
            <SelectItem value="vaccine">Vaccine</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          data-testid="button-clear-filters"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
