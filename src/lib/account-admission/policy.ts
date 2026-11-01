export type AccountAdmissionMode = 'invitation-only';

export type AdmissionCandidate = {
  id?: string;
  email?: string | null;
  admittedAt?: Date | string | null;
  disabledAt?: Date | string | null;
};

export type LoginEligibilityResult =
  | { allowed: true; reason: 'ok' }
  | { allowed: false; reason: 'not-invited' | 'disabled' };

export function normalizeEmail(raw: string | null | undefined): string {
  return (raw ?? '').trim().toLowerCase();
}

export function getAccountAdmissionMode(): AccountAdmissionMode {
  const configured = (process.env.ACCOUNT_ADMISSION_MODE ?? 'invitation-only').trim().toLowerCase();
  if (configured !== 'invitation-only') {
    throw new Error(`Unsupported ACCOUNT_ADMISSION_MODE "${configured}". Only "invitation-only" is permitted.`);
  }
  return 'invitation-only';
}

function toValidDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function evaluateLoginEligibility(
  candidate: AdmissionCandidate | null | undefined,
  now: Date = new Date()
): LoginEligibilityResult {
  getAccountAdmissionMode();

  if (!candidate) {
    return { allowed: false, reason: 'not-invited' };
  }

  const disabledAt = toValidDate(candidate.disabledAt);
  if (disabledAt && disabledAt.getTime() <= now.getTime()) {
    return { allowed: false, reason: 'disabled' };
  }

  const admittedAt = toValidDate(candidate.admittedAt);
  if (!admittedAt || admittedAt.getTime() > now.getTime()) {
    return { allowed: false, reason: 'not-invited' };
  }

  return { allowed: true, reason: 'ok' };
}
