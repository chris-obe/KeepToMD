
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Trash2 } from 'lucide-react';
import { usePresets } from '@/hooks/use-presets';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export function PresetManager({
  children,
}: {
  children?: React.ReactNode;
}) {
  const { presets, selectedPreset, handleSelectPreset, handleSavePreset, handleDeletePreset } = usePresets();
  const [presetName, setPresetName] = useState('');
  const { toast } = useToast();

  const onSave = () => {
    if (!presetName) {
      toast({ variant: 'destructive', title: 'Preset name cannot be empty.' });
      return;
    }
    handleSavePreset(presetName);
    toast({ title: 'Preset Saved', description: `Preset "${presetName}" has been saved.` });
    setPresetName('');
  };

  const onDelete = (name: string) => {
    handleDeletePreset(name);
    toast({ title: 'Preset Deleted', description: `Preset "${name}" has been deleted.` });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Presets</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preset-name-save">Save Current Settings as Preset</Label>
            <div className="flex gap-2">
              <Input
                id="preset-name-save"
                placeholder="My Awesome Preset"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
              <Button onClick={onSave}><Save className="mr-2 h-4 w-4" /> Save</Button>
            </div>
          </div>
        </div>

        <ScrollArea className="h-80 w-full pr-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold mt-4">Saved Presets</h3>
            {presets.length > 0 ? (
              presets.map((preset) => (
                <div key={preset.name} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                  <button 
                    className="flex-grow text-left"
                    onClick={() => handleSelectPreset(preset.name)}
                  >
                    <p className={`font-semibold ${selectedPreset === preset.name ? 'text-primary' : ''}`}>
                      {preset.name}
                    </p>
                  </button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(preset.name)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete '{preset.name}'</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))
            ) : (
              <div className="flex h-40 items-center justify-center text-center text-muted-foreground">
                <p>No presets have been saved yet.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
