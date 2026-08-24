'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { toastSuccess, toastError } from '@/lib/toast';
import { client } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';

export default function AccountManagementSection() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Deletion mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await client.delete('/api/auth/delete-account', {
        data: { password: deletePassword },
      });
      return response.data;
    },
    onSuccess: () => {
      toastSuccess('Account deleted successfully');
      setTimeout(() => {
        logout();
        router.push('/login');
      }, 1500);
    },
    onError: (error) => {
      toastError(error.response?.data?.message || 'Failed to delete account');
    },
  });

  const handleDelete = () => {
    if (!deletePassword) {
      toastError('Please enter your password');
      return;
    }
    if (!deleteConfirm) {
      toastError('Please confirm you understand this action cannot be undone');
      return;
    }
    deleteMutation.mutate();
  };

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="font-viga flex items-center gap-2 text-red-600">
          <AlertTriangle size={20} />
          Account Management
        </CardTitle>
        <CardDescription className="font-maven">
          Manage your account status and data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Deletion Section */}
        <div className="p-4 border border-red-300 rounded-lg bg-red-50">
          <h3 className="font-viga text-lg text-red-600 mb-2">Delete Account</h3>
          <p className="font-maven text-sm text-gray-700 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
            Active memberships and credits will be forfeited.
          </p>
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="font-telex">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-viga text-red-600">
                  Permanently Delete Your Account?
                </AlertDialogTitle>
                <AlertDialogDescription className="font-maven">
                  <strong className="text-red-600">Warning: This action cannot be undone!</strong>
                  <br />
                  <br />
                  Deleting your account will:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Permanently remove your profile and all data</li>
                    <li>Forfeit any active memberships and credits</li>
                    <li>Remove you from all matches and conversations</li>
                    <li>Prevent you from logging in</li>
                  </ul>
                  <br />
                  Your data will be retained for 30 days for legal compliance, then permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-4 my-4">
                <div>
                  <Label htmlFor="delete-password" className="font-telex">
                    Enter your password to confirm
                  </Label>
                  <Input
                    id="delete-password"
                    name="password"
                    type="password"
                    placeholder="Your password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    autoComplete="current-password"
                    className="font-maven mt-1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="delete-confirm"
                    checked={deleteConfirm}
                    onCheckedChange={setDeleteConfirm}
                  />
                  <label
                    htmlFor="delete-confirm"
                    className="font-maven text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I understand this action is permanent and cannot be undone
                  </label>
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel className="font-telex" onClick={() => {
                  setDeletePassword('');
                  setDeleteConfirm(false);
                }}>
                  Cancel
                </AlertDialogCancel>
                <Button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  variant="destructive"
                  className="font-telex"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Account Permanently'
                  )}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
