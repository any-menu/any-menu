<div align="center" style="margin-bottom: 20px">
  <img width="35%" src="./src/Tauri/src-tauri/icons/icon.png">
</div>

[中文](./README.md) | [English](./README.en.md)

# AnyMenu —— InputMethod Assistant / Editor Assistant

## What is AnyMenu?

- Positioning
    - A cross-platform, lightweight, fast, and customizable **Input Method Companion / Editor Companion** focused on text editing environments.
- Multi-platform
    - Obsidian Plugin
    - Cross-platform application
- Main function
    - Used to enhance input method or editor functionality, quickly generate templates, and provide auto-completion
- Specific functions
    - quick panel(multi-level menu, search box, mini editor), hot string (developing)
    - quick text input, modify selected text
    - custom dict/script, cloud dict/script
    - quick gpt

## Usage / Tutorial

### Usage Demo / Tutorial

After configuring the dictionary, you can use it as follows:

Quick Input Template:

![](./docs/assets/PixPin_2025-10-04_09-45-58.gif)

The app version can be used in any text environment:

![](./docs/assets/PixPin_2025-10-04_09-38-24.gif)

### Dictionary Tutorial

![](./docs/assets/cloud_dict.png)

- (Scripts are also considered a special type of dictionary.)
- See [Custom Dictionaries](./docs/zh/dict/)
  - [1. Download AnyMenu Dictionaries Online](./docs/zh/dict/1.%20Online%20Dictionary%20Download.md)
  - [2. Manually Download AnyMenu Dictionaries](./docs/zh/dict/2.%20Manual%20Dictionary%20Download.md) (For use in offline environments / network issues / online marketplace unavailable / downloading unaudited third-party dictionaries)
  - [3. Writing AnyMenu Dictionaries](./docs/zh/dict/3.%20Writing%20Dictionaries.md)
  - [4. Uploading Custom AnyMenu Dictionaries](./docs/zh/dict/4.%20Uploading%20Dictionaries.md)

## Features

Features will be introduced by different modules (categorized into multiple groups/abstract categories).

### Dictionary / Script Marketplace Module

Currently officially supported dictionaries:

- (Phrase Type)
  - emoji
  - Kaomoji (Text Emoticons)
- (Markdown Demo)
  - Markdown
  - Mermaid demo
  - AnyBlock plugin demo
  - MetaBind plugin demo
- (Script Type)
  - Output current date and time
  - Markdown formatting
  - Quickly add custom HTML tags in Markdown

Official dictionaries/scripts are continuously being expanded. You can also fully write your own custom dictionaries/scripts.

### More Features

- Input Text / Transform Text
  - Provides quick input template functionality and the ability to transform selected text into corresponding text based on certain rules.
- Quick Panel Invocation
  - Default: `Alt+A` (configurable)
  - Not just an Obsidian plugin, but also an App version.
    In the App version, you can summon the same menu in any text editor environment, using the same operation logic to enhance your input method and current editor.
- Multi-level Menu Module
  - Visual output, especially when using the Obsidian version, you can see the Markdown rendering result of the corresponding output content.
- Search Box
  - In addition to using the multi-level menu, you can also quickly find and output the content you want through the search box.
- Others
  - There are also some immature, in-development, or planned features. See [Miscellaneous](./docs/zh/Miscellaneous.md).

### Differences Between Plugin Version and App Version

> [!warning]
> Regarding Simultaneous Installation:
> 
> - **Setup Method 1 (Default)**: The App version will automatically add Obsidian to its blocklist.
> - **Setup Method 2**: You can modify the `app_black_list` setting in the App version to remove Obsidian from the blocklist.
>
> Resulting Behavior:
> 
> - In the default setup, if both the Plugin and App versions are installed, the same hotkey will prioritize the Plugin version. (Corresponds to Setup Method 1)
> - You might prefer installing only the App version without the Plugin version. (Corresponds to Setup Method 2)
> - Alternatively, you can assign different hotkeys to each, allowing flexible use within Obsidian based on the situation. (Corresponds to Setup Method 2)

| Feature                          | Plugin version | App version |
| -------------------------------- | -------------- | ----------- |
| Multilevel menu                  | ✅             | ✅         |
| Search Box                       | ✅             | ✅         |
| Advanced Hotkeys (Caps+)         | ❌             | ✅         |
| Better Selected Text Capture     | ✅             | ✅         |
| Better Full Editor Text Capture  | ✅             | ❌         |
| Performance                      |                | Potentially better |

## Highlights

Given that tools like Quicker and uTools already exist, what are the advantages compared to similar products? See below and [What Quick Input/Auto-completion Solutions Exist?](./docs/zh/Comparison.md)

- Zero Barrier to Entry
  - It's not the one with the shortest or fastest input chain (the fastest are input method phrases and hotstring solutions, but they have a steeper learning curve).
    However, it is definitely the most intuitive and easiest to use in terms of thinking logic.
  - Can be used with any input method solution or any input method software.
  - Easy to use, fast, powerful, and highly customizable.
- Cross-platform
  - If time permits, support for Windows/Linux platforms, Obsidian, and VSCode plugins will be added.
