import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export const unauth = () => NextResponse.json({ error: "Authentication required." }, { status: 401 });
export const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** Returns the signed-in user or null (caller returns unauth()). */
export const me = () => getCurrentUser();

export const ADMIN_ROLES_ALL = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT", "CONTENT_MANAGER", "FINANCE_MANAGER"];
