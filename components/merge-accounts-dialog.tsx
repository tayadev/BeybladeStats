"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
import { Combobox } from "@/components/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Users, ArrowRight, AlertTriangle, Check, Loader2 } from "lucide-react";

type Step = "select" | "preview" | "confirm" | "processing" | "complete";

interface PreviewData {
  source: {
    _id: Id<"users">;
    name: string;
    role: "player" | "judge";
  };
  target: {
    _id: Id<"users">;
    name: string;
    role: "player" | "judge";
    hasAccount: boolean;
  };
  counts: {
    matchesAsWinner: number;
    matchesAsLoser: number;
    tournamentWins: number;
    eloSnapshots: number;
  };
  affectedSeasonIds: Id<"seasons">[];
}

export function MergeAccountsDialog() {
  const currentUser = useQuery(api.myFunctions.getCurrentUser);
  const players = useQuery(api.myFunctions.listPlayers);
  const getMergePreview = useMutation(api.myFunctions.getMergePreview);
  const mergeAccounts = useMutation(api.myFunctions.mergeUserAccounts);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("select");
  const [sourceUserId, setSourceUserId] = useState<string>("");
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [previewError, setPreviewError] = useState<string>("");
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [mergeResult, setMergeResult] = useState<{ success: boolean; message: string } | null>(null);

  // Reset state when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset all state when dialog closes
      setTimeout(() => {
        setStep("select");
        setSourceUserId("");
        setTargetUserId("");
        setPreviewData(null);
        setPreviewError("");
        setConfirmChecked(false);
        setMergeResult(null);
      }, 300);
    }
  };

  // Only show for judges
  if (currentUser === undefined || currentUser?.role !== "judge") {
    return null;
  }

  if (!players) {
    return null;
  }

  // Filter players for source (non-claimed only)
  const nonClaimedPlayers = players.filter((p: any) => !p.hasAccount);

  // Filter players for target (all except selected source)
  const targetPlayers = players.filter((p: any) => p._id !== sourceUserId);

  const handlePreview = async () => {
    if (!sourceUserId || !targetUserId) return;

    setPreviewError("");
    setStep("processing");

    try {
      const preview = await getMergePreview({
        sourceUserId: sourceUserId as Id<"users">,
        targetUserId: targetUserId as Id<"users">,
      });
      setPreviewData(preview);
      setStep("preview");
    } catch (error: any) {
      setPreviewError(error.message || "Failed to get merge preview");
      setStep("select");
    }
  };

  const handleMerge = async () => {
    if (!sourceUserId || !targetUserId) return;

    setStep("processing");

    try {
      const result = await mergeAccounts({
        sourceUserId: sourceUserId as Id<"users">,
        targetUserId: targetUserId as Id<"users">,
      });
      setMergeResult({
        success: result.success,
        message: result.message,
      });
      setStep("complete");
    } catch (error: any) {
      setPreviewError(error.message || "Failed to merge accounts");
      setStep("confirm");
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case "select":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Merge User Accounts</DialogTitle>
              <DialogDescription>
                Merge a non-claimed account into another account. All matches, tournaments, and ELO data will be transferred.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Source Account (Non-Claimed)</Label>
                <Combobox
                  items={nonClaimedPlayers.map((p: any) => ({
                    value: p._id,
                    label: p.name,
                  }))}
                  value={sourceUserId}
                  onValueChange={setSourceUserId}
                  placeholder="Select source account..."
                  searchPlaceholder="Search players..."
                  emptyText="No non-claimed accounts found."
                />
                <p className="text-sm text-muted-foreground">
                  Only non-claimed accounts (without login credentials) can be merged.
                </p>
              </div>

              <div className="flex items-center justify-center py-2">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <Label>Target Account</Label>
                <Combobox
                  items={targetPlayers.map((p: any) => ({
                    value: p._id,
                    label: `${p.name}${p.hasAccount ? " (Claimed)" : " (Non-Claimed)"}`,
                  }))}
                  value={targetUserId}
                  onValueChange={setTargetUserId}
                  placeholder="Select target account..."
                  searchPlaceholder="Search players..."
                  emptyText="No players found."
                  disabled={!sourceUserId}
                />
                <p className="text-sm text-muted-foreground">
                  All data from the source account will be transferred to this account.
                </p>
              </div>

              {previewError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>{previewError}</div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handlePreview}
                disabled={!sourceUserId || !targetUserId}
              >
                Preview Merge
              </Button>
            </DialogFooter>
          </>
        );

      case "preview":
        if (!previewData) return null;

        const totalMatches = previewData.counts.matchesAsWinner + previewData.counts.matchesAsLoser;

        return (
          <>
            <DialogHeader>
              <DialogTitle>Merge Preview</DialogTitle>
              <DialogDescription>
                Review what will be transferred from {previewData.source.name} to {previewData.target.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex-1">
                  <p className="font-medium">{previewData.source.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {previewData.source.role} • Non-Claimed
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground mx-4" />
                <div className="flex-1 text-right">
                  <p className="font-medium">{previewData.target.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {previewData.target.role} • {previewData.target.hasAccount ? "Claimed" : "Non-Claimed"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <h4 className="font-medium">Data to Transfer</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total matches:</span>
                    <span className="font-medium">{totalMatches}</span>
                  </div>
                  <div className="flex justify-between pl-4">
                    <span className="text-muted-foreground">As winner:</span>
                    <span>{previewData.counts.matchesAsWinner}</span>
                  </div>
                  <div className="flex justify-between pl-4">
                    <span className="text-muted-foreground">As loser:</span>
                    <span>{previewData.counts.matchesAsLoser}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tournament wins:</span>
                    <span className="font-medium">{previewData.counts.tournamentWins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ELO snapshots:</span>
                    <span className="font-medium">{previewData.counts.eloSnapshots}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seasons affected:</span>
                    <span className="font-medium">{previewData.affectedSeasonIds.length}</span>
                  </div>
                </div>
              </div>

              {previewData.affectedSeasonIds.length > 0 && (
                <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-3 text-sm">
                  <p className="text-blue-900 dark:text-blue-100">
                    ELO ratings will be recalculated for {previewData.affectedSeasonIds.length} season(s) after the merge.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setStep("select");
                  setPreviewData(null);
                }}
              >
                Back
              </Button>
              <Button onClick={() => setStep("confirm")}>
                Continue to Confirm
              </Button>
            </DialogFooter>
          </>
        );

      case "confirm":
        if (!previewData) return null;

        return (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Merge</DialogTitle>
              <DialogDescription>
                This action cannot be undone. Please confirm you want to proceed.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-md bg-yellow-50 dark:bg-yellow-950 p-4">
                <div className="flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium text-yellow-900 dark:text-yellow-100">
                      Warning: This action is permanent
                    </p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      All data from <strong>{previewData.source.name}</strong> will be transferred to{" "}
                      <strong>{previewData.target.name}</strong>, and the source account will be deleted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirm"
                  checked={confirmChecked}
                  onCheckedChange={(checked) => setConfirmChecked(checked === true)}
                />
                <Label
                  htmlFor="confirm"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I understand this will permanently merge these accounts
                </Label>
              </div>

              {previewError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>{previewError}</div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setStep("preview");
                  setConfirmChecked(false);
                  setPreviewError("");
                }}
              >
                Back
              </Button>
              <Button
                onClick={handleMerge}
                disabled={!confirmChecked}
                variant="destructive"
              >
                Confirm Merge
              </Button>
            </DialogFooter>
          </>
        );

      case "processing":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Processing...</DialogTitle>
              <DialogDescription>
                Merging accounts and updating data. Please wait...
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </>
        );

      case "complete":
        if (!mergeResult) return null;

        return (
          <>
            <DialogHeader>
              <DialogTitle>Merge Complete</DialogTitle>
              <DialogDescription>
                The accounts have been successfully merged.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-md bg-green-50 dark:bg-green-950 p-4">
                <div className="flex gap-2">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Success
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                      {mergeResult.message}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-3 text-sm">
                <p className="text-blue-900 dark:text-blue-100">
                  ELO ratings are being recalculated in the background. This may take a few moments to complete.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Users className="h-4 w-4" />
          Merge Accounts
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}
