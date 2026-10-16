# Updated Home and Goals — 2026-10-16

Source: Figma 21VE5rYVcZTst6WoV8GbIm, Home 58:585, Goals 82:124, reference 1433 × 950.

- Shared task panel: x1075/y21, 334 × 901; gradient sampled from source context.
- Task 55:480 / 78:101: #161617, radius 15, shadow 0 8 24 -4 rgba(0,0,0,.6); collapsed 292 × 162, expanded 292 × 208, gap 9.
- Text panels 74:60 / 78:102: #2C2C2E, **no effects** in updated Figma. Previous glass override removed.
- Reply 78:109: 270 × 23, rgba(142,142,147,.2), .3px white border, radius 15. Actions 17px outer diameter.
- Goal selectors: 172 × 88 at x345/558/787, y101. Chart: 614 × 298 at x345/y224. AI notch: 478 × 60 at x418/y0.
- Ring artwork downloaded directly from Figma. Inter variable font reused.
- Goals navigation intentionally selected instead of source's accidental Home selection, per user instruction.

Motion reference: supplied Coucou MP4. Inspected 50 one-second frames across full video and 16 frames at 8 fps over 8–10 seconds. Expansion occurs around 8.5–9 seconds, with shell expansion preceding details; face blinks and changes shape. Figma motion context returned no nodes. CSS 420ms expansion and delayed details are video-informed implementation choices, not extracted exact keyframes. Reduced-motion disables animation. Pointer tracking, blink, hover tilt, completion/cancellation expressions implemented.

Goals is a visual/interaction preview using explicitly labeled October 2026 fixtures. Chart and detail totals derive from the same fixture dates. It is not a connected financial reporting service. AI backend is not connected; Home preserves its existing explicit status message. Shared live demo task DOM and note/state handlers remain intact across navigation.

Validation: JS syntax; 1433 × 950 browser inspection (actual viewport rounded to 1434 by host), cards measured 172 × 88, chart 614.49 × 298, expanded task 292 × 208. Today/week/month, three metrics, chart point detail changes, hover height 154 and detail opacity 1, AI click Home/focus, open task preserved and single expanded task verified. No browser errors observed.

## Follow-up corrections

User requested content-hugging task text instead of source's fixed 94px example height. Removed card/text minimum heights; two-line text now measures 56px including 10px vertical padding. Card and body remain #161617 / #2C2C2E with source shadow unchanged.

Task times 55:497 / 78:108 use #8E8E93 at 60% opacity, Inter Bold 10px. Source actions 78:111–113 are solid #FF0000, #FFC300, #00FF2F 13px circles, with 17px outer outlines (#626262, .5px). Downloaded original SVGs, ordered cancel/details/done. My Task avatar backplates are white as explicitly requested.

Ring overlays retain exported asset bounds: month arc is 25.5 × 49.8594, offset x25.5/y.5703 within the 51px ring. Full-size centering was incorrect. Today/week arcs retain 50.9777/51.0001 × 50.4297/50.4298 root dimensions and top .5703 offset. Base ring is 51 × 51. No asset paths edited.

Selected period card is joined continuously to its panel by a matching-width connector; selected card bottom corners are square inside the combined silhouette. Connector follows selected element bounds on resize. Notch restores 16 × 15 inverse top corners from source's assembled shape; the app shell anchors to the desktop viewport to avoid clipping from preserved document scroll. Selected daily label uses #353535, weight700 and slight enlargement per user request; other labels use source weight500 / #7E7E7E.

## Hover and interaction revision

Supersedes the assembled connector/corner implementation above: goal card + panel and the AI notch each now use one SVG path. Selected cards and chart containers are transparent over that single white surface. Removed inherited button brightness filtering for goal cards and the notch; hover shadow applies to the complete selected silhouette. Unselected cards lift 3px and scale1.025 over220ms. Selected card contents lift without splitting the surface. Student list items and report rows receive a rounded full-row hover background and shadow.

Monthly view now contains four buckets, explicitly requested by user. Days1–7/8–14/15–21/22–31; month-end dates are retained in the final bucket rather than omitted. Point spacing fills the chart with four points. Browser verified final bucket includes all ten dates22–31.

Custom clickable cursor: authored28px SVG with white center, separated white ring and black outer stroke, hotspot14/14; buttons/links/task bodies/student rows use it, text fields retain text cursor. Global pointer tracking updates AI gaze via one animation frame per pointer batch, clamped to5px horizontal/3px vertical. Neutral face smiles; notch hover smiles with arched eyes; focused input shows thinking; completion/cancellation show success/calm. Permanent warning icon removed. Notch shape is recomputed from its actual animated width/height during expansion, so no corner join seam or scaled corner distortion. Reduced-motion overrides cover newly added transitions/expressions.

Browser checks: selected-card filter:none, transparent background over one white path; one black notch path at540×154 expanded state; no warning node; gaze x−3.74px on far left and+5px on far right; task cursor asset applied; input focus sets thinking; student hover background/shadow/radius verified; no browser errors observed.

## Equal card grid and owned-task editing

Replaced absolute tab offsets with three equal grid columns, shared chart width, and32px desktop gaps. At1433-reference viewport actual widths183.49/183.50/183.50px (subpixel allocation), equal heights88px, gaps32px. Third tab and chart share the exact same right edge959.55px. Surface path now uses unrounded element bounds and actual SVG viewport width, avoiding the tiny extra right-side corner caused by rounded offsetWidth/clientWidth geometry.

Per explicit user correction, removed AI mouth markup and all mouth style rules. Expressions use eyes only.

Yellow action is shown only for built-in personal tasks call/post and self-created records without a sender; director/teacher/incoming assignments expose red/green only. Yellow opens a dedicated edit/postpone form for title, body and due date; preserves state and inline note. Saves personal task records and task-state overrides, applies persisted edits on reload, and displays the updated due date. Incoming clones have inherited personal due labels removed. All dots scale1.3, lift1px and brighten with an outline/shadow on hover/focus; reduced-motion removes transform animation.

Validation: isolated localhost origin created an owned task, edited title/body, postponed2026-10-20 to2026-10-24, saved and reloaded; all fields and due label persisted. Main127.0.0.1 user task data was not modified. Yellow absence verified for poster/test/incoming-director-post; presence for call/post. Hover transform measured1.299/brightness1.139 during transition. Built-in personal task editor opens with correct existing text. No browser errors.
