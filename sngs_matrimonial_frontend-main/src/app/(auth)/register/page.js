'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import client from '@/lib/api/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/store/authStore';
import { toastSuccess, toastError } from '@/lib/toast';
import { convertTo24Hour, buildTimeFromDropdowns } from '@/lib/time';
import { MONTHS } from '@/lib/constants/formData';
import {
  PersonalDetailsStep,
  LocationAddressStep,
  ProfessionalDetailsStep,
  FamilyDetailsStep,
  PreferencesMediaStep,
} from '@/components/profile-form-steps';

// Step 1: Account Creation (unique to register)
const step1Schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/\d/, 'Must contain number'),
  confirmPassword: z.string(),
  mobileNumber: z.string().min(1, 'Mobile number is required').regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number (starting with 6-9)'),
  alternateMobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number (starting with 6-9)').optional().or(z.literal('')),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Reuse schemas from EditProfileForm
const step2Schema = z.object({
  dateOfBirth: z.date(),
  timeOfBirth: z.string()
    .regex(/^(0?[0-9]|1[0-2]):([0-5][0-9])\s(AM|PM)$/i, 'Invalid time format. Use HH:MM AM/PM')
    .optional()
    .or(z.literal('')),
  motherTongue: z.string().min(1),
  height: z.string().min(1),
  physicalStatus: z.string().min(1),
  maritalStatus: z.string().min(1),
  gender: z.string().min(1),
  seekingGender: z.string().min(1),
  religion: z.string().min(1),
  caste: z.string().optional(),
  shuddhaJathakam: z.string().optional(),
  doshamTypes: z.array(z.string()).optional().default([]),
  nakshatra: z.string().min(1, 'Please select your nakshatra'),
  raasi: z.string().optional().nullable(),
  languagesKnown: z.array(z.string()).max(10, 'Maximum 10 languages').optional().default([]),
  placeOfBirth: z.string().max(100, 'Maximum 100 characters').optional().or(z.literal('')),
  complexion: z.enum(['Very Fair', 'Fair', 'Wheatish', 'Wheatish Brown', 'Dark', 'Very Dark'], {
    errorMap: () => ({ message: 'Please select your complexion' })
  }).optional().or(z.literal('')),
  weight: z.number().nullable().optional(),
  bloodGroup: z.string().optional(),
  diet: z.enum(['Vegetarian', 'Non-Vegetarian', 'Eggetarian'], {
    errorMap: () => ({ message: 'Please select your diet preference' })
  }).optional().or(z.literal('')),
});

const step3Schema = z.object({
  presentResidentialAddress: z.object({
    country: z.string().min(1, 'Please select your country'),
    state: z.string().optional(),
    city: z.string().optional(),
    street: z.string().optional(),
    area: z.string().optional(),
    landmark: z.string().optional(),
    pincode: z.string().optional(),
  }),
  nativePlaceAddress: z.object({
    country: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    street: z.string().optional(),
    area: z.string().optional(),
    landmark: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
});

const step4Schema = z.object({
  education: z.string().min(1, 'Please select your education'),
  employmentType: z.string().min(1, 'Please select your employment type'),
  occupation: z.string().min(1, 'Please select your occupation'),
  annualIncomeCurrency: z.string().min(1, 'Please select your currency'),
  annualIncomeAmount: z.string().min(1, 'Please select your income amount'),
  professionalAdditionalInfo: z.string().max(500, 'Maximum 500 characters').optional().or(z.literal('')),
});

const step5Schema = z.object({
  fatherName: z.string().min(1, "Father's name is required"),
  fatherOccupation: z.string().optional(),
  motherName: z.string().min(1, "Mother's name is required"),
  motherOccupation: z.string().optional(),
  residentialStatus: z.string().optional(),
  familyStatus: z.string().min(1, 'Please select your family status'),
});

const step6Schema = z.object({
  ageFrom: z.string()
    .min(1, 'Please select minimum age')
    .refine(val => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 18 && num <= 90;
    }, 'Age from must be between 18 and 90'),
  ageTo: z.string()
    .min(1, 'Please select maximum age')
    .refine(val => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 18 && num <= 90;
    }, 'Age to must be between 18 and 90'),
  interests: z.array(z.string()).optional().default([]),
  profileAbout: z.string().max(1000, 'About must be at most 1000 characters').optional().or(z.literal('')),
  profileBannerColor: z.string().optional(),
}).refine(data => {
  const from = parseInt(data.ageFrom, 10);
  const to = parseInt(data.ageTo, 10);
  return to >= from;
}, {
  message: 'Age to must be greater than or equal to age from',
  path: ['ageTo'],
});

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Email OTP Verification State
  const [emailVerificationStep, setEmailVerificationStep] = useState('input'); // 'input', 'otp', 'verified'
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const [formData, setFormData] = useState({
    // Step 1
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobileNumber: '',
    alternateMobileNumber: '',
    // Step 2-6 will be populated with defaults from shared component
    dateOfBirth: null,
    timeOfBirth_hours: '',
    timeOfBirth_minutes: '',
    timeOfBirth_meridiem: '',
    height: '',
    physicalStatus: '',
    maritalStatus: '',
    gender: '',
    seekingGender: '',
    religion: '',
    caste: '',
    shuddhaJathakam: '',
    doshamTypes: [],
    nakshatra: null,
    raasi: null,
    languagesKnown: [],
    placeOfBirth: '',
    complexion: '',
    // Step 3
    presentResidentialAddress: {
      country: '',
      state: '',
      city: '',
      street: '',
      area: '',
      landmark: '',
      pincode: '',
    },
    nativePlaceAddress: {
      country: '',
      state: '',
      city: '',
      street: '',
      area: '',
      landmark: '',
      pincode: '',
    },
    // Step 4
    education: '',
    employmentType: '',
    occupation: '',
    annualIncomeCurrency: 'INR',
    annualIncomeAmount: '',
    professionalAdditionalInfo: '',
    // Step 5
    fatherName: '',
    fatherOccupation: '',
    motherName: '',
    motherOccupation: '',
    weight: null,
    bloodGroup: '',
    residentialStatus: '',
    familyStatus: '',
    diet: '',
    // Step 6
    ageFrom: '',
    ageTo: '',
    interests: [],
    profileAbout: '',
    profileBannerColor: '#FFB3BA',
    // File uploads
    profilePicture: null,
    galleryPhotos: [],
    horoscope: null,
  });

  const getSchemaForStep = (step) => {
    switch (step) {
      case 1: return step1Schema;
      case 2: return step2Schema;
      case 3: return step3Schema;
      case 4: return step4Schema;
      case 5: return step5Schema;
      case 6: return step6Schema;
      default: return step1Schema;
    }
  };

  const form = useForm({
    resolver: zodResolver(getSchemaForStep(currentStep)),
    defaultValues: formData,
    mode: 'onBlur',
  });

  // Track previous step to only reset form when step changes
  const prevStepRef = useRef(currentStep);

  useEffect(() => {
    if (prevStepRef.current !== currentStep) {
      // Step changed, reset form with current formData
      form.reset(formData);
      prevStepRef.current = currentStep;
    }
  }, [currentStep, form, formData]);

  const handleFileUpdate = useCallback((fileType, fileData) => {
    setFormData(prev => ({
      ...prev,
      [fileType]: fileData
    }));
  }, []);

  const saveCurrentStepData = () => {
    const currentValues = form.getValues();

    // Preserve file state - these are managed separately from react-hook-form
    setFormData(prev => ({
      ...prev,
      ...currentValues,
      // Explicitly preserve file properties (prevent overwriting with undefined)
      profilePicture: prev.profilePicture,
      galleryPhotos: prev.galleryPhotos,
      horoscope: prev.horoscope,
    }));
  };

  const handleBackNavigation = () => {
    // Save current form state before going back
    saveCurrentStepData();

    // Now safe to go back - useEffect will reset with saved data
    setCurrentStep(currentStep - 1);
  };

  const parseIncomeAmount = (currency, amount) => {
    if (currency === 'INR') {
      const inrRanges = {
        '₹1 lakh and below': { min: 0, max: 100000 },
        '₹1-2 lakhs': { min: 100000, max: 200000 },
        '₹2-3 lakhs': { min: 200000, max: 300000 },
        '₹3-4 lakhs': { min: 300000, max: 400000 },
        '₹4-5 lakhs': { min: 400000, max: 500000 },
        '₹5-6 lakhs': { min: 500000, max: 600000 },
        '₹6-7 lakhs': { min: 600000, max: 700000 },
        '₹7-8 lakhs': { min: 700000, max: 800000 },
        '₹8-9 lakhs': { min: 800000, max: 900000 },
        '₹9-10 lakhs': { min: 900000, max: 1000000 },
        '₹10-12 lakhs': { min: 1000000, max: 1200000 },
        '₹12-15 lakhs': { min: 1200000, max: 1500000 },
        '₹15-20 lakhs': { min: 1500000, max: 2000000 },
        '₹20-30 lakhs': { min: 2000000, max: 3000000 },
        '₹30-50 lakhs': { min: 3000000, max: 5000000 },
        '₹50-70 lakhs': { min: 5000000, max: 7000000 },
        '₹70-90 lakhs': { min: 7000000, max: 9000000 },
        '₹90 lakhs - 1 crore': { min: 9000000, max: 10000000 },
        '₹1 crore and above': { min: 10000000, max: 100000000 },
      };
      const range = inrRanges[amount];
      if (range) {
        return { min: range.min, max: range.max, displayText: amount };
      }
    }
    const numAmount = parseInt(amount, 10);
    return { min: numAmount, max: numAmount, displayText: `${currency} ${numAmount.toLocaleString()}` };
  };

  /**
   * Check if email is already registered
   */
  const checkEmailUniqueness = async (email) => {
    try {
      const response = await client.post('/api/auth/register/check-email', {
        email
      });

      return response.data.available;
    } catch (error) {
      console.error('Check email error:', error);
      toastError(error.response?.data?.message || 'Failed to check email');
      return false;
    }
  };

  /**
   * Send OTP to email
   */
  const sendOTP = async () => {
    const email = formData.email;

    if (!email || !z.string().email().safeParse(email).success) {
      toastError('Please enter a valid email address');
      return;
    }

    setOtpLoading(true);

    try {
      // First check if email is unique
      const isUnique = await checkEmailUniqueness(email);
      if (!isUnique) {
        setOtpLoading(false);
        return;
      }

      // Send OTP
      const response = await client.post('/api/auth/register/send-otp', {
        email
      });

      if (response.data.success) {
        toastSuccess('OTP sent to your email');
        setEmailVerificationStep('otp');
        setOtpSent(true);
        startResendTimer();
      } else {
        toastError(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  /**
   * Verify OTP
   */
  const verifyOTP = async () => {
    if (!otpValue || otpValue.length !== 6) {
      toastError('Please enter a valid 6-digit OTP');
      return;
    }

    setOtpLoading(true);

    try {
      const response = await client.post('/api/auth/register/verify-otp', {
        email: formData.email,
        otp: otpValue
      });

      if (response.data.success) {
        toastSuccess('Email verified successfully!');
        // Store the verification token from the response
        setVerificationToken(response.data.verificationToken);
        setEmailVerified(true);
        setEmailVerificationStep('verified');
      } else {
        toastError(response.data.message || 'Invalid OTP');
        setOtpValue('');
      }
    } catch {
      toastError('Failed to verify OTP');
      setOtpValue('');
    } finally {
      setOtpLoading(false);
    }
  };

  /**
   * Start resend timer (60 seconds)
   */
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /**
   * Resend OTP
   */
  const resendOTP = async () => {
    setOtpValue('');
    setVerificationToken(''); // Clear old verification token
    await sendOTP();
  };

  const validateAndProceed = async () => {
    setError('');

    if (currentStep === 6) {
      const isValid = await form.trigger();
      if (!isValid) {
        const errors = form.formState.errors;
        const errorMessages = [];
        Object.entries(errors).forEach(([, error]) => {
          if (error?.message) {
            errorMessages.push(error.message);
          }
        });

        const msg = errorMessages.length > 0
          ? errorMessages.join('\n')
          : 'Please fill in all required fields correctly';

        setError(msg);
        toastError(msg);
        setIsLoading(false);
        return;
      }

      // Get form values and update formData before submission
      const values = form.getValues();
      const updatedFormData = {
        ...formData,
        ...values,
        // Explicitly preserve file properties
        profilePicture: formData.profilePicture,
        galleryPhotos: formData.galleryPhotos,
        horoscope: formData.horoscope,
      };
      setFormData(updatedFormData);
      setIsLoading(true);
      await submitRegistration(updatedFormData);
      return;
    }

    const isValid = await form.trigger();

    if (!isValid) {
      const errors = form.formState.errors;
      const errorMessages = [];
      Object.entries(errors).forEach(([, error]) => {
        if (error?.message) {
          errorMessages.push(error.message);
        }
      });

      const msg = errorMessages.length > 0
        ? errorMessages.join('\n')
        : 'Please fill in all required fields correctly';

      setError(msg);
      toastError(msg);
      return;
    }

    const values = form.getValues();
    setFormData(prev => ({
      ...prev,
      ...values,
      // Explicitly preserve file properties
      profilePicture: prev.profilePicture,
      galleryPhotos: prev.galleryPhotos,
      horoscope: prev.horoscope,
    }));
    setCurrentStep(currentStep + 1);
  };

  const submitRegistration = async (dataToSubmit = null) => {
    const submissionData = dataToSubmit || formData;
    setIsLoading(true);
    setError('');

    try {
      // Build registration payload
      const dob = submissionData.dateOfBirth instanceof Date ? submissionData.dateOfBirth : new Date(submissionData.dateOfBirth);

      // Parse ageFrom and ageTo - ensure they're valid integers
      const ageFromValue = submissionData.ageFrom && submissionData.ageFrom !== ''
        ? parseInt(submissionData.ageFrom, 10)
        : null;
      const ageToValue = submissionData.ageTo && submissionData.ageTo !== ''
        ? parseInt(submissionData.ageTo, 10)
        : null;

      // Validate that values are actual numbers
      const ageFromValid = ageFromValue !== null && !isNaN(ageFromValue) && ageFromValue >= 18 && ageFromValue <= 90;
      const ageToValid = ageToValue !== null && !isNaN(ageToValue) && ageToValue >= 18 && ageToValue <= 90;

      if (!ageFromValid || !ageToValid) {
        const msg = 'Please select valid age preferences (18-90)';
        setError(msg);
        toastError(msg);
        setIsLoading(false);
        return;
      }

      // Log for debugging
      console.log('ageFrom raw:', submissionData.ageFrom, 'parsed:', ageFromValue);
      console.log('ageTo raw:', submissionData.ageTo, 'parsed:', ageToValue);

      // Parse income amount into proper format
      const parsedIncome = parseIncomeAmount(submissionData.annualIncomeCurrency, submissionData.annualIncomeAmount);

      // Build 12-hour time from dropdown selections, then convert to 24-hour
      const timeOfBirthString = buildTimeFromDropdowns(
        submissionData.timeOfBirth_hours,
        submissionData.timeOfBirth_minutes,
        submissionData.timeOfBirth_meridiem
      );
      const timeOfBirth24 = timeOfBirthString ? convertTo24Hour(timeOfBirthString) : '';

      const registrationData = {
        fullName: submissionData.fullName,
        email: submissionData.email,
        password: submissionData.password,
        mobileNumber: submissionData.mobileNumber || '', // Mobile is now optional
        alternateMobileNumber: submissionData.alternateMobileNumber || '',
        verificationToken: verificationToken,
        dateOfBirth: dob.toISOString(),
        timeOfBirth: timeOfBirth24,
        motherTongue: submissionData.motherTongue,
        languagesKnown: submissionData.languagesKnown || [],
        placeOfBirth: submissionData.placeOfBirth || '',
        complexion: submissionData.complexion || '',
        height: submissionData.height,
        physicalStatus: submissionData.physicalStatus,
        maritalStatus: submissionData.maritalStatus,
        gender: submissionData.gender,
        seekingGender: submissionData.seekingGender,
        religion: submissionData.religion,
        caste: submissionData.religion === 'Hindu' ? submissionData.caste : '',
        shuddhaJathakam: submissionData.religion === 'Hindu' ? submissionData.shuddhaJathakam : '',
        doshamTypes: submissionData.shuddhaJathakam === 'No' ? submissionData.doshamTypes : [],
        nakshatra: submissionData.nakshatra || null,
        raasi: submissionData.raasi || null,
        country: submissionData.presentResidentialAddress?.country || '',
        state: submissionData.presentResidentialAddress?.country === 'India'
          ? submissionData.presentResidentialAddress?.state || ''
          : '',
        city: submissionData.presentResidentialAddress?.city || '',
        presentResidentialAddress: submissionData.presentResidentialAddress || {},
        nativePlaceAddress: submissionData.nativePlaceAddress || {},
        education: submissionData.education,
        employmentType: submissionData.employmentType,
        occupation: submissionData.occupation,
        professionalAdditionalInfo: submissionData.professionalAdditionalInfo || '',
        annualIncome: {
          currency: submissionData.annualIncomeCurrency,
          min: parsedIncome.min,
          max: parsedIncome.max,
          displayText: parsedIncome.displayText,
        },
        fatherName: submissionData.fatherName,
        fatherOccupation: submissionData.fatherOccupation,
        motherName: submissionData.motherName,
        motherOccupation: submissionData.motherOccupation,
        weight: submissionData.weight,
        bloodGroup: submissionData.bloodGroup,
        diet: submissionData.diet || '',
        residentialStatus: submissionData.residentialStatus,
        familyStatus: submissionData.familyStatus,
        ageFrom: ageFromValue,
        ageTo: ageToValue,
        interests: submissionData.interests,
        profileAbout: submissionData.profileAbout,
        profileBanner: {
          bannerType: 'color',
          bannerColor: submissionData.profileBannerColor,
        },
      };

      console.log('Submission data:', registrationData);

      // Call register from auth store
      const result = await register(registrationData);

      if (result.success) {
        toastSuccess('Registration successful! Logging you in...');

        // Upload media files after successful registration
        try {
          console.log('[Register] Starting media uploads...');
          console.log('[Register] profilePicture:', submissionData.profilePicture);

          if (submissionData.profilePicture?.file) {
            console.log('[Register] Uploading profile picture:', submissionData.profilePicture.file.name);
            const picResult = await useAuthStore.getState().uploadProfilePicture(submissionData.profilePicture.file);
            console.log('[Register] Profile picture upload result:', picResult);
          } else {
            console.log('[Register] No profile picture file found');
          }

          if (submissionData.galleryPhotos?.length > 0) {
            console.log('[Register] Uploading gallery photos:', submissionData.galleryPhotos.length);
            for (const photo of submissionData.galleryPhotos) {
              if (photo.file && !photo.existing) {
                console.log('[Register] Uploading photo:', photo.file.name);
                const photoResult = await useAuthStore.getState().uploadPhoto(photo.file);
                console.log('[Register] Photo upload result:', photoResult);
              }
            }
          }

          // Upload horoscope document if provided
          if (submissionData.horoscope?.file) {
            try {
              console.log('[Register] Uploading horoscope document:', submissionData.horoscope.file.name);
              await useAuthStore.getState().uploadHoroscopeDocument(submissionData.horoscope.file);
              console.log('[Register] Horoscope document uploaded successfully');
            } catch (error) {
              console.warn('Horoscope upload warning:', error.message);
              // Don't fail registration if horoscope upload fails
            }
          }
        } catch (mediaErr) {
          console.warn('Media upload warning:', mediaErr.message);
          // Don't fail registration if media upload fails
        }

        // TEMPORARILY DISABLED: Skip membership screen (no live payment keys yet)
        // Set flag to indicate user just registered
        // if (typeof window !== 'undefined') {
        //   sessionStorage.setItem('justRegistered', 'true');
        // }

        // router.push('/membership/purchase');
        router.push('/'); // Redirect directly to home after registration
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (err) {
      const msg = `Error: ${err.message || 'Registration failed. Please try again.'}`;
      setError(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitles = [
    '📝 Create Account',
    '💑 Personal Details',
    '📍 Location Details',
    '💼 Professional Details',
    '👨‍👩‍👧‍👦 Family & Additional Details',
    '📸 Preferences & Media'
  ];
  const progressValue = (currentStep / 6) * 100;

  // Step 1 content
  if (currentStep === 1) {
    return (
      <Card className="border-0 shadow-lg bg-white w-full max-w-3xl mx-auto">
        <CardHeader className="pb-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="font-viga text-2xl text-secondary">
              {stepTitles[0]}
            </CardTitle>
            <div className="font-telex text-sm text-secondary/70 whitespace-nowrap">
              Step 1/6
            </div>
          </div>
          <Progress value={progressValue} className="h-2" />
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <div className="space-y-6 py-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-maven">Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your full name" className="font-maven" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-maven">Email Address *</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="your@email.com"
                          className="font-maven flex-1"
                          disabled={emailVerified}
                          onChange={(e) => {
                            field.onChange(e);
                            setFormData(prev => ({
                              ...prev,
                              email: e.target.value
                            }));
                            if (emailVerified) {
                              setEmailVerified(false);
                              setVerificationToken('');
                              setEmailVerificationStep('input');
                            }
                          }}
                        />
                      </FormControl>
                      {!emailVerified && (
                        <Button
                          type="button"
                          onClick={sendOTP}
                          disabled={otpLoading || !formData.email || !z.string().email().safeParse(formData.email).success}
                          className="bg-primary text-primary-foreground font-telex whitespace-nowrap"
                        >
                          {otpLoading ? 'Sending...' : 'Verify Email'}
                        </Button>
                      )}
                      {emailVerified && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-success/10 text-success rounded-md border border-success/20">
                          <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="font-maven font-semibold text-sm">Verified</span>
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* OTP Input Section - shown after sending OTP */}
              {emailVerificationStep === 'otp' && !emailVerified && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border-2 border-primary/20">
                  <p className="font-maven text-sm text-secondary">
                    Enter the 6-digit OTP sent to <strong>{formData.email}</strong>
                  </p>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpValue(cleaned);
                    }}
                    className="text-center text-2xl tracking-widest font-maven"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={verifyOTP}
                      disabled={otpLoading || !otpValue || otpValue.length !== 6}
                      className="flex-1 bg-primary text-primary-foreground font-telex"
                    >
                      {otpLoading ? 'Verifying...' : 'Verify OTP'}
                    </Button>
                    <Button
                      type="button"
                      onClick={resendOTP}
                      disabled={resendTimer > 0}
                      variant="outline"
                      className="font-telex"
                    >
                      {resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Resend OTP'}
                    </Button>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-maven">Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" autoComplete="new-password" placeholder="••••••••" className="font-maven" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-maven">Confirm Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" autoComplete="new-password" placeholder="••••••••" className="font-maven" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobileNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-maven">Mobile Number *</FormLabel>
                    <div className="flex gap-2">
                      <div className="w-16 flex items-center justify-center border border-input rounded-md bg-gray-50 font-maven text-sm">
                        +91
                      </div>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          placeholder="9876543210"
                          maxLength={10}
                          pattern="[0-9]*"
                          className="font-maven flex-1"
                          onChange={(e) => {
                            field.onChange(e);
                            setFormData(prev => ({
                              ...prev,
                              mobileNumber: e.target.value
                            }));
                          }}
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="font-telex text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alternateMobileNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-maven">Alternate Mobile Number (Optional)</FormLabel>
                    <div className="flex gap-2">
                      <div className="w-16 flex items-center justify-center border border-input rounded-md bg-gray-50 font-maven text-sm">
                        +91
                      </div>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          placeholder="9876543210"
                          maxLength={10}
                          pattern="[0-9]*"
                          className="font-maven flex-1"
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="font-telex text-xs" />
                  </FormItem>
                )}
              />

            </div>
          </Form>
        </CardContent>

        <div className="flex gap-3 p-6">
          <Button variant="outline" className="flex-1 font-maven" onClick={() => router.push('/login')}>
            Back to Login
          </Button>
          <Button
            onClick={validateAndProceed}
            disabled={isLoading || !emailVerified}
            className="flex-1 bg-primary text-primary-foreground font-maven"
          >
            {!emailVerified ? 'Verify Email to Continue' : isLoading ? 'Validating...' : 'Next'}
            {!isLoading && emailVerified && <ChevronRight className="ml-2 w-4 h-4" />}
          </Button>
        </div>
      </Card>
    );
  }

  // Steps 2-6 use shared components
  return (
    <Card className="border-0 shadow-lg bg-white w-full max-w-3xl mx-auto">
      <CardHeader className="pb-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBackNavigation}
            className="p-0 h-auto hover:bg-transparent"
          >
            <ChevronLeft className="w-6 h-6 text-secondary" />
          </Button>

          <CardTitle className="font-viga text-2xl text-secondary flex-1 ml-4">
            {stepTitles[currentStep - 1]}
          </CardTitle>

          <div className="font-telex text-sm text-secondary/70 whitespace-nowrap">
            Step {currentStep}/6
          </div>
        </div>

        <Progress value={progressValue} className="h-2" />
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <div className="space-y-6 py-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {currentStep === 2 && <PersonalDetailsStep form={form} horoscope={formData.horoscope} onFileUpdate={handleFileUpdate} />}
            {currentStep === 3 && <LocationAddressStep form={form} />}
            {currentStep === 4 && <ProfessionalDetailsStep form={form} />}
            {currentStep === 5 && <FamilyDetailsStep form={form} />}
            {currentStep === 6 && (
              <PreferencesMediaStep
                form={form}
                profilePicture={formData.profilePicture}
                galleryPhotos={formData.galleryPhotos}
                onFileUpdate={handleFileUpdate}
              />
            )}
          </div>
        </Form>
      </CardContent>

      <div className="flex gap-3 p-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleBackNavigation}
          className="flex-1 font-maven"
        >
          Back
        </Button>

        <Button
          onClick={validateAndProceed}
          disabled={isLoading}
          className="flex-1 bg-primary text-primary-foreground font-maven"
        >
          {isLoading ? 'Processing...' : currentStep === 6 ? 'Complete Registration' : 'Next'}
          {!isLoading && currentStep < 6 && <ChevronRight className="ml-2 w-4 h-4" />}
        </Button>
      </div>
    </Card>
  );
}
