import { create } from 'zustand';

const useAppStore = create((set) => ({
  activeView: 'papers',
  selectedPaperId: null,
  selectedAnnotationId: null,
  searchResults: null,
  selectedCategoryId: null,
  selectedTagId: null,
  pdfPageNumber: 1,
  pdfScale: 1.0,
  rightPanelTab: 'detail',
  refreshKey: 0,

  setActiveView: (v) => set({ activeView: v }),
  setSelectedPaperId: (id) => set({ selectedPaperId: id }),
  setSearchResults: (r) => set({ searchResults: r }),
  setPdfPageNumber: (p) => set({ pdfPageNumber: p }),
  setPdfScale: (s) => set({ pdfScale: s }),
  setRightPanelTab: (t) => set({ rightPanelTab: t }),
  openPaper: (id) => set({ selectedPaperId: id, activeView: 'pdf', rightPanelTab: 'detail' }),

  selectCategory: (id) => set(s => ({ selectedCategoryId: id, selectedTagId: null, activeView: 'papers', refreshKey: s.refreshKey + 1 })),
  selectTag: (id) => set(s => ({ selectedTagId: id, selectedCategoryId: null, activeView: 'papers', refreshKey: s.refreshKey + 1 })),
  selectAll: () => set(s => ({ selectedCategoryId: null, selectedTagId: null, activeView: 'papers', refreshKey: s.refreshKey + 1 })),
  doRefresh: () => set(s => ({ refreshKey: s.refreshKey + 1 })),
  colorKey: 0,
  updateColors: () => set(s => ({ colorKey: s.colorKey + 1 })),
}));

export default useAppStore;
