"use client";

import { useMemo, useState, useCallback } from "react";
import type { Note } from "@/types";
import {Folder} from "@/types";
import { NoteEditorModal } from "@/components/dashboard/NoteEditorModal";
import { useProtected } from "@/lib/use-protected";
import { Header } from "@/components/dashboard/Header";
import { FolderSidebar } from "@/components/dashboard/FolderSidebar";
import { FolderView } from "@/components/dashboard/FolderView";
import { TickerInputModal } from "@/components/dashboard/TickerInputModal";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Footer } from "@/components/Footer";
import {
  useTradingNotesAPI,
  useTickersAPI,
  useIngestAPI,
  useFetchTickersAPI,
} from "@/lib/hooks";
import type { TradingNote } from "@/types";

export default function TradingNotesPage() {
  const { isLoading: authLoading, isAuthenticated } = useProtected();
  const { tickers, isLoading: tickersLoading, fetchTickers } =
    useFetchTickersAPI();
  const { createNote, updateNote: updateNoteAPI, deleteNote: deleteNoteAPI } =
    useTradingNotesAPI();
  const { createTicker, deleteTicker } = useTickersAPI();
  const { ingestNote } = useIngestAPI();

  const [userSelectedTicker, setUserSelectedTicker] = useState<string | null>(null);
  const [editor, setEditor] = useState<
    | { open: false }
    | { open: true; mode: "add" }
    | { open: true; mode: "edit"; note: Note & { dbId?: string } }
  >({ open: false });
  const [showTickerInput, setShowTickerInput] = useState(false);
  const [tickerInput, setTickerInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Transform API data to folder format
  const folders: Folder[] = useMemo(() => {
    return tickers.map((ticker) => ({
      ticker: ticker.symbol,
      notes: (ticker.notes || []).map((note: TradingNote) => ({
        id: note.id,
        body: note.content,
        dbId: note.id,
        createdAt:
          typeof note.createdAt === "string"
            ? new Date(note.createdAt).getTime()
            : (note.createdAt as unknown as number),
        updatedAt:
          typeof note.updatedAt === "string"
            ? new Date(note.updatedAt).getTime()
            : (note.updatedAt as unknown as number),
      })),
    }));
  }, [tickers]);

  // Set initial selected ticker
  const selected = userSelectedTicker || (folders.length > 0 ? folders[0].ticker : "");

  const folder = useMemo(
    () => folders.find((f) => f.ticker === selected) ?? folders[0],
    [folders, selected],
  );

  const handleSaveAndIngest = useCallback(
    async (body: string) => {
      if (!folder) return;
      setIsSaving(true);

      try {
        let noteId: string;

        // Create or update note in database
        if (editor.open && editor.mode === "edit" && editor.note.dbId) {
          // Update existing note
          const updatedNote = await updateNoteAPI(editor.note.dbId, body);
          noteId = updatedNote.id;
        } else {
          // Create new note
          const newNote = await createNote(folder.ticker, body);
          noteId = newNote.id;
        }

        // Ingest content and create chunks
        await ingestNote(body, folder.ticker, noteId);

        // Refetch data to sync with database
        await fetchTickers();

        setEditor({ open: false });
      } catch (error) {
        console.error("Failed to save and ingest note:", error);
        alert("Failed to save note. Please try again.");
      } finally {
        setIsSaving(false);
      }
    },
    [editor, folder, createNote, updateNoteAPI, ingestNote, fetchTickers],
  );

  const handleDeleteNote = useCallback(
    async (tickerSymbol: string, noteId: string, dbId?: string) => {
      if (!dbId) {
        // Local only note - shouldn't happen with real DB
        return;
      }

      try {
        await deleteNoteAPI(dbId);
        // Refetch to sync with database
        await fetchTickers();
      } catch (error) {
        console.error("Failed to delete note:", error);
        alert("Failed to delete note. Please try again.");
      }
    },
    [deleteNoteAPI, fetchTickers],
  );

  const handleDeleteFolder = useCallback(
    async (ticker: string) => {
      try {
        await deleteTicker(ticker);
        // Refetch to sync with database
        await fetchTickers();
        setUserSelectedTicker(null);
      } catch (error) {
        console.error("Failed to delete ticker:", error);
        alert("Failed to delete ticker. Please try again.");
      }
    },
    [deleteTicker, fetchTickers],
  );

  const handleAddTicker = useCallback(async () => {
    const newTicker = tickerInput.trim().toUpperCase();
    if (!newTicker) return;

    setIsSaving(true);
    try {
      // Create ticker in database
      await createTicker(newTicker);

      // Refetch to sync with database
      await fetchTickers();
      setUserSelectedTicker(newTicker);
      setTickerInput("");
      setShowTickerInput(false);
    } catch (error) {
      console.error("Failed to add ticker:", error);
      alert("Failed to add ticker. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [tickerInput, createTicker, fetchTickers]);

  if (authLoading || tickersLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[320px_1fr]">
        <FolderSidebar
          folders={folders}
          selected={selected}
          onSelect={setUserSelectedTicker}
          onAddTicker={() => setShowTickerInput(true)}
        />

        {folders.length === 0 ? (
          <EmptyState onAddTicker={() => setShowTickerInput(true)} />
        ) : folder ? (
          <FolderView
            folder={folder}
            onAdd={() => setEditor({ open: true, mode: "add" })}
            onEdit={(note) =>
              setEditor({
                open: true,
                mode: "edit",
                note: note as Note & { dbId?: string },
              })
            }
            onDelete={(id) => {
              const note = folder.notes.find((n) => n.id === id);
              if (note) {
                handleDeleteNote(
                  folder.ticker,
                  id,
                  (note as Note & { dbId?: string }).dbId,
                );
              }
            }}
            onDeleteFolder={() => handleDeleteFolder(folder.ticker)}
          />
        ) : null}
      </main>

      <NoteEditorModal
        open={editor.open}
        ticker={folder?.ticker ?? ""}
        mode={editor.open ? editor.mode : "add"}
        initialBody={
          editor.open && editor.mode === "edit" ? editor.note.body : ""
        }
        onClose={() => !isSaving && setEditor({ open: false })}
        onSave={handleSaveAndIngest}
        isSaving={isSaving}
      />

      <TickerInputModal
        isOpen={showTickerInput}
        value={tickerInput}
        onValueChange={setTickerInput}
        onSubmit={handleAddTicker}
        onClose={() => !isSaving && setShowTickerInput(false)}
        isLoading={isSaving}
      />

      <Footer />
    </div>
  );
}
