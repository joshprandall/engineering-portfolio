import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = path.resolve(import.meta.dirname, "..");
const required = ["index.html", "projects.html", "styles.css", "app.js", "README.md"];
for (const file of required) {
  assert.ok(fs.existsSync(path.join(root, file)), `missing required file: ${file}`);
}

const htmlFiles = ["index.html", "projects.html"];

function ids(html) {
  return [...html.matchAll(/\sid=["']([^"']+)["']/g)].map(m => m[1]);
}
function attrs(tag, name) {
  const re = new RegExp(`\\s${name}=["']([^"']+)["']`, "i");
  return tag.match(re)?.[1] ?? "";
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), "utf8");

  assert.match(html, /<html[^>]+lang=["']en["']/i, `${file}: missing lang=en`);
  assert.match(html, /<main[^>]+id=["']main["']/i, `${file}: missing main#main`);
  assert.match(html, /class=["'][^"']*\bskip\b[^"']*["'][^>]+href=["']#main["']/i, `${file}: missing skip link`);
  assert.match(html, /<meta[^>]+name=["']viewport["']/i, `${file}: missing viewport meta`);
  assert.match(html, /<link[^>]+href=["']styles\.css["']/i, `${file}: missing styles.css`);
  assert.match(html, /<script[^>]+src=["']app\.js["']/i, `${file}: missing app.js`);

  const allIds = ids(html);
  assert.equal(new Set(allIds).size, allIds.length, `${file}: duplicate IDs found`);

  const targets = [...html.matchAll(/href=["']#([^"']+)["']/g)].map(m => m[1]);
  for (const target of targets) {
    assert.ok(allIds.includes(target), `${file}: broken local anchor #${target}`);
  }

  const anchors = [...html.matchAll(/<a\b[^>]*>/gi)].map(m => m[0]);
  for (const tag of anchors) {
    if (attrs(tag, "target") === "_blank") {
      const rel = attrs(tag, "rel").split(/\s+/);
      assert.ok(rel.includes("noopener") && rel.includes("noreferrer"), `${file}: target=_blank missing noopener noreferrer`);
    }
  }
}

const projects = fs.readFileSync(path.join(root, "projects.html"), "utf8");
const cards = [...projects.matchAll(/<article class=["']project-card["'][^>]*data-category=["']([^"']+)["']/g)];
assert.ok(cards.length >= 8, "projects.html: expected at least 8 project cards");
const countMatch = projects.match(/id=["']filter-count["'][^>]*>(\d+) projects/i);
assert.ok(countMatch, "projects.html: missing project count");
assert.equal(Number(countMatch[1]), cards.length, "projects.html: filter count must match project cards");
assert.ok(cards.some(m => m[1].includes("interactive")), "projects.html: no interactive projects");
assert.ok(cards.some(m => m[1].includes("knowledge")), "projects.html: no knowledge projects");
assert.ok(cards.some(m => m[1].includes("completed")), "projects.html: no completed projects");

const js = fs.readFileSync(path.join(root, "app.js"), "utf8");
for (const hook of ["portfolio-theme", "data-filter", "aria-selected", "prefers-reduced-motion"]) {
  assert.ok(js.includes(hook), `app.js: expected accessibility/interaction hook ${hook}`);
}

const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
assert.ok(css.includes(":focus-visible"), "styles.css: visible focus rule missing");
assert.ok(css.includes("prefers-reduced-motion"), "styles.css: reduced-motion rule missing");

console.log("Site validation passed.");
