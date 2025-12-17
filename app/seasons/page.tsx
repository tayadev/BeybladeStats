"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { DirectoryPage } from "@/components/directory-page";
import { EditSeasonDialog } from "@/components/edit-season-dialog";
import { CreateSeasonDialog } from "@/components/create-season-dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { formatDateTime } from "@/lib/utils";

type SeasonItem = {
  id: string;
  name: string;
  start: string;
  end: string;
  rawId: Id<"seasons">;
  rawStart: number;
  rawEnd: number;
};

const columns: ColumnDef<SeasonItem, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "start",
    header: "Start Date",
  },
  {
    accessorKey: "end",
    header: "End Date",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      return (
        <div className="flex gap-2 justify-end">
          <EditSeasonDialog
            season={{
              _id: row.original.rawId,
              name: row.original.name,
              start: row.original.rawStart,
              end: row.original.rawEnd,
            }}
          />
          <Link href={`/season/${row.original.id}`}>
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

export default function SeasonsPage() {
  const seasons = useQuery(api.myFunctions.listSeasons);

  const items: SeasonItem[] = (seasons ?? []).map((s: any) => ({
    id: s._id as unknown as string,
    rawId: s._id,
    rawStart: s.start,
    rawEnd: s.end,
    name: s.name,
    start: formatDateTime(s.start),
    end: formatDateTime(s.end),
  }));

  return (
    <DirectoryPage
      title="Seasons"
      description="Browse all seasons."
      createButton={<CreateSeasonDialog />}
      columns={columns}
      data={items}
      isLoading={seasons === undefined}
      loadingLabel="Loading seasons…"
    />
  );
}
