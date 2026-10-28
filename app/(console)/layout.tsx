import { ConsoleShell } from "@/components/console-shell";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ConsoleShell>{children}</ConsoleShell>;
}
