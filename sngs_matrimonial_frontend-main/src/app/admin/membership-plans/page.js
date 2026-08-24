'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import adminClient from '@/lib/api/adminClient';
import { toastSuccess, toastError } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Edit2, Trash2, Star } from 'lucide-react';

export default function AdminMembershipPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    credits: '',
    price: '',
    validityDays: '',
    isDefault: false,
    isUnlimited: false,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await adminClient.get('/api/admin/membership-plans');
      setPlans(response.data.data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toastError('Failed to load membership plans');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || '',
        credits: String(plan.credits),
        price: String(plan.price.amount),
        validityDays: plan.validityDays === null ? '' : String(plan.validityDays),
        isDefault: plan.isDefault || false,
        isUnlimited: plan.validityDays === null,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        credits: '',
        price: '',
        validityDays: '',
        isDefault: false,
        isUnlimited: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSavePlan = async () => {
    // Validation
    if (!formData.name.trim()) {
      toastError('Plan name is required');
      return;
    }
    if (!formData.credits || parseInt(formData.credits) <= 0) {
      toastError('Credits must be greater than 0');
      return;
    }
    if (!formData.price || parseInt(formData.price) <= 0) {
      toastError('Price must be greater than 0');
      return;
    }
    if (!formData.isUnlimited && (!formData.validityDays || parseInt(formData.validityDays) <= 0)) {
      toastError('Validity days must be greater than 0 or set as unlimited');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        credits: parseInt(formData.credits),
        price: {
          amount: parseInt(formData.price),
          currency: 'INR',
        },
        validityDays: formData.isUnlimited ? null : parseInt(formData.validityDays),
        isDefault: formData.isDefault,
      };

      if (editingPlan) {
        // Update existing plan
        await adminClient.put(`/api/admin/membership-plans/${editingPlan._id}`, payload);
        toastSuccess('Plan updated successfully');
      } else {
        // Create new plan
        await adminClient.post('/api/admin/membership-plans', payload);
        toastSuccess('Plan created successfully');
      }

      setIsDialogOpen(false);
      await fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toastError(error.response?.data?.message || 'Failed to save plan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlan = async () => {
    try {
      setIsSaving(true);
      await adminClient.delete(`/api/admin/membership-plans/${planToDelete._id}`);
      toastSuccess('Plan deleted successfully');
      setIsDeleteDialogOpen(false);
      setPlanToDelete(null);
      await fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      const message = error.response?.data?.message || 'Failed to delete plan';
      toastError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (plan) => {
    try {
      await adminClient.put(`/api/admin/membership-plans/${plan._id}`, {
        ...plan,
        isActive: !plan.isActive,
      });
      toastSuccess(
        plan.isActive ? 'Plan deactivated' : 'Plan activated'
      );
      await fetchPlans();
    } catch (error) {
      console.error('Error toggling plan status:', error);
      toastError('Failed to update plan status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="font-maven text-secondary">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-viga text-3xl text-secondary mb-2">Membership Plans</h1>
          <p className="font-maven text-gray-600">
            Create and manage membership plans
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-telex"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <p className="font-maven text-lg text-gray-600 mb-4">
                No membership plans yet
              </p>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-telex"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan._id}
              className={`relative transition-all pt-10 ${
                !plan.isActive ? 'opacity-60' : ''
              }`}
            >
              {plan.isDefault && (
                <div className="absolute top-2 right-4">
                  <Badge className="bg-accent text-accent-foreground flex items-center gap-1 font-telex">
                    <Star className="w-3 h-3" />
                    Default
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="font-viga text-xl text-secondary">
                      {plan.name}
                    </CardTitle>
                    {plan.description && (
                      <CardDescription className="font-maven mt-1">
                        {plan.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge
                    className={`ml-2 font-telex ${
                      plan.isActive
                        ? 'bg-success text-black'
                        : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Plan Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-telex text-xs text-gray-600 mb-1">
                      Credits
                    </p>
                    <p className="font-viga text-2xl text-secondary">
                      {plan.credits}
                    </p>
                  </div>
                  <div>
                    <p className="font-telex text-xs text-gray-600 mb-1">
                      Price
                    </p>
                    <p className="font-viga text-2xl text-secondary">
                      ₹{plan.price.amount}
                    </p>
                  </div>
                  <div>
                    <p className="font-telex text-xs text-gray-600 mb-1">
                      Validity
                    </p>
                    <p className="font-maven">
                      {plan.validityDays === null || plan.validityDays === undefined
                        ? 'Unlimited'
                        : `${plan.validityDays} day${plan.validityDays !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div>
                    <p className="font-telex text-xs text-gray-600 mb-1">
                      Price/Credit
                    </p>
                    <p className="font-maven">
                      ₹{(plan.price.amount / plan.credits).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleOpenDialog(plan)}
                    size="sm"
                    variant="outline"
                    className="flex-1 font-telex"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => {
                      setPlanToDelete(plan);
                      setIsDeleteDialogOpen(true);
                    }}
                    size="sm"
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50 font-telex"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                  <Button
                    onClick={() => handleToggleActive(plan)}
                    size="sm"
                    variant="outline"
                    className="flex-1 font-telex"
                  >
                    {plan.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-viga">
              {editingPlan ? 'Edit Plan' : 'Create New Plan'}
            </DialogTitle>
            <DialogDescription className="font-maven">
              {editingPlan
                ? 'Update the plan details below'
                : 'Fill in the details to create a new membership plan'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <Label className="font-telex text-sm">Plan Name *</Label>
              <Input
                placeholder="e.g., Starter Plan"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="font-maven mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="font-telex text-sm">Description</Label>
              <Textarea
                placeholder="Brief description of this plan (optional)"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="font-maven mt-1 resize-none h-20"
              />
            </div>

            {/* Credits */}
            <div>
              <Label className="font-telex text-sm">Credits *</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g., 10"
                value={formData.credits}
                onChange={(e) =>
                  setFormData({ ...formData, credits: e.target.value })
                }
                className="font-maven mt-1"
              />
            </div>

            {/* Price */}
            <div>
              <Label className="font-telex text-sm">Price (₹) *</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g., 1000"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="font-maven mt-1"
              />
            </div>

            {/* Validity Days */}
            <div>
              <Label className="font-telex text-sm">Validity (Days) *</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g., 30"
                value={formData.validityDays}
                onChange={(e) =>
                  setFormData({ ...formData, validityDays: e.target.value })
                }
                disabled={formData.isUnlimited}
                className="font-maven mt-1"
              />
            </div>

            {/* Unlimited Validity */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="isUnlimited"
                checked={formData.isUnlimited}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isUnlimited: checked, validityDays: checked ? '' : formData.validityDays })
                }
              />
              <Label htmlFor="isUnlimited" className="font-telex text-sm cursor-pointer">
                Unlimited validity (no expiry)
              </Label>
            </div>

            {/* Set as Default */}
            <div className="flex items-center gap-3 pt-2">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isDefault: checked })
                }
              />
              <Label htmlFor="isDefault" className="font-telex text-sm cursor-pointer">
                Set as default plan
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
              className="font-telex"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePlan}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-telex"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Plan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-viga">Delete Plan?</AlertDialogTitle>
            <AlertDialogDescription className="font-maven">
              {planToDelete?.name} will be permanently deleted. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setPlanToDelete(null);
              }}
              disabled={isSaving}
              className="font-telex"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700 text-white font-telex"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
