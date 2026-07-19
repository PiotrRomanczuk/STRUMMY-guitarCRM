#!/usr/bin/env python3
"""Extract songs + lesson dates from a WhatsApp guitar-lesson chat export.

Heuristic (per owner): a teacher sharing a song/tab marks a lesson. Distinct
dates on which songs were shared become lessons; the songs shared on/around a
date are that lesson's repertoire.
"""
import re, json, sys
from collections import OrderedDict

CHAT = sys.argv[1] if len(sys.argv) > 1 else "whatsapp/_chat.txt"

# [DD/MM/YYYY, HH:MM:SS] Sender: message   (leading LTR/formatting marks stripped)
LINE = re.compile(r"^‎?\[(\d{2})/(\d{2})/(\d{4}),\s*[\d:]+\]\s*([^:]+):\s*(.*)$")

SKIP_SUBSTR = [
    "image omitted", "video omitted", "audio omitted", "sticker omitted",
    "You deleted this message", "this message was deleted",
    "strummy.vercel.app",  # the app itself, not a song
]

def ug_title(url):
    """Parse 'Artist - Title' from an ultimate-guitar slug."""
    m = re.search(r"/tab/([^/]+)/([^/?]+)", url)
    if m:
        artist = m.group(1).replace("-", " ").title()
        slug = m.group(2)
        slug = re.sub(r"-(chords|tabs|tab|bass|ver\d+|official|solo)(-\d+)?$", "", slug)
        slug = re.sub(r"-\d+$", "", slug)
        title = slug.replace("-", " ").title()
        return f"{title}", artist
    m = re.search(r"/tab/(\d+)", url)  # bare-id tab, title unknown
    if m:
        return f"UG tab {m.group(1)}", None
    return None, None

def classify(msg):
    """Return (title, author, tab_url, notes) if the message is a song, else None."""
    url = None
    um = re.search(r"https?://\S+", msg)
    if um:
        url = um.group(0)
    notes = []
    # capo / bpm / chords hints in free text
    capo = re.search(r"[Cc]apo\s*(\d+)", msg)
    if capo: notes.append(f"Capo {capo.group(1)}")
    bpm = re.search(r"(\d+)\s*BPM", msg, re.I)
    if bpm: notes.append(f"{bpm.group(1)} BPM")

    if url:
        if "ultimate-guitar.com" in url:
            title, author = ug_title(url)
            return title, author, url, "; ".join(notes) or None
        if "youtube.com" in url or "youtu.be" in url:
            return None  # bare video reference, skip as a song row
        if "spiewnik.wywrota.pl" in url:
            slug = url.rstrip("/").split("/")[-1].replace("-", " ").title()
            author = url.rstrip("/").split("/")[-2].replace("-", " ").title()
            return slug, author, url, "; ".join(notes) or None
        return None
    # free-text song like "Alex G Runner - Capo 4 - Cadd9 G D" or "Where is my mind - 60 BPM"
    # a song line has a dash and looks like content, not a chat sentence
    if " - " in msg or " -" in msg:
        head = re.split(r"\s*[-–]\s*", msg)[0].strip()
        # ignore obvious conversational lines
        if len(head) <= 40 and not head.endswith("?") and "zobaczy" not in msg.lower():
            chords = re.findall(r"\b([A-G](?:add|maj|min|sus|dim|m)?\d?)\b", msg)
            if chords:
                notes.append("Chords: " + " ".join(dict.fromkeys(chords)))
            return head, None, None, "; ".join(notes) or None
    return None

def main():
    with open(CHAT, encoding="utf-8") as f:
        lines = f.read().splitlines()

    lessons = OrderedDict()  # date -> list of song dicts
    for ln in lines:
        m = LINE.match(ln)
        if not m:
            continue
        dd, mm, yyyy, sender, msg = m.groups()
        msg = msg.strip()
        if any(s.lower() in msg.lower() for s in SKIP_SUBSTR):
            continue
        date = f"{yyyy}-{mm}-{dd}"
        song = classify(msg)
        if not song:
            continue
        title, author, url, notes = song
        if not title:
            continue
        lessons.setdefault(date, []).append(
            {"title": title, "author": author, "tab_url": url, "notes": notes}
        )

    out = {
        "student": "Mateusz Fiuczek",
        "lessons": [{"date": d, "songs": s} for d, s in lessons.items()],
        "total_songs": sum(len(s) for s in lessons.values()),
        "total_lessons": len(lessons),
    }
    print(json.dumps(out, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
