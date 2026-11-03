import {
  CaretRightIcon,
  MapPinIcon,
  ReceiptIcon,
  SignOutIcon,
  UserIcon,
} from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { getCustomer } from '@/lib/customer';
import { routes } from '@/lib/routes';
import { signOut } from './actions';

const row = 'flex h-14 w-full items-center gap-4 text-[17px]';
const iconBox = 'flex size-10 items-center justify-center rounded-full bg-card';

export default async function ProfilePage() {
  const { user, name } = await getCustomer(routes.customer.account);
  return (
    <>
      <h1 className="text-[28px] font-extrabold">Profile</h1>
      <div className="mt-6 flex items-center gap-4">
        <span className="flex size-16 items-center justify-center rounded-full bg-peach text-brand">
          <UserIcon weight="bold" className="size-7" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xl font-bold">{name}</p>
          <p className="truncate text-muted">{user.email}</p>
        </div>
      </div>

      <ul className="mt-6 divide-y divide-line">
        {[
          ['Saved addresses', routes.customer.addresses, MapPinIcon],
          ['My orders', routes.customer.orders, ReceiptIcon],
        ].map(([label, href, Icon]) => {
          const I = Icon as typeof MapPinIcon;
          return (
            <li key={href as string}>
              <Link href={href as string} className={row}>
                <span className={iconBox}>
                  <I weight="bold" className="size-5" aria-hidden />
                </span>
                <span className="flex-1 font-medium">{label as string}</span>
                <CaretRightIcon weight="bold" className="size-4 text-muted" aria-hidden />
              </Link>
            </li>
          );
        })}
        <li>
          <form action={signOut}>
            <button type="submit" className={`${row} text-brand`}>
              <span className={`${iconBox} bg-peach`}>
                <SignOutIcon weight="bold" className="size-5" aria-hidden />
              </span>
              <span className="font-semibold">Log out</span>
            </button>
          </form>
        </li>
      </ul>
    </>
  );
}
