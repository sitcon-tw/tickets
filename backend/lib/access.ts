import { ALL_PERMISSIONS, BUILTIN_ROLE_PERMISSIONS, isPermission, type Permission, type UserRole } from "@sitcontix/types";
import { safeJsonParse } from "../utils/json";

/** What a user is allowed to do in the admin area, resolved from their role */
export interface AccessContext {
	role: UserRole;
	permissions: ReadonlySet<Permission>;
	/** true = event-scoped permissions apply to every event */
	allEvents: boolean;
	/** Events the user may manage when `allEvents` is false */
	eventIds: string[];
}

export interface AccessSource {
	role: string;
	/** JSON array of event IDs */
	permissions: string | null;
	customRole: { permissions: string; allEvents: boolean } | null;
}

/** Keep only permission keys that still exist, so removed permissions never linger in stored roles */
export const parsePermissionList = (raw: string | null | undefined): Permission[] =>
	safeJsonParse<unknown[]>(raw, [], "role permissions").filter((value): value is Permission => typeof value === "string" && isPermission(value));

export const resolveAccess = (source: AccessSource): AccessContext => {
	const eventIds = safeJsonParse<string[]>(source.permissions, [], "user event permissions");

	switch (source.role) {
		case "admin":
			return { role: "admin", permissions: new Set(ALL_PERMISSIONS), allEvents: true, eventIds };
		case "eventAdmin":
			return { role: "eventAdmin", permissions: new Set(BUILTIN_ROLE_PERMISSIONS.eventAdmin), allEvents: false, eventIds };
		case "custom":
			if (source.customRole) {
				return { role: "custom", permissions: new Set(parsePermissionList(source.customRole.permissions)), allEvents: source.customRole.allEvents, eventIds };
			}
			return { role: "custom", permissions: new Set(), allEvents: false, eventIds: [] };
		default:
			return { role: "viewer", permissions: new Set(), allEvents: false, eventIds: [] };
	}
};

export const canAccessEvent = (access: AccessContext, eventId: string): boolean => access.allEvents || access.eventIds.includes(eventId);

/** Permissions in `wanted` that `access` does not itself have */
export const missingPermissions = (access: AccessContext, wanted: readonly string[]): string[] => wanted.filter(permission => !access.permissions.has(permission as Permission));
