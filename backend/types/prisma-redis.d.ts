/**
 * Type declarations for prisma-extension-redis
 * Extends Prisma client types to include caching capabilities
 */

import type { Prisma } from "@prisma/client";

declare module "@prisma/client" {
	/**
	 * Cache invalidation configuration
	 */
	interface UncacheConfig {
		/** Array of cache keys or key patterns to invalidate */
		uncacheKeys: string[];
		/** Whether the uncacheKeys contain wildcard patterns (requires pattern matching) */
		hasPattern?: boolean;
	}

	/**
	 * Cache control configuration for individual queries
	 */
	interface CacheControl {
		/** Time-to-live in seconds for this specific query */
		ttl?: number;
		/** Stale time in seconds after TTL expires */
		stale?: number;
		/** Custom cache key to use instead of auto-generated key */
		key?: string;
	}

	/**
	 * Extended query options with caching support
	 */
	interface QueryOptions {
		/** Enable/disable caching or provide custom cache configuration */
		cache?: boolean | CacheControl;
		/** Cache invalidation configuration for write operations */
		uncache?: UncacheConfig;
	}

	// Extend all Prisma query methods to support cache options
	namespace Prisma {
		interface UserFindUniqueArgs extends QueryOptions {}
		interface UserFindFirstArgs extends QueryOptions {}
		interface UserFindManyArgs extends QueryOptions {}
		interface UserCreateArgs extends QueryOptions {}
		interface UserUpdateArgs extends QueryOptions {}
		interface UserDeleteArgs extends QueryOptions {}
		interface UserUpsertArgs extends QueryOptions {}

		interface EventFindUniqueArgs extends QueryOptions {}
		interface EventFindFirstArgs extends QueryOptions {}
		interface EventFindManyArgs extends QueryOptions {}
		interface EventCreateArgs extends QueryOptions {}
		interface EventUpdateArgs extends QueryOptions {}
		interface EventDeleteArgs extends QueryOptions {}
		interface EventUpsertArgs extends QueryOptions {}

		interface TicketFindUniqueArgs extends QueryOptions {}
		interface TicketFindFirstArgs extends QueryOptions {}
		interface TicketFindManyArgs extends QueryOptions {}
		interface TicketCreateArgs extends QueryOptions {}
		interface TicketUpdateArgs extends QueryOptions {}
		interface TicketDeleteArgs extends QueryOptions {}
		interface TicketUpsertArgs extends QueryOptions {}

		interface EventFormFieldsFindUniqueArgs extends QueryOptions {}
		interface EventFormFieldsFindFirstArgs extends QueryOptions {}
		interface EventFormFieldsFindManyArgs extends QueryOptions {}
		interface EventFormFieldsCreateArgs extends QueryOptions {}
		interface EventFormFieldsUpdateArgs extends QueryOptions {}
		interface EventFormFieldsDeleteArgs extends QueryOptions {}
		interface EventFormFieldsUpsertArgs extends QueryOptions {}

		interface RegistrationFindUniqueArgs extends QueryOptions {}
		interface RegistrationFindFirstArgs extends QueryOptions {}
		interface RegistrationFindManyArgs extends QueryOptions {}
		interface RegistrationCreateArgs extends QueryOptions {}
		interface RegistrationUpdateArgs extends QueryOptions {}
		interface RegistrationDeleteArgs extends QueryOptions {}
		interface RegistrationUpsertArgs extends QueryOptions {}

		interface InvitationCodeFindUniqueArgs extends QueryOptions {}
		interface InvitationCodeFindFirstArgs extends QueryOptions {}
		interface InvitationCodeFindManyArgs extends QueryOptions {}
		interface InvitationCodeCreateArgs extends QueryOptions {}
		interface InvitationCodeUpdateArgs extends QueryOptions {}
		interface InvitationCodeDeleteArgs extends QueryOptions {}
		interface InvitationCodeUpsertArgs extends QueryOptions {}

		interface ReferralFindUniqueArgs extends QueryOptions {}
		interface ReferralFindFirstArgs extends QueryOptions {}
		interface ReferralFindManyArgs extends QueryOptions {}
		interface ReferralCreateArgs extends QueryOptions {}
		interface ReferralUpdateArgs extends QueryOptions {}
		interface ReferralDeleteArgs extends QueryOptions {}
		interface ReferralUpsertArgs extends QueryOptions {}

		interface ReferralUsageFindUniqueArgs extends QueryOptions {}
		interface ReferralUsageFindFirstArgs extends QueryOptions {}
		interface ReferralUsageFindManyArgs extends QueryOptions {}
		interface ReferralUsageCreateArgs extends QueryOptions {}
		interface ReferralUsageUpdateArgs extends QueryOptions {}
		interface ReferralUsageDeleteArgs extends QueryOptions {}
		interface ReferralUsageUpsertArgs extends QueryOptions {}

		interface EmailCampaignFindUniqueArgs extends QueryOptions {}
		interface EmailCampaignFindFirstArgs extends QueryOptions {}
		interface EmailCampaignFindManyArgs extends QueryOptions {}
		interface EmailCampaignCreateArgs extends QueryOptions {}
		interface EmailCampaignUpdateArgs extends QueryOptions {}
		interface EmailCampaignDeleteArgs extends QueryOptions {}
		interface EmailCampaignUpsertArgs extends QueryOptions {}
	}

	/**
	 * Extended Prisma Client with cache helper methods
	 */
	interface PrismaClient {
		/**
		 * Generate a cache key from parameters
		 * @example
		 * const key = prisma.getKey({ params: [{ prisma: 'User' }, { id: '123' }] })
		 * // Returns: "prisma:user:id:123"
		 */
		getKey?(params: { params: Array<Record<string, string>> }): string;

		/**
		 * Generate a cache key pattern with wildcards
		 * @example
		 * const pattern = prisma.getKeyPattern({ params: [{ prisma: 'User' }, { glob: '*' }] })
		 * // Returns: "prisma:user:*"
		 */
		getKeyPattern?(params: { params: Array<Record<string, string>> }): string;

		/**
		 * Generate an automatic cache key based on query parameters
		 * Used internally by auto-caching
		 */
		getAutoKey?(params: { params: Array<Record<string, any>> }): string;
	}
}

export {};
