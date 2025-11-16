"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  UserPlus,
  MoreVertical,
  Shield,
  ShieldCheck,
  Ban,
  CheckCircle,
  Key,
  Trash2,
} from "lucide-react";
import { Role } from "../../../../../generated/prisma";

export default function TeamManagementPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    role: "usher" as Role,
    password: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [createError, setCreateError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Fetch users
  const { data: users = [], refetch } = api.user.getAll.useQuery();

  // Helper function to parse tRPC/Zod errors
  const parseError = (error: { message: string }): string => {
    try {
      // Check if it's a Zod validation error
      if (error.message.includes("tRPC failed")) {
        // Extract the JSON array from the error message
        const match = error.message.match(/\[([\s\S]*)\]/);
        if (match?.[1]) {
          const errors = JSON.parse(`[${match[1]}]`) as Array<{
            message: string;
            path: string[];
          }>;
          // Return the first error message
          if (errors.length > 0 && errors[0]) {
            return errors[0].message;
          }
        }
      }
      // Return the original message if parsing fails
      return error.message;
    } catch {
      return error.message;
    }
  };

  // Create user mutation
  const createMutation = api.user.create.useMutation({
    onSuccess: () => {
      toast.success("User created successfully");
      setCreateDialogOpen(false);
      setCreateError("");
      setFormData({
        name: "",
        username: "",
        email: "",
        role: "usher",
        password: "",
      });
      void refetch();
    },
    onError: (error) => {
      const errorMessage = parseError(error);
      setCreateError(errorMessage);
      toast.error(errorMessage);
    },
  });

  // Update user mutation
  const updateMutation = api.user.update.useMutation({
    onSuccess: () => {
      toast.success("User updated successfully");
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Set password mutation
  const setPasswordMutation = api.user.setPassword.useMutation({
    onSuccess: () => {
      toast.success("Password updated successfully");
      setPasswordDialogOpen(false);
      setPasswordError("");
      setNewPassword("");
      setSelectedUserId(null);
    },
    onError: (error) => {
      const errorMessage = parseError(error);
      setPasswordError(errorMessage);
      toast.error(errorMessage);
    },
  });

  // Delete user mutation
  const deleteMutation = api.user.delete.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully");
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      name: formData.name,
      username: formData.username,
      email: formData.email,
      role: formData.role,
      password: formData.password || undefined,
    });
  };

  const handleToggleActive = (userId: string, currentStatus: boolean) => {
    updateMutation.mutate({
      id: userId,
      isActive: !currentStatus,
    });
  };

  const handleSetPassword = () => {
    if (!selectedUserId) return;
    setPasswordMutation.mutate({
      userId: selectedUserId,
      password: newPassword,
    });
  };

  const handleDelete = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteMutation.mutate({ id: userId });
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your team members and their access
          </p>
        </div>
        <Dialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) {
              setCreateError("");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new team member. Password is optional - users can set
                it on first login.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {createError && (
                <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400">
                  {createError}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setCreateError("");
                  }}
                  placeholder="John Doe"
                  required
                  minLength={1}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value });
                    setCreateError("");
                  }}
                  placeholder="johndoe"
                  required
                  minLength={3}
                  maxLength={20}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setCreateError("");
                  }}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value as Role })
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="usher">Usher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password (Optional)</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setCreateError("");
                  }}
                  placeholder="Leave empty for user to set on first login"
                  minLength={6}
                  maxLength={100}
                />
                <p className="text-muted-foreground text-xs">
                  If left empty, user will be prompted to create a password on
                  first login
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {users.length} team member{users.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Password</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.role === "admin" ? (
                      <Badge variant="default">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Shield className="mr-1 h-3 w-3" />
                        Usher
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <Badge variant="success">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="default">
                        <Ban className="mr-1 h-3 w-3" />
                        Disabled
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {user.hasPassword ? "Set" : "Not Set"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            handleToggleActive(user.id, user.isActive)
                          }
                        >
                          {user.isActive ? (
                            <>
                              <Ban className="mr-2 h-4 w-4" />
                              Disable User
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Enable User
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setPasswordDialogOpen(true);
                          }}
                        >
                          <Key className="mr-2 h-4 w-4" />
                          Set Password
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(user.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="space-y-4 md:hidden">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{user.name}</CardTitle>
                  <CardDescription>@{user.username}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleToggleActive(user.id, user.isActive)}
                    >
                      {user.isActive ? (
                        <>
                          <Ban className="mr-2 h-4 w-4" />
                          Disable User
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Enable User
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setPasswordDialogOpen(true);
                      }}
                    >
                      <Key className="mr-2 h-4 w-4" />
                      Set Password
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(user.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  {user.role === "admin" ? (
                    <Badge variant="default">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Shield className="mr-1 h-3 w-3" />
                      Usher
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  {user.isActive ? (
                    <Badge variant="default">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <Ban className="mr-1 h-3 w-3" />
                      Disabled
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Password:</span>
                  <Badge variant="outline">
                    {user.hasPassword ? "Set" : "Not Set"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Password Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onOpenChange={(open) => {
          setPasswordDialogOpen(open);
          if (!open) {
            setPasswordError("");
            setNewPassword("");
            setSelectedUserId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Password</DialogTitle>
            <DialogDescription>
              Enter a new password for this user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {passwordError && (
              <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400">
                {passwordError}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError("");
                }}
                placeholder="Enter new password (min 6 characters)"
                required
                minLength={6}
                maxLength={100}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPasswordDialogOpen(false);
                  setNewPassword("");
                  setSelectedUserId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSetPassword}
                disabled={
                  setPasswordMutation.isPending || newPassword.length < 6
                }
              >
                {setPasswordMutation.isPending ? "Setting..." : "Set Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
