"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function SettingsPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setEmail(user.email || "");

        const userName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          "";

        setName(userName);
      }

      setLoading(false);
    };

    loadUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMessage("");

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: name,
      },
    });

    if (error) {
      setProfileMessage(error.message);
    } else {
      setProfileMessage("Profile updated successfully.");
    }

    setSavingProfile(false);
  };

  const handleChangePassword = async () => {
    setPasswordMessage("");

    if (!newPassword || !confirmPassword) {
      setPasswordMessage("Please enter both password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage(
        "Password must be at least 6 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords do not match.");
      return;
    }

    setChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setPasswordMessage(error.message);
    } else {
      setPasswordMessage("Password changed successfully.");
      setNewPassword("");
      setConfirmPassword("");
    }

    setChangingPassword(false);
  };

  if (loading) {
    return (
      <DashboardLayout onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">
            Loading settings...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Settings
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your administrator account and security settings.
          </p>
        </div>

        {/* Profile Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Profile Settings
          </h2>

          <p className="text-sm text-gray-500 mt-1 mb-6">
            Update your administrator profile information.
          </p>

          <div className="max-w-xl space-y-5">

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed"
              />

              <p className="text-xs text-gray-500 mt-2">
                Your email address is managed by Supabase authentication.
              </p>
            </div>

            {/* Save Profile */}
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="px-5 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {savingProfile ? "Saving..." : "Save Changes"}
            </button>

            {/* Profile Message */}
            {profileMessage && (
              <p
                className={`text-sm ${
                  profileMessage.includes("successfully")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {profileMessage}
              </p>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Change Password
          </h2>

          <p className="text-sm text-gray-500 mt-1 mb-6">
            Update your administrator account password.
          </p>

          <div className="max-w-xl space-y-5">

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Change Password Button */}
            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="px-5 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {changingPassword
                ? "Changing Password..."
                : "Change Password"}
            </button>

            {/* Password Message */}
            {passwordMessage && (
              <p
                className={`text-sm ${
                  passwordMessage.includes("successfully")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {passwordMessage}
              </p>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Account Information
          </h2>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">

            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">
                Account Type
              </p>

              <p className="mt-1 text-gray-900 font-semibold">
                Administrator
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">
                Authentication
              </p>

              <p className="mt-1 text-gray-900 font-semibold">
                Supabase Auth
              </p>
            </div>

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}