#!/usr/bin/env python3
"""
Decode a Strummy design mockup (a self-contained Claude-artifact "Standalone"
HTML bundle) into its underlying source files.

The Standalone HTMLs are self-unpacking bundles: a <script type="__bundler/manifest">
holds a JSON map of {uuid: {mime, compressed, data}} where `data` is base64 of
(optionally gzip'd) file bytes — fonts, and the actual JSX design source. The
small application/javascript entries (a few KB each) are the real component
source (each starts with a `// <Screen> — ...` comment); the multi-MB
text/javascript entries are the vendored React/Babel bundle.

Usage:
    python3 tools/extract_bundle.py "batch-01-core-editorial/Strummy - Lesson Form (Standalone).html" out/lesson-form

Writes every non-font entry to <outdir>/<uuid8>.jsx and prints a summary
(size + first-line comment) so you can see which screens a bundle contains.
"""
import sys, os, json, gzip, base64, re


def extract(path, outdir):
    html = open(path, encoding="utf-8").read()
    m = re.search(r'<script type="__bundler/manifest">(.*?)</script>', html, re.S)
    if not m:
        sys.exit("no __bundler/manifest found — is this a Standalone bundle?")
    manifest = json.loads(m.group(1))
    os.makedirs(outdir, exist_ok=True)
    rows = []
    for uuid, entry in manifest.items():
        mime = entry.get("mime", "")
        if "font" in mime:
            continue
        raw = base64.b64decode(entry["data"])
        if entry.get("compressed"):
            raw = gzip.decompress(raw)
        text = raw.decode("utf-8", "replace")
        size = len(raw)
        tag = "VENDOR" if size > 100_000 else "src"
        if tag == "src":
            open(os.path.join(outdir, uuid[:8] + ".jsx"), "w").write(text)
        rows.append((size, tag, uuid[:8], text.split("\n", 1)[0][:90]))
    rows.sort()
    print(f"{os.path.basename(path)} — {len(rows)} entries (fonts skipped)")
    for size, tag, u8, first in rows:
        print(f"  [{size:>8d}] {tag:6s} {u8}  {first}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("usage: extract_bundle.py <bundle.html> <outdir>")
    extract(sys.argv[1], sys.argv[2])
