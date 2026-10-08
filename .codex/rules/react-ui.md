# React and UI

Use functional components and hooks with focused responsibilities and typed props. Keep substantial calculations and API normalization outside JSX. Avoid duplicated derived state and effects used only to calculate render values.

Use Ant Design components and Ant Design Form for existing form flows. Preserve validation and reset an old converter result when inputs change. Do not introduce a second form framework without an approved need.

Keep user-visible labels, validation messages, and errors in Ukrainian. Explain failures in plain language; HTTP codes and provider diagnostics belong in safe developer logs, not user-facing messages. Distinguish loading, empty data, failed initial loading, and failed background refresh.

Maintain the current restrained visual language, readable typography, tabular monetary digits, keyboard focus, accessible names, and status announcements. Long lists should scroll inside overview panels. On narrow or short screens, preserve access to content rather than clipping it to force a fixed layout.

Use CSS Modules for layout/component styles and global CSS only for genuinely global rules. Reuse Ant Design theme tokens where appropriate. Do not replace styling systems or bulk-translate existing content during unrelated changes.

Use the existing router for navigation and semantic links for detail routes. Keep filters and page selection in URL state where established; changing a filter should reset pagination. Do not imply that cross-currency amount sorting compares converted values.

Do not display an invented zero total while data is loading or failed. A rate failure must not hide successfully loaded transactions or their original USD/EUR totals. Clearly identify cached data when freshness is uncertain.
