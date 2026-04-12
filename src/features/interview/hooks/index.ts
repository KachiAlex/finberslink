export interface InterviewQuestion {
  id: string;
  text: string;
  duration: number;
}

export interface InterviewSession {
  id: string;
  questions: InterviewQuestion[];
  status: 'pending' | 'in_progress' | 'completed';
}

export function useInterviewSession(sessionId: string) {
  return {
    session: null as InterviewSession | null,
    isLoading: false,
    error: null,
  };
}

export function useRecordInterviewResponse() {
  return {
    recordResponse: async (questionId: string, audioBlob: Blob) => {
      return { id: '', questionId, audioUrl: '' };
    },
    isLoading: false,
    error: null,
  };
}

export function useUpdateInterviewSession() {
  return {
    updateSession: async (sessionId: string, data: any) => {
      return { id: sessionId, ...data };
    },
    isLoading: false,
    error: null,
  };
}

export function useUploadInterviewAudio() {
  return {
    uploadAudio: async (audioBlob: Blob) => {
      return { url: '', duration: 0 };
    },
    isLoading: false,
    error: null,
  };
}
