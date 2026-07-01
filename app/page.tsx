import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function HomePage() {
  const { data: properties, error } = await supabase
    .from("properties")
    .select("*");

  if (error) {
    return <h1>Error loading properties</h1>;
  }

  return (
    <div
      style={{
        padding: 30,
        background: "#f6f6f6",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ marginBottom: 20 }}>🏠 Properties</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 20,
        }}
      >
        {properties?.map((item) => (
          <div
            key={item.id}
            style={{
              background: "white",
              borderRadius: 15,
              padding: 15,
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            }}
          >
            {/* IMAGE */}
            <img
              src={item.image_url}
              alt={item.title}
              style={{
                width: "100%",
                height: 180,
                objectFit: "cover",
                borderRadius: 10,
                marginBottom: 10,
              }}
            />

            <h3>{item.title}</h3>
            <p style={{ color: "#666" }}>{item.city}</p>

            <p style={{ fontWeight: "bold" }}>${item.weekday_price}</p>

            <Link
              href={`/property/${item.id}`}
              style={{
                display: "inline-block",
                marginTop: 10,
                padding: "8px 12px",
                background: "#ff385c",
                color: "white",
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}