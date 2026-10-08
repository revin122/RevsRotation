# RevsRotation

RevsRotation is a React Native app for organizing items into nested lists, with a rotation feature planned for future development. Every item can contain its own sublist, letting you organize related items at multiple levels and navigate through them one list at a time.

The current version focuses on creating and browsing this list structure. It also collects paths to leaf items—items with no children—as a foundation for future rotation behavior.

## Current features

- Add named items to the main list or any sublist.
- Tap an item to open its children and use Back to return to the parent list.
- View the current list title in a centered header with Back on the left.
- Keep the text field and Add Item button above the virtual keyboard.
- Use Edit mode to rename items, confirm deletion of items or entire sublists, and drag handles to reorder within a list.
- Identify items using stable IDs for list rendering and navigation, rather than array positions.

Data is currently held in memory and resets when the app restarts or fully reloads. Saving lists and rotation controls are not implemented yet.

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

Repeat the CocoaPods step when native dependencies change.

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
| `app/index.tsx` | Owns the list data and navigation stack. |
| `app/ListScreen/index.tsx` | Displays a list, its header, and the add-item controls. |
| `app/ListScreen/views.ts` | Defines the list screen styles. |
| `app/types.ts` | Defines each node's ID, name, and children. |
| `app/utils.tsx` | Creates nodes, resolves ID-based paths, and collects leaf paths. |
| `__tests__/utils.test.ts` | Checks ID uniqueness and path behavior. |
| `ios/` and `android/` | Native platform projects. |

Navigation paths contain child IDs from the root to the selected item. The root path is empty. Leaf paths use the same format, and an empty root produces no leaf paths.

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

The starter render test in `__tests__/App.test.tsx` still imports the old `../App` entry point and needs updating before the full test suite can pass.

## Planned next steps

- Develop rotation behavior using the leaf-item paths.
