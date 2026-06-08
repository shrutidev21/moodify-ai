import { redirect } from "next/navigation";

interface SignUpPageProps {
  searchParams?: Promise<{ from?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams({ auth: "signup" });

  if (params?.from) {
    query.set("from", params.from);
  }

  redirect(`/?${query.toString()}`);
}
