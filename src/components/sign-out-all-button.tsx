"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SignOutAllButton() {
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();

  const signOutAllMutation = api.activity.signOutAll.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setOpen(false);
      // Invalidate relevant queries to refresh the data
      void utils.activity.getAllRecent.invalidate();
      void utils.activity.getDashboardStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSignOutAll = () => {
    signOutAllMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out Everyone
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign Out Everyone from Previous Days?</DialogTitle>
          <DialogDescription>
            This will create EXIT records for all employees who have ENTRY as
            their last activity from before today (yesterday or earlier). This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={signOutAllMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSignOutAll}
            disabled={signOutAllMutation.isPending}
          >
            {signOutAllMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing Out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out Everyone
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
