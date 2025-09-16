import { useMemo, useRef, useState } from 'react';
import type { JSX, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useOnboardingProgress, OnboardingStepKey } from '@/hooks/useOnboardingProgress';
import { Calendar, CheckCircle2, Upload, Users, CreditCard, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { calendarService } from '@/services/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useAgency } from '@/hooks/useAgency';

type Step = {
	key: OnboardingStepKey;
	title: string;
	description: string;
	icon: ReactNode;
	render: () => JSX.Element;
};

const STEPS_ORDER: OnboardingStepKey[] = [
	'agencyProfile',
	'inviteAgents',
	'connectCalendar',
	'choosePlan',
	'importLeads',
];

const StepIndicator = ({ index, title, active, done }: { index: number; title: string; active: boolean; done: boolean; }) => {
	return (
		<div className={`flex items-center gap-2 ${active ? 'text-primary' : 'text-muted-foreground'}`}>
			<div className={`w-6 h-6 rounded-full flex items-center justify-center border ${done ? 'bg-primary text-white border-primary' : active ? 'border-primary' : 'border-muted'}`}>
				{done ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">{index + 1}</span>}
			</div>
			<span className="text-sm font-medium">{title}</span>
		</div>
	);
};

const Onboarding = () => {
	const navigate = useNavigate();
	const { toast } = useToast();
	const { progress, setCurrentStepIndex, markStep } = useOnboardingProgress();

  // Local state for step inputs (kept at component level to respect Hooks rules)
  const [agencyName, setAgencyName] = useState<string>(
    ((progress.steps.agencyProfile.data as any)?.name as string) || ''
  );
  const [inviteEmails, setInviteEmails] = useState<string>(
    ((progress.steps.inviteAgents.data as any)?.emails as string) || ''
  );

  // Import step state
  const { agencyId } = useAgency();
  const [rowsText, setRowsText] = useState<string>('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [successRows, setSuccessRows] = useState<number>(0);
  const [errorRows, setErrorRows] = useState<number>(0);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const pollRef = useRef<number | null>(null);

	const steps: Step[] = useMemo(() => [
		{
			key: 'agencyProfile',
			title: 'Agency Profile',
			description: 'Create your agency workspace',
			icon: <Building2 className="w-4 h-4" />,
			render: () => (
				<div className="space-y-4">
					<div>
						<Label htmlFor="agencyName">Agency Name</Label>
						<Input id="agencyName" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="Enter your agency name" />
					</div>
					<div className="flex gap-2">
						<Button
							onClick={() => {
								if (!agencyName.trim()) { return; }
								markStep('agencyProfile', 'completed', { name: agencyName.trim() });
								setCurrentStepIndex(1);
								toast({ title: 'Saved', description: 'Agency name saved (local only).' });
							}}
							disabled={!agencyName.trim()}
						>
							Save and Continue
						</Button>
					</div>
				</div>
			),
		},
		{
			key: 'inviteAgents',
			title: 'Invite Agents',
			description: 'Invite teammates to collaborate',
			icon: <Users className="w-4 h-4" />,
			render: () => (
				<div className="space-y-4">
					<p className="text-sm text-muted-foreground">Add comma or newline separated emails. This is a stub; no emails will be sent.</p>
					<div>
						<Label htmlFor="emails">Emails</Label>
						<Textarea id="emails" value={inviteEmails} onChange={(e) => setInviteEmails(e.target.value)} placeholder={"jane@acme.com, john@acme.com\n..."} />
					</div>
					<Button
						onClick={() => {
							markStep('inviteAgents', 'completed', { emails: inviteEmails });
							toast({ title: 'Invites queued (stub)' });
						}}
						disabled={!inviteEmails.trim()}
					>
						Mark as Invited
					</Button>
				</div>
			),
		},
		{
			key: 'connectCalendar',
			title: 'Connect Google Calendar',
			description: 'Sync appointments with your Google Calendar',
			icon: <Calendar className="w-4 h-4" />,
			render: () => (
				<div className="space-y-4">
					<p className="text-sm text-muted-foreground">Connect your Google Calendar to auto-sync appointments.</p>
					<Button onClick={async () => {
						const url = await calendarService.initGoogleAuth();
						window.open(url, '_blank');
					}}>
						Connect Google
					</Button>
				</div>
			),
		},
		{
			key: 'choosePlan',
			title: 'Choose Plan',
			description: 'Select a subscription to unlock features',
			icon: <CreditCard className="w-4 h-4" />,
			render: () => (
				<div className="space-y-4">
					<p className="text-sm text-muted-foreground">Open Stripe Checkout to pick a plan.</p>
					<div className="flex gap-2">
						<Button onClick={() => toast({ title: 'Stripe Checkout', description: 'Would open Checkout (stub).' })}>Open Checkout</Button>
						<Button variant="outline" onClick={() => toast({ title: 'Billing Portal', description: 'Would open portal (stub).' })}>Open Billing Portal</Button>
					</div>
				</div>
			),
		},
		{
			key: 'importLeads',
			title: 'Import Leads',
			description: 'Bring your leads to get started',
			icon: <Upload className="w-4 h-4" />,
			render: () => (
				<div className="space-y-4">
					<p className="text-sm text-muted-foreground">Paste JSON array of rows. We will call the import function and poll progress.</p>
					<Textarea
						value={rowsText}
						onChange={(e) => setRowsText(e.target.value)}
						placeholder='[{"full_name":"Jane Doe","email":"jane@example.com","phone":"..."}]'
						className="min-h-32"
					/>
					<div className="flex gap-2 items-center">
						<Button
							disabled={isImporting || !rowsText.trim()}
							onClick={async () => {
								if (!agencyId) { toast({ title: 'No agency', description: 'Please create agency first', variant: 'destructive' }); return; }
								let parsed: any[] = [];
								try {
									const j = JSON.parse(rowsText);
									parsed = Array.isArray(j) ? j : [];
								} catch (err) {
									toast({ title: 'Invalid JSON', description: 'Please paste a valid JSON array', variant: 'destructive' });
									return;
								}

								if (parsed.length === 0) { toast({ title: 'No rows', description: 'Add at least one row', variant: 'destructive' }); return; }

								setIsImporting(true);
								setJobId(null);
								setJobStatus('pending');
								setTotalRows(parsed.length);
								setSuccessRows(0);
								setErrorRows(0);

								// Create an import job
								const { data: job, error: jobErr } = await supabase
									.from('import_jobs')
									.insert({ agency_id: agencyId, status: 'pending', total_rows: parsed.length })
									.select()
									.single();
								if (jobErr || !job) {
									toast({ title: 'Failed to start job', description: jobErr?.message || 'Unknown error', variant: 'destructive' });
									setIsImporting(false);
									return;
								}
								setJobId(job.id);

								// Invoke the edge function
								try {
									const { data, error } = await supabase.functions.invoke('import-csv', {
										body: { import_job_id: job.id, rows: parsed }
									});
									if (error) throw error;
									// Optional: use returned data
								} catch (fnErr: any) {
									toast({ title: 'Import failed to start', description: fnErr.message || 'Edge function error', variant: 'destructive' });
									setIsImporting(false);
									return;
								}

								// Start polling job progress
								if (pollRef.current) { window.clearInterval(pollRef.current); }
								pollRef.current = window.setInterval(async () => {
									const { data: latest } = await supabase
										.from('import_jobs')
										.select('*')
										.eq('id', job.id)
										.single();
									if (latest) {
										setJobStatus(latest.status || null);
										setSuccessRows(latest.success_rows || 0);
										setErrorRows(latest.error_rows || 0);
										setTotalRows(latest.total_rows || parsed.length);
										if (latest.finished_at || latest.status === 'completed' || latest.status === 'failed') {
											if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; }
											setIsImporting(false);
										}
									}
								}, 1500);
							}}
						>
							Start Import
						</Button>
						{isImporting && <span className="text-sm text-muted-foreground">Importing...</span>}
					</div>

					{(jobId) && (
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-sm">Job: {jobId}</span>
								<span className="text-sm">Status: {jobStatus || 'pending'}</span>
							</div>
							<Progress value={totalRows ? Math.round(((successRows + errorRows) / totalRows) * 100) : 0} />
							<div className="text-xs text-muted-foreground">
								{successRows} succeeded • {errorRows} failed • {totalRows} total
							</div>
						</div>
					)}
				</div>
			),
		},
	], [toast, markStep]);

	const activeIndex = progress.currentStepIndex;
	const activeStep = steps[activeIndex];
	const completedCount = STEPS_ORDER.filter((key) => progress.steps[key].status === 'completed').length;
	const progressPercent = Math.round((completedCount / steps.length) * 100);

	const goNext = () => {
		if (activeIndex < steps.length - 1) setCurrentStepIndex(activeIndex + 1);
		else navigate('/dashboard');
	};

	const goBack = () => {
		if (activeIndex > 0) setCurrentStepIndex(activeIndex - 1);
	};

	const skipStep = () => {
		const key = activeStep.key;
		markStep(key, 'skipped');
		goNext();
	};

	const completeStep = () => {
		const key = activeStep.key;
		markStep(key, 'completed');
		goNext();
	};

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-5xl mx-auto p-6">
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Getting Started</CardTitle>
							<div className="flex items-center gap-3 w-64">
								<Progress value={progressPercent} className="w-full" />
								<span className="text-sm text-muted-foreground whitespace-nowrap">{progressPercent}%</span>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
							<div className="md:col-span-1 space-y-4">
								{steps.map((s, idx) => (
									<div key={s.key} className="cursor-pointer" onClick={() => setCurrentStepIndex(idx)}>
										<StepIndicator
											index={idx}
											title={s.title}
											active={idx === activeIndex}
											done={progress.steps[s.key].status === 'completed'}
										/>
										{idx < steps.length - 1 && <Separator className="my-2" />}
									</div>
								))}
							</div>
							<div className="md:col-span-3 space-y-6">
								<div>
									<h2 className="text-xl font-semibold flex items-center gap-2">
										{activeStep.icon}
										{activeStep.title}
									</h2>
									<p className="text-muted-foreground">{activeStep.description}</p>
								</div>
								<div className="border rounded-lg p-4">
									{activeStep.render()}
								</div>
								<div className="flex items-center justify-between">
									<Button variant="ghost" onClick={goBack} disabled={activeIndex === 0}>Back</Button>
									<div className="flex gap-2">
										<Button variant="outline" onClick={skipStep}>Skip</Button>
										<Button onClick={completeStep}>{activeIndex === steps.length - 1 ? 'Finish' : 'Next'}</Button>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default Onboarding;

