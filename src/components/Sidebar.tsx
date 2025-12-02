"use client"

import * as React from "react"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Home, BookOpen, ClipboardList, Users, CalendarDays, Settings, FileText, Award, LogOut, ChevronLeft } from "lucide-react"

type Role = "Student" | "Supervisor" | "Coordinator" | "Committee"

export default function AppSidebar({ role = "Student" as Role }) {
  const [active, setActive] = React.useState<string>("dashboard")

  const menu = [
    { key: "dashboard", label: "Dashboard", icon: Home },
    { key: "registration", label: "FYP Registration", icon: BookOpen },
    {
      key: "proposal",
      label: "Proposal Evaluation",
      icon: ClipboardList,
    },
    { key: "progress", label: "Progress Tracking", icon: FileText },
    { key: "grading", label: "Evaluation & Grading", icon: Award },
    { key: "schedule", label: "Scheduling", icon: CalendarDays },
    { key: "users", label: "Users & Roles", icon: Users },
    { key: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-full">
        <Sidebar side="left" variant="floating" collapsible="icon" className="w-64">
          <SidebarHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src="/favicon.ico" alt="logo" />
                  <AvatarFallback>OF</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="text-sm font-semibold">FYP Portal</div>
                  <div className="text-xs text-muted-foreground">{role}</div>
                </div>
              </div>
              <div className="hidden md:flex">
                {/* Use the SidebarTrigger primitive so the hook is consumed inside the provider */}
                <SidebarTrigger />
              </div>
            </div>
          </SidebarHeader>

          <SidebarSeparator />

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Primary</SidebarGroupLabel>
              <SidebarMenu>
                {menu.slice(0, 4).map((m) => (
                  <SidebarMenuItem key={m.key}>
                    <SidebarMenuButton
                      isActive={active === m.key}
                      onClick={() => setActive(m.key)}
                      asChild={false}
                    >
                      <m.icon />
                      <span>{m.label}</span>
                      {m.key === "registration" && <SidebarMenuBadge>New</SidebarMenuBadge>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Evaluation</SidebarGroupLabel>
              <SidebarMenu>
                {menu.slice(4).map((m) => (
                  <SidebarMenuItem key={m.key}>
                    <SidebarMenuButton
                      isActive={active === m.key}
                      onClick={() => setActive(m.key)}
                      asChild={false}
                    >
                      <m.icon />
                      <span>{m.label}</span>
                      {m.key === "grading" && <SidebarMenuBadge>Beta</SidebarMenuBadge>}
                    </SidebarMenuButton>
                    {m.key === "grading" && (
                      <SidebarMenuSub>
                        <SidebarMenuSubButton href="#" size="md">
                          Interim Rubrics
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton href="#" size="md">
                          Final Vivas
                        </SidebarMenuSubButton>
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="text-sm">John Doe</div>
                  <div className="text-xs text-muted-foreground">{role}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <LogOut className="size-4" />
                </Button>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xs text-muted-foreground">Quick actions</div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm">Create</Button>
                <Button variant="ghost" size="sm">Help</Button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Sidebar inset area (main content placeholder) */}
        <div className="flex-1" />
      </div>
    </SidebarProvider>
  )
}
