"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { EntityDialog } from "@/components/ui/entity-dialog";
import type { Id } from "@/convex/_generated/dataModel";

interface EditTournamentDialogProps {
  tournament: {
    _id: Id<"tournaments">;
    name: string;
    date: number;
    winner: Id<"users">;
  };
  onTournamentUpdated?: () => void;
}

export function EditTournamentDialog({ tournament, onTournamentUpdated }: EditTournamentDialogProps) {
  const currentUser = useQuery(api.myFunctions.getCurrentUser);
  const players = useQuery(api.myFunctions.listPlayers);
  const updateTournament = useMutation(api.myFunctions.updateTournament);
  const deleteTournament = useMutation(api.myFunctions.deleteTournament);

  if (currentUser === undefined || currentUser?.role !== "judge") {
    return null;
  }

  const winnerItems = (players ?? []).map((p: any) => ({ label: p.name, value: String(p._id) }));
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
        title="Edit Tournament"
        description="Update this tournament."
        trigger={
          <Button variant="ghost" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
          </Button>
        }
        fields={[
          { id: "name", label: "Tournament Name", type: "text", required: true },
          { id: "date", label: "Date & Time", type: "datetime-local", required: true },
          { id: "winner", label: "Winner", type: "select", required: true, options: winnerItems, placeholder: "Select winner..." },
        ]}
        initialValues={{
          name: tournament.name,
          date: toLocalInputValue(tournament.date),
          winner: String(tournament.winner),
        }}
        submitLabel="Save Changes"
        onSubmit={async (vals) => {
          const name = String(vals.name ?? "").trim();
          const date = new Date(String(vals.date)).getTime();
          const winner = String(vals.winner ?? "");
          if (!name || !date || !winner) return;
          await updateTournament({ id: tournament._id, name, date, winner: winner as Id<"users"> });
          onTournamentUpdated?.();
        }}
      />
      <Button
        type="button"
        variant="destructive"
        onClick={async () => {
          if (!confirm("Are you sure you want to delete this tournament?")) return;
          await deleteTournament({ id: tournament._id });
          onTournamentUpdated?.();
        }}
        className="gap-2"
        size="sm"
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
}
