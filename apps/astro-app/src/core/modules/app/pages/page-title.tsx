/** The heading for every view except the dashboard, which greets you instead. */
export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
      {children}
    </h1>
  );
}
