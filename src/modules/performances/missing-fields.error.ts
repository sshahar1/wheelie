export class MissingFieldsError extends Error {
  constructor(public readonly missingFields: string[]) {
    super(`Missing required fields: ${missingFields.join(', ')}`);
    this.name = 'MissingFieldsError';
  }
}
