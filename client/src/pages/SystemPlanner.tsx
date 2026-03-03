import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Capability = {
  id: string;
  area: string;
  name: string;
  status: "implemented" | "partial" | "missing";
  description: string;
  implementationNotes: string;
};

type Run = {
  runId: string;
  operation: string;
  status: string;
  createdAt: string;
  requiredCapabilities: string[];
  blockingCapabilities: string[];
};

function statusBadge(status: string) {
  if (status === "implemented" || status === "completed") {
    return <Badge className="bg-green-100 text-green-900 hover:bg-green-100">{status}</Badge>;
  }
  if (status === "partial" || status === "queued" || status === "running") {
    return <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">{status}</Badge>;
  }
  return <Badge className="bg-red-100 text-red-900 hover:bg-red-100">{status}</Badge>;
}

export default function SystemPlanner() {
  const { data: capResp } = useQuery<{ summary: Record<string, number>; capabilities: Capability[] }>({
    queryKey: ["/api/system/capabilities"],
  });

  const { data: runResp, refetch: refetchRuns } = useQuery<{ count: number; runs: Run[] }>({
    queryKey: ["/api/pipeline/runs"],
  });

  const caps = capResp?.capabilities || [];
  const summary = capResp?.summary || {};
  const runs = runResp?.runs || [];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Full App Build Planner</h1>
            <p className="text-sm text-slate-600">
              Capability matrix + planned pipeline contracts for colleague handoff.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetchRuns()}>Refresh Runs</Button>
            <Link href="/">
              <Button>Back To Portal</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="rounded border bg-white p-3">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-xl font-semibold">{summary.total || 0}</p>
          </div>
          <div className="rounded border bg-white p-3">
            <p className="text-xs text-slate-500">Implemented</p>
            <p className="text-xl font-semibold text-green-700">{summary.implemented || 0}</p>
          </div>
          <div className="rounded border bg-white p-3">
            <p className="text-xs text-slate-500">Partial</p>
            <p className="text-xl font-semibold text-amber-700">{summary.partial || 0}</p>
          </div>
          <div className="rounded border bg-white p-3">
            <p className="text-xs text-slate-500">Missing</p>
            <p className="text-xl font-semibold text-red-700">{summary.missing || 0}</p>
          </div>
          <div className="rounded border bg-white p-3">
            <p className="text-xs text-slate-500">Required For Full App</p>
            <p className="text-xl font-semibold">{summary.requiredForFullApp || 0}</p>
          </div>
        </div>

        <div className="rounded border bg-white">
          <div className="border-b p-3 font-semibold">Capability Matrix</div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="px-3 py-2">Area</th>
                  <th className="px-3 py-2">Capability</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {caps.map((c) => (
                  <tr key={c.id} className="border-t align-top">
                    <td className="px-3 py-2 text-slate-600">{c.area}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.description}</div>
                    </td>
                    <td className="px-3 py-2">{statusBadge(c.status)}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{c.implementationNotes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded border bg-white">
          <div className="border-b p-3 font-semibold">Pipeline Run Stubs</div>
          <div className="max-h-[280px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="px-3 py-2">Run ID</th>
                  <th className="px-3 py-2">Operation</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Blocking Capabilities</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {runs.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-slate-500" colSpan={5}>
                      No pipeline runs yet. Trigger any `/api/pipeline/*` endpoint to create one.
                    </td>
                  </tr>
                ) : (
                  runs.map((r) => (
                    <tr key={r.runId} className="border-t align-top">
                      <td className="px-3 py-2 font-mono text-xs">{r.runId}</td>
                      <td className="px-3 py-2">{r.operation}</td>
                      <td className="px-3 py-2">{statusBadge(r.status)}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {r.blockingCapabilities.length > 0
                          ? r.blockingCapabilities.join(", ")
                          : "None"}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">{r.createdAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
