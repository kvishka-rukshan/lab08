import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import {
  addExpense,
  deleteExpense,
  Expense,
  ExpenseCategory,
  getFilteredExpenses,
  getFilteredTotal,
  updateExpense,
} from '../db/database';

const CATEGORIES: ExpenseCategory[] = ['Food', 'Transport', 'Bills', 'Other'];
const FILTERS = ['All', ...CATEGORIES];
const BLUE = '#2463EB';
const DARK = '#17233D';

const money = (value: number) =>
  `Rs. ${Number(value || 0).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function ExpenseTrackerScreen() {
  const db = useSQLiteContext();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');

  const loadData = useCallback(async () => {
    const [rows, sum] = await Promise.all([
      getFilteredExpenses(db, selectedFilter, searchQuery),
      getFilteredTotal(db, selectedFilter, searchQuery),
    ]);
    setExpenses(rows);
    setTotal(sum);
  }, [db, selectedFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setAmount('');
    setCategory('Food');
  };

  const handleSave = async () => {
    const cleanTitle = title.trim();
    const parsedAmount = Number(amount.trim());

    if (!cleanTitle) {
      Alert.alert('Invalid input', 'Please enter an expense title.');
      return;
    }
    if (!amount.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter an amount greater than zero.');
      return;
    }

    try {
      if (editingId !== null) {
        await updateExpense(db, editingId, cleanTitle, parsedAmount, category);
      } else {
        await addExpense(db, cleanTitle, parsedAmount, category);
      }
      resetForm();
      await loadData();
    } catch {
      Alert.alert('Database error', 'The expense could not be saved. Please try again.');
    }
  };

  const startEdit = (item: Expense) => {
    setEditingId(item.id);
    setTitle(item.title);
    setAmount(String(item.amount));
    setCategory(item.category);
  };

  const confirmDelete = (id: number) => {
    Alert.alert('Delete expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteExpense(db, id);
          if (editingId === id) resetForm();
          await loadData();
        },
      },
    ]);
  };

  const renderExpense = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.expenseCard, editingId === item.id && styles.expenseCardEditing]}
      onPress={() => startEdit(item)}
    >
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseTitle}>{item.title}</Text>
        <Text style={styles.expenseMeta}>{item.category} · {item.date}</Text>
      </View>
      <View style={styles.expenseRight}>
        <Text style={styles.expenseAmount}>{money(item.amount)}</Text>
        <TouchableOpacity onPress={() => confirmDelete(item.id)} hitSlop={10}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Expense Tracker</Text>
          <View style={styles.headerIcon}><Text style={styles.headerIconText}>₨</Text></View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{selectedFilter === 'All' ? 'Total Expenses' : `${selectedFilter} Total`}</Text>
          <Text style={styles.summaryAmount}>{money(total)}</Text>
          <Text style={styles.summaryHint}>{expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'} shown</Text>
        </View>

        <Text style={styles.sectionTitle}>{editingId === null ? 'New Expense' : 'Edit Expense'}</Text>
        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            placeholder="Expense title (e.g. Lunch)"
            placeholderTextColor="#9AA3B2"
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />
          <TextInput
            style={styles.input}
            placeholder="Amount (e.g. 450)"
            placeholderTextColor="#9AA3B2"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />

          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                style={[styles.chip, category === cat && styles.chipActive]}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
              <Text style={styles.primaryButtonText}>
                {editingId !== null ? 'Update Expense' : '+ Add Expense'}
              </Text>
            </TouchableOpacity>
            {editingId !== null && (
              <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Expenses</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search expenses by title..."
          placeholderTextColor="#9AA3B2"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setSelectedFilter(filter)}
              style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={expenses}
          renderItem={renderExpense}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No expenses found</Text>
              <Text style={styles.emptyText}>Add an expense or change your search/filter.</Text>
            </View>
          }
        />
        <Text style={styles.footer}>Tap an expense card to edit it.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F5F9' },
  content: { paddingHorizontal: 18, paddingTop: 56, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  headerTitle: { fontSize: 21, fontWeight: '800', color: DARK },
  headerIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E5EAF4', alignItems: 'center', justifyContent: 'center' },
  headerIconText: { color: DARK, fontSize: 18, fontWeight: '800' },
  summaryCard: { backgroundColor: DARK, borderRadius: 13, padding: 17, marginBottom: 22 },
  summaryLabel: { color: '#DCE4F4', fontSize: 12, fontWeight: '600' },
  summaryAmount: { color: '#FFFFFF', fontSize: 27, fontWeight: '800', marginTop: 5 },
  summaryHint: { color: '#AEBBD2', fontSize: 11, marginTop: 5 },
  sectionTitle: { color: DARK, fontWeight: '800', fontSize: 16, marginBottom: 10 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 13, padding: 14, marginBottom: 22, borderWidth: 1, borderColor: '#E8ECF3' },
  input: { height: 44, borderWidth: 1, borderColor: '#E6EAF1', borderRadius: 8, paddingHorizontal: 12, color: DARK, marginBottom: 10, backgroundColor: '#FBFCFE', fontSize: 13 },
  fieldLabel: { color: '#687386', fontSize: 11, fontWeight: '700', marginBottom: 8, marginTop: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 13 },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 18, backgroundColor: '#F0F2F6', borderWidth: 1, borderColor: '#E8EBF1' },
  chipActive: { backgroundColor: '#E8F0FF', borderColor: BLUE },
  chipText: { color: '#657084', fontSize: 11, fontWeight: '600' },
  chipTextActive: { color: BLUE },
  formActions: { flexDirection: 'row', gap: 9 },
  primaryButton: { flex: 1, backgroundColor: BLUE, borderRadius: 8, minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  cancelButton: { paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#D9DEE8', alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: '#647084', fontWeight: '700', fontSize: 12 },
  searchInput: { height: 43, borderRadius: 9, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EAF1', paddingHorizontal: 13, color: DARK, fontSize: 13, marginBottom: 11 },
  filterRow: { gap: 7, paddingBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#E9EDF4', borderRadius: 18 },
  filterChipActive: { backgroundColor: BLUE },
  filterText: { color: '#687386', fontSize: 11, fontWeight: '700' },
  filterTextActive: { color: '#FFFFFF' },
  expenseCard: { backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E9EDF3', padding: 13, marginBottom: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  expenseCardEditing: { borderColor: BLUE, backgroundColor: '#F7FAFF' },
  expenseInfo: { flex: 1, paddingRight: 10 },
  expenseTitle: { color: DARK, fontSize: 13, fontWeight: '800' },
  expenseMeta: { color: '#8A94A5', fontSize: 10, marginTop: 5 },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { color: DARK, fontWeight: '800', fontSize: 12 },
  deleteText: { color: '#E15A5A', fontSize: 10, marginTop: 5, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 28 },
  emptyTitle: { color: '#697589', fontWeight: '700', fontSize: 13 },
  emptyText: { color: '#A0A8B5', fontSize: 11, marginTop: 5, textAlign: 'center' },
  footer: { color: '#9AA3B2', textAlign: 'center', fontSize: 10, marginTop: 12 },
});
