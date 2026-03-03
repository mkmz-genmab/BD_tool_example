import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface StatusToggleProps {
  value: string;
  onChange: (value: string) => void;
}

export default function StatusToggle({ value, onChange }: StatusToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(val) => val && onChange(val)}
      className="border rounded-md p-1"
    >
      <ToggleGroupItem
        value="all"
        className="text-xs px-3 py-1 h-7 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        data-testid="toggle-status-all"
      >
        All
      </ToggleGroupItem>
      <ToggleGroupItem
        value="active"
        className="text-xs px-3 py-1 h-7 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        data-testid="toggle-status-active"
      >
        Active
      </ToggleGroupItem>
      <ToggleGroupItem
        value="inactive"
        className="text-xs px-3 py-1 h-7 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        data-testid="toggle-status-inactive"
      >
        Inactive
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
