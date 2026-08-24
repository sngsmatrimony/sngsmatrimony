'use client';

import { useState, useEffect, useRef } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { X, FileText, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import { toastSuccess, toastError, toastWarning } from '@/lib/toast';

const INTERESTS = [
  'Painting', 'Coding', 'Poetry', 'Reading', 'Writing', 'Photography',
  'Music', 'Dancing', 'Cooking', 'Traveling', 'Gardening', 'Sports',
  'Fitness', 'Yoga', 'Meditation', 'Gaming', 'Movies', 'Theater', 'Volunteering', 'Fashion',
];

const PROFILE_BANNER_COLORS = [
  { value: '#FFB3BA', label: 'Pastel Rose', name: 'rose' },
  { value: '#FFFFBA', label: 'Pastel Vanilla', name: 'vanilla' },
  { value: '#BAE1FF', label: 'Pastel Sky', name: 'sky' },
  { value: '#BAFFC9', label: 'Pastel Mint', name: 'mint' },
  { value: '#E0BBE4', label: 'Pastel Lilac', name: 'lilac' },
  { value: '#FFDFD3', label: 'Pastel Coral', name: 'coral' },
  { value: '#D4F1F4', label: 'Pastel Cyan', name: 'cyan' },
  { value: '#F8B4D8', label: 'Pastel Mauve', name: 'mauve' },
  { value: '#C7CEEA', label: 'Pastel Periwinkle', name: 'periwinkle' },
  { value: '#FFEAA7', label: 'Pastel Butter', name: 'butter' },
];

export function PreferencesMediaStep({
  form,
  userProfile = null,
  profilePicture = null,
  galleryPhotos = [],
  onFileUpdate = null,
  user = null
}) {
  const { user: authUser } = useAuthStore();
  const hasInitialized = useRef(false);
  const profilePictureInputRef = useRef(null);
  const galleryPhotosInputRef = useRef(null);

  // Fallback local state when onFileUpdate is not provided (backward compatibility)
  const [localProfilePicture, setLocalProfilePicture] = useState(null);
  const [localGalleryPhotos, setLocalGalleryPhotos] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize with existing media on mount (only once)
  useEffect(() => {
    if (!onFileUpdate || hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

    // Profile picture from userProfile or authUser
    if (userProfile?.profilePicture?.url || authUser?.profilePicture?.url) {
      const profilePic = userProfile?.profilePicture?.url || authUser?.profilePicture?.url;
      onFileUpdate('profilePicture', {
        preview: profilePic,
        existing: true,
      });
    }

    // Gallery photos from userProfile
    if (userProfile?.gallery?.photos && Array.isArray(userProfile.gallery.photos) && userProfile.gallery.photos.length > 0) {
      const existingPhotos = userProfile.gallery.photos.map(photo => ({
        preview: photo.url,
        existing: true,
      }));
      onFileUpdate('galleryPhotos', existingPhotos);
    }

  }, [onFileUpdate, userProfile, authUser]);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);

    // Use parent state if available, otherwise use local state
    const currentPhotos = onFileUpdate
      ? (galleryPhotos || []).length
      : localGalleryPhotos.length;

    if (currentPhotos + files.length > 10) {
      toastWarning('Maximum 10 photos allowed');
      return;
    }

    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    if (onFileUpdate) {
      onFileUpdate('galleryPhotos', [...(galleryPhotos || []), ...newPhotos]);
    } else {
      setLocalGalleryPhotos(prev => [...prev, ...newPhotos]);
    }

    // Reset input to allow selecting the same file again
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleProfilePictureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const pictureData = {
      file,
      preview: URL.createObjectURL(file)
    };

    console.log('[PreferencesMediaStep] Profile picture selected:', file.name, pictureData);

    if (onFileUpdate) {
      console.log('[PreferencesMediaStep] Calling onFileUpdate for profilePicture');
      onFileUpdate('profilePicture', pictureData);
    } else {
      console.log('[PreferencesMediaStep] Using local state for profilePicture');
      setLocalProfilePicture(pictureData);
    }

    // Reset input to allow selecting a different file
    if (e.target) {
      e.target.value = '';
    }
  };

  const removePhoto = async (index) => {
    const photos = onFileUpdate ? galleryPhotos : localGalleryPhotos;
    const photo = photos?.[index];

    if (!photo) return;

    setIsDeleting(true);

    try {
      // If it's an existing photo (already on server), delete from backend
      if (photo.existing) {
        console.log('[PreferencesMediaStep] Deleting existing photo at index:', index);
        const result = await useAuthStore.getState().deletePhoto(index);
        if (!result.success) {
          console.error('[PreferencesMediaStep] Failed to delete photo:', result.error);
          toastError('Failed to delete photo: ' + result.error);
          return;
        }
        console.log('[PreferencesMediaStep] Photo deleted successfully');
      }

      // Remove from local state (works for both new and existing after API call)
      if (onFileUpdate) {
        const newPhotos = photos.filter((_, i) => i !== index);
        onFileUpdate('galleryPhotos', newPhotos);
      } else {
        setLocalGalleryPhotos(prev => prev.filter((_, i) => i !== index));
      }
    } catch (err) {
      console.error('[PreferencesMediaStep] Error removing photo:', err);
      toastError('Failed to delete photo');
    } finally {
      setIsDeleting(false);
    }
  };

  const removeProfilePicture = () => {
    if (onFileUpdate) {
      onFileUpdate('profilePicture', null);
    } else {
      setLocalProfilePicture(null);
    }
  };


  return (
    <div className="space-y-6">
      {/* <h2 className="font-viga text-xl text-secondary">Preferences & Media</h2> */}

      {/* Age Range */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="ageFrom"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-maven">Preferred Age From</FormLabel>
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="font-maven">
                    <SelectValue placeholder="Select minimum age" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.from({ length: 73 }, (_, i) => 18 + i).map(age => (
                    <SelectItem key={age} value={age.toString()}>
                      {age}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ageTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-maven">Preferred Age To</FormLabel>
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="font-maven">
                    <SelectValue placeholder="Select maximum age" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.from({ length: 73 }, (_, i) => 18 + i).map(age => (
                    <SelectItem key={age} value={age.toString()}>
                      {age}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Interests */}
      <FormField
        control={form.control}
        name="interests"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">Interests (Optional)</FormLabel>
            <FormControl>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {INTERESTS.map(interest => (
                  <div key={interest} className="flex items-center space-x-2">
                    <Checkbox
                      checked={field.value?.includes(interest) || false}
                      onCheckedChange={(checked) => {
                        const newValue = checked
                          ? [...(field.value || []), interest]
                          : (field.value || []).filter(i => i !== interest);
                        field.onChange(newValue);
                      }}
                      id={interest}
                    />
                    <label htmlFor={interest} className="font-maven text-secondary cursor-pointer text-sm">
                      {interest}
                    </label>
                  </div>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* About Myself */}
      <FormField
        control={form.control}
        name="profileAbout"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">About Myself (Optional)</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Tell us about yourself"
                className="font-maven min-h-32"
                maxLength={1000}
              />
            </FormControl>
            <div className="text-sm mt-2 text-muted-foreground">
              {field.value?.length || 0}/1000 characters
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Profile Picture */}
      <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
        <h3 className="font-maven font-semibold text-secondary">Profile Picture</h3>
        <Input
          ref={profilePictureInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleProfilePictureUpload}
          className="font-maven"
        />
        <p className="text-xs text-gray-500 font-maven">
          Accepted formats: JPEG, PNG. Maximum size: 10 MB
        </p>
        {(onFileUpdate ? profilePicture : localProfilePicture) && (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden group">
            <Image
              src={(onFileUpdate ? profilePicture : localProfilePicture).preview}
              alt="Profile"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => removeProfilePicture()}
              disabled={isDeleting}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Profile Banner */}
      <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
        <FormField
          control={form.control}
          name="profileBannerColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-maven font-semibold text-secondary text-base">Profile Banner Color</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {PROFILE_BANNER_COLORS.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => field.onChange(color.value)}
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        field.value === color.value ? 'border-secondary scale-110' : 'border-gray-300 hover:border-secondary/50'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Gallery Photos */}
      <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
        <h3 className="font-maven font-semibold text-secondary">Gallery Photos (Max 10)</h3>
        <Input
          ref={galleryPhotosInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png"
          onChange={handlePhotoUpload}
          className="font-maven"
        />
        <p className="text-xs text-gray-500 font-maven">
          Accepted formats: JPEG, PNG. Maximum size: 10 MB per photo
        </p>
        {((onFileUpdate ? galleryPhotos : localGalleryPhotos) || []).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {((onFileUpdate ? galleryPhotos : localGalleryPhotos) || []).map((photo, idx) => {
              // Ensure photo has preview property
              const previewSrc = photo.preview || (photo.file ? URL.createObjectURL(photo.file) : null);
              if (!previewSrc) return null;

              return (
                <div key={idx} className="relative group">
                  <Image
                    src={previewSrc}
                    alt={`Photo ${idx + 1}`}
                    width={100}
                    height={100}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    disabled={isDeleting}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-sm text-secondary font-maven">{((onFileUpdate ? galleryPhotos : localGalleryPhotos) || []).length}/10 photos added</p>
      </div>

    </div>
  );
}
