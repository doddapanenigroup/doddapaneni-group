/**
 * Local development only: skip SMTP for the admin "create employee" flow so
 * pending OTP rows are still written and POST /api/users can complete.
 * Never active when NODE_ENV is not "development".
 */
export function shouldSkipEmployeeCreateEmailAndOtp(): boolean {
  if (process.env.NODE_ENV !== 'development') return false;
  const v = process.env.SKIP_EMPLOYEE_CREATE_OTP;
  return v === '1' || v === 'true';
}

/** Six-digit code used when shouldSkipEmployeeCreateEmailAndOtp() is true. */
export function devEmployeeCreateOtpCode(): string {
  const raw = (process.env.DEV_EMPLOYEE_CREATE_OTP ?? '111111').replace(/\s/g, '');
  if (!/^\d{6}$/.test(raw)) return '111111';
  return raw;
}
