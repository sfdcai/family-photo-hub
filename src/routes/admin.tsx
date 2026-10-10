import { createFileRoute } from "@tanstack/react-router";

import { AdminPanel } from "@/components/admin-panel";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Family Frame — Admin" },
      { name: "description", content: "Set up photos, Immich, weather, calendars, festivals, the frame screen and security for Family Frame." },
      { property: "og:title", content: "Family Frame — Admin" },
      { property: "og:description", content: "Every Family Frame setting in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPanel,
});
