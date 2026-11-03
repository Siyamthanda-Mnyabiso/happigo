/** Every path in the app lives here, so a rename is a one-line change. */
export const routes = {
  restaurant: {
    signIn: '/restaurant/sign-in',
    planOnboarding: '/restaurant/onboarding/plan',
    bankOnboarding: '/restaurant/onboarding/bank',
    orders: '/restaurant/orders',
    menu: '/restaurant/menu',
    menuNew: '/restaurant/menu/new',
    menuItem: (id: string) => `/restaurant/menu/${id}`,
    earnings: '/restaurant/earnings',
    store: '/restaurant/store',
    subscription: '/restaurant/subscription',
  },
  customer: {
    home: '/',
    restaurant: (id: string) => `/r/${id}`,
    search: '/search',
    item: (rid: string, iid: string) => `/r/${rid}/items/${iid}`,
    cart: '/cart',
    addresses: '/account/addresses',
    checkout: '/checkout',
    orders: '/orders',
    order: (id: string) => `/orders/${id}`,
    account: '/account',
    signIn: '/sign-in',
    signUp: '/sign-up',
  },
  driver: {
    signIn: '/driver/sign-in',
    join: '/driver/join',
    home: '/driver/home',
    delivery: (id: string) => `/driver/deliveries/${id}`,
    earnings: '/driver/earnings',
    profile: '/driver/profile',
  },
  admin: {
    signIn: '/admin/sign-in',
    overview: '/admin',
    restaurants: '/admin/restaurants',
    drivers: '/admin/drivers',
    orders: '/admin/orders',
    customers: '/admin/customers',
  },
} as const;

/** Each role area and the paths inside it that don't need a session. */
export const areas = [
  { prefix: '/restaurant', signIn: routes.restaurant.signIn, public: [routes.restaurant.signIn] },
  { prefix: '/orders', signIn: routes.customer.signIn, public: [] },
  { prefix: '/checkout', signIn: routes.customer.signIn, public: [] },
  { prefix: '/account', signIn: routes.customer.signIn, public: [] },
  {
    prefix: '/driver',
    signIn: routes.driver.signIn,
    public: [routes.driver.signIn, routes.driver.join],
  },
  { prefix: '/admin', signIn: routes.admin.signIn, public: [routes.admin.signIn] },
] as const;

export function areaFor(pathname: string) {
  return areas.find((a) => pathname === a.prefix || pathname.startsWith(`${a.prefix}/`));
}
