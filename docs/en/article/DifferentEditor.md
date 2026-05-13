---
last_date: 2025-10-21
---

# Pain Point: Different Editor Environments Have Different Logics

Pain point: different editor environments have different logics. These logics include:

- Different shortcuts!
- Different menus!
- Different features!

## How to Solve This Problem

Actually, you might realize that some of these features can be achieved completely independently of the editor! I can completely extract these functions and turn them into an independent Input Method Assistant / Editor Assistant!

Hence, AnyMenu was born – a powerful Input Method Assistant / Editor Assistant that can be used with any text-based editor and input method.

## Examples

### Different shortcuts

- Code editors:
  In VSCode, the default shortcut for "Select Next Occurrence of Selected Text" is `Ctrl+D`,
  whereas in CLion, the default shortcut is `Alt+J`.
- Markdown editors:
  In Typora, the default shortcut for switching between source code/live preview mode is `Ctrl+/`,
  whereas in Obsidian, the default shortcut is `Alt+E`.

There are also some rather annoying issues. When editing Markdown in VSCode, the Ctrl+Shift+V shortcut for pasting plain text is instead used to open the preview function.

### Completing Inconsistent Logic

- **Paired Symbol Completion Issues**
  - For example, in certain IDEs or text editor environments, when you type `(`, it becomes `(I)`. When you select a segment of text and type `(`, it becomes `(selected text I)`.
  - However, in some environments (such as the QQ input box, where neither of these two logics is triggered), certain symbols do not work (e.g., Chinese brackets, Chinese quotation marks, etc.).
- When you press `Tab` (whether you have selected text or not), it may replace the selected text with a tab character or indent the entire line.
- When you press `Enter`, whether the new line automatically indents or not also falls into this category.

### Different menus and toolbar

- This includes different right-click context menus, different toolbars, etc. This is easy to understand.
- Like the built-in features and plugins of Obsidian/Typora/SiYuan, which provide functions such as the insertion menu/toolbars

### Different features

- Some editor environments support tab indentation and automatic indentation on new lines, while others do not.
- Some editors support multiple cursors, while others do not.
- Previously used Pinyin input methods might support numeric keypad input or inputting certain emojis or emoticons. After switching input method schemes or input method software, these features can be lost.

Some features cannot be resolved through configuration, while others require considerable time to customize.

- For example, shortcuts. Gradually modifying the shortcuts in each editor to make them consistent can very likely lead to numerous shortcut conflicts.
- For example, input templates. This includes code snippets, Markdown templates, and commonly used phrase templates. If configured in one editor, other editors need to be configured separately. Configuring them in input methods that support custom phrases is also very limited (some don't support multi-line phrases, some have quantity limits, and you must remember the corresponding key values).

## Specific Examples - Template Insertion Function  

Typora uses: Template functionality and slash commands from the **obgnail/typora_plugin**  

![](../../assets/df-typora.png)  

Obsidian uses: Plugins such as **Template/QuickerAdd** and **QuickShare/Latex Suite**  

VSCode uses: Built-in **User Snippets**  

- Use `Ctrl+Shift+P` and type **Configure User Snippets** to access them  
  - Can be set for specific languages and used in corresponding files  
  - Can choose **New Global Snippets File** to apply across all files  

AnyMenu aims to unify their shortcut experience, UI experience, and even configuration experience (via synchronized and unified custom phrase library files or cloud-based phrase libraries, ensuring seamless use even when switching computers).
