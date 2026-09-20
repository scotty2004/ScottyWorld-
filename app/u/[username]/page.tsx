"use client";

import { use } from "react";
import { ProfileView } from "@/components/profile-view";

export default function UserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  return <ProfileView username={username} />;
}
