import { handlers } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const { GET, POST } = handlers;
