import { AppProviders } from "./providers.tsx";

type RootLayoutViewProps = Readonly<{
  children: React.ReactNode;
}>;

export function RootLayoutView({ children }: RootLayoutViewProps) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
