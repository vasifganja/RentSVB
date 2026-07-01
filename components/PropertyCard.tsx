"use client";

type Property = {
  id: string;
  city: string;
  address: string;
  rooms: number;
  weekday_price: number;
  image_url?: string;
};

export default function PropertyCard({
  property,
}: {
  property: Property;
}) {
  return (
    <div
      onClick={() => (window.location.href = `/property/${property.id}`)}
      style={{
        cursor: "pointer",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #e5e5e5",
        background: "#fff",
        transition: "0.2s",
      }}
    >
      <div style={{ position: "relative" }}>
        {property.image_url ? (
          <img
            src={property.image_url}
            alt={property.city}
            style={{
              width: "100%",
              height: 220,
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: 220,
              background: "#eee",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            Şəkil yoxdur
          </div>
        )}

        <button
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            border: "none",
            background: "white",
            borderRadius: "50%",
            width: 38,
            height: 38,
            fontSize: 20,
            cursor: "pointer",
          }}
        >
          🤍
        </button>
      </div>

      <div style={{ padding: 14 }}>
        <h3 style={{ marginBottom: 5 }}>{property.city}</h3>

        <p
          style={{
            color: "#666",
            marginBottom: 10,
          }}
        >
          {property.address}
        </p>

        <p>🏠 {property.rooms} otaq</p>

        <h2
          style={{
            marginTop: 10,
          }}
        >
          {property.weekday_price} ₽
        </h2>
      </div>
    </div>
  );
}