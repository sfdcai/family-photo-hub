import { createFileRoute } from "@tanstack/react-router";
import { FamilyFrame } from "@/components/family-frame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Family Frame — Our day, beautifully together" },
      { name: "description", content: "A photo-first family display with weather, schedules, tasks, UK and Indian holidays, and Hindu festivals." },
      { property: "og:title", content: "Family Frame — Our day, beautifully together" },
      { property: "og:description", content: "A warm, playful home display that keeps family photos at the heart of every day." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <FamilyFrame />;
}
