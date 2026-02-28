# Workflow State Machine

## States
1. `intent_received`
2. `coarse_guide_ready`
3. `user_shortlisted`
4. `poi_expanded`
5. `awaiting_clarification` (optional)
6. `theme_pack_ready`
7. `pack_adopted`
8. `route_planned`
9. `travel_data_exported`

## Transitions
- `intent_received -> coarse_guide_ready`
- `coarse_guide_ready -> user_shortlisted`
- `user_shortlisted -> poi_expanded`
- `poi_expanded -> awaiting_clarification`
  condition: ambiguity score >= threshold and clarification answers missing
- `poi_expanded -> theme_pack_ready`
  condition: no clarification needed
- `awaiting_clarification -> theme_pack_ready`
  condition: clarification answers provided
- `theme_pack_ready -> pack_adopted`
- `pack_adopted -> route_planned`
- `route_planned -> travel_data_exported`

## Ambiguity trigger inputs
- Missing or weak interests
- Missing pace / budget / companions
- No coarse guide selection
- Too few POI candidates after expansion

## Clarification output format
- `trip_focus`: scenic | food | mixed
- `crowd_tolerance`: low | medium | high
- `walking_tolerance`: short | medium | long
