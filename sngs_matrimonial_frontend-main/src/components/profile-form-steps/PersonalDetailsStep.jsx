'use client';

import { useWatch } from 'react-hook-form';
import { useRef } from 'react';
import { format, setMonth, setYear } from 'date-fns';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Check, FileText, X } from 'lucide-react';
import Image from 'next/image';
import { toastError } from '@/lib/toast';
import {
  MOTHER_TONGUES,
  HEIGHTS,
  PHYSICAL_STATUS,
  MARITAL_STATUS,
  RELIGIONS,
  HINDU_CASTES,
  SHUDDHA_JATHAKAM_OPTIONS,
  DOSHAM_TYPES,
  NAKSHATRAS,
  RAASIS,
  COMPLEXION_OPTIONS,
  LANGUAGES_OPTIONS,
  BLOOD_GROUPS,
  DIET_OPTIONS,
} from '@/lib/constants/formData';
import { MultiSelect } from '@/components/ui/multi-select';

export function PersonalDetailsStep({ form, user, userProfile, horoscope, onFileUpdate, onDeleteHoroscope }) {
  const watchReligion = useWatch({ control: form.control, name: 'religion' });
  const watchShuddhaJathakam = useWatch({ control: form.control, name: 'shuddhaJathakam' });
  const displayDate = form.watch('dateOfBirth');
  const horoscopeInputRef = useRef(null);

  // Helper function to check if horoscope document has a valid URL
  const hasValidHoroscopeUrl = (doc) => doc?.url && doc.url.trim() !== '';
  const existingHoroscopeDoc = hasValidHoroscopeUrl(user?.horoscopeDocument)
    ? user.horoscopeDocument
    : hasValidHoroscopeUrl(userProfile?.horoscopeDocument)
      ? userProfile.horoscopeDocument
      : null;

  const handleHoroscopeUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      toastError('Horoscope file must be under 5 MB');
      return;
    }

    const fileType = file.type === 'application/pdf' ? 'pdf' : 'image';
    const preview = fileType === 'pdf' ? null : URL.createObjectURL(file);

    onFileUpdate('horoscope', {
      file,
      preview,
      fileType,
      fileName: file.name,
      fileSize: file.size,
    });
  };

  const removeHoroscope = () => {
    if (horoscope?.preview) {
      URL.revokeObjectURL(horoscope.preview);
    }
    onFileUpdate('horoscope', null);
    if (horoscopeInputRef.current) {
      horoscopeInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-viga text-xl text-secondary">Personal & Religious Details</h2>

      {/* Date of Birth */}
      <FormField
        control={form.control}
        name="dateOfBirth"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">Date of Birth</FormLabel>
            <div className="grid grid-cols-3 gap-2">
              <Select value={displayDate ? displayDate.getDate().toString().padStart(2, '0') : ''} onValueChange={(day) => {
                const baseDate = displayDate || new Date(new Date().getFullYear() - 25, 0, 1);
                const newDate = new Date(baseDate);
                newDate.setDate(parseInt(day, 10));
                field.onChange(newDate);
              }}>
                <FormControl>
                  <SelectTrigger className="font-maven">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <SelectItem key={day} value={day.toString().padStart(2, '0')}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={displayDate ? (displayDate.getMonth() + 1).toString().padStart(2, '0') : ''} onValueChange={(month) => {
                const baseDate = displayDate || new Date(new Date().getFullYear() - 25, 0, 1);
                const newDate = setMonth(baseDate, parseInt(month, 10) - 1);
                field.onChange(newDate);
              }}>
                <FormControl>
                  <SelectTrigger className="font-maven">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
                    <SelectItem key={month} value={(idx + 1).toString().padStart(2, '0')}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={displayDate ? displayDate.getFullYear().toString() : ''} onValueChange={(year) => {
                const baseDate = displayDate || new Date(parseInt(year, 10), 0, 1);
                const newDate = setYear(baseDate, parseInt(year, 10));
                field.onChange(newDate);
              }}>
                <FormControl>
                  <SelectTrigger className="font-maven">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.from({ length: 73 }, (_, i) => 2024 - i).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Time of Birth */}
      <FormItem>
        <FormLabel className="font-maven">Time of Birth (Optional)</FormLabel>
        <div className="grid grid-cols-3 gap-2">
          {/* Hours Dropdown */}
          <FormField
            control={form.control}
            name="timeOfBirth_hours"
            render={({ field }) => (
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="font-maven">
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                    <SelectItem key={hour} value={hour.toString().padStart(2, '0')}>
                      {hour.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          {/* Minutes Dropdown */}
          <FormField
            control={form.control}
            name="timeOfBirth_minutes"
            render={({ field }) => (
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="font-maven">
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.from({ length: 60 }, (_, i) => i).map(minute => (
                    <SelectItem key={minute} value={minute.toString().padStart(2, '0')}>
                      {minute.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          {/* AM/PM Dropdown */}
          <FormField
            control={form.control}
            name="timeOfBirth_meridiem"
            render={({ field }) => (
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="font-maven">
                    <SelectValue placeholder="AM/PM" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <FormMessage />
      </FormItem>

      {/* Place of Birth */}
      <FormField
        control={form.control}
        name="placeOfBirth"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">Place of Birth (Optional)</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter place of birth"
                maxLength={100}
                className="font-maven"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Mother Tongue */}
      <FormField
        control={form.control}
        name="motherTongue"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">Mother Tongue</FormLabel>
            <Select value={field.value || ''} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="font-maven">
                  <SelectValue placeholder="Select mother tongue" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="font-maven font-semibold">Frequently Selected</SelectLabel>
                  {MOTHER_TONGUES.frequentlySelected.map(tongue => (
                    <SelectItem key={tongue} value={tongue}>
                      {tongue}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel className="font-maven font-semibold">More Options</SelectLabel>
                  {MOTHER_TONGUES.moreOptions.map(tongue => (
                    <SelectItem key={tongue} value={tongue}>
                      {tongue}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Languages Known */}
      <FormField
        control={form.control}
        name="languagesKnown"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">Languages Known (Optional)</FormLabel>
            <FormControl>
              <MultiSelect
                options={LANGUAGES_OPTIONS}
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Select languages"
                maxSelections={10}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Complexion */}
      <FormField
        control={form.control}
        name="complexion"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">Complexion (Optional)</FormLabel>
            <Select value={field.value || ''} onValueChange={(val) => field.onChange(val || null)}>
              <FormControl>
                <SelectTrigger className="font-maven">
                  <SelectValue placeholder="Select complexion" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {COMPLEXION_OPTIONS.map(complexion => (
                  <SelectItem key={complexion} value={complexion}>
                    {complexion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Gender and Seeking */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-maven">Gender</FormLabel>
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="font-maven">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="seekingGender"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-maven">Seeking</FormLabel>
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="font-maven">
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Height and Weight */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="height"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-maven">Height</FormLabel>
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="font-maven">
                    <SelectValue placeholder="Select height" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {HEIGHTS.map(height => (
                    <SelectItem key={height} value={height}>
                      {height}
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
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-maven">Weight (kg, Optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  type="number"
                  placeholder="e.g., 70"
                  className="font-maven w-24"
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Blood Group and Diet */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="bloodGroup"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-maven">Blood Group (Optional)</FormLabel>
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="font-maven">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BLOOD_GROUPS.map(group => (
                    <SelectItem key={group} value={group}>
                      {group}
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
          name="diet"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-maven">Diet (Optional)</FormLabel>
              <Select value={field.value || ''} onValueChange={(val) => field.onChange(val || undefined)}>
                <FormControl>
                  <SelectTrigger className="font-maven">
                    <SelectValue placeholder="Select diet preference" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DIET_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Physical Status - Pill Buttons */}
      <FormField
        control={form.control}
        name="physicalStatus"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">Physical Status</FormLabel>
            <FormControl>
              <div className="flex flex-wrap gap-2">
                {PHYSICAL_STATUS.map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => field.onChange(status)}
                    className={`px-4 py-2 rounded-full font-telex font-semibold transition-all ${
                      field.value === status
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-100 text-secondary border-2 border-gray-200 hover:border-primary'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Marital Status - Pill Buttons */}
      <FormField
        control={form.control}
        name="maritalStatus"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">Marital Status</FormLabel>
            <FormControl>
              <div className="flex flex-wrap gap-2">
                {MARITAL_STATUS.map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => field.onChange(status)}
                    className={`px-4 py-2 rounded-full font-telex font-semibold transition-all ${
                      field.value === status
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-100 text-secondary border-2 border-gray-200 hover:border-primary'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Religion */}
      <FormField
        control={form.control}
        name="religion"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">Religion</FormLabel>
            <Select value={field.value || ''} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="font-maven">
                  <SelectValue placeholder="Select religion" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {RELIGIONS.map(religion => (
                  <SelectItem key={religion} value={religion}>
                    {religion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Caste - Only for Hindu */}
      {watchReligion === 'Hindu' && (
        <FormField
          control={form.control}
          name="caste"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-maven">Caste</FormLabel>
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="font-maven">
                    <SelectValue placeholder="Select caste" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {HINDU_CASTES.map(caste => (
                    <SelectItem key={caste} value={caste}>
                      {caste}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Shuddha Jathakam - Only for Hindu */}
      {watchReligion === 'Hindu' && (
        <FormField
          control={form.control}
          name="shuddhaJathakam"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-maven">Shuddha Jathakam</FormLabel>
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="font-maven">
                    <SelectValue placeholder="Select shuddha jathakam option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SHUDDHA_JATHAKAM_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Dosham Types - Only for Hindu if Shuddha Jathakam is 'No' */}
      {watchReligion === 'Hindu' && watchShuddhaJathakam === 'No' && (
        <FormField
          control={form.control}
          name="doshamTypes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-maven">Dosham Types</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  {DOSHAM_TYPES.map(dosham => (
                    <div key={dosham} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={dosham}
                        checked={field.value?.includes(dosham) || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const newValue = checked
                            ? [...(field.value || []), dosham]
                            : (field.value || []).filter(item => item !== dosham);
                          field.onChange(newValue);
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <label htmlFor={dosham} className="font-maven text-secondary cursor-pointer">
                        {dosham}
                      </label>
                    </div>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Nakshatra */}
      <FormField
        control={form.control}
        name="nakshatra"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">Nakshatra *</FormLabel>
            <Select value={field.value || ''} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="font-maven">
                  <SelectValue placeholder="Select nakshatra" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {NAKSHATRAS.map(nakshatra => (
                  <SelectItem key={nakshatra} value={nakshatra}>
                    {nakshatra}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Raasi */}
      <FormField
        control={form.control}
        name="raasi"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">Raasi (Optional)</FormLabel>
            <Select value={field.value || ''} onValueChange={(val) => field.onChange(val || null)}>
              <FormControl>
                <SelectTrigger className="font-maven">
                  <SelectValue placeholder="Select raasi" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {RAASIS.map(raasi => (
                  <SelectItem key={raasi} value={raasi}>
                    {raasi}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Horoscope Document - Hindu Only */}
      {watchReligion === 'Hindu' && (
        <div className="col-span-2 space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="font-viga text-secondary text-sm">
            Horoscope Document (Optional)
          </h3>
          <p className="font-maven text-xs text-gray-500">
            Accepted formats: PDF, JPEG, PNG. Maximum size: 5 MB
          </p>

          <Input
            ref={horoscopeInputRef}
            type="file"
            accept=".pdf,image/jpeg,image/png"
            onChange={handleHoroscopeUpload}
            className="font-maven cursor-pointer"
          />

          {/* Show existing horoscope if uploaded */}
          {existingHoroscopeDoc && !horoscope && (
            <div className="relative flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              {existingHoroscopeDoc.fileType === 'pdf' ? (
                <FileText className="text-red-500" size={32} />
              ) : (
                <div className="relative w-32 h-32 rounded overflow-hidden">
                  <Image
                    src={existingHoroscopeDoc.url}
                    alt="Current horoscope"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <p className="font-maven text-sm font-medium">
                  Current Horoscope Document
                </p>
                <p className="font-telex text-xs text-gray-500">
                  Uploaded {existingHoroscopeDoc.uploadedAt ? new Date(existingHoroscopeDoc.uploadedAt).toLocaleDateString() : 'Previously'}
                </p>
              </div>
              {onDeleteHoroscope && (
                <button
                  type="button"
                  onClick={onDeleteHoroscope}
                  className="p-1.5 hover:bg-red-50 rounded-full transition"
                  title="Delete horoscope document"
                >
                  <X className="text-red-500" size={20} />
                </button>
              )}
            </div>
          )}

          {horoscope && (
            <div className="relative flex items-center gap-3 p-3 bg-white border border-primary rounded-lg">
              {horoscope.fileType === 'pdf' ? (
                <FileText className="text-red-500" size={32} />
              ) : (horoscope.preview || horoscope.url) ? (
                <div className="relative w-32 h-32 rounded overflow-hidden">
                  <Image
                    src={horoscope.preview || horoscope.url}
                    alt="Horoscope preview"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div className="flex-1">
                <p className="font-maven text-sm font-medium truncate">
                  {horoscope.fileName || 'Horoscope Document'}
                </p>
                <p className="font-telex text-xs text-gray-500">
                  {horoscope.fileSize ? `${(horoscope.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Existing Upload'}
                </p>
              </div>
              <button
                type="button"
                onClick={removeHoroscope}
                className="p-1.5 hover:bg-red-50 rounded-full transition"
              >
                <X className="text-red-500" size={20} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
