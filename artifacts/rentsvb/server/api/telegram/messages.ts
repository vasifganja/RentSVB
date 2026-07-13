export function newListingMessage(data: {
  owner: string;
  rooms: number;
  city: string;
  address: string;
  price: string;
}) {
  return `
🏠 <b>Yeni elan</b>

👤 ${data.owner}
🏙 ${data.city}
📍 ${data.address}
🚪 ${data.rooms} otaq
💰 ${data.price}
`;
}