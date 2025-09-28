// utils/formatDate.ts
// Deterministic date formatter — returns "12 Jun 2025" style strings
export function formatDateDeterministic(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return String(iso);
  const day = d.getDate();
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
