---
name: web-art-direction
description: Audit, design, and refine websites and web interfaces to prevent or remove generic AI-generated visual and editorial patterns. Use when creating or redesigning a website, reviewing a rendered page, polishing a frontend, or when the user asks for distinctive, minimal, intentional, less templated, less corporate, or less AI-looking design or copy. Covers art direction, layout, typography, color, components, imagery, motion, headlines, microcopy, accessibility, and final visual review. Works across site types and technology stacks without prescribing a visual style.
---

# Web Art Direction

## Principles

- Make decisions specific to the subject, audience, content, and intended experience. Do not impose a house style.
- Distinguish a brand or experiential surface, a reading surface, and a task-oriented interface. Use the conventions that serve each; do not turn everything into a marketing page.
- Preserve established identity, user-authored copy, approved references, functionality, and meaningful irregularities. Respect the requested scope.
- Prefer fewer, more purposeful elements over decorative complexity. Empty space is allowed; minimal does not mean monochrome, symmetrical, or personality-free.
- Treat the smell lists below as diagnostic signals, not unconditional prohibitions. Retain a pattern when its specific function, identity, or expressive purpose justifies it. Multiple unrelated tells together are stronger evidence than any one tell.
- Do not replace familiar AI defaults with fashionable anti-AI defaults. Do not require novelty for its own sake.
- Fix recurring inconsistencies in shared components or tokens where appropriate; avoid unrelated refactors or new dependencies.

## Before designing or editing

- Read the brief, existing site, relevant design guidance, and supplied assets or examples. Identify the purpose, audience, content priorities, and visual identity.
- For an existing site, inspect its rendered appearance and source when available. Identify what is working before changing it.
- Establish a concise direction grounded in the subject: composition, typographic character, color, imagery, and interaction. For a narrow fix, preserve the existing direction instead.
- Identify which content is necessary. Start from actual content, not a template's available slots. Do not manufacture missing information.
- For review-only requests, report findings without modifying the site. For implementation requests, apply the relevant fixes directly within the requested scope.

## Visual smell list

### Layout and composition

- Default centered hero with eyebrow, headline, subtitle, two buttons, and an image, followed by interchangeable marketing sections.
- Repeated equal-sized feature cards, generic bento grids, icon-feature rows, alternating text/image sections, numbered process blocks, and obligatory FAQ or testimonial sections without a content need.
- Containers inside containers, excessive framing, nested cards, unnecessary section backgrounds, dividers or rules used to fill space.
- Everything centered, symmetrical, evenly spaced, equally prominent, or trapped inside the same maximum-width container without reason.
- Arbitrary asymmetry, oversized empty gaps, cramped content, edge misalignment, inconsistent gutters, orphaned elements, or awkward mobile stacking.
- Full-screen sections, forced hero areas, and excessive padding regardless of content length.
- Visual hierarchy driven by template conventions rather than what the visitor needs to see or do.

### Typography

- Unexamined default fonts or trendy font combinations chosen because they look generically premium; replacing one overused typeface with another is not art direction.
- Every heading oversized, tightly tracked, ultra-bold, or split into dramatic short lines; display type competing with actual content.
- A single word in a headline arbitrarily italicized, recolored, set in another typeface, or gradient-filled.
- Tiny tracked uppercase eyebrows above every section, unnecessary monospace metadata, decorative numbering, arbitrary type sizes, and excessive label hierarchy.
- Excessive font families, weights, inconsistent rhythm, bad line breaks, poor legibility, weak contrast, and small text used to simulate refinement.

### Color, surfaces, and components

- Unmotivated violet/blue gradients, neon glows, luminous borders, background blobs, decorative glass, generic mesh gradients, noise, and faux depth.
- Replacement cliches: beige editorial luxury, monochrome brutalism, acid-green terminal aesthetics, or another fashionable palette unrelated to the subject.
- Everything rounded, pill-shaped, shadowed, outlined, or tinted; identical decorative styling for unrelated components.
- Nested corner radii that clash, inconsistent borders and shadows, accent colors assigned without semantic or compositional purpose.
- Icons inside colored tiles, arbitrary sparkles, emoji as decoration, mixed icon families, arrows on every link, pointless badges and status dots.
- Untouched component-library defaults on a surface that requires its own identity; conversely, needless custom controls where familiar controls serve the task better.

### Imagery and identity

- Generic stock photos, abstract 3D blobs, floating devices, synthetic-looking mockups, irrelevant illustrations, and images chosen only to fill a layout.
- Repeated generic visuals, invented branding, unreadable image text, distorted logos, fake screenshots, and inconsistent image treatment.
- Trend imitation without an underlying concept, arbitrary texture, faux film grain, or excessive retro effects used to manufacture character.
- Imagery, typography, and decoration competing for attention instead of supporting the content. Prefer real, authorized assets when available; do not misrepresent generated or illustrative material as real evidence.

### Interaction and motion

- Automatic entrance animations on everything, gratuitous parallax, hover scaling, pulsing accents, animated gradients, scroll hijacking, and cursor effects with no user or expressive benefit.
- Motion that delays access to content, destabilizes layout, consumes unnecessary resources, or ignores reduced-motion preferences.
- Overdesigned navigation, hidden actions, unexpected interaction patterns, and controls that look clickable but do nothing.
- Missing or unclear interaction, keyboard focus, active, disabled, loading, empty, error, and success states where applicable.

## Editorial smell list

- Invented taglines, slogans, mission statements, brand manifestos, artist philosophies, and value propositions. Do not add them merely because a layout expects a headline.
- Vague hype: elevate, unlock, unleash, redefine, reimagine, empower, seamless, transformative, next-level, game-changing, world-class, and similar language without concrete meaning.
- Empty profundity or manufactured mystique: "Where sound meets soul", "Beyond the ordinary", "Explore the spaces between".
- Formulaic contrasts: "Not just X, but Y", "More than X", "This isn't X. It's Y", "Where X meets Y", and artificial rhetorical pivots.
- Punchy but interchangeable fragments and triplets: "Bold. Raw. Unfiltered.", "Built for today. Ready for tomorrow."
- Fake intimacy, credibility, urgency, exclusivity, authenticity, or rebellion; generic invitations to embark on a journey or discover an experience.
- Headline/subtitle pairs that repeat each other, redundant eyebrows, section introductions that restate the title, labels that explain obvious UI, and copy that narrates the visual aesthetic.
- Generic CTAs where a concrete label is clearer; promotional copy in functional controls; forced jokes or personality in critical states.
- Excessive rhetorical punctuation, emphatic capitalization, exclamation marks, decorative separators, and repetitive cadence. Punctuation alone is not proof of slop.
- Invented testimonials, client logos, metrics, reviews, biographies, affiliations, awards, product claims, social proof, or real-looking placeholder content. Use verified information, clearly labeled sample data when needed, or omit it.

## Editorial fixes

- Review every visible string, including headings, navigation, captions, metadata, labels, buttons, errors, and empty states.
- Read [references/examples.md](references/examples.md) for concrete before/after examples when creating, editing, or reviewing website copy or visual direction. Use them to calibrate judgment, not as stock replacements.
- Decide in order: keep, delete, shorten, rewrite. Do not replace filler with new filler or strip content that serves comprehension, navigation, accessibility, or a stated brand objective.
- Use concrete language, natural cadence, and the subject's own vocabulary. Preserve distinctive user-approved writing; do not flatten expressive or poetic copy simply because it is unconventional.
- Use direct functional labels where sufficient: Releases, Dates, Play, Contact. Use descriptive titles and specific actions when a visitor genuinely needs more context.
- Make persuasive claims factual and supportable. Explain an actual benefit or action rather than selling an abstraction. Do not invent content to make a design feel finished.
- Apply the identity test: if the copy could move to an unrelated site unchanged, ask whether it conveys anything useful. Conventional functional labels are exempt.
- Apply the deletion test: if removing the line changes neither understanding, action, nor intentional character, remove it.

## Required review step

Run this review before delivering new work or a redesign; for a standalone critique, use it as the deliverable workflow.

1. Inspect the actual rendered target, preferably in a browser. Capture the initial state for an existing design when possible. Inspect representative desktop and mobile widths, longer content, and relevant interaction states. For static comps, inspect the available image at its intended sizes and identify implementation risks separately.
2. Review the composition as a whole before inspecting individual details. Ask what is distinctive, what matters first, and whether the page serves its purpose. Scan every applicable visual and editorial category above.
3. Record concrete findings with location, impact, and a proposed fix. Distinguish defects, suspicious defaults, and deliberate choices. Prioritize usability, misleading content, and structural problems before surface polish. Do not treat a smell count as a quality score.
4. If editing is requested, fix unnecessary content and layout first, then typography, color, components, imagery, and motion as needed. Preserve intended behavior and avoid changing unrelated parts of the project.
5. Re-render and reassess. Compare before and after for clarity, character, restraint, and functionality. Check responsive layout, text legibility and contrast, keyboard access and focus, reduced motion, links and controls, relevant states, and existing tests when available. Iterate on material issues rather than stopping after a source-code pass.
6. Finish with a concise list of the most consequential findings or changes, intentional exceptions, and anything not verified. Never claim a browser, screenshot, device, test, or accessibility check was performed if it was not available. Do not add a visible review report or explanatory copy to the website itself.

## Optional tools and background

- Use the project's existing browser, screenshot, accessibility, or lint tooling if available. Automated detectors can surface candidates, but visual judgment and editorial review remain required. Do not install or execute third-party tools without appropriate authorization.
- See [references/sources.md](references/sources.md) for the upstream skills reviewed and synthesis decisions. No external tool is required to apply this skill.
