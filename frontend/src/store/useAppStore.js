import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const getInitialStep = () => {
  const path = window.location.pathname.replace('/', '');
  return ['template', 'upload', 'editor', 'sandbox'].includes(path) ? path : 'template';
};

const useAppStore = create(
  persist(
    (set) => ({
      // Current step in the flow
      step: getInitialStep(), // 'template' | 'upload' | 'sandbox'

      // Font data
      fontBytes: null,   // ArrayBuffer of the generated TTF
      fontName: 'MiLetra',
      templateType: 'full',
      extractedGlyphs: null, // { [char]: "data:image/png;base64,..." }

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
      setExtractedGlyphs: (glyphs) => set({ extractedGlyphs: glyphs }),
      updateExtractedGlyph: (char, newBase64) => set((state) => ({
        extractedGlyphs: { ...state.extractedGlyphs, [char]: newBase64 },
      })),

      // Reset everything for a new session
      reset: () => set({
        step: 'template',
        fontBytes: null,
        extractedGlyphs: null,
        uploadedImage: null,
        imagePreview: null,
        isProcessing: false,
        processingError: null,
      }),
    }),
    {
      name: 'kiru-storage', // guarda la configuración en localStorage
      partialize: (state) => ({ 
        fontName: state.fontName, 
        templateType: state.templateType 
      }), // Solo persiste el nombre de fuente y el tipo de plantilla elegido
    }
  )
);

export default useAppStore;
