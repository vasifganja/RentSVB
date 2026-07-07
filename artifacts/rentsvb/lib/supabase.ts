import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rvdfhdkiofwtwgekaerz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2ZGZoZGtpb2Z3dHdnZWthZXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NDY5NjUsImV4cCI6MjA5ODUyMjk2NX0.OKeK7KGu3RHbP03uRMEXN37cGUbWckXuy4zVze6k2wE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Property = {
  id: string;
  owner_id: string;
  rooms: number;
  address: string;
  district: string;
  price_weekday: number | null;
  price_weekend: number | null;
  price_type: "fixed" | "weekday_weekend" | "negotiable";
  max_people: number;
  salary_credit: boolean;
  advance_credit: boolean;
  description: string;
  status: "available" | "busy" | "salary_credit";
  images: string[];
  created_at: string;
  owner?: Owner;
};

export type Owner = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  telegram_username: string;
  is_approved: boolean;
  created_at: string;
  listing_count?: number;
};

export type User = {
  id: string;
  telegram_id: string | null;
  full_name: string;
  phone: string;
  role: "user" | "owner" | "admin";
  is_approved: boolean;
  created_at: string;
};
