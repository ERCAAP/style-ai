// Local Storage Services

export {
  getAnalysisHistory,
  saveAnalysis,
  getAnalysisById,
  deleteAnalysis,
  clearAnalysisHistory,
  getRecentAnalyses,
  getAnalysesByDateRange,
  getTodaysAnalyses,
  getAnalysisCount,
  getAverageScoreStats,
  type StoredAnalysis,
} from './analysisStorage';

export {
  getSavedPhotos,
  savePhoto,
  getPhotoById,
  deletePhoto,
  clearAllSavedPhotos,
  getSavedPhotosCount,
  isPhotoSaved,
  type SavedPhoto,
} from './savedPhotosStorage';

export {
  getWardrobeItems,
  getWardrobeItem,
  addWardrobeItem,
  updateWardrobeItem,
  deleteWardrobeItem,
  toggleFavorite,
  recordWear,
  getWardrobeStats,
  getItemsByCategory,
  getItemsBySeason,
  getFavoriteItems,
} from './wardrobeStorage';
