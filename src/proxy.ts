import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/supabase/database.types';
import { areaFor } from '@/lib/routes';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  const { data } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const area = areaFor(path);
  const isPublic = (area?.public as readonly string[] | undefined)?.includes(path);
  if (area && !data.user && !isPublic) {
    const url = new URL(area.signIn, request.url);
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }
  return response;
}

// Must be a literal for Next to read it. Add each role area from lib/routes.ts here.
export const config = {
  matcher: [
    '/restaurant/:path*',
    '/driver/:path*',
    '/orders/:path*',
    '/checkout/:path*',
    '/account/:path*',
  ],
};
