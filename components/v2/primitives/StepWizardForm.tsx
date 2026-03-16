/**
 * v2 StepWizardForm - re-exports the shared StepWizardForm.
 *
 * The shared version in components/shared/StepWizardForm.tsx already has:
 * - Progress bar with step indicators
 * - Previous/next navigation with validation
 * - Sticky bottom buttons with safe-area padding
 * - Responsive layout
 *
 * This re-export maintains backward compatibility for v1 while
 * allowing v2 features to import from the v2 primitives barrel.
 * Extend here if v2-specific step wizard behavior is needed.
 */
export { default as StepWizardForm } from '@/components/shared/StepWizardForm';
