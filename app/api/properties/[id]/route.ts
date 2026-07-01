import { properties } from "@/lib/properties";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const property = properties.find((p) => p.id === Number(id));

  if (!property) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(property);
}