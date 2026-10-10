import { createFileRoute } from "@tanstack/react-router";

import { FamilyFrame } from "@/components/family-frame";

export const Route = createFileRoute("/frame")({
  head: () => ({
    meta: [
      { title: "Family Frame — Wall display" },
      { name: "description", content: "Full-screen family photo frame with weather, planner, chores and festivals." },
      { property: "og:title", content: "Family Frame — Wall display" },
      { property: "og:description", content: "The full-screen display for the family photo frame." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FamilyFrame,
});
