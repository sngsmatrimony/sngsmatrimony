'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { toastError, toastSuccess } from '@/lib/toast';
import { Eye, Trash2, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AdminUsersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingUserId, setRejectingUserId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);

  // Build query params
  const queryParams = {
    page,
    limit: 20,
    approvalStatus: approvalFilter === 'all' ? '' : approvalFilter,
  };

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminUsers', queryParams],
    queryFn: async () => {
      const response = await adminApi.getAllUsers(queryParams);
      return response.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  const handleViewUser = (userId) => {
    router.push(`/admin/users/${userId}`);
  };

  const handleDeleteUser = async () => {
    try {
      await adminApi.deleteUser(deletingUserId);
      toastSuccess('User deleted successfully');
      setShowDeleteDialog(false);
      setDeletingUserId(null);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await adminApi.approveUser(userId);
      toastSuccess('User approved successfully');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to approve user');
    }
  };

  const handleOpenRejectDialog = (userId) => {
    setRejectingUserId(userId);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleRejectUser = async () => {
    if (!rejectionReason.trim()) {
      toastError('Please provide a rejection reason');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminApi.rejectUser(rejectingUserId, rejectionReason);
      toastSuccess('User rejected successfully');
      setShowRejectDialog(false);
      setRejectingUserId(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to reject user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilterChange = (value) => {
    setApprovalFilter(value);
    setPage(1); // Reset to first page when filter changes
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading users. Please try again.</p>
      </div>
    );
  }

  const { data: users = [], pagination = {} } = data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-viga text-secondary mb-2">User Management</h1>
        <p className="text-gray-600">Manage user accounts and approve new registrations</p>
      </div>

      {/* Approval Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Tabs value={approvalFilter} onValueChange={handleFilterChange}>
          <TabsList>
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="pending" className="gap-1">
              <Clock size={14} />
              Pending
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-1">
              <CheckCircle size={14} />
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-1">
              <XCircle size={14} />
              Rejected
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({pagination.total || 0} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell className="text-sm">{user.mobileNumber}</TableCell>
                      <TableCell>{user.gender || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.approvalStatus === 'approved'
                              ? 'default'
                              : user.approvalStatus === 'rejected'
                                ? 'destructive'
                                : 'outline'
                          }
                          className={
                            user.approvalStatus === 'pending'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : user.approvalStatus === 'approved'
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : ''
                          }
                        >
                          {user.approvalStatus === 'pending' && <Clock size={12} className="mr-1" />}
                          {user.approvalStatus === 'approved' && <CheckCircle size={12} className="mr-1" />}
                          {user.approvalStatus === 'rejected' && <XCircle size={12} className="mr-1" />}
                          {user.approvalStatus?.charAt(0).toUpperCase() + user.approvalStatus?.slice(1) || 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.approvalStatus === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-white hover:bg-green-600 border-green-300"
                                onClick={() => handleApproveUser(user._id)}
                                title="Approve"
                              >
                                <CheckCircle size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-white hover:bg-destructive"
                                onClick={() => handleOpenRejectDialog(user._id)}
                                title="Reject"
                              >
                                <XCircle size={16} />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewUser(user._id)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeletingUserId(user._id);
                              setShowDeleteDialog(true);
                            }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="8" className="text-center py-8 text-gray-500">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {users.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={!pagination.hasPrevPage}
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-viga">Reject User Registration</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this user. This will be sent to the user via email.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter the reason for rejection..."
              className="min-h-[120px]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{rejectionReason.length}/500 characters</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectUser}
              disabled={isSubmitting || !rejectionReason.trim()}
            >
              {isSubmitting ? 'Rejecting...' : 'Reject User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-viga text-red-600">
              Delete User?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-maven">
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingUserId(null)}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
            >
              Delete User
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
