export function redactPII(text: string): string {
  if (!text) return text
  let red = text
  // Simple regex for emails, phones
  red = red.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
  red = red.replace(/\+?\d[\d -]{7,}\d/g, '[redacted-phone]')
  return red
}
