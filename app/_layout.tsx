import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from '../db/database';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="personal-expenses.db" onInit={initDatabase}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </SQLiteProvider>
  );
}
