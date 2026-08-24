'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import HelpButton from '@/components/layout/HelpButton';
import client from '@/lib/api/client';

// Default hero content fallback
const DEFAULT_HERO_CONTENT = {
  badge: 'Welcome to SNGS Matrimonial',
  title: 'Find Your Perfect Match',
  subtitle:
    'Join thousands of individuals on their journey to find true companionship. Our secure platform connects you with compatible matches based on values, interests, and life goals.',
};

// Default content fallback
const DEFAULT_HOW_IT_WORKS = {
  sectionTitle: 'Find Your Partner In Just Few Steps',
  sectionSubtitle:
    'SNGS Matrimonial will help you find your perfect match with just a few steps. You focus on what is most important to you, we do all the work.',
  steps: [
    {
      title: 'Create Profile',
      description:
        'Register to SNGS Matrimonial, fill up your profile completely, and put a beautiful image to showcase yourself.',
    },
    {
      title: 'Find Your Partner',
      description:
        "Search for interests that you like. You'll also be recommended users based on your preferences and values.",
    },
    {
      title: 'Connect & Chat',
      description:
        'Add friends, approach them, and chat with them. Be sure to share your audio, photos, and videos too.',
    },
  ],
};

export default function Home() {
  const { token, user, initializeAuth } = useAuthStore();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initTimeout, setInitTimeout] = useState(false);
  const [heroContent, setHeroContent] = useState(DEFAULT_HERO_CONTENT);
  const [howItWorksContent, setHowItWorksContent] = useState(DEFAULT_HOW_IT_WORKS);

  // Initialize auth on mount
  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      setIsInitialized(true);
    };
    init();
  }, [initializeAuth]);

  // Timeout safety net: show homepage content if init takes too long
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isInitialized) {
        console.warn('[Homepage] Auth init timeout - showing homepage content');
        setInitTimeout(true);
      }
    }, 10000); // 10 seconds

    return () => clearTimeout(timeout);
  }, [isInitialized]);

  // Fetch Hero content
  useEffect(() => {
    const fetchHeroContent = async () => {
      try {
        const response = await client.get('/api/settings/hero-content');
        if (response.data.success && response.data.data) {
          setHeroContent(response.data.data);
        }
      } catch (error) {
        // Use default content on error
        console.error('Failed to fetch Hero content:', error);
      }
    };
    fetchHeroContent();
  }, []);

  // Fetch How It Works content
  useEffect(() => {
    const fetchHowItWorksContent = async () => {
      try {
        const response = await client.get('/api/settings/how-it-works');
        if (response.data.success && response.data.data) {
          setHowItWorksContent(response.data.data);
        }
      } catch (error) {
        // Use default content on error
        console.error('Failed to fetch How It Works content:', error);
      }
    };
    fetchHowItWorksContent();
  }, []);

  // Handle redirection for authenticated users
  useEffect(() => {
    if (isInitialized && token && user) {
      router.push('/browse');
    }
  }, [isInitialized, token, user, router]);

  // Show loader while initializing or redirecting (unless timeout reached)
  if ((!isInitialized && !initTimeout) || (token && user)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-primary animate-spin"></div>
          <p className="font-maven text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
            <Image
              src="/logo.jpeg"
              alt="SNGS Matrimonial Logo"
              width={48}
              height={48}
              className="h-12 w-auto"
              style={{ width: 'auto', height: 'auto' }}
            />
            <h1 className="font-viga text-2xl text-accent">SNGS Matrimonial</h1>
          </Link>
          <HelpButton />
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="font-telex text-accent font-semibold text-sm uppercase tracking-wide">
                {heroContent.badge}
              </p>
              <h2 className="font-viga text-4xl sm:text-5xl text-secondary leading-tight">
                {heroContent.title}
              </h2>
              <p className="font-maven text-lg text-gray-600 leading-relaxed">
                {heroContent.subtitle}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 font-telex font-semibold shadow-lg hover:shadow-xl transition-all">
                  Sign Up
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full border-2 border-secondary text-secondary hover:bg-gray-100 hover:text-secondary h-12 font-telex">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative h-96 rounded-2xl overflow-hidden shadow-lg">
            <Image
              src="/images/bg_1.webp"
              alt="Happy couples"
              fill
              sizes="(min-width: 768px) 640px, 100vw"
              priority
              quality={70}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h3 className="font-viga text-3xl sm:text-4xl text-secondary mb-4">
            {howItWorksContent.sectionTitle}
          </h3>
          <p className="font-maven text-gray-600 max-w-2xl mx-auto text-lg">
            {howItWorksContent.sectionSubtitle}
          </p>
        </div>

        {/* Steps Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-6 relative z-10">
              <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h4 className="font-viga text-2xl text-secondary mb-3">{howItWorksContent.steps[0]?.title}</h4>
            <p className="font-maven text-gray-600">
              {howItWorksContent.steps[0]?.description}
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-accent/10 mb-6 relative z-10">
              <svg className="w-12 h-12 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h4 className="font-viga text-2xl text-secondary mb-3">{howItWorksContent.steps[1]?.title}</h4>
            <p className="font-maven text-gray-600">
              {howItWorksContent.steps[1]?.description}
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success/10 mb-6 relative z-10">
              <svg className="w-12 h-12 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h4 className="font-viga text-2xl text-secondary mb-3">{howItWorksContent.steps[2]?.title}</h4>
            <p className="font-maven text-gray-600">
              {howItWorksContent.steps[2]?.description}
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center mt-16">
          <Link href="/register">
            <Button className="font-telex bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 font-semibold shadow-lg hover:shadow-xl transition-all">
              Sign Up Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
