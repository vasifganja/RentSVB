import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase.from("properties").select("*");

  if (error) {
    return Response.json({ error: "failed" }, { status: 500 });
  }

  return Response.json(data);
}