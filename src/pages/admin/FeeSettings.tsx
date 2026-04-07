import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { getFees, saveFees, resetFees, DEFAULT_FEES, type FeeItem } from "@/lib/feeConfig";
import { IndianRupee, RotateCcw, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const FeeSettings = () => {
  const [fees, setFees] = useState<FeeItem[]>(getFees());
  const [dirty, setDirty] = useState(false);

  const update = (index: number, field: keyof FeeItem, value: string) => {
    setFees((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: value } : f))
    );
    setDirty(true);
  };

  const remove = (index: number) => {
    setFees((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  const addRow = () => {
    setFees((prev) => [...prev, { label: "", amount: "", editable: true }]);
    setDirty(true);
  };

  const handleSave = () => {
    const invalid = fees.some((f) => !f.label.trim());
    if (invalid) {
      toast.error("Fee name cannot be empty");
      return;
    }
    saveFees(fees);
    setDirty(false);
    toast.success("Fee settings saved");
  };

  const handleReset = () => {
    if (!confirm("Reset all fees to default values?")) return;
    resetFees();
    setFees(DEFAULT_FEES);
    setDirty(false);
    toast.success("Reset to defaults");
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Fee Settings</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              These amounts appear on the public Payments page
            </p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset defaults
          </button>
        </div>

        {/* Info banner */}
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">How it works</p>
          <p className="text-xs">
            Changes here update the payment type buttons on the public Payments page immediately.
            Leave <strong>Amount</strong> blank for "Other" type — residents enter a custom amount.
          </p>
        </div>

        {/* Fee table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Header — hidden on mobile */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_140px_36px] gap-0">
            <div className="px-4 py-2.5 bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fee Name</div>
            <div className="px-4 py-2.5 bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount (₹)</div>
            <div className="px-4 py-2.5 bg-secondary/50" />
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {fees.map((fee, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block sm:hidden">Fee Name</label>
                  <input
                    value={fee.label}
                    onChange={(e) => update(i, "label", e.target.value)}
                    placeholder="Fee name"
                    className="w-full px-2 py-1.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="sm:w-36">
                  <label className="text-xs text-muted-foreground mb-1 block sm:hidden">Amount (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="number"
                      min="0"
                      value={fee.amount}
                      onChange={(e) => update(i, "amount", e.target.value)}
                      placeholder="Custom"
                      className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div className="flex justify-end sm:justify-center sm:w-9">
                  <button
                    onClick={() => remove(i)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add row */}
        <button
          onClick={addRow}
          className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" /> Add fee type
        </button>

        {/* Save */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            variant="accent"
            disabled={!dirty}
            className="gap-2"
          >
            <Save className="w-4 h-4" /> Save Changes
          </Button>
          {dirty && (
            <span className="text-xs text-warning self-center">Unsaved changes</span>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default FeeSettings;
