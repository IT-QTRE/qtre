"use client";

import { useTranslations } from "next-intl";
import { getServiceDesk, serviceDeskPath, type ServiceGroup } from "@/lib/service-desks";
import { ServiceIntakeWizard } from "@/components/public/service-intake-wizard";

export function ServiceInquiryWizard({
  initialGroup,
  initialDesk,
}: {
  initialGroup: ServiceGroup;
  initialDesk: string;
}) {
  const tServices = useTranslations("servicesPage");
  const desk = getServiceDesk(initialGroup, initialDesk);
  if (!desk) return null;

  const name = tServices(desk.nameKey);
  const types = "typesKey" in desk ? tServices(desk.typesKey) : undefined;

  return (
    <ServiceIntakeWizard
      group={desk.group}
      items={[
        {
          name,
          types,
          href: serviceDeskPath(desk),
          group: desk.group,
          slug: desk.slug,
        },
      ]}
      idPrefix="desk-service"
      locked
    />
  );
}
