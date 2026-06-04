"use client";

import { useMemo, useState } from "react";
import { useTradingNotes, type Note } from "@/lib/mock_notes";
import { NoteEditorModal } from "@/components/NoteEditorModal";
import { useProtected } from "@/lib/use-protected";
import { Header } from "@/components/dashboard/Header";
import { FolderSidebar } from "@/components/dashboard/FolderSidebar";
import { FolderView } from "@/components/dashboard/FolderView";
import { TickerInputModal } from "@/components/dashboard/TickerInputModal";
import { EmptyState } from "@/components/dashboard/EmptyState";

export default function TradingNotesPage() {
  const { folders, addNote, updateNote, deleteNote, deleteFolder, addFolder } =
    useTradingNotes();
  const { isLoading, isAuthenticated } = useProtected();

  const [selected, setSelected] = useState<string>(
    folders[0]?.ticker ?? "NVDA",
  );
  const [editor, setEditor] = useState<
    | { open: false }
    | { open: true; mode: "add" }
    | { open: true; mode: "edit"; note: Note }
  >({ open: false });
  const [showTickerInput, setShowTickerInput] = useState(false);
  const [tickerInput, setTickerInput] = useState("");

  const folder = useMemo(
    () => folders.find((f) => f.ticker === selected) ?? folders[0],
    [folders, selected],
  );

  const handleSaveAndIngest = async (body: string) => {
    if (!folder) return;

    // Save locally first
    if (editor.open && editor.mode === "edit") {
      updateNote(folder.ticker, editor.note.id, body);
    } else {
      addNote(folder.ticker, body);
    }

    // Then ingest to database for search
    try {
      await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: body,
          ticker: folder.ticker,
          metadata: {
            timestamp: new Date().toISOString(),
            mode: editor.open && editor.mode === "edit" ? "edit" : "add",
          },
        }),
      });
    } catch (error) {
      console.error("Failed to ingest note:", error);
    } finally {
      setEditor({ open: false });
    }
  };

  const handleDeleteFolder = (ticker: string) => {
    deleteFolder(ticker);
    const remaining = folders.filter((f) => f.ticker !== ticker);
    if (remaining.length > 0) {
      setSelected(remaining[0].ticker);
    } else {
      setSelected("");
    }
  };

  const handleAddTicker = () => {
    const newTicker = tickerInput.trim().toUpperCase();
    if (!newTicker) return;

    addFolder(newTicker);
    setSelected(newTicker);
    setTickerInput("");
    setShowTickerInput(false);
  };

  if (isLoading) {
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
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[320px_1fr]">
        <FolderSidebar
          folders={folders}
          selected={selected}
          onSelect={setSelected}
          onAddTicker={() => setShowTickerInput(true)}
        />

        {folders.length === 0 ? (
          <EmptyState onAddTicker={() => setShowTickerInput(true)} />
        ) : folder ? (
          <FolderView
            folder={folder}
            onAdd={() => setEditor({ open: true, mode: "add" })}
            onEdit={(note) => setEditor({ open: true, mode: "edit", note })}
            onDelete={(id) => deleteNote(folder.ticker, id)}
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
        onClose={() => setEditor({ open: false })}
        onSave={handleSaveAndIngest}
      />

      <TickerInputModal
        isOpen={showTickerInput}
        value={tickerInput}
        onValueChange={setTickerInput}
        onSubmit={handleAddTicker}
        onClose={() => setShowTickerInput(false)}
      />
    </div>
  );
}
