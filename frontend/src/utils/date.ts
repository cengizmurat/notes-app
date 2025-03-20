export function formatFromUTC(date: Date) {
    return new Date(date + "Z").toLocaleString();
}