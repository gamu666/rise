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
