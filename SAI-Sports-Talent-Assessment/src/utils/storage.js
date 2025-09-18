import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  USER_DATA: 'userData',
  TEST_HISTORY: 'testHistory',
  ACHIEVEMENTS: 'achievements',
  USER_STATS: 'userStats',
  APP_SETTINGS: 'appSettings',
};

export const storage = {
  // Get item from storage
  async getItem(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return null;
    }
  },

  // Set item in storage
  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error);
      return false;
    }
  },

  // Remove item from storage
  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
      return false;
    }
  },

  // Clear all storage
  async clear() {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },

  // Get multiple items
  async multiGet(keys) {
    try {
      const values = await AsyncStorage.multiGet(keys);
      const result = {};
      values.forEach(([key, value]) => {
        result[key] = value ? JSON.parse(value) : null;
      });
      return result;
    } catch (error) {
      console.error('Error getting multiple items from storage:', error);
      return {};
    }
  },

  // Set multiple items
  async multiSet(keyValuePairs) {
    try {
      const pairs = keyValuePairs.map(([key, value]) => [key, JSON.stringify(value)]);
      await AsyncStorage.multiSet(pairs);
      return true;
    } catch (error) {
      console.error('Error setting multiple items in storage:', error);
      return false;
    }
  },
};

// Specific storage functions for the app
export const userStorage = {
  async saveUser(userData) {
    return await storage.setItem(StorageKeys.USER_DATA, userData);
  },

  async getUser() {
    return await storage.getItem(StorageKeys.USER_DATA);
  },

  async removeUser() {
    return await storage.removeItem(StorageKeys.USER_DATA);
  },
};

export const testStorage = {
  async saveTestHistory(history) {
    return await storage.setItem(StorageKeys.TEST_HISTORY, history);
  },

  async getTestHistory() {
    return await storage.getItem(StorageKeys.TEST_HISTORY) || [];
  },

  async addTestResult(result) {
    const history = await this.getTestHistory();
    const updatedHistory = [result, ...history];
    return await this.saveTestHistory(updatedHistory);
  },
};

export const achievementStorage = {
  async saveAchievements(achievements) {
    return await storage.setItem(StorageKeys.ACHIEVEMENTS, achievements);
  },

  async getAchievements() {
    return await storage.getItem(StorageKeys.ACHIEVEMENTS) || [];
  },

  async addAchievement(achievement) {
    const achievements = await this.getAchievements();
    const updatedAchievements = [...achievements, achievement];
    return await this.saveAchievements(updatedAchievements);
  },
};

export const statsStorage = {
  async saveStats(stats) {
    return await storage.setItem(StorageKeys.USER_STATS, stats);
  },

  async getStats() {
    return await storage.getItem(StorageKeys.USER_STATS) || {
      totalTests: 0,
      completedTests: 0,
      bestPerformances: {},
    };
  },

  async updateStats(updates) {
    const currentStats = await this.getStats();
    const updatedStats = { ...currentStats, ...updates };
    return await this.saveStats(updatedStats);
  },
};