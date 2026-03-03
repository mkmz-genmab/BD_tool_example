import DrugFilters from '../DrugFilters';
import { useState } from 'react';

export default function DrugFiltersExample() {
  const [targetFilter, setTargetFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [moleculeFilter, setMoleculeFilter] = useState("all");

  const handleClearFilters = () => {
    setTargetFilter("all");
    setStageFilter("all");
    setMoleculeFilter("all");
  };

  return (
    <DrugFilters
      targetFilter={targetFilter}
      stageFilter={stageFilter}
      moleculeFilter={moleculeFilter}
      onTargetChange={setTargetFilter}
      onStageChange={setStageFilter}
      onMoleculeChange={setMoleculeFilter}
      onClearFilters={handleClearFilters}
    />
  );
}
