const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } = require('firebase/storage');
const { storage } = require('../config/firebase');
const path = require('path');

// Storage folders structure
const STORAGE_FOLDERS = {
  VIDEOS: 'assessment-videos',
  PROFILE_PHOTOS: 'profile-photos',
  DOCUMENTS: 'documents',
  THUMBNAILS: 'thumbnails',
  REPORTS: 'reports'
};

// Allowed file types
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// File size limits (in bytes)
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

// Utility function to validate file
const validateFile = (file, type) => {
  if (!file) {
    throw new Error('No file provided');
  }

  switch (type) {
    case 'video':
      if (!ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
        throw new Error('Invalid video format. Allowed formats: MP4, AVI, QuickTime');
      }
      if (file.size > MAX_VIDEO_SIZE) {
        throw new Error('Video file too large. Maximum size is 100MB');
      }
      break;
    
    case 'image':
      if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        throw new Error('Invalid image format. Allowed formats: JPEG, PNG, GIF');
      }
      if (file.size > MAX_IMAGE_SIZE) {
        throw new Error('Image file too large. Maximum size is 5MB');
      }
      break;
    
    case 'document':
      if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
        throw new Error('Invalid document format. Allowed formats: PDF, DOC, DOCX');
      }
      if (file.size > MAX_DOCUMENT_SIZE) {
        throw new Error('Document file too large. Maximum size is 10MB');
      }
      break;
    
    default:
      throw new Error('Unknown file type');
  }
};

// Generate unique filename
const generateUniqueFilename = (originalName, prefix = '', userId = '') => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  
  return `${prefix}_${userId}_${timestamp}_${randomString}${extension}`;
};

// Video Upload Functions
const uploadAssessmentVideo = async (file, metadata) => {
  try {
    validateFile(file, 'video');
    
    const filename = generateUniqueFilename(
      file.originalname,
      `${metadata.testType}_${metadata.athleteId}`,
      metadata.userId
    );
    
    const storageRef = ref(storage, `${STORAGE_FOLDERS.VIDEOS}/${filename}`);
    
    console.log('Uploading assessment video:', filename);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file.buffer, {
      customMetadata: {
        athleteId: metadata.athleteId,
        testType: metadata.testType,
        assessmentId: metadata.assessmentId || '',
        uploadedBy: metadata.userId,
        uploadDate: new Date().toISOString()
      }
    });
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('Assessment video uploaded successfully:', downloadURL);
    
    return {
      success: true,
      downloadURL,
      filename,
      size: file.size,
      mimeType: file.mimetype,
      metadata: snapshot.metadata
    };
  } catch (error) {
    console.error('Error uploading assessment video:', error);
    throw new Error(error.message || 'Failed to upload assessment video');
  }
};

const uploadProfilePhoto = async (file, userId) => {
  try {
    validateFile(file, 'image');
    
    const filename = generateUniqueFilename(
      file.originalname,
      'profile',
      userId
    );
    
    const storageRef = ref(storage, `${STORAGE_FOLDERS.PROFILE_PHOTOS}/${filename}`);
    
    console.log('Uploading profile photo:', filename);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file.buffer, {
      customMetadata: {
        userId: userId,
        uploadDate: new Date().toISOString(),
        type: 'profile_photo'
      }
    });
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('Profile photo uploaded successfully:', downloadURL);
    
    return {
      success: true,
      downloadURL,
      filename,
      size: file.size,
      mimeType: file.mimetype
    };
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    throw new Error(error.message || 'Failed to upload profile photo');
  }
};

const uploadDocument = async (file, metadata) => {
  try {
    validateFile(file, 'document');
    
    const filename = generateUniqueFilename(
      file.originalname,
      metadata.type || 'document',
      metadata.userId
    );
    
    const storageRef = ref(storage, `${STORAGE_FOLDERS.DOCUMENTS}/${filename}`);
    
    console.log('Uploading document:', filename);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file.buffer, {
      customMetadata: {
        userId: metadata.userId,
        documentType: metadata.type || 'general',
        uploadDate: new Date().toISOString(),
        description: metadata.description || ''
      }
    });
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('Document uploaded successfully:', downloadURL);
    
    return {
      success: true,
      downloadURL,
      filename,
      size: file.size,
      mimeType: file.mimetype
    };
  } catch (error) {
    console.error('Error uploading document:', error);
    throw new Error(error.message || 'Failed to upload document');
  }
};

// File Deletion Functions
const deleteFile = async (fileURL) => {
  try {
    if (!fileURL) {
      return { success: true, message: 'No file to delete' };
    }
    
    // Extract file path from URL
    const fileRef = ref(storage, fileURL);
    
    console.log('Deleting file from Firebase Storage');
    
    await deleteObject(fileRef);
    
    console.log('File deleted successfully');
    
    return { success: true, message: 'File deleted successfully' };
  } catch (error) {
    console.error('Error deleting file:', error);
    // Don't throw error for deletion failures
    console.warn('Failed to delete file, but continuing');
    return { success: false, message: error.message };
  }
};

// File Listing Functions
const listUserFiles = async (userId, folder = null) => {
  try {
    const folderPath = folder || '';
    const listRef = ref(storage, folderPath);
    
    const result = await listAll(listRef);
    const files = [];
    
    for (const itemRef of result.items) {
      try {
        const downloadURL = await getDownloadURL(itemRef);
        const metadata = await itemRef.getMetadata();
        
        // Filter by user if specified
        if (userId && metadata.customMetadata?.userId === userId) {
          files.push({
            name: itemRef.name,
            downloadURL,
            size: metadata.size,
            timeCreated: metadata.timeCreated,
            updated: metadata.updated,
            contentType: metadata.contentType,
            customMetadata: metadata.customMetadata
          });
        } else if (!userId) {
          files.push({
            name: itemRef.name,
            downloadURL,
            size: metadata.size,
            timeCreated: metadata.timeCreated,
            updated: metadata.updated,
            contentType: metadata.contentType,
            customMetadata: metadata.customMetadata
          });
        }
      } catch (error) {
        console.warn('Error getting file metadata:', error);
      }
    }
    
    return { success: true, files };
  } catch (error) {
    console.error('Error listing files:', error);
    throw new Error('Failed to list files');
  }
};

const listAssessmentVideos = async (athleteId) => {
  try {
    const listRef = ref(storage, STORAGE_FOLDERS.VIDEOS);
    const result = await listAll(listRef);
    const videos = [];
    
    for (const itemRef of result.items) {
      try {
        const metadata = await itemRef.getMetadata();
        
        // Filter videos for specific athlete
        if (metadata.customMetadata?.athleteId === athleteId) {
          const downloadURL = await getDownloadURL(itemRef);
          
          videos.push({
            name: itemRef.name,
            downloadURL,
            size: metadata.size,
            timeCreated: metadata.timeCreated,
            testType: metadata.customMetadata?.testType,
            assessmentId: metadata.customMetadata?.assessmentId,
            uploadedBy: metadata.customMetadata?.uploadedBy
          });
        }
      } catch (error) {
        console.warn('Error getting video metadata:', error);
      }
    }
    
    return { success: true, videos };
  } catch (error) {
    console.error('Error listing assessment videos:', error);
    throw new Error('Failed to list assessment videos');
  }
};

// Storage Statistics
const getStorageStats = async (userId) => {
  try {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      filesByType: {
        videos: 0,
        images: 0,
        documents: 0
      },
      sizeByType: {
        videos: 0,
        images: 0,
        documents: 0
      }
    };
    
    // Check each folder
    for (const [folderName, folderPath] of Object.entries(STORAGE_FOLDERS)) {
      try {
        const { files } = await listUserFiles(userId, folderPath);
        
        files.forEach(file => {
          stats.totalFiles++;
          stats.totalSize += file.size;
          
          if (file.contentType?.startsWith('video/')) {
            stats.filesByType.videos++;
            stats.sizeByType.videos += file.size;
          } else if (file.contentType?.startsWith('image/')) {
            stats.filesByType.images++;
            stats.sizeByType.images += file.size;
          } else {
            stats.filesByType.documents++;
            stats.sizeByType.documents += file.size;
          }
        });
      } catch (error) {
        console.warn(`Error getting stats for folder ${folderName}:`, error);
      }
    }
    
    return { success: true, stats };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    throw new Error('Failed to get storage statistics');
  }
};

module.exports = {
  STORAGE_FOLDERS,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MAX_VIDEO_SIZE,
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,
  // Upload functions
  uploadAssessmentVideo,
  uploadProfilePhoto,
  uploadDocument,
  // Delete functions
  deleteFile,
  // List functions
  listUserFiles,
  listAssessmentVideos,
  // Stats functions
  getStorageStats,
  // Utility functions
  validateFile,
  generateUniqueFilename
};