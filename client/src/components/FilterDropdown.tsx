import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, X, Search } from "lucide-react";

interface FilterDropdownProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  testId?: string;
}

export default function FilterDropdown({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = "Search...",
  testId,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(opt => opt.toLowerCase().includes(term));
  }, [options, searchTerm]);

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const handleSelectAll = () => {
    onChange(filteredOptions);
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-[200px] justify-between text-left font-normal h-8"
            data-testid={testId}
          >
            <span className="truncate text-xs">
              {selectedValues.length === 0 ? (
                <span className="text-muted-foreground">All</span>
              ) : selectedValues.length === 1 ? (
                selectedValues[0]
              ) : (
                `${selectedValues.length} selected`
              )}
            </span>
            <ChevronDown className="h-3.5 w-3.5 opacity-50 flex-shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs"
                data-testid={`${testId}-search`}
              />
            </div>
          </div>
          
          <div className="p-2 border-b flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="h-6 text-xs px-2"
              data-testid={`${testId}-select-all`}
            >
              Select All ({filteredOptions.length})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 text-xs px-2"
              data-testid={`${testId}-clear`}
            >
              Clear
            </Button>
          </div>

          <ScrollArea className="h-[200px]">
            <div className="p-2 space-y-1">
              {filteredOptions.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover-elevate"
                    data-testid={`${testId}-option-${option.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    <Checkbox
                      checked={selectedValues.includes(option)}
                      onCheckedChange={() => handleToggle(option)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-xs truncate flex-1">{option}</span>
                  </label>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selectedValues.slice(0, 2).map((val) => (
            <Badge
              key={val}
              variant="secondary"
              className="text-[10px] h-5 px-1.5 gap-1"
            >
              <span className="truncate max-w-[80px]">{val}</span>
              <X
                className="h-2.5 w-2.5 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(val);
                }}
              />
            </Badge>
          ))}
          {selectedValues.length > 2 && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
              +{selectedValues.length - 2} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
