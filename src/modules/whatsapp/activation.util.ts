/**
 * Group-message activation gate (research.md §3): a message is only treated
 * as a scheduling command/query if it contains the configured activation
 * keyword/mention. Everything else is ordinary chatter and MUST be ignored,
 * so this check runs before any extraction/intent logic.
 */
export function hasActivationKeyword(messageText: string, activationKeyword: string): boolean {
  if (!activationKeyword) {
    return false;
  }
  return messageText.toLowerCase().includes(activationKeyword.toLowerCase());
}

/**
 * Strips the activation keyword from the message so downstream extraction
 * operates on the remaining natural-language content only.
 */
export function stripActivationKeyword(messageText: string, activationKeyword: string): string {
  if (!activationKeyword) {
    return messageText.trim();
  }
  const pattern = new RegExp(escapeRegExp(activationKeyword), 'ig');
  return messageText.replace(pattern, '').trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
