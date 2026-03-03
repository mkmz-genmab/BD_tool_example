import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Filter, X } from "lucide-react";

interface ColumnFilterProps {
  columnKey: string;
  columnLabel: string;
  uniqueValues: string[];
  selectedValues: string[];
  onFilterChange: (columnKey: string, values: string[]) => void;
}

export default function ColumnFilter({
  columnKey,
  columnLabel,
  uniqueValues,
  selectedValues,
  onFilterChange,
}: ColumnFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredValues = uniqueValues.filter(val => 
    val.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleToggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onFilterChange(columnKey, selectedValues.filter(v => v !== value));
    } else {
      onFilterChange(columnKey, [...selectedValues, value]);
    }
  };

  const handleSelectAll = () => {
    onFilterChange(columnKey, [...filteredValues]);
  };

  const handleClearAll = () => {
    onFilterChange(columnKey, []);
  };

  const hasActiveFilter = selectedValues.length > 0 && selectedValues.length < uniqueValues.length;

  const dropdownContent = isOpen ? (
    <div
      ref={dropdownRef}
      className="fixed w-64 bg-popover border rounded-md shadow-lg z-[9999]"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
      }}
    >
      <div className="p-2 border-b">
        <Input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder={`Search ${columnLabel}...`}
          className="h-8 text-sm"
          data-testid={`input-filter-search-${columnKey}`}
        />
      </div>

      <div className="p-2 border-b flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-xs h-7">
          Select All
        </Button>
        <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-xs h-7">
          Clear
        </Button>
        {hasActiveFilter && (
          <span className="text-xs text-muted-foreground ml-auto">
            {selectedValues.length} selected
          </span>
        )}
      </div>

      <ScrollArea className="h-48">
        <div className="p-2 space-y-1">
          {filteredValues.map((value, index) => (
            <label
              key={index}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover-elevate cursor-pointer text-sm"
            >
              <Checkbox
                checked={selectedValues.length === 0 || selectedValues.includes(value)}
                onCheckedChange={() => handleToggleValue(value)}
                data-testid={`checkbox-filter-${columnKey}-${index}`}
              />
              <span className="truncate">{value || "(blank)"}</span>
            </label>
          ))}
          {filteredValues.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No matches found</p>
          )}
        </div>
      </ScrollArea>
    </div>
  ) : null;

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1 rounded hover-elevate ${hasActiveFilter ? 'text-primary' : 'text-muted-foreground'}`}
        data-testid={`button-filter-${columnKey}`}
      >
        <Filter className="h-3 w-3" />
      </button>

      {dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  );
}
