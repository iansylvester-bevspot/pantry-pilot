"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X, Sparkles } from "lucide-react";

export type WizardStep = {
  id: string;
  title: string;
  description: string;
  hint?: string;
  icon?: React.ReactNode;
  /** If true, this step auto-advances when `isComplete` returns true */
  canAutoAdvance?: boolean;
};

interface SetupWizardProps {
  /** Unique key for localStorage persistence (e.g. "categories") */
  wizardKey: string;
  steps: WizardStep[];
  /** Called each render to check if a step's goal has been met */
  isStepComplete?: (stepId: string) => boolean;
  /** If true, wizard shows even if previously dismissed */
  forceShow?: boolean;
  /** Called when wizard is completed or dismissed */
  onComplete?: () => void;
}

export function SetupWizard({
  wizardKey,
  steps,
  isStepComplete,
  forceShow = false,
  onComplete,
}: SetupWizardProps) {
  const storageKey = `wizard_${wizardKey}_completed`;
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey) === "true";
    setVisible(forceShow || !dismissed);
  }, [forceShow, storageKey]);

  // Auto-advance when step is complete
  const step = steps[currentStep];
  const stepComplete = step && isStepComplete?.(step.id);

  const advance = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, steps.length]);

  useEffect(() => {
    if (stepComplete && step?.canAutoAdvance) {
      const timer = setTimeout(advance, 600);
      return () => clearTimeout(timer);
    }
  }, [stepComplete, step?.canAutoAdvance, advance]);

  if (!visible || steps.length === 0) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  function dismiss() {
    localStorage.setItem(storageKey, "true");
    setVisible(false);
    onComplete?.();
  }

  return (
    <Card className="border-primary/30 bg-primary/5 relative overflow-hidden">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 h-1 bg-primary/20 w-full">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{
            width: `${((currentStep + 1) / steps.length) * 100}%`,
          }}
        />
      </div>

      <CardContent className="pt-6 pb-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="shrink-0 rounded-lg bg-primary/10 p-2.5 text-primary">
            {step?.icon ?? <Sparkles className="h-5 w-5" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-primary">
                Step {currentStep + 1} of {steps.length}
              </span>
              {stepComplete && (
                <span className="text-xs text-green-600 font-medium">
                  Done!
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold mb-1">{step?.title}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              {step?.description}
            </p>
            {step?.hint && (
              <p className="text-sm font-medium text-primary/80">
                {step.hint}
              </p>
            )}
          </div>

          {/* Dismiss */}
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 h-8 w-8 p-0 text-muted-foreground"
            onClick={dismiss}
            title="Dismiss wizard"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-primary/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={isFirst}
            className="text-muted-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep
                    ? "w-6 bg-primary"
                    : i < currentStep
                      ? "w-1.5 bg-primary/50"
                      : "w-1.5 bg-primary/20"
                }`}
              />
            ))}
          </div>

          {isLast ? (
            <Button size="sm" onClick={dismiss}>
              Finish Setup
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={advance}
              className="text-primary"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
