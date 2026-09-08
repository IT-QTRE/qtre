import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ServiceDeskFolio, type DeskType } from "@/components/public/service-desk-folio";
import type { AppLocale } from "@/i18n/routing";
import {
  desksInGroup,
  getServiceDesk,
  SERVICE_DESKS,
  serviceDeskPath,
  type ServiceDesk,
} from "@/lib/service-desks";
import { siteUrl } from "@/lib/site";

type DeskDossier = {
  intro: string;
  about: string;
  timeframeTitle?: string;
  timeframe?: string;
  typesTitle?: string;
  types?: DeskType[];
  documentsTitle?: string;
  documents?: string[];
  extraLists?: { id: string; title: string; items: string[] }[];
  coversTitle?: string;
  covers?: DeskType[];
  processTitle: string;
  process: string[];
  applyLabel: string;
  metaDescription: string;
};

function dossierKind(desk: ServiceDesk) {
  return "dossier" in desk ? desk.dossier : undefined;
}

async function loadDossier(
  kind: "residence" | "dependent" | "remote-work" | "golden" | "freelance" | "renewal" | "modification" | "cancellation" | "freezing",
): Promise<DeskDossier> {
  if (kind === "residence") {
    const t = await getTranslations("servicesResidence");
    return {
      intro: t("intro"),
      about: t("about"),
      timeframeTitle: t("timeframeTitle"),
      timeframe: t("timeframe"),
      typesTitle: t("typesTitle"),
      types: [
        { title: t("typeEmploymentTitle"), body: t("typeEmploymentBody"), mark: "briefcase" },
        { title: t("typeInvestorTitle"), body: t("typeInvestorBody"), mark: "landmark" },
        { title: t("typeFamilyTitle"), body: t("typeFamilyBody"), mark: "users" },
        { title: t("typeDomesticTitle"), body: t("typeDomesticBody"), mark: "home" },
        { title: t("typeSpecialistTitle"), body: t("typeSpecialistBody"), mark: "award" },
        { title: t("typeStudentTitle"), body: t("typeStudentBody"), mark: "graduation" },
      ],
      documentsTitle: t("documentsTitle"),
      documents: [
        t("docPassport"),
        t("docPhotos"),
        t("docEntry"),
        t("docForm"),
        t("docMedical"),
        t("docSponsor"),
        t("docInsurance"),
        t("docContract"),
        t("docLicense"),
        t("docFamily"),
      ],
      processTitle: t("processTitle"),
      process: [t("processConsult"), t("processSubmit"), t("processMedical"), t("processBiometric"), t("processIssue")],
      applyLabel: t("apply"),
      metaDescription: t("metaDescription"),
    };
  }

  if (kind === "dependent") {
    const t = await getTranslations("servicesDependent");
    return {
      intro: t("intro"),
      about: t("about"),
      timeframeTitle: t("timeframeTitle"),
      timeframe: t("timeframe"),
      typesTitle: t("typesTitle"),
      types: [
        { title: t("typeSpouseTitle"), body: t("typeSpouseBody"), mark: "heart" },
        { title: t("typeChildrenTitle"), body: t("typeChildrenBody"), mark: "baby" },
        { title: t("typeParentTitle"), body: t("typeParentBody"), mark: "user" },
        { title: t("typeInLawTitle"), body: t("typeInLawBody"), mark: "usersRound" },
      ],
      documentsTitle: t("documentsTitle"),
      documents: [
        t("docSponsor"),
        t("docPassports"),
        t("docPhotos"),
        t("docMarriage"),
        t("docBirth"),
        t("docSalary"),
        t("docTenancy"),
        t("docUtilities"),
        t("docMedical"),
        t("docInsurance"),
      ],
      extraLists: [
        { id: "service-desk-salary-heading", title: t("salaryTitle"), items: [t("salaryMale"), t("salaryFemale"), t("salaryParents")] },
        { id: "service-desk-housing-heading", title: t("housingTitle"), items: [t("housingImmediate"), t("housingExtended"), t("housingUtilities")] },
      ],
      processTitle: t("processTitle"),
      process: [
        t("processConsult"),
        t("processCollect"),
        t("processAttest"),
        t("processSubmit"),
        t("processBiometric"),
        t("processIssue"),
      ],
      applyLabel: t("apply"),
      metaDescription: t("metaDescription"),
    };
  }

  if (kind === "remote-work") {
    const t = await getTranslations("servicesRemote");
    return {
      intro: t("intro"),
      about: t("about"),
      timeframeTitle: t("timeframeTitle"),
      timeframe: t("timeframe"),
      extraLists: [
        {
          id: "service-desk-general-heading",
          title: t("reqGeneralTitle"),
          items: [t("reqGeneralPassport"), t("reqGeneralInsurance"), t("reqGeneralPhotos"), t("reqGeneralAddress"), t("reqGeneralPolice")],
        },
        {
          id: "service-desk-employee-heading",
          title: t("reqEmployeeTitle"),
          items: [t("reqEmployeeContract"), t("reqEmployeeSalary"), t("reqEmployeePayslip"), t("reqEmployeeBank"), t("reqEmployeeLetter")],
        },
        {
          id: "service-desk-owner-heading",
          title: t("reqOwnerTitle"),
          items: [t("reqOwnerProof"), t("reqOwnerIncome"), t("reqOwnerBank"), t("reqOwnerReg"), t("reqOwnerActivity")],
        },
      ],
      coversTitle: t("coversTitle"),
      covers: [
        { title: t("coverLiveTitle"), body: t("coverLiveBody"), mark: "mapPin" },
        { title: t("coverServicesTitle"), body: t("coverServicesBody"), mark: "landmark" },
        { title: t("coverTaxTitle"), body: t("coverTaxBody"), mark: "receipt" },
        { title: t("coverFamilyTitle"), body: t("coverFamilyBody"), mark: "users" },
      ],
      processTitle: t("processTitle"),
      process: [
        t("processConsult"),
        t("processDocs"),
        t("processSubmit"),
        t("processPermit"),
        t("processEntry"),
        t("processIssue"),
      ],
      applyLabel: t("apply"),
      metaDescription: t("metaDescription"),
    };
  }

  if (kind === "golden") {
    const t = await getTranslations("servicesGolden");
    return {
      intro: t("intro"),
      about: t("about"),
      timeframeTitle: t("timeframeTitle"),
      timeframe: t("timeframe"),
      typesTitle: t("typesTitle"),
      types: [
        { title: t("typeTenTitle"), body: t("typeTenBody"), mark: "calendar" },
        { title: t("typeFiveTitle"), body: t("typeFiveBody"), mark: "home" },
      ],
      extraLists: [
        {
          id: "service-desk-ten-heading",
          title: t("reqTenTitle"),
          items: [
            t("reqTenInvestor"),
            t("reqTenTalent"),
            t("reqTenScience"),
            t("reqTenExec"),
            t("reqTenDoctors"),
            t("reqTenSchool"),
          ],
        },
        {
          id: "service-desk-five-heading",
          title: t("reqFiveTitle"),
          items: [
            t("reqFiveProperty"),
            t("reqFiveFounder"),
            t("reqFiveGpa"),
            t("reqFiveUni"),
            t("reqFiveSchool"),
          ],
        },
      ],
      coversTitle: t("coversTitle"),
      covers: [
        { title: t("coverTermTitle"), body: t("coverTermBody"), mark: "award" },
        { title: t("coverFamilyTitle"), body: t("coverFamilyBody"), mark: "users" },
        { title: t("coverSponsorTitle"), body: t("coverSponsorBody"), mark: "user" },
        { title: t("coverBusinessTitle"), body: t("coverBusinessBody"), mark: "briefcase" },
      ],
      processTitle: t("processTitle"),
      process: [
        t("processConsult"),
        t("processDocs"),
        t("processSubmit"),
        t("processReview"),
        t("processBiometric"),
        t("processIssue"),
      ],
      applyLabel: t("apply"),
      metaDescription: t("metaDescription"),
    };
  }

  if (kind === "freelance") {
    const t = await getTranslations("servicesFreelance");
    return {
    intro: t("intro"),
    about: t("about"),
    timeframeTitle: t("timeframeTitle"),
    timeframe: t("timeframe"),
    typesTitle: t("typesTitle"),
    types: [
      { title: t("typeMediaTitle"), body: t("typeMediaBody"), mark: "clapperboard" },
      { title: t("typeTechTitle"), body: t("typeTechBody"), mark: "monitor" },
      { title: t("typeEducationTitle"), body: t("typeEducationBody"), mark: "graduation" },
      { title: t("typeDesignTitle"), body: t("typeDesignBody"), mark: "palette" },
    ],
    documentsTitle: t("documentsTitle"),
    documents: [
      t("docCv"),
      t("docPhoto"),
      t("docPassport"),
      t("docBank"),
      t("docNoc"),
      t("docPassportOriginal"),
      t("docEstablishment"),
      t("docInsurance"),
      t("docPhotos"),
      t("docVisa"),
    ],
    coversTitle: t("coversTitle"),
    covers: [
      { title: t("coverClientsTitle"), body: t("coverClientsBody"), mark: "briefcase" },
      { title: t("coverPlaceTitle"), body: t("coverPlaceBody"), mark: "mapPin" },
      { title: t("coverLicenseTitle"), body: t("coverLicenseBody"), mark: "award" },
      { title: t("coverBankTitle"), body: t("coverBankBody"), mark: "landmark" },
    ],
    processTitle: t("processTitle"),
    process: [
      t("processConsult"),
      t("processPermit"),
      t("processDocs"),
      t("processIssue"),
      t("processEmployment"),
      t("processMedical"),
      t("processStamp"),
    ],
    applyLabel: t("apply"),
    metaDescription: t("metaDescription"),
  };
  }

  if (kind === "renewal") {
    const t = await getTranslations("servicesRenewal");
    return {
    intro: t("intro"),
    about: t("about"),
    extraLists: [
      {
        id: "service-desk-covers-list-heading",
        title: t("coversTitle"),
        items: [
          t("coverReminders"),
          t("coverDocs"),
          t("coverLiaison"),
          t("coverPenalties"),
          t("coverOps"),
          t("coverComplex"),
          t("coverUpdates"),
        ],
      },
    ],
    processTitle: t("processTitle"),
    process: [
      t("processDocs"),
      t("processSubmit"),
      t("processPay"),
      t("processCollect"),
      t("processCheck"),
    ],
    applyLabel: t("apply"),
    metaDescription: t("metaDescription"),
    };
  }

  if (kind === "modification") {
    const t = await getTranslations("servicesModification");
    return {
    intro: t("intro"),
    about: t("about"),
    extraLists: [
      {
        id: "service-desk-amendments-heading",
        title: t("amendmentsTitle"),
        items: [
          t("amendName"),
          t("amendActivity"),
          t("amendAddress"),
          t("amendSponsor"),
          t("amendManagement"),
          t("amendPartner"),
          t("amendCapital"),
        ],
      },
    ],
    processTitle: t("processTitle"),
    process: [
      t("processForm"),
      t("processApprovals"),
      t("processDocs"),
      t("processPay"),
      t("processCollect"),
    ],
    applyLabel: t("apply"),
    metaDescription: t("metaDescription"),
    };
  }

  if (kind === "cancellation") {
    const t = await getTranslations("servicesCancellation");
    return {
    intro: t("intro"),
    about: t("about"),
    extraLists: [
      {
        id: "service-desk-requirements-heading",
        title: t("requirementsTitle"),
        items: [
          t("reqClearance"),
          t("reqInform"),
          t("reqLiabilities"),
          t("reqInterests"),
          t("reqReputation"),
        ],
      },
    ],
    processTitle: t("processTitle"),
    process: [
      t("processConsult"),
      t("processNotify"),
      t("processNoc"),
      t("processVisa"),
      t("processClose"),
    ],
    applyLabel: t("apply"),
    metaDescription: t("metaDescription"),
    };
  }

  const t = await getTranslations("servicesFreezing");
  return {
    intro: t("intro"),
    about: t("about"),
    extraLists: [
      {
        id: "service-desk-fee-heading",
        title: t("feeTitle"),
        items: [t("feeLine")],
      },
    ],
    processTitle: t("processTitle"),
    process: [
      t("processLetter"),
      t("processVisa"),
      t("processMohre"),
      t("processInspect"),
      t("processClose"),
    ],
    applyLabel: t("apply"),
    metaDescription: t("metaDescription"),
  };
}

export function generateStaticParams() {
  return SERVICE_DESKS.map((desk) => ({ group: desk.group, desk: desk.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ group: string; desk: string }>;
}): Promise<Metadata> {
  const { group, desk: slug } = await params;
  const desk = getServiceDesk(group, slug);
  const [localeRaw, tBrand, tServices] = await Promise.all([
    getLocale(),
    getTranslations("brand"),
    getTranslations("servicesPage"),
  ]);
  if (!desk) return { title: tBrand("name") };
  const locale = localeRaw as AppLocale;
  const title = tServices(desk.nameKey);
  const kind = dossierKind(desk);
  const description = kind ? (await loadDossier(kind)).metaDescription : tServices(desk.bodyKey);
  return {
    title: `${title} | ${tBrand("name")}`,
    description,
    alternates: { canonical: `${siteUrl}/${locale}${serviceDeskPath(desk)}` },
  };
}

export default async function ServiceDeskPage({
  params,
}: {
  params: Promise<{ group: string; desk: string }>;
}) {
  const { group, desk: slug } = await params;
  const desk = getServiceDesk(group, slug);
  if (!desk) notFound();

  const kind = dossierKind(desk);
  const [tNav, tCatalog, tServices, dossier] = await Promise.all([
    getTranslations("nav"),
    getTranslations("catalog"),
    getTranslations("servicesPage"),
    kind ? loadDossier(kind) : Promise.resolve(null),
  ]);

  const title = tServices(desk.nameKey);
  const siblings = desksInGroup(desk.group).map((item) => ({
    href: serviceDeskPath(item),
    name: tServices(item.nameKey),
    current: item.slug === desk.slug,
  }));

  return (
    <ServiceDeskFolio
      title={title}
      intro={dossier?.intro ?? tServices(desk.bodyKey)}
      about={dossier?.about}
      timeframeTitle={dossier?.timeframeTitle}
      timeframe={dossier?.timeframe}
      typesTitle={dossier?.typesTitle}
      types={dossier?.types}
      documentsTitle={dossier?.documentsTitle}
      documents={dossier?.documents}
      extraLists={dossier?.extraLists}
      coversTitle={dossier?.coversTitle}
      covers={dossier?.covers}
      processTitle={dossier?.processTitle}
      process={dossier?.process}
      breadcrumbLabel={tCatalog("breadcrumb")}
      homeLabel={tNav("home")}
      parentLabel={tNav("services")}
      siblingsTitle={desk.group === "visa" ? tServices("visaTitle") : tServices("licenseTitle")}
      siblings={siblings}
      inquiryGroup={desk.group}
      inquiryDesk={desk.slug}
    />
  );
}
