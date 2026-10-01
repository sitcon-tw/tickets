/**
 * Fine-grained admin permissions and custom roles
 *
 * A permission is `<resource>:<action>`. Roles are just sets of permissions.
 * - "event" scoped permissions apply to the events a user may manage (all events, or only the assigned ones)
 * - "global" permissions are not tied to a single event
 */

import { z } from "zod/v4";

export type PermissionScope = "event" | "global";

type PermissionGroupDefinition = {
	key: string;
	scope: PermissionScope;
	actions: readonly string[];
	/** Per-action scope overrides (defaults to the group scope) */
	globalActions?: readonly string[];
};

const PERMISSION_GROUP_DEFINITIONS = [
	{ key: "dashboard", scope: "event", actions: ["view"] },
	{ key: "events", scope: "event", actions: ["view", "create", "update", "delete"], globalActions: ["create"] },
	{ key: "tickets", scope: "event", actions: ["view", "create", "update", "delete"] },
	{ key: "forms", scope: "event", actions: ["view", "create", "update", "delete"] },
	{ key: "invitationCodes", scope: "event", actions: ["view", "create", "update", "delete", "send"] },
	{ key: "sponsors", scope: "event", actions: ["view", "create", "update", "delete"] },
	{ key: "webhooks", scope: "event", actions: ["view", "manage"] },
	{ key: "registrations", scope: "event", actions: ["view", "update", "delete", "export"] },
	{ key: "emailCampaigns", scope: "global", actions: ["view", "create", "update", "send", "delete"] },
	{ key: "referrals", scope: "global", actions: ["view", "draw"] },
	{ key: "smsLogs", scope: "global", actions: ["view"] },
	{ key: "settings", scope: "global", actions: ["view", "update"] },
	{ key: "users", scope: "global", actions: ["view", "update"] },
	{ key: "roles", scope: "global", actions: ["view", "manage"] }
] as const satisfies readonly PermissionGroupDefinition[];

type GroupDefinition = (typeof PERMISSION_GROUP_DEFINITIONS)[number];

export type PermissionGroupKey = GroupDefinition["key"];

/** Every permission string, e.g. "registrations:export" */
export type Permission = {
	[G in GroupDefinition as G["key"]]: `${G["key"]}:${G["actions"][number]}`;
}[GroupDefinition["key"]];

export type PermissionEntry = {
	key: Permission;
	group: PermissionGroupKey;
	action: string;
	scope: PermissionScope;
};

export type PermissionGroup = {
	key: PermissionGroupKey;
	scope: PermissionScope;
	permissions: PermissionEntry[];
};

/** Catalog grouped by resource, in display order */
export const PERMISSION_GROUPS: readonly PermissionGroup[] = PERMISSION_GROUP_DEFINITIONS.map((group: PermissionGroupDefinition & { key: PermissionGroupKey }) => ({
	key: group.key,
	scope: group.scope,
	permissions: group.actions.map(action => ({
		key: `${group.key}:${action}` as Permission,
		group: group.key,
		action,
		scope: group.globalActions?.includes(action) ? ("global" as const) : group.scope
	}))
}));

export const PERMISSION_ENTRIES: readonly PermissionEntry[] = PERMISSION_GROUPS.flatMap(group => group.permissions);

export const ALL_PERMISSIONS = PERMISSION_ENTRIES.map(entry => entry.key) as [Permission, ...Permission[]];

const PERMISSION_SET: ReadonlySet<string> = new Set(ALL_PERMISSIONS);

export const isPermission = (value: string): value is Permission => PERMISSION_SET.has(value);

export const PermissionSchema = z.enum(ALL_PERMISSIONS);

/**
 * What the built-in roles are allowed to do.
 * - admin: everything, on every event
 * - eventAdmin: the event-scoped tools, on the events assigned to the user
 * - viewer: no admin access
 */
export const EVENT_ADMIN_PERMISSIONS: readonly Permission[] = ALL_PERMISSIONS.filter(permission => {
	const entry = PERMISSION_ENTRIES.find(candidate => candidate.key === permission)!;
	return entry.scope === "event" && permission !== "events:delete";
});

export const BUILTIN_ROLE_PERMISSIONS = {
	admin: ALL_PERMISSIONS as readonly Permission[],
	eventAdmin: EVENT_ADMIN_PERMISSIONS,
	viewer: [] as readonly Permission[]
} as const;

export const MAX_ROLE_NAME_LENGTH = 50;
export const MAX_ROLE_DESCRIPTION_LENGTH = 200;

/**
 * Custom role entity
 */
export const RoleSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	permissions: z.array(z.string()),
	/** true = the role applies to every event, false = only the events assigned to each user */
	allEvents: z.boolean(),
	userCount: z.number().optional(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date()
});
export type Role = z.infer<typeof RoleSchema>;

export const RoleCreateRequestSchema = z.object({
	name: z.string().trim().min(1).max(MAX_ROLE_NAME_LENGTH),
	description: z.string().trim().max(MAX_ROLE_DESCRIPTION_LENGTH).nullable().optional(),
	permissions: z.array(PermissionSchema).max(ALL_PERMISSIONS.length),
	allEvents: z.boolean().optional()
});
export type RoleCreateRequest = z.infer<typeof RoleCreateRequestSchema>;

export const RoleUpdateRequestSchema = RoleCreateRequestSchema.partial();
export type RoleUpdateRequest = z.infer<typeof RoleUpdateRequestSchema>;
