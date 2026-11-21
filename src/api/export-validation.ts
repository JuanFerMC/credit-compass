export function isValidExportApplicantIds(ids: number[]): boolean {
  return (
    ids.length >= 1 &&
    ids.length <= 50 &&
    ids.every((id) => Number.isSafeInteger(id) && id > 0) &&
    new Set(ids).size === ids.length
  );
}
