"use client";

import { useMemo, useState } from "react";
import type { Note, Doc, DocType } from "@/types";
import { Folder } from "@/types";
import { NoteEditorModal } from "@/components/dashboard/NoteEditorModal";
import { useProtected } from "@/lib/use-protected";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { Header } from "@/components/Header";
import { FolderSidebar } from "@/components/dashboard/FolderSidebar";
import { FolderView } from "@/components/dashboard/FolderView";
import { TickerInputModal } from "@/components/dashboard/TickerInputModal";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Footer } from "@/components/Footer";
import * as api from "@/lib/api";
import {
  useTickers,
  useDocuments,
  useCreateTicker,
  useDeleteTicker,
  useSaveNote,
  useDeleteNote,
  useUploadDocument,
  useDeleteDocument,
} from "@/lib/queries";

function mapDocType(fileType: string): DocType {
  return fileType.includes("pdf") ? "pdf" : "docx";
}

export default function TradingNotesPage() {
  const { isLoading: authLoading, isAuthenticated } = useProtected();

  const [userSelectedTicker, setUserSelectedTicker] = useState<string | null>(null);
  const [editor, setEditor] = useState<
    | { open: false }
    | { open: true; mode: "add" }
    | { open: true; mode: "edit"; note: Note & { dbId?: string } }
  >({ open: false });
  const [showTickerInput, setShowTickerInput] = useState(false);
  const [tickerInput, setTickerInput] = useState("");

  // --- Reads (fetching, caching, and refetching) ---
  const { data: tickersData = [], isLoading: tickersLoading } =
    useTickers(isAuthenticated);

  const selected = userSelectedTicker || tickersData[0]?.symbol || "";

  const { data: documentsData = [] } = useDocuments(selected || undefined);

  // --- Mutations (each invalidates the cache it affects) ---
  const createTicker = useCreateTicker();
  const deleteTicker = useDeleteTicker();
  const saveNote = useSaveNote();
  const deleteNote = useDeleteNote();
  const uploadDocument = useUploadDocument(selected);
  const deleteDocument = useDeleteDocument(selected);

  // Build folder view-models from the cached query data.
  const folders: Folder[] = useMemo(() => {
    const docs: Doc[] = documentsData.map((d) => ({
      id: d.id,
      name: d.fileName,
      type: mapDocType(d.fileType),
      createdAt: new Date(d.createdAt).getTime(),
    }));
    return tickersData.map((ticker) => ({
      id: ticker.symbol,
      ticker: ticker.symbol,
      notes: (ticker.notes || []).map((note) => ({
        id: note.id,
        body: note.content,
        dbId: note.id,
        createdAt: new Date(note.createdAt).getTime(),
        updatedAt: new Date(note.updatedAt).getTime(),
      })),
      // Documents are only fetched for the selected ticker.
      docs: ticker.symbol === selected ? docs : [],
    }));
  }, [tickersData, documentsData, selected]);

  const folder = useMemo(
    () => folders.find((f) => f.ticker === selected) ?? folders[0],
    [folders, selected],
  );

  const handleSaveAndIngest = async (body: string) => {
    if (!folder) return;
    try {
      await saveNote.mutateAsync({
        ticker: folder.ticker,
        content: body,
        noteId:
          editor.open && editor.mode === "edit" ? editor.note.dbId : undefined,
      });
      setEditor({ open: false });
    } catch (error) {
      console.error("Failed to save and ingest note:", error);
      alert("Failed to save note. Please try again.");
    }
  };

  const handleDeleteNote = async (dbId?: string) => {
    if (!dbId) return;
    try {
      await deleteNote.mutateAsync(dbId);
    } catch (error) {
      console.error("Failed to delete note:", error);
      alert("Failed to delete note. Please try again.");
    }
  };

  const handleDeleteFolder = async (ticker: string) => {
    try {
      await deleteTicker.mutateAsync(ticker);
      setUserSelectedTicker(null);
    } catch (error) {
      console.error("Failed to delete ticker:", error);
      alert("Failed to delete ticker. Please try again.");
    }
  };

  const handleAddTicker = async () => {
    const newTicker = tickerInput.trim().toUpperCase();
    if (!newTicker) return;
    try {
      await createTicker.mutateAsync(newTicker);
      setUserSelectedTicker(newTicker);
      setTickerInput("");
      setShowTickerInput(false);
    } catch (error) {
      console.error("Failed to add ticker:", error);
      alert("Failed to add ticker. Please try again.");
    }
  };

  const handleAddDoc = async (file: File) => {
    try {
      const result = await uploadDocument.mutateAsync(file);
      if (result?.chunksCreated === 0) {
        alert(
          `"${file.name}" was uploaded, but no searchable text was found. ` +
            `If it's a scanned PDF, it has no text layer to index for search.`,
        );
      }
    } catch (error) {
      console.error("Failed to upload document:", error);
      alert(error instanceof Error ? error.message : "Failed to upload document.");
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await deleteDocument.mutateAsync(id);
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Failed to delete document. Please try again.");
    }
  };

  const handleOpenDoc = async (id: string) => {
    try {
      const url = await api.getDocumentUrl(selected, id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Failed to open document:", error);
      alert("Could not open document.");
    }
  };

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
      <Header
        actions={
          <>
            <Link
              href="/analysis-room"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium border border-system text-system transition hover:bg-system/10"
            >
              Bull v. Bear Analysis
            </Link>
            <button
              onClick={() => signOut()}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </>
        }
      />

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
            onAddDoc={handleAddDoc}
            onDeleteDoc={handleDeleteDoc}
            onOpenDoc={handleOpenDoc}
            onEdit={(note) =>
              setEditor({
                open: true,
                mode: "edit",
                note: note as Note & { dbId?: string },
              })
            }
            onDelete={(id) => {
              const note = folder.notes.find((n) => n.id === id);
              handleDeleteNote((note as Note & { dbId?: string })?.dbId);
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
        onClose={() => !saveNote.isPending && setEditor({ open: false })}
        onSave={handleSaveAndIngest}
        isSaving={saveNote.isPending}
      />

      <TickerInputModal
        isOpen={showTickerInput}
        value={tickerInput}
        onValueChange={setTickerInput}
        onSubmit={handleAddTicker}
        onClose={() => !createTicker.isPending && setShowTickerInput(false)}
        isLoading={createTicker.isPending}
      />

      <Footer />
    </div>
  );
}
