"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { DirectoryPage } from "@/components/directory-page";
import { CreatePlayerDialog } from "@/components/create-player-dialog";
import { MergeAccountsDialog } from "@/components/merge-accounts-dialog";
import { PromoteToJudgeDialog } from "@/components/promote-to-judge-dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { formatDate } from "@/lib/utils";

type PlayerItem = {
  id: Id<"users">;
  name: string;
  role: "player" | "judge";
  created: string;
  hasAccount: boolean;
};

const baseColumns: ColumnDef<PlayerItem, any>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "hasAccount",
    header: "Account",
    cell: ({ row }) => (
      <span
        className={`text-xs font-semibold px-2 py-1 rounded-full ${
          row.original.hasAccount
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-200 text-slate-700"
        }`}
      >
        {row.original.hasAccount ? "Linked" : "None"}
      </span>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue("role")}</span>
    ),
  },
  {
    accessorKey: "created",
    header: "Joined",
  },
];

export default function PlayersDirectoryPage() {
  const players = useQuery(api.myFunctions.listPlayers);
  const currentUser = useQuery(api.myFunctions.getCurrentUser);

  const items: PlayerItem[] = (players ?? []).map((p: any) => ({
    id: p._id,
    name: p.name,
    role: p.role,
    created: formatDate(p._creationTime),
    hasAccount: p.hasAccount,
  }));

  // Create columns with access to currentUser for conditional rendering
  const columnsWithActions: ColumnDef<PlayerItem, any>[] = [
    ...baseColumns,
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          {currentUser?.role === "judge" && row.original.role === "player" && (
            <PromoteToJudgeDialog
              playerId={row.original.id}
              playerName={row.original.name}
            />
          )}
          <Link href={`/player/${row.original.id}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <Eye className="h-4 w-4" /> View
            </Button>
          </Link>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  return (
    <DirectoryPage
      title="Players"
      description="Browse all registered players."
      createButton={
        <div className="flex gap-2">
          <CreatePlayerDialog />
          <MergeAccountsDialog />
        </div>
      }
      columns={columnsWithActions}
      data={items}
      isLoading={players === undefined}
      loadingLabel="Loading players…"
    />
  );
}
