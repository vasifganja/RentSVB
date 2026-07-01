import { supabase } from "@/lib/supabase";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: property, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.log("ERROR:", error);
    return <h1>Error loading property</h1>;
  }

  if (!property) {
    return <h1>Not found</h1>;
  }

  return (
    <div
      style={{
        padding: 40,
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <img
        src={property.image_url}
        style={{
          width: "100%",
          height: 420,
          objectFit: "cover",
          borderRadius: 16,
        }}
      />

      <h1 style={{ marginTop: 20 }}>{property.title}</h1>
      <p style={{ color: "#666" }}>{property.city}</p>

      <h2 style={{ marginTop: 10 }}>${property.weekday_price}</h2>

      <div style={{ marginTop: 15, color: "#444" }}>
        🛏 {property.bedrooms ?? 0} bedrooms • 🚿 {property.bathrooms ?? 0} bathrooms
      </div>

      <p style={{ marginTop: 20, lineHeight: 1.6 }}>
        {property.description ?? "No description"}
      </p>

      <button
        style={{
          marginTop: 25,
          padding: "12px 20px",
          background: "#ff385c",
          color: "white",
          border: "none",
          borderRadius: 10,
        }}
      >
        Book Now
      </button>
    </div>
  );
}