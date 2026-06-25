import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";

/** Centralized query keys so reads and their invalidations always match. */
export const queryKeys = {
  tickers: ["tickers"] as const,
  documents: (ticker: string) => ["documents", ticker] as const,
  quote: (symbol: string) => ["quote", symbol] as const,
  movers: ["movers"] as const,
};

export function useTickers(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.tickers,
    queryFn: () => api.fetchTickers(),
    enabled,
  });
}

export function useDocuments(ticker: string | undefined) {
  return useQuery({
    queryKey: queryKeys.documents(ticker ?? ""),
    queryFn: () => api.listDocuments(ticker as string),
    enabled: !!ticker,
  });
}

export function useQuote(symbol: string) {
  const query = useQuery({
    queryKey: queryKeys.quote(symbol),
    queryFn: () => api.fetchQuote(symbol),
    enabled: !!symbol,
    retry: false, // don't hammer a rate-limited / invalid symbol
  });


  return {
    price: query.data?.price ?? 0,
    change: query.data?.change ?? 0,
    changePercent: query.data?.changePercent ?? 0,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}

export function useMovers() {
  return useQuery({
    queryKey: queryKeys.movers,
    queryFn: () => api.fetchMovers(),
    staleTime: 10 * 60 * 1000, // movers change slowly; cache longer
  });
}

export function useCreateTicker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createTicker,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tickers }),
  });
}

export function useDeleteTicker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteTicker,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tickers }),
  });
}

interface SaveNoteArgs {
  ticker: string;
  content: string;
  noteId?: string;
}

/** Create or update a note,ingest it for RAG */
export function useSaveNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticker, content, noteId }: SaveNoteArgs) => {
      const saved = noteId
        ? await api.updateNote(noteId, content)
        : await api.createNote(ticker, content);
      await api.ingestNote(content, ticker, saved.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tickers }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteNote,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tickers }),
  });
}

export function useUploadDocument(ticker: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.uploadDocument(ticker, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.documents(ticker) }),
  });
}

export function useDeleteDocument(ticker: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) => api.deleteDocument(ticker, docId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.documents(ticker) }),
  });
}
