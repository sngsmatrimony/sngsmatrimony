'use client';

import { useWatch } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  EMPLOYMENT_TYPES,
  ANNUAL_INCOME_INR,
  CURRENCIES,
  getAllEducationOptions,
  getAllOccupationOptions,
} from '@/lib/constants/formData';

export function ProfessionalDetailsStep({ form }) {
  const watchCurrency = useWatch({ control: form.control, name: 'annualIncomeCurrency' });
  const educationOptions = getAllEducationOptions();
  const occupationOptions = getAllOccupationOptions();

  return (
    <div className="space-y-6">
      {/* <h2 className="font-viga text-xl text-secondary">Professional Details</h2> */}

      {/* Education */}
      <FormField
        control={form.control}
        name="education"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">Education</FormLabel>
            <Select value={field.value || ''} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="font-maven">
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {educationOptions.map((option, idx) => (
                  <SelectItem key={`${option}-${idx}`} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Employment Type */}
      <FormField
        control={form.control}
        name="employmentType"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">Employment Type</FormLabel>
            <Select value={field.value || ''} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="font-maven">
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {EMPLOYMENT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Occupation */}
      <FormField
        control={form.control}
        name="occupation"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">Occupation</FormLabel>
            <Select value={field.value || ''} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="font-maven">
                  <SelectValue placeholder="Select occupation" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {occupationOptions.map((option, idx) => (
                  <SelectItem key={`${option}-${idx}`} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Annual Income */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="annualIncomeCurrency"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-maven">Income Currency</FormLabel>
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="font-maven">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CURRENCIES.map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.label}
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
          name="annualIncomeAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-maven">Annual Income Amount</FormLabel>
              {watchCurrency === 'INR' ? (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="font-maven">
                      <SelectValue placeholder="Select income range" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ANNUAL_INCOME_INR.map(range => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="Enter annual income"
                    className="font-maven"
                  />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Professional Additional Information */}
      <FormField
        control={form.control}
        name="professionalAdditionalInfo"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">Additional Information (Optional)</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Any additional professional details..."
                maxLength={500}
                rows={4}
                className="font-maven-pro resize-none"
              />
            </FormControl>
            <FormDescription className="font-telex">
              Optional field
            </FormDescription>
            <div className="text-sm text-gray-500 font-telex">
              {field.value?.length || 0}/500
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
