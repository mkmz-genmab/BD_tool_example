import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FeedbackContextMenuProps {
  x: number;
  y: number;
  cellInfo: { rowId: string; columnKey: string; value: string };
  onClose: () => void;
}

export default function FeedbackContextMenu({
  x,
  y,
  cellInfo,
  onClose,
}: FeedbackContextMenuProps) {
  const [feedback, setFeedback] = useState("");
  const [useForTraining, setUseForTraining] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleSubmit = async () => {
    if (feedback.trim()) {
      setIsSubmitting(true);
      
      try {
        await apiRequest('POST', '/api/feedback', {
          rowId: cellInfo.rowId,
          column: cellInfo.columnKey,
          originalValue: cellInfo.value,
          feedback: feedback,
          useForTraining: useForTraining,
        });
        
        toast({
          title: "Feedback submitted",
          description: useForTraining 
            ? "Your feedback will be used for training improvements." 
            : "Your feedback has been recorded for review.",
        });
        
        onClose();
      } catch (error) {
        console.error('Error submitting feedback:', error);
        toast({
          title: "Error",
          description: "Failed to submit feedback. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Adjust position to stay within viewport
  const adjustedX = Math.min(x, window.innerWidth - 320);
  const adjustedY = Math.min(y, window.innerHeight - 280);

  return (
    <div
      ref={menuRef}
      className="fixed bg-popover border rounded-md shadow-lg z-[100] w-80 p-4"
      style={{ left: adjustedX, top: adjustedY }}
      data-testid="feedback-context-menu"
    >
      <div className="text-sm font-semibold mb-1">Provide Feedback</div>
      <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted rounded">
        <span className="font-medium">{cellInfo.columnKey}:</span> {cellInfo.value.substring(0, 100)}{cellInfo.value.length > 100 ? '...' : ''}
      </div>
      
      <Textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Describe the issue or suggest a correction..."
        className="h-24 text-sm mb-3 resize-none"
        maxLength={500}
        data-testid="textarea-feedback"
      />
      
      <div className="flex items-center space-x-2 mb-4 p-2 bg-muted/50 rounded">
        <Checkbox
          id="use-for-training"
          checked={useForTraining}
          onCheckedChange={(checked) => setUseForTraining(checked === true)}
          data-testid="checkbox-use-for-training"
        />
        <Label htmlFor="use-for-training" className="text-sm cursor-pointer">
          Use this feedback for AI training
        </Label>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{feedback.length}/500</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-cancel-feedback">
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSubmit} 
            disabled={!feedback.trim() || isSubmitting}
            data-testid="button-submit-feedback"
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </div>
    </div>
  );
}
