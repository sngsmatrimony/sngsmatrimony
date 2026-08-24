"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAdminAuthStore } from "@/store/adminAuthStore";
import { BarChart3, Users, Settings, Shield, LogOut, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import HelpButton from "@/components/layout/HelpButton";

export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const { admin, isLoading, logout, initializeAuth } = useAdminAuthStore();

    // Don't protect login and forgot password routes
    const isAuthRoute =
        pathname === "/admin/login" ||
        pathname.startsWith("/admin/forgot-password");

    // Initialize auth and determine authorization
    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    useEffect(() => {
        if (!isLoading && !isAuthRoute) {
            if (!admin) {
                router.push("/admin/login");
            }
        }
    }, [admin, isLoading, router, isAuthRoute]);

    const handleLogout = () => {
        logout();
        router.push("/admin/login");
    };

    // For login and forgot password pages, just render the content without the admin layout
    if (isAuthRoute) {
        return children;
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-secondary">Loading admin portal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Top Header - Similar to Dashboard */}
                <header className="border-b border-gray-100 bg-white shadow-sm">
                    <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                        <Link href="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
                            <Image
                                src="/logo.jpeg"
                                alt="SNGS Matrimonial Logo"
                                width={48}
                                height={48}
                                className="h-12 w-auto"
                                style={{ width: 'auto', height: 'auto' }}
                            />
                            <h1 className="font-viga text-2xl text-accent">
                                SNGS Admin
                            </h1>
                        </Link>

                        {/* Welcome Message - Center */}
                        <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
                            <span className="font-maven text-gray-600">
                                Welcome,
                            </span>
                            <span className="font-viga text-secondary">
                                {admin?.email?.split("@")[0]}
                            </span>
                        </div>

                        {/* Help Button - Right */}
                        <HelpButton />

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-telex"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </header>

                {/* Navigation Tabs */}
                <div className="bg-black border-b border-gray-900">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-8 overflow-x-auto">
                            <Link
                                href="/admin"
                                className={`py-4 font-telex font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                                    pathname === "/admin"
                                        ? "border-primary text-primary"
                                        : "border-transparent text-white hover:text-gray-300"
                                }`}
                            >
                                <BarChart3 size={20} />
                                <span className="hidden sm:inline">
                                    Dashboard
                                </span>
                            </Link>
                            <Link
                                href="/admin/users"
                                className={`py-4 font-telex font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                                    pathname.startsWith("/admin/users")
                                        ? "border-primary text-primary"
                                        : "border-transparent text-white hover:text-gray-300"
                                }`}
                            >
                                <Users size={20} />
                                <span className="hidden sm:inline">Users</span>
                            </Link>
                            <Link
                                href="/admin/membership-plans"
                                className={`py-4 font-telex font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                                    pathname.startsWith("/admin/membership-plans")
                                        ? "border-primary text-primary"
                                        : "border-transparent text-white hover:text-gray-300"
                                }`}
                            >
                                <CreditCard size={20} />
                                <span className="hidden sm:inline">Plans</span>
                            </Link>
                            <Link
                                href="/admin/admins"
                                className={`py-4 font-telex font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                                    pathname.startsWith("/admin/admins")
                                        ? "border-primary text-primary"
                                        : "border-transparent text-white hover:text-gray-300"
                                }`}
                            >
                                <Shield size={20} />
                                <span className="hidden sm:inline">Admins</span>
                            </Link>
                            <Link
                                href="/admin/settings"
                                className={`py-4 font-telex font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                                    pathname.startsWith("/admin/settings")
                                        ? "border-primary text-primary"
                                        : "border-transparent text-white hover:text-gray-300"
                                }`}
                            >
                                <Settings size={20} />
                                <span className="hidden sm:inline">
                                    Settings
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <div className="flex-1 p-6 overflow-auto">{children}</div>
            </main>
        </div>
    );
}
