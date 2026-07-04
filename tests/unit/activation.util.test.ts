import { hasActivationKeyword, stripActivationKeyword } from '../../src/modules/whatsapp/activation.util';

describe('hasActivationKeyword', () => {
  it('detects the keyword regardless of case', () => {
    expect(hasActivationKeyword('@Bot what time is the show', '@bot')).toBe(true);
    expect(hasActivationKeyword('@BOT what time is the show', '@bot')).toBe(true);
  });

  it('returns false for ordinary chatter without the keyword', () => {
    expect(hasActivationKeyword('haha that rehearsal was wild', '@bot')).toBe(false);
  });

  it('returns false when the activation keyword is empty', () => {
    expect(hasActivationKeyword('@bot anything', '')).toBe(false);
  });

  it('detects the keyword in the middle of a longer message', () => {
    expect(hasActivationKeyword('hey @bot can you check the schedule', '@bot')).toBe(true);
  });
});

describe('stripActivationKeyword', () => {
  it('removes the keyword and trims surrounding whitespace', () => {
    expect(stripActivationKeyword('@bot show at 7pm', '@bot')).toBe('show at 7pm');
  });

  it('removes a keyword that contains regex-special characters safely', () => {
    expect(stripActivationKeyword('[bot] show at 7pm', '[bot]')).toBe('show at 7pm');
  });

  it('is case-insensitive when stripping', () => {
    expect(stripActivationKeyword('@BOT show at 7pm', '@bot')).toBe('show at 7pm');
  });

  it('returns the trimmed message unchanged when the keyword is empty', () => {
    expect(stripActivationKeyword('  show at 7pm  ', '')).toBe('show at 7pm');
  });
});
