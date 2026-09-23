import { Sidebar } from "@/components/sidebar";

export default function ChatLayout({ children }: LayoutProps<"/chat">) {
  return (
    <div className="flex min-h-0 flex-1">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
