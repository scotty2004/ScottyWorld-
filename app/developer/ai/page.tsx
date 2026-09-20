import { redirect } from "next/navigation";

// The Scotty AI code helper now lives inside the Developer Hub (Overview tab).
export default function DeveloperAIPage() {
  redirect("/developer");
}
