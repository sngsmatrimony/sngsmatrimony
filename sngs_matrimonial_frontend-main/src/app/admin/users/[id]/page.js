'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toastError, toastSuccess } from '@/lib/toast';
import { ArrowLeft, Edit2, Trash2, Power, CheckCircle, XCircle, Clock, Upload, X, FileText, ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import Image from 'next/image';

const RELIGIONS = [
  'Hindu', 'Muslim - Shia', 'Muslim - Sunni', 'Muslim - Others', 'Christian', 'Sikh',
  'Jain - Digambar', 'Jain - Swetambar', 'Jain - Others', 'Parsi', 'Buddhist', 'Jewish', 'Inter-Religion'
];

const NAKSHATRAS = [
  'Aswathi', 'Bharani', 'Karthika', 'Rohini', 'Makayiram', 'Thiruvathira', 'Punartham',
  'Pooyam', 'Ayilyam', 'Makam', 'Pooram', 'Uthram', 'Atham', 'Chithira', 'Chothy',
  'Vishakham', 'Anizham', 'Thrikketta', 'Moolam', 'Pooradam', 'Uthradam', 'Thiruvonam',
  'Avittam', 'Chathayam', 'Pooruruttathi', 'Uthrattathi', 'Revathi'
];

const RAASIS = [
  'Mesham', 'Vrushabham', 'Mithunam', 'Karkatakam', 'Simham', 'Kanni',
  'Tulam', 'Vrishchikam', 'Dhanus', 'Makaram', 'Kumbam', 'Meenam'
];

const INTERESTS = [
  'Painting', 'Coding', 'Poetry', 'Reading', 'Writing', 'Photography', 'Music',
  'Dancing', 'Cooking', 'Traveling', 'Gardening', 'Sports', 'Fitness', 'Yoga',
  'Meditation', 'Gaming', 'Movies', 'Theater', 'Volunteering', 'Fashion'
];

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [showApprovalRejectDialog, setShowApprovalRejectDialog] = useState(false);
  const [approvalRejectionReason, setApprovalRejectionReason] = useState('');

  // Media upload state
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
  const [uploadingGalleryPhoto, setUploadingGalleryPhoto] = useState(false);
  const [uploadingHoroscope, setUploadingHoroscope] = useState(false);
  const [deletingPhotoIndex, setDeletingPhotoIndex] = useState(null);
  const [deletingHoroscope, setDeletingHoroscope] = useState(false);

  // Download handler for horoscope with authentication
  const handleDownloadHoroscope = async (userId) => {
    try {
      // Get admin token from localStorage
      const token = localStorage.getItem('adminAuthToken');

      if (!token) {
        toastError('Authentication required. Please log in.');
        return;
      }

      // Fetch file with authentication header
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/profiles/${userId}/horoscope/download`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        toastError(error.message || 'Failed to download horoscope');
        return;
      }

      // Get filename from Content-Disposition header or extract from URL
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);

      let filename;
      if (filenameMatch) {
        filename = filenameMatch[1];
      } else {
        const url = response.url;
        const urlExtension = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
        const safeExtension = urlExtension || 'pdf';
        filename = `horoscope.${safeExtension}`;
      }

      // Convert response to blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Download error:', error);
      toastError('Failed to download horoscope document');
    }
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminUser', userId],
    queryFn: async () => {
      const response = await adminApi.getUserById(userId);
      return response.data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateData) => adminApi.updateUser(userId, updateData),
    onSuccess: () => {
      toastSuccess('User updated successfully');
      setIsEditMode(false);
      refetch();
    },
    onError: (error) => {
      toastError(error.response?.data?.message || 'Failed to update user');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => adminApi.deactivateUser(userId),
    onSuccess: () => {
      toastSuccess('User deactivated successfully');
      refetch();
    },
    onError: (error) => {
      toastError(error.response?.data?.message || 'Failed to deactivate user');
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => adminApi.activateUser(userId),
    onSuccess: () => {
      toastSuccess('User activated successfully');
      refetch();
    },
    onError: (error) => {
      toastError(error.response?.data?.message || 'Failed to activate user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteUser(userId),
    onSuccess: () => {
      toastSuccess('User deleted successfully');
      router.push('/admin/users');
    },
    onError: (error) => {
      toastError(error.response?.data?.message || 'Failed to delete user');
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => adminApi.approveUser(userId),
    onSuccess: () => {
      toastSuccess('User approved successfully');
      refetch();
    },
    onError: (error) => {
      toastError(error.response?.data?.message || 'Failed to approve user');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason) => adminApi.rejectUser(userId, reason),
    onSuccess: () => {
      toastSuccess('User rejected successfully');
      setShowApprovalRejectDialog(false);
      setApprovalRejectionReason('');
      refetch();
    },
    onError: (error) => {
      toastError(error.response?.data?.message || 'Failed to reject user');
    },
  });

  const handleApproveUser = () => {
    approveMutation.mutate();
  };

  const handleRejectUser = () => {
    if (!approvalRejectionReason.trim()) {
      toastError('Please provide a rejection reason');
      return;
    }
    rejectMutation.mutate(approvalRejectionReason);
  };

  // ==================== Media Upload Handlers ====================

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toastError('Profile picture must be under 5 MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toastError('Please upload an image file');
      return;
    }

    setUploadingProfilePicture(true);
    try {
      await adminApi.uploadUserProfilePicture(userId, file);
      toastSuccess('Profile picture uploaded successfully');
      refetch();
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setUploadingProfilePicture(false);
      e.target.value = '';
    }
  };

  const handleGalleryPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toastError('Photo must be under 5 MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toastError('Please upload an image file');
      return;
    }

    // Check photo limit
    if (data?.gallery?.photos?.length >= 10) {
      toastError('Maximum 10 photos allowed');
      return;
    }

    setUploadingGalleryPhoto(true);
    try {
      await adminApi.uploadUserPhoto(userId, file);
      toastSuccess('Photo uploaded successfully');
      refetch();
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingGalleryPhoto(false);
      e.target.value = '';
    }
  };

  const handleDeleteGalleryPhoto = async (photoIndex) => {
    setDeletingPhotoIndex(photoIndex);
    try {
      await adminApi.deleteUserPhoto(userId, photoIndex);
      toastSuccess('Photo deleted successfully');
      refetch();
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to delete photo');
    } finally {
      setDeletingPhotoIndex(null);
    }
  };

  const handleHoroscopeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toastError('Horoscope document must be under 5 MB');
      return;
    }

    // Validate file type (PDF or image)
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toastError('Please upload a PDF or image file');
      return;
    }

    setUploadingHoroscope(true);
    try {
      await adminApi.uploadUserHoroscope(userId, file);
      toastSuccess('Horoscope document uploaded successfully');
      refetch();
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to upload horoscope');
    } finally {
      setUploadingHoroscope(false);
      e.target.value = '';
    }
  };

  const handleDeleteHoroscope = async () => {
    setDeletingHoroscope(true);
    try {
      await adminApi.deleteUserHoroscope(userId);
      toastSuccess('Horoscope document deleted successfully');
      refetch();
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to delete horoscope');
    } finally {
      setDeletingHoroscope(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading user. Please try again.</p>
      </div>
    );
  }

  const user = data;
  if (!user) return null;

  const handleSaveEdit = () => {
    updateMutation.mutate(editData);
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({...prev, [field]: value}));
  };

  const handleNestedChange = (parent, field, value) => {
    setEditData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleArrayChange = (field, item) => {
    setEditData(prev => {
      const currentArray = prev[field] || [];
      if (currentArray.includes(item)) {
        return {...prev, [field]: currentArray.filter(i => i !== item)};
      } else {
        return {...prev, [field]: [...currentArray, item]};
      }
    });
  };

  const displayValue = (value) => value || '-';

  return (
    <div className="flex justify-center">
      <div className="max-w-4xl space-y-6 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold font-viga text-secondary">{user.fullName}</h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isEditMode && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditData({...user});
                  setIsEditMode(true);
                }}
              >
                <Edit2 size={16} className="mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* User Status and Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Account Status</p>
                <Badge variant={user.isActive ? 'default' : 'secondary'} className="w-fit">
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="flex gap-2 flex-wrap">
                {user.isActive ? (
                  <Button
                    variant="outline"
                    className="text-amber-600 hover:text-white"
                    onClick={() => setShowDeactivateDialog(true)}
                  >
                    <Power size={16} className="mr-2" />
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="text-success"
                    onClick={() => activateMutation.mutate()}
                    disabled={activateMutation.isPending}
                  >
                    <Power size={16} className="mr-2" />
                    Activate
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="text-destructive hover:text-white"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete User
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approval Status Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Approval Status</span>
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Quick Actions for Pending Users */}
            {user.approvalStatus === 'pending' && (
              <div className="flex gap-3 mb-6 pb-6 border-b">
                <Button
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={handleApproveUser}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle size={16} className="mr-2" />
                  {approveMutation.isPending ? 'Approving...' : 'Approve User'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowApprovalRejectDialog(true)}
                  disabled={rejectMutation.isPending}
                >
                  <XCircle size={16} className="mr-2" />
                  Reject User
                </Button>
              </div>
            )}

            {/* Approval Timestamps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {user.approvedAt && (
                <div>
                  <p className="text-sm text-gray-600">Approved On</p>
                  <p className="font-medium text-green-600">
                    {new Date(user.approvedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {user.rejectedAt && (
                <div>
                  <p className="text-sm text-gray-600">Rejected On</p>
                  <p className="font-medium text-destructive">
                    {new Date(user.rejectedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Approval History */}
            {user.approvalHistory && user.approvalHistory.length > 0 && (
              <div>
                <h4 className="font-semibold text-secondary mb-3">Approval History</h4>
                <div className="space-y-3">
                  {user.approvalHistory.slice().reverse().map((history, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-l-4 ${
                        history.status === 'approved'
                          ? 'bg-green-50 border-l-green-500'
                          : history.status === 'rejected'
                            ? 'bg-red-50 border-l-destructive'
                            : 'bg-amber-50 border-l-amber-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge
                          variant={
                            history.status === 'approved'
                              ? 'default'
                              : history.status === 'rejected'
                                ? 'destructive'
                                : 'outline'
                          }
                          className={`text-xs ${
                            history.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : ''
                          }`}
                        >
                          {history.status.charAt(0).toUpperCase() + history.status.slice(1)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(history.actionAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">By: {history.adminEmail}</p>
                      {history.reason && (
                        <p className="text-sm mt-2 text-gray-700">
                          <span className="font-medium">Reason:</span> {history.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Mode */}
        {isEditMode ? (
          <Card className="border-primary bg-white">
            <CardHeader>
              <CardTitle>Edit User Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="grid w-full grid-cols-4 gap-2 mb-4">
                  <button
                    onClick={() => setActiveTab('basic')}
                    className={`rounded-full px-4 py-2 font-medium transition-all duration-200 ease-in-out ${
                      activeTab === 'basic'
                        ? 'bg-primary text-black'
                        : 'bg-white text-black border-2 border-black shadow-md'
                    }`}
                  >
                    Basic
                  </button>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`rounded-full px-4 py-2 font-medium transition-all duration-200 ease-in-out ${
                      activeTab === 'profile'
                        ? 'bg-primary text-black'
                        : 'bg-white text-black border-2 border-black shadow-md'
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveTab('professional')}
                    className={`rounded-full px-4 py-2 font-medium transition-all duration-200 ease-in-out ${
                      activeTab === 'professional'
                        ? 'bg-primary text-black'
                        : 'bg-white text-black border-2 border-black shadow-md'
                    }`}
                  >
                    Professional
                  </button>
                  <button
                    onClick={() => setActiveTab('family')}
                    className={`rounded-full px-4 py-2 font-medium transition-all duration-200 ease-in-out ${
                      activeTab === 'family'
                        ? 'bg-primary text-black'
                        : 'bg-white text-black border-2 border-black shadow-md'
                    }`}
                  >
                    Family & Misc
                  </button>
                  <button
                    onClick={() => setActiveTab('location')}
                    className={`rounded-full px-4 py-2 font-medium transition-all duration-200 ease-in-out ${
                      activeTab === 'location'
                        ? 'bg-primary text-black'
                        : 'bg-white text-black border-2 border-black shadow-md'
                    }`}
                  >
                    Location
                  </button>
                  <button
                    onClick={() => setActiveTab('media')}
                    className={`rounded-full px-4 py-2 font-medium transition-all duration-200 ease-in-out ${
                      activeTab === 'media'
                        ? 'bg-primary text-black'
                        : 'bg-white text-black border-2 border-black shadow-md'
                    }`}
                  >
                    Media
                  </button>
                </div>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <Input
                        value={editData?.fullName || ''}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <Input
                        type="email"
                        value={editData?.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                      <Input
                        value={editData?.mobileNumber || ''}
                        onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                        maxLength={10}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Mobile</label>
                      <Input
                        value={editData?.alternateMobileNumber || ''}
                        onChange={(e) => handleInputChange('alternateMobileNumber', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                      <Input
                        type="date"
                        value={editData?.dateOfBirth ? new Date(editData.dateOfBirth).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleInputChange('dateOfBirth', new Date(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time of Birth</label>
                      <Input
                        type="time"
                        value={editData?.timeOfBirth || ''}
                        onChange={(e) => handleInputChange('timeOfBirth', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Place of Birth</label>
                      <Input
                        value={editData?.placeOfBirth || ''}
                        onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                        placeholder="Enter place of birth"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Age From</label>
                      <Input
                        type="number"
                        min="18"
                        max="90"
                        value={editData?.ageFrom || ''}
                        onChange={(e) => handleInputChange('ageFrom', e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Age To</label>
                      <Input
                        type="number"
                        min="18"
                        max="90"
                        value={editData?.ageTo || ''}
                        onChange={(e) => handleInputChange('ageTo', e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <Select value={editData?.gender || ''} onValueChange={(val) => handleInputChange('gender', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Seeking Gender</label>
                      <Select value={editData?.seekingGender || ''} onValueChange={(val) => handleInputChange('seekingGender', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                {/* Profile Details Tab */}
                <TabsContent value="profile" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
                      <Select value={editData?.maritalStatus || ''} onValueChange={(val) => handleInputChange('maritalStatus', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Never Married">Never Married</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                          <SelectItem value="Awaiting Divorce">Awaiting Divorce</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mother Tongue</label>
                      <Input
                        value={editData?.motherTongue || ''}
                        onChange={(e) => handleInputChange('motherTongue', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                      <Input
                        value={editData?.height || ''}
                        onChange={(e) => handleInputChange('height', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                      <Input
                        type="number"
                        value={editData?.weight || ''}
                        onChange={(e) => handleInputChange('weight', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Complexion</label>
                      <Select value={editData?.complexion || 'none'} onValueChange={(val) => handleInputChange('complexion', val === 'none' ? '' : val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select complexion" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="Very Fair">Very Fair</SelectItem>
                          <SelectItem value="Fair">Fair</SelectItem>
                          <SelectItem value="Wheatish">Wheatish</SelectItem>
                          <SelectItem value="Wheatish Brown">Wheatish Brown</SelectItem>
                          <SelectItem value="Dark">Dark</SelectItem>
                          <SelectItem value="Very Dark">Very Dark</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Physical Status</label>
                      <Select value={editData?.physicalStatus || ''} onValueChange={(val) => handleInputChange('physicalStatus', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="Physically Challenged">Physically Challenged</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                      <Select value={editData?.bloodGroup || 'none'} onValueChange={(val) => handleInputChange('bloodGroup', val === 'none' ? '' : val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="Don't Know">Don&apos;t Know</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Diet</label>
                      <Select value={editData?.diet || 'none'} onValueChange={(val) => handleInputChange('diet', val === 'none' ? '' : val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select diet" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                          <SelectItem value="Non-Vegetarian">Non-Vegetarian</SelectItem>
                          <SelectItem value="Eggetarian">Eggetarian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
                      <Select value={editData?.religion || ''} onValueChange={(val) => handleInputChange('religion', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select religion" />
                        </SelectTrigger>
                        <SelectContent>
                          {RELIGIONS.map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Caste</label>
                      <Input
                        value={editData?.caste || ''}
                        onChange={(e) => handleInputChange('caste', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nakshatra</label>
                      <Select value={editData?.nakshatra || ''} onValueChange={(val) => handleInputChange('nakshatra', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select nakshatra" />
                        </SelectTrigger>
                        <SelectContent>
                          {NAKSHATRAS.map(n => (
                            <SelectItem key={n} value={n}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Raasi</label>
                      <Select value={editData?.raasi || ''} onValueChange={(val) => handleInputChange('raasi', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select raasi" />
                        </SelectTrigger>
                        <SelectContent>
                          {RAASIS.map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Shuddha Jathakam</label>
                      <Select value={editData?.shuddhaJathakam || 'none'} onValueChange={(val) => handleInputChange('shuddhaJathakam', val === 'none' ? '' : val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Don't Know">Don&apos;t Know</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {editData?.shuddhaJathakam === 'No' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dosham Types</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {['Chevvai', 'Rahu', 'Ketu', 'Naga', 'Kaal Sarpa'].map(dosham => (
                            <label key={dosham} className="flex items-center gap-2">
                              <Checkbox
                                checked={(editData?.doshamTypes || []).includes(dosham)}
                                onCheckedChange={() => handleArrayChange('doshamTypes', dosham)}
                              />
                              <span className="text-sm">{dosham}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Languages Known</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {['English', 'Hindi', 'Malayalam', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Gujarati', 'Bengali', 'Punjabi', 'Urdu', 'Sanskrit'].map(language => (
                          <label key={language} className="flex items-center gap-2">
                            <Checkbox
                              checked={(editData?.languagesKnown || []).includes(language)}
                              onCheckedChange={() => handleArrayChange('languagesKnown', language)}
                            />
                            <span className="text-sm">{language}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Profile Banner Color</label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="color"
                          value={editData?.profileBanner?.bannerColor || '#FFB3BA'}
                          onChange={(e) => handleNestedChange('profileBanner', 'bannerColor', e.target.value)}
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <span className="text-sm text-gray-600">
                          {editData?.profileBanner?.bannerColor || '#FFB3BA'}
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Professional Information Tab */}
                <TabsContent value="professional" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                      <Input
                        value={editData?.education || ''}
                        onChange={(e) => handleInputChange('education', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                      <Input
                        value={editData?.occupation || ''}
                        onChange={(e) => handleInputChange('occupation', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                      <Select value={editData?.employmentType || ''} onValueChange={(val) => handleInputChange('employmentType', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Salaried - Private">Salaried - Private</SelectItem>
                          <SelectItem value="Salaried - Government">Salaried - Government</SelectItem>
                          <SelectItem value="Self Employed">Self Employed</SelectItem>
                          <SelectItem value="Business">Business</SelectItem>
                          <SelectItem value="Defense">Defense</SelectItem>
                          <SelectItem value="Not Working">Not Working</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Income Currency</label>
                      <Select value={editData?.annualIncome?.currency || 'INR'} onValueChange={(val) => handleNestedChange('annualIncome', 'currency', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="AED">AED</SelectItem>
                          <SelectItem value="SGD">SGD</SelectItem>
                          <SelectItem value="AUD">AUD</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Annual Income (Min)</label>
                      <Input
                        type="number"
                        value={editData?.annualIncome?.min || ''}
                        onChange={(e) => handleNestedChange('annualIncome', 'min', parseInt(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Annual Income (Max)</label>
                      <Input
                        type="number"
                        value={editData?.annualIncome?.max || ''}
                        onChange={(e) => handleNestedChange('annualIncome', 'max', parseInt(e.target.value))}
                      />
                    </div>

                    {/* Removed root Country/State/City inputs */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Professional Additional Info</label>
                      <Textarea
                        value={editData?.professionalAdditionalInfo || ''}
                        onChange={(e) => handleInputChange('professionalAdditionalInfo', e.target.value)}
                        className="min-h-20"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Family & Misc Tab */}
                <TabsContent value="family" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Family Status</label>
                      <Select value={editData?.familyStatus || ''} onValueChange={(val) => handleInputChange('familyStatus', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Middle Class">Middle Class</SelectItem>
                          <SelectItem value="Upper Middle Class">Upper Middle Class</SelectItem>
                          <SelectItem value="Rich / Affluent">Rich / Affluent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Residential Status</label>
                      <Select value={editData?.residentialStatus || 'none'} onValueChange={(val) => handleInputChange('residentialStatus', val === 'none' ? '' : val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="Owned">Owned</SelectItem>
                          <SelectItem value="Rented">Rented</SelectItem>
                          <SelectItem value="Sub-tenant">Sub-tenant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Father Name</label>
                      <Input
                        value={editData?.fatherName || ''}
                        onChange={(e) => handleInputChange('fatherName', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Father Occupation</label>
                      <Input
                        value={editData?.fatherOccupation || ''}
                        onChange={(e) => handleInputChange('fatherOccupation', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mother Name</label>
                      <Input
                        value={editData?.motherName || ''}
                        onChange={(e) => handleInputChange('motherName', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mother Occupation</label>
                      <Input
                        value={editData?.motherOccupation || ''}
                        onChange={(e) => handleInputChange('motherOccupation', e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {INTERESTS.map(interest => (
                          <label key={interest} className="flex items-center gap-2">
                            <Checkbox
                              checked={(editData?.interests || []).includes(interest)}
                              onCheckedChange={() => handleArrayChange('interests', interest)}
                            />
                            <span className="text-sm">{interest}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Profile About</label>
                      <Textarea
                        value={editData?.profileAbout || ''}
                        onChange={(e) => handleInputChange('profileAbout', e.target.value)}
                        className="min-h-20"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Location Tab */}
                <TabsContent value="location" className="space-y-6">
                  <div className="border p-4 rounded-md">
                    <h3 className="font-medium mb-4 text-lg">Present Residential Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                        <Input
                          value={editData?.presentResidentialAddress?.country || ''}
                          onChange={(e) => handleNestedChange('presentResidentialAddress', 'country', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                        <Input
                          value={editData?.presentResidentialAddress?.state || ''}
                          onChange={(e) => handleNestedChange('presentResidentialAddress', 'state', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <Input
                          value={editData?.presentResidentialAddress?.city || ''}
                          onChange={(e) => handleNestedChange('presentResidentialAddress', 'city', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
                        <Input
                          value={editData?.presentResidentialAddress?.street || ''}
                          onChange={(e) => handleNestedChange('presentResidentialAddress', 'street', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
                        <Input
                          value={editData?.presentResidentialAddress?.area || ''}
                          onChange={(e) => handleNestedChange('presentResidentialAddress', 'area', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Landmark</label>
                        <Input
                          value={editData?.presentResidentialAddress?.landmark || ''}
                          onChange={(e) => handleNestedChange('presentResidentialAddress', 'landmark', e.target.value)}
                          placeholder="Enter nearby landmark"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                        <Input
                          value={editData?.presentResidentialAddress?.pincode || ''}
                          onChange={(e) => handleNestedChange('presentResidentialAddress', 'pincode', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border p-4 rounded-md">
                    <h3 className="font-medium mb-4 text-lg">Native Place Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                        <Input
                          value={editData?.nativePlaceAddress?.country || ''}
                          onChange={(e) => handleNestedChange('nativePlaceAddress', 'country', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                        <Input
                          value={editData?.nativePlaceAddress?.state || ''}
                          onChange={(e) => handleNestedChange('nativePlaceAddress', 'state', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <Input
                          value={editData?.nativePlaceAddress?.city || ''}
                          onChange={(e) => handleNestedChange('nativePlaceAddress', 'city', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
                        <Input
                          value={editData?.nativePlaceAddress?.street || ''}
                          onChange={(e) => handleNestedChange('nativePlaceAddress', 'street', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
                        <Input
                          value={editData?.nativePlaceAddress?.area || ''}
                          onChange={(e) => handleNestedChange('nativePlaceAddress', 'area', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Landmark</label>
                        <Input
                          value={editData?.nativePlaceAddress?.landmark || ''}
                          onChange={(e) => handleNestedChange('nativePlaceAddress', 'landmark', e.target.value)}
                          placeholder="Enter nearby landmark"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                        <Input
                          value={editData?.nativePlaceAddress?.pincode || ''}
                          onChange={(e) => handleNestedChange('nativePlaceAddress', 'pincode', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Media Tab */}
                <TabsContent value="media" className="space-y-6">
                  {/* Profile Picture */}
                  <div className="border p-4 rounded-md">
                    <h3 className="font-medium mb-4 text-lg flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Profile Picture
                    </h3>
                    <div className="flex items-start gap-6">
                      <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50">
                        {data?.profilePicture?.url ? (
                          <img
                            src={data.profilePicture.url}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-400 text-sm text-center px-2">No photo</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-3">
                          Upload a profile picture for this user. Max size: 5MB. Supported formats: JPG, PNG.
                        </p>
                        <label className="cursor-pointer">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={uploadingProfilePicture}
                            className="relative"
                            asChild
                          >
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              {uploadingProfilePicture ? 'Uploading...' : 'Upload Profile Picture'}
                              <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept="image/*"
                                onChange={handleProfilePictureUpload}
                                disabled={uploadingProfilePicture}
                              />
                            </span>
                          </Button>
                        </label>
                        {data?.profilePicture?.uploadedAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            Uploaded: {new Date(data.profilePicture.uploadedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Gallery Photos */}
                  <div className="border p-4 rounded-md">
                    <h3 className="font-medium mb-4 text-lg flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Gallery Photos ({data?.gallery?.photos?.length || 0}/10)
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Manage gallery photos for this user. Maximum 10 photos allowed. Max size: 5MB each.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                      {data?.gallery?.photos?.map((photo, index) => (
                        <div key={index} className="relative group">
                          <div className="w-full aspect-square rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={photo.url}
                              alt={`Gallery ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            onClick={() => handleDeleteGalleryPhoto(index)}
                            disabled={deletingPhotoIndex === index}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                            title="Delete photo"
                          >
                            {deletingPhotoIndex === index ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      ))}

                      {/* Add Photo Button */}
                      {(data?.gallery?.photos?.length || 0) < 10 && (
                        <label className="cursor-pointer">
                          <div className="w-full aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                            {uploadingGalleryPhoto ? (
                              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                            ) : (
                              <>
                                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                <span className="text-xs text-gray-500">Add Photo</span>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleGalleryPhotoUpload}
                            disabled={uploadingGalleryPhoto}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Horoscope Document */}
                  <div className="border p-4 rounded-md">
                    <h3 className="font-medium mb-4 text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Horoscope Document
                    </h3>
                    <div className="flex items-start gap-6">
                      <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50">
                        {data?.horoscopeDocument?.url ? (
                          data.horoscopeDocument.fileType === 'pdf' ? (
                            <div className="text-center">
                              <FileText className="h-10 w-10 text-red-500 mx-auto" />
                              <span className="text-xs text-gray-500 mt-1 block">PDF</span>
                            </div>
                          ) : (
                            <img
                              src={data.horoscopeDocument.url}
                              alt="Horoscope"
                              className="w-full h-full object-cover"
                            />
                          )
                        ) : (
                          <span className="text-gray-400 text-sm text-center px-2">No document</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-3">
                          Upload horoscope document. Max size: 5MB. Supported formats: PDF, JPG, PNG.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <label className="cursor-pointer">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={uploadingHoroscope}
                              className="relative"
                              asChild
                            >
                              <span>
                                <Upload className="h-4 w-4 mr-2" />
                                {uploadingHoroscope ? 'Uploading...' : 'Upload Horoscope'}
                                <input
                                  type="file"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  accept="image/*,.pdf"
                                  onChange={handleHoroscopeUpload}
                                  disabled={uploadingHoroscope}
                                />
                              </span>
                            </Button>
                          </label>
                          {data?.horoscopeDocument?.url && (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleDownloadHoroscope(userId)}
                              >
                                Download
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeleteHoroscope}
                                disabled={deletingHoroscope}
                              >
                                {deletingHoroscope ? 'Deleting...' : 'Delete'}
                              </Button>
                            </>
                          )}
                        </div>
                        {data?.horoscopeDocument?.uploadedAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            Uploaded: {new Date(data.horoscopeDocument.uploadedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-3 justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsEditMode(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-primary text-primary-foreground"
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          // View Mode
          <>
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <p className="text-gray-900 font-medium">{displayValue(user.fullName)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <p className="text-gray-900">{displayValue(user.email)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                    <p className="text-gray-900">{displayValue(user.mobileNumber)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Mobile</label>
                    <p className="text-gray-900">{displayValue(user.alternateMobileNumber)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age Preference</label>
                    <p className="text-gray-900">
                      {user.ageFrom && user.ageTo ? `${user.ageFrom} - ${user.ageTo} years` : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Birth Details */}
            <Card>
              <CardHeader>
                <CardTitle>Birth Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                    <p className="text-gray-900">
                      {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time of Birth</label>
                    <p className="text-gray-900">
                      {user.timeOfBirth ? (() => {
                        const [hours, minutes] = user.timeOfBirth.split(':');
                        const hour = parseInt(hours);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const hour12 = hour % 12 || 12;
                        return `${hour12}:${minutes} ${ampm}`;
                      })() : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Place of Birth</label>
                    <p className="text-gray-900">{displayValue(user.placeOfBirth)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Star (Nakshatra)</label>
                    <p className="text-gray-900">{displayValue(user.nakshatra)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Raasi</label>
                    <p className="text-gray-900">{displayValue(user.raasi)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shuddha Jathakam</label>
                    <p className="text-gray-900">{displayValue(user.shuddhaJathakam)}</p>
                  </div>
                  {user?.doshamTypes && user.doshamTypes.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Dosham Types</label>
                      <div className="flex flex-wrap gap-2">
                        {user.doshamTypes.map((dosham, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {dosham}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {user?.horoscopeDocument?.url && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Horoscope Document</label>
                      <div className="flex gap-3">
                        <a
                          href={user.horoscopeDocument.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-secondary underline text-sm hover:text-secondary/80"
                        >
                          View
                        </a>
                        <button
                          onClick={() => handleDownloadHoroscope(userId)}
                          className="text-secondary underline text-sm cursor-pointer bg-transparent border-0 p-0 hover:text-secondary/80"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Profile Details */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <p className="text-gray-900 capitalize">{displayValue(user.gender)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Seeking Gender</label>
                    <p className="text-gray-900 capitalize">{displayValue(user.seekingGender)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
                    <p className="text-gray-900">{displayValue(user.maritalStatus)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mother Tongue</label>
                    <p className="text-gray-900">{displayValue(user.motherTongue)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                    <p className="text-gray-900">{displayValue(user.height)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                    <p className="text-gray-900">{displayValue(user.weight)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Complexion</label>
                    <p className="text-gray-900">{displayValue(user.complexion)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Physical Status</label>
                    <p className="text-gray-900">{displayValue(user.physicalStatus)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                    <p className="text-gray-900">{displayValue(user.bloodGroup)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Diet</label>
                    <p className="text-gray-900">{displayValue(user.diet)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
                    <p className="text-gray-900">{displayValue(user.religion)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Caste</label>
                    <p className="text-gray-900">{displayValue(user.caste)}</p>
                  </div>
                  {user?.languagesKnown && user.languagesKnown.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Languages Known</label>
                      <div className="flex flex-wrap gap-2">
                        {user.languagesKnown.map((language, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {user?.profileBanner?.bannerColor && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Profile Banner Color</label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-md border border-gray-300"
                          style={{ backgroundColor: user.profileBanner.bannerColor }}
                        />
                        <span className="text-gray-900 text-sm">{user.profileBanner.bannerColor}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                    <p className="text-gray-900">{displayValue(user.education)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                    <p className="text-gray-900">{displayValue(user.occupation)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                    <p className="text-gray-900">{displayValue(user.employmentType)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Annual Income</label>
                    <p className="text-gray-900">
                      {user.annualIncome?.displayText || `${user.annualIncome?.currency || 'INR'} ${user.annualIncome?.min || 0} - ${user.annualIncome?.max || 0}` || '-'}
                    </p>
                  </div>
                  {/* Removed root Country/State/City display */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Professional Additional Info</label>
                    <p className="text-gray-900">{displayValue(user.professionalAdditionalInfo)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Family & Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Family & Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Family Status</label>
                    <p className="text-gray-900">{displayValue(user.familyStatus)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Residential Status</label>
                    <p className="text-gray-900">{displayValue(user.residentialStatus)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Father Name</label>
                    <p className="text-gray-900">{displayValue(user.fatherName)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Father Occupation</label>
                    <p className="text-gray-900">{displayValue(user.fatherOccupation)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mother Name</label>
                    <p className="text-gray-900">{displayValue(user.motherName)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mother Occupation</label>
                    <p className="text-gray-900">{displayValue(user.motherOccupation)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
                    <p className="text-gray-900">{user.interests?.length > 0 ? user.interests.join(', ') : '-'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile About</label>
                    <p className="text-gray-900">{displayValue(user.profileAbout)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Details (View Mode) */}
            <Card>
              <CardHeader>
                <CardTitle>Address Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-secondary mb-2">Present Residential Address</h4>
                    <p className="text-gray-900">
                      {[
                        user.presentResidentialAddress?.street,
                        user.presentResidentialAddress?.area,
                        user.presentResidentialAddress?.landmark,
                        user.presentResidentialAddress?.city,
                        user.presentResidentialAddress?.state,
                        user.presentResidentialAddress?.country,
                        user.presentResidentialAddress?.pincode,
                      ].filter(Boolean).join(', ') || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary mb-2">Native Place Address</h4>
                    <p className="text-gray-900">
                      {[
                        user.nativePlaceAddress?.street,
                        user.nativePlaceAddress?.area,
                        user.nativePlaceAddress?.landmark,
                        user.nativePlaceAddress?.city,
                        user.nativePlaceAddress?.state,
                        user.nativePlaceAddress?.country,
                        user.nativePlaceAddress?.pincode,
                      ].filter(Boolean).join(', ') || 'Not provided'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gallery Photos */}
            {user?.gallery?.photos && user.gallery.photos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Gallery Photos ({user.gallery.photos.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {user.gallery.photos.map((photo, idx) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={photo.url}
                          alt={`Gallery photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Account Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Account Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Joined Date</p>
                    <p className="text-lg font-semibold">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Profiles Liked</p>
                    <p className="text-lg font-semibold">{user.likedCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Liked By</p>
                    <p className="text-lg font-semibold">{user.likedByCount || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Permanently Delete User?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All user data will be permanently deleted from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogAction
              onClick={() => {
                deleteMutation.mutate();
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Delete User
            </AlertDialogAction>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>

        {/* Deactivate Confirmation Dialog */}
        <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate User?</AlertDialogTitle>
              <AlertDialogDescription>
                This user will not be able to log in or appear in profile searches. They can be reactivated later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogAction
              onClick={() => {
                deactivateMutation.mutate();
                setShowDeactivateDialog(false);
              }}
              className="bg-amber-600 text-white"
            >
              Deactivate
            </AlertDialogAction>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>

        {/* Approval Rejection Dialog */}
        <Dialog open={showApprovalRejectDialog} onOpenChange={setShowApprovalRejectDialog}>
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
                value={approvalRejectionReason}
                onChange={(e) => setApprovalRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                className="min-h-[120px]"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{approvalRejectionReason.length}/500 characters</p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowApprovalRejectDialog(false)}
                disabled={rejectMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectUser}
                disabled={rejectMutation.isPending || !approvalRejectionReason.trim()}
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
