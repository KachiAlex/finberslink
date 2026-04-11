export function useToast() {
  return {
    toast: ({ title, description, variant }: any) => {
      console.log(`[${variant}] ${title}: ${description}`);
    },
  };
}
