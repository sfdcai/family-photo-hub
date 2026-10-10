import { createFileRoute } from "@tanstack/react-router";

import { PhoneApp } from "@/components/phone-app";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Family Frame — Family planner" },
      { name: "description", content: "Add chores, meals, shopping, events and birthdays to your family frame from your phone." },
      { property: "og:title", content: "Family Frame — Family planner" },
      { property: "og:description", content: "The phone companion for your family photo frame." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Family" },
      { name: "theme-color", content: "#141826" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-512.png" },
    ],
  }),
  component: PhoneApp,
});
