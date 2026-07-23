"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AnularDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = React.useState("");

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setMotivo(""); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Anular atención</DialogTitle>
          <DialogDescription>
            La atención quedará anulada (no se elimina) y dejará de sumar en caja. Sus pagos también se anulan.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label className="mb-1.5 block">Motivo de anulación</Label>
          <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} placeholder="Indica el motivo…" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={() => {
              if (motivo.trim().length < 3) return toast.error("Indica un motivo");
              onConfirm(motivo.trim());
              setMotivo("");
            }}
          >
            Anular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
