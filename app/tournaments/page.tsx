"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { DirectoryPage } from "@/components/directory-page";
import { EditTournamentDialog } from "@/components/edit-tournament-dialog";
import { CreateTournamentDialog } from "@/components/create-tournament-dialog";
import { ImportChallongeDialog } from "@/components/import-challonge-dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { formatDateTime } from "@/lib/utils";

type TournamentItem = {
  id: string;
  name: string;
  date: string;
  rawId: Id<"tournaments">;
  rawDate: number;
  rawWinnerId: Id<"users">;
};

const columns: ColumnDef<TournamentItem, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      return (
        <div className="flex gap-2 justify-end">
          <EditTournamentDialog
            tournament={{
              _id: row.original.rawId,
              name: row.original.name,
              date: row.original.rawDate,
              winner: row.original.rawWinnerId,
            }}
          />
          <Link href={`/tournament/${row.original.id}`}>
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

export default function TournamentsPage() {
  const tournaments = useQuery(api.myFunctions.listTournaments);

  const items: TournamentItem[] = (tournaments ?? []).map((t) => ({
    id: t._id as unknown as string,
    rawId: t._id,
    rawDate: t.date,
    rawWinnerId: t.winner,
    name: t.name,
    date: formatDateTime(t.date),
  }));

  return (
    <DirectoryPage
      title="Tournaments"
      description="Browse all tournaments."
      createButton={
        <div className="flex gap-2">
          <CreateTournamentDialog />
          <ImportChallongeDialog />
        </div>
      }
      columns={columns}
      data={items}
      isLoading={tournaments === undefined}
      loadingLabel="Loading tournaments…"
    />
  );
}
