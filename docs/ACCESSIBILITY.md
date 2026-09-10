# Accessibility

## Interface contract

The console targets WCAG 2.2 AA interaction patterns:

- landmarks, sections, headings, lists, forms, buttons, links, labels, and time elements use native
  semantics;
- every workflow action has an execution-specific accessible name;
- keyboard focus is visible and no control requires pointer-only input;
- loading, authentication, error, and action outcomes are announced through polite live regions;
- status is expressed in text as well as color;
- disabled action state remains labeled;
- responsive layouts preserve source order and avoid horizontal dependence.

## Automated evidence

The component test renders the dashboard in jsdom and locates the metrics region, headings,
execution list, audit trail, sign-in link, and workflow action by accessible role and name. It then
operates the retry button through user-event and verifies the announced UI state.

Linting and TypeScript checks detect invalid React patterns and interface drift. These checks are
useful regression controls but are not substitutes for browser accessibility testing.

## Manual review checklist

1. Navigate every link, form, and action with keyboard only.
2. Confirm focus order follows the visual and DOM order.
3. Confirm focus remains visible at common viewport widths and zoom levels.
4. Verify loading, rejection, replay, success, and authentication states with a screen reader.
5. Verify status and signal meaning without color perception.
6. Check 200% and 400% zoom, reflow, reduced motion, and high-contrast behavior.
7. Run axe or equivalent against fixture and authenticated OIDC states.

## Known limitations

No browser/screen-reader compatibility matrix, automated axe browser run, external audit, cognitive
usability study, or formal WCAG conformance statement is provided. Locale-specific date formatting
also needs product requirements before international deployment.
