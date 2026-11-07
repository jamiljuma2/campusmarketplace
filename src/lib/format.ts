export const kes = (amount: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount);
export const dateLabel = (value: string) => new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeZone: "Africa/Nairobi" }).format(new Date(value));
