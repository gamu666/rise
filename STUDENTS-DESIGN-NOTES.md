# Students: Apple-inspired web styling

Scope: Students only. Preserve the one-third roster / two-thirds detail layout and existing enrollment/payment actions.

References checked on 2026-10-17:
- https://developer.apple.com/design/resources/ — lists iOS/iPadOS 27 and macOS 27 kits.
- https://www.figma.com/community/file/1651309434229735362/macos-27 — official macOS kit link; inner layers not accessible through this connection. Community ID rejected by connector file-key validation.
- https://www.figma.com/community/file/1651309003795292092/ios-and-ipados-27 — official iOS kit link.
- https://developer.apple.com/design/human-interface-guidelines/materials — reserve glass for navigation/controls; content uses standard materials.
- https://developer.apple.com/design/human-interface-guidelines/split-views — narrow leading list, wider detail, thin divider.
- https://developer.apple.com/design/human-interface-guidelines/lists-and-tables — persistent selection highlight and readable list rows.
- https://developer.apple.com/design/human-interface-guidelines/pop-up-buttons — single selected item, contextual menu.

Implementation: manager-students-macos.css. Web-adapted dimensions and CSS shadows/blur are authored values, not Apple layer measurements. Uses the system font where available with existing web-font fallbacks; does not distribute Apple font files. Keeps existing portraits and logo gradient. Adds contrast, transparency and reduced-motion media preferences.

Verification limitation: browser access was policy-blocked earlier in this session. No current visual verification or exact native Liquid Glass equivalence is claimed.

## Recheck — actual kit inspection

The signed-in Chrome session successfully duplicated Apple's official macOS 27 kit:
https://www.figma.com/design/4pRf90jjWs7KOKlHYobvCh/macOS-27--Community-
This supersedes the earlier access limitation above.

Read the Search Fields, Sidebars, Pop-up and Pull-down Buttons, Materials, and Lists and Tables pages with the Plugin API. Read design context and screenshots for Search Field 480:769, Button and Menu 4354:7660, and Liquid Glass 483:9244.

Measured values now reflected in CSS:
- Search 480:769: 24px high, capsule radius100, 8px horizontal inset, 13px font/16px line height; black8% 1px rim, white fill.
- Pull-down 4354:6932: 24px high, radius6, 13px label, clicked black16% background.
- Menu 4354:7100: radius12, row24, font13, inset12px horizontal/5px vertical; shadow0 8 48 black25%, .5px #dbdbdb rim and asymmetric +/-1.25px side rims.
- Sidebar selected 4358:4436: radius8, #f2f2f2 selection fill.
- Liquid Glass 483:9244: native GLASS radius16, refraction.7, depth30, lightIntensity.25, dispersion.2, splay.2. Native refraction and blend behavior cannot be represented exactly by CSS backdrop-filter; the web implementation uses a documented approximation. Native shadow and rim measurements are preserved where applicable.

Live desktop checked in Chrome at1536×682: main student region has no vertical overflow; both list and detail pane stay inside the viewport. Remaining interactions checked after publishing final correction.
