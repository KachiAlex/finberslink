"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";

interface ResumeEntry {
  id: string;
  title: string | null;
  updatedAt: string;
}

interface ProfileData {
  headline: string | null;
  bio: string | null;
  location: string | null;
  skills: string[];
  interests: string[];
}

interface Props {
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
  profile: ProfileData | null;
  resumes: ResumeEntry[];
  resumeCount: number;
  applicationCount: number;
  enrollmentCount: number;
}

export function ProfileClient({
  firstName,
  lastName,
  email,
  avatarUrl,
  profile,
  resumes,
  resumeCount,
  applicationCount,
  enrollmentCount,
}: Props) {
  const [activeTab, setActiveTab] = useState("overview");
  const [savedProfile, setSavedProfile] = useState({
    headline: profile?.headline ?? "",
    location: profile?.location ?? "",
    bio: profile?.bio ?? "",
  });
  const [headlineInput, setHeadlineInput] = useState(savedProfile.headline);
  const [locationInput, setLocationInput] = useState(savedProfile.location);
  const [bioInput, setBioInput] = useState(savedProfile.bio);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const displayName = [firstName, lastName].filter(Boolean).join(" ") || email;
  const headline = headlineInput.trim();
  const bio = bioInput.trim();
  const location = locationInput.trim();
  const skills = profile?.skills ?? [];
  const interests = profile?.interests ?? [];
  const initials = (firstName?.[0] ?? email[0]).toUpperCase();

  const stats = [
    { label: "Resumes", value: String(resumeCount) },
    { label: "Applications", value: String(applicationCount) },
    { label: "Courses", value: String(enrollmentCount) },
  ];

  const hasChanges =
    headlineInput !== savedProfile.headline ||
    locationInput !== savedProfile.location ||
    bioInput !== savedProfile.bio;

  const handleSaveProfile = async () => {
    if (!hasChanges || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          headline: headlineInput,
          location: locationInput,
          bio: bioInput,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save profile changes");
      }

      const payload = (await res.json()) as {
        success: boolean;
        profile: { headline: string | null; location: string | null; bio: string | null };
      };

      setSavedProfile({
        headline: payload.profile.headline ?? "",
        location: payload.profile.location ?? "",
        bio: payload.profile.bio ?? "",
      });

      setSaveMessage("Profile updated successfully.");
    } catch (error) {
      console.error("Profile save error", error);
      setSaveError("Unable to save profile right now. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile header card */}
      <Card className="border border-slate-200/80 bg-white/95">
        <CardContent className="p-6 flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 flex items-center justify-center">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
              ) : (
                <span className="text-2xl font-semibold text-slate-500 select-none">{initials}</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{displayName}</h1>
              {headline && <p className="text-slate-600 text-sm">{headline}</p>}
              {location && <p className="text-xs text-slate-400 mt-1">{location}</p>}
            </div>
          </div>

          <div className="flex flex-1 flex-wrap justify-end gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-2 text-center min-w-[76px]"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
                <p className="text-lg font-semibold text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <TabsList className="bg-slate-100/80">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="resumes">Resumes</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>
          <Button asChild>
            <Link href="/dashboard/resumes">Open Resume Studio</Link>
          </Button>
        </div>

        {/* Overview */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <Card className="border border-slate-200/80 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">About</CardTitle>
            </CardHeader>
            <CardContent>
              {bio ? (
                <p className="text-slate-600 leading-relaxed">{bio}</p>
              ) : (
                <p className="text-sm text-slate-400 italic">
                  No bio yet. Use the fields below to add one.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Quick edit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Headline (e.g. Product Strategist · Impact Programs)"
                value={headlineInput}
                onChange={(event) => setHeadlineInput(event.target.value)}
              />
              <Input
                placeholder="Location (e.g. Lagos, Nigeria)"
                value={locationInput}
                onChange={(event) => setLocationInput(event.target.value)}
              />
              <Textarea
                placeholder="About / bio"
                rows={4}
                value={bioInput}
                onChange={(event) => setBioInput(event.target.value)}
              />
              <div className="text-right">
                <Button onClick={handleSaveProfile} disabled={!hasChanges || isSaving}>
                  {isSaving ? "Saving..." : "Save changes"}
                </Button>
              </div>
              {saveMessage && <p className="text-xs text-emerald-600">{saveMessage}</p>}
              {saveError && <p className="text-xs text-rose-600">{saveError}</p>}
              <p className="text-xs text-slate-400">Changes are saved to your student profile.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resumes */}
        <TabsContent value="resumes" className="mt-6 space-y-4">
          {resumes.length === 0 ? (
            <Card className="border border-slate-200/80 bg-white/95">
              <CardContent className="py-10 text-center space-y-4">
                <p className="text-slate-500">No resumes yet.</p>
                <Button asChild>
                  <Link href="/dashboard/resumes">Create your first resume</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            resumes.map((resume) => (
              <Card key={resume.id} className="border border-slate-200/80 bg-white/95">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-semibold text-slate-900">{resume.title ?? "Untitled Resume"}</p>
                    <p className="text-xs text-slate-500">
                      Updated {new Date(resume.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/resumes">View</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
          <div className="text-right">
            <Button variant="outline" asChild>
              <Link href="/dashboard/resumes">Manage all resumes →</Link>
            </Button>
          </div>
        </TabsContent>

        {/* Skills */}
        <TabsContent value="skills" className="mt-6">
          <Card className="border border-slate-200/80 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Skills &amp; Interests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">
                  No skills added yet. They will appear here once pulled from your resumes.
                </p>
              )}

              {interests.length > 0 && (
                <>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-4">Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest) => (
                      <Badge key={interest} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
