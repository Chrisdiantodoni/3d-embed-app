"use client";

import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, LogOut, Mail, User, Calendar, FolderKanban } from "lucide-react";
import { MAX_PROJECTS_FREE } from "@/lib/constants";

export default function SettingsPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [projectCount, setProjectCount] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          setProjectCount((data ?? []).length);
        }
      } catch {
        setProjectCount(0);
      }
    }
    void load();
  }, []);

  if (!user) {
    return (
      <div className="px-4 lg:px-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const name = user.fullName ?? user.username ?? "User";
  const email = user.primaryEmailAddress?.emailAddress ?? "";
  const avatar = user.imageUrl ?? "";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="px-4 lg:px-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Settings className="size-6 text-primary" />
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile and account settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-4" />
            Profile
          </CardTitle>
          <CardDescription>
            Your profile information is managed by your authentication provider.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-xl">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="rounded-xl text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{name}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="size-3" />
                {email}
              </p>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Account ID</p>
            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
              {user.id}
            </code>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-1">
              <Calendar className="size-3" />
              Member since
            </p>
            <p className="text-sm text-muted-foreground">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Unknown"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="size-4" />
            Usage
          </CardTitle>
          <CardDescription>
            Your current plan and resource usage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge>Free</Badge>
              <span className="text-sm text-muted-foreground">Free tier</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Projects</span>
              <span className="text-muted-foreground">
                {projectCount ?? "..."} / {MAX_PROJECTS_FREE}
              </span>
            </div>
            <Progress
              value={projectCount != null ? (projectCount / MAX_PROJECTS_FREE) * 100 : 0}
              className="h-2"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            File upload limit: 50 MB per file (GLB only)
          </p>
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => signOut({ redirectUrl: "/" })}
          >
            <LogOut className="size-4 mr-2" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
