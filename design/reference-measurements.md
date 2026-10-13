# Reference audit — 1081 × 709 raster

The attached JPEG is the sole visual reference for this rebuild. The earlier Apple styling and responsive sizing rules are no longer loaded.

## Confirmed file facts
- Raster: **1081 × 709 pixels**. Width / height: **1.524682651622003**.
- Embedded density: **72 × 72 dpi**. This is metadata, not browser pixel density or monitor resolution.
- Original monitor resolution, Figma/Photoshop canvas size before export, font family, CSS font sizes, source corner radii and gradient definitions: **not recoverable from this JPEG**.

## Pixel measurements
Coordinates are zero-based. Dark-glyph measurements use RGB channels <110; antialiased and JPEG edge pixels outside that threshold are excluded. These are reproducible raster measurements, not guessed font sizes.

| Item | x | y | visible width | visible height |
|---|---:|---:|---:|---:|
| Home heading |276|35|56|15|
| My activity |276|112|80|15|
| Your teachers |275|361|103|12|
| Popular courses |276|520|119|15|
| Home navigation label |71|114|31|8|
| Home navigation icon |52|113|10|11|
| Selected navigation interior, threshold RGB >230/238/242 |38|103|168|30|
| Violet bar, B−R >100 and B−G >90 |410|148|30|152|

Divider columns measured by local contrast: **x=224**, **x=785**. Layout regions are 225 / 560 / 296 px, including their divider edges. Main content origin x=274; its inset from x=225 is **49 px**. Right content begins x=816; inset from divider x=785 is **31 px**. Major text ink tops: **35, 112, 361, 520**.

## Measured colors
5 × 5 median samples (their coordinates are recorded in the JSON): background upper-left **#CAE1F3**, center **#DAE6F6**, bottom-right **#F2ECFA**; selected menu **#F4F9FC**; white bar **#ECF0FB**; violet bar **#5A60FF**.

## Implementation and limits
The new canvas is explicitly **1081 × 709 CSS px**. It scales uniformly by min(viewportWidth / 1081, viewportHeight / 709), and is centered. It does not stretch columns independently. At 1920 × 1080 the scale is 1.523272 and canvas width 1646.657; horizontal margins are 136.671 px. At 1440 × 900 the scale is 1.269394 and canvas width 1372.214; margins are 33.893 px.

Font files are not embedded in the JPEG. The implementation uses locally available Inter; 20 px heading, 16 px section headings, 11 px navigation, and 9 px supporting text are **implementation values calibrated against the raster**, not claims about the original design. Background interpolation between sampled colors and SVG icon paths are reconstructions, not recovered original source values. Exact source typography and vectors require the original design file.

Live dashboard text, amounts and student data remain real demo data; chart values are not invented to copy the reference bar heights. Views absent from the reference reuse the measured typography, spacing and palette rather than claiming an exact reference match.

## Browser verification
- The new page loads only `manager-measured.css`; the five legacy dashboard stylesheets and Apple motion script are disconnected.
- At a real browser viewport of **1920 × 1080**, computed base canvas = **1081 × 709**, grid columns = **225 / 560 / 296**, scale = **1.523272**. Document scroll size = **1920 × 1080**, no page overflow.
- Computed CSS font sizes: heading **20 px**, section heading **16 px**, menu **11 px**, supporting text **9 px** before uniform canvas scaling.
- Screenshot captured in `qa/measured-dashboard-1920.png`.
- Verified course switch updates registration/graduation dates, Goal navigation, chat view, registration form opening, exclusive task action menus, profile menu, and dark/light switch. No browser console errors observed.
- Home text core ink: median pixels with RGB channels <80 in x276..331/y35..49 = **#000B1B**. Used as the new main text color.
