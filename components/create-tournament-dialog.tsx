"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Combobox, type ComboboxItem } from "@/components/combobox";
import { EntityDialog } from "@/components/ui/entity-dialog";
import type { Id } from "@/convex/_generated/dataModel";

export function CreateTournamentDialog() {
  const currentUser = useQuery(api.myFunctions.getCurrentUser);
  const players = useQuery(api.myFunctions.listPlayers);
  const createTournament = useMutation(api.myFunctions.createTournament);

  if (currentUser === undefined || currentUser?.role !== "judge") {
    return null;
  }

  const winnerItems: ComboboxItem[] = (players ?? []).map((p: any) => ({ value: p._id, label: p.name }));

  return (
    <EntityDialog
      mode="create"
      title="Create New Tournament"
      description="Add a new tournament to the system."
      trigger={
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Tournament
        </Button>
      }
      fields={[
        { id: "name", label: "Tournament Name", type: "text", placeholder: "e.g., Spring Championship", required: true },
        { id: "date", label: "Date & Time", type: "datetime-local", required: true },
        { id: "winner", label: "Winner", type: "select", required: true, placeholder: "Select winner...", options: winnerItems.map(w => ({ label: w.label, value: String(w.value) })) },
      ]}
      submitLabel="Create Tournament"
      onSubmit={async (vals) => {
        const name = String(vals.name ?? "").trim();
        const date = new Date(String(vals.date)).getTime();
        const winner = String(vals.winner ?? "");
        if (!name || !date || !winner) return;
        await createTournament({ name, date, winner: winner as Id<"users"> });
      }}
    />
  );
}
