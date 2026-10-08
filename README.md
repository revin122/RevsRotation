# RevsRotation

RevsRotation is a React Native app for organizing items into nested lists, with a rotation feature planned for future development. Every item can contain its own sublist, letting you organize related items at multiple levels and navigate through them one list at a time.

The current version focuses on creating, editing, and saving nested lists locally. Rotation behavior is planned for a future version.

## Current features

- Add named items to the main list or any sublist.
- Tap an item to open its children and use Back to return to the parent list.
- View the current list title in a centered header with Back on the left.
- Keep the text field and Add Item button above the virtual keyboard.
- Use Edit mode to rename items, confirm deletion of items or entire sublists, and drag handles to reorder within a list.
- Identify items using stable IDs for list rendering and navigation, rather than array positions.

Lists are saved automatically in an on-device SQLite database (`revsrotation.sqlite`) using `@op-engineering/op-sqlite`. Data survives app restarts and reloads. Storage works offline; export/import and rotation controls are not implemented yet.

## Local storage

- The app loads only the current list and its immediate children, rather than the entire tree.
- Each database item has a persistent random ID, parent ID, name, and sibling position.
- Adding, renaming, deleting, and reordering are saved in transactions. The screen updates after a successful commit; a failed save leaves the previous list intact and shows an error.
- Foreign keys are enabled on the connection. Deleting an item cascades to its descendants, leaving other branches untouched.
- A parent/position index supports sublist loading and ordering. Schema changes are tracked with SQLite's `user_version`.
- Startup and list loading have a retry state. Loading never writes an empty list over existing data.

Previous versions stored items only in memory, so there is no saved dataset to migrate. Items from an old session are not automatically imported. Uninstalling the app or erasing simulator data also removes its local database.

## Using the app

1. On **Main**, enter a name and tap **+ Add Item**.
2. Tap the new item to open its sublist.
3. Add more items inside it to build a hierarchy.
4. Tap **Back** to return to the previous list.
5. Tap **Edit** to rename an item by tapping its name, delete with the red control, or drag **≡** up or down. Tap **Done** to resume browsing.

For long lists, release the handle before scrolling to another section. Dragging does not automatically scroll the list.

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

## Project structure

| Path | Purpose |
| --- | --- |
| `index.js` | Registers the app with React Native. |
| `app/index.tsx` | Configures the navigation stack. |
| `app/StoredListScreen.tsx` | Loads each list on focus and handles saving and errors. |
| `app/storage/` | Opens SQLite, initializes the schema, and saves list changes atomically. |
| `app/ListScreen/index.tsx` | Displays a list, its header, and the add-item controls. |
| `app/ListScreen/views.ts` | Defines the list screen styles. |
| `app/types.ts` | Defines each node's ID, name, and children. |
| `app/utils.tsx` | Creates nodes, resolves ID-based paths, and collects leaf paths. |
| `__tests__/utils.test.ts` | Checks ID uniqueness and path behavior. |
| `ios/` and `android/` | Native platform projects. |

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

- Develop rotation behavior backed by database queries.
