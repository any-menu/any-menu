---
last_date: 2025-10-21
---

# Pain Point: Different Editor Environments Have Different Logics

Pain point: different editor environments have different logics. These logics include:

- Different shortcuts!
- Different menus!
- Different features!

## Examples

Different shortcuts:

- Code editors:
  In VSCode, the default shortcut for "Select Next Occurrence of Selected Text" is `Ctrl+D`,
  whereas in CLion, the default shortcut is `Alt+J`.
- Markdown editors:
  In Typora, the default shortcut for switching between source code/live preview mode is `Ctrl+/`,
  whereas in Obsidian, the default shortcut is `Alt+E`.

Different menus:

- This includes different right-click context menus, different toolbars, etc. This is easy to understand.

Different features:

- Some editor environments support tab indentation and automatic indentation on new lines, while others do not.
- Some editors support multiple cursors, while others do not.
- Previously used Pinyin input methods might support numeric keypad input or inputting certain emojis or emoticons. After switching input method schemes or input method software, these features can be lost.

Some features cannot be resolved through configuration, while others require considerable time to customize.

- For example, shortcuts. Gradually modifying the shortcuts in each editor to make them consistent can very likely lead to numerous shortcut conflicts.
- For example, input templates. This includes code snippets, Markdown templates, and commonly used phrase templates. If configured in one editor, other editors need to be configured separately. Configuring them in input methods that support custom phrases is also very limited (some don't support multi-line phrases, some have quantity limits, and you must remember the corresponding key values).

## How to Solve This Problem

Actually, you might realize that some of these features can be achieved completely independently of the editor! I can completely extract these functions and turn them into an independent Input Method Assistant / Editor Assistant!

Hence, AnyMenu was born – a powerful Input Method Assistant / Editor Assistant that can be used with any text-based editor and input method.
