/** Every path in the app lives here, so a rename is a one-line change. */
export const routes = {
  restaurant: {
    signIn: '/restaurant/sign-in',
    planOnboarding: '/restaurant/onboarding/plan',
    bankOnboarding: '/restaurant/onboarding/bank',
    orders: '/restaurant/orders',
    menu: '/restaurant/menu',
    earnings: '/restaurant/earnings',
    store: '/restaurant/store',
    subscription: '/restaurant/subscription',
  },
} as const;

/** Each role area and the paths inside it that don't need a session. */
export const areas = [
  { prefix: '/restaurant', signIn: routes.restaurant.signIn, public: [routes.restaurant.signIn] },
] as const;

export function areaFor(pathname: string) {
  return areas.find((a) => pathname === a.prefix || pathname.startsWith(`${a.prefix}/`));
}
