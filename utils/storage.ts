import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStorage from 'expo-secure-store';
import { Platform } from 'react-native';

export const storage = {
  getItem: (key: string) => Platform.OS === 'web' ? AsyncStorage.getItem(key) : SecureStorage.getItemAsync(key),
  setItem: (key: string, value: string) => Platform.OS === 'web' ? AsyncStorage.setItem(key, value) : SecureStorage.setItemAsync(key, value),
  deleteItem: (key: string) => Platform.OS === 'web' ? AsyncStorage.removeItem(key) : SecureStorage.deleteItemAsync(key)
}