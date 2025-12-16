"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { DirectoryPage } from "@/components/directory-page";
import { EditMatchDialog } from "@/components/edit-match-dialog";
import { CreateMatchDialog } from "@/components/create-match-dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { formatDateTime } from "@/lib/utils";

type MatchItem = {
  id: string;
  date: string;
  tournament: string;
  winner: string;
  loser: string;
  rawId: Id<"matches">;
  rawDate: number;
  rawTournament?: Id<"tournaments">;
  rawWinner: Id<"users">;
  rawLoser: Id<"users">;
};

const columns: ColumnDef<MatchItem, unknown>[] = [
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "tournament",
    header: "Tournament",
  },
  {
    accessorKey: "winner",
    header: "Winner",
  },
  {
    accessorKey: "loser",
    header: "Loser",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      return (
        <div className="flex gap-2 justify-end">
          <EditMatchDialog
            match={{
              _id: row.original.rawId,
              date: row.original.rawDate,
              tournament: row.original.rawTournament,
              winner: row.original.rawWinner,
              loser: row.original.rawLoser,
            }}
          />
          <Link href={`/match/${row.original.id}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <Eye className="h-4 w-4" /> View
            </Button>
          </Link>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];

export default function MatchesPage() {
  const matches = useQuery(api.myFunctions.listMatches);
  const players = useQuery(api.myFunctions.listPlayers);
  const tournaments = useQuery(api.myFunctions.listTournaments);

  // Create a map of player IDs to names
  const playerMap = new Map(
    (players ?? []).map((p) => [p._id, p.name])
  );

  // Create a map of tournament IDs to names
  const tournamentMap = new Map(
    (tournaments ?? []).map((t) => [t._id, t.name])
  );

  const items: MatchItem[] = (matches ?? []).map((m) => ({
    id: m._id as unknown as string,
    rawId: m._id,
    rawDate: m.date,
    rawTournament: m.tournament,
    rawWinner: m.winner,
    rawLoser: m.loser,
    date: formatDateTime(m.date),
    tournament: m.tournament ? (tournamentMap.get(m.tournament) || "Unknown") : "-",
    winner: playerMap.get(m.winner) || "Unknown",
    loser: playerMap.get(m.loser) || "Unknown",
  }));

  return (
    <DirectoryPage
      title="Matches"
      description="Browse all matches."
      createButton={<CreateMatchDialog />}
      columns={columns}
      data={items}
      isLoading={matches === undefined || players === undefined || tournaments === undefined}
      loadingLabel="Loading matches…"
    />
  );
}
