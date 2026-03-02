// Mock implementations for local development
const mockFunction = () => Promise.resolve({ success: true, data: null });

// Mock Core object with all required methods
export const Core = {
  InvokeLLM: mockFunction,
  SendEmail: mockFunction,
  UploadFile: mockFunction,
  GenerateImage: mockFunction,
  ExtractDataFromUploadedFile: mockFunction,
  CreateFileSignedUrl: mockFunction,
  UploadPrivateFile: mockFunction
};

// Export individual methods for backward compatibility
export const InvokeLLM = mockFunction;
export const SendEmail = mockFunction;
export const UploadFile = mockFunction;
export const GenerateImage = mockFunction;
export const ExtractDataFromUploadedFile = mockFunction;
export const CreateFileSignedUrl = mockFunction;
export const UploadPrivateFile = mockFunction;





