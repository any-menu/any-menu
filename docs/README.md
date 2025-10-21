---
# icon use https://fontawesome.com/icons
# layout: OldLayout
home: true
title: AnyMenu
icon: home
heroText: AnyMenu
tagline: A powerful input method assistant / editor assistant
heroStyle:
  min-height: 450px
heroImage: https://raw.githubusercontent.com/any-menu/any-menu/refs/heads/main/docs/assets/icon-alpha.png
heroImageDark: https://raw.githubusercontent.com/any-menu/any-menu/refs/heads/main/docs/assets/icon-alpha.png

actions:
  - text: Introduce
    icon: book
    link: "#What is AnyMenu"
  - text: Demo
    icon: list
    link: ./README.show.md

features:
  - title: Quick Search Box
    icon: magnifying-glass
    details: Quickly search and locate custom templates and custom phrases

  - title: Quick Menu
    icon: bars
    details: The quick multi-level menu allows for visual creation of custom templates

  - title: Hotkeys - Advanced
    icon: keyboard
    details: Supports unconventional system hotkeys like Caps+L, adding flexibility and functionality
    link: ./zh/adShortcut/

  - title: Quick Cursor
    icon: i-cursor
    details: AnyCaps enables quick cursor and command operations using unconventional hotkeys, featuring a built-in wim-like system
    link: ./zh/adShortcut/

  # - title: Quick Hotstrings (In Development)
  #   icon: font
  #   details: AnyCaps can use unconventional hotkeys for quick cursor and command operations

  - title: Multi-platform, Highly Compatible, Unified
    icon: bolt
    details: Supports Obsidian plugin / Standalone desktop application. Use the same editing logic across any text editing environment, including plain/rich text editors, web pages, chat input boxes, etc.

  - title: High Performance, Compact Size
    icon: bolt-lightning
    details: The App version is developed in Rust with WebView for display, delivering a performant, aesthetically pleasing, and lightweight user experience

  - title: Simple and Easy to Use
    icon: box-open
    details: Easy to use out-of-the-box, requires no configuration, simple syntax, quick to get started

  - title: Rich, Well-structured Documentation
    icon: book
    details: Provides aesthetically pleasing online documentation with illustrated explanations for each plugin sub-feature

  # - title: Online Experience Available
  #   icon: flask-vial
  #   details: Provides an online App version for experiencing and testing online
  #   link: https://any-block.github.io/any-block/

  - title: Expand easy, Online Dictionaries/Scripts
    icon: cloud
    details: Comes with a dictionary/script marketplace, collecting user-defined dictionaries/scripts from the community. Access and use numerous extensions without needing to write or develop them yourself, offering rich and diverse functionality
    link: ./zh/dict/

  - title: Expand flexibilitye, Custom Dictionary/Script
    icon: plug
    details: Beyond downloading and using others' dictionaries and scripts, you can also create custom dictionaries and scripts
    link: ./zh/dict/
---

[中文](./README.md) | [English](./README.en.md)

# AnyMenu —— InputMethod Assistant / Editor Assistant

## What is AnyMenu

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

## Document (using / tutorial / example)

- [Document Homepage](https://any-menu.github.io/any-menu/README.md)
- [Shortcut - Advanced, Fast Cursor (Caps+ Scheme)](./zh/adShortcut/README.md)
- [Dictionaries](./zh/dict/)
  (Scripts are also considered a special type of dictionary.)
  - [1. Download AnyMenu Dictionaries Online](./zh/dict/1.%20Online%20Dictionary%20Download.md)
  - [2. Manually Download AnyMenu Dictionaries](./zh/dict/2.%20Manual%20Dictionary%20Download.md) (For use in offline environments / network issues / online marketplace unavailable / downloading unaudited third-party dictionaries)
  - [3. Writing AnyMenu Dictionaries](./zh/dict/3.%20Writing%20Dictionaries.md)
  - [4. Uploading Custom AnyMenu Dictionaries](./zh/dict/4.%20Uploading%20Dictionaries.md)
- Related articles
  - [Pain Point: Different Editor Environments Have Different Logics](./en/DifferentEditor.md)
  - [What are the quick input / auto-completion solutions, and how do they compare?](./zh/对比.md)

## Usage / Tutorial / Demo

## Some graphics and text / presentations

After configuring the dictionary, you can use it as follows:

Quick Input Template:

![](./assets/PixPin_2025-10-04_09-45-58.gif)

The app version can be used in any text environment:

![](./assets/PixPin_2025-10-04_09-38-24.gif)

You can download and manage online dictionaries/scripts, or you can manually create, manage and customize them.

![](./assets/cloud_dict.png)

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
- Advanced Shortcuts (Caps+)
  - Utilizes non-traditional system shortcuts like `Caps+` and `'+`, with a pre-configured Vim-like scheme by default
- Others
  - There are also some immature, in-development, or planned features. See [Miscellaneous](./zh/Miscellaneous.md).

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

Among them

- "Better Selected Text Capture" is related to whether the text processing and replacement functions can be used.
- "Better Full Editor Text Capture" is related to whether functions such as finding the next matching text, multiple cursors, and full-text AI can be utilized. Even the ability to call some of the software's own APIs is possible.

## Highlights

Given that tools like Quicker and uTools already exist, what are the advantages compared to similar products? See below and [What Quick Input/Auto-completion Solutions Exist?](./zh/Comparison.md)

- Zero Barrier to Entry
  - It's not the one with the shortest or fastest input chain (the fastest are input method phrases and hotstring solutions, but they have a steeper learning curve).
    However, it is definitely the most intuitive and easiest to use in terms of thinking logic.
  - Can be used with any input method solution or any input method software.
  - Easy to use, fast, powerful, and highly customizable.
- Cross-platform
  - If time permits, support for Windows/Linux platforms, Obsidian, and VSCode plugins will be added.
