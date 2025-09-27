// lib/utils.ts
export function getBadgeClass(type: string): string {
  switch (type.toLowerCase()) {
    case 'accident':
      return 'bg-red-100 text-red-700';
    case 'disappearance':
      return 'bg-purple-100 text-purple-700';
    case 'incident':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}
