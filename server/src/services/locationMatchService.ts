import { prisma } from "../db.js";
import { LOCATION_ALIASES } from "./fallbackParser.js";

/**
 * Matches a free-text destination string to a Location record in the database.
 * Uses alias table + fuzzy substring matching. Never invents locations.
 * Returns { matched: Location, confidence } or null if no confident match.
 */
export async function matchLocation(destination: string | undefined): Promise<{
  location: { id: string; name: string; address: string; city: string; hourlyRate: number } | null;
  confidence: "HIGH" | "LOW";
  suggestions: string[];
}> {
  const allLocations = await prisma.location.findMany({
    select: { id: true, name: true, address: true, city: true, hourlyRate: true },
  });

  if (!destination) {
    return {
      location: null,
      confidence: "LOW",
      suggestions: allLocations.map((l) => l.name),
    };
  }

  const lower = destination.toLowerCase().trim();

  // 1. Exact match from alias table
  const aliasMatch = LOCATION_ALIASES[lower];
  if (aliasMatch) {
    const found = allLocations.find((l) =>
      l.name.toLowerCase().includes(aliasMatch.toLowerCase())
    );
    if (found) return { location: found, confidence: "HIGH", suggestions: [] };
  }

  // 2. Direct substring match against DB names
  const directMatch = allLocations.find(
    (l) =>
      l.name.toLowerCase().includes(lower) ||
      lower.includes(l.name.toLowerCase().split(" - ")[0].toLowerCase()) ||
      l.address.toLowerCase().includes(lower) ||
      l.city.toLowerCase() === lower
  );
  if (directMatch) return { location: directMatch, confidence: "HIGH", suggestions: [] };

  // 3. Partial token overlap — any word match
  const destTokens = lower.split(/\s+/);
  let bestMatch: { location: typeof allLocations[0]; score: number } | null = null;

  for (const loc of allLocations) {
    const locTokens = loc.name.toLowerCase().split(/[\s\-,]+/);
    const hits = destTokens.filter((t) => t.length > 2 && locTokens.some((lt) => lt.includes(t) || t.includes(lt)));
    if (hits.length > 0 && (!bestMatch || hits.length > bestMatch.score)) {
      bestMatch = { location: loc, score: hits.length };
    }
  }

  if (bestMatch && bestMatch.score >= 1) {
    return { location: bestMatch.location, confidence: "LOW", suggestions: [] };
  }

  // 4. No match — return all location names as suggestions
  return {
    location: null,
    confidence: "LOW",
    suggestions: allLocations.map((l) => l.name),
  };
}
