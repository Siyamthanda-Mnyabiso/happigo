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
  driver: {
    signIn: '/driver/sign-in',
    join: '/driver/join',
    home: '/driver/home',
    delivery: (id: string) => `/driver/deliveries/${id}`,
    earnings: '/driver/earnings',
    profile: '/driver/profile',
  },
} as const;

/** Each role area and the paths inside it that don't need a session. */
export const areas = [
  { prefix: '/restaurant', signIn: routes.restaurant.signIn, public: [routes.restaurant.signIn] },
  {
    prefix: '/driver',
    signIn: routes.driver.signIn,
    public: [routes.driver.signIn, routes.driver.join],
  },
] as const;

export function areaFor(pathname: string) {
  return areas.find((a) => pathname === a.prefix || pathname.startsWith(`${a.prefix}/`));
}
