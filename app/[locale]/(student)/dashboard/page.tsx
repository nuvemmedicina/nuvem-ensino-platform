import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NovoInicio } from "./NovoInicio";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard");

  return <NovoInicio userId={session.user.id} nome={session.user.name?.split(" ")[0] ?? ""} locale={locale} />;
}
