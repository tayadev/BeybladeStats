"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { EntityDialog } from "@/components/ui/entity-dialog";
import type { Id } from "@/convex/_generated/dataModel";

interface EditMatchDialogProps {
  match: {
    _id: Id<"matches">;
    date: number;
    tournament?: Id<"tournaments">;
    winner: Id<"users">;
    loser: Id<"users">;
  };
  onMatchUpdated?: () => void;
}

export function EditMatchDialog({ match, onMatchUpdated }: EditMatchDialogProps) {
  const currentUser = useQuery(api.myFunctions.getCurrentUser);
  const tournaments = useQuery(api.myFunctions.listTournaments);
  const players = useQuery(api.myFunctions.listPlayers);
  const updateMatch = useMutation(api.myFunctions.updateMatch);
  const deleteMatch = useMutation(api.myFunctions.deleteMatch);

  if (currentUser === undefined || currentUser?.role !== "judge") {
    return null;
  }

  const tournamentOptions = [{ label: "No Tournament", value: "none" }, ...(tournaments ?? []).map((t: any) => ({ label: t.name, value: String(t._id) }))];
  const playerOptions = (players ?? []).map((p: any) => ({ label: p.name, value: String(p._id) }));

  const toLocalInputValue = (ms: number) => {
    const d = new Date(ms);
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  return (
    <div className="flex items-center gap-2">
      <EntityDialog
        mode="edit"
        title="Edit Match"
        description="Update this match."
        trigger={
          <Button variant="ghost" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
          </Button>
        }
        fields={[
          { id: "date", label: "Date & Time", type: "datetime-local", required: true },
          { id: "tournament", label: "Tournament (Optional)", type: "select", placeholder: "Select tournament (optional)...", options: tournamentOptions },
          { id: "winner", label: "Winner", type: "select", required: true, placeholder: "Select winner...", options: playerOptions },
          { id: "loser", label: "Loser", type: "select", required: true, placeholder: "Select loser...", options: playerOptions },
        ]}
        initialValues={{
          date: toLocalInputValue(match.date),
          tournament: String(match.tournament ?? "none"),
          winner: String(match.winner),
          loser: String(match.loser),
        }}
        submitLabel="Save Changes"
        onSubmit={async (vals) => {
          const date = new Date(String(vals.date)).getTime();
          const tournament = String(vals.tournament ?? "");
          const winner = String(vals.winner ?? "");
          const loser = String(vals.loser ?? "");
          if (!date || !winner || !loser || winner === loser) return;
          await updateMatch({
            id: match._id,
            date,
            tournament: tournament && tournament !== "none" ? (tournament as Id<"tournaments">) : undefined,
            winner: winner as Id<"users">,
            loser: loser as Id<"users">,
          });
          onMatchUpdated?.();
        }}
      />
      <Button
        type="button"
        variant="destructive"
        onClick={async () => {
          if (!confirm("Are you sure you want to delete this match?")) return;
          await deleteMatch({ id: match._id });
          onMatchUpdated?.();
        }}
        className="gap-2"
        size="sm"
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
}
