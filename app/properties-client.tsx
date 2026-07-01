"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PropertiesClient() {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    fetch("/api/properties")
      .then((res) => res.json())
      .then((data) => setProperties(data));
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>Properties</h1>

      {properties.map((p: any) => (
        <div
          key={p.id}
          style={{
            border: "1px solid #ddd",
            padding: 20,
            marginTop: 10,
            borderRadius: 10,
          }}
        >
          <h3>{p.title}</h3>
          <p>{p.location}</p>
          <b>${p.price}</b>

          <br />

          <Link href={`/property/${p.id}`}>
            <button style={{ marginTop: 10 }}>View</button>
          </Link>
        </div>
      ))}
    </div>
  );
}