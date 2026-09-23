import { Sidebar } from "@/components/sidebar";

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </>
  );
}
