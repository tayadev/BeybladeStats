"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
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
import { ShieldCheck, AlertTriangle } from "lucide-react";

interface PromoteToJudgeDialogProps {
  playerId: Id<"users">;
  playerName: string;
}

export function PromoteToJudgeDialog({ playerId, playerName }: PromoteToJudgeDialogProps) {
  const promoteToJudge = useMutation(api.myFunctions.promoteToJudge);
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");

  const handlePromote = async () => {
    setIsProcessing(true);
    setError("");

    try {
      await promoteToJudge({ playerId });
      setOpen(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to promote player";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when dialog closes
      setError("");
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <ShieldCheck className="h-4 w-4" />
          Promote
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Promote to Judge</DialogTitle>
          <DialogDescription>
            Promote <strong>{playerName}</strong> to judge role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-4">
            <div className="flex gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Judge Permissions
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Judges can create and manage players, seasons, tournaments, and matches.
                  This action will grant <strong>{playerName}</strong> all judge permissions.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <div className="flex gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>{error}</div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePromote}
            disabled={isProcessing}
          >
            {isProcessing ? "Promoting..." : "Confirm Promotion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
