"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveAdminSession } from "@/lib/adminAuth";

export default function AdminLogin() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function login() {
    if (username === "admin" && password === "admin123") {
      saveAdminSession(username);
      router.push("/admin");
      return;
    }

    alert("Login və ya parol yanlışdır");
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 20 }}>
      <h2>Admin Login</h2>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />

      <button
        onClick={login}
        style={{ width: "100%", padding: 12 }}
      >
        Login
      </button>
    </div>
  );
}