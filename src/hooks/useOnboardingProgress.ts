import { useEffect, useState, useCallback } from 'react';

export type OnboardingStepKey = 'agencyProfile' | 'inviteAgents' | 'connectCalendar' | 'choosePlan' | 'importLeads';

export interface OnboardingStepState {
	status: 'pending' | 'completed' | 'skipped';
	data?: Record<string, unknown>;
}

export interface OnboardingProgressState {
	currentStepIndex: number;
	steps: Record<OnboardingStepKey, OnboardingStepState>;
}

const DEFAULT_PROGRESS: OnboardingProgressState = {
	currentStepIndex: 0,
	steps: {
		agencyProfile: { status: 'pending' },
		inviteAgents: { status: 'pending' },
		connectCalendar: { status: 'pending' },
		choosePlan: { status: 'pending' },
		importLeads: { status: 'pending' },
	},
};

const STORAGE_KEY = 'onboardingProgress';

export const useOnboardingProgress = () => {
	const [progress, setProgress] = useState<OnboardingProgressState>(DEFAULT_PROGRESS);

	useEffect(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as OnboardingProgressState;
				setProgress(parsed);
			}
		} catch (error) {
			// If parsing fails, reset to default
			setProgress(DEFAULT_PROGRESS);
		}
	}, []);

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
		} catch (_error) {
			// Ignore storage failures
		}
	}, [progress]);

	const resetProgress = useCallback(() => setProgress(DEFAULT_PROGRESS), []);

	const setCurrentStepIndex = useCallback((index: number) => {
		setProgress((prev) => ({ ...prev, currentStepIndex: index }));
	}, []);

	const markStep = useCallback((key: OnboardingStepKey, status: OnboardingStepState['status'], data?: Record<string, unknown>) => {
		setProgress((prev) => ({
			...prev,
			steps: {
				...prev.steps,
				[key]: { status, data: data ?? prev.steps[key]?.data },
			},
		}));
	}, []);

	const saveStepData = useCallback((key: OnboardingStepKey, data: Record<string, unknown>) => {
		setProgress((prev) => ({
			...prev,
			steps: {
				...prev.steps,
				[key]: { ...prev.steps[key], data },
			},
		}));
	}, []);

	return {
		progress,
		setCurrentStepIndex,
		markStep,
		saveStepData,
		resetProgress,
	};
};

