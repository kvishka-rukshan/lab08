# PersonalExpenseTracker

An Expo SDK 58 / React Native 0.88 expense tracking app built for Mobile Application Development Practical Tutorial 08.

## Features
- Local relational storage with SQLite (`expo-sqlite`)
- Create, read, update and delete expenses
- Input validation for title and positive numeric amount
- Category selection: Food, Transport, Bills and Other
- Live total for all expenses or the selected category
- Search expenses by title
- Filter expenses by category
- Tap an expense card to edit it
- Local date is stored with each expense

## Run the project

1. Install Node.js (LTS) and Expo Go on your phone.
2. Extract this ZIP and open the `PersonalExpenseTracker` folder in VS Code.
3. Open the terminal in that folder and run:

   ```bash
   npm install
   npx expo install --fix
   npx expo start
   ```

4. Scan the QR code using Expo Go (Android) or the Camera app (iOS).

This project targets Expo SDK 58 (React Native 0.88). If Expo reports dependency version mismatches, run `npx expo install --fix`, then `npx expo start`.

## Folder structure

```text
PersonalExpenseTracker/
├── app/
│   ├── _layout.tsx
│   └── index.tsx
├── db/
│   └── database.ts
├── Output_Screens/
├── app.json
├── package.json
├── tsconfig.json
└── README.md
```

## SQLite table

The `expenses` table contains:
- `id`: auto-increment primary key
- `title`: expense description
- `amount`: numeric amount
- `category`: Food, Transport, Bills or Other
- `date`: date stored as YYYY-MM-DD

All values are passed to SQL statements using `?` placeholders.

## Practical submission
Save application screenshots in `Output_Screens/`, then commit and push the complete project to a Git repository named `PersonalExpenseTracker`. Submit the repository link through eKel as instructed in the practical sheet.

> Note: `Output_Screens/` is intentionally included with a `.gitkeep` file. Add your own screenshots after running the app.
# lab08
