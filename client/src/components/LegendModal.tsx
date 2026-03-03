import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HelpCircle, Circle, Info, Lightbulb } from "lucide-react";

export default function LegendModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" data-testid="button-legend">
          <HelpCircle className="h-4 w-4" />
          Legend
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Classification Guide & Legend</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="molecule" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="molecule" data-testid="tab-molecule">Molecule Type</TabsTrigger>
            <TabsTrigger value="payload" data-testid="tab-payload">Payload Type</TabsTrigger>
            <TabsTrigger value="conditional" data-testid="tab-conditional">Conditional Activation</TabsTrigger>
            <TabsTrigger value="targets" data-testid="tab-targets">Targets</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[65vh] mt-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div>
                <h4 className="font-semibold text-lg mb-3">Visual Indicators</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 space-y-3">
                    <h5 className="font-medium">Column Colors</h5>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[hsl(var(--ai-column))] rounded border"></div>
                      <div>
                        <div className="text-sm font-medium">AI-Curated Column</div>
                        <div className="text-xs text-muted-foreground">Green/teal background indicates AI-enhanced data</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted/50 rounded border"></div>
                      <div>
                        <div className="text-sm font-medium">Raw Citeline Column</div>
                        <div className="text-xs text-muted-foreground">Gray background indicates original Citeline data</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 space-y-3">
                    <h5 className="font-medium">Status Indicators</h5>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[hsl(var(--new-info))]">
                        <Circle className="w-2.5 h-2.5 fill-current text-[hsl(var(--new-info-foreground))]" />
                      </span>
                      <div>
                        <div className="text-sm font-medium">New/Updated Info</div>
                        <div className="text-xs text-muted-foreground">Magenta dot indicates recently added or updated data</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">AI:</span>
                      <div>
                        <div className="text-sm font-medium">AI Prediction</div>
                        <div className="text-xs text-muted-foreground">Green text shows AI-predicted value when different from curated</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Info className="h-4 w-4 text-primary" />
                      <div>
                        <div className="text-sm font-medium">Info Bubble</div>
                        <div className="text-xs text-muted-foreground">Click for additional details (synonyms, metadata)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-3">Column Types</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Appearance</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">AI-Curated</TableCell>
                      <TableCell><span className="px-2 py-1 bg-[hsl(var(--ai-column))] rounded text-xs">Green/Teal</span></TableCell>
                      <TableCell className="text-sm">Data enhanced or standardized by AI processing</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Raw Citeline</TableCell>
                      <TableCell><span className="px-2 py-1 bg-muted/50 rounded text-xs">Gray</span></TableCell>
                      <TableCell className="text-sm">Original data from Citeline without AI processing</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-3">Interactions</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Right-click any cell:</span>
                    <span className="text-muted-foreground">Provide feedback on the data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Click info icon:</span>
                    <span className="text-muted-foreground">View drug synonyms and additional metadata</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Click column filter icon:</span>
                    <span className="text-muted-foreground">Filter by specific values (Excel-style)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Drag column headers:</span>
                    <span className="text-muted-foreground">Reorder columns by dragging</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Molecule Type Tab */}
            <TabsContent value="molecule" className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-yellow-700 dark:text-yellow-400">Molecule Type</h3>
                <p className="text-sm text-muted-foreground">
                  <span className="text-yellow-600 dark:text-yellow-500 font-medium">Descriptor1</span>--
                  <span className="text-yellow-600 dark:text-yellow-500 font-medium">Descriptor2</span>--
                  <span className="text-yellow-600 dark:text-yellow-500 font-medium">Descriptor3</span>
                </p>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-yellow-100 dark:bg-yellow-900/40">
                      <TableHead className="font-bold text-yellow-800 dark:text-yellow-200 border-r">Descriptor1 (Main therapeutic category)</TableHead>
                      <TableHead className="font-bold text-yellow-800 dark:text-yellow-200 border-r">Descriptor2 (Subcategory)</TableHead>
                      <TableHead className="font-bold text-yellow-800 dark:text-yellow-200">Descriptor3 (options separated by commas)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-b">
                      <TableCell className="font-semibold border-r bg-muted/30" rowSpan={4}>Protein</TableCell>
                      <TableCell className="border-r">mAb</TableCell>
                      <TableCell className="text-sm">Drug conjugate, Radioconjugate, Other conjugate</TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="border-r">Multispecific</TableCell>
                      <TableCell className="text-sm">TCE, Other engager, Drug conjugate, Radioconjugate, Other conjugate</TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="border-r">Recombinant/Fusion</TableCell>
                      <TableCell className="text-sm">Cytokine, Cancer vaccine, Drug conjugate, Radioconjugate, Other conjugate</TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="border-r">Coformulation</TableCell>
                      <TableCell className="text-sm">Ab + Ab, Ab + ADC, Ab + small molecule, Cytokine</TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="font-semibold border-r bg-muted/30" rowSpan={2}>Small molecule</TableCell>
                      <TableCell className="border-r">Targeted</TableCell>
                      <TableCell className="text-sm">Inhibitor, Degrader, Agonist</TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="border-r">Chemotherapy</TableCell>
                      <TableCell className="text-sm text-muted-foreground">-</TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="font-semibold border-r bg-muted/30" rowSpan={5}>Other</TableCell>
                      <TableCell className="border-r">Peptide</TableCell>
                      <TableCell className="text-sm">Cancer vaccine, Drug conjugate, Radioconjugate, Other conjugate</TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="border-r">DNA/RNA</TableCell>
                      <TableCell className="text-sm">mRNA, Virus, Aptamer</TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="border-r">Cell therapy</TableCell>
                      <TableCell className="text-sm text-muted-foreground">-</TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="border-r">Bacterial cell therapy</TableCell>
                      <TableCell className="text-sm text-muted-foreground">-</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="border-r">Polysaccharide</TableCell>
                      <TableCell className="text-sm text-muted-foreground">-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Payload Tab */}
            <TabsContent value="payload" className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-green-700 dark:text-green-400">Payload Type</h3>
                <p className="text-sm text-muted-foreground">
                  <span className="text-green-600 dark:text-green-500 font-medium">Descriptor1</span>--
                  <span className="text-green-600 dark:text-green-500 font-medium">Descriptor2</span>--
                  <span className="text-green-600 dark:text-green-500 font-medium">Descriptor3</span>
                </p>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-green-100 dark:bg-green-900/40">
                      <TableHead className="font-bold text-green-800 dark:text-green-200 border-r w-[140px]">Descriptor1</TableHead>
                      <TableHead className="font-bold text-green-800 dark:text-green-200 border-r">Descriptor2</TableHead>
                      <TableHead className="font-bold text-green-800 dark:text-green-200 w-[200px]">Descriptor3</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-b">
                      <TableCell className="font-semibold border-r bg-muted/30" rowSpan={5}>Chemo</TableCell>
                      <TableCell className="border-r">Tubulin inhibitor</TableCell>
                      <TableCell className="text-sm text-muted-foreground italic">(payload name, if available)</TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="border-r">Topo1 inhibitor</TableCell>
                      <TableCell className="text-sm text-muted-foreground italic">(payload name, if available)</TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="border-r">Topo2 inhibitor</TableCell>
                      <TableCell className="text-sm text-muted-foreground italic">(payload name, if available)</TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="border-r">DNA-targeting</TableCell>
                      <TableCell className="text-sm text-muted-foreground italic">(payload name, if available)</TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="border-r">Transcription/Translation inhibitor</TableCell>
                      <TableCell className="text-sm text-muted-foreground italic">(payload name, if available)</TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="font-semibold border-r bg-muted/30">Targeted</TableCell>
                      <TableCell className="border-r">
                        <ul className="list-disc list-inside text-sm space-y-0.5">
                          <li>HDAC inhibitor</li>
                          <li>PI3K inhibitor</li>
                          <li>KRAS inhibitor</li>
                          <li>PARP inhibitor</li>
                          <li>Bcl-XL inhibitor</li>
                          <li>Other/Undisclosed</li>
                        </ul>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground italic">(payload name, if available)</TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="font-semibold border-r bg-muted/30">Immune-modulating</TableCell>
                      <TableCell className="border-r">
                        <ul className="list-disc list-inside text-sm space-y-0.5">
                          <li>STING agonist</li>
                          <li>TLR agonist</li>
                          <li>Other/Undisclosed</li>
                        </ul>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground italic">(payload name, if available)</TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="font-semibold border-r bg-muted/30">Radioisotope</TableCell>
                      <TableCell className="border-r text-sm text-muted-foreground italic">(isotope name, if available)</TableCell>
                      <TableCell className="text-sm">Undisclosed</TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="font-semibold border-r bg-muted/30">Degrader</TableCell>
                      <TableCell className="border-r text-sm text-muted-foreground italic">(indicate the degrader's protein target, if available as in "KRAS degrader" for example)</TableCell>
                      <TableCell className="text-sm text-muted-foreground">-</TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="font-semibold border-r bg-muted/30">Dual payload</TableCell>
                      <TableCell className="border-r text-sm text-muted-foreground italic">(indicate the two appropriate descriptor2 names separated by a "/")</TableCell>
                      <TableCell className="text-sm text-muted-foreground">-</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold border-r bg-muted/30">Others</TableCell>
                      <TableCell className="border-r text-sm text-muted-foreground italic">(molecule type, if available)</TableCell>
                      <TableCell className="text-sm text-muted-foreground italic">(indicate the payload's name, if available)</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Conditional Activation Tab */}
            <TabsContent value="conditional" className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-purple-700 dark:text-purple-400">Conditional Activation Type</h3>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-purple-100 dark:bg-purple-900/40">
                      <TableHead className="font-bold text-purple-800 dark:text-purple-200 border-r w-[280px]">Descriptor 1</TableHead>
                      <TableHead className="font-bold text-purple-800 dark:text-purple-200">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-b">
                      <TableCell className="font-medium border-r">Conditionally-active--pH-dependent</TableCell>
                      <TableCell className="text-sm">Activation requires specific pH conditions found in the tumor microenvironment (acidic)</TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="font-medium border-r">Conditionally-active--protease-dependent</TableCell>
                      <TableCell className="text-sm">Activation requires the enzymatic cleavage of a masking peptide or antibody fragment by TME proteases to expose the target(s) binding moiety</TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="font-medium border-r">Conditionally-active--binding-dependent</TableCell>
                      <TableCell className="text-sm">Binding to one of the targets triggers conformational change that exposes the binding motif to another target</TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="font-medium border-r">Conditionally-active--other/unclear</TableCell>
                      <TableCell className="text-sm">Product is identified as a masked or conditionally active biologic but the specific technology is unclear or doesn't fit any of the above categories</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium border-r text-muted-foreground italic">[blank]</TableCell>
                      <TableCell className="text-sm">Not conditionally active</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 mt-4 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    As the landscape evolves, we can add other classification systems and variables to track
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Targets Tab */}
            <TabsContent value="targets" className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                The system recognizes multiple names for the same target. The preferred name is displayed, with synonyms available via the info bubble.
              </p>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preferred Name</TableHead>
                    <TableHead>Synonyms</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium text-primary">EGFR</TableCell>
                    <TableCell className="text-sm">ErbB-1, HER1, Epidermal Growth Factor Receptor</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-primary">HER2</TableCell>
                    <TableCell className="text-sm">ErbB-2, neu, ERBB2</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-primary">PD-1</TableCell>
                    <TableCell className="text-sm">PDCD1, CD279, Programmed Cell Death 1</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-primary">PD-L1</TableCell>
                    <TableCell className="text-sm">B7-H1, CD274</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-primary">VEGF</TableCell>
                    <TableCell className="text-sm">Vascular Endothelial Growth Factor, VEGF-A</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-primary">CD20</TableCell>
                    <TableCell className="text-sm">B-lymphocyte antigen CD20, MS4A1</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="bg-muted/50 rounded-md p-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> If a target is not in the synonym library, the original Citeline name is displayed as-is (singleton).
                  Search functionality recognizes all synonyms.
                </p>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
