import type { PlanId } from './supabase/database.types';

export type { PlanId };

export type Plan = {
  id: PlanId;
  name: string;
  description: string;
  feeNote: string;
  perks: [string, string];
  multiBranch: boolean;
  /** Monthly price in cents. null until the price is confirmed. */
  monthlyCents: number | null;
};

export const PLANS: Record<PlanId, Plan> = {
  smb: {
    id: 'smb',
    name: 'Small and medium business',
    description: 'Independent restaurants and small chains',
    feeNote: 'Flat fee, the same for every SMB',
    perks: ['No commission on orders', 'Paid straight to your bank'],
    multiBranch: false,
    monthlyCents: null,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Large businesses with several branches',
    feeNote: 'Higher flat fee, one price for all',
    perks: ['No commission on orders', 'Every branch in one account'],
    multiBranch: true,
    monthlyCents: null,
  },
};

export const PLAN_LIST = [PLANS.smb, PLANS.enterprise];

export function isPlanId(v: unknown): v is PlanId {
  return v === 'smb' || v === 'enterprise';
}
