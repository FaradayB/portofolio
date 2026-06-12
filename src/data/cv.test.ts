import { describe, it, expect } from "vitest";
import { cv } from "./cv";

describe("cv data", () => {
  it("has core identity", () => {
    expect(cv.name).toBe("Faraday Barr Fatahillah");
    expect(cv.role).toBe("AI Engineer");
    expect(cv.bio.length).toBeGreaterThan(40);
  });

  it("has all eight content sections populated", () => {
    expect(cv.stats).toHaveLength(3);
    expect(cv.education).toBeDefined();
    expect(cv.experience).toHaveLength(4);
    expect(cv.research).toHaveLength(1);
    expect(cv.leadership).toHaveLength(2);
    expect(cv.skillGroups).toHaveLength(3);
    expect(cv.certifications).toHaveLength(4);
    expect(cv.contact).toHaveLength(4);
  });

  it("skill percentages are within range", () => {
    for (const g of cv.skillGroups) {
      for (const s of g.skills) {
        expect(s.pct).toBeGreaterThan(0);
        expect(s.pct).toBeLessThanOrEqual(100);
      }
    }
  });
});
