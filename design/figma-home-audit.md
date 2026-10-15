# Homepage Figma audit — 2026-10-15

Source file: 21VE5rYVcZTst6WoV8GbIm, frame 58:585.
Coordinates below are relative to frame origin (1476,42). Reference viewport: 1433 × 950 CSS pixels. Responsive layouts retain fixed side-column sizes and expand the center; they are not scaled screenshots.

| Element / node | Verified source values |
| --- | --- |
| Account 55:454 | x24 y771; 219×150; radius24; rgb(210 210 210 /45%); .5px white inside border; shadow 0 64 37 -32 black9% |
| Avatar 55:425 | x37 y790; 48×48; source PNG, user-upload override retained |
| Role 55:421 | x98.652 y792; Inter500 9px/22px; tracking .4px; ink40% |
| Name 55:422 | x98.652 y814; Inter500 14px/20px |
| Online 55:473 | x70 y826; 12×12; #00ff6a; 0 0 4 #00ff09 |
| Logout 48:9 | x70 y859; 128×46; radius23; white; white1px inside border; shadow 0 4 4 rgba(0,30,70,.53) |
| Thumb 48:10 | x77 y865; 33×33; downloaded original SVG includes 2px gradient stroke and inner shadow |
| Label 48:12 | x142 y873; 6px Light / 12px Bold, 10px line-height; source gradient |
| Horizontal lines 55:417,55:451 | x0 y196/y758; 256×.5; radial #432c2c → transparent #501c1c; opacity .24 |
| Vertical lines 55:452,70:8 | x265/x1048 y68; 1×840; black stroke; opacity .24 |
| Tasks 74:59,74:62,74:74 | x1096 y169/360/551; 292×162/162/163; 29px gaps; shadow 0 4 10.6 purple #b57ce7 / green #b4f8c2 |
| Task glass 74:60,74:65,74:77 | local x11 y58; 270×94; radius15; fills rgba(173,173,173,.38), rgba(55,55,55,.57), rgba(140,140,140,.39) |
| Native GLASS effect | radius0, refraction1, depth45, lightAngle63/63/297, lightIntensity.63, dispersion.69, splay.62/.65/.62 |
| Task name 55:491 | local x61 y11; Inter500 16px/24px; white |
| Role 55:491 | Inter300 10px/15px; white |
| Task text 55:499 | local x27 y68; width240; Inter500 12px/18px; white |
| Times 55:497,74:71,74:83 | local x235 y16; Inter700 10px/15px; #d4d4d4; examples 2ц өмнө / 4ц өмнө / 1ө өмнө |
| Composer 70:21 | 546×42; original exported SVG used at intrinsic size including effect bounds |

## Behavior and verification limits

- Figma nodes inspected had empty `reactions`; swipe interaction is implemented from the user's explicit request. Pointer drag only commits on release at the end; incomplete drags return to start. Keyboard arrows adjust, Escape resets, End + Enter commits.
- Time labels now represent created-at age, not due-date text. Existing demo records use session-relative seed ages matching the design; new self tasks persist actual createdAt. Do not present the demo seed dates as production activity history.
- Task data remains live/local demo data rather than replacing every message with the repeated placeholder text from the design.
- Figma GLASS uses a proprietary rendering model. The browser implementation uses the exact source fills and zero blur, an SVG displacement backdrop at depth45, and directional inner highlights. This is a browser translation, **not a verified pixel-identical rendering** of Figma dispersion/splay. Those native parameters are recorded above, not falsely equated to CSS properties.
- Figma MCP Starter quota was reached during the remaining asset reads. Already retrieved source geometry, effects and assets were used. Further full-design verification remains limited by that quota.
