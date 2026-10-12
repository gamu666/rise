# THE RISE — Apple-inspired dashboard decisions

Research date: 12 October 2026. This is a web adaptation, not an Apple system UI or an implementation of Apple's native optical renderer.

## Verified current context

Apple Support lists iOS/iPadOS 27.0.1, macOS 27.0.1, visionOS 27.0.1 and tvOS 27. watchOS 27.0.1 is listed for Series 12 and Ultra 4; supported earlier models use 27. These maintenance versions do not define one new universal layout size.
Source: https://support.apple.com/en-ca/100100
Apple's iPhone 18 Pro announcement describes refinements to Liquid Glass in iOS 27.
Source: https://www.apple.com/uk/newsroom/2026/09/apple-debuts-iphone-18-pro-and-iphone-18-pro-max/

## Material and hierarchy

Apple Materials guidance distinguishes the floating navigation/control layer from the content layer. Apply glass to rail, sidebar, menus and chat toolbar. Keep dense financial/student information on quieter content surfaces. Do not stack multiple glass effects inside the sidebar. Use tint sparingly for selection and primary actions. Dark/light use separate semantic foreground, secondary text, separator and surface colors.
Source: https://developer.apple.com/design/human-interface-guidelines/materials

Apple's WWDC session explains responsive illumination and deformation, menus originating at the triggering control, adaptive navigation materials and scroll-edge separation. This implementation uses modest pointer feedback, a moving selection lens, anchored menu expansion and separate content reveals. CSS backdrop blur and layered highlights approximate the appearance; they do not reproduce native real-time lensing/refraction.
Source: https://developer.apple.com/videos/play/wwdc2025/219/ (Dynamics 1:29; Adaptivity 6:00; Principles 10:31)

## Platform-specific interpretation

- iOS/iPadOS: touch targets and compact familiar controls, consistent selection; responsive split view rather than tiny desktop UI squeezed onto a phone.
- macOS: rail/list/detail, compact typography, tooltips and keyboard focus. This is the primary desktop layout.
- visionOS: depth and separated material layers inform the navigation; gaze input and spatial windows are not simulated.
- watchOS: concise hierarchy and progress presentation inform Goal/Profile. A watch-sized screen is not the dashboard's layout.
- tvOS: visible focus feedback informs keyboard use. Remote-control magnification is not applied to mouse use.
Source: https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass
Source: https://developer.apple.com/design/human-interface-guidelines/segmented-controls

## Measurements

Apple's typography guidance gives default/minimum sizes by platform: iOS/iPadOS 17/11 pt, macOS 13/10 pt, visionOS 17/12 pt, watchOS 16/12 pt, tvOS 29/23 pt. CSS pixels are not a promise of identical physical point sizing. The dashboard uses system fonts, 28 px page titles, 21 px list titles, 14 px list names and 11–13 px supporting information. Desktop rail controls have 44 × 44 CSS px targets and 21 px icons. Corner sizes: outer frame 20, list selection 14, fields 10. These radii are project choices, not official fixed OS constants.
Source: https://developer.apple.com/jp/design/human-interface-guidelines/typography
Source: https://developer.apple.com/design/human-interface-guidelines/buttons (general hit region 44 × 44 pt; visionOS 60 × 60 pt)

## Interaction contract — project timings, not claimed Apple constants

| Trigger | Response | Duration |
| --- | --- | --- |
| Rail selection | Glass indicator travels to selected icon; content reveals with 9 px displacement | 420 / 320 ms |
| Press | Immediate local illumination and 0.96 scale; touch/pointer release resets | Immediate / 280 ms return |
| Student selection | Hero/detail update in place, no window movement | 320 ms |
| Filter/menu open | Expands from top edge near its trigger, slight overshoot | 280–290 ms |
| Chat switch | Conversation replaces content inside fixed pane | 320 ms |
| Focus | Clear 3 px focus ring; arrow navigation retained | Immediate |
| Reduced motion | Remove animated reveals, lens travel, scale and popup motion | None |
| Reduced transparency | Solid navigation surfaces replace glass | None |
| Increased contrast | Stronger separators and secondary text | None |

## Preserved user requirements

My Tasks CSS, cards, emoji, actions, palette, entrance/hover motion and geometry are unchanged. Only the unified workspace and account menu receive the new design. The 40 px desktop gap remains. Existing demo flows for enrollment choice, graduation edit, payment/certificate state, notifications, Goal, income, ranking and local chat remain connected.

## Verification

Checked desktop 1280, tablet 1024 and mobile 430/390 CSS pixel widths: document width equals viewport width. Confirmed dark/light semantic content surfaces, filter popup animation and Escape dismissal, Goal subviews, income, Ranking, four notification choices and Chat. Enrollment dropdown changes dates correctly (Excavator 2026.09.21/2026.10.12; Dump 2026.10.05/2026.10.26). Reduced-motion indicator transition is 0s and reduced-transparency sidebar backdrop filter is none. No browser JavaScript errors were recorded during these flows.

Before/after desktop task viewport: x=904, y=76, width=360, height=628; background and shadow computed strings identical. Original task CSS/scripts are unchanged. Screenshots: qa/apple-dark.png, qa/apple-light.png, qa/apple-mobile.png (local QA files, not published assets).
