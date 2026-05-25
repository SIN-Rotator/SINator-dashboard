"use client"

import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowUpDown, Copy, CheckCheck, Trash2, Search } from "lucide-react"
import { toast } from "sonner"
import { deleteKey, markKeyUsed, revealKey, type PoolKey } from "@/lib/api"
import { useProvider } from "@/components/provider-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type SortKey = "id" | "alias_email" | "key_name" | "status" | "created_at"
type Filter = "all" | "available" | "used" | "suspended"

interface Props {
  keys: PoolKey[]
  onMutate: () => void
}

function getStatus(k: PoolKey): "available" | "used" | "suspended" {
  if (k.used) return "used"
  if (k.suspended) return "suspended"
  return "available"
}

function StatusBadge({ status }: { status: "available" | "used" | "suspended" }) {
  if (status === "available")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 border-emerald-500/30">
        <span className="size-1.5 rounded-full bg-emerald-500 mr-1.5" />
        verfügbar
      </Badge>
    )
  if (status === "suspended")
    return (
      <Badge variant="destructive">
        <span className="size-1.5 rounded-full bg-current mr-1.5 opacity-80" />
        gesperrt
      </Badge>
    )
  return (
    <Badge variant="secondary">
      <span className="size-1.5 rounded-full bg-muted-foreground mr-1.5" />
      verbraucht
    </Badge>
  )
}

export function KeyTable({ keys, onMutate }: Props) {
  const { provider } = useProvider()
  const noun = provider.itemNoun
  const nounPlural = provider.itemNounPlural
  const [sortKey, setSortKey] = React.useState<SortKey>("created_at")
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc")
  const [filter, setFilter] = React.useState<Filter>("all")
  const [search, setSearch] = React.useState("")
  const [pendingDelete, setPendingDelete] = React.useState<PoolKey | null>(null)
  const [busy, setBusy] = React.useState<string | null>(null)

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(k)
      setSortDir("asc")
    }
  }

  const filtered = React.useMemo(() => {
    let out = [...keys]
    if (filter !== "all") {
      out = out.filter((k) => getStatus(k) === filter)
    }
    if (search.trim()) {
      const s = search.toLowerCase()
      out = out.filter(
        (k) =>
          k.id.toLowerCase().includes(s) ||
          k.alias_email.toLowerCase().includes(s) ||
          k.key_name.toLowerCase().includes(s),
      )
    }
    out.sort((a, b) => {
      let av: string | number = ""
      let bv: string | number = ""
      if (sortKey === "status") {
        av = getStatus(a)
        bv = getStatus(b)
      } else {
        av = (a[sortKey] ?? "") as string
        bv = (b[sortKey] ?? "") as string
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })
    return out
  }, [keys, filter, search, sortKey, sortDir])

  async function copyKey(k: PoolKey) {
    setBusy(k.id)
    try {
      const result = await revealKey(provider.backendUrl, provider.apiPrefix, k.id)
      const value = result.api_key
      if (value) {
        if ("__TAURI_INTERNALS__" in window) {
          const { writeText } = await import("@tauri-apps/plugin-clipboard-manager")
          await writeText(value)
        } else {
          await navigator.clipboard.writeText(value)
        }
        toast.success(`${noun} kopiert`, { description: k.key_name })
      } else {
        toast.error(`${noun} nicht verfügbar`)
      }
    } catch (e) {
      toast.error("Kopieren fehlgeschlagen", { description: (e as Error).message })
    } finally {
      setBusy(null)
    }
  }

  async function onMarkUsed(k: PoolKey) {
    setBusy(k.id)
    try {
      await markKeyUsed(provider.backendUrl, provider.apiPrefix, k.id)
      toast.success("Als verbraucht markiert", { description: k.key_name })
      onMutate()
    } catch (e) {
      toast.error("Fehler", { description: (e as Error).message })
    } finally {
      setBusy(null)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    const k = pendingDelete
    setPendingDelete(null)
    setBusy(k.id)
    try {
      await deleteKey(provider.backendUrl, provider.apiPrefix, k.id)
      toast.success(`${noun} gelöscht`, { description: k.key_name })
      onMutate()
    } catch (e) {
      toast.error("Löschen fehlgeschlagen", { description: (e as Error).message })
    } finally {
      setBusy(null)
    }
  }

  const SortBtn = ({ label, k }: { label: string; k: SortKey }) => (
    <button
      onClick={() => toggleSort(k)}
      className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown className={`size-3 ${sortKey === k ? "opacity-100" : "opacity-40"}`} />
    </button>
  )

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={`Suchen nach ID, Email oder ${noun.toLowerCase()}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="available">Verfügbar</SelectItem>
            <SelectItem value="used">Verbraucht</SelectItem>
            <SelectItem value="suspended">Gesperrt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortBtn label="ID" k="id" />
              </TableHead>
              <TableHead>
                <SortBtn label="Email" k="alias_email" />
              </TableHead>
              <TableHead>
                <SortBtn label={noun} k="key_name" />
              </TableHead>
              <TableHead>
                <SortBtn label="Status" k="status" />
              </TableHead>
              <TableHead>
                <SortBtn label="Erstellt" k="created_at" />
              </TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Keine {nounPlural.toLowerCase()} gefunden.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {k.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{k.alias_email}</TableCell>
                  <TableCell className="font-medium">{k.key_name}</TableCell>
                  <TableCell>
                    <StatusBadge status={getStatus(k)} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {k.created_at ? new Date(k.created_at).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => copyKey(k)}
                        title={`${noun} kopieren`}
                      >
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        disabled={busy === k.id || k.used}
                        onClick={() => onMarkUsed(k)}
                        title="Als verbraucht markieren"
                      >
                        <CheckCheck className="size-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        disabled={busy === k.id}
                        onClick={() => setPendingDelete(k)}
                        title="Löschen"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Diesen {noun.toLowerCase()} löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.key_name} ({pendingDelete?.alias_email}) wird permanent aus dem Pool entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
