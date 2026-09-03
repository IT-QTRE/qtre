import { getTranslations } from "next-intl/server";
import { IdentityPlateView } from "@/components/public/identity-plate-view";

export async function IdentityPlate({ title, body }: { title: string; body: string }) {
  const tNav = await getTranslations("nav");
  return <IdentityPlateView title={title} body={body} aboutLabel={tNav("about")} />;
}
