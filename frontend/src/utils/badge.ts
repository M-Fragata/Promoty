export interface ParsedBadge {
  discount: string | null;
  info: string[];
}

export function parseBadge(badge: string | null): ParsedBadge {
  if (!badge || !badge.trim()) {
    return { discount: null, info: [] };
  }

  const parts = badge.split('•').map((p) => p.trim()).filter(Boolean);

  let discount: string | null = null;
  const info: string[] = [];

  for (const part of parts) {
    if (/off/i.test(part)) {
      discount = part.toUpperCase();
    } else {
      info.push(part);
    }
  }

  return { discount, info };
}
