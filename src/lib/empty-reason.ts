import type { EmptyReason } from '@/types';

export interface EmptyCopy {
  tone: 'coral' | 'amber';
  title: string;
  body: string;
}

function fmtFriendlyDate(isoDateString: string): string {
  // YYYY-MM-DD → "22 May 2026" using the user's locale ordering.
  const [y, m, d] = isoDateString.split('-').map(Number);
  if (!y || !m || !d) return isoDateString;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Maps an EmptyReason into rendered copy. When the consultant filter is
 * "Anyone" we soften the message — naming a specific consultant doesn't make
 * sense when the user explicitly asked the system to pick. For all other
 * reasons we use the first-name from the backend (which only ever sends a
 * first name, never a full name or exception detail).
 */
export function describeEmptyReason(
  reason: EmptyReason,
  options: { consultantSelected: boolean; serviceName: string | null },
): EmptyCopy {
  const dateLabel = fmtFriendlyDate(reason.date);
  const name = reason.orgMemberFirstName ?? 'Your consultant';
  const service = options.serviceName ?? 'this service';

  if (reason.reason === 'past') {
    return {
      tone: 'coral',
      title: 'Date is in the past',
      body: 'Pick today or a future date.',
    };
  }

  if (reason.reason === 'public_holiday') {
    return {
      tone: 'amber',
      title: 'Public holiday',
      body: `Closed for the public holiday on ${dateLabel}.`,
    };
  }

  // For Anyone mode, the reason rolled up across all eligible consultants —
  // naming one of them is misleading. Use a generic message.
  if (!options.consultantSelected) {
    if (reason.reason === 'no_eligible_members') {
      return {
        tone: 'amber',
        title: 'No consultants offer this yet',
        body: `${service} isn't offered by any consultant right now.`,
      };
    }
    return {
      tone: 'amber',
      title: 'No openings',
      body: `No consultants are available for ${service} on ${dateLabel}. Try a different date.`,
    };
  }

  switch (reason.reason) {
    case 'service_not_offered':
      return {
        tone: 'coral',
        title: `${name} doesn't offer ${service}`,
        body: `${name} doesn't offer ${service}. Pick another consultant or a different service.`,
      };
    case 'blocked':
      return {
        tone: 'coral',
        title: `${name} is unavailable`,
        body: `${name} isn't available on ${dateLabel}. Try a different date or pick another consultant.`,
      };
    case 'off_today':
      return {
        tone: 'amber',
        title: `${name} isn't working`,
        body: `${name} isn't working on ${dateLabel}. Try a different date or pick another consultant.`,
      };
    case 'service_too_long':
      return {
        tone: 'coral',
        title: "Service doesn't fit",
        body: `${name}'s working hours on ${dateLabel} are too short for a ${service} (${reason.detail ?? 'long appointment'}).`,
      };
    case 'fully_booked':
      return {
        tone: 'amber',
        title: `${name} is fully booked`,
        body: `${name} is fully booked on ${dateLabel}. Try a different date or pick another consultant.`,
      };
    case 'no_eligible_members':
      return {
        tone: 'amber',
        title: 'No consultants',
        body: `${service} isn't offered by any consultant right now.`,
      };
    default:
      return {
        tone: 'amber',
        title: 'No openings',
        body: 'Try a different date or service.',
      };
  }
}
