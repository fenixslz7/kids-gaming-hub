import { describe, it, expect } from "vitest";
import { edpi, convertSens, buildAutoexec, CROSSHAIRS } from "./cs2";

describe("cs2", () => {
  it("calcula eDPI", () => expect(edpi(400, 2.2)).toBe(880));
  it("converte sensibilidade mantendo eDPI", () => expect(convertSens(400, 2, 800)).toBe(1));
  it("gera autoexec com sensibilidade", () => {
    const cfg = buildAutoexec({ dpi: 400, sens: 1.5, crosshair: CROSSHAIRS["Clássica Verde"]!, optimize: true });
    expect(cfg).toContain("sensitivity 1.5");
    expect(cfg).toContain("fps_max 0");
  });
});
