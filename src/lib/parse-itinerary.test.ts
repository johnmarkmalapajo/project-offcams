// Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseItinerary } from "./parse-itinerary.ts";

test("parses the DOST NSTW example itinerary", () => {
  const p = parseItinerary(`DOST NSTW Level Up 3.0
General Santos City
Ingress: November 25, 2026
Egress: November 27, 2026

Activities
Day 1 - MNL to Gensan
Day 2 - Gensan (Lodging) to GMALL (event location)
Day 3 - Gensan (Lodging) to GMALL (event location)
- GMALL to Airport etc...`);
  assert.equal(p.title, "DOST NSTW Level Up 3.0");
  assert.equal(p.destination, "General Santos City");
  assert.equal(p.ingress, "2026-11-25");
  assert.equal(p.egress, "2026-11-27");
  assert.deepEqual(p.legs[1], [{ from: "MNL", to: "Gensan" }]);
  assert.deepEqual(p.legs[3], [
    { from: "Gensan (Lodging)", to: "GMALL (event location)" },
    { from: "GMALL", to: "Airport" },
  ]);
});
