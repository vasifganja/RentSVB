"use client";

import { useState } from "react";

type Props = {
  images: string[];
};

export default function ImageSlider({ images }: Props) {
  const [index, setIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div
        style={{
          height: 400,
          background: "#eee",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 12,
        }}
      >
        Şəkil yoxdur
      </div>
    );
  }

  function next() {
    setIndex((prev) => (prev + 1) % images.length);
  }

  function prev() {
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  }

  return (
    <div style={{ position: "relative" }}>
      <img
        src={images[index]}
        style={{
          width: "100%",
          height: 450,
          objectFit: "cover",
          borderRadius: 12,
        }}
      />

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "white",
              border: "none",
              padding: 10,
              borderRadius: "50%",
              cursor: "pointer",
            }}
          >
            ←
          </button>

          <button
            onClick={next}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "white",
              border: "none",
              padding: 10,
              borderRadius: "50%",
              cursor: "pointer",
            }}
          >
            →
          </button>
        </>
      )}
    </div>
  );
}