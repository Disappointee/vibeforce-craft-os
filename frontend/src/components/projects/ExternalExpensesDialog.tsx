'use client';

import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExternalExpensesDialogProps {
  projectId: string;
  expense?: {
    id: string;
    amount: number;
    description?: string;
    category?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const CATEGORIES = ['Freelancer', 'Lizenzen', 'Werbung', 'Hosting', 'Sonstiges'];

export function ExternalExpensesDialog({
  projectId,
  expense,
  open,
  onOpenChange,
  onSaved,
}: ExternalExpensesDialogProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Sonstiges');
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!expense;

  useEffect(() => {
    if (open) {
      if (expense) {
        setAmount(String(expense.amount));
        setDescription(expense.description || '');
        setCategory(expense.category || 'Sonstiges');
      } else {
        setAmount('');
        setDescription('');
        setCategory('Sonstiges');
      }
    }
  }, [open, expense]);

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Bitte einen gültigen Betrag eingeben');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && expense) {
        await pb.collection('external_expenses').update(expense.id, {
          amount: parsedAmount,
          description: description || undefined,
          category,
        });
        toast.success('Fremdkosten aktualisiert');
      } else {
        await pb.collection('external_expenses').create({
          project: projectId,
          amount: parsedAmount,
          description: description || undefined,
          category,
        });
        toast.success('Fremdkosten hinzugefügt');
      }
      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error('Failed to save external expense:', error);
      toast.error('Fehler beim Speichern der Fremdkosten');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus size={20} />
            {isEditing ? 'Fremdkosten bearbeiten' : 'Fremdkosten hinzufügen'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Betrag (€)</Label>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-card border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategorie</Label>
            <Select value={category} onValueChange={(v) => setCategory(v || 'Sonstiges')}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Kategorie wählen">
                  {(value: string) => value || 'Sonstiges'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Input
              id="description"
              placeholder="z.B. Freelancer Design, Adobe-Lizenz..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-card border-border"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Speichern...
              </>
            ) : (
              isEditing ? 'Aktualisieren' : 'Hinzufügen'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
