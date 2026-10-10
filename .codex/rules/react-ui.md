# React and UI

- Use functional components and hooks with typed props. Keep substantial calculations and API normalization outside JSX. Avoid duplicated derived state and effects used only to compute render values.

- Use Ant Design components and Ant Design Form for existing form flows. Preserve validation and clear stale converter results when inputs change. Do not introduce another form framework without a concrete approved need.

- Keep user-facing labels, validation messages, and errors in Ukrainian. Use plain-language errors and distinguish loading, empty, initial failure, and background-refresh failure states.

- Preserve the current restrained visual language, readable typography, tabular monetary digits, keyboard focus, accessible names, and status announcements.
- Long lists should scroll inside overview panels. On narrow or short screens, preserve content access instead of clipping it to maintain a fixed layout.

- Use CSS Modules for component and layout styles and global CSS only for genuinely global rules. Reuse Ant Design theme tokens where appropriate.

- Use the existing router and semantic links for navigation and detail routes.
- Keep filters and page selection in URL state where established; changing a filter resets pagination.
- Do not imply that cross-currency amount sorting compares converted values.

- Do not display an invented zero total while data is loading or failed.
- A rate failure must not hide successfully loaded transactions or their original USD/EUR totals.
- Clearly identify cached data when freshness is uncertain.
