"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { useProvider } from "@/components/provider-context"

interface Props {
  apiKey: string
}

export function UsageSnippet({ apiKey }: Props) {
  const { provider } = useProvider()
  const snippets = provider.snippets

  const [tab, setTab] = React.useState<"curl" | "python" | "node">(() => {
    if (snippets?.curl) return "curl"
    if (snippets?.python) return "python"
    return "node"
  })
  const [copied, setCopied] = React.useState(false)

  if (!snippets || (!snippets.curl && !snippets.python && !snippets.node)) {
    return null
  }

  const available: Array<"curl" | "python" | "node"> = []
  if (snippets.curl) available.push("curl")
  if (snippets.python) available.push("python")
  if (snippets.node) available.push("node")

  const filled = (s?: string) => (s ? s.replaceAll("{KEY}", apiKey) : "")

  async function copy() {
    try {
      await navigator.clipboard.writeText(filled(snippets[tab]))
      setCopied(true)
      toast.success("Code kopiert")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Kopieren fehlgeschlagen")
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          So benutzt du den {provider.itemNoun}
        </p>
        <Button variant="ghost" size="sm" onClick={copy} className="h-7 text-xs">
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Kopiert" : "Code kopieren"}
        </Button>
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList
          className="grid w-full"
          style={{ gridTemplateColumns: `repeat(${available.length}, minmax(0, 1fr))` }}
        >
          {available.includes("curl") && <TabsTrigger value="curl">curl</TabsTrigger>}
          {available.includes("python") && <TabsTrigger value="python">Python</TabsTrigger>}
          {available.includes("node") && <TabsTrigger value="node">Node.js</TabsTrigger>}
        </TabsList>
        {available.includes("curl") && (
          <TabsContent value="curl" className="mt-2">
            <pre className="text-xs font-mono p-3 rounded-md bg-background border overflow-x-auto">
              <code>{filled(snippets.curl)}</code>
            </pre>
          </TabsContent>
        )}
        {available.includes("python") && (
          <TabsContent value="python" className="mt-2">
            <pre className="text-xs font-mono p-3 rounded-md bg-background border overflow-x-auto">
              <code>{filled(snippets.python)}</code>
            </pre>
          </TabsContent>
        )}
        {available.includes("node") && (
          <TabsContent value="node" className="mt-2">
            <pre className="text-xs font-mono p-3 rounded-md bg-background border overflow-x-auto">
              <code>{filled(snippets.node)}</code>
            </pre>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
