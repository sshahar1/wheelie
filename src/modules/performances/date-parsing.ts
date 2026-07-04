export function parseDateIso(dateIso: string): Date {
  return new Date(`${dateIso}T00:00:00.000Z`);
}

export function parseTimeString(time: string | null | undefined): Date | null {
  if (!time) {
    return null;
  }
  return new Date(`1970-01-01T${time}:00.000Z`);
}
