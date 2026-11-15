"use client";

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Only a publishable key belongs in browser code; access is controlled by RLS.
export const supabase = url && key ? createBrowserClient(url, key) : null;
