import { HydrateClient } from "~/trpc/server";
import Header from "./_components/header";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/admin");
  }

  return (
    <HydrateClient>
      <Header panel={null}>
      </Header>
    </HydrateClient>
  );
}
