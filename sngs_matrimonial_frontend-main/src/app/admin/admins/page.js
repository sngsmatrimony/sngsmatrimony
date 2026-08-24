'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toastError, toastSuccess } from '@/lib/toast';
import { Shield, Plus } from 'lucide-react';

// Zod validation schema
const createAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function AdminManagementPage() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch admins list
  const { data, isLoading, error } = useQuery({
    queryKey: ['admins'],
    queryFn: async () => {
      const response = await adminApi.getAllAdmins();
      return response.data;
    },
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Create admin mutation
  const createAdminMutation = useMutation({
    mutationFn: (data) => adminApi.createAdmin(data),
    onSuccess: () => {
      toastSuccess('Admin created successfully');
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setShowCreateForm(false);
      form.reset();
    },
    onError: (error) => {
      toastError(error.response?.data?.message || 'Failed to create admin');
    },
  });

  // React Hook Form
  const form = useForm({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (values) => {
    createAdminMutation.mutate(values);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary font-maven">Loading admins...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-maven">Error loading admins. Please try again.</p>
      </div>
    );
  }

  const { data: admins = [], total = 0 } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-viga text-secondary mb-2">Admin Management</h1>
          <p className="text-gray-600 font-maven">Manage admin accounts and permissions</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-telex"
        >
          <Plus size={18} className="mr-2" />
          {showCreateForm ? 'Cancel' : 'Create Admin'}
        </Button>
      </div>

      {/* Create Admin Form */}
      {showCreateForm && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="font-viga text-xl flex items-center gap-2">
              <Shield size={20} className="text-primary" />
              Create New Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-telex text-secondary font-semibold">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="admin@example.com"
                          type="email"
                          autoComplete="email"
                          className="border-2 border-gray-200 focus:border-primary focus:ring-primary transition-colors font-maven"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-telex text-secondary font-semibold">Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Minimum 8 characters"
                          type="password"
                          autoComplete="new-password"
                          className="border-2 border-gray-200 focus:border-primary focus:ring-primary transition-colors font-maven"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={createAdminMutation.isPending}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-telex"
                  >
                    {createAdminMutation.isPending ? 'Creating...' : 'Create Admin'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      form.reset();
                    }}
                    className="font-telex"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Admins List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-viga">All Admins ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-telex">Email</TableHead>
                  <TableHead className="font-telex">Created Date</TableHead>
                  <TableHead className="font-telex">Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.length > 0 ? (
                  admins.map((admin) => (
                    <TableRow key={admin._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium font-maven">{admin.email}</TableCell>
                      <TableCell className="text-sm font-telex">
                        {new Date(admin.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="text-sm font-telex">
                        {admin.lastLogin
                          ? new Date(admin.lastLogin).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="3" className="text-center py-8 text-gray-500 font-maven">
                      No admins found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
