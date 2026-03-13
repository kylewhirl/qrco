"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Save, Send, KeyRound, LogOut, UserCircle2, BadgeCheck } from "lucide-react";
import { useUser } from "@stackframe/stack";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

function getInitials(name: string | null) {
  if (!name) {
    return "QR";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function AccountPage() {
  const user = useUser({ or: "redirect" });
  const contactChannels = user.useContactChannels();

  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [profileImageUrl, setProfileImageUrl] = useState(user.profileImageUrl ?? "");
  const [profileNote, setProfileNote] = useState((user.clientMetadata?.accountNote as string | undefined) ?? "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sessions, setSessions] = useState<Awaited<ReturnType<typeof user.getActiveSessions>>>([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);

  useEffect(() => {
    setDisplayName(user.displayName ?? "");
    setProfileImageUrl(user.profileImageUrl ?? "");
    setProfileNote((user.clientMetadata?.accountNote as string | undefined) ?? "");
  }, [user.clientMetadata, user.displayName, user.profileImageUrl]);

  useEffect(() => {
    let ignore = false;

    async function loadSessions() {
      try {
        const activeSessions = await user.getActiveSessions();
        if (!ignore) {
          setSessions(activeSessions);
        }
      } catch (error) {
        console.error("Failed to load sessions:", error);
      }
    }

    void loadSessions();

    return () => {
      ignore = true;
    };
  }, [user]);

  async function handleSaveProfile() {
    try {
      setIsSavingProfile(true);
      await user.update({
        displayName: displayName.trim() || undefined,
        profileImageUrl: profileImageUrl.trim() || null,
        clientMetadata: {
          ...(user.clientMetadata ?? {}),
          accountNote: profileNote.trim(),
        },
      });
      toast.success("Profile updated");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSave() {
    if (!newPassword) {
      toast.error("Enter a new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setIsSavingPassword(true);
      const result = user.hasPassword
        ? await user.updatePassword({ oldPassword, newPassword })
        : await user.setPassword({ password: newPassword });

      if (result) {
        toast.error("Password update failed");
        return;
      }

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(user.hasPassword ? "Password updated" : "Password set");
    } catch (error) {
      console.error("Failed to update password:", error);
      toast.error("Failed to update password");
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleSendVerification() {
    try {
      setIsSendingVerification(true);
      const result = await user.sendVerificationEmail();
      if (result) {
        toast.error("Verification email could not be sent");
        return;
      }

      toast.success("Verification email sent");
    } catch (error) {
      console.error("Failed to send verification email:", error);
      toast.error("Failed to send verification email");
    } finally {
      setIsSendingVerification(false);
    }
  }

  async function handleRevokeOtherSessions() {
    try {
      setIsRevokingSessions(true);
      const otherSessions = sessions.filter((session) => !session.isCurrentSession);
      await Promise.all(otherSessions.map((session) => user.revokeSession(session.id)));
      const refreshed = await user.getActiveSessions();
      setSessions(refreshed);
      toast.success("Other sessions revoked");
    } catch (error) {
      console.error("Failed to revoke sessions:", error);
      toast.error("Failed to revoke other sessions");
    } finally {
      setIsRevokingSessions(false);
    }
  }

  const otherSessionsCount = sessions.filter((session) => !session.isCurrentSession).length;

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <section className="rounded-[32px] border border-border/70 bg-[linear-gradient(135deg,rgba(251,191,36,0.12),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Identity Control</p>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Account</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                Manage your profile, authentication state, and active sessions from a dashboard-native account workspace.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="rounded-full px-3 py-1">
              {user.primaryEmailVerified ? "Email verified" : "Verification pending"}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              Signed up {formatDate(user.signedUpAt)}
            </Badge>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70">
          <CardHeader className="gap-2">
            <CardDescription>Primary email</CardDescription>
            <CardTitle className="truncate text-lg">{user.primaryEmail || "No primary email"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {user.primaryEmailVerified ? "Verified and active" : "Needs verification"}
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="gap-2">
            <CardDescription>Password</CardDescription>
            <CardTitle className="text-lg">{user.hasPassword ? "Configured" : "Not set"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {user.hasPassword ? "You can rotate it below." : "Set a password to enable direct credential login."}
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="gap-2">
            <CardDescription>MFA posture</CardDescription>
            <CardTitle className="text-lg">
              {user.otpAuthEnabled || user.passkeyAuthEnabled ? "Enabled" : "Single factor"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {user.passkeyAuthEnabled ? "Passkeys active" : user.otpAuthEnabled ? "OTP active" : "No second factor configured"}
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="gap-2">
            <CardDescription>Active sessions</CardDescription>
            <CardTitle className="text-lg">{sessions.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {otherSessionsCount > 0 ? `${otherSessionsCount} other session(s) can be revoked.` : "Only the current session is active."}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <div className="space-y-6">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update the identity details shown around the dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4 rounded-[24px] border bg-muted/20 p-4">
                <Avatar className="h-20 w-20 rounded-2xl">
                  <AvatarImage src={profileImageUrl || undefined} alt={displayName || undefined} />
                  <AvatarFallback className="rounded-2xl text-lg">{getInitials(displayName || user.displayName)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-lg font-semibold">{displayName || user.displayName || "Unnamed user"}</p>
                  <p className="text-sm text-muted-foreground">{user.primaryEmail}</p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display name</Label>
                  <Input
                    id="display-name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-image">Profile image URL</Label>
                  <Input
                    id="profile-image"
                    value={profileImageUrl}
                    onChange={(event) => setProfileImageUrl(event.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-note">Workspace note</Label>
                <Textarea
                  id="profile-note"
                  value={profileNote}
                  onChange={(event) => setProfileNote(event.target.value)}
                  placeholder="Optional note for your own account operations"
                  rows={3}
                />
              </div>

              <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                <Save className="h-4 w-4" />
                {isSavingProfile ? "Saving..." : "Save profile"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>{user.hasPassword ? "Change password" : "Set password"}</CardTitle>
              <CardDescription>
                {user.hasPassword
                  ? "Rotate your password without leaving the dashboard."
                  : "Add a password to this account for direct credential sign-in."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {user.hasPassword && (
                <div className="space-y-2">
                  <Label htmlFor="old-password">Current password</Label>
                  <Input
                    id="old-password"
                    type="password"
                    value={oldPassword}
                    onChange={(event) => setOldPassword(event.target.value)}
                  />
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handlePasswordSave} disabled={isSavingPassword}>
                <KeyRound className="h-4 w-4" />
                {isSavingPassword ? "Saving..." : user.hasPassword ? "Update password" : "Set password"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/70">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4" />
                <CardTitle>Email verification</CardTitle>
              </div>
              <CardDescription>Authentication and recovery notices are tied to your primary email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
                <p className="font-medium">{user.primaryEmail || "No primary email"}</p>
                <p className="mt-1 text-muted-foreground">
                  {user.primaryEmailVerified
                    ? "This address is verified."
                    : "This address still needs verification before it can be fully trusted for account recovery."}
                </p>
              </div>
              {!user.primaryEmailVerified && (
                <Button onClick={handleSendVerification} disabled={isSendingVerification} variant="outline">
                  <Send className="h-4 w-4" />
                  {isSendingVerification ? "Sending..." : "Send verification email"}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <CardTitle>Sessions & access</CardTitle>
              </div>
              <CardDescription>Review where your account is currently signed in.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="rounded-2xl border bg-muted/30 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{session.isCurrentSession ? "Current session" : "Other session"}</p>
                      <p className="mt-1 text-muted-foreground">
                        {session.lastUsedAt ? `Last active ${formatDate(session.lastUsedAt)}` : "Last active time unavailable"}
                      </p>
                    </div>
                    <Badge variant="outline">{session.isCurrentSession ? "Current" : "Active"}</Badge>
                  </div>
                  {(session.geoInfo?.cityName || session.geoInfo?.countryCode) && (
                    <p className="mt-2 text-muted-foreground">
                      {[session.geoInfo?.cityName, session.geoInfo?.regionCode, session.geoInfo?.countryCode].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              ))}

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={handleRevokeOtherSessions}
                  disabled={isRevokingSessions || otherSessionsCount === 0}
                >
                  <UserCircle2 className="h-4 w-4" />
                  {isRevokingSessions ? "Revoking..." : "Revoke other sessions"}
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await user.signOut({ redirectUrl: "/" });
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Contact channels</CardTitle>
              <CardDescription>Identity channels currently attached to this user.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {contactChannels.length === 0 ? (
                <div className="rounded-2xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                  No contact channels are attached yet.
                </div>
              ) : (
                contactChannels.map((channel) => (
                  <div key={channel.id} className="rounded-2xl border bg-muted/30 p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{channel.value}</p>
                        <p className="mt-1 text-muted-foreground">
                          {channel.isPrimary ? "Primary" : "Secondary"} · {channel.isVerified ? "Verified" : "Unverified"}
                        </p>
                      </div>
                      {channel.usedForAuth && <Badge variant="outline">Auth</Badge>}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
