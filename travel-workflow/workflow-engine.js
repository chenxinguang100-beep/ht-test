#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULTS = {
  provider: "mock",
  targetPoiCount: 7,
  transportMode: "driving",
  startTime: "09:00"
};

const MODE_PROFILE = {
  walking: { speedKmh: 4.5, transferPenaltyMin: 0 },
  driving: { speedKmh: 30, transferPenaltyMin: 0 },
  transit: { speedKmh: 22, transferPenaltyMin: 8 }
};

const CLARIFICATION_QUESTIONS = [
  {
    id: "trip_focus",
    title: "Trip focus",
    options: ["scenic", "food", "mixed"]
  },
  {
    id: "crowd_tolerance",
    title: "Crowd tolerance",
    options: ["low", "medium", "high"]
  },
  {
    id: "walking_tolerance",
    title: "Walking tolerance",
    options: ["short", "medium", "long"]
  }
];

const COARSE_GUIDE_LIBRARY = [
  {
    id: "coastal_scenic",
    title: "Coastal scenic loop",
    bullets: [
      "Focus on coastline views and sunset windows.",
      "Keep transfer hops short between bay-side points.",
      "Prefer photo-friendly landmarks and boardwalks."
    ],
    tags: ["beach", "photo", "relaxed", "view"],
    searchKeywords: ["beach", "bay boardwalk", "viewpoint", "sunset"]
  },
  {
    id: "seafood_foodie",
    title: "Seafood and local flavor",
    bullets: [
      "Anchor the day with 2 meal moments and one dessert stop.",
      "Use local signature foods as primary route points.",
      "Keep queue risk manageable with alternatives."
    ],
    tags: ["food", "local", "market"],
    searchKeywords: ["seafood", "local food", "night market", "dessert"]
  },
  {
    id: "city_landmark",
    title: "Landmark and city icons",
    bullets: [
      "Cover city-level landmarks with stable navigation.",
      "Balance iconic spots and one lower-crowd backup.",
      "Keep pacing medium for first-time visitors."
    ],
    tags: ["landmark", "first-time", "photo"],
    searchKeywords: ["landmark", "tourist attraction", "city icon"]
  },
  {
    id: "family_relaxed",
    title: "Family relaxed route",
    bullets: [
      "Lower walking pressure and keep indoor fallback points.",
      "Avoid tight windows and over-packed schedule.",
      "Prefer broad-space attractions and simple meals."
    ],
    tags: ["family", "relaxed", "easy"],
    searchKeywords: ["family park", "aquarium", "easy walk", "mall"]
  }
];

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) {
    throw new Error("Missing --input <file> argument.");
  }

  const inputPath = path.resolve(args.input);
  const outputPath = path.resolve(args.output || "travel-workflow/output/workflow-output.json");
  const dataJsPath = path.resolve(args["data-js"] || "travel-workflow/output/data.generated.js");

  const payload = readJsonFile(inputPath);
  const intent = payload.intent || {};
  const preferences = payload.preferences || {};
  const execution = payload.execution || {};

  const provider = args.provider || execution.provider || DEFAULTS.provider;
  const transportMode =
    intent.transportMode && MODE_PROFILE[intent.transportMode]
      ? intent.transportMode
      : DEFAULTS.transportMode;

  const run = {
    status: "running",
    startedAt: new Date().toISOString(),
    provider,
    transportMode,
    steps: []
  };

  const coarseGuides = buildCoarseGuides(intent);
  run.steps.push({
    id: "coarse_guide",
    status: "done",
    data: {
      guideCount: coarseGuides.length,
      guides: coarseGuides.map((guide) => ({
        id: guide.id,
        title: guide.title,
        bullets: guide.bullets,
        score: guide.score
      }))
    }
  });

  const selectedGuides = pickGuidesForPoiExpansion(coarseGuides, preferences.coarseGuideChoices);
  run.steps.push({
    id: "user_shortlist",
    status: "done",
    data: {
      selectedGuideIds: selectedGuides.map((guide) => guide.id)
    }
  });

  const poiCandidates = await collectPoiCandidates({
    city: intent.city,
    selectedGuides,
    provider,
    execution,
    limitPerKeyword: execution.limitPerKeyword || 12
  });

  run.steps.push({
    id: "poi_expansion",
    status: "done",
    data: {
      poiCount: poiCandidates.length,
      source: provider === "amap" ? "amap_or_fallback" : "mock"
    }
  });

  const ambiguity = evaluateAmbiguity(intent, preferences, selectedGuides, poiCandidates);

  if (ambiguity.needsClarification && !hasUsefulClarification(preferences.clarificationAnswers)) {
    run.status = "awaiting_clarification";
    run.finishedAt = new Date().toISOString();
    run.steps.push({
      id: "clarification",
      status: "pending",
      data: {
        ambiguityScore: ambiguity.score,
        reasons: ambiguity.reasons,
        questions: CLARIFICATION_QUESTIONS
      }
    });

    writeJsonFile(outputPath, {
      ...run,
      clarificationNeeded: true,
      clarificationQuestions: CLARIFICATION_QUESTIONS
    });

    return;
  }

  run.steps.push({
    id: "clarification",
    status: "done",
    data: {
      ambiguityScore: ambiguity.score,
      reasons: ambiguity.reasons,
      answers: preferences.clarificationAnswers || {}
    }
  });

  const themePacks = buildThemePacks({
    intent,
    preferences,
    selectedGuides,
    poiCandidates,
    targetPoiCount: execution.targetPoiCount || DEFAULTS.targetPoiCount,
    transportMode
  });

  run.steps.push({
    id: "theme_pack",
    status: "done",
    data: {
      packCount: themePacks.length,
      packs: themePacks.map((pack) => ({
        id: pack.id,
        name: pack.name,
        itemCount: pack.slots.length,
        rationale: pack.rationale
      }))
    }
  });

  const adoptedPack = adoptThemePack(themePacks, preferences.adoptPackId);
  run.steps.push({
    id: "adopt_pack",
    status: "done",
    data: {
      selectedPackId: adoptedPack.id,
      selectedPackName: adoptedPack.name
    }
  });

  const routePlan = planRoute({
    pack: adoptedPack,
    startTime: intent.startTime || DEFAULTS.startTime,
    transportMode
  });

  run.steps.push({
    id: "route_plan",
    status: "done",
    data: {
      stopCount: routePlan.stops.length,
      totalDistanceKm: Number(routePlan.totalDistanceKm.toFixed(2)),
      totalTravelMin: routePlan.totalTravelMin,
      totalDwellMin: routePlan.totalDwellMin
    }
  });

  const travelData = buildTravelData({
    intent,
    adoptedPack,
    routePlan,
    transportMode
  });

  writeJsonFile(outputPath, {
    ...run,
    status: "ok",
    finishedAt: new Date().toISOString(),
    selectedPack: adoptedPack,
    routePlan,
    travelData
  });

  fs.mkdirSync(path.dirname(dataJsPath), { recursive: true });
  fs.writeFileSync(
    dataJsPath,
    `window.travelData = ${JSON.stringify(travelData, null, 2)};\n`,
    "utf8"
  );
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = value;
      index += 1;
    }
  }
  return args;
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJsonFile(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item).toLowerCase());
  return [String(value).toLowerCase()];
}

function buildCoarseGuides(intent) {
  const interests = normalizeList(intent.interests);
  const pace = intent.pace ? String(intent.pace).toLowerCase() : "";
  const companions = intent.companions ? String(intent.companions).toLowerCase() : "";

  return COARSE_GUIDE_LIBRARY.map((guide) => {
    let score = 0;
    guide.tags.forEach((tag) => {
      if (interests.includes(tag)) score += 2;
      if (pace && pace.includes(tag)) score += 1;
      if (companions && companions.includes(tag)) score += 1;
    });

    if (interests.length === 0) score += 1;

    return { ...guide, score };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

function pickGuidesForPoiExpansion(guides, selectedGuideIds) {
  const picked = new Set(normalizeList(selectedGuideIds));
  if (picked.size === 0) {
    return guides.slice(0, 2);
  }

  const selected = guides.filter((guide) => picked.has(guide.id));
  return selected.length > 0 ? selected : guides.slice(0, 2);
}

async function collectPoiCandidates({ city, selectedGuides, provider, execution, limitPerKeyword }) {
  const allCandidates = [];

  if (!city) {
    return [];
  }

  const amapConfig = execution.amap || {};
  const amapKey = amapConfig.key || process.env.AMAP_WEB_KEY || "";

  for (const guide of selectedGuides) {
    for (const keyword of guide.searchKeywords) {
      let rows = [];
      if (provider === "amap" && amapKey) {
        try {
          rows = await queryAmapPlaceText({
            city,
            keyword,
            key: amapKey,
            endpoint: amapConfig.placeTextEndpoint,
            limit: limitPerKeyword,
            guideId: guide.id
          });
        } catch (error) {
          rows = [];
        }
      }

      if (rows.length === 0) {
        rows = queryMockPois({ city, keyword, guideId: guide.id });
      }

      allCandidates.push(...rows);
    }
  }

  return dedupePoi(allCandidates);
}

async function queryAmapPlaceText({ city, keyword, key, endpoint, limit, guideId }) {
  const url = new URL(endpoint || "https://restapi.amap.com/v3/place/text");
  url.searchParams.set("key", key);
  url.searchParams.set("keywords", keyword);
  url.searchParams.set("city", city);
  url.searchParams.set("offset", String(limit || 10));
  url.searchParams.set("page", "1");
  url.searchParams.set("extensions", "base");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`AMap place search failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (payload.status !== "1" || !Array.isArray(payload.pois)) {
    throw new Error(payload.info || "AMap place search failed");
  }

  return payload.pois
    .map((poi) => {
      if (!poi.location) return null;
      const [lngRaw, latRaw] = String(poi.location).split(",");
      const lng = Number(lngRaw);
      const lat = Number(latRaw);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;

      const categories = normalizeAmapType(poi.type);
      const category = inferPrimaryCategory(categories);

      return {
        id: `amap_${safeId(poi.id || `${poi.name}_${lng}_${lat}`)}`,
        providerId: poi.id || "",
        name: poi.name || keyword,
        city: poi.cityname || city,
        address: [poi.pname, poi.cityname, poi.adname, poi.address].filter(Boolean).join(" "),
        coords: [lng, lat],
        categories,
        category,
        guideIds: [guideId],
        tags: categories,
        rating: parseFloat(poi.biz_ext && poi.biz_ext.rating ? poi.biz_ext.rating : "0") || 0,
        priceLevel: normalizePriceLevel(poi.biz_ext && poi.biz_ext.cost),
        crowdLevel: "medium",
        dwellMinutes: estimateDwellMinutes(category),
        source: "amap"
      };
    })
    .filter(Boolean);
}

function normalizeAmapType(value) {
  if (!value) return ["landmark"];
  return String(value)
    .split(";")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .map((item) => {
      if (item.includes("餐") || item.includes("food") || item.includes("restaurant")) return "food";
      if (item.includes("购物") || item.includes("mall") || item.includes("shop")) return "shopping";
      if (item.includes("风景") || item.includes("景点") || item.includes("beach") || item.includes("park")) {
        return "scenic";
      }
      return "landmark";
    });
}

function normalizePriceLevel(cost) {
  const amount = Number(cost);
  if (!Number.isFinite(amount) || amount <= 0) return "medium";
  if (amount < 60) return "low";
  if (amount < 180) return "medium";
  return "high";
}

function queryMockPois({ city, keyword, guideId }) {
  const dbPath = path.resolve("travel-workflow/mock-poi-db.json");
  const db = readJsonFile(dbPath);
  const lowerKeyword = String(keyword || "").toLowerCase();

  return db
    .filter((poi) => String(poi.city || "").toLowerCase() === String(city).toLowerCase())
    .filter((poi) => {
      const haystack = [poi.name, poi.address, ...(poi.tags || []), poi.category].join(" ").toLowerCase();
      return haystack.includes(lowerKeyword);
    })
    .map((poi) => ({
      ...poi,
      guideIds: uniq([...(poi.guideIds || []), guideId]),
      dwellMinutes: poi.dwellMinutes || estimateDwellMinutes(poi.category)
    }));
}

function dedupePoi(pois) {
  const map = new Map();
  for (const poi of pois) {
    const key = poi.providerId || `${poi.name}::${poi.coords && poi.coords.join(",")}`;
    if (!key) continue;

    if (!map.has(key)) {
      map.set(key, {
        ...poi,
        guideIds: uniq(poi.guideIds || []),
        tags: uniq(poi.tags || [])
      });
      continue;
    }

    const prev = map.get(key);
    map.set(key, {
      ...prev,
      guideIds: uniq([...(prev.guideIds || []), ...(poi.guideIds || [])]),
      tags: uniq([...(prev.tags || []), ...(poi.tags || [])]),
      rating: Math.max(prev.rating || 0, poi.rating || 0)
    });
  }
  return [...map.values()];
}

function evaluateAmbiguity(intent, preferences, selectedGuides, poiCandidates) {
  let score = 0;
  const reasons = [];

  if (!intent.city) {
    score += 0.6;
    reasons.push("city_missing");
  }

  if (normalizeList(intent.interests).length < 2) {
    score += 0.25;
    reasons.push("few_interests");
  }

  if (!intent.pace) {
    score += 0.15;
    reasons.push("pace_missing");
  }

  if (!intent.budget) {
    score += 0.15;
    reasons.push("budget_missing");
  }

  if (!intent.companions) {
    score += 0.1;
    reasons.push("companions_missing");
  }

  if (!preferences.coarseGuideChoices || preferences.coarseGuideChoices.length === 0) {
    score += 0.15;
    reasons.push("coarse_choices_missing");
  }

  if (selectedGuides.length === 0) {
    score += 0.2;
    reasons.push("no_guides_selected");
  }

  if (poiCandidates.length < 6) {
    score += 0.2;
    reasons.push("few_poi_candidates");
  }

  return {
    score: Number(score.toFixed(2)),
    reasons,
    needsClarification: score >= 0.45
  };
}

function hasUsefulClarification(answers) {
  if (!answers || typeof answers !== "object") return false;
  return Object.keys(answers).some((key) => {
    const value = answers[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

function buildThemePacks({
  intent,
  preferences,
  selectedGuides,
  poiCandidates,
  targetPoiCount,
  transportMode
}) {
  const profiles = [
    {
      id: "pack_balanced",
      name: "Balanced day",
      priorityTags: ["scenic", "food", "landmark"],
      rationale: [
        "Mixes scenic and meal anchors.",
        "Keeps route transitions steady.",
        "Suitable as first draft for one-day trip."
      ]
    },
    {
      id: "pack_scenic",
      name: "Scenic first",
      priorityTags: ["scenic", "photo", "view"],
      rationale: [
        "Prioritizes coastline and photo windows.",
        "Reduces indoor time.",
        "Fits relaxed and visual-heavy trips."
      ]
    },
    {
      id: "pack_food",
      name: "Food first",
      priorityTags: ["food", "market", "local"],
      rationale: [
        "Centers the route on food points.",
        "Ensures meal options with backup candidates.",
        "Keeps one or two scenic breaks."
      ]
    }
  ];

  const mustInclude = normalizeList(preferences.mustInclude);
  const avoid = normalizeList(preferences.avoid);
  const clarifications = preferences.clarificationAnswers || {};

  const packs = profiles.map((profile) => {
    const scored = poiCandidates
      .map((poi) => ({
        poi,
        score: scorePoi({
          poi,
          profile,
          intent,
          selectedGuides,
          clarifications,
          mustInclude,
          avoid,
          transportMode
        })
      }))
      .sort((left, right) => right.score - left.score);

    const picked = pickDiversePois(scored, targetPoiCount);
    const slots = buildSlots(picked, scored);

    const estimatedDurationMinutes = estimatePackDuration(slots, transportMode);
    const modeFit = buildModeFit(slots);

    return {
      id: profile.id,
      name: profile.name,
      rationale: profile.rationale,
      slots,
      score: Number(scored.slice(0, targetPoiCount).reduce((sum, row) => sum + row.score, 0).toFixed(2)),
      estimatedDurationMinutes,
      modeFit
    };
  });

  return packs.sort((a, b) => b.score - a.score);
}

function scorePoi({
  poi,
  profile,
  intent,
  selectedGuides,
  clarifications,
  mustInclude,
  avoid,
  transportMode
}) {
  const poiTags = uniq([poi.category, ...(poi.tags || []), ...(poi.categories || [])].map((item) => String(item).toLowerCase()));
  let score = (poi.rating || 0) * 2;

  profile.priorityTags.forEach((tag) => {
    if (poiTags.includes(tag)) score += 3;
  });

  normalizeList(intent.interests).forEach((interest) => {
    if (poiTags.includes(interest)) score += 2;
  });

  selectedGuides.forEach((guide) => {
    if ((poi.guideIds || []).includes(guide.id)) score += 1.5;
  });

  if (mustInclude.length > 0) {
    const haystack = `${poi.name} ${(poi.tags || []).join(" ")}`.toLowerCase();
    mustInclude.forEach((token) => {
      if (haystack.includes(token)) score += 4;
    });
  }

  if (avoid.length > 0) {
    const haystack = `${poi.name} ${(poi.tags || []).join(" ")}`.toLowerCase();
    avoid.forEach((token) => {
      if (haystack.includes(token)) score -= 100;
    });
  }

  const budget = String(intent.budget || "medium").toLowerCase();
  if (budget === "low" && poi.priceLevel === "high") score -= 4;
  if (budget === "high" && poi.priceLevel === "high") score += 1;

  if (clarifications.crowd_tolerance === "low" && poi.crowdLevel === "high") score -= 3;
  if (clarifications.trip_focus === "food" && poi.category === "food") score += 2;
  if (clarifications.trip_focus === "scenic" && poi.category === "scenic") score += 2;

  if (transportMode === "walking" && poi.category === "shopping") score -= 0.5;

  return score;
}

function pickDiversePois(scoredRows, targetPoiCount) {
  const picked = [];
  const categoryQuota = {
    scenic: 2,
    food: 2,
    landmark: 1,
    activity: 1,
    shopping: 1
  };

  for (const row of scoredRows) {
    if (picked.length >= targetPoiCount) break;
    const category = row.poi.category || "landmark";

    const sameCategoryCount = picked.filter((entry) => entry.poi.category === category).length;
    const quota = categoryQuota[category] || 2;

    if (sameCategoryCount >= quota) continue;
    if (picked.some((entry) => entry.poi.id === row.poi.id)) continue;

    picked.push(row);
  }

  for (const row of scoredRows) {
    if (picked.length >= targetPoiCount) break;
    if (picked.some((entry) => entry.poi.id === row.poi.id)) continue;
    picked.push(row);
  }

  return picked;
}

function buildSlots(pickedRows, allRows) {
  const slots = [];

  for (const row of pickedRows) {
    const category = row.poi.category || "landmark";
    const alternatives = allRows
      .filter((candidate) => candidate.poi.id !== row.poi.id)
      .filter((candidate) => (candidate.poi.category || "landmark") === category)
      .slice(0, 2)
      .map((candidate) => candidate.poi);

    slots.push({
      primaryPoi: row.poi,
      alternativePois: alternatives,
      category
    });
  }

  return slots;
}

function estimatePackDuration(slots, transportMode) {
  const dwell = slots.reduce((sum, slot) => sum + (slot.primaryPoi.dwellMinutes || 60), 0);
  const profile = MODE_PROFILE[transportMode] || MODE_PROFILE.driving;
  const hopMinutes = Math.round((slots.length - 1) * (18 + profile.transferPenaltyMin));
  return dwell + hopMinutes;
}

function buildModeFit(slots) {
  const scenicCount = slots.filter((slot) => slot.category === "scenic").length;
  const foodCount = slots.filter((slot) => slot.category === "food").length;

  return {
    walking: Math.max(1, Math.min(5, 3 + Math.floor((scenicCount - foodCount) / 2))),
    driving: 4,
    transit: Math.max(1, Math.min(5, 3 + Math.floor(foodCount / 3)))
  };
}

function adoptThemePack(themePacks, preferredPackId) {
  if (!preferredPackId) return themePacks[0];
  const hit = themePacks.find((pack) => pack.id === preferredPackId);
  return hit || themePacks[0];
}

function planRoute({ pack, startTime, transportMode }) {
  const profile = MODE_PROFILE[transportMode] || MODE_PROFILE.driving;
  const points = pack.slots.map((slot) => slot.primaryPoi);
  const ordered = orderByNearestNeighbor(points);

  const stops = [];
  let currentMinutes = parseTimeToMinutes(startTime);
  let totalDistanceKm = 0;
  let totalTravelMin = 0;
  let totalDwellMin = 0;

  for (let index = 0; index < ordered.length; index += 1) {
    const poi = ordered[index];
    const prev = index > 0 ? ordered[index - 1] : null;

    let distanceKm = 0;
    let travelMin = 0;
    if (prev) {
      distanceKm = haversineKm(prev.coords, poi.coords);
      travelMin = Math.round((distanceKm / profile.speedKmh) * 60 + profile.transferPenaltyMin);
      currentMinutes += travelMin;
      totalDistanceKm += distanceKm;
      totalTravelMin += travelMin;
    }

    const arrivalMinutes = currentMinutes;
    const dwell = poi.dwellMinutes || estimateDwellMinutes(poi.category);
    totalDwellMin += dwell;
    currentMinutes += dwell;

    stops.push({
      poiId: poi.id,
      name: poi.name,
      category: poi.category || "landmark",
      coords: poi.coords,
      address: poi.address,
      arrivalTime: formatMinutes(arrivalMinutes),
      leaveTime: formatMinutes(currentMinutes),
      dwellMinutes: dwell,
      travelFromPreviousKm: Number(distanceKm.toFixed(2)),
      travelFromPreviousMin: travelMin
    });
  }

  return {
    transportMode,
    startTime,
    totalDistanceKm,
    totalTravelMin,
    totalDwellMin,
    estimatedEndTime: formatMinutes(currentMinutes),
    stops
  };
}

function orderByNearestNeighbor(points) {
  if (points.length <= 2) return points.slice();

  const remaining = points.slice(1);
  const ordered = [points[0]];

  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1];
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < remaining.length; index += 1) {
      const distance = haversineKm(current.coords, remaining[index].coords);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }

    ordered.push(remaining.splice(bestIndex, 1)[0]);
  }

  return ordered;
}

function buildTravelData({ intent, adoptedPack, routePlan, transportMode }) {
  const locations = {};
  const dining = {};
  const activities = {};
  const poiEntityMap = new Map();

  for (const slot of adoptedPack.slots) {
    registerPoi(slot.primaryPoi, locations, dining, activities, poiEntityMap);
    slot.alternativePois.forEach((poi) => registerPoi(poi, locations, dining, activities, poiEntityMap));
  }

  const slotMap = new Map(adoptedPack.slots.map((slot) => [slot.primaryPoi.id, slot]));

  const schedule = routePlan.stops.map((stop) => {
    const slot = slotMap.get(stop.poiId);
    const category = stop.category === "food" ? "dining" : "activity";

    if (slot && slot.alternativePois.length > 0) {
      const options = [slot.primaryPoi, ...slot.alternativePois]
        .map((poi) => poiEntityMap.get(poi.id))
        .filter(Boolean)
        .slice(0, 3);

      return {
        time: stop.arrivalTime,
        type: category,
        title: stop.name,
        isChoice: true,
        default: options[0],
        options
      };
    }

    return {
      time: stop.arrivalTime,
      type: category,
      title: stop.name,
      refId: poiEntityMap.get(stop.poiId)
    };
  });

  return {
    meta: {
      title: `${intent.city || "Trip"} one-day draft generated by local workflow`,
      travelers: Number(intent.travelers || 2),
      baseSettings: {
        diningBudget: 600,
        transportBudget: estimateTransportBudget(routePlan.totalDistanceKm, transportMode),
        hotelTotal: 0
      }
    },
    inventory: {
      locations,
      dining,
      activities
    },
    itinerary: [
      {
        day: 1,
        date: intent.date || new Date().toISOString().slice(0, 10),
        loc: intent.city || "",
        weather: "",
        stay: null,
        preparation: [],
        schedule
      }
    ]
  };
}

function registerPoi(poi, locations, dining, activities, poiEntityMap) {
  const locationId = `loc_${safeId(poi.id)}`;
  if (!locations[locationId]) {
    locations[locationId] = {
      name: poi.name,
      address: poi.address,
      coords: poi.coords,
      tags: uniq([poi.category, ...(poi.tags || [])])
    };
  }

  const isFood = poi.category === "food";
  const entityId = `${isFood ? "din" : "act"}_${safeId(poi.id)}`;
  poiEntityMap.set(poi.id, entityId);

  const target = isFood ? dining : activities;
  if (!target[entityId]) {
    target[entityId] = {
      name: poi.name,
      type: isFood ? "dining" : "activity",
      price: estimatePoiPrice(poi),
      locationId,
      tips: buildPoiTips(poi)
    };
  }
}

function estimatePoiPrice(poi) {
  if (poi.priceLevel === "high") return 220;
  if (poi.priceLevel === "low") return 40;
  return poi.category === "food" ? 120 : 80;
}

function buildPoiTips(poi) {
  const parts = [];
  if (poi.source === "amap") parts.push("source: amap");
  if (poi.rating) parts.push(`rating: ${poi.rating}`);
  if (poi.category) parts.push(`category: ${poi.category}`);
  return parts.join(" | ");
}

function estimateTransportBudget(totalDistanceKm, mode) {
  if (mode === "walking") return 100;
  if (mode === "transit") return Math.max(80, Math.round(totalDistanceKm * 2.5));
  return Math.max(200, Math.round(totalDistanceKm * 6));
}

function inferPrimaryCategory(tags) {
  const normalized = uniq((tags || []).map((item) => String(item).toLowerCase()));
  if (normalized.includes("food")) return "food";
  if (normalized.includes("scenic")) return "scenic";
  if (normalized.includes("shopping")) return "shopping";
  if (normalized.includes("activity")) return "activity";
  return "landmark";
}

function estimateDwellMinutes(category) {
  switch (category) {
    case "food":
      return 70;
    case "scenic":
      return 80;
    case "shopping":
      return 90;
    case "activity":
      return 100;
    default:
      return 60;
  }
}

function parseTimeToMinutes(value) {
  const text = String(value || "09:00");
  const [hourRaw, minuteRaw] = text.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 9 * 60;
  return hour * 60 + minute;
}

function formatMinutes(totalMinutes) {
  let safe = totalMinutes;
  while (safe < 0) safe += 24 * 60;
  safe %= 24 * 60;
  const hour = Math.floor(safe / 60);
  const minute = safe % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function haversineKm(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return 0;
  const [lng1, lat1] = left;
  const [lng2, lat2] = right;
  if (![lng1, lat1, lng2, lat2].every((value) => Number.isFinite(value))) return 0;

  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function safeId(value) {
  return String(value || "id")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

main().catch((error) => {
  console.error("[workflow-engine] failed:", error.message);
  process.exitCode = 1;
});
