import { UserService } from '../services/user/user.service';

/** Canonical ICR UI languages — display text is fixed; LANID is stored in USERLANG / ICRLanguage. */
export const UI_LANGUAGE_IDS = ['us_US', 'en_GB', 'fr_FR'] as const;

export type UiLanguageId = typeof UI_LANGUAGE_IDS[number];

const LABELS: Record<UiLanguageId, string> = {
  us_US: 'American',
  en_GB: 'English (UK)',
  fr_FR: 'French',
};

export function uiLanguageLabel(langId: string | null | undefined): string {
  const id = UserService.normalizeLanguageCode(langId);
  if (id === 'us_US' || id === 'en_GB' || id === 'fr_FR') {
    return LABELS[id];
  }
  return id;
}

export function uiLanguageOptions(): { id: string; label: string }[] {
  return UI_LANGUAGE_IDS.map((id) => ({ id, label: LABELS[id] }));
}

/** PrimeNG / dropdown { label, value } */
export function uiLanguageSelectOptions(): { label: string; value: string }[] {
  return uiLanguageOptions().map((o) => ({ label: o.label, value: o.id }));
}

export function isUiLanguageId(langId: string): boolean {
  const id = UserService.normalizeLanguageCode(langId);
  return UI_LANGUAGE_IDS.includes(id as UiLanguageId);
}
