"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "convex/react";

type PreviewData = {
  tournamentName: string;
  completedMatches: number;
  participants: {
    challongeUsername: string;
    existing: boolean;
    userId: Id<"users"> | null;
  }[];
  winnerId: Id<"users"> | null;
  winnerName: string | null;
  tournamentDate: number | null;
};

export function ImportChallongeDialog() {
  const currentUser = useQuery(api.myFunctions.getCurrentUser);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"input" | "preview" | "importing" | "complete">("input");
  const [tournamentId, setTournamentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedDate, setEditedDate] = useState("");
  const [importStats, setImportStats] = useState<{
    matchesImported: number;
    playersCreated: number;
    playersMatched: number;
  } | null>(null);

  const previewTournament = useAction(api.challongeImport.previewChallongeTournament);
  const importTournament = useAction(api.challongeImport.importTournamentFromChallonge);

  // Only show for judges
  if (currentUser === undefined || currentUser === null || !("role" in currentUser) || currentUser.role !== "judge") {
    return null;
  }

  const handleReset = () => {
    setStep("input");
    setTournamentId("");
    setError(null);
    setPreviewData(null);
    setEditedName("");
    setEditedDate("");
    setImportStats(null);
  };

  const handlePreview = async () => {
    setError(null);
    setStep("preview");

    // Extract tournament ID from URL if full URL provided
    let id = tournamentId.trim();
    if (id.includes("challonge.com/")) {
      const match = id.match(/challonge\.com\/([^/\?#]+)/);
      if (match) {
        id = match[1];
      }
    }

    try {
      const result = await previewTournament({ tournamentId: id });

      if (!result.success || !result.preview) {
        setError(result.error || "Failed to fetch tournament");
        setStep("input");
        return;
      }

      setPreviewData(result.preview);
      setEditedName(result.preview.tournamentName);
      setEditedDate(
        result.preview.tournamentDate
          ? new Date(result.preview.tournamentDate).toISOString().slice(0, 16)
          : ""
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStep("input");
    }
  };

  const handleImport = async () => {
    if (!editedDate || !previewData) {
      setError("Please fill in all required fields");
      return;
    }

    setStep("importing");
    setError(null);

    try {
      const result = await importTournament({
        tournamentId: tournamentId.includes("challonge.com/")
          ? tournamentId.match(/challonge\.com\/([^/\?#]+)/)?.[1] || tournamentId
          : tournamentId,
        tournamentName: editedName,
        tournamentDate: new Date(editedDate).getTime(),
      });

      if (!result.success) {
        setError(result.error || "Import failed");
        setStep("preview");
        return;
      }

      setImportStats(result.stats || null);
      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStep("preview");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={handleReset}>
          Import from Challonge
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        {step === "input" && (
          <>
            <DialogHeader>
              <DialogTitle>Import Tournament from Challonge</DialogTitle>
              <DialogDescription>
                Enter the Challonge tournament ID or URL to import tournament data.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tournamentId">Tournament ID or URL</Label>
                <Input
                  id="tournamentId"
                  placeholder="e.g., my_tournament or https://challonge.com/my_tournament"
                  value={tournamentId}
                  onChange={(e) => setTournamentId(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  You can paste the full Challonge URL or just the tournament ID
                </p>
              </div>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handlePreview} disabled={!tournamentId.trim()}>
                Preview Tournament
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "preview" && previewData && (
          <>
            <DialogHeader>
              <DialogTitle>Preview & Confirm Import</DialogTitle>
              <DialogDescription>
                Review the tournament data and make any necessary adjustments before importing.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Tournament Name</Label>
                <Input
                  id="name"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Tournament Date & Time</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={editedDate}
                  onChange={(e) => setEditedDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Tournament Winner</Label>
                <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center">
                  {previewData.winnerName || "Unknown"}
                </div>
              </div>
              <div className="rounded-lg border bg-muted p-4 space-y-2">
                <h3 className="font-semibold text-sm">Import Summary</h3>
                <ul className="text-sm space-y-1">
                  <li>Completed Matches: {previewData.completedMatches}</li>
                  <li>
                    Participants: {previewData.participants.length} (
                    {previewData.participants.filter((p) => p.existing).length} existing,{" "}
                    {previewData.participants.filter((p) => !p.existing).length} new)
                  </li>
                </ul>
              </div>
              <div className="rounded-lg border p-3 max-h-40 overflow-y-auto">
                <h4 className="font-semibold text-sm mb-2">Participants</h4>
                <ul className="text-sm space-y-1">
                  {previewData.participants.map((p, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          p.existing ? "bg-green-500" : "bg-blue-500"
                        }`}
                      />
                      {p.challongeUsername}{" "}
                      {p.existing ? "(existing)" : "(will be created)"}
                    </li>
                  ))}
                </ul>
              </div>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("input")}>
                Back
              </Button>
              <Button onClick={handleImport}>Import Tournament</Button>
            </DialogFooter>
          </>
        )}

        {step === "importing" && (
          <>
            <DialogHeader>
              <DialogTitle>Importing Tournament...</DialogTitle>
            </DialogHeader>
            <div className="py-8 flex items-center justify-center">
              <p className="text-muted-foreground">Please wait while we import the tournament data...</p>
            </div>
          </>
        )}

        {step === "complete" && importStats && (
          <>
            <DialogHeader>
              <DialogTitle>Import Complete!</DialogTitle>
              <DialogDescription>
                The tournament has been successfully imported.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="rounded-lg border bg-green-50 border-green-200 p-4 space-y-2">
                <h3 className="font-semibold text-green-900">Success</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>✓ Imported {importStats.matchesImported} matches</li>
                  <li>✓ Created {importStats.playersCreated} new players</li>
                  <li>✓ Matched {importStats.playersMatched} existing players</li>
                  <li>✓ ELO recalculation scheduled</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => {
                setOpen(false);
                handleReset();
              }}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
