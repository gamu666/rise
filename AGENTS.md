# THE RISE — UI consistency and verification

- Read the user's existing requirements and the affected source before editing. Preserve working flows and the approved visual design.
- Every new or changed box must match related components in width, height, alignment, starting vertical position, spacing, typography and visual weight. Do not wait for the user to request alignment again.
- Goals and Students owner selectors must share one compact control style and starting height. Align each selector's right edge with its content card. Open dropdowns must match the trigger width; their rows, avatars and text must remain proportionate to the trigger.
- When an owner dropdown opens, lightly blur the background while keeping the selector, search and names sharp. Check selection, search, outside click, Escape and navigation cleanup.
- Do not display repeated labels such as “Жишээ өгөгдөл”, “Жишээ”, “demo”, internal LVL markers or redundant “Менежер” field labels. This is a presentation rule, not permission to claim fixture data or local-only actions are real server operations.
- Use the established neutral glass cards, readable dark text and restrained icons. Do not introduce pale purple text or oversized popup content.
- Place “Манай баг” directly on the main background like “Багийн амжилт”; do not add a large outer panel around its member cards.
- General director views are branch-first: no “Миний мэдээлэл” option; Team opens with branches and drills into their managers; leaderboard supports Branch/Manager and Today/Week/Month. Preserve manager-specific drill-down actions.
- General director selectors contain only All branches and individual branches, never employee names. Goal detail and the former Students view show managers with their income, not individual students. All branches shows all managers; one branch shows only its managers.
- Team directory alone sorts by position: branch director/lead, senior manager, manager. Leaderboards sort by performance/income, not position. Keep Branch/Manager and Today/Week/Month in separate compact controls.
- Reuse the existing leaderboard layout, cards, colors and background for all roles. General director adds only a separate Branch/Manager selector next to the existing period selector, not a new dashboard design.
- Branch goal rows open the selected manager's own chart and transaction details; keep a branch-return action. Personal, branch and all-branch targets must aggregate from the selected scope. Main chart percentages and period rings must use the same targets.
- Branch directors review only lower-level leave requests in their branch. Request decisions must be reflected in the requester's status and survive reload; reject actions require a reason. Browser-local storage is not shared server delivery or real authorization.
- Verify both closed and open states on desktop and narrow layouts. Measure related bounding edges and top positions; inspect actual screenshots. Check other role pages that share the component.
- Preserve existing data and permission scope. Never invent real people, records, payments, backend connections or successful delivery.
- Distinguish local, GitHub and live state. Do not claim completion, successful tests or live deployment without actual verification. Publish only tested changes and verify the published UI.

