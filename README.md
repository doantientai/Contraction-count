# 👶 Baby Announcement Site

A cute, single-page website to announce your new baby with a little
**"guess the name" game**:

1. **Guess screen** — visitors type the baby's name. If they don't know it,
   they can reveal hints one at a time. A **chronometer starts the moment the
   first hint is shown** and stops the instant they guess correctly.
2. **Scoreboard screen** — after a correct guess, visitors enter their own
   name and their time is saved to a scoreboard (fastest first; people who
   knew the name without any hint rank at the very top).
3. **Reveal screen** — the baby's photos, key facts, and a short story.

No backend or build step is required. The scoreboard is stored in the
visitor's browser via `localStorage`.

## ✏️ How to customize

Open **`script.js`** and edit the `CONFIG` object at the very top:

| Setting | What it does |
| --- | --- |
| `babyName` / `acceptedNames` | The name to guess (matching ignores case, spaces and accents). |
| `hints` | The list of hints, revealed one by one. |
| `reveal.tagline` / `reveal.story` | Text shown on the photo page. |
| `reveal.facts` | Key/value facts (born date, weight, …). |
| `reveal.photos` | Your photos — see below. |
| `scoreboardSize` | How many scoreboard entries to display. |

### Adding photos

1. Put your image files somewhere in this folder, e.g. a `photos/` directory.
2. Reference them in `CONFIG.reveal.photos`:

   ```js
   photos: [
     { src: "photos/day-one.jpg", caption: "First hello 💕" },
     { src: "photos/toes.jpg",    caption: "Tiny toes 🦶" },
   ],
   ```

If a photo's `src` is left empty, a cute 📷 placeholder is shown instead, so
the site looks fine before you've added real pictures.

## ▶️ Running locally

Just open `index.html` in a browser. For a local server (recommended so
relative image paths resolve nicely):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## 🚀 Deploying (GitHub Pages)

Push this folder to a repository and enable **GitHub Pages** (Settings →
Pages → deploy from branch). Because it's pure static HTML/CSS/JS, it works
on any static host.

## 📝 Notes

- The scoreboard is **per-browser** (stored in `localStorage`); it is not
  shared between visitors. For a shared global scoreboard you'd need a small
  backend or a service like Firebase — happy to add that on request.
