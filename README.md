# RevsRotation

RevsRotation is a React Native app for organizing items into nested lists, with a rotation control. Every item can contain its own sublist, letting you organize related items at multiple levels and navigate through them one list at a time.

The current version focuses on creating, editing, and saving nested lists locally. Tap ROTATE to move the first item to the bottom of the current list and save the order.

## Current features

- Add named items to the main list or any sublist.
- Tap an item to open its children and use Back to return to the parent list.
- View the current list title in a centered header with Back on the left.
- Keep the text field and + button above the virtual keyboard.
- Use Edit mode to rename items, confirm deletion of items or entire sublists, and drag handles to reorder within a list.
- Identify items using stable IDs for list rendering and navigation, rather than array positions.

Lists are saved automatically in an on-device SQLite database (`revsrotation.sqlite`) using `@op-engineering/op-sqlite`. Data survives app restarts and reloads. Storage works offline; export/import is not implemented yet.

## Local storage

- The app loads only the current list and its immediate children, rather than the entire tree.
- Each database item has a persistent random ID, parent ID, name, and sibling position.
- Adding, renaming, deleting, and reordering are saved in transactions. The screen updates after a successful commit; a failed save leaves the previous list intact and shows an error.
- Foreign keys are enabled on the connection. Deleting an item cascades to its descendants, leaving other branches untouched.
- A parent/position index supports sublist loading and ordering. Schema changes are tracked with SQLite's `user_version`.
- Startup and list loading have a retry state. Loading never writes an empty list over existing data.

Previous versions stored items only in memory, so there is no saved dataset to migrate. Items from an old session are not automatically imported. Uninstalling the app or erasing simulator data also removes its local database.

## Using the app

1. On **Main**, enter a name and tap **+**.
2. Tap the new item to open its sublist.
3. Add more items inside it to build a hierarchy.
4. Tap **Back** to return to the previous list, or tap the sublist title **⌄** to open **Go to list** and jump to any parent. The current list is marked with a checkmark. Tap outside or Cancel to close the popup; Android Back also dismisses it.
5. Open **⋯ → Edit List** to rename an item by tapping its name, delete with the red control, or drag **≡** up or down. Tap **Done** to resume browsing.

For long lists, release the handle before scrolling to another section. Dragging does not automatically scroll the list.

## Copy and paste lists

Open **⋯ → Copy List** to capture the current list's contents, including all nested items. Navigate to a destination list or sublist and choose **⋯ → Paste List**. Pasted items are appended in their original order, with new IDs, so edits and deletions do not affect the originals. The current list's title is not added as an extra container.

The clipboard holds a snapshot from the time you copied, can be pasted repeatedly, and is cleared when the app restarts. Paste saves the entire copy in one database transaction. Copying an empty list is disabled. A brief “List copied” message confirms copying; Paste List is disabled until you copy something.

## Development setup

The project uses React Native 0.80, React 19, TypeScript, React Navigation, and Immer. Use **Yarn** for JavaScript dependencies and project commands.

You will need Node.js 18 or newer and Yarn. iOS development requires macOS, Xcode, an installed simulator runtime, Ruby/Bundler, and CocoaPods. Android development requires Android Studio, the Android SDK, a compatible JDK, and an emulator or connected device.

Install JavaScript dependencies from the project root:

```sh
yarn install
```

For iOS, also install the Ruby and CocoaPods dependencies:

```sh
bundle install
cd ios
bundle exec pod install
cd ..
```

Repeat the CocoaPods step when native dependencies change. SQLite is a native dependency, so after installing it you must rebuild the app; a Metro reload alone is not enough.

### Run locally

Start Metro from the project root:

```sh
yarn start
```

In a second terminal, build and launch the desired platform:

```sh
# iOS
yarn ios

# Android
yarn android
```

For Xcode development, open `ios/RevsRotation.xcworkspace`.

## Project structure (MVC style)

The app uses React hooks as controllers. Views render the interface and forward user actions; controllers coordinate those actions with the models.

```text
app/
  index.tsx                       # App entry and navigation stack
  types/                          # Data, routes, UI contracts, storage, and clipboard types
  models/
    tree.ts                       # Draft IDs and tree helpers
    listClipboard.ts              # In-memory copy snapshot and subscriptions
    storage/
      index.ts                    # SQLite connection and initialization
      repository.ts               # Queries, transactions, copy/paste, deletion
  controllers/
    useStoredListController.ts    # Loading, saving, retry, navigation, clipboard actions
    useListEditor.ts              # Add, rename, delete, reorder, edit mode, input reset
    useCopiedList.ts              # React subscription to the clipboard model
  views/
    StoredListScreen.tsx          # Loading/error/saving UI and screen wiring
    ListScreen/
      index.tsx                   # List layout and controls
      styles.ts                   # List screen styles and row dimensions
      ListActionsMenu.tsx         # Edit, copy, and paste menu
      ReorderHandle.tsx           # Drag gesture and accessibility input
```

**Model:** owns data, SQLite operations, and the clipboard snapshot. Models do not import React views or controller hooks.

**Controller:** owns interaction state and coordinates persistence, navigation, and feedback. Database changes continue to go through the repository. Row height is supplied by the view to the editor controller so it does not depend on a stylesheet.

**View:** owns JSX, styles, keyboard layout, and gesture presentation. Views call controller actions instead of updating the database directly. Small rendering calculations, such as row offsets during dragging, stay with the layout.

For example: tapping **Add Item** calls the editor controller, which prepares the update and asks the storage controller to save it. The repository commits the transaction, the storage controller supplies the saved list, and the editor clears the input only after success.

This refactor keeps the existing database schema and UI behavior. Further extraction of the header, item row, form, and dialogs into smaller view components is a separate follow-up.

Tests in `__tests__/` cover the app/controller integration, editing, and tree helpers. `scripts/storage.test.cjs` exercises the model repository against real SQLite. Native projects remain in `ios/` and `android/`.

Navigation paths contain child IDs from the root to the selected item. The root path is empty. Only the final ID is needed to load a list from SQLite. The older tree utilities remain available for tests and future work; startup no longer walks the whole tree.

## Checks

Run the focused data and navigation-path tests:

```sh
yarn test __tests__/utils.test.ts --runInBand --watchman=false
```

Other available checks:

```sh
yarn test
yarn lint
yarn tsc --noEmit
```

Run the storage integration tests with Node.js 22.13+ (or Node.js 23.4+) for its built-in SQLite module:

```sh
yarn test:storage
```

These tests use the repository's actual SQL against temporary SQLite databases, covering reopening, stable IDs, ordering, descendant deletion, rollback, and indexed sublist loading. Jest tests cover the list controls and storage loading/error states. Neither replaces a native device or simulator check.

After your next native build, create nested lists, rename and reorder items, close and reopen the app, then delete a parent and confirm its descendants are gone while other branches remain.

## Planned next steps

- Add import/export.
