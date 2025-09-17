import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowLeft, ArrowRight, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const ONBOARDING_STEPS = [
  { id: 'profile', title: 'Profile Setup', description: 'Complete your agency profile' },
  { id: 'agents', title: 'Invite Agents', description: 'Add team members to your agency' },
  { id: 'calendar', title: 'Connect Google', description: 'Integrate with Google Calendar' },
  { id: 'plan', title: 'Choose Plan', description: 'Select your subscription plan' },
  { id: 'import', title: 'Import Leads', description: 'Upload your existing leads' },
];

interface StepperProps {
  steps: typeof ONBOARDING_STEPS;
  currentStep: number;
}

function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-4xl mx-auto mb-8">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground"
                    : isActive
                    ? "border-primary text-primary"
                    : "border-muted-foreground text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <div className={cn("text-sm font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground max-w-24">
                  {step.description}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-4 transition-colors",
                  index < currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProfileStep() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>Set up your agency information to get started.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            This step will include forms for:
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Agency name and details</li>
            <li>Business information</li>
            <li>Contact preferences</li>
          </ul>
          <Badge variant="outline">Coming soon</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function AgentsStep() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Your Team</CardTitle>
        <CardDescription>Add agents to collaborate on leads and campaigns.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            This step will include:
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Agent invitation form</li>
            <li>Role assignment</li>
            <li>Seat limit management</li>
          </ul>
          <Badge variant="outline">Coming soon</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function CalendarStep() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Google Calendar</CardTitle>
        <CardDescription>Sync appointments with your Google Calendar.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            This step will include:
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Google OAuth integration</li>
            <li>Calendar selection</li>
            <li>Sync preferences</li>
          </ul>
          <Badge variant="outline">Coming soon</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function PlanStep() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Your Plan</CardTitle>
        <CardDescription>Select the plan that fits your agency's needs.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            This step will include:
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Plan comparison</li>
            <li>Stripe integration</li>
            <li>Seat selection</li>
          </ul>
          <Badge variant="outline">Coming soon</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function ImportStep() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Your Leads</CardTitle>
        <CardDescription>Upload existing leads from CSV or other sources.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Ready to import your leads:
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>CSV upload and mapping</li>
            <li>Data validation</li>
            <li>Import progress tracking</li>
          </ul>
          <Link to="/import">
            <Button className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Start CSV Import
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('onboarding-step');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem('onboarding-step', currentStep.toString());
  }, [currentStep]);

  const canGoNext = currentStep < ONBOARDING_STEPS.length - 1;
  const canGoPrev = currentStep > 0;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (canGoNext) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <ProfileStep />;
      case 1:
        return <AgentsStep />;
      case 2:
        return <CalendarStep />;
      case 3:
        return <PlanStep />;
      case 4:
        return <ImportStep />;
      default:
        return <ProfileStep />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Welcome to Leadrift AI</h1>
          <p className="text-muted-foreground mt-2">
            Let's get your agency set up in just a few steps
          </p>
        </div>

        <Stepper steps={ONBOARDING_STEPS} currentStep={currentStep} />

        <div className="mb-8">
          {renderStepContent()}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={!canGoPrev}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={isLastStep}
            className="flex items-center gap-2"
          >
            {isLastStep ? 'Finish' : 'Continue'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}