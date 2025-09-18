import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Offline Storage Utility for managing test data and videos
 */
class OfflineStorage {
  constructor() {
    this.TESTS_KEY = 'offline_tests';
    this.VIDEOS_DIR = `${FileSystem.documentDirectory}offline_videos/`;
  }

  /**
   * Initialize offline storage
   */
  async initialize() {
    try {
      // Create videos directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(this.VIDEOS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.VIDEOS_DIR, { intermediates: true });
      }
      return true;
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
      return false;
    }
  }

  /**
   * Save test data
   * @param {Object} testData - Test data to save
   * @returns {Promise<boolean>} Success status
   */
  async saveTest(testData) {
    try {
      const tests = await this.getTests();
      const updatedTests = [testData, ...tests];
      await AsyncStorage.setItem(this.TESTS_KEY, JSON.stringify(updatedTests));
      return true;
    } catch (error) {
      console.error('Failed to save test:', error);
      return false;
    }
  }

  /**
   * Get all offline tests
   * @returns {Promise<Array>} List of tests
   */
  async getTests() {
    try {
      const tests = await AsyncStorage.getItem(this.TESTS_KEY);
      return tests ? JSON.parse(tests) : [];
    } catch (error) {
      console.error('Failed to get tests:', error);
      return [];
    }
  }

  /**
   * Get a specific test by ID
   * @param {string} testId - Test ID
   * @returns {Promise<Object|null>} Test data or null
   */
  async getTest(testId) {
    try {
      const tests = await this.getTests();
      return tests.find(test => test.id === testId) || null;
    } catch (error) {
      console.error('Failed to get test:', error);
      return null;
    }
  }

  /**
   * Update test data
   * @param {string} testId - Test ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<boolean>} Success status
   */
  async updateTest(testId, updates) {
    try {
      const tests = await this.getTests();
      const testIndex = tests.findIndex(test => test.id === testId);
      
      if (testIndex !== -1) {
        tests[testIndex] = { ...tests[testIndex], ...updates };
        await AsyncStorage.setItem(this.TESTS_KEY, JSON.stringify(tests));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to update test:', error);
      return false;
    }
  }

  /**
   * Delete a test
   * @param {string} testId - Test ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteTest(testId) {
    try {
      const tests = await this.getTests();
      const updatedTests = tests.filter(test => test.id !== testId);
      await AsyncStorage.setItem(this.TESTS_KEY, JSON.stringify(updatedTests));
      
      // Delete associated video file if it exists
      const test = tests.find(test => test.id === testId);
      if (test && test.videoPath) {
        await this.deleteVideoFile(test.videoPath);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to delete test:', error);
      return false;
    }
  }

  /**
   * Save video file locally with enhanced error handling
   * @param {string} sourceUri - Source URI of the video
   * @param {string} fileName - Name for the saved file
   * @returns {Promise<string|null>} Path to saved file or null
   */
  async saveVideoFile(sourceUri, fileName) {
    try {
      // Ensure the videos directory exists
      await this.initialize();
      
      const targetPath = `${this.VIDEOS_DIR}${fileName}`;
      
      // Check if source file exists
      const sourceInfo = await FileSystem.getInfoAsync(sourceUri);
      if (!sourceInfo.exists) {
        console.error('Source video file does not exist:', sourceUri);
        return null;
      }
      
      // Copy file with better error handling
      await FileSystem.copyAsync({
        from: sourceUri,
        to: targetPath
      });
      
      // Verify the file was copied successfully
      const targetInfo = await FileSystem.getInfoAsync(targetPath);
      if (!targetInfo.exists) {
        console.error('Failed to copy video file to:', targetPath);
        return null;
      }
      
      console.log(`Video file saved successfully to: ${targetPath}`);
      return targetPath;
    } catch (error) {
      console.error('Failed to save video file:', error);
      return null;
    }
  }

  /**
   * Delete video file
   * @param {string} filePath - Path to the video file
   * @returns {Promise<boolean>} Success status
   */
  async deleteVideoFile(filePath) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
      }
      return true;
    } catch (error) {
      console.error('Failed to delete video file:', error);
      return false;
    }
  }

  /**
   * Get video file info
   * @param {string} filePath - Path to the video file
   * @returns {Promise<Object>} File info
   */
  async getVideoFileInfo(filePath) {
    try {
      return await FileSystem.getInfoAsync(filePath);
    } catch (error) {
      console.error('Failed to get video file info:', error);
      return { exists: false };
    }
  }

  /**
   * Clear all offline data
   * @returns {Promise<boolean>} Success status
   */
  async clearAllData() {
    try {
      // Delete all tests
      await AsyncStorage.removeItem(this.TESTS_KEY);
      
      // Delete all video files
      const dirInfo = await FileSystem.getInfoAsync(this.VIDEOS_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.VIDEOS_DIR, { idempotent: true });
      }
      
      // Recreate directory
      await this.initialize();
      
      return true;
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      return false;
    }
  }

  /**
   * Get storage usage information
   * @returns {Promise<Object>} Storage usage info
   */
  async getStorageInfo() {
    try {
      const tests = await this.getTests();
      let totalVideoSize = 0;
      
      // Calculate total size of video files
      for (const test of tests) {
        if (test.videoPath) {
          const fileInfo = await this.getVideoFileInfo(test.videoPath);
          if (fileInfo.exists) {
            totalVideoSize += fileInfo.size;
          }
        }
      }
      
      return {
        testCount: tests.length,
        totalVideoSize,
        storagePath: this.VIDEOS_DIR
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return {
        testCount: 0,
        totalVideoSize: 0,
        storagePath: this.VIDEOS_DIR
      };
    }
  }
}

// Export a singleton instance
export default new OfflineStorage();