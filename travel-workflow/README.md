# Local Trip Workflow (Intent -> Coarse Guide -> Theme Pack -> Route)

This module implements a local, single-process workflow for one-day trip planning.

## Scope
- Input intent first.
- Generate AI-style coarse guide as bullet statements.
- Let user shortlist coarse guide items.
- Expand POI candidates (AMap if key exists, otherwise local mock DB fallback).
- Trigger clarification when intent is ambiguous.
- Build theme packs for quick adoption.
- Plan route for `walking` / `driving` / `transit`.
- Export `travelData` that can be rendered by your existing itinerary page.

## Files
- `workflow-engine.js`: executable workflow engine.
- `mock-poi-db.json`: local POI database for offline fallback.
- `samples/intent.sample.json`: complete sample input.
- `samples/intent.ambiguous.sample.json`: ambiguity branch sample.
- `output/workflow-output.json`: run result snapshot.
- `output/data.generated.js`: generated `window.travelData` payload.
- `ui/index.html`: mobile-first itinerary layout (new refactor).
- `ui/styles.css`: compact responsive layout and visual system.
- `ui/app.js`: renderer compatible with `window.travelData`.

## Run

```bash
node travel-workflow/workflow-engine.js \
  --input travel-workflow/samples/intent.sample.json \
  --output travel-workflow/output/workflow-output.json \
  --data-js travel-workflow/output/data.generated.js
```

## Ambiguity branch

```bash
node travel-workflow/workflow-engine.js \
  --input travel-workflow/samples/intent.ambiguous.sample.json \
  --output travel-workflow/output/workflow-ambiguous.json
```

When ambiguity is high and no clarification answers are provided, output status becomes `awaiting_clarification` with question options.

## Input contract (minimal)

```json
{
  "intent": {
    "city": "sanya",
    "date": "2026-02-23",
    "startTime": "09:00",
    "transportMode": "driving",
    "interests": ["beach", "food", "photo"],
    "budget": "medium",
    "pace": "relaxed",
    "companions": "couple",
    "travelers": 2
  },
  "preferences": {
    "coarseGuideChoices": ["coastal_scenic", "seafood_foodie"],
    "mustInclude": ["sunset"],
    "avoid": ["mall"],
    "clarificationAnswers": {
      "trip_focus": "mixed",
      "crowd_tolerance": "medium",
      "walking_tolerance": "medium"
    }
  },
  "execution": {
    "provider": "mock",
    "targetPoiCount": 7,
    "amap": {
      "key": "OPTIONAL_WEB_SERVICE_KEY",
      "placeTextEndpoint": "https://restapi.amap.com/v3/place/text"
    }
  }
}
```

## Notes
- If `execution.provider` is `amap` and key exists, engine tries AMap POI search first.
- If AMap request fails or no key is provided, engine falls back to local mock POIs.
- Route duration currently uses local distance estimation for deterministic local runs.
- The generated `data.generated.js` can replace your `data.js` payload in the static itinerary page.

## View the refactored layout

1. Generate data first.
2. Open `travel-workflow/ui/index.html` in browser.
3. The page reads `../output/data.generated.js` by default.
