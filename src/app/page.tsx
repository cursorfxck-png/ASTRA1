import LandingPage from "@/components/LandingPage";
import { getSiteContent } from "@/lib/content";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  noStore();
  const content = await getSiteContent();

  return <LandingPage content={content} key={content.heroSlides.map((slide) => slide.id).join("-")} />;
}
