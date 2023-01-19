# Velox Mundi
Welcome to Velox Mundi (Quick World). This application was designed to be a fast world-building tool to allow creators to quickly and easily build wiki pages for as many worlds as they want to build.

## Electron Application
The primary application is an Electron app, which allows creators to write pages for anything related to their worlds.

## Installation
No installers have been created for this application yet, so you will need to download the code and package and run it yourself.

### Development Prerequisites
The following required assets are not included in this repository, but are needed to develop the application. These third-party resources are not part of this application, but required for proper functionality. 

These prerequisites are only needed to modify the source code. The third-party assets will be included in any installers that are created in the future. 

Instructions on how to acquire and where to update the code to use each prerequisite are included below.

**Bootstrap Icons**
Source: [Bootstrap Icons Website](https://icons.getbootstrap.com/) / [Git Repo](https://github.com/twbs/icons/releases/)
* Download and extract the latest bootstrap icons and related files (fonts and CSS).
* Update "`src/Electron/VeloxMundiDesktop/src/styles/custom.css`" to import the bootstrap icons CSS file and define the "`bootstrap-icons`" font pointed to the correct download location. See [custom.css](src/Electron/VeloxMundiDesktop/src/styles/custom.css) for example.

## Current Features

### Unlimited World and Page Creation

Users can create new worlds (limited functionality) and create, edit, rename, and delete pages within their world using the built-in markdown editor.

### Markdown Editor

Use [markdown](https://markdownguide.com) to easily write content for any page without using HTML (althought HTML is supported).

### Native HTML Support

When a file is saved, it will be saved in both markdown and HTML formats. By saving the HTML directly, we make it easy for users to publish static HTML pages to their own website, and ensure pages load quickly, without requiring conversion from markdown to HTML during page loading.


## Future Features

### Image and Video Support

Images and videos can be embedded directly into any page, and played within the page.

### Automatic Indexing

Content within the world will automatically be indexed based on user specifications.

Indexes may be generated as a single file, listing all content grouped by page tags, or multi-page indexes, where the tags are listed on one page and link to a page showing all content within that tag.

Additional options for automatic indexes may also be provided.


### Custom CSS Support

Users can provide a global CSS file that will be referenced in the output HTML files.

In addition, users will be able to provide custom CSS for individual pages.

### Export to Web

Users will be able to export the HTML files generated through the application to their own website.

This may be done individually, or the users can chose to sync any changes made locally with their website via FTPS.

### Database Backend

Markdown files will be parsed automatically to save elements within the page as metadata in a database.

This data can be used for advanced searching and grouping.

The data can also be used to share pages between worlds (So elements of a character's data can exist in both worlds simultaneously). Edits made in one world will automatically be synced to all other world that page exists.

When using a database backend, users will be able to view and edit content in the page editor, or displayed as a filterable grid to facilitate making bulk changes to a variety of content at once.

### Page-level Security

Each page can have its own security settings.

If the world is published to a website, these settings cancontrol who can see that page. This allows the author to keep notes related to the world, but restrict them from public view.

Security may also be applied to local content on a users computer, if there is enough interest in that capability.

### Map Building

Maps are an integral part of world building. The application will need to be able to either create or import images to use as maps.

The application will allow the user to create links that will take the user to the imap and highlight a specific location specified in the link.

### Timelines

Timelines are an integral part of world building. The application will allow users to create timelines within their world, and link these timelines to and from any other page.

Timelines will support zooming in and out and show or hide events based on their relative importance at different zoom levels.

Timelines can be embedded in pages at specific zoom levels. Users should be able to interact with embedded timelines without leaving the page (Either through the use of modals that display the timeline on top of the page's contents, or by scrolling through the embedded timeline in-place).

### Weights and Measures

Support for custom measurements and weights used in your world.

### Custom Date Support

While some worlds may exist within our current calendar, many will have their own unique calendars. The application will natively support creating calendars and integrating them into timelines and pages. 

The application will also support date calculations of the span between two dates, presented in the custom date format ("Date1 was six spans, eight cycles, and seven intervals before Date2").

Each page will be able to support a start date and an end date. So a character page could show the birth and death date for that character. This makes it easy to find all of the characters who were alive on a specific date, or what cities existed between two times, etc.

### Import/Export and Backup/Restore

Individual pages or entire worlds can be imported and exported easily by the user.

In addition, there will be tools to allow the user to back up their world or restore their world from a backup.

Users will be able to create a new backup manually, or schedule a backup to be taken on application open or close at specific intervals.

Users will be able to configure automatic cleanup of outdated backups.

### File Versioning

Version history for each file will be supported, allowing users to revert accidental changes.

This version control will most likely use git source control, and users will have the option to disable it if they want to use their own versioning solution or just don't want to keep every change.

Users will be able to configure the version control system to specify whether changes are committed after every file change, or are manually committed whenever the user decides to save a version of all changes.

## Writing Toolkit

Additional writing tools will be available to the user, allowing them to write content alongside the pages they create for their world.

### Multi-file writing platform

Users can write their content (book, screenplay, script, etc.) in small chunks and save files individually. These files can be reorganized as needed to form the correct story flow.

### Metadata for each page

Each piece of writing can contain links to specific pages, dates, timelines, tags, maps (with precise location), etc. 

These links can be automatically removed when the pages are compiled.

Metadata can be used for advanced features, like finding every file that references a particular character, or every file that took place between these two dates.

### Compile and Export

Written files can be compiled and exported into a single manuscript in limited formats (TBD, but probably at least markdown, HTML, RTF, and TXT).



