import { Observable, Subscription } from 'rxjs';

/**
 * Shared reset for mass-change wizards when the user reselects a file
 * or closes the execution recap (Close & Reset).
 */
export function emptyMassRecapSummary() {
  return {
    totalRecords: 0,
    successRecords: 0,
    errorRecords: 0,
    errorDetails: [] as any[],
    columns: [] as string[],
  };
}

/**
 * Clears wizard / file UI state so a new Browse selection starts clean.
 * Pass the component instance (`this`). Safe if optional fields are absent.
 */
export function resetMassUpdateWizardState(component: any): void {
  if (!component) {
    return;
  }

  component.activeIndex = 0;
  component.uploadedFiles = [];
  component.displayConfirm = false;
  component.indicatorXLSfileLoaded = false;

  if ('globalValid' in component) {
    component.globalValid = [];
  }
  if ('globalError' in component) {
    component.globalError = [];
  }
  if ('executionErrors' in component) {
    component.executionErrors = [];
  }
  if ('waitMessage' in component) {
    component.waitMessage = '';
  }
  if ('displayRecapDialog' in component) {
    component.displayRecapDialog = false;
  }
  if ('displayUpdateCompleted' in component) {
    component.displayUpdateCompleted = false;
  }
  if ('okExit' in component) {
    component.okExit = false;
  }
  if ('recapSummary' in component) {
    component.recapSummary = emptyMassRecapSummary();
  }

  // Drop previous worksheet so Confirm / Validate cannot reuse stale rows
  if (component._importService && typeof component._importService.clearWorkbook === 'function') {
    component._importService.clearWorkbook();
  }

  try {
    component.fileUpload?.clear?.();
  } catch {
    /* file upload may not be ready */
  }
}

function isMassUpdateInProgress(component: any): boolean {
  if (!component) {
    return false;
  }
  return (
    Number(component.activeIndex) > 0 ||
    !!component.indicatorXLSfileLoaded ||
    !!component.displayConfirm ||
    (Array.isArray(component.uploadedFiles) && component.uploadedFiles.length > 0) ||
    (Array.isArray(component.globalValid) && component.globalValid.length > 0) ||
    (Array.isArray(component.globalError) && component.globalError.length > 0)
  );
}

/**
 * When the top-bar GOLD environment changes mid-wizard, reset the mass-change
 * screen so Confirm / Validate cannot run against a different DATABASE_SID
 * than the one used for the prior file check.
 */
export function bindMassUpdateOnEnvironmentChange(
  component: any,
  environmentChanged$: Observable<unknown>,
  messageService?: { add: (msg: Record<string, unknown>) => void }
): Subscription {
  return environmentChanged$.subscribe(() => {
    if (component._importService && typeof component._importService.clearWorkbook === 'function') {
      component._importService.clearWorkbook();
    }
    if (!isMassUpdateInProgress(component)) {
      return;
    }
    resetMassUpdateWizardState(component);
    if (messageService && typeof messageService.add === 'function') {
      messageService.add({
        key: 'top',
        sticky: true,
        severity: 'warn',
        summary: 'Environment changed',
        detail:
          'Mass change was reset for the new environment. Re-select your file and confirm again before validating.',
      });
    }
  });
}
