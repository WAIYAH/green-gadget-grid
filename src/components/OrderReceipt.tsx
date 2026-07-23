import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, MapPin, Phone, Clock, Printer, Package, Mail, Globe, Leaf, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Tables"]["orders"]["Row"]["status"];

interface ReceiptData {
  id: string;
  created_at: string;
  quantity: number;
  total_amount: number;
  total_points: number;
  payment_method: string;
  status: OrderStatus;
  pickup_code: string | null;
  item_name: string;
  item_condition: string | null;
  centre_name: string | null;
  centre_address: string | null;
  centre_phone: string | null;
  centre_email: string | null;
  centre_website: string | null;
  centre_hours: string | null;
}

const statusLabel: Record<string, string> = {
  processing: "Processing",
  ready_for_pickup: "Ready for pickup",
  picked_up: "Picked up",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusColor: Record<string, string> = {
  processing: "bg-accent/15 text-accent border-accent/30",
  ready_for_pickup: "bg-primary/15 text-primary border-primary/30",
  picked_up: "bg-primary/15 text-primary border-primary/30",
  shipped: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  delivered: "bg-primary/15 text-primary border-primary/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

const OrderReceipt = ({ orderId, open, onClose }: { orderId: string | null; open: boolean; onClose: () => void }) => {
  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !orderId) return;
    let cancelled = false;
    setLoading(true);
    setData(null);
    supabase
      .from("orders")
      .select("id, created_at, quantity, total_amount, total_points, payment_method, status, pickup_code, swap_items(name, condition), pickup_centres(name, address, phone, email, website, hours)")
      .eq("id", orderId)
      .maybeSingle()
      .then(({ data: row, error }) => {
        if (cancelled) return;
        setLoading(false);
        if (error || !row) { toast.error(error?.message || "Receipt not found"); return; }
        setData({
          id: row.id,
          created_at: row.created_at,
          quantity: row.quantity,
          total_amount: Number(row.total_amount),
          total_points: row.total_points,
          payment_method: row.payment_method,
          status: row.status,
          pickup_code: row.pickup_code,
          item_name: row.swap_items?.name || "Item",
          item_condition: row.swap_items?.condition ?? null,
          centre_name: row.pickup_centres?.name ?? null,
          centre_address: row.pickup_centres?.address ?? null,
          centre_phone: row.pickup_centres?.phone ?? null,
          centre_email: row.pickup_centres?.email ?? null,
          centre_website: row.pickup_centres?.website ?? null,
          centre_hours: row.pickup_centres?.hours ?? null,
        });
      });
    return () => { cancelled = true; };
  }, [open, orderId]);

  const handleDownloadPdf = async () => {
    if (!receiptRef.current || !data) return;
    setDownloading(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas-pro"),
      ]);
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        ignoreElements: (el) => el.classList.contains("receipt-no-print"),
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`triple-g-receipt-${data.id.slice(0, 8).toLowerCase()}.pdf`);
      toast.success("Receipt downloaded");
    } catch {
      toast.error("Couldn't generate the PDF — try Print instead");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md glass-lg border-border/30 p-0 overflow-hidden print:shadow-none print:border-none">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .receipt-printable, .receipt-printable * { visibility: visible; }
            .receipt-printable { position: fixed; inset: 0; padding: 2rem; }
            .receipt-no-print { display: none !important; }
          }
        `}</style>

        {loading && (
          <div className="p-10 flex items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading receipt…
          </div>
        )}

        {data && (
          <div ref={receiptRef} className="receipt-printable bg-background">
            {/* Brand header */}
            <div className="px-6 pt-6 pb-4 flex items-center gap-2.5 border-b border-dashed border-border/50">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <Leaf className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground leading-tight">Triple G</p>
                <p className="text-[11px] text-muted-foreground leading-tight">Order Receipt</p>
              </div>
            </div>

            <DialogHeader className="px-6 pt-4 pb-0">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <DialogTitle>Thanks for swapping!</DialogTitle>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                #{data.id.slice(0, 8).toUpperCase()} &middot; {new Date(data.created_at).toLocaleString()}
              </p>
            </DialogHeader>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{data.item_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    Qty {data.quantity}{data.item_condition ? ` • ${data.item_condition}` : ""}
                  </p>
                </div>
                <Badge variant="outline" className={`capitalize flex-shrink-0 ${statusColor[data.status] || ""}`}>
                  {statusLabel[data.status] || data.status}
                </Badge>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-dashed border-border/50">
                <span className="text-sm text-muted-foreground">Paid with</span>
                <span className="font-semibold text-foreground">
                  {data.payment_method === "points"
                    ? `${data.total_points.toLocaleString()} pts`
                    : `$${data.total_amount.toFixed(2)}`}
                </span>
              </div>

              {data.centre_name && (
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">Collect from</p>
                  <p className="font-semibold text-foreground">{data.centre_name}</p>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
                      <span>{data.centre_address}</span>
                    </div>
                    {data.centre_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                        <span>{data.centre_phone}</span>
                      </div>
                    )}
                    {data.centre_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                        <span>{data.centre_email}</span>
                      </div>
                    )}
                    {data.centre_website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                        <a href={data.centre_website} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors truncate">
                          {data.centre_website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}
                    {data.centre_hours && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                        <span>{data.centre_hours}</span>
                      </div>
                    )}
                  </div>
                  {data.pickup_code && (
                    <div className="pt-2 mt-2 border-t border-primary/10">
                      <p className="text-xs text-muted-foreground mb-1">Show this code at the counter</p>
                      <p className="text-2xl font-bold tracking-[0.3em] text-primary font-mono">{data.pickup_code}</p>
                    </div>
                  )}
                </div>
              )}

              <p className="text-center text-xs text-muted-foreground pt-3 border-t border-dashed border-border/50">
                🌱 Thank you for swapping with Triple G — one gadget at a time, one planet saved.
              </p>

              <div className="flex gap-2 receipt-no-print">
                <Button onClick={handleDownloadPdf} disabled={downloading} className="flex-1 bg-gradient-primary text-primary-foreground">
                  {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  {downloading ? "Preparing…" : "Download PDF"}
                </Button>
                <Button onClick={() => window.print()} variant="outline" size="icon" className="border-border/30 flex-shrink-0" title="Print">
                  <Printer className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderReceipt;
