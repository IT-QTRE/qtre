import Script from "next/script";
import { api } from "@/convex/_generated/api";
import { fetchPublicQuery } from "@/lib/convex/fetch-public-query";

const GHL_CHAT_LOADER_SRC = "https://widgets.leadconnectorhq.com/loader.js";
const GHL_CHAT_RESOURCES_URL = "https://widgets.leadconnectorhq.com/chat-widget/loader.js";

function GhlChatWidgetScript({ widgetId }: { widgetId: string }) {
  return (
    <Script
      id="ghl-chat-widget"
      src={GHL_CHAT_LOADER_SRC}
      strategy="afterInteractive"
      data-resources-url={GHL_CHAT_RESOURCES_URL}
      data-widget-id={widgetId}
    />
  );
}

export async function PublicGhlChatWidget() {
  const settings = await fetchPublicQuery(api.websiteSettings.publicGet, {});
  const widgetId = settings?.chatWidgetId;
  if (!widgetId) return null;
  return <GhlChatWidgetScript widgetId={widgetId} />;
}
