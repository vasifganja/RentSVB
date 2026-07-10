export type Rental = {
  id: string;

  start_date: string;
  end_date: string;

  days: number;

  price_per_day: number;

  commission_rate: number;
  commission_amount: number;

  is_paid: boolean;

  note: string | null;

  created_at: string;

  property: {
    address: string;
    rooms: number;
  } | null;

  owner: {
    id: string;
    full_name: string;
    phone: string;
  } | null;

  customer_name?: string | null;
  customer_phone?: string |null;

  payment_method?: "cash" | "card" | "salary";

  payment_status?: "pending" | "paid";

  paid_at?: string | null;
};