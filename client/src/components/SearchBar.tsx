import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { getAllSearchableTerms, findCanonicalDrug, findCanonicalTarget } from "@/lib/tableConfig";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = "Search drugs, targets, synonyms..." }: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allTerms = getAllSearchableTerms();

  useEffect(() => {
    if (value.length >= 1) {
      const filtered = allTerms.filter(term => 
        term.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);
      setSuggestions(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (term: string) => {
    onChange(term);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  const getTermType = (term: string): string => {
    if (findCanonicalDrug(term)) return "Drug";
    if (findCanonicalTarget(term)) return "Target";
    return "Term";
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-10"
          data-testid="input-search"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            data-testid="button-clear-search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 overflow-hidden"
        >
          {suggestions.map((term, index) => (
            <button
              key={index}
              onClick={() => handleSelect(term)}
              className="w-full px-4 py-2 text-left text-sm hover-elevate flex items-center justify-between gap-2"
              data-testid={`suggestion-${index}`}
            >
              <span>{term}</span>
              <span className="text-xs text-muted-foreground">{getTermType(term)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
