/** Design tokens from the Figma file. */
export const colors = {
  ink: '#1b1410',
  brand: '#f83a03',
  brandHover: '#e03400',
  muted: '#8a8078',
  mutedLight: '#a89e97',
  line: '#ede6e1',
  card: '#f7f2ef',
  peach: '#ffede6',
  danger: '#d92e21',
  ok: '#1c8a4c',
  okBg: '#e3f6ea',
  white: '#ffffff',
  onDark: '#e6dcd4',
  navIcon: '#c9bfb8',
} as const;

export const shadow = {
  brand: {
    shadowColor: '#f73b03',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  soft: {
    shadowColor: '#1a0d00',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  nav: {
    shadowColor: '#1a0d00',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
} as const;
