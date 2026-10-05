import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
function variables(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = css.match(new RegExp(`(?:^|\\n)${escaped} \\{([^}]+)\\}`, "m"));
  assert.ok(block, `Missing ${selector} token block`);
  return Object.fromEntries([...block[1].matchAll(/(--[\w-]+):\s*(#[\da-f]+)\s*;/gi)].map((match) => [match[1], match[2]]));
}
function luminance(hex) {
  const rgb = hex.slice(1).match(/.{2}/g).map((part) => parseInt(part, 16) / 255);
  const linear = rgb.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
for (const dark of [false, true]) {
  const theme = dark ? "dark" : "light";
  const tokens = {...variables(":root"), ...(dark ? variables(".dark") : {}), ...variables("body:has(.dashboard-shell)"), ...(dark ? variables(".dark body:has(.dashboard-shell)") : {})};
  for (const [label, foreground, background] of [
    ["sidebar labels", tokens["--sidebar-foreground"], tokens["--card"]],
    ["sidebar hover metadata", tokens["--sidebar-accent-foreground"], tokens["--sidebar-accent"]],
    ["muted card labels", tokens["--muted-foreground"], tokens["--card"]],
    ["small blue labels", tokens["--dashboard-link"], tokens["--card"]],
    ["primary action", "#ffffff", tokens["--brand-action"]],
  ]) {
    test(`${theme}: ${label} meet 4.5:1 text contrast`, () => {
      const ratio = contrast(foreground, background);
      assert.ok(ratio >= 4.5, `${foreground} on ${background}: ${ratio.toFixed(2)}:1`);
    });
  }
}
test("sidebar buttons do not receive a blanket white foreground", () => {
  assert.doesNotMatch(css, /\[data-slot="sidebar-menu-button"\]\s*\{[^}]*color:\s*(?:#fff(?:fff)?|white)/);
});
test("dashboard portal controls share the dashboard radius", () => {
  assert.match(css, /body:has\(\.dashboard-shell\) :is\(\[data-slot="button"\]/);
  assert.match(css, /body:has\(\.dashboard-shell\) :is\(\[data-slot="dialog-content"\]/);
});

test("highlighted sidebar metadata follows accent foreground", () => {
  assert.match(css, /sidebar-menu-button[^\n]+\.text-muted-foreground,/);
  assert.match(css, /sidebar-menu-badge"\] \{\n  color: var\(--sidebar-accent-foreground\);/);
});
