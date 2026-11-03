/** The customer app is a phone app. On a wide screen it sits centred on a soft background. */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:bg-card">
      <div className="relative mx-auto min-h-dvh w-full max-w-[430px] bg-white md:shadow-[0_0_0_1px_var(--line)]">
        {children}
      </div>
    </div>
  );
}
