import { create } from 'zustand';

const getInitialStep = () => {
  const path = window.location.pathname.replace('/', '');
  return ['template', 'upload', 'sandbox'].includes(path) ? path : 'template';
};

const useAppStore = create((set) => ({
  // Current step in the flow
  step: getInitialStep(), // 'template' | 'upload' | 'sandbox'

  // Font data
  fontBytes: null,   // ArrayBuffer of the generated TTF
  fontName: 'MiLetra',
  templateType: 'full',

  // Upload state
  uploadedImage: null,     // File object
  imagePreview: null,      // Base64 data URL for preview
  isProcessing: false,
  processingError: null,

  // Actions
  setStep: (step) => set({ step }),

  setFontName: (name) => set({ fontName: name }),
  setTemplateType: (type) => set({ templateType: type }),

  setUploadedImage: (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        set({ uploadedImage: file, imagePreview: e.target.result });
      };
      reader.readAsDataURL(file);
    } else {
      set({ uploadedImage: null, imagePreview: null });
    }
  },

  setProcessing: (val) => set({ isProcessing: val }),
  setProcessingError: (err) => set({ processingError: err }),
  setFontBytes: (bytes) => set({ fontBytes: bytes }),

  // Reset everything for a new session
  reset: () => set({
    step: 'template',
    fontBytes: null,
    fontName: 'MiLetra',
    templateType: 'full',
    uploadedImage: null,
    imagePreview: null,
    isProcessing: false,
    processingError: null,
  }),
}));

export default useAppStore;
