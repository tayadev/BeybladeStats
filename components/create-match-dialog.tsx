"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EntityDialog } from "@/components/ui/entity-dialog";
import type { Id } from "@/convex/_generated/dataModel";

export function CreateMatchDialog() {
  const currentUser = useQuery(api.myFunctions.getCurrentUser);
  const tournaments = useQuery(api.myFunctions.listTournaments);
  const players = useQuery(api.myFunctions.listPlayers);
  const createMatch = useMutation(api.myFunctions.createMatch);

  if (currentUser === undefined || currentUser?.role !== "judge") {
    return null;
  }

  const tournamentOptions = [{ label: "No Tournament", value: "none" }, ...(tournaments ?? []).map((t: any) => ({ label: t.name, value: String(t._id) }))];
  const playerOptions = (players ?? []).map((p: any) => ({ label: p.name, value: String(p._id) }));

  return (
    <EntityDialog
      mode="create"
      title="Create New Match"
      description="Record a new match result."
      trigger={
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Match
        </Button>
      }
      fields={[
        { id: "date", label: "Date & Time", type: "datetime-local", required: true },
        { id: "tournament", label: "Tournament (Optional)", type: "select", placeholder: "Select tournament (optional)...", options: tournamentOptions },
        { id: "winner", label: "Winner", type: "select", required: true, placeholder: "Select winner...", options: playerOptions },
        { id: "loser", label: "Loser", type: "select", required: true, placeholder: "Select loser...", options: playerOptions },
      ]}
      submitLabel="Create Match"
      onSubmit={async (vals) => {
        const date = new Date(String(vals.date)).getTime();
        const tournament = String(vals.tournament ?? "");
        const winner = String(vals.winner ?? "");
        const loser = String(vals.loser ?? "");
        if (!date || !winner || !loser || winner === loser) {
          return;
        }
        await createMatch({
          date,
          tournament: tournament && tournament !== "none" ? (tournament as Id<"tournaments">) : undefined,
          winner: winner as Id<"users">,
          loser: loser as Id<"users">,
        });
      }}
    />
  );
}
