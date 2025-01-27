export function formatDate(date: Date | null, alt: string): string {
    if (!date) return alt;

    const day = date.getDate().toString().padStart(2, "0"); // Giorno a due cifre
    const monthNames = [
        "gen",
        "feb",
        "mar",
        "apr",
        "mag",
        "giu",
        "lug",
        "ago",
        "set",
        "ott",
        "nov",
        "dic",
    ]; // Nomi mesi in italiano
    const month = monthNames[date.getMonth()]; // Ottieni nome del mese
    const year = date.getFullYear(); // Anno
    const hours = date.getHours().toString().padStart(2, "0"); // Ore a due cifre
    const minutes = date.getMinutes().toString().padStart(2, "0"); // Minuti a due cifre
    const seconds = date.getSeconds().toString().padStart(2, "0"); // Secondi a due cifre

    return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`;
}

// Capitalize first letter of every word in a string
export function capitalizeFirstLetter(str: string): string {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
}
