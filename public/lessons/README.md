# Lesson Content Styles Guide (for AI use only)

This file describes styles that the platform reliably renders in lessons. Treat these styles as an allow‑list for formatting.

This guide is intended **only for AI assistants and automated tools** working with lesson content. Do not show or reference this file in the student‑facing UI.

## General principles

- Lessons are written in Markdown.
- Keep structure simple: title, subheadings, paragraphs, lists, images, occasional inline code.
- Avoid complex constructs (HTML, tables, deeply nested lists).

## Headings

- Supported:
  - `#` — main lesson title (one per file).
  - `###` — subheadings inside the lesson.
- Recommendation: avoid `##`, `####` and deeper levels to keep hierarchy simple.

Example:

```markdown
# PWA Builder

### App Header
### Data Security
### Additional Settings
```

## Paragraphs

- Plain text separated by blank lines.
- Prefer short paragraphs of 1–3 sentences.

Example:

```markdown
PWA Builder is a tool for creating Progressive Web Applications (PWAs).
It allows you to configure design, data security, ratings, and additional settings.
```

## Bold text (emphasis)

- Use for important words or mini‑headings inside a section:
  - `**Important**`
  - `**Heads up**`
  - `**Info**`
  - `**Example**`
- Also use for short clarifications or captions.

Example:

```markdown
**Important**  
Cloaking applies to the entire flow, including the default scenario and all rules.
```

## Lists

### Bulleted lists

- Use `-`:

```markdown
- Create new split flows.
- View the list and statistics of existing ones.
- Edit settings and rules.
```

### Numbered lists

- Use classic format `1.`, `2.`, etc.
- You can add sub‑items with indent and `*`.

```markdown
1. Go to the Splits section and click Create split.  
2. Select an existing pixel or create a new one.  
3. Configure GEO cloaking.  
   * Choose GEO cloaking mode.
   * Set the whitepage source if needed.
```

## Images

- Format:

```markdown
![image](/img/5.7/image1.png)
```

- The path points to files in `public/img/...`.
- The file name must exactly match the real name (case, extension).
- Prefer file names without spaces.

## Inline code, parameters, macros, URLs

- Use inline code for parameters, macros, URL parts:

```markdown
Condition `sub10 = test10` is set → you need to add `sub10=test10` to the final link.

You can use `{rule_id}` and `{rule_name}` macros in the final URL:
`https://example.com?sub1={exid}&sub2={rule_id}&sub3={rule_name}`
```

- Inline code is good for:
  - parameters like `sub10`, `sub1`, `sub2`;
  - macros `{rule_id}`, `{rule_name}`;
  - short URL fragments.

## Links

- Standard Markdown links:

```markdown
[Open documentation](https://example.com/docs)
```

- Use for external resources when needed.

## Highlighted blocks like “Important”, “Info”, “Heads up”

- The platform does not use special callout blocks, so implement them as plain text:

```markdown
**Heads up**  
In rules, you can select both iOS and Android as target platforms, but the system does not validate the app against the user device.
```

- Add one or two sentences after the block heading.

## What to avoid

- HTML markup (`<div>`, `<span>`, `<table>`, etc.) inside lessons.
- Markdown tables with many columns:

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
```

— replace with simple lists instead.

- Deeply nested lists (3+ levels).
- Long code blocks (many lines) — for lesson content about tools/dashboards, inline code is usually enough.

## Summary

- You can safely use:
  - `#`, `###`
  - paragraphs
  - `-` and numbered lists `1.`
  - `**bold text**` for emphasis
  - `![image](/img/...)` for images
  - inline code `` `...` ``
  - standard Markdown links
- If formatting goes beyond this list, simplify it to the styles described above to avoid rendering issues on the platform.
