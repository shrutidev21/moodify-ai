import { redirect } from "next/navigation";

interface SignInPageProps {
  searchParams?: Promise<{ from?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams({ auth: "signin" });

  if (params?.from) {
    query.set("from", params.from);
  }

  redirect(`/?${query.toString()}`);
}
