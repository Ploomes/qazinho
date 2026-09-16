export function formatElapsed(seconds: number): string {
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const rest = String(whole % 60).padStart(2, '0');

  return `${String(minutes)}:${rest}`;
}
