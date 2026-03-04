"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Ban,
  Building2,
  CheckCircle,
  CircleSlash,
  CircleStop,
  Loader2,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCcw,
  Shield,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type TenantStatus = "ACTIVE" | "TRIAL" | "SUSPENDED" | "CANCELLED";
type TenantPlanTier = "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
type ToastVariant = "success" | "error";

type ToastMessage = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type TenantUsageSnapshot = {
  id: string;
  year: number;
  month: number;
  activeStudents: number;
  activeTutors: number;
  activeJobs: number;
  storageUsedMb: number;
  applications: number;
  createdAt: string;
};

type TenantAuditEntry = {
  id: string;
  label: string;
  detail: string;
  timestamp: string;
};

type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  planTier: TenantPlanTier;
  seatLimit: number;
  seatAllocated: number;
  licenseExpiresAt: string | null;
  contactEmail?: string | null;
  contactName?: string | null;
  logoUrl?: string | null;
  archivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  usage?: TenantUsageSnapshot[];
  settings?: {
    domain?: string | null;
    featureFlags?: Record<string, boolean> | null;
  } | null;
  users?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    status: "ACTIVE" | "SUSPENDED" | "INVITED" | "CANCELLED" | string;
    createdAt: string;
  }[];
  _count?: {
    users: number;
  };
};

type TenantFilters = {
  search?: string;
  status?: TenantStatus | "";
  planTier?: TenantPlanTier | "";
};

const STATUS_META: Record<
  TenantStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  ACTIVE: { label: "Active", variant: "default" },
  TRIAL: { label: "Trial", variant: "secondary" },
  SUSPENDED: { label: "Suspended", variant: "outline" },
  CANCELLED: { label: "Archived", variant: "outline" },
};

const PLAN_LABELS: Record<TenantPlanTier, string> = {
  STARTER: "Starter",
  PROFESSIONAL: "Professional",
  ENTERPRISE: "Enterprise",
};

const STATUS_OPTIONS: TenantStatus[] = ["ACTIVE", "TRIAL", "SUSPENDED", "CANCELLED"];
const PLAN_OPTIONS: TenantPlanTier[] = ["STARTER", "PROFESSIONAL", "ENTERPRISE"];

type CreateTenantForm = {
  name: string;
  slug: string;
  planTier: TenantPlanTier;
  seatLimit: number;
  licenseExpiresAt: string;
  contactName: string;
  contactEmail: string;
  domain: string;
};

const INITIAL_FORM: CreateTenantForm = {
  name: "",
  slug: "",
  planTier: "PROFESSIONAL",
  seatLimit: 100,
  licenseExpiresAt: "",
  contactName: "",
  contactEmail: "",
  domain: "",
};

export default function TenantsPage() {
  const [filters, setFilters] = useState<TenantFilters>({});
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTenantForm>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedTenant, setSelectedTenant] = useState<TenantSummary | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [adminInviteEmail, setAdminInviteEmail] = useState("");
  const [adminInvitePassword, setAdminInvitePassword] = useState("");
  const [isInviteSending, setIsInviteSending] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isAdminActioning, setIsAdminActioning] = useState<string | null>(null);

  useEffect(() => {
    loadTenants();
  }, [filters]);

  function showToast(message: string, variant: ToastVariant = "success") {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
    setToasts(prev => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  }

  function dismissToast(id: string) {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }

  async function loadTenants() {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.status) params.set("status", filters.status);
      if (filters.planTier) params.set("planTier", filters.planTier);

      const response = await fetch(`/api/superadmin/tenants?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Unable to load tenants");
      }
      const data = await response.json();
      setTenants(data.tenants);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load tenants");
      showToast(err instanceof Error ? err.message : "Failed to load tenants", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshTenantDetail(tenantId: string) {
    try {
      setDetailLoading(true);
      setDetailError(null);
      const response = await fetch(`/api/superadmin/tenants/${tenantId}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Unable to fetch tenant details");
      }
      const data = await response.json();
      setSelectedTenant(data.tenant);
      await loadTenants();
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Failed to load tenant");
    } finally {
      setDetailLoading(false);
    }
  }

  function handleFilterChange(key: keyof TenantFilters, value: string) {
    setFilters(prev => ({
      ...prev,
      [key]: value === "" ? undefined : (value as TenantFilters[keyof TenantFilters]),
    }));
  }

  function openDetail(tenant: TenantSummary) {
    setSelectedTenant(tenant);
    setIsDetailOpen(true);
    refreshTenantDetail(tenant.id);
  }

  async function handleCreateTenant(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/superadmin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          slug: createForm.slug,
          planTier: createForm.planTier,
          seatLimit: Number(createForm.seatLimit),
          licenseExpiresAt: createForm.licenseExpiresAt
            ? new Date(createForm.licenseExpiresAt)
            : null,
          contactName: createForm.contactName || null,
          contactEmail: createForm.contactEmail || null,
          domain: createForm.domain || null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to create tenant");
      }

      setCreateForm(INITIAL_FORM);
      setIsCreateOpen(false);
      await loadTenants();
      showToast("Tenant created successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tenant");
      showToast(err instanceof Error ? err.message : "Failed to create tenant", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function mutateTenant(
    tenantId: string,
    payload: Record<string, unknown>,
    method: "PATCH" | "POST" = "PATCH",
    successMessage?: string
  ) {
    const response = await fetch(`/api/superadmin/tenants/${tenantId}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? "Tenant update failed");
    }

    await refreshTenantDetail(tenantId);
    if (successMessage) {
      showToast(successMessage);
    }
  }

  async function handleStatusChange(status: TenantStatus) {
    if (!selectedTenant) return;
    setDetailError(null);
    try {
      await mutateTenant(selectedTenant.id, {
        action: "status",
        payload: { status },
      }, "POST", `Status updated to ${STATUS_META[status].label}`);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Failed to update status");
      showToast(err instanceof Error ? err.message : "Failed to update status", "error");
    }
  }

  async function handleArchive() {
    if (!selectedTenant) return;
    setDetailError(null);
    try {
      await mutateTenant(selectedTenant.id, { action: "archive" }, "POST", "Tenant archived");
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Failed to archive tenant");
      showToast(err instanceof Error ? err.message : "Failed to archive tenant", "error");
    }
  }

  async function handleLicenseUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTenant) return;
    const formData = new FormData(event.currentTarget);
    setDetailError(null);

    try {
      await mutateTenant(selectedTenant.id, {
        planTier: formData.get("planTier"),
        seatLimit: Number(formData.get("seatLimit")),
        licenseExpiresAt: formData.get("licenseExpiresAt")
          ? new Date(String(formData.get("licenseExpiresAt")))
          : null,
      }, "PATCH", "License updated");
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Failed to update license");
      showToast(err instanceof Error ? err.message : "Failed to update license", "error");
    }
  }

  async function handleAdminSave(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedTenant || !adminInviteEmail || !adminInvitePassword) return;
    setIsInviteSending(true);
    setDetailError(null);

    try {
      await mutateTenant(
        selectedTenant.id,
        {
          action: "admin-create",
          payload: {
            email: adminInviteEmail,
            password: adminInvitePassword,
          },
        },
        "POST",
        "Admin created"
      );
      setAdminInviteEmail("");
      setAdminInvitePassword("");
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Failed to save admin");
      showToast(err instanceof Error ? err.message : "Failed to save admin", "error");
    } finally {
      setIsInviteSending(false);
    }
  }

  async function handleAdminPasswordReset(userId: string) {
    if (!selectedTenant) return;
    const tempPassword = `Admin#${Math.random().toString(36).slice(-6)}`;
    setIsAdminActioning(userId);
    try {
      await mutateTenant(
        selectedTenant.id,
        {
          action: "admin-reset-password",
          payload: { userId, password: tempPassword },
        },
        "POST",
        `Password reset. Temp: ${tempPassword}`
      );
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Failed to reset password");
      showToast(err instanceof Error ? err.message : "Failed to reset password", "error");
    } finally {
      setIsAdminActioning(null);
    }
  }

  async function handleAdminStatusChange(userId: string, status: "ACTIVE" | "SUSPENDED") {
    if (!selectedTenant) return;
    setIsAdminActioning(userId);
    try {
      await mutateTenant(
        selectedTenant.id,
        { action: "admin-status", payload: { userId, status } },
        "POST",
        `Admin ${status === "ACTIVE" ? "activated" : "suspended"}`
      );
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Failed to update admin");
      showToast(err instanceof Error ? err.message : "Failed to update admin", "error");
    } finally {
      setIsAdminActioning(null);
    }
  }

  async function handleAdminInvite(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedTenant || !adminInviteEmail || !adminInvitePassword) return;
    setIsInviteSending(true);
    setDetailError(null);

    try {
      await mutateTenant(
        selectedTenant.id,
        {
          action: "admin-invite",
          payload: {
            email: adminInviteEmail,
            password: adminInvitePassword,
          },
        },
        "POST",
        "Admin invite sent"
      );
      setAdminInviteEmail("");
      setAdminInvitePassword("");
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Failed to send invite");
      showToast(err instanceof Error ? err.message : "Failed to send invite", "error");
    } finally {
      setIsInviteSending(false);
    }
  }

  const tenantStats = useMemo(() => {
    const total = tenants.length;
    const active = tenants.filter(t => t.status === "ACTIVE").length;
    const suspended = tenants.filter(t => t.status === "SUSPENDED").length;

    return { total, active, suspended };
  }, [tenants]);

  const tenantAuditEntries = useMemo<TenantAuditEntry[]>(() => {
    if (!selectedTenant) return [];
    const events: TenantAuditEntry[] = [];
    if (selectedTenant.createdAt) {
      events.push({
        id: `${selectedTenant.id}-created`,
        label: "Tenant created",
        detail: selectedTenant.slug,
        timestamp: selectedTenant.createdAt,
      });
    }
    if (selectedTenant.updatedAt) {
      events.push({
        id: `${selectedTenant.id}-updated`,
        label: "Profile updated",
        detail: `Plan ${PLAN_LABELS[selectedTenant.planTier]}`,
        timestamp: selectedTenant.updatedAt,
      });
    }
    const usageEvents =
      selectedTenant.usage?.map((snapshot) => ({
        id: snapshot.id,
        label: `Usage ${formatUsageLabel(snapshot.year, snapshot.month)}`,
        detail: `${snapshot.activeStudents} students · ${snapshot.applications} applications`,
        timestamp: snapshot.createdAt,
      })) ?? [];
    return [...events, ...usageEvents]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);
  }, [selectedTenant]);

  return (
    <>
      <div className="pointer-events-none fixed right-6 top-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start justify-between rounded-2xl px-4 py-3 text-sm shadow-lg ${
              toast.variant === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              className="ml-3 rounded-full p-1 text-current/70 hover:bg-slate-200"
              onClick={() => dismissToast(toast.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <section className="space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          <GlassCard variant="bordered" className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Tenants</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{tenantStats.total}</p>
              </div>
              <Building2 className="h-10 w-10 text-slate-400" />
            </div>
          </GlassCard>
          <GlassCard variant="bordered" className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-500/80">Active</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-600">{tenantStats.active}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-emerald-500/80" />
            </div>
          </GlassCard>
          <GlassCard variant="bordered" className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-orange-500/80">Suspended</p>
                <p className="mt-2 text-3xl font-semibold text-orange-500">{tenantStats.suspended}</p>
              </div>
              <PauseCircle className="h-10 w-10 text-orange-400/80" />
            </div>
          </GlassCard>
        </div>

        <GlassCard variant="bordered" className="p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search tenants..."
              value={filters.search ?? ""}
              onChange={(event) => handleFilterChange("search", event.target.value)}
              className="h-11 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
            />
            <select
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-600"
              value={filters.status ?? ""}
              onChange={(event) => handleFilterChange("status", event.target.value)}
            >
              <option value="">Status</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>
                  {STATUS_META[status].label}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-600"
              value={filters.planTier ?? ""}
              onChange={(event) => handleFilterChange("planTier", event.target.value)}
            >
              <option value="">Plan tier</option>
              {PLAN_OPTIONS.map(plan => (
                <option key={plan} value={plan}>
                  {PLAN_LABELS[plan]}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={loadTenants}
              className="border-slate-200 text-slate-700"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <Button onClick={() => setIsCreateOpen(true)} className="ml-auto gap-2">
                <Plus className="h-4 w-4" />
                New tenant
              </Button>
              <SheetContent side="right" className="w-full bg-white text-slate-900 sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle>Create tenant</SheetTitle>
                </SheetHeader>
                <form onSubmit={handleCreateTenant} className="mt-6 space-y-4">
                  <label className="block text-sm text-slate-600">
                    Name
                    <Input
                      required
                      value={createForm.name}
                      onChange={(event) =>
                        setCreateForm(prev => ({ ...prev, name: event.target.value }))
                      }
                      className="mt-1 bg-slate-50"
                    />
                  </label>
                  <label className="block text-sm text-slate-600">
                    Slug
                    <Input
                      required
                      value={createForm.slug}
                      onChange={(event) =>
                        setCreateForm(prev => ({ ...prev, slug: event.target.value }))
                      }
                      className="mt-1 bg-slate-50"
                    />
                  </label>
                  <label className="block text-sm text-slate-600">
                    Plan tier
                    <select
                      value={createForm.planTier}
                      onChange={(event) =>
                        setCreateForm(prev => ({
                          ...prev,
                          planTier: event.target.value as TenantPlanTier,
                        }))
                      }
                      className="mt-1 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-600"
                    >
                      {PLAN_OPTIONS.map(plan => (
                        <option key={plan} value={plan}>
                          {PLAN_LABELS[plan]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-slate-600">
                    Seat limit
                    <Input
                      type="number"
                      min={10}
                      value={createForm.seatLimit}
                      onChange={(event) =>
                        setCreateForm(prev => ({
                          ...prev,
                          seatLimit: Number(event.target.value),
                        }))
                      }
                      className="mt-1 bg-slate-50"
                    />
                  </label>
                  <label className="block text-sm text-slate-600">
                    License expiry
                    <Input
                      type="date"
                      value={createForm.licenseExpiresAt}
                      onChange={(event) =>
                        setCreateForm(prev => ({
                          ...prev,
                          licenseExpiresAt: event.target.value,
                        }))
                      }
                      className="mt-1 bg-slate-50"
                    />
                  </label>
                  <label className="block text-sm text-slate-600">
                    Contact name
                    <Input
                      value={createForm.contactName}
                      onChange={(event) =>
                        setCreateForm(prev => ({
                          ...prev,
                          contactName: event.target.value,
                        }))
                      }
                      className="mt-1 bg-slate-50"
                    />
                  </label>
                  <label className="block text-sm text-slate-600">
                    Contact email
                    <Input
                      type="email"
                      value={createForm.contactEmail}
                      onChange={(event) =>
                        setCreateForm(prev => ({
                          ...prev,
                          contactEmail: event.target.value,
                        }))
                      }
                      className="mt-1 bg-slate-50"
                    />
                  </label>
                  <label className="block text-sm text-slate-600">
                    Domain
                    <Input
                      value={createForm.domain}
                      onChange={(event) =>
                        setCreateForm(prev => ({
                          ...prev,
                          domain: event.target.value,
                        }))
                      }
                      className="mt-1 bg-slate-50"
                    />
                  </label>
                  <SheetFooter className="pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Create tenant
                    </Button>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>
          </div>
          {error ? (
            <p className="text-sm text-red-300">{error}</p>
          ) : null}
        </GlassCard>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-16">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
            No tenants found. Create one to get started.
          </div>
        ) : (
          tenants.map(tenant => (
            <GlassCard key={tenant.id} variant="bordered" className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-slate-900">{tenant.name}</p>
                    <Badge variant={STATUS_META[tenant.status].variant}>
                      {STATUS_META[tenant.status].label}
                    </Badge>
                    <Badge variant="outline" className="text-xs uppercase tracking-wide text-slate-600">
                      {PLAN_LABELS[tenant.planTier]}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">Slug: {tenant.slug}</p>
                  <div className="mt-2 text-xs text-slate-500">
                    Seats {tenant.seatAllocated}/{tenant.seatLimit} · Users{" "}
                    {tenant._count?.users ?? "—"}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="border-slate-200 text-slate-700"
                    onClick={() => openDetail(tenant)}
                  >
                    Manage
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-slate-600 hover:bg-slate-100"
                    onClick={() => handleStatusChange(tenant.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED")}
                  >
                    {tenant.status === "SUSPENDED" ? (
                      <>
                        <PlayCircle className="mr-2 h-4 w-4" /> Activate
                      </>
                    ) : (
                      <>
                        <PauseCircle className="mr-2 h-4 w-4" /> Suspend
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent
          side="right"
          className="w-full bg-white text-slate-900 sm:max-w-xl max-h-[90vh] overflow-y-auto px-4 sm:px-6"
        >
          <SheetHeader>
            <SheetTitle>Tenant detail</SheetTitle>
          </SheetHeader>
          {detailLoading || !selectedTenant ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-6 py-6">
              {detailError ? (
                <p className="text-sm text-red-500">{detailError}</p>
              ) : null}
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{selectedTenant.name}</p>
                    <p className="text-xs text-slate-500">{selectedTenant.slug}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <Badge variant={STATUS_META[selectedTenant.status].variant}>
                    {STATUS_META[selectedTenant.status].label}
                  </Badge>
                  <Badge variant="outline" className="uppercase tracking-wide text-slate-600">
                    {PLAN_LABELS[selectedTenant.planTier]}
                  </Badge>
                  {selectedTenant.licenseExpiresAt ? (
                    <Badge variant="outline" className="text-slate-600">
                      Expires {formatDate(selectedTenant.licenseExpiresAt)}
                    </Badge>
                  ) : null}
                </div>
                <div className="text-xs text-slate-500">
                  Seat allocation {selectedTenant.seatAllocated}/{selectedTenant.seatLimit}
                  <br />
                  Users: {selectedTenant._count?.users ?? "—"}
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Status controls</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="border-emerald-200 text-emerald-600"
                    onClick={() => handleStatusChange("ACTIVE")}
                  >
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Activate
                  </Button>
                  <Button
                    variant="outline"
                    className="border-orange-200 text-orange-500"
                    onClick={() => handleStatusChange("SUSPENDED")}
                  >
                    <PauseCircle className="mr-2 h-4 w-4" />
                    Suspend
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-200 text-slate-700"
                    onClick={() => handleStatusChange("TRIAL")}
                  >
                    <CircleSlash className="mr-2 h-4 w-4" />
                    Set trial
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600"
                    onClick={handleArchive}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Archive
                  </Button>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">License</p>
                <form className="grid gap-3" onSubmit={handleLicenseUpdate}>
                  <label className="text-xs uppercase tracking-wide text-slate-500">
                    Plan tier
                    <select
                      name="planTier"
                      defaultValue={selectedTenant.planTier}
                      className="mt-1 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-600"
                    >
                      {PLAN_OPTIONS.map(plan => (
                        <option key={plan} value={plan}>
                          {PLAN_LABELS[plan]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs uppercase tracking-wide text-slate-500">
                    Seat limit
                    <Input
                      name="seatLimit"
                      type="number"
                      min={10}
                      defaultValue={selectedTenant.seatLimit}
                      className="mt-1 bg-slate-50"
                    />
                  </label>
                  <label className="text-xs uppercase tracking-wide text-slate-500">
                    License expires
                    <Input
                      name="licenseExpiresAt"
                      type="date"
                      defaultValue={
                        selectedTenant.licenseExpiresAt
                          ? selectedTenant.licenseExpiresAt.split("T")[0]
                          : ""
                      }
                      className="mt-1 bg-slate-50"
                    />
                  </label>
                  <Button type="submit" variant="outline" className="border-slate-200 text-slate-700">
                    <CircleStop className="mr-2 h-4 w-4" />
                    Update license
                  </Button>
                </form>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Admin access</p>
                  <span className="text-xs text-slate-500">
                    {selectedTenant.users?.length ?? 0} admin{(selectedTenant.users?.length ?? 0) === 1 ? "" : "s"}
                  </span>
                </div>
                <form className="flex flex-col gap-2" onSubmit={handleAdminSave}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      type="email"
                      placeholder="Admin email"
                      value={adminInviteEmail}
                      onChange={(event) => setAdminInviteEmail(event.target.value)}
                      className="bg-slate-50"
                      required
                    />
                    <Input
                      type="password"
                      placeholder="Admin password"
                      value={adminInvitePassword}
                      onChange={(event) => setAdminInvitePassword(event.target.value)}
                      className="bg-slate-50"
                      required
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="submit"
                      disabled={isInviteSending || !adminInviteEmail || !adminInvitePassword}
                    >
                      {isInviteSending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="mr-2 h-4 w-4" />
                      )}
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isInviteSending || !adminInviteEmail || !adminInvitePassword}
                      onClick={handleAdminInvite}
                    >
                      {isInviteSending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="mr-2 h-4 w-4" />
                      )}
                      Send admin invite
                    </Button>
                  </div>
                </form>
                <div className="mt-4 space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  {selectedTenant.users && selectedTenant.users.length > 0 ? (
                    selectedTenant.users.map((admin) => (
                      <div
                        key={admin.id}
                        className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {admin.firstName || admin.lastName
                              ? `${admin.firstName ?? ""} ${admin.lastName ?? ""}`.trim()
                              : admin.email}
                          </p>
                          <p className="text-xs text-slate-500">{admin.email}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant={admin.status === "ACTIVE" ? "default" : "outline"}>
                              {admin.status}
                            </Badge>
                            <span className="text-slate-500">
                              Created {new Date(admin.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isAdminActioning === admin.id}
                            onClick={() => handleAdminPasswordReset(admin.id)}
                          >
                            {isAdminActioning === admin.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Reset password
                          </Button>
                          {admin.status === "SUSPENDED" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-emerald-200 text-emerald-600"
                              disabled={isAdminActioning === admin.id}
                              onClick={() => handleAdminStatusChange(admin.id, "ACTIVE")}
                            >
                              {isAdminActioning === admin.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              Activate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-orange-200 text-orange-500"
                              disabled={isAdminActioning === admin.id}
                              onClick={() => handleAdminStatusChange(admin.id, "SUSPENDED")}
                            >
                              {isAdminActioning === admin.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              Suspend
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No admins yet. Create or invite one above.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Usage snapshots</p>
                {selectedTenant.usage && selectedTenant.usage.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTenant.usage.map((snapshot) => (
                      <div
                        key={snapshot.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">
                            {formatUsageLabel(snapshot.year, snapshot.month)}
                          </span>
                          <span className="text-slate-500">{new Date(snapshot.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p>
                          <span className="font-semibold text-slate-900">{snapshot.activeStudents}</span> learners ·{" "}
                          <span className="font-semibold text-slate-900">{snapshot.applications}</span> applications
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No usage history yet.</p>
                )}
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Audit trail</p>
                {tenantAuditEntries.length === 0 ? (
                  <p className="text-sm text-slate-500">No recorded events.</p>
                ) : (
                  <div className="space-y-2 text-sm text-slate-600">
                    {tenantAuditEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-600"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{entry.label}</p>
                          <p className="text-xs text-slate-500">{entry.detail}</p>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      </section>
    </>
  );
}

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatUsageLabel(year: number, month: number) {
  return new Date(year, month - 1).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}
