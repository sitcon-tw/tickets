import { z } from 'zod';
import { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = Prisma.JsonValue | null | 'JsonNull' | 'DbNull' | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return Prisma.NullTypes.DbNull;
  if (v === 'JsonNull') return Prisma.NullTypes.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.string(), z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.any() }),
    z.record(z.string(), z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const UserScalarFieldEnumSchema = z.enum(['id','name','email','emailVerified','image','role','permissions','isActive','phoneNumber','phoneVerified','createdAt','updatedAt']);

export const SessionScalarFieldEnumSchema = z.enum(['id','expiresAt','token','createdAt','updatedAt','ipAddress','userAgent','userId']);

export const AccountScalarFieldEnumSchema = z.enum(['id','accountId','providerId','userId','accessToken','refreshToken','idToken','accessTokenExpiresAt','refreshTokenExpiresAt','scope','password','createdAt','updatedAt']);

export const VerificationScalarFieldEnumSchema = z.enum(['id','identifier','value','expiresAt','createdAt','updatedAt']);

export const EventScalarFieldEnumSchema = z.enum(['id','slug','name','description','plainDescription','location','startDate','endDate','ogImage','landingPage','googleSheetsUrl','isActive','hideEvent','useOpass','createdAt','updatedAt']);

export const TicketScalarFieldEnumSchema = z.enum(['id','eventId','order','name','description','plainDescription','price','quantity','soldCount','saleStart','saleEnd','requireInviteCode','requireSmsVerification','hidden','isActive','createdAt','updatedAt']);

export const EventFormFieldsScalarFieldEnumSchema = z.enum(['id','eventId','order','type','validater','name','description','placeholder','required','values','filters','prompts']);

export const RegistrationScalarFieldEnumSchema = z.enum(['id','userId','eventId','ticketId','email','formData','status','referredBy','createdAt','updatedAt']);

export const ReferralScalarFieldEnumSchema = z.enum(['id','code','registrationId','eventId','isActive','createdAt','updatedAt']);

export const ReferralUsageScalarFieldEnumSchema = z.enum(['id','referralId','registrationId','eventId','usedAt']);

export const InvitationCodeScalarFieldEnumSchema = z.enum(['id','ticketId','code','name','usageLimit','usedCount','validFrom','validUntil','isActive','createdAt','updatedAt']);

export const EmailCampaignScalarFieldEnumSchema = z.enum(['id','userId','name','subject','content','recipientFilter','status','sentCount','totalCount','scheduledAt','sentAt','createdAt','updatedAt']);

export const SmsVerificationScalarFieldEnumSchema = z.enum(['id','userId','phoneNumber','code','verified','expiresAt','createdAt','updatedAt']);

export const MagicLinkAttemptScalarFieldEnumSchema = z.enum(['id','email','ipAddress','success','sessionId','createdAt']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const JsonNullValueInputSchema = z.enum(['JsonNull',]).transform((value) => (value === 'JsonNull' ? Prisma.JsonNull : value));

export const NullableJsonNullValueInputSchema = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);

export const JsonNullValueFilterSchema = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value === 'AnyNull' ? Prisma.AnyNull : value);
/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: z.string(),
  permissions: z.string().nullable(),
  isActive: z.boolean(),
  phoneNumber: z.string().nullable(),
  phoneVerified: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// USER PARTIAL SCHEMA
/////////////////////////////////////////

export const UserPartialSchema = UserSchema.partial()

export type UserPartial = z.infer<typeof UserPartialSchema>

// USER OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const UserOptionalDefaultsSchema = UserSchema.merge(z.object({
  role: z.string().optional(),
  isActive: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
}))

export type UserOptionalDefaults = z.infer<typeof UserOptionalDefaultsSchema>

// USER RELATION SCHEMA
//------------------------------------------------------

export type UserRelations = {
  sessions: SessionWithRelations[];
  accounts: AccountWithRelations[];
  emailCampaigns: EmailCampaignWithRelations[];
  registrations: RegistrationWithRelations[];
  smsVerifications: SmsVerificationWithRelations[];
};

export type UserWithRelations = z.infer<typeof UserSchema> & UserRelations

export const UserWithRelationsSchema: z.ZodType<UserWithRelations> = UserSchema.merge(z.object({
  sessions: z.lazy(() => SessionWithRelationsSchema).array(),
  accounts: z.lazy(() => AccountWithRelationsSchema).array(),
  emailCampaigns: z.lazy(() => EmailCampaignWithRelationsSchema).array(),
  registrations: z.lazy(() => RegistrationWithRelationsSchema).array(),
  smsVerifications: z.lazy(() => SmsVerificationWithRelationsSchema).array(),
}))

// USER OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type UserOptionalDefaultsRelations = {
  sessions: SessionOptionalDefaultsWithRelations[];
  accounts: AccountOptionalDefaultsWithRelations[];
  emailCampaigns: EmailCampaignOptionalDefaultsWithRelations[];
  registrations: RegistrationOptionalDefaultsWithRelations[];
  smsVerifications: SmsVerificationOptionalDefaultsWithRelations[];
};

export type UserOptionalDefaultsWithRelations = z.infer<typeof UserOptionalDefaultsSchema> & UserOptionalDefaultsRelations

export const UserOptionalDefaultsWithRelationsSchema: z.ZodType<UserOptionalDefaultsWithRelations> = UserOptionalDefaultsSchema.merge(z.object({
  sessions: z.lazy(() => SessionOptionalDefaultsWithRelationsSchema).array(),
  accounts: z.lazy(() => AccountOptionalDefaultsWithRelationsSchema).array(),
  emailCampaigns: z.lazy(() => EmailCampaignOptionalDefaultsWithRelationsSchema).array(),
  registrations: z.lazy(() => RegistrationOptionalDefaultsWithRelationsSchema).array(),
  smsVerifications: z.lazy(() => SmsVerificationOptionalDefaultsWithRelationsSchema).array(),
}))

// USER PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type UserPartialRelations = {
  sessions?: SessionPartialWithRelations[];
  accounts?: AccountPartialWithRelations[];
  emailCampaigns?: EmailCampaignPartialWithRelations[];
  registrations?: RegistrationPartialWithRelations[];
  smsVerifications?: SmsVerificationPartialWithRelations[];
};

export type UserPartialWithRelations = z.infer<typeof UserPartialSchema> & UserPartialRelations

export const UserPartialWithRelationsSchema: z.ZodType<UserPartialWithRelations> = UserPartialSchema.merge(z.object({
  sessions: z.lazy(() => SessionPartialWithRelationsSchema).array(),
  accounts: z.lazy(() => AccountPartialWithRelationsSchema).array(),
  emailCampaigns: z.lazy(() => EmailCampaignPartialWithRelationsSchema).array(),
  registrations: z.lazy(() => RegistrationPartialWithRelationsSchema).array(),
  smsVerifications: z.lazy(() => SmsVerificationPartialWithRelationsSchema).array(),
})).partial()

export type UserOptionalDefaultsWithPartialRelations = z.infer<typeof UserOptionalDefaultsSchema> & UserPartialRelations

export const UserOptionalDefaultsWithPartialRelationsSchema: z.ZodType<UserOptionalDefaultsWithPartialRelations> = UserOptionalDefaultsSchema.merge(z.object({
  sessions: z.lazy(() => SessionPartialWithRelationsSchema).array(),
  accounts: z.lazy(() => AccountPartialWithRelationsSchema).array(),
  emailCampaigns: z.lazy(() => EmailCampaignPartialWithRelationsSchema).array(),
  registrations: z.lazy(() => RegistrationPartialWithRelationsSchema).array(),
  smsVerifications: z.lazy(() => SmsVerificationPartialWithRelationsSchema).array(),
}).partial())

export type UserWithPartialRelations = z.infer<typeof UserSchema> & UserPartialRelations

export const UserWithPartialRelationsSchema: z.ZodType<UserWithPartialRelations> = UserSchema.merge(z.object({
  sessions: z.lazy(() => SessionPartialWithRelationsSchema).array(),
  accounts: z.lazy(() => AccountPartialWithRelationsSchema).array(),
  emailCampaigns: z.lazy(() => EmailCampaignPartialWithRelationsSchema).array(),
  registrations: z.lazy(() => RegistrationPartialWithRelationsSchema).array(),
  smsVerifications: z.lazy(() => SmsVerificationPartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// SESSION SCHEMA
/////////////////////////////////////////

export const SessionSchema = z.object({
  id: z.string(),
  expiresAt: z.coerce.date(),
  token: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  userId: z.string(),
})

export type Session = z.infer<typeof SessionSchema>

/////////////////////////////////////////
// SESSION PARTIAL SCHEMA
/////////////////////////////////////////

export const SessionPartialSchema = SessionSchema.partial()

export type SessionPartial = z.infer<typeof SessionPartialSchema>

// SESSION OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const SessionOptionalDefaultsSchema = SessionSchema.merge(z.object({
}))

export type SessionOptionalDefaults = z.infer<typeof SessionOptionalDefaultsSchema>

// SESSION RELATION SCHEMA
//------------------------------------------------------

export type SessionRelations = {
  user: UserWithRelations;
};

export type SessionWithRelations = z.infer<typeof SessionSchema> & SessionRelations

export const SessionWithRelationsSchema: z.ZodType<SessionWithRelations> = SessionSchema.merge(z.object({
  user: z.lazy(() => UserWithRelationsSchema),
}))

// SESSION OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type SessionOptionalDefaultsRelations = {
  user: UserOptionalDefaultsWithRelations;
};

export type SessionOptionalDefaultsWithRelations = z.infer<typeof SessionOptionalDefaultsSchema> & SessionOptionalDefaultsRelations

export const SessionOptionalDefaultsWithRelationsSchema: z.ZodType<SessionOptionalDefaultsWithRelations> = SessionOptionalDefaultsSchema.merge(z.object({
  user: z.lazy(() => UserOptionalDefaultsWithRelationsSchema),
}))

// SESSION PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type SessionPartialRelations = {
  user?: UserPartialWithRelations;
};

export type SessionPartialWithRelations = z.infer<typeof SessionPartialSchema> & SessionPartialRelations

export const SessionPartialWithRelationsSchema: z.ZodType<SessionPartialWithRelations> = SessionPartialSchema.merge(z.object({
  user: z.lazy(() => UserPartialWithRelationsSchema),
})).partial()

export type SessionOptionalDefaultsWithPartialRelations = z.infer<typeof SessionOptionalDefaultsSchema> & SessionPartialRelations

export const SessionOptionalDefaultsWithPartialRelationsSchema: z.ZodType<SessionOptionalDefaultsWithPartialRelations> = SessionOptionalDefaultsSchema.merge(z.object({
  user: z.lazy(() => UserPartialWithRelationsSchema),
}).partial())

export type SessionWithPartialRelations = z.infer<typeof SessionSchema> & SessionPartialRelations

export const SessionWithPartialRelationsSchema: z.ZodType<SessionWithPartialRelations> = SessionSchema.merge(z.object({
  user: z.lazy(() => UserPartialWithRelationsSchema),
}).partial())

/////////////////////////////////////////
// ACCOUNT SCHEMA
/////////////////////////////////////////

export const AccountSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string().nullable(),
  refreshToken: z.string().nullable(),
  idToken: z.string().nullable(),
  accessTokenExpiresAt: z.coerce.date().nullable(),
  refreshTokenExpiresAt: z.coerce.date().nullable(),
  scope: z.string().nullable(),
  password: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Account = z.infer<typeof AccountSchema>

/////////////////////////////////////////
// ACCOUNT PARTIAL SCHEMA
/////////////////////////////////////////

export const AccountPartialSchema = AccountSchema.partial()

export type AccountPartial = z.infer<typeof AccountPartialSchema>

// ACCOUNT OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const AccountOptionalDefaultsSchema = AccountSchema.merge(z.object({
}))

export type AccountOptionalDefaults = z.infer<typeof AccountOptionalDefaultsSchema>

// ACCOUNT RELATION SCHEMA
//------------------------------------------------------

export type AccountRelations = {
  user: UserWithRelations;
};

export type AccountWithRelations = z.infer<typeof AccountSchema> & AccountRelations

export const AccountWithRelationsSchema: z.ZodType<AccountWithRelations> = AccountSchema.merge(z.object({
  user: z.lazy(() => UserWithRelationsSchema),
}))

// ACCOUNT OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type AccountOptionalDefaultsRelations = {
  user: UserOptionalDefaultsWithRelations;
};

export type AccountOptionalDefaultsWithRelations = z.infer<typeof AccountOptionalDefaultsSchema> & AccountOptionalDefaultsRelations

export const AccountOptionalDefaultsWithRelationsSchema: z.ZodType<AccountOptionalDefaultsWithRelations> = AccountOptionalDefaultsSchema.merge(z.object({
  user: z.lazy(() => UserOptionalDefaultsWithRelationsSchema),
}))

// ACCOUNT PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type AccountPartialRelations = {
  user?: UserPartialWithRelations;
};

export type AccountPartialWithRelations = z.infer<typeof AccountPartialSchema> & AccountPartialRelations

export const AccountPartialWithRelationsSchema: z.ZodType<AccountPartialWithRelations> = AccountPartialSchema.merge(z.object({
  user: z.lazy(() => UserPartialWithRelationsSchema),
})).partial()

export type AccountOptionalDefaultsWithPartialRelations = z.infer<typeof AccountOptionalDefaultsSchema> & AccountPartialRelations

export const AccountOptionalDefaultsWithPartialRelationsSchema: z.ZodType<AccountOptionalDefaultsWithPartialRelations> = AccountOptionalDefaultsSchema.merge(z.object({
  user: z.lazy(() => UserPartialWithRelationsSchema),
}).partial())

export type AccountWithPartialRelations = z.infer<typeof AccountSchema> & AccountPartialRelations

export const AccountWithPartialRelationsSchema: z.ZodType<AccountWithPartialRelations> = AccountSchema.merge(z.object({
  user: z.lazy(() => UserPartialWithRelationsSchema),
}).partial())

/////////////////////////////////////////
// VERIFICATION SCHEMA
/////////////////////////////////////////

export const VerificationSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().nullable(),
  updatedAt: z.coerce.date().nullable(),
})

export type Verification = z.infer<typeof VerificationSchema>

/////////////////////////////////////////
// VERIFICATION PARTIAL SCHEMA
/////////////////////////////////////////

export const VerificationPartialSchema = VerificationSchema.partial()

export type VerificationPartial = z.infer<typeof VerificationPartialSchema>

// VERIFICATION OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const VerificationOptionalDefaultsSchema = VerificationSchema.merge(z.object({
}))

export type VerificationOptionalDefaults = z.infer<typeof VerificationOptionalDefaultsSchema>

/////////////////////////////////////////
// EVENT SCHEMA
/////////////////////////////////////////

export const EventSchema = z.object({
  id: z.cuid(),
  slug: z.string().nullable(),
  name: JsonValueSchema,
  description: JsonValueSchema.nullable(),
  plainDescription: JsonValueSchema.nullable(),
  location: z.string().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  ogImage: z.string().nullable(),
  landingPage: z.string().nullable(),
  googleSheetsUrl: z.string().nullable(),
  isActive: z.boolean(),
  hideEvent: z.boolean(),
  useOpass: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Event = z.infer<typeof EventSchema>

/////////////////////////////////////////
// EVENT PARTIAL SCHEMA
/////////////////////////////////////////

export const EventPartialSchema = EventSchema.partial()

export type EventPartial = z.infer<typeof EventPartialSchema>

// EVENT OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const EventOptionalDefaultsSchema = EventSchema.merge(z.object({
  id: z.cuid().optional(),
  isActive: z.boolean().optional(),
  hideEvent: z.boolean().optional(),
  useOpass: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type EventOptionalDefaults = z.infer<typeof EventOptionalDefaultsSchema>

// EVENT RELATION SCHEMA
//------------------------------------------------------

export type EventRelations = {
  tickets: TicketWithRelations[];
  registrations: RegistrationWithRelations[];
  referrals: ReferralWithRelations[];
  referralUsage: ReferralUsageWithRelations[];
  formFields: EventFormFieldsWithRelations[];
};

export type EventWithRelations = Omit<z.infer<typeof EventSchema>, "description" | "plainDescription"> & {
  description?: JsonValueType | null;
  plainDescription?: JsonValueType | null;
} & EventRelations

export const EventWithRelationsSchema: z.ZodType<EventWithRelations> = EventSchema.merge(z.object({
  tickets: z.lazy(() => TicketWithRelationsSchema).array(),
  registrations: z.lazy(() => RegistrationWithRelationsSchema).array(),
  referrals: z.lazy(() => ReferralWithRelationsSchema).array(),
  referralUsage: z.lazy(() => ReferralUsageWithRelationsSchema).array(),
  formFields: z.lazy(() => EventFormFieldsWithRelationsSchema).array(),
}))

// EVENT OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type EventOptionalDefaultsRelations = {
  tickets: TicketOptionalDefaultsWithRelations[];
  registrations: RegistrationOptionalDefaultsWithRelations[];
  referrals: ReferralOptionalDefaultsWithRelations[];
  referralUsage: ReferralUsageOptionalDefaultsWithRelations[];
  formFields: EventFormFieldsOptionalDefaultsWithRelations[];
};

export type EventOptionalDefaultsWithRelations = Omit<z.infer<typeof EventOptionalDefaultsSchema>, "description" | "plainDescription"> & {
  description?: JsonValueType | null;
  plainDescription?: JsonValueType | null;
} & EventOptionalDefaultsRelations

export const EventOptionalDefaultsWithRelationsSchema: z.ZodType<EventOptionalDefaultsWithRelations> = EventOptionalDefaultsSchema.merge(z.object({
  tickets: z.lazy(() => TicketOptionalDefaultsWithRelationsSchema).array(),
  registrations: z.lazy(() => RegistrationOptionalDefaultsWithRelationsSchema).array(),
  referrals: z.lazy(() => ReferralOptionalDefaultsWithRelationsSchema).array(),
  referralUsage: z.lazy(() => ReferralUsageOptionalDefaultsWithRelationsSchema).array(),
  formFields: z.lazy(() => EventFormFieldsOptionalDefaultsWithRelationsSchema).array(),
}))

// EVENT PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type EventPartialRelations = {
  tickets?: TicketPartialWithRelations[];
  registrations?: RegistrationPartialWithRelations[];
  referrals?: ReferralPartialWithRelations[];
  referralUsage?: ReferralUsagePartialWithRelations[];
  formFields?: EventFormFieldsPartialWithRelations[];
};

export type EventPartialWithRelations = Omit<z.infer<typeof EventPartialSchema>, "description" | "plainDescription"> & {
  description?: JsonValueType | null;
  plainDescription?: JsonValueType | null;
} & EventPartialRelations

export const EventPartialWithRelationsSchema: z.ZodType<EventPartialWithRelations> = EventPartialSchema.merge(z.object({
  tickets: z.lazy(() => TicketPartialWithRelationsSchema).array(),
  registrations: z.lazy(() => RegistrationPartialWithRelationsSchema).array(),
  referrals: z.lazy(() => ReferralPartialWithRelationsSchema).array(),
  referralUsage: z.lazy(() => ReferralUsagePartialWithRelationsSchema).array(),
  formFields: z.lazy(() => EventFormFieldsPartialWithRelationsSchema).array(),
})).partial()

export type EventOptionalDefaultsWithPartialRelations = Omit<z.infer<typeof EventOptionalDefaultsSchema>, "description" | "plainDescription"> & {
  description?: JsonValueType | null;
  plainDescription?: JsonValueType | null;
} & EventPartialRelations

export const EventOptionalDefaultsWithPartialRelationsSchema: z.ZodType<EventOptionalDefaultsWithPartialRelations> = EventOptionalDefaultsSchema.merge(z.object({
  tickets: z.lazy(() => TicketPartialWithRelationsSchema).array(),
  registrations: z.lazy(() => RegistrationPartialWithRelationsSchema).array(),
  referrals: z.lazy(() => ReferralPartialWithRelationsSchema).array(),
  referralUsage: z.lazy(() => ReferralUsagePartialWithRelationsSchema).array(),
  formFields: z.lazy(() => EventFormFieldsPartialWithRelationsSchema).array(),
}).partial())

export type EventWithPartialRelations = Omit<z.infer<typeof EventSchema>, "description" | "plainDescription"> & {
  description?: JsonValueType | null;
  plainDescription?: JsonValueType | null;
} & EventPartialRelations

export const EventWithPartialRelationsSchema: z.ZodType<EventWithPartialRelations> = EventSchema.merge(z.object({
  tickets: z.lazy(() => TicketPartialWithRelationsSchema).array(),
  registrations: z.lazy(() => RegistrationPartialWithRelationsSchema).array(),
  referrals: z.lazy(() => ReferralPartialWithRelationsSchema).array(),
  referralUsage: z.lazy(() => ReferralUsagePartialWithRelationsSchema).array(),
  formFields: z.lazy(() => EventFormFieldsPartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// TICKET SCHEMA
/////////////////////////////////////////

export const TicketSchema = z.object({
  id: z.cuid(),
  eventId: z.string(),
  order: z.number().int(),
  name: JsonValueSchema,
  description: JsonValueSchema.nullable(),
  plainDescription: JsonValueSchema.nullable(),
  price: z.number().int(),
  quantity: z.number().int(),
  soldCount: z.number().int(),
  saleStart: z.coerce.date().nullable(),
  saleEnd: z.coerce.date().nullable(),
  requireInviteCode: z.boolean(),
  requireSmsVerification: z.boolean(),
  hidden: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Ticket = z.infer<typeof TicketSchema>

/////////////////////////////////////////
// TICKET PARTIAL SCHEMA
/////////////////////////////////////////

export const TicketPartialSchema = TicketSchema.partial()

export type TicketPartial = z.infer<typeof TicketPartialSchema>

// TICKET OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const TicketOptionalDefaultsSchema = TicketSchema.merge(z.object({
  id: z.cuid().optional(),
  order: z.number().int().optional(),
  soldCount: z.number().int().optional(),
  requireInviteCode: z.boolean().optional(),
  requireSmsVerification: z.boolean().optional(),
  hidden: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type TicketOptionalDefaults = z.infer<typeof TicketOptionalDefaultsSchema>

// TICKET RELATION SCHEMA
//------------------------------------------------------

export type TicketRelations = {
  event: EventWithRelations;
  registrations: RegistrationWithRelations[];
  invitationCodes: InvitationCodeWithRelations[];
};

export type TicketWithRelations = Omit<z.infer<typeof TicketSchema>, "description" | "plainDescription"> & {
  description?: JsonValueType | null;
  plainDescription?: JsonValueType | null;
} & TicketRelations

export const TicketWithRelationsSchema: z.ZodType<TicketWithRelations> = TicketSchema.merge(z.object({
  event: z.lazy(() => EventWithRelationsSchema),
  registrations: z.lazy(() => RegistrationWithRelationsSchema).array(),
  invitationCodes: z.lazy(() => InvitationCodeWithRelationsSchema).array(),
}))

// TICKET OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type TicketOptionalDefaultsRelations = {
  event: EventOptionalDefaultsWithRelations;
  registrations: RegistrationOptionalDefaultsWithRelations[];
  invitationCodes: InvitationCodeOptionalDefaultsWithRelations[];
};

export type TicketOptionalDefaultsWithRelations = Omit<z.infer<typeof TicketOptionalDefaultsSchema>, "description" | "plainDescription"> & {
  description?: JsonValueType | null;
  plainDescription?: JsonValueType | null;
} & TicketOptionalDefaultsRelations

export const TicketOptionalDefaultsWithRelationsSchema: z.ZodType<TicketOptionalDefaultsWithRelations> = TicketOptionalDefaultsSchema.merge(z.object({
  event: z.lazy(() => EventOptionalDefaultsWithRelationsSchema),
  registrations: z.lazy(() => RegistrationOptionalDefaultsWithRelationsSchema).array(),
  invitationCodes: z.lazy(() => InvitationCodeOptionalDefaultsWithRelationsSchema).array(),
}))

// TICKET PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type TicketPartialRelations = {
  event?: EventPartialWithRelations;
  registrations?: RegistrationPartialWithRelations[];
  invitationCodes?: InvitationCodePartialWithRelations[];
};

export type TicketPartialWithRelations = Omit<z.infer<typeof TicketPartialSchema>, "description" | "plainDescription"> & {
  description?: JsonValueType | null;
  plainDescription?: JsonValueType | null;
} & TicketPartialRelations

export const TicketPartialWithRelationsSchema: z.ZodType<TicketPartialWithRelations> = TicketPartialSchema.merge(z.object({
  event: z.lazy(() => EventPartialWithRelationsSchema),
  registrations: z.lazy(() => RegistrationPartialWithRelationsSchema).array(),
  invitationCodes: z.lazy(() => InvitationCodePartialWithRelationsSchema).array(),
})).partial()

export type TicketOptionalDefaultsWithPartialRelations = Omit<z.infer<typeof TicketOptionalDefaultsSchema>, "description" | "plainDescription"> & {
  description?: JsonValueType | null;
  plainDescription?: JsonValueType | null;
} & TicketPartialRelations

export const TicketOptionalDefaultsWithPartialRelationsSchema: z.ZodType<TicketOptionalDefaultsWithPartialRelations> = TicketOptionalDefaultsSchema.merge(z.object({
  event: z.lazy(() => EventPartialWithRelationsSchema),
  registrations: z.lazy(() => RegistrationPartialWithRelationsSchema).array(),
  invitationCodes: z.lazy(() => InvitationCodePartialWithRelationsSchema).array(),
}).partial())

export type TicketWithPartialRelations = Omit<z.infer<typeof TicketSchema>, "description" | "plainDescription"> & {
  description?: JsonValueType | null;
  plainDescription?: JsonValueType | null;
} & TicketPartialRelations

export const TicketWithPartialRelationsSchema: z.ZodType<TicketWithPartialRelations> = TicketSchema.merge(z.object({
  event: z.lazy(() => EventPartialWithRelationsSchema),
  registrations: z.lazy(() => RegistrationPartialWithRelationsSchema).array(),
  invitationCodes: z.lazy(() => InvitationCodePartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// EVENT FORM FIELDS SCHEMA
/////////////////////////////////////////

export const EventFormFieldsSchema = z.object({
  id: z.cuid(),
  eventId: z.string(),
  order: z.number().int(),
  type: z.string(),
  validater: z.string().nullable(),
  name: JsonValueSchema,
  description: JsonValueSchema.nullable(),
  placeholder: z.string().nullable(),
  required: z.boolean(),
  values: JsonValueSchema.nullable(),
  filters: JsonValueSchema.nullable(),
  prompts: JsonValueSchema.nullable(),
})

export type EventFormFields = z.infer<typeof EventFormFieldsSchema>

/////////////////////////////////////////
// EVENT FORM FIELDS PARTIAL SCHEMA
/////////////////////////////////////////

export const EventFormFieldsPartialSchema = EventFormFieldsSchema.partial()

export type EventFormFieldsPartial = z.infer<typeof EventFormFieldsPartialSchema>

// EVENT FORM FIELDS OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const EventFormFieldsOptionalDefaultsSchema = EventFormFieldsSchema.merge(z.object({
  id: z.cuid().optional(),
  required: z.boolean().optional(),
}))

export type EventFormFieldsOptionalDefaults = z.infer<typeof EventFormFieldsOptionalDefaultsSchema>

// EVENT FORM FIELDS RELATION SCHEMA
//------------------------------------------------------

export type EventFormFieldsRelations = {
  event: EventWithRelations;
};

export type EventFormFieldsWithRelations = Omit<z.infer<typeof EventFormFieldsSchema>, "description" | "values" | "filters" | "prompts"> & {
  description?: JsonValueType | null;
  values?: JsonValueType | null;
  filters?: JsonValueType | null;
  prompts?: JsonValueType | null;
} & EventFormFieldsRelations

export const EventFormFieldsWithRelationsSchema: z.ZodType<EventFormFieldsWithRelations> = EventFormFieldsSchema.merge(z.object({
  event: z.lazy(() => EventWithRelationsSchema),
}))

// EVENT FORM FIELDS OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type EventFormFieldsOptionalDefaultsRelations = {
  event: EventOptionalDefaultsWithRelations;
};

export type EventFormFieldsOptionalDefaultsWithRelations = Omit<z.infer<typeof EventFormFieldsOptionalDefaultsSchema>, "description" | "values" | "filters" | "prompts"> & {
  description?: JsonValueType | null;
  values?: JsonValueType | null;
  filters?: JsonValueType | null;
  prompts?: JsonValueType | null;
} & EventFormFieldsOptionalDefaultsRelations

export const EventFormFieldsOptionalDefaultsWithRelationsSchema: z.ZodType<EventFormFieldsOptionalDefaultsWithRelations> = EventFormFieldsOptionalDefaultsSchema.merge(z.object({
  event: z.lazy(() => EventOptionalDefaultsWithRelationsSchema),
}))

// EVENT FORM FIELDS PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type EventFormFieldsPartialRelations = {
  event?: EventPartialWithRelations;
};

export type EventFormFieldsPartialWithRelations = Omit<z.infer<typeof EventFormFieldsPartialSchema>, "description" | "values" | "filters" | "prompts"> & {
  description?: JsonValueType | null;
  values?: JsonValueType | null;
  filters?: JsonValueType | null;
  prompts?: JsonValueType | null;
} & EventFormFieldsPartialRelations

export const EventFormFieldsPartialWithRelationsSchema: z.ZodType<EventFormFieldsPartialWithRelations> = EventFormFieldsPartialSchema.merge(z.object({
  event: z.lazy(() => EventPartialWithRelationsSchema),
})).partial()

export type EventFormFieldsOptionalDefaultsWithPartialRelations = Omit<z.infer<typeof EventFormFieldsOptionalDefaultsSchema>, "description" | "values" | "filters" | "prompts"> & {
  description?: JsonValueType | null;
  values?: JsonValueType | null;
  filters?: JsonValueType | null;
  prompts?: JsonValueType | null;
} & EventFormFieldsPartialRelations

export const EventFormFieldsOptionalDefaultsWithPartialRelationsSchema: z.ZodType<EventFormFieldsOptionalDefaultsWithPartialRelations> = EventFormFieldsOptionalDefaultsSchema.merge(z.object({
  event: z.lazy(() => EventPartialWithRelationsSchema),
}).partial())

export type EventFormFieldsWithPartialRelations = Omit<z.infer<typeof EventFormFieldsSchema>, "description" | "values" | "filters" | "prompts"> & {
  description?: JsonValueType | null;
  values?: JsonValueType | null;
  filters?: JsonValueType | null;
  prompts?: JsonValueType | null;
} & EventFormFieldsPartialRelations

export const EventFormFieldsWithPartialRelationsSchema: z.ZodType<EventFormFieldsWithPartialRelations> = EventFormFieldsSchema.merge(z.object({
  event: z.lazy(() => EventPartialWithRelationsSchema),
}).partial())

/////////////////////////////////////////
// REGISTRATION SCHEMA
/////////////////////////////////////////

export const RegistrationSchema = z.object({
  id: z.cuid(),
  userId: z.string(),
  eventId: z.string(),
  ticketId: z.string(),
  email: z.string(),
  formData: z.string().nullable(),
  status: z.string(),
  referredBy: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Registration = z.infer<typeof RegistrationSchema>

/////////////////////////////////////////
// REGISTRATION PARTIAL SCHEMA
/////////////////////////////////////////

export const RegistrationPartialSchema = RegistrationSchema.partial()

export type RegistrationPartial = z.infer<typeof RegistrationPartialSchema>

// REGISTRATION OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const RegistrationOptionalDefaultsSchema = RegistrationSchema.merge(z.object({
  id: z.cuid().optional(),
  status: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type RegistrationOptionalDefaults = z.infer<typeof RegistrationOptionalDefaultsSchema>

// REGISTRATION RELATION SCHEMA
//------------------------------------------------------

export type RegistrationRelations = {
  user: UserWithRelations;
  event: EventWithRelations;
  ticket: TicketWithRelations;
  referrals: RegistrationWithRelations[];
  referrer?: RegistrationWithRelations | null;
  referral?: ReferralWithRelations | null;
  referralUsage: ReferralUsageWithRelations[];
};

export type RegistrationWithRelations = z.infer<typeof RegistrationSchema> & RegistrationRelations

export const RegistrationWithRelationsSchema: z.ZodType<RegistrationWithRelations> = RegistrationSchema.merge(z.object({
  user: z.lazy(() => UserWithRelationsSchema),
  event: z.lazy(() => EventWithRelationsSchema),
  ticket: z.lazy(() => TicketWithRelationsSchema),
  referrals: z.lazy(() => RegistrationWithRelationsSchema).array(),
  referrer: z.lazy(() => RegistrationWithRelationsSchema).nullable(),
  referral: z.lazy(() => ReferralWithRelationsSchema).nullable(),
  referralUsage: z.lazy(() => ReferralUsageWithRelationsSchema).array(),
}))

// REGISTRATION OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type RegistrationOptionalDefaultsRelations = {
  user: UserOptionalDefaultsWithRelations;
  event: EventOptionalDefaultsWithRelations;
  ticket: TicketOptionalDefaultsWithRelations;
  referrals: RegistrationOptionalDefaultsWithRelations[];
  referrer?: RegistrationOptionalDefaultsWithRelations | null;
  referral?: ReferralOptionalDefaultsWithRelations | null;
  referralUsage: ReferralUsageOptionalDefaultsWithRelations[];
};

export type RegistrationOptionalDefaultsWithRelations = z.infer<typeof RegistrationOptionalDefaultsSchema> & RegistrationOptionalDefaultsRelations

export const RegistrationOptionalDefaultsWithRelationsSchema: z.ZodType<RegistrationOptionalDefaultsWithRelations> = RegistrationOptionalDefaultsSchema.merge(z.object({
  user: z.lazy(() => UserOptionalDefaultsWithRelationsSchema),
  event: z.lazy(() => EventOptionalDefaultsWithRelationsSchema),
  ticket: z.lazy(() => TicketOptionalDefaultsWithRelationsSchema),
  referrals: z.lazy(() => RegistrationOptionalDefaultsWithRelationsSchema).array(),
  referrer: z.lazy(() => RegistrationOptionalDefaultsWithRelationsSchema).nullable(),
  referral: z.lazy(() => ReferralOptionalDefaultsWithRelationsSchema).nullable(),
  referralUsage: z.lazy(() => ReferralUsageOptionalDefaultsWithRelationsSchema).array(),
}))

// REGISTRATION PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type RegistrationPartialRelations = {
  user?: UserPartialWithRelations;
  event?: EventPartialWithRelations;
  ticket?: TicketPartialWithRelations;
  referrals?: RegistrationPartialWithRelations[];
  referrer?: RegistrationPartialWithRelations | null;
  referral?: ReferralPartialWithRelations | null;
  referralUsage?: ReferralUsagePartialWithRelations[];
};

export type RegistrationPartialWithRelations = z.infer<typeof RegistrationPartialSchema> & RegistrationPartialRelations

export const RegistrationPartialWithRelationsSchema: z.ZodType<RegistrationPartialWithRelations> = RegistrationPartialSchema.merge(z.object({
  user: z.lazy(() => UserPartialWithRelationsSchema),
  event: z.lazy(() => EventPartialWithRelationsSchema),
  ticket: z.lazy(() => TicketPartialWithRelationsSchema),
  referrals: z.lazy(() => RegistrationPartialWithRelationsSchema).array(),
  referrer: z.lazy(() => RegistrationPartialWithRelationsSchema).nullable(),
  referral: z.lazy(() => ReferralPartialWithRelationsSchema).nullable(),
  referralUsage: z.lazy(() => ReferralUsagePartialWithRelationsSchema).array(),
})).partial()

export type RegistrationOptionalDefaultsWithPartialRelations = z.infer<typeof RegistrationOptionalDefaultsSchema> & RegistrationPartialRelations

export const RegistrationOptionalDefaultsWithPartialRelationsSchema: z.ZodType<RegistrationOptionalDefaultsWithPartialRelations> = RegistrationOptionalDefaultsSchema.merge(z.object({
  user: z.lazy(() => UserPartialWithRelationsSchema),
  event: z.lazy(() => EventPartialWithRelationsSchema),
  ticket: z.lazy(() => TicketPartialWithRelationsSchema),
  referrals: z.lazy(() => RegistrationPartialWithRelationsSchema).array(),
  referrer: z.lazy(() => RegistrationPartialWithRelationsSchema).nullable(),
  referral: z.lazy(() => ReferralPartialWithRelationsSchema).nullable(),
  referralUsage: z.lazy(() => ReferralUsagePartialWithRelationsSchema).array(),
}).partial())

export type RegistrationWithPartialRelations = z.infer<typeof RegistrationSchema> & RegistrationPartialRelations

export const RegistrationWithPartialRelationsSchema: z.ZodType<RegistrationWithPartialRelations> = RegistrationSchema.merge(z.object({
  user: z.lazy(() => UserPartialWithRelationsSchema),
  event: z.lazy(() => EventPartialWithRelationsSchema),
  ticket: z.lazy(() => TicketPartialWithRelationsSchema),
  referrals: z.lazy(() => RegistrationPartialWithRelationsSchema).array(),
  referrer: z.lazy(() => RegistrationPartialWithRelationsSchema).nullable(),
  referral: z.lazy(() => ReferralPartialWithRelationsSchema).nullable(),
  referralUsage: z.lazy(() => ReferralUsagePartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// REFERRAL SCHEMA
/////////////////////////////////////////

export const ReferralSchema = z.object({
  id: z.cuid(),
  code: z.string(),
  registrationId: z.string(),
  eventId: z.string(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Referral = z.infer<typeof ReferralSchema>

/////////////////////////////////////////
// REFERRAL PARTIAL SCHEMA
/////////////////////////////////////////

export const ReferralPartialSchema = ReferralSchema.partial()

export type ReferralPartial = z.infer<typeof ReferralPartialSchema>

// REFERRAL OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const ReferralOptionalDefaultsSchema = ReferralSchema.merge(z.object({
  id: z.cuid().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type ReferralOptionalDefaults = z.infer<typeof ReferralOptionalDefaultsSchema>

// REFERRAL RELATION SCHEMA
//------------------------------------------------------

export type ReferralRelations = {
  registration: RegistrationWithRelations;
  event: EventWithRelations;
  referredUsers: ReferralUsageWithRelations[];
};

export type ReferralWithRelations = z.infer<typeof ReferralSchema> & ReferralRelations

export const ReferralWithRelationsSchema: z.ZodType<ReferralWithRelations> = ReferralSchema.merge(z.object({
  registration: z.lazy(() => RegistrationWithRelationsSchema),
  event: z.lazy(() => EventWithRelationsSchema),
  referredUsers: z.lazy(() => ReferralUsageWithRelationsSchema).array(),
}))

// REFERRAL OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type ReferralOptionalDefaultsRelations = {
  registration: RegistrationOptionalDefaultsWithRelations;
  event: EventOptionalDefaultsWithRelations;
  referredUsers: ReferralUsageOptionalDefaultsWithRelations[];
};

export type ReferralOptionalDefaultsWithRelations = z.infer<typeof ReferralOptionalDefaultsSchema> & ReferralOptionalDefaultsRelations

export const ReferralOptionalDefaultsWithRelationsSchema: z.ZodType<ReferralOptionalDefaultsWithRelations> = ReferralOptionalDefaultsSchema.merge(z.object({
  registration: z.lazy(() => RegistrationOptionalDefaultsWithRelationsSchema),
  event: z.lazy(() => EventOptionalDefaultsWithRelationsSchema),
  referredUsers: z.lazy(() => ReferralUsageOptionalDefaultsWithRelationsSchema).array(),
}))

// REFERRAL PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type ReferralPartialRelations = {
  registration?: RegistrationPartialWithRelations;
  event?: EventPartialWithRelations;
  referredUsers?: ReferralUsagePartialWithRelations[];
};

export type ReferralPartialWithRelations = z.infer<typeof ReferralPartialSchema> & ReferralPartialRelations

export const ReferralPartialWithRelationsSchema: z.ZodType<ReferralPartialWithRelations> = ReferralPartialSchema.merge(z.object({
  registration: z.lazy(() => RegistrationPartialWithRelationsSchema),
  event: z.lazy(() => EventPartialWithRelationsSchema),
  referredUsers: z.lazy(() => ReferralUsagePartialWithRelationsSchema).array(),
})).partial()

export type ReferralOptionalDefaultsWithPartialRelations = z.infer<typeof ReferralOptionalDefaultsSchema> & ReferralPartialRelations

export const ReferralOptionalDefaultsWithPartialRelationsSchema: z.ZodType<ReferralOptionalDefaultsWithPartialRelations> = ReferralOptionalDefaultsSchema.merge(z.object({
  registration: z.lazy(() => RegistrationPartialWithRelationsSchema),
  event: z.lazy(() => EventPartialWithRelationsSchema),
  referredUsers: z.lazy(() => ReferralUsagePartialWithRelationsSchema).array(),
}).partial())

export type ReferralWithPartialRelations = z.infer<typeof ReferralSchema> & ReferralPartialRelations

export const ReferralWithPartialRelationsSchema: z.ZodType<ReferralWithPartialRelations> = ReferralSchema.merge(z.object({
  registration: z.lazy(() => RegistrationPartialWithRelationsSchema),
  event: z.lazy(() => EventPartialWithRelationsSchema),
  referredUsers: z.lazy(() => ReferralUsagePartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// REFERRAL USAGE SCHEMA
/////////////////////////////////////////

export const ReferralUsageSchema = z.object({
  id: z.cuid(),
  referralId: z.string(),
  registrationId: z.string(),
  eventId: z.string(),
  usedAt: z.coerce.date(),
})

export type ReferralUsage = z.infer<typeof ReferralUsageSchema>

/////////////////////////////////////////
// REFERRAL USAGE PARTIAL SCHEMA
/////////////////////////////////////////

export const ReferralUsagePartialSchema = ReferralUsageSchema.partial()

export type ReferralUsagePartial = z.infer<typeof ReferralUsagePartialSchema>

// REFERRAL USAGE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const ReferralUsageOptionalDefaultsSchema = ReferralUsageSchema.merge(z.object({
  id: z.cuid().optional(),
  usedAt: z.coerce.date().optional(),
}))

export type ReferralUsageOptionalDefaults = z.infer<typeof ReferralUsageOptionalDefaultsSchema>

// REFERRAL USAGE RELATION SCHEMA
//------------------------------------------------------

export type ReferralUsageRelations = {
  referral: ReferralWithRelations;
  registration: RegistrationWithRelations;
  event: EventWithRelations;
};

export type ReferralUsageWithRelations = z.infer<typeof ReferralUsageSchema> & ReferralUsageRelations

export const ReferralUsageWithRelationsSchema: z.ZodType<ReferralUsageWithRelations> = ReferralUsageSchema.merge(z.object({
  referral: z.lazy(() => ReferralWithRelationsSchema),
  registration: z.lazy(() => RegistrationWithRelationsSchema),
  event: z.lazy(() => EventWithRelationsSchema),
}))

// REFERRAL USAGE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type ReferralUsageOptionalDefaultsRelations = {
  referral: ReferralOptionalDefaultsWithRelations;
  registration: RegistrationOptionalDefaultsWithRelations;
  event: EventOptionalDefaultsWithRelations;
};

export type ReferralUsageOptionalDefaultsWithRelations = z.infer<typeof ReferralUsageOptionalDefaultsSchema> & ReferralUsageOptionalDefaultsRelations

export const ReferralUsageOptionalDefaultsWithRelationsSchema: z.ZodType<ReferralUsageOptionalDefaultsWithRelations> = ReferralUsageOptionalDefaultsSchema.merge(z.object({
  referral: z.lazy(() => ReferralOptionalDefaultsWithRelationsSchema),
  registration: z.lazy(() => RegistrationOptionalDefaultsWithRelationsSchema),
  event: z.lazy(() => EventOptionalDefaultsWithRelationsSchema),
}))

// REFERRAL USAGE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type ReferralUsagePartialRelations = {
  referral?: ReferralPartialWithRelations;
  registration?: RegistrationPartialWithRelations;
  event?: EventPartialWithRelations;
};

export type ReferralUsagePartialWithRelations = z.infer<typeof ReferralUsagePartialSchema> & ReferralUsagePartialRelations

export const ReferralUsagePartialWithRelationsSchema: z.ZodType<ReferralUsagePartialWithRelations> = ReferralUsagePartialSchema.merge(z.object({
  referral: z.lazy(() => ReferralPartialWithRelationsSchema),
  registration: z.lazy(() => RegistrationPartialWithRelationsSchema),
  event: z.lazy(() => EventPartialWithRelationsSchema),
})).partial()

export type ReferralUsageOptionalDefaultsWithPartialRelations = z.infer<typeof ReferralUsageOptionalDefaultsSchema> & ReferralUsagePartialRelations

export const ReferralUsageOptionalDefaultsWithPartialRelationsSchema: z.ZodType<ReferralUsageOptionalDefaultsWithPartialRelations> = ReferralUsageOptionalDefaultsSchema.merge(z.object({
  referral: z.lazy(() => ReferralPartialWithRelationsSchema),
  registration: z.lazy(() => RegistrationPartialWithRelationsSchema),
  event: z.lazy(() => EventPartialWithRelationsSchema),
}).partial())

export type ReferralUsageWithPartialRelations = z.infer<typeof ReferralUsageSchema> & ReferralUsagePartialRelations

export const ReferralUsageWithPartialRelationsSchema: z.ZodType<ReferralUsageWithPartialRelations> = ReferralUsageSchema.merge(z.object({
  referral: z.lazy(() => ReferralPartialWithRelationsSchema),
  registration: z.lazy(() => RegistrationPartialWithRelationsSchema),
  event: z.lazy(() => EventPartialWithRelationsSchema),
}).partial())

/////////////////////////////////////////
// INVITATION CODE SCHEMA
/////////////////////////////////////////

export const InvitationCodeSchema = z.object({
  id: z.cuid(),
  ticketId: z.string(),
  code: z.string(),
  name: z.string().nullable(),
  usageLimit: z.number().int().nullable(),
  usedCount: z.number().int(),
  validFrom: z.coerce.date().nullable(),
  validUntil: z.coerce.date().nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type InvitationCode = z.infer<typeof InvitationCodeSchema>

/////////////////////////////////////////
// INVITATION CODE PARTIAL SCHEMA
/////////////////////////////////////////

export const InvitationCodePartialSchema = InvitationCodeSchema.partial()

export type InvitationCodePartial = z.infer<typeof InvitationCodePartialSchema>

// INVITATION CODE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const InvitationCodeOptionalDefaultsSchema = InvitationCodeSchema.merge(z.object({
  id: z.cuid().optional(),
  usedCount: z.number().int().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type InvitationCodeOptionalDefaults = z.infer<typeof InvitationCodeOptionalDefaultsSchema>

// INVITATION CODE RELATION SCHEMA
//------------------------------------------------------

export type InvitationCodeRelations = {
  ticket: TicketWithRelations;
};

export type InvitationCodeWithRelations = z.infer<typeof InvitationCodeSchema> & InvitationCodeRelations

export const InvitationCodeWithRelationsSchema: z.ZodType<InvitationCodeWithRelations> = InvitationCodeSchema.merge(z.object({
  ticket: z.lazy(() => TicketWithRelationsSchema),
}))

// INVITATION CODE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type InvitationCodeOptionalDefaultsRelations = {
  ticket: TicketOptionalDefaultsWithRelations;
};

export type InvitationCodeOptionalDefaultsWithRelations = z.infer<typeof InvitationCodeOptionalDefaultsSchema> & InvitationCodeOptionalDefaultsRelations

export const InvitationCodeOptionalDefaultsWithRelationsSchema: z.ZodType<InvitationCodeOptionalDefaultsWithRelations> = InvitationCodeOptionalDefaultsSchema.merge(z.object({
  ticket: z.lazy(() => TicketOptionalDefaultsWithRelationsSchema),
}))

// INVITATION CODE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type InvitationCodePartialRelations = {
  ticket?: TicketPartialWithRelations;
};

export type InvitationCodePartialWithRelations = z.infer<typeof InvitationCodePartialSchema> & InvitationCodePartialRelations

export const InvitationCodePartialWithRelationsSchema: z.ZodType<InvitationCodePartialWithRelations> = InvitationCodePartialSchema.merge(z.object({
  ticket: z.lazy(() => TicketPartialWithRelationsSchema),
})).partial()

export type InvitationCodeOptionalDefaultsWithPartialRelations = z.infer<typeof InvitationCodeOptionalDefaultsSchema> & InvitationCodePartialRelations

export const InvitationCodeOptionalDefaultsWithPartialRelationsSchema: z.ZodType<InvitationCodeOptionalDefaultsWithPartialRelations> = InvitationCodeOptionalDefaultsSchema.merge(z.object({
  ticket: z.lazy(() => TicketPartialWithRelationsSchema),
}).partial())

export type InvitationCodeWithPartialRelations = z.infer<typeof InvitationCodeSchema> & InvitationCodePartialRelations

export const InvitationCodeWithPartialRelationsSchema: z.ZodType<InvitationCodeWithPartialRelations> = InvitationCodeSchema.merge(z.object({
  ticket: z.lazy(() => TicketPartialWithRelationsSchema),
}).partial())

/////////////////////////////////////////
// EMAIL CAMPAIGN SCHEMA
/////////////////////////////////////////

export const EmailCampaignSchema = z.object({
  id: z.cuid(),
  userId: z.string(),
  name: z.string(),
  subject: z.string(),
  content: z.string(),
  recipientFilter: z.string().nullable(),
  status: z.string(),
  sentCount: z.number().int(),
  totalCount: z.number().int(),
  scheduledAt: z.coerce.date().nullable(),
  sentAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type EmailCampaign = z.infer<typeof EmailCampaignSchema>

/////////////////////////////////////////
// EMAIL CAMPAIGN PARTIAL SCHEMA
/////////////////////////////////////////

export const EmailCampaignPartialSchema = EmailCampaignSchema.partial()

export type EmailCampaignPartial = z.infer<typeof EmailCampaignPartialSchema>

// EMAIL CAMPAIGN OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const EmailCampaignOptionalDefaultsSchema = EmailCampaignSchema.merge(z.object({
  id: z.cuid().optional(),
  status: z.string().optional(),
  sentCount: z.number().int().optional(),
  totalCount: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type EmailCampaignOptionalDefaults = z.infer<typeof EmailCampaignOptionalDefaultsSchema>

// EMAIL CAMPAIGN RELATION SCHEMA
//------------------------------------------------------

export type EmailCampaignRelations = {
  user: UserWithRelations;
};

export type EmailCampaignWithRelations = z.infer<typeof EmailCampaignSchema> & EmailCampaignRelations

export const EmailCampaignWithRelationsSchema: z.ZodType<EmailCampaignWithRelations> = EmailCampaignSchema.merge(z.object({
  user: z.lazy(() => UserWithRelationsSchema),
}))

// EMAIL CAMPAIGN OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type EmailCampaignOptionalDefaultsRelations = {
  user: UserOptionalDefaultsWithRelations;
};

export type EmailCampaignOptionalDefaultsWithRelations = z.infer<typeof EmailCampaignOptionalDefaultsSchema> & EmailCampaignOptionalDefaultsRelations

export const EmailCampaignOptionalDefaultsWithRelationsSchema: z.ZodType<EmailCampaignOptionalDefaultsWithRelations> = EmailCampaignOptionalDefaultsSchema.merge(z.object({
  user: z.lazy(() => UserOptionalDefaultsWithRelationsSchema),
}))

// EMAIL CAMPAIGN PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type EmailCampaignPartialRelations = {
  user?: UserPartialWithRelations;
};

export type EmailCampaignPartialWithRelations = z.infer<typeof EmailCampaignPartialSchema> & EmailCampaignPartialRelations

export const EmailCampaignPartialWithRelationsSchema: z.ZodType<EmailCampaignPartialWithRelations> = EmailCampaignPartialSchema.merge(z.object({
  user: z.lazy(() => UserPartialWithRelationsSchema),
})).partial()

export type EmailCampaignOptionalDefaultsWithPartialRelations = z.infer<typeof EmailCampaignOptionalDefaultsSchema> & EmailCampaignPartialRelations

export const EmailCampaignOptionalDefaultsWithPartialRelationsSchema: z.ZodType<EmailCampaignOptionalDefaultsWithPartialRelations> = EmailCampaignOptionalDefaultsSchema.merge(z.object({
  user: z.lazy(() => UserPartialWithRelationsSchema),
}).partial())

export type EmailCampaignWithPartialRelations = z.infer<typeof EmailCampaignSchema> & EmailCampaignPartialRelations

export const EmailCampaignWithPartialRelationsSchema: z.ZodType<EmailCampaignWithPartialRelations> = EmailCampaignSchema.merge(z.object({
  user: z.lazy(() => UserPartialWithRelationsSchema),
}).partial())

/////////////////////////////////////////
// SMS VERIFICATION SCHEMA
/////////////////////////////////////////

export const SmsVerificationSchema = z.object({
  id: z.cuid(),
  userId: z.string(),
  phoneNumber: z.string(),
  code: z.string(),
  verified: z.boolean(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type SmsVerification = z.infer<typeof SmsVerificationSchema>

/////////////////////////////////////////
// SMS VERIFICATION PARTIAL SCHEMA
/////////////////////////////////////////

export const SmsVerificationPartialSchema = SmsVerificationSchema.partial()

export type SmsVerificationPartial = z.infer<typeof SmsVerificationPartialSchema>

// SMS VERIFICATION OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const SmsVerificationOptionalDefaultsSchema = SmsVerificationSchema.merge(z.object({
  id: z.cuid().optional(),
  verified: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type SmsVerificationOptionalDefaults = z.infer<typeof SmsVerificationOptionalDefaultsSchema>

// SMS VERIFICATION RELATION SCHEMA
//------------------------------------------------------

export type SmsVerificationRelations = {
  user: UserWithRelations;
};

export type SmsVerificationWithRelations = z.infer<typeof SmsVerificationSchema> & SmsVerificationRelations

export const SmsVerificationWithRelationsSchema: z.ZodType<SmsVerificationWithRelations> = SmsVerificationSchema.merge(z.object({
  user: z.lazy(() => UserWithRelationsSchema),
}))

// SMS VERIFICATION OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type SmsVerificationOptionalDefaultsRelations = {
  user: UserOptionalDefaultsWithRelations;
};

export type SmsVerificationOptionalDefaultsWithRelations = z.infer<typeof SmsVerificationOptionalDefaultsSchema> & SmsVerificationOptionalDefaultsRelations

export const SmsVerificationOptionalDefaultsWithRelationsSchema: z.ZodType<SmsVerificationOptionalDefaultsWithRelations> = SmsVerificationOptionalDefaultsSchema.merge(z.object({
  user: z.lazy(() => UserOptionalDefaultsWithRelationsSchema),
}))

// SMS VERIFICATION PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type SmsVerificationPartialRelations = {
  user?: UserPartialWithRelations;
};

export type SmsVerificationPartialWithRelations = z.infer<typeof SmsVerificationPartialSchema> & SmsVerificationPartialRelations

export const SmsVerificationPartialWithRelationsSchema: z.ZodType<SmsVerificationPartialWithRelations> = SmsVerificationPartialSchema.merge(z.object({
  user: z.lazy(() => UserPartialWithRelationsSchema),
})).partial()

export type SmsVerificationOptionalDefaultsWithPartialRelations = z.infer<typeof SmsVerificationOptionalDefaultsSchema> & SmsVerificationPartialRelations

export const SmsVerificationOptionalDefaultsWithPartialRelationsSchema: z.ZodType<SmsVerificationOptionalDefaultsWithPartialRelations> = SmsVerificationOptionalDefaultsSchema.merge(z.object({
  user: z.lazy(() => UserPartialWithRelationsSchema),
}).partial())

export type SmsVerificationWithPartialRelations = z.infer<typeof SmsVerificationSchema> & SmsVerificationPartialRelations

export const SmsVerificationWithPartialRelationsSchema: z.ZodType<SmsVerificationWithPartialRelations> = SmsVerificationSchema.merge(z.object({
  user: z.lazy(() => UserPartialWithRelationsSchema),
}).partial())

/////////////////////////////////////////
// MAGIC LINK ATTEMPT SCHEMA
/////////////////////////////////////////

export const MagicLinkAttemptSchema = z.object({
  id: z.cuid(),
  email: z.string(),
  ipAddress: z.string().nullable(),
  success: z.boolean(),
  sessionId: z.string().nullable(),
  createdAt: z.coerce.date(),
})

export type MagicLinkAttempt = z.infer<typeof MagicLinkAttemptSchema>

/////////////////////////////////////////
// MAGIC LINK ATTEMPT PARTIAL SCHEMA
/////////////////////////////////////////

export const MagicLinkAttemptPartialSchema = MagicLinkAttemptSchema.partial()

export type MagicLinkAttemptPartial = z.infer<typeof MagicLinkAttemptPartialSchema>

// MAGIC LINK ATTEMPT OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const MagicLinkAttemptOptionalDefaultsSchema = MagicLinkAttemptSchema.merge(z.object({
  id: z.cuid().optional(),
  success: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
}))

export type MagicLinkAttemptOptionalDefaults = z.infer<typeof MagicLinkAttemptOptionalDefaultsSchema>

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// USER
//------------------------------------------------------

export const UserIncludeSchema: z.ZodType<Prisma.UserInclude> = z.object({
  sessions: z.union([z.boolean(),z.lazy(() => SessionFindManyArgsSchema)]).optional(),
  accounts: z.union([z.boolean(),z.lazy(() => AccountFindManyArgsSchema)]).optional(),
  emailCampaigns: z.union([z.boolean(),z.lazy(() => EmailCampaignFindManyArgsSchema)]).optional(),
  registrations: z.union([z.boolean(),z.lazy(() => RegistrationFindManyArgsSchema)]).optional(),
  smsVerifications: z.union([z.boolean(),z.lazy(() => SmsVerificationFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const UserArgsSchema: z.ZodType<Prisma.UserDefaultArgs> = z.object({
  select: z.lazy(() => UserSelectSchema).optional(),
  include: z.lazy(() => UserIncludeSchema).optional(),
}).strict();

export const UserCountOutputTypeArgsSchema: z.ZodType<Prisma.UserCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => UserCountOutputTypeSelectSchema).nullish(),
}).strict();

export const UserCountOutputTypeSelectSchema: z.ZodType<Prisma.UserCountOutputTypeSelect> = z.object({
  sessions: z.boolean().optional(),
  accounts: z.boolean().optional(),
  emailCampaigns: z.boolean().optional(),
  registrations: z.boolean().optional(),
  smsVerifications: z.boolean().optional(),
}).strict();

export const UserSelectSchema: z.ZodType<Prisma.UserSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  email: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  image: z.boolean().optional(),
  role: z.boolean().optional(),
  permissions: z.boolean().optional(),
  isActive: z.boolean().optional(),
  phoneNumber: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  sessions: z.union([z.boolean(),z.lazy(() => SessionFindManyArgsSchema)]).optional(),
  accounts: z.union([z.boolean(),z.lazy(() => AccountFindManyArgsSchema)]).optional(),
  emailCampaigns: z.union([z.boolean(),z.lazy(() => EmailCampaignFindManyArgsSchema)]).optional(),
  registrations: z.union([z.boolean(),z.lazy(() => RegistrationFindManyArgsSchema)]).optional(),
  smsVerifications: z.union([z.boolean(),z.lazy(() => SmsVerificationFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict()

// SESSION
//------------------------------------------------------

export const SessionIncludeSchema: z.ZodType<Prisma.SessionInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict();

export const SessionArgsSchema: z.ZodType<Prisma.SessionDefaultArgs> = z.object({
  select: z.lazy(() => SessionSelectSchema).optional(),
  include: z.lazy(() => SessionIncludeSchema).optional(),
}).strict();

export const SessionSelectSchema: z.ZodType<Prisma.SessionSelect> = z.object({
  id: z.boolean().optional(),
  expiresAt: z.boolean().optional(),
  token: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  ipAddress: z.boolean().optional(),
  userAgent: z.boolean().optional(),
  userId: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

// ACCOUNT
//------------------------------------------------------

export const AccountIncludeSchema: z.ZodType<Prisma.AccountInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict();

export const AccountArgsSchema: z.ZodType<Prisma.AccountDefaultArgs> = z.object({
  select: z.lazy(() => AccountSelectSchema).optional(),
  include: z.lazy(() => AccountIncludeSchema).optional(),
}).strict();

export const AccountSelectSchema: z.ZodType<Prisma.AccountSelect> = z.object({
  id: z.boolean().optional(),
  accountId: z.boolean().optional(),
  providerId: z.boolean().optional(),
  userId: z.boolean().optional(),
  accessToken: z.boolean().optional(),
  refreshToken: z.boolean().optional(),
  idToken: z.boolean().optional(),
  accessTokenExpiresAt: z.boolean().optional(),
  refreshTokenExpiresAt: z.boolean().optional(),
  scope: z.boolean().optional(),
  password: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

// VERIFICATION
//------------------------------------------------------

export const VerificationSelectSchema: z.ZodType<Prisma.VerificationSelect> = z.object({
  id: z.boolean().optional(),
  identifier: z.boolean().optional(),
  value: z.boolean().optional(),
  expiresAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()

// EVENT
//------------------------------------------------------

export const EventIncludeSchema: z.ZodType<Prisma.EventInclude> = z.object({
  tickets: z.union([z.boolean(),z.lazy(() => TicketFindManyArgsSchema)]).optional(),
  registrations: z.union([z.boolean(),z.lazy(() => RegistrationFindManyArgsSchema)]).optional(),
  referrals: z.union([z.boolean(),z.lazy(() => ReferralFindManyArgsSchema)]).optional(),
  referralUsage: z.union([z.boolean(),z.lazy(() => ReferralUsageFindManyArgsSchema)]).optional(),
  formFields: z.union([z.boolean(),z.lazy(() => EventFormFieldsFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => EventCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const EventArgsSchema: z.ZodType<Prisma.EventDefaultArgs> = z.object({
  select: z.lazy(() => EventSelectSchema).optional(),
  include: z.lazy(() => EventIncludeSchema).optional(),
}).strict();

export const EventCountOutputTypeArgsSchema: z.ZodType<Prisma.EventCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => EventCountOutputTypeSelectSchema).nullish(),
}).strict();

export const EventCountOutputTypeSelectSchema: z.ZodType<Prisma.EventCountOutputTypeSelect> = z.object({
  tickets: z.boolean().optional(),
  registrations: z.boolean().optional(),
  referrals: z.boolean().optional(),
  referralUsage: z.boolean().optional(),
  formFields: z.boolean().optional(),
}).strict();

export const EventSelectSchema: z.ZodType<Prisma.EventSelect> = z.object({
  id: z.boolean().optional(),
  slug: z.boolean().optional(),
  name: z.boolean().optional(),
  description: z.boolean().optional(),
  plainDescription: z.boolean().optional(),
  location: z.boolean().optional(),
  startDate: z.boolean().optional(),
  endDate: z.boolean().optional(),
  ogImage: z.boolean().optional(),
  landingPage: z.boolean().optional(),
  googleSheetsUrl: z.boolean().optional(),
  isActive: z.boolean().optional(),
  hideEvent: z.boolean().optional(),
  useOpass: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  tickets: z.union([z.boolean(),z.lazy(() => TicketFindManyArgsSchema)]).optional(),
  registrations: z.union([z.boolean(),z.lazy(() => RegistrationFindManyArgsSchema)]).optional(),
  referrals: z.union([z.boolean(),z.lazy(() => ReferralFindManyArgsSchema)]).optional(),
  referralUsage: z.union([z.boolean(),z.lazy(() => ReferralUsageFindManyArgsSchema)]).optional(),
  formFields: z.union([z.boolean(),z.lazy(() => EventFormFieldsFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => EventCountOutputTypeArgsSchema)]).optional(),
}).strict()

// TICKET
//------------------------------------------------------

export const TicketIncludeSchema: z.ZodType<Prisma.TicketInclude> = z.object({
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  registrations: z.union([z.boolean(),z.lazy(() => RegistrationFindManyArgsSchema)]).optional(),
  invitationCodes: z.union([z.boolean(),z.lazy(() => InvitationCodeFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => TicketCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const TicketArgsSchema: z.ZodType<Prisma.TicketDefaultArgs> = z.object({
  select: z.lazy(() => TicketSelectSchema).optional(),
  include: z.lazy(() => TicketIncludeSchema).optional(),
}).strict();

export const TicketCountOutputTypeArgsSchema: z.ZodType<Prisma.TicketCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => TicketCountOutputTypeSelectSchema).nullish(),
}).strict();

export const TicketCountOutputTypeSelectSchema: z.ZodType<Prisma.TicketCountOutputTypeSelect> = z.object({
  registrations: z.boolean().optional(),
  invitationCodes: z.boolean().optional(),
}).strict();

export const TicketSelectSchema: z.ZodType<Prisma.TicketSelect> = z.object({
  id: z.boolean().optional(),
  eventId: z.boolean().optional(),
  order: z.boolean().optional(),
  name: z.boolean().optional(),
  description: z.boolean().optional(),
  plainDescription: z.boolean().optional(),
  price: z.boolean().optional(),
  quantity: z.boolean().optional(),
  soldCount: z.boolean().optional(),
  saleStart: z.boolean().optional(),
  saleEnd: z.boolean().optional(),
  requireInviteCode: z.boolean().optional(),
  requireSmsVerification: z.boolean().optional(),
  hidden: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  registrations: z.union([z.boolean(),z.lazy(() => RegistrationFindManyArgsSchema)]).optional(),
  invitationCodes: z.union([z.boolean(),z.lazy(() => InvitationCodeFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => TicketCountOutputTypeArgsSchema)]).optional(),
}).strict()

// EVENT FORM FIELDS
//------------------------------------------------------

export const EventFormFieldsIncludeSchema: z.ZodType<Prisma.EventFormFieldsInclude> = z.object({
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
}).strict();

export const EventFormFieldsArgsSchema: z.ZodType<Prisma.EventFormFieldsDefaultArgs> = z.object({
  select: z.lazy(() => EventFormFieldsSelectSchema).optional(),
  include: z.lazy(() => EventFormFieldsIncludeSchema).optional(),
}).strict();

export const EventFormFieldsSelectSchema: z.ZodType<Prisma.EventFormFieldsSelect> = z.object({
  id: z.boolean().optional(),
  eventId: z.boolean().optional(),
  order: z.boolean().optional(),
  type: z.boolean().optional(),
  validater: z.boolean().optional(),
  name: z.boolean().optional(),
  description: z.boolean().optional(),
  placeholder: z.boolean().optional(),
  required: z.boolean().optional(),
  values: z.boolean().optional(),
  filters: z.boolean().optional(),
  prompts: z.boolean().optional(),
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
}).strict()

// REGISTRATION
//------------------------------------------------------

export const RegistrationIncludeSchema: z.ZodType<Prisma.RegistrationInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  ticket: z.union([z.boolean(),z.lazy(() => TicketArgsSchema)]).optional(),
  referrals: z.union([z.boolean(),z.lazy(() => RegistrationFindManyArgsSchema)]).optional(),
  referrer: z.union([z.boolean(),z.lazy(() => RegistrationArgsSchema)]).optional(),
  referral: z.union([z.boolean(),z.lazy(() => ReferralArgsSchema)]).optional(),
  referralUsage: z.union([z.boolean(),z.lazy(() => ReferralUsageFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => RegistrationCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const RegistrationArgsSchema: z.ZodType<Prisma.RegistrationDefaultArgs> = z.object({
  select: z.lazy(() => RegistrationSelectSchema).optional(),
  include: z.lazy(() => RegistrationIncludeSchema).optional(),
}).strict();

export const RegistrationCountOutputTypeArgsSchema: z.ZodType<Prisma.RegistrationCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => RegistrationCountOutputTypeSelectSchema).nullish(),
}).strict();

export const RegistrationCountOutputTypeSelectSchema: z.ZodType<Prisma.RegistrationCountOutputTypeSelect> = z.object({
  referrals: z.boolean().optional(),
  referralUsage: z.boolean().optional(),
}).strict();

export const RegistrationSelectSchema: z.ZodType<Prisma.RegistrationSelect> = z.object({
  id: z.boolean().optional(),
  userId: z.boolean().optional(),
  eventId: z.boolean().optional(),
  ticketId: z.boolean().optional(),
  email: z.boolean().optional(),
  formData: z.boolean().optional(),
  status: z.boolean().optional(),
  referredBy: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  ticket: z.union([z.boolean(),z.lazy(() => TicketArgsSchema)]).optional(),
  referrals: z.union([z.boolean(),z.lazy(() => RegistrationFindManyArgsSchema)]).optional(),
  referrer: z.union([z.boolean(),z.lazy(() => RegistrationArgsSchema)]).optional(),
  referral: z.union([z.boolean(),z.lazy(() => ReferralArgsSchema)]).optional(),
  referralUsage: z.union([z.boolean(),z.lazy(() => ReferralUsageFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => RegistrationCountOutputTypeArgsSchema)]).optional(),
}).strict()

// REFERRAL
//------------------------------------------------------

export const ReferralIncludeSchema: z.ZodType<Prisma.ReferralInclude> = z.object({
  registration: z.union([z.boolean(),z.lazy(() => RegistrationArgsSchema)]).optional(),
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  referredUsers: z.union([z.boolean(),z.lazy(() => ReferralUsageFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => ReferralCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const ReferralArgsSchema: z.ZodType<Prisma.ReferralDefaultArgs> = z.object({
  select: z.lazy(() => ReferralSelectSchema).optional(),
  include: z.lazy(() => ReferralIncludeSchema).optional(),
}).strict();

export const ReferralCountOutputTypeArgsSchema: z.ZodType<Prisma.ReferralCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => ReferralCountOutputTypeSelectSchema).nullish(),
}).strict();

export const ReferralCountOutputTypeSelectSchema: z.ZodType<Prisma.ReferralCountOutputTypeSelect> = z.object({
  referredUsers: z.boolean().optional(),
}).strict();

export const ReferralSelectSchema: z.ZodType<Prisma.ReferralSelect> = z.object({
  id: z.boolean().optional(),
  code: z.boolean().optional(),
  registrationId: z.boolean().optional(),
  eventId: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  registration: z.union([z.boolean(),z.lazy(() => RegistrationArgsSchema)]).optional(),
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
  referredUsers: z.union([z.boolean(),z.lazy(() => ReferralUsageFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => ReferralCountOutputTypeArgsSchema)]).optional(),
}).strict()

// REFERRAL USAGE
//------------------------------------------------------

export const ReferralUsageIncludeSchema: z.ZodType<Prisma.ReferralUsageInclude> = z.object({
  referral: z.union([z.boolean(),z.lazy(() => ReferralArgsSchema)]).optional(),
  registration: z.union([z.boolean(),z.lazy(() => RegistrationArgsSchema)]).optional(),
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
}).strict();

export const ReferralUsageArgsSchema: z.ZodType<Prisma.ReferralUsageDefaultArgs> = z.object({
  select: z.lazy(() => ReferralUsageSelectSchema).optional(),
  include: z.lazy(() => ReferralUsageIncludeSchema).optional(),
}).strict();

export const ReferralUsageSelectSchema: z.ZodType<Prisma.ReferralUsageSelect> = z.object({
  id: z.boolean().optional(),
  referralId: z.boolean().optional(),
  registrationId: z.boolean().optional(),
  eventId: z.boolean().optional(),
  usedAt: z.boolean().optional(),
  referral: z.union([z.boolean(),z.lazy(() => ReferralArgsSchema)]).optional(),
  registration: z.union([z.boolean(),z.lazy(() => RegistrationArgsSchema)]).optional(),
  event: z.union([z.boolean(),z.lazy(() => EventArgsSchema)]).optional(),
}).strict()

// INVITATION CODE
//------------------------------------------------------

export const InvitationCodeIncludeSchema: z.ZodType<Prisma.InvitationCodeInclude> = z.object({
  ticket: z.union([z.boolean(),z.lazy(() => TicketArgsSchema)]).optional(),
}).strict();

export const InvitationCodeArgsSchema: z.ZodType<Prisma.InvitationCodeDefaultArgs> = z.object({
  select: z.lazy(() => InvitationCodeSelectSchema).optional(),
  include: z.lazy(() => InvitationCodeIncludeSchema).optional(),
}).strict();

export const InvitationCodeSelectSchema: z.ZodType<Prisma.InvitationCodeSelect> = z.object({
  id: z.boolean().optional(),
  ticketId: z.boolean().optional(),
  code: z.boolean().optional(),
  name: z.boolean().optional(),
  usageLimit: z.boolean().optional(),
  usedCount: z.boolean().optional(),
  validFrom: z.boolean().optional(),
  validUntil: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  ticket: z.union([z.boolean(),z.lazy(() => TicketArgsSchema)]).optional(),
}).strict()

// EMAIL CAMPAIGN
//------------------------------------------------------

export const EmailCampaignIncludeSchema: z.ZodType<Prisma.EmailCampaignInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict();

export const EmailCampaignArgsSchema: z.ZodType<Prisma.EmailCampaignDefaultArgs> = z.object({
  select: z.lazy(() => EmailCampaignSelectSchema).optional(),
  include: z.lazy(() => EmailCampaignIncludeSchema).optional(),
}).strict();

export const EmailCampaignSelectSchema: z.ZodType<Prisma.EmailCampaignSelect> = z.object({
  id: z.boolean().optional(),
  userId: z.boolean().optional(),
  name: z.boolean().optional(),
  subject: z.boolean().optional(),
  content: z.boolean().optional(),
  recipientFilter: z.boolean().optional(),
  status: z.boolean().optional(),
  sentCount: z.boolean().optional(),
  totalCount: z.boolean().optional(),
  scheduledAt: z.boolean().optional(),
  sentAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

// SMS VERIFICATION
//------------------------------------------------------

export const SmsVerificationIncludeSchema: z.ZodType<Prisma.SmsVerificationInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict();

export const SmsVerificationArgsSchema: z.ZodType<Prisma.SmsVerificationDefaultArgs> = z.object({
  select: z.lazy(() => SmsVerificationSelectSchema).optional(),
  include: z.lazy(() => SmsVerificationIncludeSchema).optional(),
}).strict();

export const SmsVerificationSelectSchema: z.ZodType<Prisma.SmsVerificationSelect> = z.object({
  id: z.boolean().optional(),
  userId: z.boolean().optional(),
  phoneNumber: z.boolean().optional(),
  code: z.boolean().optional(),
  verified: z.boolean().optional(),
  expiresAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

// MAGIC LINK ATTEMPT
//------------------------------------------------------

export const MagicLinkAttemptSelectSchema: z.ZodType<Prisma.MagicLinkAttemptSelect> = z.object({
  id: z.boolean().optional(),
  email: z.boolean().optional(),
  ipAddress: z.boolean().optional(),
  success: z.boolean().optional(),
  sessionId: z.boolean().optional(),
  createdAt: z.boolean().optional(),
}).strict()


/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const UserWhereInputSchema: z.ZodType<Prisma.UserWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  emailVerified: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  image: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  role: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  permissions: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  phoneNumber: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  phoneVerified: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  sessions: z.lazy(() => SessionListRelationFilterSchema).optional(),
  accounts: z.lazy(() => AccountListRelationFilterSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignListRelationFilterSchema).optional(),
  registrations: z.lazy(() => RegistrationListRelationFilterSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationListRelationFilterSchema).optional(),
});

export const UserOrderByWithRelationInputSchema: z.ZodType<Prisma.UserOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  emailVerified: z.lazy(() => SortOrderSchema).optional(),
  image: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  permissions: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  phoneNumber: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  phoneVerified: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  sessions: z.lazy(() => SessionOrderByRelationAggregateInputSchema).optional(),
  accounts: z.lazy(() => AccountOrderByRelationAggregateInputSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignOrderByRelationAggregateInputSchema).optional(),
  registrations: z.lazy(() => RegistrationOrderByRelationAggregateInputSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationOrderByRelationAggregateInputSchema).optional(),
});

export const UserWhereUniqueInputSchema: z.ZodType<Prisma.UserWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    email: z.string(),
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    email: z.string(),
  }),
])
.and(z.strictObject({
  id: z.string().optional(),
  email: z.string().optional(),
  AND: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  emailVerified: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  image: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  role: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  permissions: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  phoneNumber: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  phoneVerified: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  sessions: z.lazy(() => SessionListRelationFilterSchema).optional(),
  accounts: z.lazy(() => AccountListRelationFilterSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignListRelationFilterSchema).optional(),
  registrations: z.lazy(() => RegistrationListRelationFilterSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationListRelationFilterSchema).optional(),
}));

export const UserOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  emailVerified: z.lazy(() => SortOrderSchema).optional(),
  image: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  permissions: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  phoneNumber: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  phoneVerified: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => UserCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => UserMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => UserMinOrderByAggregateInputSchema).optional(),
});

export const UserScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.UserScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema), z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema), z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  emailVerified: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  image: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  role: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  permissions: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  isActive: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  phoneNumber: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  phoneVerified: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const SessionWhereInputSchema: z.ZodType<Prisma.SessionWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SessionWhereInputSchema), z.lazy(() => SessionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SessionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SessionWhereInputSchema), z.lazy(() => SessionWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  token: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  ipAddress: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  userAgent: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
});

export const SessionOrderByWithRelationInputSchema: z.ZodType<Prisma.SessionOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  ipAddress: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  userAgent: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
});

export const SessionWhereUniqueInputSchema: z.ZodType<Prisma.SessionWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    token: z.string(),
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    token: z.string(),
  }),
])
.and(z.strictObject({
  id: z.string().optional(),
  token: z.string().optional(),
  AND: z.union([ z.lazy(() => SessionWhereInputSchema), z.lazy(() => SessionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SessionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SessionWhereInputSchema), z.lazy(() => SessionWhereInputSchema).array() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  ipAddress: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  userAgent: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
}));

export const SessionOrderByWithAggregationInputSchema: z.ZodType<Prisma.SessionOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  ipAddress: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  userAgent: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => SessionCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => SessionMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => SessionMinOrderByAggregateInputSchema).optional(),
});

export const SessionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.SessionScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SessionScalarWhereWithAggregatesInputSchema), z.lazy(() => SessionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => SessionScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SessionScalarWhereWithAggregatesInputSchema), z.lazy(() => SessionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  token: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  ipAddress: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  userAgent: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
});

export const AccountWhereInputSchema: z.ZodType<Prisma.AccountWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AccountWhereInputSchema), z.lazy(() => AccountWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AccountWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AccountWhereInputSchema), z.lazy(() => AccountWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  accountId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  providerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  accessToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  refreshToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  idToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  scope: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  password: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
});

export const AccountOrderByWithRelationInputSchema: z.ZodType<Prisma.AccountOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  accountId: z.lazy(() => SortOrderSchema).optional(),
  providerId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  accessToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  refreshToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  idToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  accessTokenExpiresAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  refreshTokenExpiresAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  scope: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  password: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
});

export const AccountWhereUniqueInputSchema: z.ZodType<Prisma.AccountWhereUniqueInput> = z.object({
  id: z.string(),
})
.and(z.strictObject({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => AccountWhereInputSchema), z.lazy(() => AccountWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AccountWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AccountWhereInputSchema), z.lazy(() => AccountWhereInputSchema).array() ]).optional(),
  accountId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  providerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  accessToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  refreshToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  idToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  scope: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  password: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
}));

export const AccountOrderByWithAggregationInputSchema: z.ZodType<Prisma.AccountOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  accountId: z.lazy(() => SortOrderSchema).optional(),
  providerId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  accessToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  refreshToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  idToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  accessTokenExpiresAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  refreshTokenExpiresAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  scope: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  password: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => AccountCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => AccountMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => AccountMinOrderByAggregateInputSchema).optional(),
});

export const AccountScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.AccountScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AccountScalarWhereWithAggregatesInputSchema), z.lazy(() => AccountScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => AccountScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AccountScalarWhereWithAggregatesInputSchema), z.lazy(() => AccountScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  accountId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  providerId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  accessToken: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  refreshToken: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  idToken: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  scope: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  password: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const VerificationWhereInputSchema: z.ZodType<Prisma.VerificationWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => VerificationWhereInputSchema), z.lazy(() => VerificationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => VerificationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => VerificationWhereInputSchema), z.lazy(() => VerificationWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  identifier: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  value: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  updatedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const VerificationOrderByWithRelationInputSchema: z.ZodType<Prisma.VerificationOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  identifier: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  updatedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
});

export const VerificationWhereUniqueInputSchema: z.ZodType<Prisma.VerificationWhereUniqueInput> = z.object({
  id: z.string(),
})
.and(z.strictObject({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => VerificationWhereInputSchema), z.lazy(() => VerificationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => VerificationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => VerificationWhereInputSchema), z.lazy(() => VerificationWhereInputSchema).array() ]).optional(),
  identifier: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  value: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  updatedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
}));

export const VerificationOrderByWithAggregationInputSchema: z.ZodType<Prisma.VerificationOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  identifier: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  updatedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => VerificationCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => VerificationMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => VerificationMinOrderByAggregateInputSchema).optional(),
});

export const VerificationScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.VerificationScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => VerificationScalarWhereWithAggregatesInputSchema), z.lazy(() => VerificationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => VerificationScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => VerificationScalarWhereWithAggregatesInputSchema), z.lazy(() => VerificationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  identifier: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  value: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  updatedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const EventWhereInputSchema: z.ZodType<Prisma.EventWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => EventWhereInputSchema), z.lazy(() => EventWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => EventWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EventWhereInputSchema), z.lazy(() => EventWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  slug: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  name: z.lazy(() => JsonFilterSchema).optional(),
  description: z.lazy(() => JsonNullableFilterSchema).optional(),
  plainDescription: z.lazy(() => JsonNullableFilterSchema).optional(),
  location: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  startDate: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  endDate: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  ogImage: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  landingPage: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  googleSheetsUrl: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  hideEvent: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  useOpass: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  tickets: z.lazy(() => TicketListRelationFilterSchema).optional(),
  registrations: z.lazy(() => RegistrationListRelationFilterSchema).optional(),
  referrals: z.lazy(() => ReferralListRelationFilterSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageListRelationFilterSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsListRelationFilterSchema).optional(),
});

export const EventOrderByWithRelationInputSchema: z.ZodType<Prisma.EventOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  slug: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  plainDescription: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  location: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  startDate: z.lazy(() => SortOrderSchema).optional(),
  endDate: z.lazy(() => SortOrderSchema).optional(),
  ogImage: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  landingPage: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  googleSheetsUrl: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  hideEvent: z.lazy(() => SortOrderSchema).optional(),
  useOpass: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  tickets: z.lazy(() => TicketOrderByRelationAggregateInputSchema).optional(),
  registrations: z.lazy(() => RegistrationOrderByRelationAggregateInputSchema).optional(),
  referrals: z.lazy(() => ReferralOrderByRelationAggregateInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageOrderByRelationAggregateInputSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsOrderByRelationAggregateInputSchema).optional(),
});

export const EventWhereUniqueInputSchema: z.ZodType<Prisma.EventWhereUniqueInput> = z.union([
  z.object({
    id: z.cuid(),
    slug: z.string(),
  }),
  z.object({
    id: z.cuid(),
  }),
  z.object({
    slug: z.string(),
  }),
])
.and(z.strictObject({
  id: z.cuid().optional(),
  slug: z.string().optional(),
  AND: z.union([ z.lazy(() => EventWhereInputSchema), z.lazy(() => EventWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => EventWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EventWhereInputSchema), z.lazy(() => EventWhereInputSchema).array() ]).optional(),
  name: z.lazy(() => JsonFilterSchema).optional(),
  description: z.lazy(() => JsonNullableFilterSchema).optional(),
  plainDescription: z.lazy(() => JsonNullableFilterSchema).optional(),
  location: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  startDate: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  endDate: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  ogImage: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  landingPage: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  googleSheetsUrl: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  hideEvent: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  useOpass: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  tickets: z.lazy(() => TicketListRelationFilterSchema).optional(),
  registrations: z.lazy(() => RegistrationListRelationFilterSchema).optional(),
  referrals: z.lazy(() => ReferralListRelationFilterSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageListRelationFilterSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsListRelationFilterSchema).optional(),
}));

export const EventOrderByWithAggregationInputSchema: z.ZodType<Prisma.EventOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  slug: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  plainDescription: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  location: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  startDate: z.lazy(() => SortOrderSchema).optional(),
  endDate: z.lazy(() => SortOrderSchema).optional(),
  ogImage: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  landingPage: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  googleSheetsUrl: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  hideEvent: z.lazy(() => SortOrderSchema).optional(),
  useOpass: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => EventCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => EventMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => EventMinOrderByAggregateInputSchema).optional(),
});

export const EventScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.EventScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => EventScalarWhereWithAggregatesInputSchema), z.lazy(() => EventScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => EventScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EventScalarWhereWithAggregatesInputSchema), z.lazy(() => EventScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  slug: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  name: z.lazy(() => JsonWithAggregatesFilterSchema).optional(),
  description: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  plainDescription: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  location: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  startDate: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  endDate: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  ogImage: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  landingPage: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  googleSheetsUrl: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  isActive: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  hideEvent: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  useOpass: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const TicketWhereInputSchema: z.ZodType<Prisma.TicketWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TicketWhereInputSchema), z.lazy(() => TicketWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TicketWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TicketWhereInputSchema), z.lazy(() => TicketWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  name: z.lazy(() => JsonFilterSchema).optional(),
  description: z.lazy(() => JsonNullableFilterSchema).optional(),
  plainDescription: z.lazy(() => JsonNullableFilterSchema).optional(),
  price: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  quantity: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  soldCount: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  saleStart: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  saleEnd: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  requireInviteCode: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  requireSmsVerification: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  hidden: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  registrations: z.lazy(() => RegistrationListRelationFilterSchema).optional(),
  invitationCodes: z.lazy(() => InvitationCodeListRelationFilterSchema).optional(),
});

export const TicketOrderByWithRelationInputSchema: z.ZodType<Prisma.TicketOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  plainDescription: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  quantity: z.lazy(() => SortOrderSchema).optional(),
  soldCount: z.lazy(() => SortOrderSchema).optional(),
  saleStart: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  saleEnd: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  requireInviteCode: z.lazy(() => SortOrderSchema).optional(),
  requireSmsVerification: z.lazy(() => SortOrderSchema).optional(),
  hidden: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  event: z.lazy(() => EventOrderByWithRelationInputSchema).optional(),
  registrations: z.lazy(() => RegistrationOrderByRelationAggregateInputSchema).optional(),
  invitationCodes: z.lazy(() => InvitationCodeOrderByRelationAggregateInputSchema).optional(),
});

export const TicketWhereUniqueInputSchema: z.ZodType<Prisma.TicketWhereUniqueInput> = z.object({
  id: z.cuid(),
})
.and(z.strictObject({
  id: z.cuid().optional(),
  AND: z.union([ z.lazy(() => TicketWhereInputSchema), z.lazy(() => TicketWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TicketWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TicketWhereInputSchema), z.lazy(() => TicketWhereInputSchema).array() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  name: z.lazy(() => JsonFilterSchema).optional(),
  description: z.lazy(() => JsonNullableFilterSchema).optional(),
  plainDescription: z.lazy(() => JsonNullableFilterSchema).optional(),
  price: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  quantity: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  soldCount: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  saleStart: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  saleEnd: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  requireInviteCode: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  requireSmsVerification: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  hidden: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  registrations: z.lazy(() => RegistrationListRelationFilterSchema).optional(),
  invitationCodes: z.lazy(() => InvitationCodeListRelationFilterSchema).optional(),
}));

export const TicketOrderByWithAggregationInputSchema: z.ZodType<Prisma.TicketOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  plainDescription: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  quantity: z.lazy(() => SortOrderSchema).optional(),
  soldCount: z.lazy(() => SortOrderSchema).optional(),
  saleStart: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  saleEnd: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  requireInviteCode: z.lazy(() => SortOrderSchema).optional(),
  requireSmsVerification: z.lazy(() => SortOrderSchema).optional(),
  hidden: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => TicketCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => TicketAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => TicketMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => TicketMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => TicketSumOrderByAggregateInputSchema).optional(),
});

export const TicketScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.TicketScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TicketScalarWhereWithAggregatesInputSchema), z.lazy(() => TicketScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => TicketScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TicketScalarWhereWithAggregatesInputSchema), z.lazy(() => TicketScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  order: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  name: z.lazy(() => JsonWithAggregatesFilterSchema).optional(),
  description: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  plainDescription: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  price: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  quantity: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  soldCount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  saleStart: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  saleEnd: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  requireInviteCode: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  requireSmsVerification: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  hidden: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  isActive: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const EventFormFieldsWhereInputSchema: z.ZodType<Prisma.EventFormFieldsWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => EventFormFieldsWhereInputSchema), z.lazy(() => EventFormFieldsWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => EventFormFieldsWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EventFormFieldsWhereInputSchema), z.lazy(() => EventFormFieldsWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  type: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  validater: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  name: z.lazy(() => JsonFilterSchema).optional(),
  description: z.lazy(() => JsonNullableFilterSchema).optional(),
  placeholder: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  required: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  values: z.lazy(() => JsonNullableFilterSchema).optional(),
  filters: z.lazy(() => JsonNullableFilterSchema).optional(),
  prompts: z.lazy(() => JsonNullableFilterSchema).optional(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
});

export const EventFormFieldsOrderByWithRelationInputSchema: z.ZodType<Prisma.EventFormFieldsOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  validater: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  placeholder: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  required: z.lazy(() => SortOrderSchema).optional(),
  values: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  filters: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  prompts: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  event: z.lazy(() => EventOrderByWithRelationInputSchema).optional(),
});

export const EventFormFieldsWhereUniqueInputSchema: z.ZodType<Prisma.EventFormFieldsWhereUniqueInput> = z.object({
  id: z.cuid(),
})
.and(z.strictObject({
  id: z.cuid().optional(),
  AND: z.union([ z.lazy(() => EventFormFieldsWhereInputSchema), z.lazy(() => EventFormFieldsWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => EventFormFieldsWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EventFormFieldsWhereInputSchema), z.lazy(() => EventFormFieldsWhereInputSchema).array() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  type: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  validater: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  name: z.lazy(() => JsonFilterSchema).optional(),
  description: z.lazy(() => JsonNullableFilterSchema).optional(),
  placeholder: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  required: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  values: z.lazy(() => JsonNullableFilterSchema).optional(),
  filters: z.lazy(() => JsonNullableFilterSchema).optional(),
  prompts: z.lazy(() => JsonNullableFilterSchema).optional(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
}));

export const EventFormFieldsOrderByWithAggregationInputSchema: z.ZodType<Prisma.EventFormFieldsOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  validater: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  placeholder: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  required: z.lazy(() => SortOrderSchema).optional(),
  values: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  filters: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  prompts: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => EventFormFieldsCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => EventFormFieldsAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => EventFormFieldsMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => EventFormFieldsMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => EventFormFieldsSumOrderByAggregateInputSchema).optional(),
});

export const EventFormFieldsScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.EventFormFieldsScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => EventFormFieldsScalarWhereWithAggregatesInputSchema), z.lazy(() => EventFormFieldsScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => EventFormFieldsScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EventFormFieldsScalarWhereWithAggregatesInputSchema), z.lazy(() => EventFormFieldsScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  order: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  type: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  validater: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  name: z.lazy(() => JsonWithAggregatesFilterSchema).optional(),
  description: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  placeholder: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  required: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  values: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  filters: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  prompts: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
});

export const RegistrationWhereInputSchema: z.ZodType<Prisma.RegistrationWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => RegistrationWhereInputSchema), z.lazy(() => RegistrationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => RegistrationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RegistrationWhereInputSchema), z.lazy(() => RegistrationWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  ticketId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  formData: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  referredBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  ticket: z.union([ z.lazy(() => TicketScalarRelationFilterSchema), z.lazy(() => TicketWhereInputSchema) ]).optional(),
  referrals: z.lazy(() => RegistrationListRelationFilterSchema).optional(),
  referrer: z.union([ z.lazy(() => RegistrationNullableScalarRelationFilterSchema), z.lazy(() => RegistrationWhereInputSchema) ]).optional().nullable(),
  referral: z.union([ z.lazy(() => ReferralNullableScalarRelationFilterSchema), z.lazy(() => ReferralWhereInputSchema) ]).optional().nullable(),
  referralUsage: z.lazy(() => ReferralUsageListRelationFilterSchema).optional(),
});

export const RegistrationOrderByWithRelationInputSchema: z.ZodType<Prisma.RegistrationOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  ticketId: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  formData: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  referredBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  event: z.lazy(() => EventOrderByWithRelationInputSchema).optional(),
  ticket: z.lazy(() => TicketOrderByWithRelationInputSchema).optional(),
  referrals: z.lazy(() => RegistrationOrderByRelationAggregateInputSchema).optional(),
  referrer: z.lazy(() => RegistrationOrderByWithRelationInputSchema).optional(),
  referral: z.lazy(() => ReferralOrderByWithRelationInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageOrderByRelationAggregateInputSchema).optional(),
});

export const RegistrationWhereUniqueInputSchema: z.ZodType<Prisma.RegistrationWhereUniqueInput> = z.union([
  z.object({
    id: z.cuid(),
    email_eventId: z.lazy(() => RegistrationEmailEventIdCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.cuid(),
  }),
  z.object({
    email_eventId: z.lazy(() => RegistrationEmailEventIdCompoundUniqueInputSchema),
  }),
])
.and(z.strictObject({
  id: z.cuid().optional(),
  email_eventId: z.lazy(() => RegistrationEmailEventIdCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => RegistrationWhereInputSchema), z.lazy(() => RegistrationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => RegistrationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RegistrationWhereInputSchema), z.lazy(() => RegistrationWhereInputSchema).array() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  ticketId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  formData: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  referredBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  ticket: z.union([ z.lazy(() => TicketScalarRelationFilterSchema), z.lazy(() => TicketWhereInputSchema) ]).optional(),
  referrals: z.lazy(() => RegistrationListRelationFilterSchema).optional(),
  referrer: z.union([ z.lazy(() => RegistrationNullableScalarRelationFilterSchema), z.lazy(() => RegistrationWhereInputSchema) ]).optional().nullable(),
  referral: z.union([ z.lazy(() => ReferralNullableScalarRelationFilterSchema), z.lazy(() => ReferralWhereInputSchema) ]).optional().nullable(),
  referralUsage: z.lazy(() => ReferralUsageListRelationFilterSchema).optional(),
}));

export const RegistrationOrderByWithAggregationInputSchema: z.ZodType<Prisma.RegistrationOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  ticketId: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  formData: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  referredBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => RegistrationCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => RegistrationMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => RegistrationMinOrderByAggregateInputSchema).optional(),
});

export const RegistrationScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.RegistrationScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => RegistrationScalarWhereWithAggregatesInputSchema), z.lazy(() => RegistrationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => RegistrationScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RegistrationScalarWhereWithAggregatesInputSchema), z.lazy(() => RegistrationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  ticketId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  formData: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  referredBy: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const ReferralWhereInputSchema: z.ZodType<Prisma.ReferralWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ReferralWhereInputSchema), z.lazy(() => ReferralWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ReferralWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ReferralWhereInputSchema), z.lazy(() => ReferralWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  code: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  registrationId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  registration: z.union([ z.lazy(() => RegistrationScalarRelationFilterSchema), z.lazy(() => RegistrationWhereInputSchema) ]).optional(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  referredUsers: z.lazy(() => ReferralUsageListRelationFilterSchema).optional(),
});

export const ReferralOrderByWithRelationInputSchema: z.ZodType<Prisma.ReferralOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  registrationId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  registration: z.lazy(() => RegistrationOrderByWithRelationInputSchema).optional(),
  event: z.lazy(() => EventOrderByWithRelationInputSchema).optional(),
  referredUsers: z.lazy(() => ReferralUsageOrderByRelationAggregateInputSchema).optional(),
});

export const ReferralWhereUniqueInputSchema: z.ZodType<Prisma.ReferralWhereUniqueInput> = z.union([
  z.object({
    id: z.cuid(),
    code: z.string(),
    registrationId: z.string(),
  }),
  z.object({
    id: z.cuid(),
    code: z.string(),
  }),
  z.object({
    id: z.cuid(),
    registrationId: z.string(),
  }),
  z.object({
    id: z.cuid(),
  }),
  z.object({
    code: z.string(),
    registrationId: z.string(),
  }),
  z.object({
    code: z.string(),
  }),
  z.object({
    registrationId: z.string(),
  }),
])
.and(z.strictObject({
  id: z.cuid().optional(),
  code: z.string().optional(),
  registrationId: z.string().optional(),
  AND: z.union([ z.lazy(() => ReferralWhereInputSchema), z.lazy(() => ReferralWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ReferralWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ReferralWhereInputSchema), z.lazy(() => ReferralWhereInputSchema).array() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  registration: z.union([ z.lazy(() => RegistrationScalarRelationFilterSchema), z.lazy(() => RegistrationWhereInputSchema) ]).optional(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
  referredUsers: z.lazy(() => ReferralUsageListRelationFilterSchema).optional(),
}));

export const ReferralOrderByWithAggregationInputSchema: z.ZodType<Prisma.ReferralOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  registrationId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => ReferralCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => ReferralMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => ReferralMinOrderByAggregateInputSchema).optional(),
});

export const ReferralScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.ReferralScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ReferralScalarWhereWithAggregatesInputSchema), z.lazy(() => ReferralScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => ReferralScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ReferralScalarWhereWithAggregatesInputSchema), z.lazy(() => ReferralScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  code: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  registrationId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  isActive: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const ReferralUsageWhereInputSchema: z.ZodType<Prisma.ReferralUsageWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ReferralUsageWhereInputSchema), z.lazy(() => ReferralUsageWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ReferralUsageWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ReferralUsageWhereInputSchema), z.lazy(() => ReferralUsageWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  referralId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  registrationId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  usedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  referral: z.union([ z.lazy(() => ReferralScalarRelationFilterSchema), z.lazy(() => ReferralWhereInputSchema) ]).optional(),
  registration: z.union([ z.lazy(() => RegistrationScalarRelationFilterSchema), z.lazy(() => RegistrationWhereInputSchema) ]).optional(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
});

export const ReferralUsageOrderByWithRelationInputSchema: z.ZodType<Prisma.ReferralUsageOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  referralId: z.lazy(() => SortOrderSchema).optional(),
  registrationId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  usedAt: z.lazy(() => SortOrderSchema).optional(),
  referral: z.lazy(() => ReferralOrderByWithRelationInputSchema).optional(),
  registration: z.lazy(() => RegistrationOrderByWithRelationInputSchema).optional(),
  event: z.lazy(() => EventOrderByWithRelationInputSchema).optional(),
});

export const ReferralUsageWhereUniqueInputSchema: z.ZodType<Prisma.ReferralUsageWhereUniqueInput> = z.union([
  z.object({
    id: z.cuid(),
    referralId_registrationId: z.lazy(() => ReferralUsageReferralIdRegistrationIdCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.cuid(),
  }),
  z.object({
    referralId_registrationId: z.lazy(() => ReferralUsageReferralIdRegistrationIdCompoundUniqueInputSchema),
  }),
])
.and(z.strictObject({
  id: z.cuid().optional(),
  referralId_registrationId: z.lazy(() => ReferralUsageReferralIdRegistrationIdCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => ReferralUsageWhereInputSchema), z.lazy(() => ReferralUsageWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ReferralUsageWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ReferralUsageWhereInputSchema), z.lazy(() => ReferralUsageWhereInputSchema).array() ]).optional(),
  referralId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  registrationId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  usedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  referral: z.union([ z.lazy(() => ReferralScalarRelationFilterSchema), z.lazy(() => ReferralWhereInputSchema) ]).optional(),
  registration: z.union([ z.lazy(() => RegistrationScalarRelationFilterSchema), z.lazy(() => RegistrationWhereInputSchema) ]).optional(),
  event: z.union([ z.lazy(() => EventScalarRelationFilterSchema), z.lazy(() => EventWhereInputSchema) ]).optional(),
}));

export const ReferralUsageOrderByWithAggregationInputSchema: z.ZodType<Prisma.ReferralUsageOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  referralId: z.lazy(() => SortOrderSchema).optional(),
  registrationId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  usedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => ReferralUsageCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => ReferralUsageMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => ReferralUsageMinOrderByAggregateInputSchema).optional(),
});

export const ReferralUsageScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.ReferralUsageScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ReferralUsageScalarWhereWithAggregatesInputSchema), z.lazy(() => ReferralUsageScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => ReferralUsageScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ReferralUsageScalarWhereWithAggregatesInputSchema), z.lazy(() => ReferralUsageScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  referralId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  registrationId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  usedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const InvitationCodeWhereInputSchema: z.ZodType<Prisma.InvitationCodeWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => InvitationCodeWhereInputSchema), z.lazy(() => InvitationCodeWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => InvitationCodeWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => InvitationCodeWhereInputSchema), z.lazy(() => InvitationCodeWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  ticketId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  code: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  usageLimit: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  usedCount: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  validFrom: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  validUntil: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  ticket: z.union([ z.lazy(() => TicketScalarRelationFilterSchema), z.lazy(() => TicketWhereInputSchema) ]).optional(),
});

export const InvitationCodeOrderByWithRelationInputSchema: z.ZodType<Prisma.InvitationCodeOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  ticketId: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  name: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  usageLimit: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  usedCount: z.lazy(() => SortOrderSchema).optional(),
  validFrom: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  validUntil: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  ticket: z.lazy(() => TicketOrderByWithRelationInputSchema).optional(),
});

export const InvitationCodeWhereUniqueInputSchema: z.ZodType<Prisma.InvitationCodeWhereUniqueInput> = z.union([
  z.object({
    id: z.cuid(),
    code: z.string(),
  }),
  z.object({
    id: z.cuid(),
  }),
  z.object({
    code: z.string(),
  }),
])
.and(z.strictObject({
  id: z.cuid().optional(),
  code: z.string().optional(),
  AND: z.union([ z.lazy(() => InvitationCodeWhereInputSchema), z.lazy(() => InvitationCodeWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => InvitationCodeWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => InvitationCodeWhereInputSchema), z.lazy(() => InvitationCodeWhereInputSchema).array() ]).optional(),
  ticketId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  usageLimit: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  usedCount: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  validFrom: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  validUntil: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  ticket: z.union([ z.lazy(() => TicketScalarRelationFilterSchema), z.lazy(() => TicketWhereInputSchema) ]).optional(),
}));

export const InvitationCodeOrderByWithAggregationInputSchema: z.ZodType<Prisma.InvitationCodeOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  ticketId: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  name: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  usageLimit: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  usedCount: z.lazy(() => SortOrderSchema).optional(),
  validFrom: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  validUntil: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => InvitationCodeCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => InvitationCodeAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => InvitationCodeMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => InvitationCodeMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => InvitationCodeSumOrderByAggregateInputSchema).optional(),
});

export const InvitationCodeScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.InvitationCodeScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => InvitationCodeScalarWhereWithAggregatesInputSchema), z.lazy(() => InvitationCodeScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => InvitationCodeScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => InvitationCodeScalarWhereWithAggregatesInputSchema), z.lazy(() => InvitationCodeScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  ticketId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  code: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  usageLimit: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  usedCount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  validFrom: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  validUntil: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  isActive: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const EmailCampaignWhereInputSchema: z.ZodType<Prisma.EmailCampaignWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => EmailCampaignWhereInputSchema), z.lazy(() => EmailCampaignWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => EmailCampaignWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EmailCampaignWhereInputSchema), z.lazy(() => EmailCampaignWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  subject: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  content: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  recipientFilter: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sentCount: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  totalCount: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  scheduledAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  sentAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
});

export const EmailCampaignOrderByWithRelationInputSchema: z.ZodType<Prisma.EmailCampaignOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  subject: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  recipientFilter: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  sentCount: z.lazy(() => SortOrderSchema).optional(),
  totalCount: z.lazy(() => SortOrderSchema).optional(),
  scheduledAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  sentAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
});

export const EmailCampaignWhereUniqueInputSchema: z.ZodType<Prisma.EmailCampaignWhereUniqueInput> = z.object({
  id: z.cuid(),
})
.and(z.strictObject({
  id: z.cuid().optional(),
  AND: z.union([ z.lazy(() => EmailCampaignWhereInputSchema), z.lazy(() => EmailCampaignWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => EmailCampaignWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EmailCampaignWhereInputSchema), z.lazy(() => EmailCampaignWhereInputSchema).array() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  subject: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  content: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  recipientFilter: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sentCount: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  totalCount: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  scheduledAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  sentAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
}));

export const EmailCampaignOrderByWithAggregationInputSchema: z.ZodType<Prisma.EmailCampaignOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  subject: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  recipientFilter: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  sentCount: z.lazy(() => SortOrderSchema).optional(),
  totalCount: z.lazy(() => SortOrderSchema).optional(),
  scheduledAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  sentAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => EmailCampaignCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => EmailCampaignAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => EmailCampaignMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => EmailCampaignMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => EmailCampaignSumOrderByAggregateInputSchema).optional(),
});

export const EmailCampaignScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.EmailCampaignScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => EmailCampaignScalarWhereWithAggregatesInputSchema), z.lazy(() => EmailCampaignScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => EmailCampaignScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EmailCampaignScalarWhereWithAggregatesInputSchema), z.lazy(() => EmailCampaignScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  subject: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  content: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  recipientFilter: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  sentCount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  totalCount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  scheduledAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  sentAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const SmsVerificationWhereInputSchema: z.ZodType<Prisma.SmsVerificationWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SmsVerificationWhereInputSchema), z.lazy(() => SmsVerificationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SmsVerificationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SmsVerificationWhereInputSchema), z.lazy(() => SmsVerificationWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  phoneNumber: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  code: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  verified: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
});

export const SmsVerificationOrderByWithRelationInputSchema: z.ZodType<Prisma.SmsVerificationOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  phoneNumber: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  verified: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
});

export const SmsVerificationWhereUniqueInputSchema: z.ZodType<Prisma.SmsVerificationWhereUniqueInput> = z.object({
  id: z.cuid(),
})
.and(z.strictObject({
  id: z.cuid().optional(),
  AND: z.union([ z.lazy(() => SmsVerificationWhereInputSchema), z.lazy(() => SmsVerificationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SmsVerificationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SmsVerificationWhereInputSchema), z.lazy(() => SmsVerificationWhereInputSchema).array() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  phoneNumber: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  code: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  verified: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
}));

export const SmsVerificationOrderByWithAggregationInputSchema: z.ZodType<Prisma.SmsVerificationOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  phoneNumber: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  verified: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => SmsVerificationCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => SmsVerificationMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => SmsVerificationMinOrderByAggregateInputSchema).optional(),
});

export const SmsVerificationScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.SmsVerificationScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SmsVerificationScalarWhereWithAggregatesInputSchema), z.lazy(() => SmsVerificationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => SmsVerificationScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SmsVerificationScalarWhereWithAggregatesInputSchema), z.lazy(() => SmsVerificationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  phoneNumber: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  code: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  verified: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const MagicLinkAttemptWhereInputSchema: z.ZodType<Prisma.MagicLinkAttemptWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => MagicLinkAttemptWhereInputSchema), z.lazy(() => MagicLinkAttemptWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => MagicLinkAttemptWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => MagicLinkAttemptWhereInputSchema), z.lazy(() => MagicLinkAttemptWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  ipAddress: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  success: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  sessionId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const MagicLinkAttemptOrderByWithRelationInputSchema: z.ZodType<Prisma.MagicLinkAttemptOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  ipAddress: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  success: z.lazy(() => SortOrderSchema).optional(),
  sessionId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const MagicLinkAttemptWhereUniqueInputSchema: z.ZodType<Prisma.MagicLinkAttemptWhereUniqueInput> = z.object({
  id: z.cuid(),
})
.and(z.strictObject({
  id: z.cuid().optional(),
  AND: z.union([ z.lazy(() => MagicLinkAttemptWhereInputSchema), z.lazy(() => MagicLinkAttemptWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => MagicLinkAttemptWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => MagicLinkAttemptWhereInputSchema), z.lazy(() => MagicLinkAttemptWhereInputSchema).array() ]).optional(),
  email: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  ipAddress: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  success: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  sessionId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
}));

export const MagicLinkAttemptOrderByWithAggregationInputSchema: z.ZodType<Prisma.MagicLinkAttemptOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  ipAddress: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  success: z.lazy(() => SortOrderSchema).optional(),
  sessionId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => MagicLinkAttemptCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => MagicLinkAttemptMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => MagicLinkAttemptMinOrderByAggregateInputSchema).optional(),
});

export const MagicLinkAttemptScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.MagicLinkAttemptScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => MagicLinkAttemptScalarWhereWithAggregatesInputSchema), z.lazy(() => MagicLinkAttemptScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => MagicLinkAttemptScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => MagicLinkAttemptScalarWhereWithAggregatesInputSchema), z.lazy(() => MagicLinkAttemptScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  ipAddress: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  success: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  sessionId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const UserCreateInputSchema: z.ZodType<Prisma.UserCreateInput> = z.strictObject({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().optional().nullable(),
  role: z.string().optional(),
  permissions: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  phoneNumber: z.string().optional().nullable(),
  phoneVerified: z.boolean().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  sessions: z.lazy(() => SessionCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountCreateNestedManyWithoutUserInputSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignCreateNestedManyWithoutUserInputSchema).optional(),
  registrations: z.lazy(() => RegistrationCreateNestedManyWithoutUserInputSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateInputSchema: z.ZodType<Prisma.UserUncheckedCreateInput> = z.strictObject({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().optional().nullable(),
  role: z.string().optional(),
  permissions: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  phoneNumber: z.string().optional().nullable(),
  phoneVerified: z.boolean().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  sessions: z.lazy(() => SessionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUpdateInputSchema: z.ZodType<Prisma.UserUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  permissions: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  phoneVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUpdateManyWithoutUserNestedInputSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignUpdateManyWithoutUserNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUpdateManyWithoutUserNestedInputSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateInputSchema: z.ZodType<Prisma.UserUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  permissions: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  phoneVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserCreateManyInputSchema: z.ZodType<Prisma.UserCreateManyInput> = z.strictObject({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().optional().nullable(),
  role: z.string().optional(),
  permissions: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  phoneNumber: z.string().optional().nullable(),
  phoneVerified: z.boolean().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const UserUpdateManyMutationInputSchema: z.ZodType<Prisma.UserUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  permissions: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  phoneVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const UserUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  permissions: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  phoneVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const SessionCreateInputSchema: z.ZodType<Prisma.SessionCreateInput> = z.strictObject({
  id: z.string(),
  expiresAt: z.coerce.date(),
  token: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  user: z.lazy(() => UserCreateNestedOneWithoutSessionsInputSchema),
});

export const SessionUncheckedCreateInputSchema: z.ZodType<Prisma.SessionUncheckedCreateInput> = z.strictObject({
  id: z.string(),
  expiresAt: z.coerce.date(),
  token: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  userId: z.string(),
});

export const SessionUpdateInputSchema: z.ZodType<Prisma.SessionUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userAgent: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutSessionsNestedInputSchema).optional(),
});

export const SessionUncheckedUpdateInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userAgent: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const SessionCreateManyInputSchema: z.ZodType<Prisma.SessionCreateManyInput> = z.strictObject({
  id: z.string(),
  expiresAt: z.coerce.date(),
  token: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  userId: z.string(),
});

export const SessionUpdateManyMutationInputSchema: z.ZodType<Prisma.SessionUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userAgent: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SessionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userAgent: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AccountCreateInputSchema: z.ZodType<Prisma.AccountCreateInput> = z.strictObject({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
  idToken: z.string().optional().nullable(),
  accessTokenExpiresAt: z.coerce.date().optional().nullable(),
  refreshTokenExpiresAt: z.coerce.date().optional().nullable(),
  scope: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  user: z.lazy(() => UserCreateNestedOneWithoutAccountsInputSchema),
});

export const AccountUncheckedCreateInputSchema: z.ZodType<Prisma.AccountUncheckedCreateInput> = z.strictObject({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
  idToken: z.string().optional().nullable(),
  accessTokenExpiresAt: z.coerce.date().optional().nullable(),
  refreshTokenExpiresAt: z.coerce.date().optional().nullable(),
  scope: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const AccountUpdateInputSchema: z.ZodType<Prisma.AccountUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accessToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  idToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutAccountsNestedInputSchema).optional(),
});

export const AccountUncheckedUpdateInputSchema: z.ZodType<Prisma.AccountUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accessToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  idToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AccountCreateManyInputSchema: z.ZodType<Prisma.AccountCreateManyInput> = z.strictObject({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
  idToken: z.string().optional().nullable(),
  accessTokenExpiresAt: z.coerce.date().optional().nullable(),
  refreshTokenExpiresAt: z.coerce.date().optional().nullable(),
  scope: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const AccountUpdateManyMutationInputSchema: z.ZodType<Prisma.AccountUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accessToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  idToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AccountUncheckedUpdateManyInputSchema: z.ZodType<Prisma.AccountUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accessToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  idToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const VerificationCreateInputSchema: z.ZodType<Prisma.VerificationCreateInput> = z.strictObject({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional().nullable(),
  updatedAt: z.coerce.date().optional().nullable(),
});

export const VerificationUncheckedCreateInputSchema: z.ZodType<Prisma.VerificationUncheckedCreateInput> = z.strictObject({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional().nullable(),
  updatedAt: z.coerce.date().optional().nullable(),
});

export const VerificationUpdateInputSchema: z.ZodType<Prisma.VerificationUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  identifier: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const VerificationUncheckedUpdateInputSchema: z.ZodType<Prisma.VerificationUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  identifier: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const VerificationCreateManyInputSchema: z.ZodType<Prisma.VerificationCreateManyInput> = z.strictObject({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional().nullable(),
  updatedAt: z.coerce.date().optional().nullable(),
});

export const VerificationUpdateManyMutationInputSchema: z.ZodType<Prisma.VerificationUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  identifier: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const VerificationUncheckedUpdateManyInputSchema: z.ZodType<Prisma.VerificationUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  identifier: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const EventCreateInputSchema: z.ZodType<Prisma.EventCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  slug: z.string().optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  ogImage: z.string().optional().nullable(),
  landingPage: z.string().optional().nullable(),
  googleSheetsUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  hideEvent: z.boolean().optional(),
  useOpass: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  tickets: z.lazy(() => TicketCreateNestedManyWithoutEventInputSchema).optional(),
  registrations: z.lazy(() => RegistrationCreateNestedManyWithoutEventInputSchema).optional(),
  referrals: z.lazy(() => ReferralCreateNestedManyWithoutEventInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageCreateNestedManyWithoutEventInputSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventUncheckedCreateInputSchema: z.ZodType<Prisma.EventUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  slug: z.string().optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  ogImage: z.string().optional().nullable(),
  landingPage: z.string().optional().nullable(),
  googleSheetsUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  hideEvent: z.boolean().optional(),
  useOpass: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  tickets: z.lazy(() => TicketUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  referrals: z.lazy(() => ReferralUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventUpdateInputSchema: z.ZodType<Prisma.EventUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ogImage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landingPage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  googleSheetsUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hideEvent: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  useOpass: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  tickets: z.lazy(() => TicketUpdateManyWithoutEventNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUpdateManyWithoutEventNestedInputSchema).optional(),
  referrals: z.lazy(() => ReferralUpdateManyWithoutEventNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUpdateManyWithoutEventNestedInputSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const EventUncheckedUpdateInputSchema: z.ZodType<Prisma.EventUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ogImage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landingPage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  googleSheetsUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hideEvent: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  useOpass: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  tickets: z.lazy(() => TicketUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  referrals: z.lazy(() => ReferralUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const EventCreateManyInputSchema: z.ZodType<Prisma.EventCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  slug: z.string().optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  ogImage: z.string().optional().nullable(),
  landingPage: z.string().optional().nullable(),
  googleSheetsUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  hideEvent: z.boolean().optional(),
  useOpass: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const EventUpdateManyMutationInputSchema: z.ZodType<Prisma.EventUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ogImage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landingPage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  googleSheetsUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hideEvent: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  useOpass: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const EventUncheckedUpdateManyInputSchema: z.ZodType<Prisma.EventUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ogImage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landingPage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  googleSheetsUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hideEvent: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  useOpass: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TicketCreateInputSchema: z.ZodType<Prisma.TicketCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  order: z.number().int().optional(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  price: z.number().int(),
  quantity: z.number().int(),
  soldCount: z.number().int().optional(),
  saleStart: z.coerce.date().optional().nullable(),
  saleEnd: z.coerce.date().optional().nullable(),
  requireInviteCode: z.boolean().optional(),
  requireSmsVerification: z.boolean().optional(),
  hidden: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  event: z.lazy(() => EventCreateNestedOneWithoutTicketsInputSchema),
  registrations: z.lazy(() => RegistrationCreateNestedManyWithoutTicketInputSchema).optional(),
  invitationCodes: z.lazy(() => InvitationCodeCreateNestedManyWithoutTicketInputSchema).optional(),
});

export const TicketUncheckedCreateInputSchema: z.ZodType<Prisma.TicketUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  eventId: z.string(),
  order: z.number().int().optional(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  price: z.number().int(),
  quantity: z.number().int(),
  soldCount: z.number().int().optional(),
  saleStart: z.coerce.date().optional().nullable(),
  saleEnd: z.coerce.date().optional().nullable(),
  requireInviteCode: z.boolean().optional(),
  requireSmsVerification: z.boolean().optional(),
  hidden: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  registrations: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutTicketInputSchema).optional(),
  invitationCodes: z.lazy(() => InvitationCodeUncheckedCreateNestedManyWithoutTicketInputSchema).optional(),
});

export const TicketUpdateInputSchema: z.ZodType<Prisma.TicketUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  quantity: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  soldCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  saleStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  requireInviteCode: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  requireSmsVerification: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hidden: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutTicketsNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUpdateManyWithoutTicketNestedInputSchema).optional(),
  invitationCodes: z.lazy(() => InvitationCodeUpdateManyWithoutTicketNestedInputSchema).optional(),
});

export const TicketUncheckedUpdateInputSchema: z.ZodType<Prisma.TicketUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  quantity: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  soldCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  saleStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  requireInviteCode: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  requireSmsVerification: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hidden: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  registrations: z.lazy(() => RegistrationUncheckedUpdateManyWithoutTicketNestedInputSchema).optional(),
  invitationCodes: z.lazy(() => InvitationCodeUncheckedUpdateManyWithoutTicketNestedInputSchema).optional(),
});

export const TicketCreateManyInputSchema: z.ZodType<Prisma.TicketCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  eventId: z.string(),
  order: z.number().int().optional(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  price: z.number().int(),
  quantity: z.number().int(),
  soldCount: z.number().int().optional(),
  saleStart: z.coerce.date().optional().nullable(),
  saleEnd: z.coerce.date().optional().nullable(),
  requireInviteCode: z.boolean().optional(),
  requireSmsVerification: z.boolean().optional(),
  hidden: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TicketUpdateManyMutationInputSchema: z.ZodType<Prisma.TicketUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  quantity: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  soldCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  saleStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  requireInviteCode: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  requireSmsVerification: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hidden: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TicketUncheckedUpdateManyInputSchema: z.ZodType<Prisma.TicketUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  quantity: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  soldCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  saleStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  requireInviteCode: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  requireSmsVerification: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hidden: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const EventFormFieldsCreateInputSchema: z.ZodType<Prisma.EventFormFieldsCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  order: z.number().int(),
  type: z.string(),
  validater: z.string().optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  placeholder: z.string().optional().nullable(),
  required: z.boolean().optional(),
  values: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  filters: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  prompts: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  event: z.lazy(() => EventCreateNestedOneWithoutFormFieldsInputSchema),
});

export const EventFormFieldsUncheckedCreateInputSchema: z.ZodType<Prisma.EventFormFieldsUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  eventId: z.string(),
  order: z.number().int(),
  type: z.string(),
  validater: z.string().optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  placeholder: z.string().optional().nullable(),
  required: z.boolean().optional(),
  values: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  filters: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  prompts: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const EventFormFieldsUpdateInputSchema: z.ZodType<Prisma.EventFormFieldsUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  validater: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  placeholder: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  required: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  values: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  filters: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  prompts: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutFormFieldsNestedInputSchema).optional(),
});

export const EventFormFieldsUncheckedUpdateInputSchema: z.ZodType<Prisma.EventFormFieldsUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  validater: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  placeholder: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  required: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  values: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  filters: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  prompts: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const EventFormFieldsCreateManyInputSchema: z.ZodType<Prisma.EventFormFieldsCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  eventId: z.string(),
  order: z.number().int(),
  type: z.string(),
  validater: z.string().optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  placeholder: z.string().optional().nullable(),
  required: z.boolean().optional(),
  values: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  filters: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  prompts: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const EventFormFieldsUpdateManyMutationInputSchema: z.ZodType<Prisma.EventFormFieldsUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  validater: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  placeholder: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  required: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  values: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  filters: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  prompts: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const EventFormFieldsUncheckedUpdateManyInputSchema: z.ZodType<Prisma.EventFormFieldsUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  validater: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  placeholder: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  required: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  values: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  filters: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  prompts: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const RegistrationCreateInputSchema: z.ZodType<Prisma.RegistrationCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  email: z.string(),
  formData: z.string().optional().nullable(),
  status: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutRegistrationsInputSchema),
  event: z.lazy(() => EventCreateNestedOneWithoutRegistrationsInputSchema),
  ticket: z.lazy(() => TicketCreateNestedOneWithoutRegistrationsInputSchema),
  referrals: z.lazy(() => RegistrationCreateNestedManyWithoutReferrerInputSchema).optional(),
  referrer: z.lazy(() => RegistrationCreateNestedOneWithoutReferralsInputSchema).optional(),
  referral: z.lazy(() => ReferralCreateNestedOneWithoutRegistrationInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageCreateNestedManyWithoutRegistrationInputSchema).optional(),
});

export const RegistrationUncheckedCreateInputSchema: z.ZodType<Prisma.RegistrationUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  userId: z.string(),
  eventId: z.string(),
  ticketId: z.string(),
  email: z.string(),
  formData: z.string().optional().nullable(),
  status: z.string().optional(),
  referredBy: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  referrals: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutReferrerInputSchema).optional(),
  referral: z.lazy(() => ReferralUncheckedCreateNestedOneWithoutRegistrationInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedCreateNestedManyWithoutRegistrationInputSchema).optional(),
});

export const RegistrationUpdateInputSchema: z.ZodType<Prisma.RegistrationUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutRegistrationsNestedInputSchema).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutRegistrationsNestedInputSchema).optional(),
  ticket: z.lazy(() => TicketUpdateOneRequiredWithoutRegistrationsNestedInputSchema).optional(),
  referrals: z.lazy(() => RegistrationUpdateManyWithoutReferrerNestedInputSchema).optional(),
  referrer: z.lazy(() => RegistrationUpdateOneWithoutReferralsNestedInputSchema).optional(),
  referral: z.lazy(() => ReferralUpdateOneWithoutRegistrationNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUpdateManyWithoutRegistrationNestedInputSchema).optional(),
});

export const RegistrationUncheckedUpdateInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ticketId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  referredBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  referrals: z.lazy(() => RegistrationUncheckedUpdateManyWithoutReferrerNestedInputSchema).optional(),
  referral: z.lazy(() => ReferralUncheckedUpdateOneWithoutRegistrationNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedUpdateManyWithoutRegistrationNestedInputSchema).optional(),
});

export const RegistrationCreateManyInputSchema: z.ZodType<Prisma.RegistrationCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  userId: z.string(),
  eventId: z.string(),
  ticketId: z.string(),
  email: z.string(),
  formData: z.string().optional().nullable(),
  status: z.string().optional(),
  referredBy: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const RegistrationUpdateManyMutationInputSchema: z.ZodType<Prisma.RegistrationUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const RegistrationUncheckedUpdateManyInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ticketId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  referredBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReferralCreateInputSchema: z.ZodType<Prisma.ReferralCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  code: z.string(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  registration: z.lazy(() => RegistrationCreateNestedOneWithoutReferralInputSchema),
  event: z.lazy(() => EventCreateNestedOneWithoutReferralsInputSchema),
  referredUsers: z.lazy(() => ReferralUsageCreateNestedManyWithoutReferralInputSchema).optional(),
});

export const ReferralUncheckedCreateInputSchema: z.ZodType<Prisma.ReferralUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  code: z.string(),
  registrationId: z.string(),
  eventId: z.string(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  referredUsers: z.lazy(() => ReferralUsageUncheckedCreateNestedManyWithoutReferralInputSchema).optional(),
});

export const ReferralUpdateInputSchema: z.ZodType<Prisma.ReferralUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  registration: z.lazy(() => RegistrationUpdateOneRequiredWithoutReferralNestedInputSchema).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutReferralsNestedInputSchema).optional(),
  referredUsers: z.lazy(() => ReferralUsageUpdateManyWithoutReferralNestedInputSchema).optional(),
});

export const ReferralUncheckedUpdateInputSchema: z.ZodType<Prisma.ReferralUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  registrationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  referredUsers: z.lazy(() => ReferralUsageUncheckedUpdateManyWithoutReferralNestedInputSchema).optional(),
});

export const ReferralCreateManyInputSchema: z.ZodType<Prisma.ReferralCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  code: z.string(),
  registrationId: z.string(),
  eventId: z.string(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const ReferralUpdateManyMutationInputSchema: z.ZodType<Prisma.ReferralUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReferralUncheckedUpdateManyInputSchema: z.ZodType<Prisma.ReferralUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  registrationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReferralUsageCreateInputSchema: z.ZodType<Prisma.ReferralUsageCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  usedAt: z.coerce.date().optional(),
  referral: z.lazy(() => ReferralCreateNestedOneWithoutReferredUsersInputSchema),
  registration: z.lazy(() => RegistrationCreateNestedOneWithoutReferralUsageInputSchema),
  event: z.lazy(() => EventCreateNestedOneWithoutReferralUsageInputSchema),
});

export const ReferralUsageUncheckedCreateInputSchema: z.ZodType<Prisma.ReferralUsageUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  referralId: z.string(),
  registrationId: z.string(),
  eventId: z.string(),
  usedAt: z.coerce.date().optional(),
});

export const ReferralUsageUpdateInputSchema: z.ZodType<Prisma.ReferralUsageUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  usedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  referral: z.lazy(() => ReferralUpdateOneRequiredWithoutReferredUsersNestedInputSchema).optional(),
  registration: z.lazy(() => RegistrationUpdateOneRequiredWithoutReferralUsageNestedInputSchema).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutReferralUsageNestedInputSchema).optional(),
});

export const ReferralUsageUncheckedUpdateInputSchema: z.ZodType<Prisma.ReferralUsageUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  referralId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  registrationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  usedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReferralUsageCreateManyInputSchema: z.ZodType<Prisma.ReferralUsageCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  referralId: z.string(),
  registrationId: z.string(),
  eventId: z.string(),
  usedAt: z.coerce.date().optional(),
});

export const ReferralUsageUpdateManyMutationInputSchema: z.ZodType<Prisma.ReferralUsageUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  usedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReferralUsageUncheckedUpdateManyInputSchema: z.ZodType<Prisma.ReferralUsageUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  referralId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  registrationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  usedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const InvitationCodeCreateInputSchema: z.ZodType<Prisma.InvitationCodeCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  code: z.string(),
  name: z.string().optional().nullable(),
  usageLimit: z.number().int().optional().nullable(),
  usedCount: z.number().int().optional(),
  validFrom: z.coerce.date().optional().nullable(),
  validUntil: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  ticket: z.lazy(() => TicketCreateNestedOneWithoutInvitationCodesInputSchema),
});

export const InvitationCodeUncheckedCreateInputSchema: z.ZodType<Prisma.InvitationCodeUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  ticketId: z.string(),
  code: z.string(),
  name: z.string().optional().nullable(),
  usageLimit: z.number().int().optional().nullable(),
  usedCount: z.number().int().optional(),
  validFrom: z.coerce.date().optional().nullable(),
  validUntil: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const InvitationCodeUpdateInputSchema: z.ZodType<Prisma.InvitationCodeUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usageLimit: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usedCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  validFrom: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  validUntil: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ticket: z.lazy(() => TicketUpdateOneRequiredWithoutInvitationCodesNestedInputSchema).optional(),
});

export const InvitationCodeUncheckedUpdateInputSchema: z.ZodType<Prisma.InvitationCodeUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ticketId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usageLimit: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usedCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  validFrom: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  validUntil: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const InvitationCodeCreateManyInputSchema: z.ZodType<Prisma.InvitationCodeCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  ticketId: z.string(),
  code: z.string(),
  name: z.string().optional().nullable(),
  usageLimit: z.number().int().optional().nullable(),
  usedCount: z.number().int().optional(),
  validFrom: z.coerce.date().optional().nullable(),
  validUntil: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const InvitationCodeUpdateManyMutationInputSchema: z.ZodType<Prisma.InvitationCodeUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usageLimit: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usedCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  validFrom: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  validUntil: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const InvitationCodeUncheckedUpdateManyInputSchema: z.ZodType<Prisma.InvitationCodeUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ticketId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usageLimit: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usedCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  validFrom: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  validUntil: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const EmailCampaignCreateInputSchema: z.ZodType<Prisma.EmailCampaignCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  subject: z.string(),
  content: z.string(),
  recipientFilter: z.string().optional().nullable(),
  status: z.string().optional(),
  sentCount: z.number().int().optional(),
  totalCount: z.number().int().optional(),
  scheduledAt: z.coerce.date().optional().nullable(),
  sentAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutEmailCampaignsInputSchema),
});

export const EmailCampaignUncheckedCreateInputSchema: z.ZodType<Prisma.EmailCampaignUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  userId: z.string(),
  name: z.string(),
  subject: z.string(),
  content: z.string(),
  recipientFilter: z.string().optional().nullable(),
  status: z.string().optional(),
  sentCount: z.number().int().optional(),
  totalCount: z.number().int().optional(),
  scheduledAt: z.coerce.date().optional().nullable(),
  sentAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const EmailCampaignUpdateInputSchema: z.ZodType<Prisma.EmailCampaignUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subject: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  recipientFilter: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sentCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sentAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutEmailCampaignsNestedInputSchema).optional(),
});

export const EmailCampaignUncheckedUpdateInputSchema: z.ZodType<Prisma.EmailCampaignUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subject: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  recipientFilter: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sentCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sentAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const EmailCampaignCreateManyInputSchema: z.ZodType<Prisma.EmailCampaignCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  userId: z.string(),
  name: z.string(),
  subject: z.string(),
  content: z.string(),
  recipientFilter: z.string().optional().nullable(),
  status: z.string().optional(),
  sentCount: z.number().int().optional(),
  totalCount: z.number().int().optional(),
  scheduledAt: z.coerce.date().optional().nullable(),
  sentAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const EmailCampaignUpdateManyMutationInputSchema: z.ZodType<Prisma.EmailCampaignUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subject: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  recipientFilter: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sentCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sentAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const EmailCampaignUncheckedUpdateManyInputSchema: z.ZodType<Prisma.EmailCampaignUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subject: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  recipientFilter: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sentCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sentAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const SmsVerificationCreateInputSchema: z.ZodType<Prisma.SmsVerificationCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  phoneNumber: z.string(),
  code: z.string(),
  verified: z.boolean().optional(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutSmsVerificationsInputSchema),
});

export const SmsVerificationUncheckedCreateInputSchema: z.ZodType<Prisma.SmsVerificationUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  userId: z.string(),
  phoneNumber: z.string(),
  code: z.string(),
  verified: z.boolean().optional(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const SmsVerificationUpdateInputSchema: z.ZodType<Prisma.SmsVerificationUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  verified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutSmsVerificationsNestedInputSchema).optional(),
});

export const SmsVerificationUncheckedUpdateInputSchema: z.ZodType<Prisma.SmsVerificationUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  verified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const SmsVerificationCreateManyInputSchema: z.ZodType<Prisma.SmsVerificationCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  userId: z.string(),
  phoneNumber: z.string(),
  code: z.string(),
  verified: z.boolean().optional(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const SmsVerificationUpdateManyMutationInputSchema: z.ZodType<Prisma.SmsVerificationUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  verified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const SmsVerificationUncheckedUpdateManyInputSchema: z.ZodType<Prisma.SmsVerificationUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  verified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const MagicLinkAttemptCreateInputSchema: z.ZodType<Prisma.MagicLinkAttemptCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  email: z.string(),
  ipAddress: z.string().optional().nullable(),
  success: z.boolean().optional(),
  sessionId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
});

export const MagicLinkAttemptUncheckedCreateInputSchema: z.ZodType<Prisma.MagicLinkAttemptUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  email: z.string(),
  ipAddress: z.string().optional().nullable(),
  success: z.boolean().optional(),
  sessionId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
});

export const MagicLinkAttemptUpdateInputSchema: z.ZodType<Prisma.MagicLinkAttemptUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  success: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  sessionId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const MagicLinkAttemptUncheckedUpdateInputSchema: z.ZodType<Prisma.MagicLinkAttemptUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  success: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  sessionId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const MagicLinkAttemptCreateManyInputSchema: z.ZodType<Prisma.MagicLinkAttemptCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  email: z.string(),
  ipAddress: z.string().optional().nullable(),
  success: z.boolean().optional(),
  sessionId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
});

export const MagicLinkAttemptUpdateManyMutationInputSchema: z.ZodType<Prisma.MagicLinkAttemptUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  success: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  sessionId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const MagicLinkAttemptUncheckedUpdateManyInputSchema: z.ZodType<Prisma.MagicLinkAttemptUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  success: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  sessionId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const StringFilterSchema: z.ZodType<Prisma.StringFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
});

export const BoolFilterSchema: z.ZodType<Prisma.BoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
});

export const StringNullableFilterSchema: z.ZodType<Prisma.StringNullableFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
});

export const DateTimeFilterSchema: z.ZodType<Prisma.DateTimeFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
});

export const SessionListRelationFilterSchema: z.ZodType<Prisma.SessionListRelationFilter> = z.strictObject({
  every: z.lazy(() => SessionWhereInputSchema).optional(),
  some: z.lazy(() => SessionWhereInputSchema).optional(),
  none: z.lazy(() => SessionWhereInputSchema).optional(),
});

export const AccountListRelationFilterSchema: z.ZodType<Prisma.AccountListRelationFilter> = z.strictObject({
  every: z.lazy(() => AccountWhereInputSchema).optional(),
  some: z.lazy(() => AccountWhereInputSchema).optional(),
  none: z.lazy(() => AccountWhereInputSchema).optional(),
});

export const EmailCampaignListRelationFilterSchema: z.ZodType<Prisma.EmailCampaignListRelationFilter> = z.strictObject({
  every: z.lazy(() => EmailCampaignWhereInputSchema).optional(),
  some: z.lazy(() => EmailCampaignWhereInputSchema).optional(),
  none: z.lazy(() => EmailCampaignWhereInputSchema).optional(),
});

export const RegistrationListRelationFilterSchema: z.ZodType<Prisma.RegistrationListRelationFilter> = z.strictObject({
  every: z.lazy(() => RegistrationWhereInputSchema).optional(),
  some: z.lazy(() => RegistrationWhereInputSchema).optional(),
  none: z.lazy(() => RegistrationWhereInputSchema).optional(),
});

export const SmsVerificationListRelationFilterSchema: z.ZodType<Prisma.SmsVerificationListRelationFilter> = z.strictObject({
  every: z.lazy(() => SmsVerificationWhereInputSchema).optional(),
  some: z.lazy(() => SmsVerificationWhereInputSchema).optional(),
  none: z.lazy(() => SmsVerificationWhereInputSchema).optional(),
});

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> = z.strictObject({
  sort: z.lazy(() => SortOrderSchema),
  nulls: z.lazy(() => NullsOrderSchema).optional(),
});

export const SessionOrderByRelationAggregateInputSchema: z.ZodType<Prisma.SessionOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const AccountOrderByRelationAggregateInputSchema: z.ZodType<Prisma.AccountOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const EmailCampaignOrderByRelationAggregateInputSchema: z.ZodType<Prisma.EmailCampaignOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const RegistrationOrderByRelationAggregateInputSchema: z.ZodType<Prisma.RegistrationOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const SmsVerificationOrderByRelationAggregateInputSchema: z.ZodType<Prisma.SmsVerificationOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const UserCountOrderByAggregateInputSchema: z.ZodType<Prisma.UserCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  emailVerified: z.lazy(() => SortOrderSchema).optional(),
  image: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  permissions: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  phoneNumber: z.lazy(() => SortOrderSchema).optional(),
  phoneVerified: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const UserMaxOrderByAggregateInputSchema: z.ZodType<Prisma.UserMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  emailVerified: z.lazy(() => SortOrderSchema).optional(),
  image: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  permissions: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  phoneNumber: z.lazy(() => SortOrderSchema).optional(),
  phoneVerified: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const UserMinOrderByAggregateInputSchema: z.ZodType<Prisma.UserMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  emailVerified: z.lazy(() => SortOrderSchema).optional(),
  image: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  permissions: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  phoneNumber: z.lazy(() => SortOrderSchema).optional(),
  phoneVerified: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const StringWithAggregatesFilterSchema: z.ZodType<Prisma.StringWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional(),
});

export const BoolWithAggregatesFilterSchema: z.ZodType<Prisma.BoolWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional(),
});

export const StringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.StringNullableWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
});

export const DateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
});

export const UserScalarRelationFilterSchema: z.ZodType<Prisma.UserScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => UserWhereInputSchema).optional(),
  isNot: z.lazy(() => UserWhereInputSchema).optional(),
});

export const SessionCountOrderByAggregateInputSchema: z.ZodType<Prisma.SessionCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  ipAddress: z.lazy(() => SortOrderSchema).optional(),
  userAgent: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
});

export const SessionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.SessionMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  ipAddress: z.lazy(() => SortOrderSchema).optional(),
  userAgent: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
});

export const SessionMinOrderByAggregateInputSchema: z.ZodType<Prisma.SessionMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  ipAddress: z.lazy(() => SortOrderSchema).optional(),
  userAgent: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
});

export const DateTimeNullableFilterSchema: z.ZodType<Prisma.DateTimeNullableFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
});

export const AccountCountOrderByAggregateInputSchema: z.ZodType<Prisma.AccountCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  accountId: z.lazy(() => SortOrderSchema).optional(),
  providerId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  accessToken: z.lazy(() => SortOrderSchema).optional(),
  refreshToken: z.lazy(() => SortOrderSchema).optional(),
  idToken: z.lazy(() => SortOrderSchema).optional(),
  accessTokenExpiresAt: z.lazy(() => SortOrderSchema).optional(),
  refreshTokenExpiresAt: z.lazy(() => SortOrderSchema).optional(),
  scope: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AccountMaxOrderByAggregateInputSchema: z.ZodType<Prisma.AccountMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  accountId: z.lazy(() => SortOrderSchema).optional(),
  providerId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  accessToken: z.lazy(() => SortOrderSchema).optional(),
  refreshToken: z.lazy(() => SortOrderSchema).optional(),
  idToken: z.lazy(() => SortOrderSchema).optional(),
  accessTokenExpiresAt: z.lazy(() => SortOrderSchema).optional(),
  refreshTokenExpiresAt: z.lazy(() => SortOrderSchema).optional(),
  scope: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AccountMinOrderByAggregateInputSchema: z.ZodType<Prisma.AccountMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  accountId: z.lazy(() => SortOrderSchema).optional(),
  providerId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  accessToken: z.lazy(() => SortOrderSchema).optional(),
  refreshToken: z.lazy(() => SortOrderSchema).optional(),
  idToken: z.lazy(() => SortOrderSchema).optional(),
  accessTokenExpiresAt: z.lazy(() => SortOrderSchema).optional(),
  refreshTokenExpiresAt: z.lazy(() => SortOrderSchema).optional(),
  scope: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const DateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
});

export const VerificationCountOrderByAggregateInputSchema: z.ZodType<Prisma.VerificationCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  identifier: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const VerificationMaxOrderByAggregateInputSchema: z.ZodType<Prisma.VerificationMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  identifier: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const VerificationMinOrderByAggregateInputSchema: z.ZodType<Prisma.VerificationMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  identifier: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const JsonFilterSchema: z.ZodType<Prisma.JsonFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
});

export const JsonNullableFilterSchema: z.ZodType<Prisma.JsonNullableFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
});

export const TicketListRelationFilterSchema: z.ZodType<Prisma.TicketListRelationFilter> = z.strictObject({
  every: z.lazy(() => TicketWhereInputSchema).optional(),
  some: z.lazy(() => TicketWhereInputSchema).optional(),
  none: z.lazy(() => TicketWhereInputSchema).optional(),
});

export const ReferralListRelationFilterSchema: z.ZodType<Prisma.ReferralListRelationFilter> = z.strictObject({
  every: z.lazy(() => ReferralWhereInputSchema).optional(),
  some: z.lazy(() => ReferralWhereInputSchema).optional(),
  none: z.lazy(() => ReferralWhereInputSchema).optional(),
});

export const ReferralUsageListRelationFilterSchema: z.ZodType<Prisma.ReferralUsageListRelationFilter> = z.strictObject({
  every: z.lazy(() => ReferralUsageWhereInputSchema).optional(),
  some: z.lazy(() => ReferralUsageWhereInputSchema).optional(),
  none: z.lazy(() => ReferralUsageWhereInputSchema).optional(),
});

export const EventFormFieldsListRelationFilterSchema: z.ZodType<Prisma.EventFormFieldsListRelationFilter> = z.strictObject({
  every: z.lazy(() => EventFormFieldsWhereInputSchema).optional(),
  some: z.lazy(() => EventFormFieldsWhereInputSchema).optional(),
  none: z.lazy(() => EventFormFieldsWhereInputSchema).optional(),
});

export const TicketOrderByRelationAggregateInputSchema: z.ZodType<Prisma.TicketOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const ReferralOrderByRelationAggregateInputSchema: z.ZodType<Prisma.ReferralOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const ReferralUsageOrderByRelationAggregateInputSchema: z.ZodType<Prisma.ReferralUsageOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const EventFormFieldsOrderByRelationAggregateInputSchema: z.ZodType<Prisma.EventFormFieldsOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const EventCountOrderByAggregateInputSchema: z.ZodType<Prisma.EventCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  slug: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  plainDescription: z.lazy(() => SortOrderSchema).optional(),
  location: z.lazy(() => SortOrderSchema).optional(),
  startDate: z.lazy(() => SortOrderSchema).optional(),
  endDate: z.lazy(() => SortOrderSchema).optional(),
  ogImage: z.lazy(() => SortOrderSchema).optional(),
  landingPage: z.lazy(() => SortOrderSchema).optional(),
  googleSheetsUrl: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  hideEvent: z.lazy(() => SortOrderSchema).optional(),
  useOpass: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const EventMaxOrderByAggregateInputSchema: z.ZodType<Prisma.EventMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  slug: z.lazy(() => SortOrderSchema).optional(),
  location: z.lazy(() => SortOrderSchema).optional(),
  startDate: z.lazy(() => SortOrderSchema).optional(),
  endDate: z.lazy(() => SortOrderSchema).optional(),
  ogImage: z.lazy(() => SortOrderSchema).optional(),
  landingPage: z.lazy(() => SortOrderSchema).optional(),
  googleSheetsUrl: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  hideEvent: z.lazy(() => SortOrderSchema).optional(),
  useOpass: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const EventMinOrderByAggregateInputSchema: z.ZodType<Prisma.EventMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  slug: z.lazy(() => SortOrderSchema).optional(),
  location: z.lazy(() => SortOrderSchema).optional(),
  startDate: z.lazy(() => SortOrderSchema).optional(),
  endDate: z.lazy(() => SortOrderSchema).optional(),
  ogImage: z.lazy(() => SortOrderSchema).optional(),
  landingPage: z.lazy(() => SortOrderSchema).optional(),
  googleSheetsUrl: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  hideEvent: z.lazy(() => SortOrderSchema).optional(),
  useOpass: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const JsonWithAggregatesFilterSchema: z.ZodType<Prisma.JsonWithAggregatesFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedJsonFilterSchema).optional(),
  _max: z.lazy(() => NestedJsonFilterSchema).optional(),
});

export const JsonNullableWithAggregatesFilterSchema: z.ZodType<Prisma.JsonNullableWithAggregatesFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
});

export const IntFilterSchema: z.ZodType<Prisma.IntFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
});

export const EventScalarRelationFilterSchema: z.ZodType<Prisma.EventScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => EventWhereInputSchema).optional(),
  isNot: z.lazy(() => EventWhereInputSchema).optional(),
});

export const InvitationCodeListRelationFilterSchema: z.ZodType<Prisma.InvitationCodeListRelationFilter> = z.strictObject({
  every: z.lazy(() => InvitationCodeWhereInputSchema).optional(),
  some: z.lazy(() => InvitationCodeWhereInputSchema).optional(),
  none: z.lazy(() => InvitationCodeWhereInputSchema).optional(),
});

export const InvitationCodeOrderByRelationAggregateInputSchema: z.ZodType<Prisma.InvitationCodeOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const TicketCountOrderByAggregateInputSchema: z.ZodType<Prisma.TicketCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  plainDescription: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  quantity: z.lazy(() => SortOrderSchema).optional(),
  soldCount: z.lazy(() => SortOrderSchema).optional(),
  saleStart: z.lazy(() => SortOrderSchema).optional(),
  saleEnd: z.lazy(() => SortOrderSchema).optional(),
  requireInviteCode: z.lazy(() => SortOrderSchema).optional(),
  requireSmsVerification: z.lazy(() => SortOrderSchema).optional(),
  hidden: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TicketAvgOrderByAggregateInputSchema: z.ZodType<Prisma.TicketAvgOrderByAggregateInput> = z.strictObject({
  order: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  quantity: z.lazy(() => SortOrderSchema).optional(),
  soldCount: z.lazy(() => SortOrderSchema).optional(),
});

export const TicketMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TicketMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  quantity: z.lazy(() => SortOrderSchema).optional(),
  soldCount: z.lazy(() => SortOrderSchema).optional(),
  saleStart: z.lazy(() => SortOrderSchema).optional(),
  saleEnd: z.lazy(() => SortOrderSchema).optional(),
  requireInviteCode: z.lazy(() => SortOrderSchema).optional(),
  requireSmsVerification: z.lazy(() => SortOrderSchema).optional(),
  hidden: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TicketMinOrderByAggregateInputSchema: z.ZodType<Prisma.TicketMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  quantity: z.lazy(() => SortOrderSchema).optional(),
  soldCount: z.lazy(() => SortOrderSchema).optional(),
  saleStart: z.lazy(() => SortOrderSchema).optional(),
  saleEnd: z.lazy(() => SortOrderSchema).optional(),
  requireInviteCode: z.lazy(() => SortOrderSchema).optional(),
  requireSmsVerification: z.lazy(() => SortOrderSchema).optional(),
  hidden: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TicketSumOrderByAggregateInputSchema: z.ZodType<Prisma.TicketSumOrderByAggregateInput> = z.strictObject({
  order: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  quantity: z.lazy(() => SortOrderSchema).optional(),
  soldCount: z.lazy(() => SortOrderSchema).optional(),
});

export const IntWithAggregatesFilterSchema: z.ZodType<Prisma.IntWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional(),
});

export const EventFormFieldsCountOrderByAggregateInputSchema: z.ZodType<Prisma.EventFormFieldsCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  validater: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  placeholder: z.lazy(() => SortOrderSchema).optional(),
  required: z.lazy(() => SortOrderSchema).optional(),
  values: z.lazy(() => SortOrderSchema).optional(),
  filters: z.lazy(() => SortOrderSchema).optional(),
  prompts: z.lazy(() => SortOrderSchema).optional(),
});

export const EventFormFieldsAvgOrderByAggregateInputSchema: z.ZodType<Prisma.EventFormFieldsAvgOrderByAggregateInput> = z.strictObject({
  order: z.lazy(() => SortOrderSchema).optional(),
});

export const EventFormFieldsMaxOrderByAggregateInputSchema: z.ZodType<Prisma.EventFormFieldsMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  validater: z.lazy(() => SortOrderSchema).optional(),
  placeholder: z.lazy(() => SortOrderSchema).optional(),
  required: z.lazy(() => SortOrderSchema).optional(),
});

export const EventFormFieldsMinOrderByAggregateInputSchema: z.ZodType<Prisma.EventFormFieldsMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  validater: z.lazy(() => SortOrderSchema).optional(),
  placeholder: z.lazy(() => SortOrderSchema).optional(),
  required: z.lazy(() => SortOrderSchema).optional(),
});

export const EventFormFieldsSumOrderByAggregateInputSchema: z.ZodType<Prisma.EventFormFieldsSumOrderByAggregateInput> = z.strictObject({
  order: z.lazy(() => SortOrderSchema).optional(),
});

export const TicketScalarRelationFilterSchema: z.ZodType<Prisma.TicketScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => TicketWhereInputSchema).optional(),
  isNot: z.lazy(() => TicketWhereInputSchema).optional(),
});

export const RegistrationNullableScalarRelationFilterSchema: z.ZodType<Prisma.RegistrationNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => RegistrationWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => RegistrationWhereInputSchema).optional().nullable(),
});

export const ReferralNullableScalarRelationFilterSchema: z.ZodType<Prisma.ReferralNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => ReferralWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => ReferralWhereInputSchema).optional().nullable(),
});

export const RegistrationEmailEventIdCompoundUniqueInputSchema: z.ZodType<Prisma.RegistrationEmailEventIdCompoundUniqueInput> = z.strictObject({
  email: z.string(),
  eventId: z.string(),
});

export const RegistrationCountOrderByAggregateInputSchema: z.ZodType<Prisma.RegistrationCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  ticketId: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  formData: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  referredBy: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const RegistrationMaxOrderByAggregateInputSchema: z.ZodType<Prisma.RegistrationMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  ticketId: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  formData: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  referredBy: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const RegistrationMinOrderByAggregateInputSchema: z.ZodType<Prisma.RegistrationMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  ticketId: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  formData: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  referredBy: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const RegistrationScalarRelationFilterSchema: z.ZodType<Prisma.RegistrationScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => RegistrationWhereInputSchema).optional(),
  isNot: z.lazy(() => RegistrationWhereInputSchema).optional(),
});

export const ReferralCountOrderByAggregateInputSchema: z.ZodType<Prisma.ReferralCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  registrationId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const ReferralMaxOrderByAggregateInputSchema: z.ZodType<Prisma.ReferralMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  registrationId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const ReferralMinOrderByAggregateInputSchema: z.ZodType<Prisma.ReferralMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  registrationId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const ReferralScalarRelationFilterSchema: z.ZodType<Prisma.ReferralScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => ReferralWhereInputSchema).optional(),
  isNot: z.lazy(() => ReferralWhereInputSchema).optional(),
});

export const ReferralUsageReferralIdRegistrationIdCompoundUniqueInputSchema: z.ZodType<Prisma.ReferralUsageReferralIdRegistrationIdCompoundUniqueInput> = z.strictObject({
  referralId: z.string(),
  registrationId: z.string(),
});

export const ReferralUsageCountOrderByAggregateInputSchema: z.ZodType<Prisma.ReferralUsageCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  referralId: z.lazy(() => SortOrderSchema).optional(),
  registrationId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  usedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const ReferralUsageMaxOrderByAggregateInputSchema: z.ZodType<Prisma.ReferralUsageMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  referralId: z.lazy(() => SortOrderSchema).optional(),
  registrationId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  usedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const ReferralUsageMinOrderByAggregateInputSchema: z.ZodType<Prisma.ReferralUsageMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  referralId: z.lazy(() => SortOrderSchema).optional(),
  registrationId: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  usedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const IntNullableFilterSchema: z.ZodType<Prisma.IntNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
});

export const InvitationCodeCountOrderByAggregateInputSchema: z.ZodType<Prisma.InvitationCodeCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  ticketId: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  usageLimit: z.lazy(() => SortOrderSchema).optional(),
  usedCount: z.lazy(() => SortOrderSchema).optional(),
  validFrom: z.lazy(() => SortOrderSchema).optional(),
  validUntil: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const InvitationCodeAvgOrderByAggregateInputSchema: z.ZodType<Prisma.InvitationCodeAvgOrderByAggregateInput> = z.strictObject({
  usageLimit: z.lazy(() => SortOrderSchema).optional(),
  usedCount: z.lazy(() => SortOrderSchema).optional(),
});

export const InvitationCodeMaxOrderByAggregateInputSchema: z.ZodType<Prisma.InvitationCodeMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  ticketId: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  usageLimit: z.lazy(() => SortOrderSchema).optional(),
  usedCount: z.lazy(() => SortOrderSchema).optional(),
  validFrom: z.lazy(() => SortOrderSchema).optional(),
  validUntil: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const InvitationCodeMinOrderByAggregateInputSchema: z.ZodType<Prisma.InvitationCodeMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  ticketId: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  usageLimit: z.lazy(() => SortOrderSchema).optional(),
  usedCount: z.lazy(() => SortOrderSchema).optional(),
  validFrom: z.lazy(() => SortOrderSchema).optional(),
  validUntil: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const InvitationCodeSumOrderByAggregateInputSchema: z.ZodType<Prisma.InvitationCodeSumOrderByAggregateInput> = z.strictObject({
  usageLimit: z.lazy(() => SortOrderSchema).optional(),
  usedCount: z.lazy(() => SortOrderSchema).optional(),
});

export const IntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.IntNullableWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedIntNullableFilterSchema).optional(),
});

export const EmailCampaignCountOrderByAggregateInputSchema: z.ZodType<Prisma.EmailCampaignCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  subject: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  recipientFilter: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  sentCount: z.lazy(() => SortOrderSchema).optional(),
  totalCount: z.lazy(() => SortOrderSchema).optional(),
  scheduledAt: z.lazy(() => SortOrderSchema).optional(),
  sentAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const EmailCampaignAvgOrderByAggregateInputSchema: z.ZodType<Prisma.EmailCampaignAvgOrderByAggregateInput> = z.strictObject({
  sentCount: z.lazy(() => SortOrderSchema).optional(),
  totalCount: z.lazy(() => SortOrderSchema).optional(),
});

export const EmailCampaignMaxOrderByAggregateInputSchema: z.ZodType<Prisma.EmailCampaignMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  subject: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  recipientFilter: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  sentCount: z.lazy(() => SortOrderSchema).optional(),
  totalCount: z.lazy(() => SortOrderSchema).optional(),
  scheduledAt: z.lazy(() => SortOrderSchema).optional(),
  sentAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const EmailCampaignMinOrderByAggregateInputSchema: z.ZodType<Prisma.EmailCampaignMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  subject: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  recipientFilter: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  sentCount: z.lazy(() => SortOrderSchema).optional(),
  totalCount: z.lazy(() => SortOrderSchema).optional(),
  scheduledAt: z.lazy(() => SortOrderSchema).optional(),
  sentAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const EmailCampaignSumOrderByAggregateInputSchema: z.ZodType<Prisma.EmailCampaignSumOrderByAggregateInput> = z.strictObject({
  sentCount: z.lazy(() => SortOrderSchema).optional(),
  totalCount: z.lazy(() => SortOrderSchema).optional(),
});

export const SmsVerificationCountOrderByAggregateInputSchema: z.ZodType<Prisma.SmsVerificationCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  phoneNumber: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  verified: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const SmsVerificationMaxOrderByAggregateInputSchema: z.ZodType<Prisma.SmsVerificationMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  phoneNumber: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  verified: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const SmsVerificationMinOrderByAggregateInputSchema: z.ZodType<Prisma.SmsVerificationMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  phoneNumber: z.lazy(() => SortOrderSchema).optional(),
  code: z.lazy(() => SortOrderSchema).optional(),
  verified: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const MagicLinkAttemptCountOrderByAggregateInputSchema: z.ZodType<Prisma.MagicLinkAttemptCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  ipAddress: z.lazy(() => SortOrderSchema).optional(),
  success: z.lazy(() => SortOrderSchema).optional(),
  sessionId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const MagicLinkAttemptMaxOrderByAggregateInputSchema: z.ZodType<Prisma.MagicLinkAttemptMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  ipAddress: z.lazy(() => SortOrderSchema).optional(),
  success: z.lazy(() => SortOrderSchema).optional(),
  sessionId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const MagicLinkAttemptMinOrderByAggregateInputSchema: z.ZodType<Prisma.MagicLinkAttemptMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  ipAddress: z.lazy(() => SortOrderSchema).optional(),
  success: z.lazy(() => SortOrderSchema).optional(),
  sessionId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const SessionCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.SessionCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => SessionCreateWithoutUserInputSchema), z.lazy(() => SessionCreateWithoutUserInputSchema).array(), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema), z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SessionCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
});

export const AccountCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.AccountCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => AccountCreateWithoutUserInputSchema), z.lazy(() => AccountCreateWithoutUserInputSchema).array(), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema), z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AccountCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
});

export const EmailCampaignCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.EmailCampaignCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => EmailCampaignCreateWithoutUserInputSchema), z.lazy(() => EmailCampaignCreateWithoutUserInputSchema).array(), z.lazy(() => EmailCampaignUncheckedCreateWithoutUserInputSchema), z.lazy(() => EmailCampaignUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => EmailCampaignCreateOrConnectWithoutUserInputSchema), z.lazy(() => EmailCampaignCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => EmailCampaignCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => EmailCampaignWhereUniqueInputSchema), z.lazy(() => EmailCampaignWhereUniqueInputSchema).array() ]).optional(),
});

export const RegistrationCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.RegistrationCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutUserInputSchema), z.lazy(() => RegistrationCreateWithoutUserInputSchema).array(), z.lazy(() => RegistrationUncheckedCreateWithoutUserInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RegistrationCreateOrConnectWithoutUserInputSchema), z.lazy(() => RegistrationCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RegistrationCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
});

export const SmsVerificationCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.SmsVerificationCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => SmsVerificationCreateWithoutUserInputSchema), z.lazy(() => SmsVerificationCreateWithoutUserInputSchema).array(), z.lazy(() => SmsVerificationUncheckedCreateWithoutUserInputSchema), z.lazy(() => SmsVerificationUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SmsVerificationCreateOrConnectWithoutUserInputSchema), z.lazy(() => SmsVerificationCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SmsVerificationCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SmsVerificationWhereUniqueInputSchema), z.lazy(() => SmsVerificationWhereUniqueInputSchema).array() ]).optional(),
});

export const SessionUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.SessionUncheckedCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => SessionCreateWithoutUserInputSchema), z.lazy(() => SessionCreateWithoutUserInputSchema).array(), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema), z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SessionCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
});

export const AccountUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.AccountUncheckedCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => AccountCreateWithoutUserInputSchema), z.lazy(() => AccountCreateWithoutUserInputSchema).array(), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema), z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AccountCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
});

export const EmailCampaignUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.EmailCampaignUncheckedCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => EmailCampaignCreateWithoutUserInputSchema), z.lazy(() => EmailCampaignCreateWithoutUserInputSchema).array(), z.lazy(() => EmailCampaignUncheckedCreateWithoutUserInputSchema), z.lazy(() => EmailCampaignUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => EmailCampaignCreateOrConnectWithoutUserInputSchema), z.lazy(() => EmailCampaignCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => EmailCampaignCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => EmailCampaignWhereUniqueInputSchema), z.lazy(() => EmailCampaignWhereUniqueInputSchema).array() ]).optional(),
});

export const RegistrationUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.RegistrationUncheckedCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutUserInputSchema), z.lazy(() => RegistrationCreateWithoutUserInputSchema).array(), z.lazy(() => RegistrationUncheckedCreateWithoutUserInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RegistrationCreateOrConnectWithoutUserInputSchema), z.lazy(() => RegistrationCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RegistrationCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
});

export const SmsVerificationUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.SmsVerificationUncheckedCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => SmsVerificationCreateWithoutUserInputSchema), z.lazy(() => SmsVerificationCreateWithoutUserInputSchema).array(), z.lazy(() => SmsVerificationUncheckedCreateWithoutUserInputSchema), z.lazy(() => SmsVerificationUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SmsVerificationCreateOrConnectWithoutUserInputSchema), z.lazy(() => SmsVerificationCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SmsVerificationCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SmsVerificationWhereUniqueInputSchema), z.lazy(() => SmsVerificationWhereUniqueInputSchema).array() ]).optional(),
});

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional(),
});

export const BoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.BoolFieldUpdateOperationsInput> = z.strictObject({
  set: z.boolean().optional(),
});

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional().nullable(),
});

export const DateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DateTimeFieldUpdateOperationsInput> = z.strictObject({
  set: z.coerce.date().optional(),
});

export const SessionUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.SessionUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SessionCreateWithoutUserInputSchema), z.lazy(() => SessionCreateWithoutUserInputSchema).array(), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema), z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SessionUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => SessionUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SessionCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SessionUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => SessionUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SessionUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => SessionUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SessionScalarWhereInputSchema), z.lazy(() => SessionScalarWhereInputSchema).array() ]).optional(),
});

export const AccountUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.AccountUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => AccountCreateWithoutUserInputSchema), z.lazy(() => AccountCreateWithoutUserInputSchema).array(), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema), z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => AccountUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => AccountUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AccountCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => AccountUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => AccountUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => AccountUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => AccountUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => AccountScalarWhereInputSchema), z.lazy(() => AccountScalarWhereInputSchema).array() ]).optional(),
});

export const EmailCampaignUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.EmailCampaignUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => EmailCampaignCreateWithoutUserInputSchema), z.lazy(() => EmailCampaignCreateWithoutUserInputSchema).array(), z.lazy(() => EmailCampaignUncheckedCreateWithoutUserInputSchema), z.lazy(() => EmailCampaignUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => EmailCampaignCreateOrConnectWithoutUserInputSchema), z.lazy(() => EmailCampaignCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => EmailCampaignUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => EmailCampaignUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => EmailCampaignCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => EmailCampaignWhereUniqueInputSchema), z.lazy(() => EmailCampaignWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => EmailCampaignWhereUniqueInputSchema), z.lazy(() => EmailCampaignWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => EmailCampaignWhereUniqueInputSchema), z.lazy(() => EmailCampaignWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => EmailCampaignWhereUniqueInputSchema), z.lazy(() => EmailCampaignWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => EmailCampaignUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => EmailCampaignUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => EmailCampaignUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => EmailCampaignUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => EmailCampaignScalarWhereInputSchema), z.lazy(() => EmailCampaignScalarWhereInputSchema).array() ]).optional(),
});

export const RegistrationUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.RegistrationUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutUserInputSchema), z.lazy(() => RegistrationCreateWithoutUserInputSchema).array(), z.lazy(() => RegistrationUncheckedCreateWithoutUserInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RegistrationCreateOrConnectWithoutUserInputSchema), z.lazy(() => RegistrationCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => RegistrationUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => RegistrationUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RegistrationCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => RegistrationUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => RegistrationUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => RegistrationUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => RegistrationUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => RegistrationScalarWhereInputSchema), z.lazy(() => RegistrationScalarWhereInputSchema).array() ]).optional(),
});

export const SmsVerificationUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.SmsVerificationUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SmsVerificationCreateWithoutUserInputSchema), z.lazy(() => SmsVerificationCreateWithoutUserInputSchema).array(), z.lazy(() => SmsVerificationUncheckedCreateWithoutUserInputSchema), z.lazy(() => SmsVerificationUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SmsVerificationCreateOrConnectWithoutUserInputSchema), z.lazy(() => SmsVerificationCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SmsVerificationUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => SmsVerificationUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SmsVerificationCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SmsVerificationWhereUniqueInputSchema), z.lazy(() => SmsVerificationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SmsVerificationWhereUniqueInputSchema), z.lazy(() => SmsVerificationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SmsVerificationWhereUniqueInputSchema), z.lazy(() => SmsVerificationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SmsVerificationWhereUniqueInputSchema), z.lazy(() => SmsVerificationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SmsVerificationUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => SmsVerificationUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SmsVerificationUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => SmsVerificationUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SmsVerificationScalarWhereInputSchema), z.lazy(() => SmsVerificationScalarWhereInputSchema).array() ]).optional(),
});

export const SessionUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SessionCreateWithoutUserInputSchema), z.lazy(() => SessionCreateWithoutUserInputSchema).array(), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema), z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SessionUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => SessionUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SessionCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SessionUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => SessionUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SessionUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => SessionUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SessionScalarWhereInputSchema), z.lazy(() => SessionScalarWhereInputSchema).array() ]).optional(),
});

export const AccountUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.AccountUncheckedUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => AccountCreateWithoutUserInputSchema), z.lazy(() => AccountCreateWithoutUserInputSchema).array(), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema), z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => AccountUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => AccountUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AccountCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => AccountUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => AccountUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => AccountUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => AccountUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => AccountScalarWhereInputSchema), z.lazy(() => AccountScalarWhereInputSchema).array() ]).optional(),
});

export const EmailCampaignUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.EmailCampaignUncheckedUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => EmailCampaignCreateWithoutUserInputSchema), z.lazy(() => EmailCampaignCreateWithoutUserInputSchema).array(), z.lazy(() => EmailCampaignUncheckedCreateWithoutUserInputSchema), z.lazy(() => EmailCampaignUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => EmailCampaignCreateOrConnectWithoutUserInputSchema), z.lazy(() => EmailCampaignCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => EmailCampaignUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => EmailCampaignUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => EmailCampaignCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => EmailCampaignWhereUniqueInputSchema), z.lazy(() => EmailCampaignWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => EmailCampaignWhereUniqueInputSchema), z.lazy(() => EmailCampaignWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => EmailCampaignWhereUniqueInputSchema), z.lazy(() => EmailCampaignWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => EmailCampaignWhereUniqueInputSchema), z.lazy(() => EmailCampaignWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => EmailCampaignUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => EmailCampaignUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => EmailCampaignUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => EmailCampaignUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => EmailCampaignScalarWhereInputSchema), z.lazy(() => EmailCampaignScalarWhereInputSchema).array() ]).optional(),
});

export const RegistrationUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutUserInputSchema), z.lazy(() => RegistrationCreateWithoutUserInputSchema).array(), z.lazy(() => RegistrationUncheckedCreateWithoutUserInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RegistrationCreateOrConnectWithoutUserInputSchema), z.lazy(() => RegistrationCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => RegistrationUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => RegistrationUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RegistrationCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => RegistrationUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => RegistrationUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => RegistrationUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => RegistrationUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => RegistrationScalarWhereInputSchema), z.lazy(() => RegistrationScalarWhereInputSchema).array() ]).optional(),
});

export const SmsVerificationUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.SmsVerificationUncheckedUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SmsVerificationCreateWithoutUserInputSchema), z.lazy(() => SmsVerificationCreateWithoutUserInputSchema).array(), z.lazy(() => SmsVerificationUncheckedCreateWithoutUserInputSchema), z.lazy(() => SmsVerificationUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SmsVerificationCreateOrConnectWithoutUserInputSchema), z.lazy(() => SmsVerificationCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SmsVerificationUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => SmsVerificationUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SmsVerificationCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SmsVerificationWhereUniqueInputSchema), z.lazy(() => SmsVerificationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SmsVerificationWhereUniqueInputSchema), z.lazy(() => SmsVerificationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SmsVerificationWhereUniqueInputSchema), z.lazy(() => SmsVerificationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SmsVerificationWhereUniqueInputSchema), z.lazy(() => SmsVerificationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SmsVerificationUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => SmsVerificationUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SmsVerificationUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => SmsVerificationUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SmsVerificationScalarWhereInputSchema), z.lazy(() => SmsVerificationScalarWhereInputSchema).array() ]).optional(),
});

export const UserCreateNestedOneWithoutSessionsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutSessionsInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedCreateWithoutSessionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutSessionsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const UserUpdateOneRequiredWithoutSessionsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutSessionsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedCreateWithoutSessionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutSessionsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutSessionsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutSessionsInputSchema), z.lazy(() => UserUpdateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutSessionsInputSchema) ]).optional(),
});

export const UserCreateNestedOneWithoutAccountsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutAccountsInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutAccountsInputSchema), z.lazy(() => UserUncheckedCreateWithoutAccountsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutAccountsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const NullableDateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDateTimeFieldUpdateOperationsInput> = z.strictObject({
  set: z.coerce.date().optional().nullable(),
});

export const UserUpdateOneRequiredWithoutAccountsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutAccountsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutAccountsInputSchema), z.lazy(() => UserUncheckedCreateWithoutAccountsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutAccountsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutAccountsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutAccountsInputSchema), z.lazy(() => UserUpdateWithoutAccountsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutAccountsInputSchema) ]).optional(),
});

export const TicketCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.TicketCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => TicketCreateWithoutEventInputSchema), z.lazy(() => TicketCreateWithoutEventInputSchema).array(), z.lazy(() => TicketUncheckedCreateWithoutEventInputSchema), z.lazy(() => TicketUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TicketCreateOrConnectWithoutEventInputSchema), z.lazy(() => TicketCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TicketCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TicketWhereUniqueInputSchema), z.lazy(() => TicketWhereUniqueInputSchema).array() ]).optional(),
});

export const RegistrationCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.RegistrationCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutEventInputSchema), z.lazy(() => RegistrationCreateWithoutEventInputSchema).array(), z.lazy(() => RegistrationUncheckedCreateWithoutEventInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RegistrationCreateOrConnectWithoutEventInputSchema), z.lazy(() => RegistrationCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RegistrationCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
});

export const ReferralCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.ReferralCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralCreateWithoutEventInputSchema), z.lazy(() => ReferralCreateWithoutEventInputSchema).array(), z.lazy(() => ReferralUncheckedCreateWithoutEventInputSchema), z.lazy(() => ReferralUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReferralCreateOrConnectWithoutEventInputSchema), z.lazy(() => ReferralCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReferralCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ReferralWhereUniqueInputSchema), z.lazy(() => ReferralWhereUniqueInputSchema).array() ]).optional(),
});

export const ReferralUsageCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.ReferralUsageCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralUsageCreateWithoutEventInputSchema), z.lazy(() => ReferralUsageCreateWithoutEventInputSchema).array(), z.lazy(() => ReferralUsageUncheckedCreateWithoutEventInputSchema), z.lazy(() => ReferralUsageUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReferralUsageCreateOrConnectWithoutEventInputSchema), z.lazy(() => ReferralUsageCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReferralUsageCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
});

export const EventFormFieldsCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.EventFormFieldsCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventFormFieldsCreateWithoutEventInputSchema), z.lazy(() => EventFormFieldsCreateWithoutEventInputSchema).array(), z.lazy(() => EventFormFieldsUncheckedCreateWithoutEventInputSchema), z.lazy(() => EventFormFieldsUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => EventFormFieldsCreateOrConnectWithoutEventInputSchema), z.lazy(() => EventFormFieldsCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => EventFormFieldsCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => EventFormFieldsWhereUniqueInputSchema), z.lazy(() => EventFormFieldsWhereUniqueInputSchema).array() ]).optional(),
});

export const TicketUncheckedCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.TicketUncheckedCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => TicketCreateWithoutEventInputSchema), z.lazy(() => TicketCreateWithoutEventInputSchema).array(), z.lazy(() => TicketUncheckedCreateWithoutEventInputSchema), z.lazy(() => TicketUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TicketCreateOrConnectWithoutEventInputSchema), z.lazy(() => TicketCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TicketCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TicketWhereUniqueInputSchema), z.lazy(() => TicketWhereUniqueInputSchema).array() ]).optional(),
});

export const RegistrationUncheckedCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.RegistrationUncheckedCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutEventInputSchema), z.lazy(() => RegistrationCreateWithoutEventInputSchema).array(), z.lazy(() => RegistrationUncheckedCreateWithoutEventInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RegistrationCreateOrConnectWithoutEventInputSchema), z.lazy(() => RegistrationCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RegistrationCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
});

export const ReferralUncheckedCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.ReferralUncheckedCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralCreateWithoutEventInputSchema), z.lazy(() => ReferralCreateWithoutEventInputSchema).array(), z.lazy(() => ReferralUncheckedCreateWithoutEventInputSchema), z.lazy(() => ReferralUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReferralCreateOrConnectWithoutEventInputSchema), z.lazy(() => ReferralCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReferralCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ReferralWhereUniqueInputSchema), z.lazy(() => ReferralWhereUniqueInputSchema).array() ]).optional(),
});

export const ReferralUsageUncheckedCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.ReferralUsageUncheckedCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralUsageCreateWithoutEventInputSchema), z.lazy(() => ReferralUsageCreateWithoutEventInputSchema).array(), z.lazy(() => ReferralUsageUncheckedCreateWithoutEventInputSchema), z.lazy(() => ReferralUsageUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReferralUsageCreateOrConnectWithoutEventInputSchema), z.lazy(() => ReferralUsageCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReferralUsageCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
});

export const EventFormFieldsUncheckedCreateNestedManyWithoutEventInputSchema: z.ZodType<Prisma.EventFormFieldsUncheckedCreateNestedManyWithoutEventInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventFormFieldsCreateWithoutEventInputSchema), z.lazy(() => EventFormFieldsCreateWithoutEventInputSchema).array(), z.lazy(() => EventFormFieldsUncheckedCreateWithoutEventInputSchema), z.lazy(() => EventFormFieldsUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => EventFormFieldsCreateOrConnectWithoutEventInputSchema), z.lazy(() => EventFormFieldsCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => EventFormFieldsCreateManyEventInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => EventFormFieldsWhereUniqueInputSchema), z.lazy(() => EventFormFieldsWhereUniqueInputSchema).array() ]).optional(),
});

export const TicketUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.TicketUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TicketCreateWithoutEventInputSchema), z.lazy(() => TicketCreateWithoutEventInputSchema).array(), z.lazy(() => TicketUncheckedCreateWithoutEventInputSchema), z.lazy(() => TicketUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TicketCreateOrConnectWithoutEventInputSchema), z.lazy(() => TicketCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TicketUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => TicketUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TicketCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TicketWhereUniqueInputSchema), z.lazy(() => TicketWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TicketWhereUniqueInputSchema), z.lazy(() => TicketWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TicketWhereUniqueInputSchema), z.lazy(() => TicketWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TicketWhereUniqueInputSchema), z.lazy(() => TicketWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TicketUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => TicketUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TicketUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => TicketUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TicketScalarWhereInputSchema), z.lazy(() => TicketScalarWhereInputSchema).array() ]).optional(),
});

export const RegistrationUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.RegistrationUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutEventInputSchema), z.lazy(() => RegistrationCreateWithoutEventInputSchema).array(), z.lazy(() => RegistrationUncheckedCreateWithoutEventInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RegistrationCreateOrConnectWithoutEventInputSchema), z.lazy(() => RegistrationCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => RegistrationUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => RegistrationUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RegistrationCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => RegistrationUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => RegistrationUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => RegistrationUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => RegistrationUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => RegistrationScalarWhereInputSchema), z.lazy(() => RegistrationScalarWhereInputSchema).array() ]).optional(),
});

export const ReferralUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.ReferralUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralCreateWithoutEventInputSchema), z.lazy(() => ReferralCreateWithoutEventInputSchema).array(), z.lazy(() => ReferralUncheckedCreateWithoutEventInputSchema), z.lazy(() => ReferralUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReferralCreateOrConnectWithoutEventInputSchema), z.lazy(() => ReferralCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ReferralUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => ReferralUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReferralCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ReferralWhereUniqueInputSchema), z.lazy(() => ReferralWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ReferralWhereUniqueInputSchema), z.lazy(() => ReferralWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ReferralWhereUniqueInputSchema), z.lazy(() => ReferralWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ReferralWhereUniqueInputSchema), z.lazy(() => ReferralWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ReferralUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => ReferralUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ReferralUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => ReferralUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ReferralScalarWhereInputSchema), z.lazy(() => ReferralScalarWhereInputSchema).array() ]).optional(),
});

export const ReferralUsageUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.ReferralUsageUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralUsageCreateWithoutEventInputSchema), z.lazy(() => ReferralUsageCreateWithoutEventInputSchema).array(), z.lazy(() => ReferralUsageUncheckedCreateWithoutEventInputSchema), z.lazy(() => ReferralUsageUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReferralUsageCreateOrConnectWithoutEventInputSchema), z.lazy(() => ReferralUsageCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ReferralUsageUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => ReferralUsageUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReferralUsageCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ReferralUsageUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => ReferralUsageUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ReferralUsageUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => ReferralUsageUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ReferralUsageScalarWhereInputSchema), z.lazy(() => ReferralUsageScalarWhereInputSchema).array() ]).optional(),
});

export const EventFormFieldsUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.EventFormFieldsUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventFormFieldsCreateWithoutEventInputSchema), z.lazy(() => EventFormFieldsCreateWithoutEventInputSchema).array(), z.lazy(() => EventFormFieldsUncheckedCreateWithoutEventInputSchema), z.lazy(() => EventFormFieldsUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => EventFormFieldsCreateOrConnectWithoutEventInputSchema), z.lazy(() => EventFormFieldsCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => EventFormFieldsUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => EventFormFieldsUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => EventFormFieldsCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => EventFormFieldsWhereUniqueInputSchema), z.lazy(() => EventFormFieldsWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => EventFormFieldsWhereUniqueInputSchema), z.lazy(() => EventFormFieldsWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => EventFormFieldsWhereUniqueInputSchema), z.lazy(() => EventFormFieldsWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => EventFormFieldsWhereUniqueInputSchema), z.lazy(() => EventFormFieldsWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => EventFormFieldsUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => EventFormFieldsUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => EventFormFieldsUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => EventFormFieldsUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => EventFormFieldsScalarWhereInputSchema), z.lazy(() => EventFormFieldsScalarWhereInputSchema).array() ]).optional(),
});

export const TicketUncheckedUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.TicketUncheckedUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TicketCreateWithoutEventInputSchema), z.lazy(() => TicketCreateWithoutEventInputSchema).array(), z.lazy(() => TicketUncheckedCreateWithoutEventInputSchema), z.lazy(() => TicketUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TicketCreateOrConnectWithoutEventInputSchema), z.lazy(() => TicketCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TicketUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => TicketUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TicketCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TicketWhereUniqueInputSchema), z.lazy(() => TicketWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TicketWhereUniqueInputSchema), z.lazy(() => TicketWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TicketWhereUniqueInputSchema), z.lazy(() => TicketWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TicketWhereUniqueInputSchema), z.lazy(() => TicketWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TicketUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => TicketUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TicketUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => TicketUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TicketScalarWhereInputSchema), z.lazy(() => TicketScalarWhereInputSchema).array() ]).optional(),
});

export const RegistrationUncheckedUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutEventInputSchema), z.lazy(() => RegistrationCreateWithoutEventInputSchema).array(), z.lazy(() => RegistrationUncheckedCreateWithoutEventInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RegistrationCreateOrConnectWithoutEventInputSchema), z.lazy(() => RegistrationCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => RegistrationUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => RegistrationUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RegistrationCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => RegistrationUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => RegistrationUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => RegistrationUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => RegistrationUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => RegistrationScalarWhereInputSchema), z.lazy(() => RegistrationScalarWhereInputSchema).array() ]).optional(),
});

export const ReferralUncheckedUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.ReferralUncheckedUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralCreateWithoutEventInputSchema), z.lazy(() => ReferralCreateWithoutEventInputSchema).array(), z.lazy(() => ReferralUncheckedCreateWithoutEventInputSchema), z.lazy(() => ReferralUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReferralCreateOrConnectWithoutEventInputSchema), z.lazy(() => ReferralCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ReferralUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => ReferralUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReferralCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ReferralWhereUniqueInputSchema), z.lazy(() => ReferralWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ReferralWhereUniqueInputSchema), z.lazy(() => ReferralWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ReferralWhereUniqueInputSchema), z.lazy(() => ReferralWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ReferralWhereUniqueInputSchema), z.lazy(() => ReferralWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ReferralUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => ReferralUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ReferralUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => ReferralUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ReferralScalarWhereInputSchema), z.lazy(() => ReferralScalarWhereInputSchema).array() ]).optional(),
});

export const ReferralUsageUncheckedUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.ReferralUsageUncheckedUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralUsageCreateWithoutEventInputSchema), z.lazy(() => ReferralUsageCreateWithoutEventInputSchema).array(), z.lazy(() => ReferralUsageUncheckedCreateWithoutEventInputSchema), z.lazy(() => ReferralUsageUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReferralUsageCreateOrConnectWithoutEventInputSchema), z.lazy(() => ReferralUsageCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ReferralUsageUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => ReferralUsageUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReferralUsageCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ReferralUsageUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => ReferralUsageUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ReferralUsageUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => ReferralUsageUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ReferralUsageScalarWhereInputSchema), z.lazy(() => ReferralUsageScalarWhereInputSchema).array() ]).optional(),
});

export const EventFormFieldsUncheckedUpdateManyWithoutEventNestedInputSchema: z.ZodType<Prisma.EventFormFieldsUncheckedUpdateManyWithoutEventNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventFormFieldsCreateWithoutEventInputSchema), z.lazy(() => EventFormFieldsCreateWithoutEventInputSchema).array(), z.lazy(() => EventFormFieldsUncheckedCreateWithoutEventInputSchema), z.lazy(() => EventFormFieldsUncheckedCreateWithoutEventInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => EventFormFieldsCreateOrConnectWithoutEventInputSchema), z.lazy(() => EventFormFieldsCreateOrConnectWithoutEventInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => EventFormFieldsUpsertWithWhereUniqueWithoutEventInputSchema), z.lazy(() => EventFormFieldsUpsertWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  createMany: z.lazy(() => EventFormFieldsCreateManyEventInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => EventFormFieldsWhereUniqueInputSchema), z.lazy(() => EventFormFieldsWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => EventFormFieldsWhereUniqueInputSchema), z.lazy(() => EventFormFieldsWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => EventFormFieldsWhereUniqueInputSchema), z.lazy(() => EventFormFieldsWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => EventFormFieldsWhereUniqueInputSchema), z.lazy(() => EventFormFieldsWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => EventFormFieldsUpdateWithWhereUniqueWithoutEventInputSchema), z.lazy(() => EventFormFieldsUpdateWithWhereUniqueWithoutEventInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => EventFormFieldsUpdateManyWithWhereWithoutEventInputSchema), z.lazy(() => EventFormFieldsUpdateManyWithWhereWithoutEventInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => EventFormFieldsScalarWhereInputSchema), z.lazy(() => EventFormFieldsScalarWhereInputSchema).array() ]).optional(),
});

export const EventCreateNestedOneWithoutTicketsInputSchema: z.ZodType<Prisma.EventCreateNestedOneWithoutTicketsInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutTicketsInputSchema), z.lazy(() => EventUncheckedCreateWithoutTicketsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutTicketsInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
});

export const RegistrationCreateNestedManyWithoutTicketInputSchema: z.ZodType<Prisma.RegistrationCreateNestedManyWithoutTicketInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutTicketInputSchema), z.lazy(() => RegistrationCreateWithoutTicketInputSchema).array(), z.lazy(() => RegistrationUncheckedCreateWithoutTicketInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutTicketInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RegistrationCreateOrConnectWithoutTicketInputSchema), z.lazy(() => RegistrationCreateOrConnectWithoutTicketInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RegistrationCreateManyTicketInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
});

export const InvitationCodeCreateNestedManyWithoutTicketInputSchema: z.ZodType<Prisma.InvitationCodeCreateNestedManyWithoutTicketInput> = z.strictObject({
  create: z.union([ z.lazy(() => InvitationCodeCreateWithoutTicketInputSchema), z.lazy(() => InvitationCodeCreateWithoutTicketInputSchema).array(), z.lazy(() => InvitationCodeUncheckedCreateWithoutTicketInputSchema), z.lazy(() => InvitationCodeUncheckedCreateWithoutTicketInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => InvitationCodeCreateOrConnectWithoutTicketInputSchema), z.lazy(() => InvitationCodeCreateOrConnectWithoutTicketInputSchema).array() ]).optional(),
  createMany: z.lazy(() => InvitationCodeCreateManyTicketInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => InvitationCodeWhereUniqueInputSchema), z.lazy(() => InvitationCodeWhereUniqueInputSchema).array() ]).optional(),
});

export const RegistrationUncheckedCreateNestedManyWithoutTicketInputSchema: z.ZodType<Prisma.RegistrationUncheckedCreateNestedManyWithoutTicketInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutTicketInputSchema), z.lazy(() => RegistrationCreateWithoutTicketInputSchema).array(), z.lazy(() => RegistrationUncheckedCreateWithoutTicketInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutTicketInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RegistrationCreateOrConnectWithoutTicketInputSchema), z.lazy(() => RegistrationCreateOrConnectWithoutTicketInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RegistrationCreateManyTicketInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
});

export const InvitationCodeUncheckedCreateNestedManyWithoutTicketInputSchema: z.ZodType<Prisma.InvitationCodeUncheckedCreateNestedManyWithoutTicketInput> = z.strictObject({
  create: z.union([ z.lazy(() => InvitationCodeCreateWithoutTicketInputSchema), z.lazy(() => InvitationCodeCreateWithoutTicketInputSchema).array(), z.lazy(() => InvitationCodeUncheckedCreateWithoutTicketInputSchema), z.lazy(() => InvitationCodeUncheckedCreateWithoutTicketInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => InvitationCodeCreateOrConnectWithoutTicketInputSchema), z.lazy(() => InvitationCodeCreateOrConnectWithoutTicketInputSchema).array() ]).optional(),
  createMany: z.lazy(() => InvitationCodeCreateManyTicketInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => InvitationCodeWhereUniqueInputSchema), z.lazy(() => InvitationCodeWhereUniqueInputSchema).array() ]).optional(),
});

export const IntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.IntFieldUpdateOperationsInput> = z.strictObject({
  set: z.number().optional(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional(),
});

export const EventUpdateOneRequiredWithoutTicketsNestedInputSchema: z.ZodType<Prisma.EventUpdateOneRequiredWithoutTicketsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutTicketsInputSchema), z.lazy(() => EventUncheckedCreateWithoutTicketsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutTicketsInputSchema).optional(),
  upsert: z.lazy(() => EventUpsertWithoutTicketsInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => EventUpdateToOneWithWhereWithoutTicketsInputSchema), z.lazy(() => EventUpdateWithoutTicketsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutTicketsInputSchema) ]).optional(),
});

export const RegistrationUpdateManyWithoutTicketNestedInputSchema: z.ZodType<Prisma.RegistrationUpdateManyWithoutTicketNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutTicketInputSchema), z.lazy(() => RegistrationCreateWithoutTicketInputSchema).array(), z.lazy(() => RegistrationUncheckedCreateWithoutTicketInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutTicketInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RegistrationCreateOrConnectWithoutTicketInputSchema), z.lazy(() => RegistrationCreateOrConnectWithoutTicketInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => RegistrationUpsertWithWhereUniqueWithoutTicketInputSchema), z.lazy(() => RegistrationUpsertWithWhereUniqueWithoutTicketInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RegistrationCreateManyTicketInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => RegistrationUpdateWithWhereUniqueWithoutTicketInputSchema), z.lazy(() => RegistrationUpdateWithWhereUniqueWithoutTicketInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => RegistrationUpdateManyWithWhereWithoutTicketInputSchema), z.lazy(() => RegistrationUpdateManyWithWhereWithoutTicketInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => RegistrationScalarWhereInputSchema), z.lazy(() => RegistrationScalarWhereInputSchema).array() ]).optional(),
});

export const InvitationCodeUpdateManyWithoutTicketNestedInputSchema: z.ZodType<Prisma.InvitationCodeUpdateManyWithoutTicketNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => InvitationCodeCreateWithoutTicketInputSchema), z.lazy(() => InvitationCodeCreateWithoutTicketInputSchema).array(), z.lazy(() => InvitationCodeUncheckedCreateWithoutTicketInputSchema), z.lazy(() => InvitationCodeUncheckedCreateWithoutTicketInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => InvitationCodeCreateOrConnectWithoutTicketInputSchema), z.lazy(() => InvitationCodeCreateOrConnectWithoutTicketInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => InvitationCodeUpsertWithWhereUniqueWithoutTicketInputSchema), z.lazy(() => InvitationCodeUpsertWithWhereUniqueWithoutTicketInputSchema).array() ]).optional(),
  createMany: z.lazy(() => InvitationCodeCreateManyTicketInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => InvitationCodeWhereUniqueInputSchema), z.lazy(() => InvitationCodeWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => InvitationCodeWhereUniqueInputSchema), z.lazy(() => InvitationCodeWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => InvitationCodeWhereUniqueInputSchema), z.lazy(() => InvitationCodeWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => InvitationCodeWhereUniqueInputSchema), z.lazy(() => InvitationCodeWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => InvitationCodeUpdateWithWhereUniqueWithoutTicketInputSchema), z.lazy(() => InvitationCodeUpdateWithWhereUniqueWithoutTicketInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => InvitationCodeUpdateManyWithWhereWithoutTicketInputSchema), z.lazy(() => InvitationCodeUpdateManyWithWhereWithoutTicketInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => InvitationCodeScalarWhereInputSchema), z.lazy(() => InvitationCodeScalarWhereInputSchema).array() ]).optional(),
});

export const RegistrationUncheckedUpdateManyWithoutTicketNestedInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateManyWithoutTicketNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutTicketInputSchema), z.lazy(() => RegistrationCreateWithoutTicketInputSchema).array(), z.lazy(() => RegistrationUncheckedCreateWithoutTicketInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutTicketInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RegistrationCreateOrConnectWithoutTicketInputSchema), z.lazy(() => RegistrationCreateOrConnectWithoutTicketInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => RegistrationUpsertWithWhereUniqueWithoutTicketInputSchema), z.lazy(() => RegistrationUpsertWithWhereUniqueWithoutTicketInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RegistrationCreateManyTicketInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => RegistrationUpdateWithWhereUniqueWithoutTicketInputSchema), z.lazy(() => RegistrationUpdateWithWhereUniqueWithoutTicketInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => RegistrationUpdateManyWithWhereWithoutTicketInputSchema), z.lazy(() => RegistrationUpdateManyWithWhereWithoutTicketInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => RegistrationScalarWhereInputSchema), z.lazy(() => RegistrationScalarWhereInputSchema).array() ]).optional(),
});

export const InvitationCodeUncheckedUpdateManyWithoutTicketNestedInputSchema: z.ZodType<Prisma.InvitationCodeUncheckedUpdateManyWithoutTicketNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => InvitationCodeCreateWithoutTicketInputSchema), z.lazy(() => InvitationCodeCreateWithoutTicketInputSchema).array(), z.lazy(() => InvitationCodeUncheckedCreateWithoutTicketInputSchema), z.lazy(() => InvitationCodeUncheckedCreateWithoutTicketInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => InvitationCodeCreateOrConnectWithoutTicketInputSchema), z.lazy(() => InvitationCodeCreateOrConnectWithoutTicketInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => InvitationCodeUpsertWithWhereUniqueWithoutTicketInputSchema), z.lazy(() => InvitationCodeUpsertWithWhereUniqueWithoutTicketInputSchema).array() ]).optional(),
  createMany: z.lazy(() => InvitationCodeCreateManyTicketInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => InvitationCodeWhereUniqueInputSchema), z.lazy(() => InvitationCodeWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => InvitationCodeWhereUniqueInputSchema), z.lazy(() => InvitationCodeWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => InvitationCodeWhereUniqueInputSchema), z.lazy(() => InvitationCodeWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => InvitationCodeWhereUniqueInputSchema), z.lazy(() => InvitationCodeWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => InvitationCodeUpdateWithWhereUniqueWithoutTicketInputSchema), z.lazy(() => InvitationCodeUpdateWithWhereUniqueWithoutTicketInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => InvitationCodeUpdateManyWithWhereWithoutTicketInputSchema), z.lazy(() => InvitationCodeUpdateManyWithWhereWithoutTicketInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => InvitationCodeScalarWhereInputSchema), z.lazy(() => InvitationCodeScalarWhereInputSchema).array() ]).optional(),
});

export const EventCreateNestedOneWithoutFormFieldsInputSchema: z.ZodType<Prisma.EventCreateNestedOneWithoutFormFieldsInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutFormFieldsInputSchema), z.lazy(() => EventUncheckedCreateWithoutFormFieldsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutFormFieldsInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
});

export const EventUpdateOneRequiredWithoutFormFieldsNestedInputSchema: z.ZodType<Prisma.EventUpdateOneRequiredWithoutFormFieldsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutFormFieldsInputSchema), z.lazy(() => EventUncheckedCreateWithoutFormFieldsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutFormFieldsInputSchema).optional(),
  upsert: z.lazy(() => EventUpsertWithoutFormFieldsInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => EventUpdateToOneWithWhereWithoutFormFieldsInputSchema), z.lazy(() => EventUpdateWithoutFormFieldsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutFormFieldsInputSchema) ]).optional(),
});

export const UserCreateNestedOneWithoutRegistrationsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutRegistrationsInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutRegistrationsInputSchema), z.lazy(() => UserUncheckedCreateWithoutRegistrationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutRegistrationsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const EventCreateNestedOneWithoutRegistrationsInputSchema: z.ZodType<Prisma.EventCreateNestedOneWithoutRegistrationsInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutRegistrationsInputSchema), z.lazy(() => EventUncheckedCreateWithoutRegistrationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutRegistrationsInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
});

export const TicketCreateNestedOneWithoutRegistrationsInputSchema: z.ZodType<Prisma.TicketCreateNestedOneWithoutRegistrationsInput> = z.strictObject({
  create: z.union([ z.lazy(() => TicketCreateWithoutRegistrationsInputSchema), z.lazy(() => TicketUncheckedCreateWithoutRegistrationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TicketCreateOrConnectWithoutRegistrationsInputSchema).optional(),
  connect: z.lazy(() => TicketWhereUniqueInputSchema).optional(),
});

export const RegistrationCreateNestedManyWithoutReferrerInputSchema: z.ZodType<Prisma.RegistrationCreateNestedManyWithoutReferrerInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutReferrerInputSchema), z.lazy(() => RegistrationCreateWithoutReferrerInputSchema).array(), z.lazy(() => RegistrationUncheckedCreateWithoutReferrerInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutReferrerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RegistrationCreateOrConnectWithoutReferrerInputSchema), z.lazy(() => RegistrationCreateOrConnectWithoutReferrerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RegistrationCreateManyReferrerInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
});

export const RegistrationCreateNestedOneWithoutReferralsInputSchema: z.ZodType<Prisma.RegistrationCreateNestedOneWithoutReferralsInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutReferralsInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutReferralsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => RegistrationCreateOrConnectWithoutReferralsInputSchema).optional(),
  connect: z.lazy(() => RegistrationWhereUniqueInputSchema).optional(),
});

export const ReferralCreateNestedOneWithoutRegistrationInputSchema: z.ZodType<Prisma.ReferralCreateNestedOneWithoutRegistrationInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralCreateWithoutRegistrationInputSchema), z.lazy(() => ReferralUncheckedCreateWithoutRegistrationInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ReferralCreateOrConnectWithoutRegistrationInputSchema).optional(),
  connect: z.lazy(() => ReferralWhereUniqueInputSchema).optional(),
});

export const ReferralUsageCreateNestedManyWithoutRegistrationInputSchema: z.ZodType<Prisma.ReferralUsageCreateNestedManyWithoutRegistrationInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralUsageCreateWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageCreateWithoutRegistrationInputSchema).array(), z.lazy(() => ReferralUsageUncheckedCreateWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageUncheckedCreateWithoutRegistrationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReferralUsageCreateOrConnectWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageCreateOrConnectWithoutRegistrationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReferralUsageCreateManyRegistrationInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
});

export const RegistrationUncheckedCreateNestedManyWithoutReferrerInputSchema: z.ZodType<Prisma.RegistrationUncheckedCreateNestedManyWithoutReferrerInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutReferrerInputSchema), z.lazy(() => RegistrationCreateWithoutReferrerInputSchema).array(), z.lazy(() => RegistrationUncheckedCreateWithoutReferrerInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutReferrerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RegistrationCreateOrConnectWithoutReferrerInputSchema), z.lazy(() => RegistrationCreateOrConnectWithoutReferrerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RegistrationCreateManyReferrerInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
});

export const ReferralUncheckedCreateNestedOneWithoutRegistrationInputSchema: z.ZodType<Prisma.ReferralUncheckedCreateNestedOneWithoutRegistrationInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralCreateWithoutRegistrationInputSchema), z.lazy(() => ReferralUncheckedCreateWithoutRegistrationInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ReferralCreateOrConnectWithoutRegistrationInputSchema).optional(),
  connect: z.lazy(() => ReferralWhereUniqueInputSchema).optional(),
});

export const ReferralUsageUncheckedCreateNestedManyWithoutRegistrationInputSchema: z.ZodType<Prisma.ReferralUsageUncheckedCreateNestedManyWithoutRegistrationInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralUsageCreateWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageCreateWithoutRegistrationInputSchema).array(), z.lazy(() => ReferralUsageUncheckedCreateWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageUncheckedCreateWithoutRegistrationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReferralUsageCreateOrConnectWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageCreateOrConnectWithoutRegistrationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReferralUsageCreateManyRegistrationInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
});

export const UserUpdateOneRequiredWithoutRegistrationsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutRegistrationsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutRegistrationsInputSchema), z.lazy(() => UserUncheckedCreateWithoutRegistrationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutRegistrationsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutRegistrationsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutRegistrationsInputSchema), z.lazy(() => UserUpdateWithoutRegistrationsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutRegistrationsInputSchema) ]).optional(),
});

export const EventUpdateOneRequiredWithoutRegistrationsNestedInputSchema: z.ZodType<Prisma.EventUpdateOneRequiredWithoutRegistrationsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutRegistrationsInputSchema), z.lazy(() => EventUncheckedCreateWithoutRegistrationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutRegistrationsInputSchema).optional(),
  upsert: z.lazy(() => EventUpsertWithoutRegistrationsInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => EventUpdateToOneWithWhereWithoutRegistrationsInputSchema), z.lazy(() => EventUpdateWithoutRegistrationsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutRegistrationsInputSchema) ]).optional(),
});

export const TicketUpdateOneRequiredWithoutRegistrationsNestedInputSchema: z.ZodType<Prisma.TicketUpdateOneRequiredWithoutRegistrationsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TicketCreateWithoutRegistrationsInputSchema), z.lazy(() => TicketUncheckedCreateWithoutRegistrationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TicketCreateOrConnectWithoutRegistrationsInputSchema).optional(),
  upsert: z.lazy(() => TicketUpsertWithoutRegistrationsInputSchema).optional(),
  connect: z.lazy(() => TicketWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => TicketUpdateToOneWithWhereWithoutRegistrationsInputSchema), z.lazy(() => TicketUpdateWithoutRegistrationsInputSchema), z.lazy(() => TicketUncheckedUpdateWithoutRegistrationsInputSchema) ]).optional(),
});

export const RegistrationUpdateManyWithoutReferrerNestedInputSchema: z.ZodType<Prisma.RegistrationUpdateManyWithoutReferrerNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutReferrerInputSchema), z.lazy(() => RegistrationCreateWithoutReferrerInputSchema).array(), z.lazy(() => RegistrationUncheckedCreateWithoutReferrerInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutReferrerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RegistrationCreateOrConnectWithoutReferrerInputSchema), z.lazy(() => RegistrationCreateOrConnectWithoutReferrerInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => RegistrationUpsertWithWhereUniqueWithoutReferrerInputSchema), z.lazy(() => RegistrationUpsertWithWhereUniqueWithoutReferrerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RegistrationCreateManyReferrerInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => RegistrationUpdateWithWhereUniqueWithoutReferrerInputSchema), z.lazy(() => RegistrationUpdateWithWhereUniqueWithoutReferrerInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => RegistrationUpdateManyWithWhereWithoutReferrerInputSchema), z.lazy(() => RegistrationUpdateManyWithWhereWithoutReferrerInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => RegistrationScalarWhereInputSchema), z.lazy(() => RegistrationScalarWhereInputSchema).array() ]).optional(),
});

export const RegistrationUpdateOneWithoutReferralsNestedInputSchema: z.ZodType<Prisma.RegistrationUpdateOneWithoutReferralsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutReferralsInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutReferralsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => RegistrationCreateOrConnectWithoutReferralsInputSchema).optional(),
  upsert: z.lazy(() => RegistrationUpsertWithoutReferralsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => RegistrationWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => RegistrationWhereInputSchema) ]).optional(),
  connect: z.lazy(() => RegistrationWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => RegistrationUpdateToOneWithWhereWithoutReferralsInputSchema), z.lazy(() => RegistrationUpdateWithoutReferralsInputSchema), z.lazy(() => RegistrationUncheckedUpdateWithoutReferralsInputSchema) ]).optional(),
});

export const ReferralUpdateOneWithoutRegistrationNestedInputSchema: z.ZodType<Prisma.ReferralUpdateOneWithoutRegistrationNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralCreateWithoutRegistrationInputSchema), z.lazy(() => ReferralUncheckedCreateWithoutRegistrationInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ReferralCreateOrConnectWithoutRegistrationInputSchema).optional(),
  upsert: z.lazy(() => ReferralUpsertWithoutRegistrationInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => ReferralWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => ReferralWhereInputSchema) ]).optional(),
  connect: z.lazy(() => ReferralWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => ReferralUpdateToOneWithWhereWithoutRegistrationInputSchema), z.lazy(() => ReferralUpdateWithoutRegistrationInputSchema), z.lazy(() => ReferralUncheckedUpdateWithoutRegistrationInputSchema) ]).optional(),
});

export const ReferralUsageUpdateManyWithoutRegistrationNestedInputSchema: z.ZodType<Prisma.ReferralUsageUpdateManyWithoutRegistrationNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralUsageCreateWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageCreateWithoutRegistrationInputSchema).array(), z.lazy(() => ReferralUsageUncheckedCreateWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageUncheckedCreateWithoutRegistrationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReferralUsageCreateOrConnectWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageCreateOrConnectWithoutRegistrationInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ReferralUsageUpsertWithWhereUniqueWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageUpsertWithWhereUniqueWithoutRegistrationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReferralUsageCreateManyRegistrationInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ReferralUsageUpdateWithWhereUniqueWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageUpdateWithWhereUniqueWithoutRegistrationInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ReferralUsageUpdateManyWithWhereWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageUpdateManyWithWhereWithoutRegistrationInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ReferralUsageScalarWhereInputSchema), z.lazy(() => ReferralUsageScalarWhereInputSchema).array() ]).optional(),
});

export const RegistrationUncheckedUpdateManyWithoutReferrerNestedInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateManyWithoutReferrerNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutReferrerInputSchema), z.lazy(() => RegistrationCreateWithoutReferrerInputSchema).array(), z.lazy(() => RegistrationUncheckedCreateWithoutReferrerInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutReferrerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RegistrationCreateOrConnectWithoutReferrerInputSchema), z.lazy(() => RegistrationCreateOrConnectWithoutReferrerInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => RegistrationUpsertWithWhereUniqueWithoutReferrerInputSchema), z.lazy(() => RegistrationUpsertWithWhereUniqueWithoutReferrerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RegistrationCreateManyReferrerInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema), z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => RegistrationUpdateWithWhereUniqueWithoutReferrerInputSchema), z.lazy(() => RegistrationUpdateWithWhereUniqueWithoutReferrerInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => RegistrationUpdateManyWithWhereWithoutReferrerInputSchema), z.lazy(() => RegistrationUpdateManyWithWhereWithoutReferrerInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => RegistrationScalarWhereInputSchema), z.lazy(() => RegistrationScalarWhereInputSchema).array() ]).optional(),
});

export const ReferralUncheckedUpdateOneWithoutRegistrationNestedInputSchema: z.ZodType<Prisma.ReferralUncheckedUpdateOneWithoutRegistrationNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralCreateWithoutRegistrationInputSchema), z.lazy(() => ReferralUncheckedCreateWithoutRegistrationInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ReferralCreateOrConnectWithoutRegistrationInputSchema).optional(),
  upsert: z.lazy(() => ReferralUpsertWithoutRegistrationInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => ReferralWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => ReferralWhereInputSchema) ]).optional(),
  connect: z.lazy(() => ReferralWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => ReferralUpdateToOneWithWhereWithoutRegistrationInputSchema), z.lazy(() => ReferralUpdateWithoutRegistrationInputSchema), z.lazy(() => ReferralUncheckedUpdateWithoutRegistrationInputSchema) ]).optional(),
});

export const ReferralUsageUncheckedUpdateManyWithoutRegistrationNestedInputSchema: z.ZodType<Prisma.ReferralUsageUncheckedUpdateManyWithoutRegistrationNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralUsageCreateWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageCreateWithoutRegistrationInputSchema).array(), z.lazy(() => ReferralUsageUncheckedCreateWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageUncheckedCreateWithoutRegistrationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReferralUsageCreateOrConnectWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageCreateOrConnectWithoutRegistrationInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ReferralUsageUpsertWithWhereUniqueWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageUpsertWithWhereUniqueWithoutRegistrationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReferralUsageCreateManyRegistrationInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ReferralUsageUpdateWithWhereUniqueWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageUpdateWithWhereUniqueWithoutRegistrationInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ReferralUsageUpdateManyWithWhereWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageUpdateManyWithWhereWithoutRegistrationInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ReferralUsageScalarWhereInputSchema), z.lazy(() => ReferralUsageScalarWhereInputSchema).array() ]).optional(),
});

export const RegistrationCreateNestedOneWithoutReferralInputSchema: z.ZodType<Prisma.RegistrationCreateNestedOneWithoutReferralInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutReferralInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutReferralInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => RegistrationCreateOrConnectWithoutReferralInputSchema).optional(),
  connect: z.lazy(() => RegistrationWhereUniqueInputSchema).optional(),
});

export const EventCreateNestedOneWithoutReferralsInputSchema: z.ZodType<Prisma.EventCreateNestedOneWithoutReferralsInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutReferralsInputSchema), z.lazy(() => EventUncheckedCreateWithoutReferralsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutReferralsInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
});

export const ReferralUsageCreateNestedManyWithoutReferralInputSchema: z.ZodType<Prisma.ReferralUsageCreateNestedManyWithoutReferralInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralUsageCreateWithoutReferralInputSchema), z.lazy(() => ReferralUsageCreateWithoutReferralInputSchema).array(), z.lazy(() => ReferralUsageUncheckedCreateWithoutReferralInputSchema), z.lazy(() => ReferralUsageUncheckedCreateWithoutReferralInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReferralUsageCreateOrConnectWithoutReferralInputSchema), z.lazy(() => ReferralUsageCreateOrConnectWithoutReferralInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReferralUsageCreateManyReferralInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
});

export const ReferralUsageUncheckedCreateNestedManyWithoutReferralInputSchema: z.ZodType<Prisma.ReferralUsageUncheckedCreateNestedManyWithoutReferralInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralUsageCreateWithoutReferralInputSchema), z.lazy(() => ReferralUsageCreateWithoutReferralInputSchema).array(), z.lazy(() => ReferralUsageUncheckedCreateWithoutReferralInputSchema), z.lazy(() => ReferralUsageUncheckedCreateWithoutReferralInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReferralUsageCreateOrConnectWithoutReferralInputSchema), z.lazy(() => ReferralUsageCreateOrConnectWithoutReferralInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReferralUsageCreateManyReferralInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
});

export const RegistrationUpdateOneRequiredWithoutReferralNestedInputSchema: z.ZodType<Prisma.RegistrationUpdateOneRequiredWithoutReferralNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutReferralInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutReferralInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => RegistrationCreateOrConnectWithoutReferralInputSchema).optional(),
  upsert: z.lazy(() => RegistrationUpsertWithoutReferralInputSchema).optional(),
  connect: z.lazy(() => RegistrationWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => RegistrationUpdateToOneWithWhereWithoutReferralInputSchema), z.lazy(() => RegistrationUpdateWithoutReferralInputSchema), z.lazy(() => RegistrationUncheckedUpdateWithoutReferralInputSchema) ]).optional(),
});

export const EventUpdateOneRequiredWithoutReferralsNestedInputSchema: z.ZodType<Prisma.EventUpdateOneRequiredWithoutReferralsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutReferralsInputSchema), z.lazy(() => EventUncheckedCreateWithoutReferralsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutReferralsInputSchema).optional(),
  upsert: z.lazy(() => EventUpsertWithoutReferralsInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => EventUpdateToOneWithWhereWithoutReferralsInputSchema), z.lazy(() => EventUpdateWithoutReferralsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutReferralsInputSchema) ]).optional(),
});

export const ReferralUsageUpdateManyWithoutReferralNestedInputSchema: z.ZodType<Prisma.ReferralUsageUpdateManyWithoutReferralNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralUsageCreateWithoutReferralInputSchema), z.lazy(() => ReferralUsageCreateWithoutReferralInputSchema).array(), z.lazy(() => ReferralUsageUncheckedCreateWithoutReferralInputSchema), z.lazy(() => ReferralUsageUncheckedCreateWithoutReferralInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReferralUsageCreateOrConnectWithoutReferralInputSchema), z.lazy(() => ReferralUsageCreateOrConnectWithoutReferralInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ReferralUsageUpsertWithWhereUniqueWithoutReferralInputSchema), z.lazy(() => ReferralUsageUpsertWithWhereUniqueWithoutReferralInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReferralUsageCreateManyReferralInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ReferralUsageUpdateWithWhereUniqueWithoutReferralInputSchema), z.lazy(() => ReferralUsageUpdateWithWhereUniqueWithoutReferralInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ReferralUsageUpdateManyWithWhereWithoutReferralInputSchema), z.lazy(() => ReferralUsageUpdateManyWithWhereWithoutReferralInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ReferralUsageScalarWhereInputSchema), z.lazy(() => ReferralUsageScalarWhereInputSchema).array() ]).optional(),
});

export const ReferralUsageUncheckedUpdateManyWithoutReferralNestedInputSchema: z.ZodType<Prisma.ReferralUsageUncheckedUpdateManyWithoutReferralNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralUsageCreateWithoutReferralInputSchema), z.lazy(() => ReferralUsageCreateWithoutReferralInputSchema).array(), z.lazy(() => ReferralUsageUncheckedCreateWithoutReferralInputSchema), z.lazy(() => ReferralUsageUncheckedCreateWithoutReferralInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReferralUsageCreateOrConnectWithoutReferralInputSchema), z.lazy(() => ReferralUsageCreateOrConnectWithoutReferralInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ReferralUsageUpsertWithWhereUniqueWithoutReferralInputSchema), z.lazy(() => ReferralUsageUpsertWithWhereUniqueWithoutReferralInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReferralUsageCreateManyReferralInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ReferralUsageWhereUniqueInputSchema), z.lazy(() => ReferralUsageWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ReferralUsageUpdateWithWhereUniqueWithoutReferralInputSchema), z.lazy(() => ReferralUsageUpdateWithWhereUniqueWithoutReferralInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ReferralUsageUpdateManyWithWhereWithoutReferralInputSchema), z.lazy(() => ReferralUsageUpdateManyWithWhereWithoutReferralInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ReferralUsageScalarWhereInputSchema), z.lazy(() => ReferralUsageScalarWhereInputSchema).array() ]).optional(),
});

export const ReferralCreateNestedOneWithoutReferredUsersInputSchema: z.ZodType<Prisma.ReferralCreateNestedOneWithoutReferredUsersInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralCreateWithoutReferredUsersInputSchema), z.lazy(() => ReferralUncheckedCreateWithoutReferredUsersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ReferralCreateOrConnectWithoutReferredUsersInputSchema).optional(),
  connect: z.lazy(() => ReferralWhereUniqueInputSchema).optional(),
});

export const RegistrationCreateNestedOneWithoutReferralUsageInputSchema: z.ZodType<Prisma.RegistrationCreateNestedOneWithoutReferralUsageInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutReferralUsageInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutReferralUsageInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => RegistrationCreateOrConnectWithoutReferralUsageInputSchema).optional(),
  connect: z.lazy(() => RegistrationWhereUniqueInputSchema).optional(),
});

export const EventCreateNestedOneWithoutReferralUsageInputSchema: z.ZodType<Prisma.EventCreateNestedOneWithoutReferralUsageInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutReferralUsageInputSchema), z.lazy(() => EventUncheckedCreateWithoutReferralUsageInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutReferralUsageInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
});

export const ReferralUpdateOneRequiredWithoutReferredUsersNestedInputSchema: z.ZodType<Prisma.ReferralUpdateOneRequiredWithoutReferredUsersNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReferralCreateWithoutReferredUsersInputSchema), z.lazy(() => ReferralUncheckedCreateWithoutReferredUsersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ReferralCreateOrConnectWithoutReferredUsersInputSchema).optional(),
  upsert: z.lazy(() => ReferralUpsertWithoutReferredUsersInputSchema).optional(),
  connect: z.lazy(() => ReferralWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => ReferralUpdateToOneWithWhereWithoutReferredUsersInputSchema), z.lazy(() => ReferralUpdateWithoutReferredUsersInputSchema), z.lazy(() => ReferralUncheckedUpdateWithoutReferredUsersInputSchema) ]).optional(),
});

export const RegistrationUpdateOneRequiredWithoutReferralUsageNestedInputSchema: z.ZodType<Prisma.RegistrationUpdateOneRequiredWithoutReferralUsageNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutReferralUsageInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutReferralUsageInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => RegistrationCreateOrConnectWithoutReferralUsageInputSchema).optional(),
  upsert: z.lazy(() => RegistrationUpsertWithoutReferralUsageInputSchema).optional(),
  connect: z.lazy(() => RegistrationWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => RegistrationUpdateToOneWithWhereWithoutReferralUsageInputSchema), z.lazy(() => RegistrationUpdateWithoutReferralUsageInputSchema), z.lazy(() => RegistrationUncheckedUpdateWithoutReferralUsageInputSchema) ]).optional(),
});

export const EventUpdateOneRequiredWithoutReferralUsageNestedInputSchema: z.ZodType<Prisma.EventUpdateOneRequiredWithoutReferralUsageNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => EventCreateWithoutReferralUsageInputSchema), z.lazy(() => EventUncheckedCreateWithoutReferralUsageInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EventCreateOrConnectWithoutReferralUsageInputSchema).optional(),
  upsert: z.lazy(() => EventUpsertWithoutReferralUsageInputSchema).optional(),
  connect: z.lazy(() => EventWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => EventUpdateToOneWithWhereWithoutReferralUsageInputSchema), z.lazy(() => EventUpdateWithoutReferralUsageInputSchema), z.lazy(() => EventUncheckedUpdateWithoutReferralUsageInputSchema) ]).optional(),
});

export const TicketCreateNestedOneWithoutInvitationCodesInputSchema: z.ZodType<Prisma.TicketCreateNestedOneWithoutInvitationCodesInput> = z.strictObject({
  create: z.union([ z.lazy(() => TicketCreateWithoutInvitationCodesInputSchema), z.lazy(() => TicketUncheckedCreateWithoutInvitationCodesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TicketCreateOrConnectWithoutInvitationCodesInputSchema).optional(),
  connect: z.lazy(() => TicketWhereUniqueInputSchema).optional(),
});

export const NullableIntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableIntFieldUpdateOperationsInput> = z.strictObject({
  set: z.number().optional().nullable(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional(),
});

export const TicketUpdateOneRequiredWithoutInvitationCodesNestedInputSchema: z.ZodType<Prisma.TicketUpdateOneRequiredWithoutInvitationCodesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TicketCreateWithoutInvitationCodesInputSchema), z.lazy(() => TicketUncheckedCreateWithoutInvitationCodesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TicketCreateOrConnectWithoutInvitationCodesInputSchema).optional(),
  upsert: z.lazy(() => TicketUpsertWithoutInvitationCodesInputSchema).optional(),
  connect: z.lazy(() => TicketWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => TicketUpdateToOneWithWhereWithoutInvitationCodesInputSchema), z.lazy(() => TicketUpdateWithoutInvitationCodesInputSchema), z.lazy(() => TicketUncheckedUpdateWithoutInvitationCodesInputSchema) ]).optional(),
});

export const UserCreateNestedOneWithoutEmailCampaignsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutEmailCampaignsInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutEmailCampaignsInputSchema), z.lazy(() => UserUncheckedCreateWithoutEmailCampaignsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutEmailCampaignsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const UserUpdateOneRequiredWithoutEmailCampaignsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutEmailCampaignsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutEmailCampaignsInputSchema), z.lazy(() => UserUncheckedCreateWithoutEmailCampaignsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutEmailCampaignsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutEmailCampaignsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutEmailCampaignsInputSchema), z.lazy(() => UserUpdateWithoutEmailCampaignsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutEmailCampaignsInputSchema) ]).optional(),
});

export const UserCreateNestedOneWithoutSmsVerificationsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutSmsVerificationsInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutSmsVerificationsInputSchema), z.lazy(() => UserUncheckedCreateWithoutSmsVerificationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutSmsVerificationsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const UserUpdateOneRequiredWithoutSmsVerificationsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutSmsVerificationsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutSmsVerificationsInputSchema), z.lazy(() => UserUncheckedCreateWithoutSmsVerificationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutSmsVerificationsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutSmsVerificationsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutSmsVerificationsInputSchema), z.lazy(() => UserUpdateWithoutSmsVerificationsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutSmsVerificationsInputSchema) ]).optional(),
});

export const NestedStringFilterSchema: z.ZodType<Prisma.NestedStringFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
});

export const NestedBoolFilterSchema: z.ZodType<Prisma.NestedBoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
});

export const NestedStringNullableFilterSchema: z.ZodType<Prisma.NestedStringNullableFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
});

export const NestedDateTimeFilterSchema: z.ZodType<Prisma.NestedDateTimeFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
});

export const NestedStringWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional(),
});

export const NestedIntFilterSchema: z.ZodType<Prisma.NestedIntFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
});

export const NestedBoolWithAggregatesFilterSchema: z.ZodType<Prisma.NestedBoolWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional(),
});

export const NestedStringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringNullableWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
});

export const NestedIntNullableFilterSchema: z.ZodType<Prisma.NestedIntNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
});

export const NestedDateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
});

export const NestedDateTimeNullableFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
});

export const NestedDateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
});

export const NestedJsonFilterSchema: z.ZodType<Prisma.NestedJsonFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
});

export const NestedJsonNullableFilterSchema: z.ZodType<Prisma.NestedJsonNullableFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
});

export const NestedIntWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional(),
});

export const NestedFloatFilterSchema: z.ZodType<Prisma.NestedFloatFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatFilterSchema) ]).optional(),
});

export const NestedIntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntNullableWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedIntNullableFilterSchema).optional(),
});

export const NestedFloatNullableFilterSchema: z.ZodType<Prisma.NestedFloatNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatNullableFilterSchema) ]).optional().nullable(),
});

export const SessionCreateWithoutUserInputSchema: z.ZodType<Prisma.SessionCreateWithoutUserInput> = z.strictObject({
  id: z.string(),
  expiresAt: z.coerce.date(),
  token: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
});

export const SessionUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.SessionUncheckedCreateWithoutUserInput> = z.strictObject({
  id: z.string(),
  expiresAt: z.coerce.date(),
  token: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
});

export const SessionCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.SessionCreateOrConnectWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SessionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SessionCreateWithoutUserInputSchema), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema) ]),
});

export const SessionCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.SessionCreateManyUserInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => SessionCreateManyUserInputSchema), z.lazy(() => SessionCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const AccountCreateWithoutUserInputSchema: z.ZodType<Prisma.AccountCreateWithoutUserInput> = z.strictObject({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
  idToken: z.string().optional().nullable(),
  accessTokenExpiresAt: z.coerce.date().optional().nullable(),
  refreshTokenExpiresAt: z.coerce.date().optional().nullable(),
  scope: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const AccountUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.AccountUncheckedCreateWithoutUserInput> = z.strictObject({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
  idToken: z.string().optional().nullable(),
  accessTokenExpiresAt: z.coerce.date().optional().nullable(),
  refreshTokenExpiresAt: z.coerce.date().optional().nullable(),
  scope: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const AccountCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.AccountCreateOrConnectWithoutUserInput> = z.strictObject({
  where: z.lazy(() => AccountWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => AccountCreateWithoutUserInputSchema), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema) ]),
});

export const AccountCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.AccountCreateManyUserInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => AccountCreateManyUserInputSchema), z.lazy(() => AccountCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const EmailCampaignCreateWithoutUserInputSchema: z.ZodType<Prisma.EmailCampaignCreateWithoutUserInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  subject: z.string(),
  content: z.string(),
  recipientFilter: z.string().optional().nullable(),
  status: z.string().optional(),
  sentCount: z.number().int().optional(),
  totalCount: z.number().int().optional(),
  scheduledAt: z.coerce.date().optional().nullable(),
  sentAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const EmailCampaignUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.EmailCampaignUncheckedCreateWithoutUserInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  subject: z.string(),
  content: z.string(),
  recipientFilter: z.string().optional().nullable(),
  status: z.string().optional(),
  sentCount: z.number().int().optional(),
  totalCount: z.number().int().optional(),
  scheduledAt: z.coerce.date().optional().nullable(),
  sentAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const EmailCampaignCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.EmailCampaignCreateOrConnectWithoutUserInput> = z.strictObject({
  where: z.lazy(() => EmailCampaignWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => EmailCampaignCreateWithoutUserInputSchema), z.lazy(() => EmailCampaignUncheckedCreateWithoutUserInputSchema) ]),
});

export const EmailCampaignCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.EmailCampaignCreateManyUserInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => EmailCampaignCreateManyUserInputSchema), z.lazy(() => EmailCampaignCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const RegistrationCreateWithoutUserInputSchema: z.ZodType<Prisma.RegistrationCreateWithoutUserInput> = z.strictObject({
  id: z.cuid().optional(),
  email: z.string(),
  formData: z.string().optional().nullable(),
  status: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  event: z.lazy(() => EventCreateNestedOneWithoutRegistrationsInputSchema),
  ticket: z.lazy(() => TicketCreateNestedOneWithoutRegistrationsInputSchema),
  referrals: z.lazy(() => RegistrationCreateNestedManyWithoutReferrerInputSchema).optional(),
  referrer: z.lazy(() => RegistrationCreateNestedOneWithoutReferralsInputSchema).optional(),
  referral: z.lazy(() => ReferralCreateNestedOneWithoutRegistrationInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageCreateNestedManyWithoutRegistrationInputSchema).optional(),
});

export const RegistrationUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.RegistrationUncheckedCreateWithoutUserInput> = z.strictObject({
  id: z.cuid().optional(),
  eventId: z.string(),
  ticketId: z.string(),
  email: z.string(),
  formData: z.string().optional().nullable(),
  status: z.string().optional(),
  referredBy: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  referrals: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutReferrerInputSchema).optional(),
  referral: z.lazy(() => ReferralUncheckedCreateNestedOneWithoutRegistrationInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedCreateNestedManyWithoutRegistrationInputSchema).optional(),
});

export const RegistrationCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.RegistrationCreateOrConnectWithoutUserInput> = z.strictObject({
  where: z.lazy(() => RegistrationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => RegistrationCreateWithoutUserInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutUserInputSchema) ]),
});

export const RegistrationCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.RegistrationCreateManyUserInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => RegistrationCreateManyUserInputSchema), z.lazy(() => RegistrationCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const SmsVerificationCreateWithoutUserInputSchema: z.ZodType<Prisma.SmsVerificationCreateWithoutUserInput> = z.strictObject({
  id: z.cuid().optional(),
  phoneNumber: z.string(),
  code: z.string(),
  verified: z.boolean().optional(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const SmsVerificationUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.SmsVerificationUncheckedCreateWithoutUserInput> = z.strictObject({
  id: z.cuid().optional(),
  phoneNumber: z.string(),
  code: z.string(),
  verified: z.boolean().optional(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const SmsVerificationCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.SmsVerificationCreateOrConnectWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SmsVerificationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SmsVerificationCreateWithoutUserInputSchema), z.lazy(() => SmsVerificationUncheckedCreateWithoutUserInputSchema) ]),
});

export const SmsVerificationCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.SmsVerificationCreateManyUserInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => SmsVerificationCreateManyUserInputSchema), z.lazy(() => SmsVerificationCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const SessionUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.SessionUpsertWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SessionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => SessionUpdateWithoutUserInputSchema), z.lazy(() => SessionUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => SessionCreateWithoutUserInputSchema), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema) ]),
});

export const SessionUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.SessionUpdateWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SessionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => SessionUpdateWithoutUserInputSchema), z.lazy(() => SessionUncheckedUpdateWithoutUserInputSchema) ]),
});

export const SessionUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.SessionUpdateManyWithWhereWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SessionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => SessionUpdateManyMutationInputSchema), z.lazy(() => SessionUncheckedUpdateManyWithoutUserInputSchema) ]),
});

export const SessionScalarWhereInputSchema: z.ZodType<Prisma.SessionScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SessionScalarWhereInputSchema), z.lazy(() => SessionScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SessionScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SessionScalarWhereInputSchema), z.lazy(() => SessionScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  token: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  ipAddress: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  userAgent: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
});

export const AccountUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.AccountUpsertWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => AccountWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => AccountUpdateWithoutUserInputSchema), z.lazy(() => AccountUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => AccountCreateWithoutUserInputSchema), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema) ]),
});

export const AccountUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.AccountUpdateWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => AccountWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => AccountUpdateWithoutUserInputSchema), z.lazy(() => AccountUncheckedUpdateWithoutUserInputSchema) ]),
});

export const AccountUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.AccountUpdateManyWithWhereWithoutUserInput> = z.strictObject({
  where: z.lazy(() => AccountScalarWhereInputSchema),
  data: z.union([ z.lazy(() => AccountUpdateManyMutationInputSchema), z.lazy(() => AccountUncheckedUpdateManyWithoutUserInputSchema) ]),
});

export const AccountScalarWhereInputSchema: z.ZodType<Prisma.AccountScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AccountScalarWhereInputSchema), z.lazy(() => AccountScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AccountScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AccountScalarWhereInputSchema), z.lazy(() => AccountScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  accountId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  providerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  accessToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  refreshToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  idToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  scope: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  password: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const EmailCampaignUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.EmailCampaignUpsertWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => EmailCampaignWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => EmailCampaignUpdateWithoutUserInputSchema), z.lazy(() => EmailCampaignUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => EmailCampaignCreateWithoutUserInputSchema), z.lazy(() => EmailCampaignUncheckedCreateWithoutUserInputSchema) ]),
});

export const EmailCampaignUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.EmailCampaignUpdateWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => EmailCampaignWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => EmailCampaignUpdateWithoutUserInputSchema), z.lazy(() => EmailCampaignUncheckedUpdateWithoutUserInputSchema) ]),
});

export const EmailCampaignUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.EmailCampaignUpdateManyWithWhereWithoutUserInput> = z.strictObject({
  where: z.lazy(() => EmailCampaignScalarWhereInputSchema),
  data: z.union([ z.lazy(() => EmailCampaignUpdateManyMutationInputSchema), z.lazy(() => EmailCampaignUncheckedUpdateManyWithoutUserInputSchema) ]),
});

export const EmailCampaignScalarWhereInputSchema: z.ZodType<Prisma.EmailCampaignScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => EmailCampaignScalarWhereInputSchema), z.lazy(() => EmailCampaignScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => EmailCampaignScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EmailCampaignScalarWhereInputSchema), z.lazy(() => EmailCampaignScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  subject: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  content: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  recipientFilter: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sentCount: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  totalCount: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  scheduledAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  sentAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const RegistrationUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.RegistrationUpsertWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => RegistrationWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => RegistrationUpdateWithoutUserInputSchema), z.lazy(() => RegistrationUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => RegistrationCreateWithoutUserInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutUserInputSchema) ]),
});

export const RegistrationUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.RegistrationUpdateWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => RegistrationWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => RegistrationUpdateWithoutUserInputSchema), z.lazy(() => RegistrationUncheckedUpdateWithoutUserInputSchema) ]),
});

export const RegistrationUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.RegistrationUpdateManyWithWhereWithoutUserInput> = z.strictObject({
  where: z.lazy(() => RegistrationScalarWhereInputSchema),
  data: z.union([ z.lazy(() => RegistrationUpdateManyMutationInputSchema), z.lazy(() => RegistrationUncheckedUpdateManyWithoutUserInputSchema) ]),
});

export const RegistrationScalarWhereInputSchema: z.ZodType<Prisma.RegistrationScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => RegistrationScalarWhereInputSchema), z.lazy(() => RegistrationScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => RegistrationScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RegistrationScalarWhereInputSchema), z.lazy(() => RegistrationScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  ticketId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  formData: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  referredBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const SmsVerificationUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.SmsVerificationUpsertWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SmsVerificationWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => SmsVerificationUpdateWithoutUserInputSchema), z.lazy(() => SmsVerificationUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => SmsVerificationCreateWithoutUserInputSchema), z.lazy(() => SmsVerificationUncheckedCreateWithoutUserInputSchema) ]),
});

export const SmsVerificationUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.SmsVerificationUpdateWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SmsVerificationWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => SmsVerificationUpdateWithoutUserInputSchema), z.lazy(() => SmsVerificationUncheckedUpdateWithoutUserInputSchema) ]),
});

export const SmsVerificationUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.SmsVerificationUpdateManyWithWhereWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SmsVerificationScalarWhereInputSchema),
  data: z.union([ z.lazy(() => SmsVerificationUpdateManyMutationInputSchema), z.lazy(() => SmsVerificationUncheckedUpdateManyWithoutUserInputSchema) ]),
});

export const SmsVerificationScalarWhereInputSchema: z.ZodType<Prisma.SmsVerificationScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SmsVerificationScalarWhereInputSchema), z.lazy(() => SmsVerificationScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SmsVerificationScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SmsVerificationScalarWhereInputSchema), z.lazy(() => SmsVerificationScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  phoneNumber: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  code: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  verified: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const UserCreateWithoutSessionsInputSchema: z.ZodType<Prisma.UserCreateWithoutSessionsInput> = z.strictObject({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().optional().nullable(),
  role: z.string().optional(),
  permissions: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  phoneNumber: z.string().optional().nullable(),
  phoneVerified: z.boolean().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  accounts: z.lazy(() => AccountCreateNestedManyWithoutUserInputSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignCreateNestedManyWithoutUserInputSchema).optional(),
  registrations: z.lazy(() => RegistrationCreateNestedManyWithoutUserInputSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateWithoutSessionsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutSessionsInput> = z.strictObject({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().optional().nullable(),
  role: z.string().optional(),
  permissions: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  phoneNumber: z.string().optional().nullable(),
  phoneVerified: z.boolean().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  accounts: z.lazy(() => AccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserCreateOrConnectWithoutSessionsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutSessionsInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedCreateWithoutSessionsInputSchema) ]),
});

export const UserUpsertWithoutSessionsInputSchema: z.ZodType<Prisma.UserUpsertWithoutSessionsInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutSessionsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedCreateWithoutSessionsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutSessionsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutSessionsInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutSessionsInputSchema) ]),
});

export const UserUpdateWithoutSessionsInputSchema: z.ZodType<Prisma.UserUpdateWithoutSessionsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  permissions: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  phoneVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  accounts: z.lazy(() => AccountUpdateManyWithoutUserNestedInputSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignUpdateManyWithoutUserNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUpdateManyWithoutUserNestedInputSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutSessionsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutSessionsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  permissions: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  phoneVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  accounts: z.lazy(() => AccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserCreateWithoutAccountsInputSchema: z.ZodType<Prisma.UserCreateWithoutAccountsInput> = z.strictObject({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().optional().nullable(),
  role: z.string().optional(),
  permissions: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  phoneNumber: z.string().optional().nullable(),
  phoneVerified: z.boolean().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  sessions: z.lazy(() => SessionCreateNestedManyWithoutUserInputSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignCreateNestedManyWithoutUserInputSchema).optional(),
  registrations: z.lazy(() => RegistrationCreateNestedManyWithoutUserInputSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateWithoutAccountsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutAccountsInput> = z.strictObject({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().optional().nullable(),
  role: z.string().optional(),
  permissions: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  phoneNumber: z.string().optional().nullable(),
  phoneVerified: z.boolean().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  sessions: z.lazy(() => SessionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserCreateOrConnectWithoutAccountsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutAccountsInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutAccountsInputSchema), z.lazy(() => UserUncheckedCreateWithoutAccountsInputSchema) ]),
});

export const UserUpsertWithoutAccountsInputSchema: z.ZodType<Prisma.UserUpsertWithoutAccountsInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutAccountsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutAccountsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutAccountsInputSchema), z.lazy(() => UserUncheckedCreateWithoutAccountsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutAccountsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutAccountsInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutAccountsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutAccountsInputSchema) ]),
});

export const UserUpdateWithoutAccountsInputSchema: z.ZodType<Prisma.UserUpdateWithoutAccountsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  permissions: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  phoneVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUpdateManyWithoutUserNestedInputSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignUpdateManyWithoutUserNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUpdateManyWithoutUserNestedInputSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutAccountsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutAccountsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  permissions: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  phoneVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const TicketCreateWithoutEventInputSchema: z.ZodType<Prisma.TicketCreateWithoutEventInput> = z.strictObject({
  id: z.cuid().optional(),
  order: z.number().int().optional(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  price: z.number().int(),
  quantity: z.number().int(),
  soldCount: z.number().int().optional(),
  saleStart: z.coerce.date().optional().nullable(),
  saleEnd: z.coerce.date().optional().nullable(),
  requireInviteCode: z.boolean().optional(),
  requireSmsVerification: z.boolean().optional(),
  hidden: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  registrations: z.lazy(() => RegistrationCreateNestedManyWithoutTicketInputSchema).optional(),
  invitationCodes: z.lazy(() => InvitationCodeCreateNestedManyWithoutTicketInputSchema).optional(),
});

export const TicketUncheckedCreateWithoutEventInputSchema: z.ZodType<Prisma.TicketUncheckedCreateWithoutEventInput> = z.strictObject({
  id: z.cuid().optional(),
  order: z.number().int().optional(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  price: z.number().int(),
  quantity: z.number().int(),
  soldCount: z.number().int().optional(),
  saleStart: z.coerce.date().optional().nullable(),
  saleEnd: z.coerce.date().optional().nullable(),
  requireInviteCode: z.boolean().optional(),
  requireSmsVerification: z.boolean().optional(),
  hidden: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  registrations: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutTicketInputSchema).optional(),
  invitationCodes: z.lazy(() => InvitationCodeUncheckedCreateNestedManyWithoutTicketInputSchema).optional(),
});

export const TicketCreateOrConnectWithoutEventInputSchema: z.ZodType<Prisma.TicketCreateOrConnectWithoutEventInput> = z.strictObject({
  where: z.lazy(() => TicketWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TicketCreateWithoutEventInputSchema), z.lazy(() => TicketUncheckedCreateWithoutEventInputSchema) ]),
});

export const TicketCreateManyEventInputEnvelopeSchema: z.ZodType<Prisma.TicketCreateManyEventInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => TicketCreateManyEventInputSchema), z.lazy(() => TicketCreateManyEventInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const RegistrationCreateWithoutEventInputSchema: z.ZodType<Prisma.RegistrationCreateWithoutEventInput> = z.strictObject({
  id: z.cuid().optional(),
  email: z.string(),
  formData: z.string().optional().nullable(),
  status: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutRegistrationsInputSchema),
  ticket: z.lazy(() => TicketCreateNestedOneWithoutRegistrationsInputSchema),
  referrals: z.lazy(() => RegistrationCreateNestedManyWithoutReferrerInputSchema).optional(),
  referrer: z.lazy(() => RegistrationCreateNestedOneWithoutReferralsInputSchema).optional(),
  referral: z.lazy(() => ReferralCreateNestedOneWithoutRegistrationInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageCreateNestedManyWithoutRegistrationInputSchema).optional(),
});

export const RegistrationUncheckedCreateWithoutEventInputSchema: z.ZodType<Prisma.RegistrationUncheckedCreateWithoutEventInput> = z.strictObject({
  id: z.cuid().optional(),
  userId: z.string(),
  ticketId: z.string(),
  email: z.string(),
  formData: z.string().optional().nullable(),
  status: z.string().optional(),
  referredBy: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  referrals: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutReferrerInputSchema).optional(),
  referral: z.lazy(() => ReferralUncheckedCreateNestedOneWithoutRegistrationInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedCreateNestedManyWithoutRegistrationInputSchema).optional(),
});

export const RegistrationCreateOrConnectWithoutEventInputSchema: z.ZodType<Prisma.RegistrationCreateOrConnectWithoutEventInput> = z.strictObject({
  where: z.lazy(() => RegistrationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => RegistrationCreateWithoutEventInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutEventInputSchema) ]),
});

export const RegistrationCreateManyEventInputEnvelopeSchema: z.ZodType<Prisma.RegistrationCreateManyEventInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => RegistrationCreateManyEventInputSchema), z.lazy(() => RegistrationCreateManyEventInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const ReferralCreateWithoutEventInputSchema: z.ZodType<Prisma.ReferralCreateWithoutEventInput> = z.strictObject({
  id: z.cuid().optional(),
  code: z.string(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  registration: z.lazy(() => RegistrationCreateNestedOneWithoutReferralInputSchema),
  referredUsers: z.lazy(() => ReferralUsageCreateNestedManyWithoutReferralInputSchema).optional(),
});

export const ReferralUncheckedCreateWithoutEventInputSchema: z.ZodType<Prisma.ReferralUncheckedCreateWithoutEventInput> = z.strictObject({
  id: z.cuid().optional(),
  code: z.string(),
  registrationId: z.string(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  referredUsers: z.lazy(() => ReferralUsageUncheckedCreateNestedManyWithoutReferralInputSchema).optional(),
});

export const ReferralCreateOrConnectWithoutEventInputSchema: z.ZodType<Prisma.ReferralCreateOrConnectWithoutEventInput> = z.strictObject({
  where: z.lazy(() => ReferralWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ReferralCreateWithoutEventInputSchema), z.lazy(() => ReferralUncheckedCreateWithoutEventInputSchema) ]),
});

export const ReferralCreateManyEventInputEnvelopeSchema: z.ZodType<Prisma.ReferralCreateManyEventInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => ReferralCreateManyEventInputSchema), z.lazy(() => ReferralCreateManyEventInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const ReferralUsageCreateWithoutEventInputSchema: z.ZodType<Prisma.ReferralUsageCreateWithoutEventInput> = z.strictObject({
  id: z.cuid().optional(),
  usedAt: z.coerce.date().optional(),
  referral: z.lazy(() => ReferralCreateNestedOneWithoutReferredUsersInputSchema),
  registration: z.lazy(() => RegistrationCreateNestedOneWithoutReferralUsageInputSchema),
});

export const ReferralUsageUncheckedCreateWithoutEventInputSchema: z.ZodType<Prisma.ReferralUsageUncheckedCreateWithoutEventInput> = z.strictObject({
  id: z.cuid().optional(),
  referralId: z.string(),
  registrationId: z.string(),
  usedAt: z.coerce.date().optional(),
});

export const ReferralUsageCreateOrConnectWithoutEventInputSchema: z.ZodType<Prisma.ReferralUsageCreateOrConnectWithoutEventInput> = z.strictObject({
  where: z.lazy(() => ReferralUsageWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ReferralUsageCreateWithoutEventInputSchema), z.lazy(() => ReferralUsageUncheckedCreateWithoutEventInputSchema) ]),
});

export const ReferralUsageCreateManyEventInputEnvelopeSchema: z.ZodType<Prisma.ReferralUsageCreateManyEventInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => ReferralUsageCreateManyEventInputSchema), z.lazy(() => ReferralUsageCreateManyEventInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const EventFormFieldsCreateWithoutEventInputSchema: z.ZodType<Prisma.EventFormFieldsCreateWithoutEventInput> = z.strictObject({
  id: z.cuid().optional(),
  order: z.number().int(),
  type: z.string(),
  validater: z.string().optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  placeholder: z.string().optional().nullable(),
  required: z.boolean().optional(),
  values: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  filters: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  prompts: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const EventFormFieldsUncheckedCreateWithoutEventInputSchema: z.ZodType<Prisma.EventFormFieldsUncheckedCreateWithoutEventInput> = z.strictObject({
  id: z.cuid().optional(),
  order: z.number().int(),
  type: z.string(),
  validater: z.string().optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  placeholder: z.string().optional().nullable(),
  required: z.boolean().optional(),
  values: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  filters: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  prompts: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const EventFormFieldsCreateOrConnectWithoutEventInputSchema: z.ZodType<Prisma.EventFormFieldsCreateOrConnectWithoutEventInput> = z.strictObject({
  where: z.lazy(() => EventFormFieldsWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => EventFormFieldsCreateWithoutEventInputSchema), z.lazy(() => EventFormFieldsUncheckedCreateWithoutEventInputSchema) ]),
});

export const EventFormFieldsCreateManyEventInputEnvelopeSchema: z.ZodType<Prisma.EventFormFieldsCreateManyEventInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => EventFormFieldsCreateManyEventInputSchema), z.lazy(() => EventFormFieldsCreateManyEventInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const TicketUpsertWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.TicketUpsertWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => TicketWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TicketUpdateWithoutEventInputSchema), z.lazy(() => TicketUncheckedUpdateWithoutEventInputSchema) ]),
  create: z.union([ z.lazy(() => TicketCreateWithoutEventInputSchema), z.lazy(() => TicketUncheckedCreateWithoutEventInputSchema) ]),
});

export const TicketUpdateWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.TicketUpdateWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => TicketWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TicketUpdateWithoutEventInputSchema), z.lazy(() => TicketUncheckedUpdateWithoutEventInputSchema) ]),
});

export const TicketUpdateManyWithWhereWithoutEventInputSchema: z.ZodType<Prisma.TicketUpdateManyWithWhereWithoutEventInput> = z.strictObject({
  where: z.lazy(() => TicketScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TicketUpdateManyMutationInputSchema), z.lazy(() => TicketUncheckedUpdateManyWithoutEventInputSchema) ]),
});

export const TicketScalarWhereInputSchema: z.ZodType<Prisma.TicketScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TicketScalarWhereInputSchema), z.lazy(() => TicketScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TicketScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TicketScalarWhereInputSchema), z.lazy(() => TicketScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  name: z.lazy(() => JsonFilterSchema).optional(),
  description: z.lazy(() => JsonNullableFilterSchema).optional(),
  plainDescription: z.lazy(() => JsonNullableFilterSchema).optional(),
  price: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  quantity: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  soldCount: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  saleStart: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  saleEnd: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  requireInviteCode: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  requireSmsVerification: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  hidden: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const RegistrationUpsertWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.RegistrationUpsertWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => RegistrationWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => RegistrationUpdateWithoutEventInputSchema), z.lazy(() => RegistrationUncheckedUpdateWithoutEventInputSchema) ]),
  create: z.union([ z.lazy(() => RegistrationCreateWithoutEventInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutEventInputSchema) ]),
});

export const RegistrationUpdateWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.RegistrationUpdateWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => RegistrationWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => RegistrationUpdateWithoutEventInputSchema), z.lazy(() => RegistrationUncheckedUpdateWithoutEventInputSchema) ]),
});

export const RegistrationUpdateManyWithWhereWithoutEventInputSchema: z.ZodType<Prisma.RegistrationUpdateManyWithWhereWithoutEventInput> = z.strictObject({
  where: z.lazy(() => RegistrationScalarWhereInputSchema),
  data: z.union([ z.lazy(() => RegistrationUpdateManyMutationInputSchema), z.lazy(() => RegistrationUncheckedUpdateManyWithoutEventInputSchema) ]),
});

export const ReferralUpsertWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.ReferralUpsertWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => ReferralWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => ReferralUpdateWithoutEventInputSchema), z.lazy(() => ReferralUncheckedUpdateWithoutEventInputSchema) ]),
  create: z.union([ z.lazy(() => ReferralCreateWithoutEventInputSchema), z.lazy(() => ReferralUncheckedCreateWithoutEventInputSchema) ]),
});

export const ReferralUpdateWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.ReferralUpdateWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => ReferralWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => ReferralUpdateWithoutEventInputSchema), z.lazy(() => ReferralUncheckedUpdateWithoutEventInputSchema) ]),
});

export const ReferralUpdateManyWithWhereWithoutEventInputSchema: z.ZodType<Prisma.ReferralUpdateManyWithWhereWithoutEventInput> = z.strictObject({
  where: z.lazy(() => ReferralScalarWhereInputSchema),
  data: z.union([ z.lazy(() => ReferralUpdateManyMutationInputSchema), z.lazy(() => ReferralUncheckedUpdateManyWithoutEventInputSchema) ]),
});

export const ReferralScalarWhereInputSchema: z.ZodType<Prisma.ReferralScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ReferralScalarWhereInputSchema), z.lazy(() => ReferralScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ReferralScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ReferralScalarWhereInputSchema), z.lazy(() => ReferralScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  code: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  registrationId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const ReferralUsageUpsertWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.ReferralUsageUpsertWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => ReferralUsageWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => ReferralUsageUpdateWithoutEventInputSchema), z.lazy(() => ReferralUsageUncheckedUpdateWithoutEventInputSchema) ]),
  create: z.union([ z.lazy(() => ReferralUsageCreateWithoutEventInputSchema), z.lazy(() => ReferralUsageUncheckedCreateWithoutEventInputSchema) ]),
});

export const ReferralUsageUpdateWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.ReferralUsageUpdateWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => ReferralUsageWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => ReferralUsageUpdateWithoutEventInputSchema), z.lazy(() => ReferralUsageUncheckedUpdateWithoutEventInputSchema) ]),
});

export const ReferralUsageUpdateManyWithWhereWithoutEventInputSchema: z.ZodType<Prisma.ReferralUsageUpdateManyWithWhereWithoutEventInput> = z.strictObject({
  where: z.lazy(() => ReferralUsageScalarWhereInputSchema),
  data: z.union([ z.lazy(() => ReferralUsageUpdateManyMutationInputSchema), z.lazy(() => ReferralUsageUncheckedUpdateManyWithoutEventInputSchema) ]),
});

export const ReferralUsageScalarWhereInputSchema: z.ZodType<Prisma.ReferralUsageScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ReferralUsageScalarWhereInputSchema), z.lazy(() => ReferralUsageScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ReferralUsageScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ReferralUsageScalarWhereInputSchema), z.lazy(() => ReferralUsageScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  referralId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  registrationId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  usedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const EventFormFieldsUpsertWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.EventFormFieldsUpsertWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => EventFormFieldsWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => EventFormFieldsUpdateWithoutEventInputSchema), z.lazy(() => EventFormFieldsUncheckedUpdateWithoutEventInputSchema) ]),
  create: z.union([ z.lazy(() => EventFormFieldsCreateWithoutEventInputSchema), z.lazy(() => EventFormFieldsUncheckedCreateWithoutEventInputSchema) ]),
});

export const EventFormFieldsUpdateWithWhereUniqueWithoutEventInputSchema: z.ZodType<Prisma.EventFormFieldsUpdateWithWhereUniqueWithoutEventInput> = z.strictObject({
  where: z.lazy(() => EventFormFieldsWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => EventFormFieldsUpdateWithoutEventInputSchema), z.lazy(() => EventFormFieldsUncheckedUpdateWithoutEventInputSchema) ]),
});

export const EventFormFieldsUpdateManyWithWhereWithoutEventInputSchema: z.ZodType<Prisma.EventFormFieldsUpdateManyWithWhereWithoutEventInput> = z.strictObject({
  where: z.lazy(() => EventFormFieldsScalarWhereInputSchema),
  data: z.union([ z.lazy(() => EventFormFieldsUpdateManyMutationInputSchema), z.lazy(() => EventFormFieldsUncheckedUpdateManyWithoutEventInputSchema) ]),
});

export const EventFormFieldsScalarWhereInputSchema: z.ZodType<Prisma.EventFormFieldsScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => EventFormFieldsScalarWhereInputSchema), z.lazy(() => EventFormFieldsScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => EventFormFieldsScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EventFormFieldsScalarWhereInputSchema), z.lazy(() => EventFormFieldsScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  type: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  validater: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  name: z.lazy(() => JsonFilterSchema).optional(),
  description: z.lazy(() => JsonNullableFilterSchema).optional(),
  placeholder: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  required: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  values: z.lazy(() => JsonNullableFilterSchema).optional(),
  filters: z.lazy(() => JsonNullableFilterSchema).optional(),
  prompts: z.lazy(() => JsonNullableFilterSchema).optional(),
});

export const EventCreateWithoutTicketsInputSchema: z.ZodType<Prisma.EventCreateWithoutTicketsInput> = z.strictObject({
  id: z.cuid().optional(),
  slug: z.string().optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  ogImage: z.string().optional().nullable(),
  landingPage: z.string().optional().nullable(),
  googleSheetsUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  hideEvent: z.boolean().optional(),
  useOpass: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  registrations: z.lazy(() => RegistrationCreateNestedManyWithoutEventInputSchema).optional(),
  referrals: z.lazy(() => ReferralCreateNestedManyWithoutEventInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageCreateNestedManyWithoutEventInputSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventUncheckedCreateWithoutTicketsInputSchema: z.ZodType<Prisma.EventUncheckedCreateWithoutTicketsInput> = z.strictObject({
  id: z.cuid().optional(),
  slug: z.string().optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  ogImage: z.string().optional().nullable(),
  landingPage: z.string().optional().nullable(),
  googleSheetsUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  hideEvent: z.boolean().optional(),
  useOpass: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  registrations: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  referrals: z.lazy(() => ReferralUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventCreateOrConnectWithoutTicketsInputSchema: z.ZodType<Prisma.EventCreateOrConnectWithoutTicketsInput> = z.strictObject({
  where: z.lazy(() => EventWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => EventCreateWithoutTicketsInputSchema), z.lazy(() => EventUncheckedCreateWithoutTicketsInputSchema) ]),
});

export const RegistrationCreateWithoutTicketInputSchema: z.ZodType<Prisma.RegistrationCreateWithoutTicketInput> = z.strictObject({
  id: z.cuid().optional(),
  email: z.string(),
  formData: z.string().optional().nullable(),
  status: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutRegistrationsInputSchema),
  event: z.lazy(() => EventCreateNestedOneWithoutRegistrationsInputSchema),
  referrals: z.lazy(() => RegistrationCreateNestedManyWithoutReferrerInputSchema).optional(),
  referrer: z.lazy(() => RegistrationCreateNestedOneWithoutReferralsInputSchema).optional(),
  referral: z.lazy(() => ReferralCreateNestedOneWithoutRegistrationInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageCreateNestedManyWithoutRegistrationInputSchema).optional(),
});

export const RegistrationUncheckedCreateWithoutTicketInputSchema: z.ZodType<Prisma.RegistrationUncheckedCreateWithoutTicketInput> = z.strictObject({
  id: z.cuid().optional(),
  userId: z.string(),
  eventId: z.string(),
  email: z.string(),
  formData: z.string().optional().nullable(),
  status: z.string().optional(),
  referredBy: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  referrals: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutReferrerInputSchema).optional(),
  referral: z.lazy(() => ReferralUncheckedCreateNestedOneWithoutRegistrationInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedCreateNestedManyWithoutRegistrationInputSchema).optional(),
});

export const RegistrationCreateOrConnectWithoutTicketInputSchema: z.ZodType<Prisma.RegistrationCreateOrConnectWithoutTicketInput> = z.strictObject({
  where: z.lazy(() => RegistrationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => RegistrationCreateWithoutTicketInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutTicketInputSchema) ]),
});

export const RegistrationCreateManyTicketInputEnvelopeSchema: z.ZodType<Prisma.RegistrationCreateManyTicketInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => RegistrationCreateManyTicketInputSchema), z.lazy(() => RegistrationCreateManyTicketInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const InvitationCodeCreateWithoutTicketInputSchema: z.ZodType<Prisma.InvitationCodeCreateWithoutTicketInput> = z.strictObject({
  id: z.cuid().optional(),
  code: z.string(),
  name: z.string().optional().nullable(),
  usageLimit: z.number().int().optional().nullable(),
  usedCount: z.number().int().optional(),
  validFrom: z.coerce.date().optional().nullable(),
  validUntil: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const InvitationCodeUncheckedCreateWithoutTicketInputSchema: z.ZodType<Prisma.InvitationCodeUncheckedCreateWithoutTicketInput> = z.strictObject({
  id: z.cuid().optional(),
  code: z.string(),
  name: z.string().optional().nullable(),
  usageLimit: z.number().int().optional().nullable(),
  usedCount: z.number().int().optional(),
  validFrom: z.coerce.date().optional().nullable(),
  validUntil: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const InvitationCodeCreateOrConnectWithoutTicketInputSchema: z.ZodType<Prisma.InvitationCodeCreateOrConnectWithoutTicketInput> = z.strictObject({
  where: z.lazy(() => InvitationCodeWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => InvitationCodeCreateWithoutTicketInputSchema), z.lazy(() => InvitationCodeUncheckedCreateWithoutTicketInputSchema) ]),
});

export const InvitationCodeCreateManyTicketInputEnvelopeSchema: z.ZodType<Prisma.InvitationCodeCreateManyTicketInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => InvitationCodeCreateManyTicketInputSchema), z.lazy(() => InvitationCodeCreateManyTicketInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const EventUpsertWithoutTicketsInputSchema: z.ZodType<Prisma.EventUpsertWithoutTicketsInput> = z.strictObject({
  update: z.union([ z.lazy(() => EventUpdateWithoutTicketsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutTicketsInputSchema) ]),
  create: z.union([ z.lazy(() => EventCreateWithoutTicketsInputSchema), z.lazy(() => EventUncheckedCreateWithoutTicketsInputSchema) ]),
  where: z.lazy(() => EventWhereInputSchema).optional(),
});

export const EventUpdateToOneWithWhereWithoutTicketsInputSchema: z.ZodType<Prisma.EventUpdateToOneWithWhereWithoutTicketsInput> = z.strictObject({
  where: z.lazy(() => EventWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => EventUpdateWithoutTicketsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutTicketsInputSchema) ]),
});

export const EventUpdateWithoutTicketsInputSchema: z.ZodType<Prisma.EventUpdateWithoutTicketsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ogImage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landingPage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  googleSheetsUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hideEvent: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  useOpass: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  registrations: z.lazy(() => RegistrationUpdateManyWithoutEventNestedInputSchema).optional(),
  referrals: z.lazy(() => ReferralUpdateManyWithoutEventNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUpdateManyWithoutEventNestedInputSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const EventUncheckedUpdateWithoutTicketsInputSchema: z.ZodType<Prisma.EventUncheckedUpdateWithoutTicketsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ogImage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landingPage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  googleSheetsUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hideEvent: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  useOpass: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  registrations: z.lazy(() => RegistrationUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  referrals: z.lazy(() => ReferralUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const RegistrationUpsertWithWhereUniqueWithoutTicketInputSchema: z.ZodType<Prisma.RegistrationUpsertWithWhereUniqueWithoutTicketInput> = z.strictObject({
  where: z.lazy(() => RegistrationWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => RegistrationUpdateWithoutTicketInputSchema), z.lazy(() => RegistrationUncheckedUpdateWithoutTicketInputSchema) ]),
  create: z.union([ z.lazy(() => RegistrationCreateWithoutTicketInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutTicketInputSchema) ]),
});

export const RegistrationUpdateWithWhereUniqueWithoutTicketInputSchema: z.ZodType<Prisma.RegistrationUpdateWithWhereUniqueWithoutTicketInput> = z.strictObject({
  where: z.lazy(() => RegistrationWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => RegistrationUpdateWithoutTicketInputSchema), z.lazy(() => RegistrationUncheckedUpdateWithoutTicketInputSchema) ]),
});

export const RegistrationUpdateManyWithWhereWithoutTicketInputSchema: z.ZodType<Prisma.RegistrationUpdateManyWithWhereWithoutTicketInput> = z.strictObject({
  where: z.lazy(() => RegistrationScalarWhereInputSchema),
  data: z.union([ z.lazy(() => RegistrationUpdateManyMutationInputSchema), z.lazy(() => RegistrationUncheckedUpdateManyWithoutTicketInputSchema) ]),
});

export const InvitationCodeUpsertWithWhereUniqueWithoutTicketInputSchema: z.ZodType<Prisma.InvitationCodeUpsertWithWhereUniqueWithoutTicketInput> = z.strictObject({
  where: z.lazy(() => InvitationCodeWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => InvitationCodeUpdateWithoutTicketInputSchema), z.lazy(() => InvitationCodeUncheckedUpdateWithoutTicketInputSchema) ]),
  create: z.union([ z.lazy(() => InvitationCodeCreateWithoutTicketInputSchema), z.lazy(() => InvitationCodeUncheckedCreateWithoutTicketInputSchema) ]),
});

export const InvitationCodeUpdateWithWhereUniqueWithoutTicketInputSchema: z.ZodType<Prisma.InvitationCodeUpdateWithWhereUniqueWithoutTicketInput> = z.strictObject({
  where: z.lazy(() => InvitationCodeWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => InvitationCodeUpdateWithoutTicketInputSchema), z.lazy(() => InvitationCodeUncheckedUpdateWithoutTicketInputSchema) ]),
});

export const InvitationCodeUpdateManyWithWhereWithoutTicketInputSchema: z.ZodType<Prisma.InvitationCodeUpdateManyWithWhereWithoutTicketInput> = z.strictObject({
  where: z.lazy(() => InvitationCodeScalarWhereInputSchema),
  data: z.union([ z.lazy(() => InvitationCodeUpdateManyMutationInputSchema), z.lazy(() => InvitationCodeUncheckedUpdateManyWithoutTicketInputSchema) ]),
});

export const InvitationCodeScalarWhereInputSchema: z.ZodType<Prisma.InvitationCodeScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => InvitationCodeScalarWhereInputSchema), z.lazy(() => InvitationCodeScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => InvitationCodeScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => InvitationCodeScalarWhereInputSchema), z.lazy(() => InvitationCodeScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  ticketId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  code: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  usageLimit: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  usedCount: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  validFrom: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  validUntil: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const EventCreateWithoutFormFieldsInputSchema: z.ZodType<Prisma.EventCreateWithoutFormFieldsInput> = z.strictObject({
  id: z.cuid().optional(),
  slug: z.string().optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  ogImage: z.string().optional().nullable(),
  landingPage: z.string().optional().nullable(),
  googleSheetsUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  hideEvent: z.boolean().optional(),
  useOpass: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  tickets: z.lazy(() => TicketCreateNestedManyWithoutEventInputSchema).optional(),
  registrations: z.lazy(() => RegistrationCreateNestedManyWithoutEventInputSchema).optional(),
  referrals: z.lazy(() => ReferralCreateNestedManyWithoutEventInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventUncheckedCreateWithoutFormFieldsInputSchema: z.ZodType<Prisma.EventUncheckedCreateWithoutFormFieldsInput> = z.strictObject({
  id: z.cuid().optional(),
  slug: z.string().optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  ogImage: z.string().optional().nullable(),
  landingPage: z.string().optional().nullable(),
  googleSheetsUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  hideEvent: z.boolean().optional(),
  useOpass: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  tickets: z.lazy(() => TicketUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  referrals: z.lazy(() => ReferralUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventCreateOrConnectWithoutFormFieldsInputSchema: z.ZodType<Prisma.EventCreateOrConnectWithoutFormFieldsInput> = z.strictObject({
  where: z.lazy(() => EventWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => EventCreateWithoutFormFieldsInputSchema), z.lazy(() => EventUncheckedCreateWithoutFormFieldsInputSchema) ]),
});

export const EventUpsertWithoutFormFieldsInputSchema: z.ZodType<Prisma.EventUpsertWithoutFormFieldsInput> = z.strictObject({
  update: z.union([ z.lazy(() => EventUpdateWithoutFormFieldsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutFormFieldsInputSchema) ]),
  create: z.union([ z.lazy(() => EventCreateWithoutFormFieldsInputSchema), z.lazy(() => EventUncheckedCreateWithoutFormFieldsInputSchema) ]),
  where: z.lazy(() => EventWhereInputSchema).optional(),
});

export const EventUpdateToOneWithWhereWithoutFormFieldsInputSchema: z.ZodType<Prisma.EventUpdateToOneWithWhereWithoutFormFieldsInput> = z.strictObject({
  where: z.lazy(() => EventWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => EventUpdateWithoutFormFieldsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutFormFieldsInputSchema) ]),
});

export const EventUpdateWithoutFormFieldsInputSchema: z.ZodType<Prisma.EventUpdateWithoutFormFieldsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ogImage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landingPage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  googleSheetsUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hideEvent: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  useOpass: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  tickets: z.lazy(() => TicketUpdateManyWithoutEventNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUpdateManyWithoutEventNestedInputSchema).optional(),
  referrals: z.lazy(() => ReferralUpdateManyWithoutEventNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const EventUncheckedUpdateWithoutFormFieldsInputSchema: z.ZodType<Prisma.EventUncheckedUpdateWithoutFormFieldsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ogImage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landingPage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  googleSheetsUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hideEvent: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  useOpass: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  tickets: z.lazy(() => TicketUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  referrals: z.lazy(() => ReferralUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const UserCreateWithoutRegistrationsInputSchema: z.ZodType<Prisma.UserCreateWithoutRegistrationsInput> = z.strictObject({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().optional().nullable(),
  role: z.string().optional(),
  permissions: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  phoneNumber: z.string().optional().nullable(),
  phoneVerified: z.boolean().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  sessions: z.lazy(() => SessionCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountCreateNestedManyWithoutUserInputSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignCreateNestedManyWithoutUserInputSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateWithoutRegistrationsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutRegistrationsInput> = z.strictObject({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().optional().nullable(),
  role: z.string().optional(),
  permissions: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  phoneNumber: z.string().optional().nullable(),
  phoneVerified: z.boolean().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  sessions: z.lazy(() => SessionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserCreateOrConnectWithoutRegistrationsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutRegistrationsInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutRegistrationsInputSchema), z.lazy(() => UserUncheckedCreateWithoutRegistrationsInputSchema) ]),
});

export const EventCreateWithoutRegistrationsInputSchema: z.ZodType<Prisma.EventCreateWithoutRegistrationsInput> = z.strictObject({
  id: z.cuid().optional(),
  slug: z.string().optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  ogImage: z.string().optional().nullable(),
  landingPage: z.string().optional().nullable(),
  googleSheetsUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  hideEvent: z.boolean().optional(),
  useOpass: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  tickets: z.lazy(() => TicketCreateNestedManyWithoutEventInputSchema).optional(),
  referrals: z.lazy(() => ReferralCreateNestedManyWithoutEventInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageCreateNestedManyWithoutEventInputSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventUncheckedCreateWithoutRegistrationsInputSchema: z.ZodType<Prisma.EventUncheckedCreateWithoutRegistrationsInput> = z.strictObject({
  id: z.cuid().optional(),
  slug: z.string().optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  ogImage: z.string().optional().nullable(),
  landingPage: z.string().optional().nullable(),
  googleSheetsUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  hideEvent: z.boolean().optional(),
  useOpass: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  tickets: z.lazy(() => TicketUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  referrals: z.lazy(() => ReferralUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventCreateOrConnectWithoutRegistrationsInputSchema: z.ZodType<Prisma.EventCreateOrConnectWithoutRegistrationsInput> = z.strictObject({
  where: z.lazy(() => EventWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => EventCreateWithoutRegistrationsInputSchema), z.lazy(() => EventUncheckedCreateWithoutRegistrationsInputSchema) ]),
});

export const TicketCreateWithoutRegistrationsInputSchema: z.ZodType<Prisma.TicketCreateWithoutRegistrationsInput> = z.strictObject({
  id: z.cuid().optional(),
  order: z.number().int().optional(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  price: z.number().int(),
  quantity: z.number().int(),
  soldCount: z.number().int().optional(),
  saleStart: z.coerce.date().optional().nullable(),
  saleEnd: z.coerce.date().optional().nullable(),
  requireInviteCode: z.boolean().optional(),
  requireSmsVerification: z.boolean().optional(),
  hidden: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  event: z.lazy(() => EventCreateNestedOneWithoutTicketsInputSchema),
  invitationCodes: z.lazy(() => InvitationCodeCreateNestedManyWithoutTicketInputSchema).optional(),
});

export const TicketUncheckedCreateWithoutRegistrationsInputSchema: z.ZodType<Prisma.TicketUncheckedCreateWithoutRegistrationsInput> = z.strictObject({
  id: z.cuid().optional(),
  eventId: z.string(),
  order: z.number().int().optional(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  price: z.number().int(),
  quantity: z.number().int(),
  soldCount: z.number().int().optional(),
  saleStart: z.coerce.date().optional().nullable(),
  saleEnd: z.coerce.date().optional().nullable(),
  requireInviteCode: z.boolean().optional(),
  requireSmsVerification: z.boolean().optional(),
  hidden: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  invitationCodes: z.lazy(() => InvitationCodeUncheckedCreateNestedManyWithoutTicketInputSchema).optional(),
});

export const TicketCreateOrConnectWithoutRegistrationsInputSchema: z.ZodType<Prisma.TicketCreateOrConnectWithoutRegistrationsInput> = z.strictObject({
  where: z.lazy(() => TicketWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TicketCreateWithoutRegistrationsInputSchema), z.lazy(() => TicketUncheckedCreateWithoutRegistrationsInputSchema) ]),
});

export const RegistrationCreateWithoutReferrerInputSchema: z.ZodType<Prisma.RegistrationCreateWithoutReferrerInput> = z.strictObject({
  id: z.cuid().optional(),
  email: z.string(),
  formData: z.string().optional().nullable(),
  status: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutRegistrationsInputSchema),
  event: z.lazy(() => EventCreateNestedOneWithoutRegistrationsInputSchema),
  ticket: z.lazy(() => TicketCreateNestedOneWithoutRegistrationsInputSchema),
  referrals: z.lazy(() => RegistrationCreateNestedManyWithoutReferrerInputSchema).optional(),
  referral: z.lazy(() => ReferralCreateNestedOneWithoutRegistrationInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageCreateNestedManyWithoutRegistrationInputSchema).optional(),
});

export const RegistrationUncheckedCreateWithoutReferrerInputSchema: z.ZodType<Prisma.RegistrationUncheckedCreateWithoutReferrerInput> = z.strictObject({
  id: z.cuid().optional(),
  userId: z.string(),
  eventId: z.string(),
  ticketId: z.string(),
  email: z.string(),
  formData: z.string().optional().nullable(),
  status: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  referrals: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutReferrerInputSchema).optional(),
  referral: z.lazy(() => ReferralUncheckedCreateNestedOneWithoutRegistrationInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedCreateNestedManyWithoutRegistrationInputSchema).optional(),
});

export const RegistrationCreateOrConnectWithoutReferrerInputSchema: z.ZodType<Prisma.RegistrationCreateOrConnectWithoutReferrerInput> = z.strictObject({
  where: z.lazy(() => RegistrationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => RegistrationCreateWithoutReferrerInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutReferrerInputSchema) ]),
});

export const RegistrationCreateManyReferrerInputEnvelopeSchema: z.ZodType<Prisma.RegistrationCreateManyReferrerInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => RegistrationCreateManyReferrerInputSchema), z.lazy(() => RegistrationCreateManyReferrerInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const RegistrationCreateWithoutReferralsInputSchema: z.ZodType<Prisma.RegistrationCreateWithoutReferralsInput> = z.strictObject({
  id: z.cuid().optional(),
  email: z.string(),
  formData: z.string().optional().nullable(),
  status: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutRegistrationsInputSchema),
  event: z.lazy(() => EventCreateNestedOneWithoutRegistrationsInputSchema),
  ticket: z.lazy(() => TicketCreateNestedOneWithoutRegistrationsInputSchema),
  referrer: z.lazy(() => RegistrationCreateNestedOneWithoutReferralsInputSchema).optional(),
  referral: z.lazy(() => ReferralCreateNestedOneWithoutRegistrationInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageCreateNestedManyWithoutRegistrationInputSchema).optional(),
});

export const RegistrationUncheckedCreateWithoutReferralsInputSchema: z.ZodType<Prisma.RegistrationUncheckedCreateWithoutReferralsInput> = z.strictObject({
  id: z.cuid().optional(),
  userId: z.string(),
  eventId: z.string(),
  ticketId: z.string(),
  email: z.string(),
  formData: z.string().optional().nullable(),
  status: z.string().optional(),
  referredBy: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  referral: z.lazy(() => ReferralUncheckedCreateNestedOneWithoutRegistrationInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedCreateNestedManyWithoutRegistrationInputSchema).optional(),
});

export const RegistrationCreateOrConnectWithoutReferralsInputSchema: z.ZodType<Prisma.RegistrationCreateOrConnectWithoutReferralsInput> = z.strictObject({
  where: z.lazy(() => RegistrationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => RegistrationCreateWithoutReferralsInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutReferralsInputSchema) ]),
});

export const ReferralCreateWithoutRegistrationInputSchema: z.ZodType<Prisma.ReferralCreateWithoutRegistrationInput> = z.strictObject({
  id: z.cuid().optional(),
  code: z.string(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  event: z.lazy(() => EventCreateNestedOneWithoutReferralsInputSchema),
  referredUsers: z.lazy(() => ReferralUsageCreateNestedManyWithoutReferralInputSchema).optional(),
});

export const ReferralUncheckedCreateWithoutRegistrationInputSchema: z.ZodType<Prisma.ReferralUncheckedCreateWithoutRegistrationInput> = z.strictObject({
  id: z.cuid().optional(),
  code: z.string(),
  eventId: z.string(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  referredUsers: z.lazy(() => ReferralUsageUncheckedCreateNestedManyWithoutReferralInputSchema).optional(),
});

export const ReferralCreateOrConnectWithoutRegistrationInputSchema: z.ZodType<Prisma.ReferralCreateOrConnectWithoutRegistrationInput> = z.strictObject({
  where: z.lazy(() => ReferralWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ReferralCreateWithoutRegistrationInputSchema), z.lazy(() => ReferralUncheckedCreateWithoutRegistrationInputSchema) ]),
});

export const ReferralUsageCreateWithoutRegistrationInputSchema: z.ZodType<Prisma.ReferralUsageCreateWithoutRegistrationInput> = z.strictObject({
  id: z.cuid().optional(),
  usedAt: z.coerce.date().optional(),
  referral: z.lazy(() => ReferralCreateNestedOneWithoutReferredUsersInputSchema),
  event: z.lazy(() => EventCreateNestedOneWithoutReferralUsageInputSchema),
});

export const ReferralUsageUncheckedCreateWithoutRegistrationInputSchema: z.ZodType<Prisma.ReferralUsageUncheckedCreateWithoutRegistrationInput> = z.strictObject({
  id: z.cuid().optional(),
  referralId: z.string(),
  eventId: z.string(),
  usedAt: z.coerce.date().optional(),
});

export const ReferralUsageCreateOrConnectWithoutRegistrationInputSchema: z.ZodType<Prisma.ReferralUsageCreateOrConnectWithoutRegistrationInput> = z.strictObject({
  where: z.lazy(() => ReferralUsageWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ReferralUsageCreateWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageUncheckedCreateWithoutRegistrationInputSchema) ]),
});

export const ReferralUsageCreateManyRegistrationInputEnvelopeSchema: z.ZodType<Prisma.ReferralUsageCreateManyRegistrationInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => ReferralUsageCreateManyRegistrationInputSchema), z.lazy(() => ReferralUsageCreateManyRegistrationInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const UserUpsertWithoutRegistrationsInputSchema: z.ZodType<Prisma.UserUpsertWithoutRegistrationsInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutRegistrationsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutRegistrationsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutRegistrationsInputSchema), z.lazy(() => UserUncheckedCreateWithoutRegistrationsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutRegistrationsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutRegistrationsInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutRegistrationsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutRegistrationsInputSchema) ]),
});

export const UserUpdateWithoutRegistrationsInputSchema: z.ZodType<Prisma.UserUpdateWithoutRegistrationsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  permissions: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  phoneVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUpdateManyWithoutUserNestedInputSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignUpdateManyWithoutUserNestedInputSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutRegistrationsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutRegistrationsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  permissions: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  phoneVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const EventUpsertWithoutRegistrationsInputSchema: z.ZodType<Prisma.EventUpsertWithoutRegistrationsInput> = z.strictObject({
  update: z.union([ z.lazy(() => EventUpdateWithoutRegistrationsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutRegistrationsInputSchema) ]),
  create: z.union([ z.lazy(() => EventCreateWithoutRegistrationsInputSchema), z.lazy(() => EventUncheckedCreateWithoutRegistrationsInputSchema) ]),
  where: z.lazy(() => EventWhereInputSchema).optional(),
});

export const EventUpdateToOneWithWhereWithoutRegistrationsInputSchema: z.ZodType<Prisma.EventUpdateToOneWithWhereWithoutRegistrationsInput> = z.strictObject({
  where: z.lazy(() => EventWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => EventUpdateWithoutRegistrationsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutRegistrationsInputSchema) ]),
});

export const EventUpdateWithoutRegistrationsInputSchema: z.ZodType<Prisma.EventUpdateWithoutRegistrationsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ogImage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landingPage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  googleSheetsUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hideEvent: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  useOpass: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  tickets: z.lazy(() => TicketUpdateManyWithoutEventNestedInputSchema).optional(),
  referrals: z.lazy(() => ReferralUpdateManyWithoutEventNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUpdateManyWithoutEventNestedInputSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const EventUncheckedUpdateWithoutRegistrationsInputSchema: z.ZodType<Prisma.EventUncheckedUpdateWithoutRegistrationsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ogImage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landingPage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  googleSheetsUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hideEvent: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  useOpass: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  tickets: z.lazy(() => TicketUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  referrals: z.lazy(() => ReferralUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const TicketUpsertWithoutRegistrationsInputSchema: z.ZodType<Prisma.TicketUpsertWithoutRegistrationsInput> = z.strictObject({
  update: z.union([ z.lazy(() => TicketUpdateWithoutRegistrationsInputSchema), z.lazy(() => TicketUncheckedUpdateWithoutRegistrationsInputSchema) ]),
  create: z.union([ z.lazy(() => TicketCreateWithoutRegistrationsInputSchema), z.lazy(() => TicketUncheckedCreateWithoutRegistrationsInputSchema) ]),
  where: z.lazy(() => TicketWhereInputSchema).optional(),
});

export const TicketUpdateToOneWithWhereWithoutRegistrationsInputSchema: z.ZodType<Prisma.TicketUpdateToOneWithWhereWithoutRegistrationsInput> = z.strictObject({
  where: z.lazy(() => TicketWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => TicketUpdateWithoutRegistrationsInputSchema), z.lazy(() => TicketUncheckedUpdateWithoutRegistrationsInputSchema) ]),
});

export const TicketUpdateWithoutRegistrationsInputSchema: z.ZodType<Prisma.TicketUpdateWithoutRegistrationsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  quantity: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  soldCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  saleStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  requireInviteCode: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  requireSmsVerification: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hidden: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutTicketsNestedInputSchema).optional(),
  invitationCodes: z.lazy(() => InvitationCodeUpdateManyWithoutTicketNestedInputSchema).optional(),
});

export const TicketUncheckedUpdateWithoutRegistrationsInputSchema: z.ZodType<Prisma.TicketUncheckedUpdateWithoutRegistrationsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  quantity: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  soldCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  saleStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  requireInviteCode: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  requireSmsVerification: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hidden: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  invitationCodes: z.lazy(() => InvitationCodeUncheckedUpdateManyWithoutTicketNestedInputSchema).optional(),
});

export const RegistrationUpsertWithWhereUniqueWithoutReferrerInputSchema: z.ZodType<Prisma.RegistrationUpsertWithWhereUniqueWithoutReferrerInput> = z.strictObject({
  where: z.lazy(() => RegistrationWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => RegistrationUpdateWithoutReferrerInputSchema), z.lazy(() => RegistrationUncheckedUpdateWithoutReferrerInputSchema) ]),
  create: z.union([ z.lazy(() => RegistrationCreateWithoutReferrerInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutReferrerInputSchema) ]),
});

export const RegistrationUpdateWithWhereUniqueWithoutReferrerInputSchema: z.ZodType<Prisma.RegistrationUpdateWithWhereUniqueWithoutReferrerInput> = z.strictObject({
  where: z.lazy(() => RegistrationWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => RegistrationUpdateWithoutReferrerInputSchema), z.lazy(() => RegistrationUncheckedUpdateWithoutReferrerInputSchema) ]),
});

export const RegistrationUpdateManyWithWhereWithoutReferrerInputSchema: z.ZodType<Prisma.RegistrationUpdateManyWithWhereWithoutReferrerInput> = z.strictObject({
  where: z.lazy(() => RegistrationScalarWhereInputSchema),
  data: z.union([ z.lazy(() => RegistrationUpdateManyMutationInputSchema), z.lazy(() => RegistrationUncheckedUpdateManyWithoutReferrerInputSchema) ]),
});

export const RegistrationUpsertWithoutReferralsInputSchema: z.ZodType<Prisma.RegistrationUpsertWithoutReferralsInput> = z.strictObject({
  update: z.union([ z.lazy(() => RegistrationUpdateWithoutReferralsInputSchema), z.lazy(() => RegistrationUncheckedUpdateWithoutReferralsInputSchema) ]),
  create: z.union([ z.lazy(() => RegistrationCreateWithoutReferralsInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutReferralsInputSchema) ]),
  where: z.lazy(() => RegistrationWhereInputSchema).optional(),
});

export const RegistrationUpdateToOneWithWhereWithoutReferralsInputSchema: z.ZodType<Prisma.RegistrationUpdateToOneWithWhereWithoutReferralsInput> = z.strictObject({
  where: z.lazy(() => RegistrationWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => RegistrationUpdateWithoutReferralsInputSchema), z.lazy(() => RegistrationUncheckedUpdateWithoutReferralsInputSchema) ]),
});

export const RegistrationUpdateWithoutReferralsInputSchema: z.ZodType<Prisma.RegistrationUpdateWithoutReferralsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutRegistrationsNestedInputSchema).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutRegistrationsNestedInputSchema).optional(),
  ticket: z.lazy(() => TicketUpdateOneRequiredWithoutRegistrationsNestedInputSchema).optional(),
  referrer: z.lazy(() => RegistrationUpdateOneWithoutReferralsNestedInputSchema).optional(),
  referral: z.lazy(() => ReferralUpdateOneWithoutRegistrationNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUpdateManyWithoutRegistrationNestedInputSchema).optional(),
});

export const RegistrationUncheckedUpdateWithoutReferralsInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateWithoutReferralsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ticketId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  referredBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  referral: z.lazy(() => ReferralUncheckedUpdateOneWithoutRegistrationNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedUpdateManyWithoutRegistrationNestedInputSchema).optional(),
});

export const ReferralUpsertWithoutRegistrationInputSchema: z.ZodType<Prisma.ReferralUpsertWithoutRegistrationInput> = z.strictObject({
  update: z.union([ z.lazy(() => ReferralUpdateWithoutRegistrationInputSchema), z.lazy(() => ReferralUncheckedUpdateWithoutRegistrationInputSchema) ]),
  create: z.union([ z.lazy(() => ReferralCreateWithoutRegistrationInputSchema), z.lazy(() => ReferralUncheckedCreateWithoutRegistrationInputSchema) ]),
  where: z.lazy(() => ReferralWhereInputSchema).optional(),
});

export const ReferralUpdateToOneWithWhereWithoutRegistrationInputSchema: z.ZodType<Prisma.ReferralUpdateToOneWithWhereWithoutRegistrationInput> = z.strictObject({
  where: z.lazy(() => ReferralWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => ReferralUpdateWithoutRegistrationInputSchema), z.lazy(() => ReferralUncheckedUpdateWithoutRegistrationInputSchema) ]),
});

export const ReferralUpdateWithoutRegistrationInputSchema: z.ZodType<Prisma.ReferralUpdateWithoutRegistrationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutReferralsNestedInputSchema).optional(),
  referredUsers: z.lazy(() => ReferralUsageUpdateManyWithoutReferralNestedInputSchema).optional(),
});

export const ReferralUncheckedUpdateWithoutRegistrationInputSchema: z.ZodType<Prisma.ReferralUncheckedUpdateWithoutRegistrationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  referredUsers: z.lazy(() => ReferralUsageUncheckedUpdateManyWithoutReferralNestedInputSchema).optional(),
});

export const ReferralUsageUpsertWithWhereUniqueWithoutRegistrationInputSchema: z.ZodType<Prisma.ReferralUsageUpsertWithWhereUniqueWithoutRegistrationInput> = z.strictObject({
  where: z.lazy(() => ReferralUsageWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => ReferralUsageUpdateWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageUncheckedUpdateWithoutRegistrationInputSchema) ]),
  create: z.union([ z.lazy(() => ReferralUsageCreateWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageUncheckedCreateWithoutRegistrationInputSchema) ]),
});

export const ReferralUsageUpdateWithWhereUniqueWithoutRegistrationInputSchema: z.ZodType<Prisma.ReferralUsageUpdateWithWhereUniqueWithoutRegistrationInput> = z.strictObject({
  where: z.lazy(() => ReferralUsageWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => ReferralUsageUpdateWithoutRegistrationInputSchema), z.lazy(() => ReferralUsageUncheckedUpdateWithoutRegistrationInputSchema) ]),
});

export const ReferralUsageUpdateManyWithWhereWithoutRegistrationInputSchema: z.ZodType<Prisma.ReferralUsageUpdateManyWithWhereWithoutRegistrationInput> = z.strictObject({
  where: z.lazy(() => ReferralUsageScalarWhereInputSchema),
  data: z.union([ z.lazy(() => ReferralUsageUpdateManyMutationInputSchema), z.lazy(() => ReferralUsageUncheckedUpdateManyWithoutRegistrationInputSchema) ]),
});

export const RegistrationCreateWithoutReferralInputSchema: z.ZodType<Prisma.RegistrationCreateWithoutReferralInput> = z.strictObject({
  id: z.cuid().optional(),
  email: z.string(),
  formData: z.string().optional().nullable(),
  status: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutRegistrationsInputSchema),
  event: z.lazy(() => EventCreateNestedOneWithoutRegistrationsInputSchema),
  ticket: z.lazy(() => TicketCreateNestedOneWithoutRegistrationsInputSchema),
  referrals: z.lazy(() => RegistrationCreateNestedManyWithoutReferrerInputSchema).optional(),
  referrer: z.lazy(() => RegistrationCreateNestedOneWithoutReferralsInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageCreateNestedManyWithoutRegistrationInputSchema).optional(),
});

export const RegistrationUncheckedCreateWithoutReferralInputSchema: z.ZodType<Prisma.RegistrationUncheckedCreateWithoutReferralInput> = z.strictObject({
  id: z.cuid().optional(),
  userId: z.string(),
  eventId: z.string(),
  ticketId: z.string(),
  email: z.string(),
  formData: z.string().optional().nullable(),
  status: z.string().optional(),
  referredBy: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  referrals: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutReferrerInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedCreateNestedManyWithoutRegistrationInputSchema).optional(),
});

export const RegistrationCreateOrConnectWithoutReferralInputSchema: z.ZodType<Prisma.RegistrationCreateOrConnectWithoutReferralInput> = z.strictObject({
  where: z.lazy(() => RegistrationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => RegistrationCreateWithoutReferralInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutReferralInputSchema) ]),
});

export const EventCreateWithoutReferralsInputSchema: z.ZodType<Prisma.EventCreateWithoutReferralsInput> = z.strictObject({
  id: z.cuid().optional(),
  slug: z.string().optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  ogImage: z.string().optional().nullable(),
  landingPage: z.string().optional().nullable(),
  googleSheetsUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  hideEvent: z.boolean().optional(),
  useOpass: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  tickets: z.lazy(() => TicketCreateNestedManyWithoutEventInputSchema).optional(),
  registrations: z.lazy(() => RegistrationCreateNestedManyWithoutEventInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageCreateNestedManyWithoutEventInputSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventUncheckedCreateWithoutReferralsInputSchema: z.ZodType<Prisma.EventUncheckedCreateWithoutReferralsInput> = z.strictObject({
  id: z.cuid().optional(),
  slug: z.string().optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  ogImage: z.string().optional().nullable(),
  landingPage: z.string().optional().nullable(),
  googleSheetsUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  hideEvent: z.boolean().optional(),
  useOpass: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  tickets: z.lazy(() => TicketUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventCreateOrConnectWithoutReferralsInputSchema: z.ZodType<Prisma.EventCreateOrConnectWithoutReferralsInput> = z.strictObject({
  where: z.lazy(() => EventWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => EventCreateWithoutReferralsInputSchema), z.lazy(() => EventUncheckedCreateWithoutReferralsInputSchema) ]),
});

export const ReferralUsageCreateWithoutReferralInputSchema: z.ZodType<Prisma.ReferralUsageCreateWithoutReferralInput> = z.strictObject({
  id: z.cuid().optional(),
  usedAt: z.coerce.date().optional(),
  registration: z.lazy(() => RegistrationCreateNestedOneWithoutReferralUsageInputSchema),
  event: z.lazy(() => EventCreateNestedOneWithoutReferralUsageInputSchema),
});

export const ReferralUsageUncheckedCreateWithoutReferralInputSchema: z.ZodType<Prisma.ReferralUsageUncheckedCreateWithoutReferralInput> = z.strictObject({
  id: z.cuid().optional(),
  registrationId: z.string(),
  eventId: z.string(),
  usedAt: z.coerce.date().optional(),
});

export const ReferralUsageCreateOrConnectWithoutReferralInputSchema: z.ZodType<Prisma.ReferralUsageCreateOrConnectWithoutReferralInput> = z.strictObject({
  where: z.lazy(() => ReferralUsageWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ReferralUsageCreateWithoutReferralInputSchema), z.lazy(() => ReferralUsageUncheckedCreateWithoutReferralInputSchema) ]),
});

export const ReferralUsageCreateManyReferralInputEnvelopeSchema: z.ZodType<Prisma.ReferralUsageCreateManyReferralInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => ReferralUsageCreateManyReferralInputSchema), z.lazy(() => ReferralUsageCreateManyReferralInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const RegistrationUpsertWithoutReferralInputSchema: z.ZodType<Prisma.RegistrationUpsertWithoutReferralInput> = z.strictObject({
  update: z.union([ z.lazy(() => RegistrationUpdateWithoutReferralInputSchema), z.lazy(() => RegistrationUncheckedUpdateWithoutReferralInputSchema) ]),
  create: z.union([ z.lazy(() => RegistrationCreateWithoutReferralInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutReferralInputSchema) ]),
  where: z.lazy(() => RegistrationWhereInputSchema).optional(),
});

export const RegistrationUpdateToOneWithWhereWithoutReferralInputSchema: z.ZodType<Prisma.RegistrationUpdateToOneWithWhereWithoutReferralInput> = z.strictObject({
  where: z.lazy(() => RegistrationWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => RegistrationUpdateWithoutReferralInputSchema), z.lazy(() => RegistrationUncheckedUpdateWithoutReferralInputSchema) ]),
});

export const RegistrationUpdateWithoutReferralInputSchema: z.ZodType<Prisma.RegistrationUpdateWithoutReferralInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutRegistrationsNestedInputSchema).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutRegistrationsNestedInputSchema).optional(),
  ticket: z.lazy(() => TicketUpdateOneRequiredWithoutRegistrationsNestedInputSchema).optional(),
  referrals: z.lazy(() => RegistrationUpdateManyWithoutReferrerNestedInputSchema).optional(),
  referrer: z.lazy(() => RegistrationUpdateOneWithoutReferralsNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUpdateManyWithoutRegistrationNestedInputSchema).optional(),
});

export const RegistrationUncheckedUpdateWithoutReferralInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateWithoutReferralInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ticketId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  referredBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  referrals: z.lazy(() => RegistrationUncheckedUpdateManyWithoutReferrerNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedUpdateManyWithoutRegistrationNestedInputSchema).optional(),
});

export const EventUpsertWithoutReferralsInputSchema: z.ZodType<Prisma.EventUpsertWithoutReferralsInput> = z.strictObject({
  update: z.union([ z.lazy(() => EventUpdateWithoutReferralsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutReferralsInputSchema) ]),
  create: z.union([ z.lazy(() => EventCreateWithoutReferralsInputSchema), z.lazy(() => EventUncheckedCreateWithoutReferralsInputSchema) ]),
  where: z.lazy(() => EventWhereInputSchema).optional(),
});

export const EventUpdateToOneWithWhereWithoutReferralsInputSchema: z.ZodType<Prisma.EventUpdateToOneWithWhereWithoutReferralsInput> = z.strictObject({
  where: z.lazy(() => EventWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => EventUpdateWithoutReferralsInputSchema), z.lazy(() => EventUncheckedUpdateWithoutReferralsInputSchema) ]),
});

export const EventUpdateWithoutReferralsInputSchema: z.ZodType<Prisma.EventUpdateWithoutReferralsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ogImage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landingPage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  googleSheetsUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hideEvent: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  useOpass: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  tickets: z.lazy(() => TicketUpdateManyWithoutEventNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUpdateManyWithoutEventNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUpdateManyWithoutEventNestedInputSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const EventUncheckedUpdateWithoutReferralsInputSchema: z.ZodType<Prisma.EventUncheckedUpdateWithoutReferralsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ogImage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landingPage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  googleSheetsUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hideEvent: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  useOpass: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  tickets: z.lazy(() => TicketUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const ReferralUsageUpsertWithWhereUniqueWithoutReferralInputSchema: z.ZodType<Prisma.ReferralUsageUpsertWithWhereUniqueWithoutReferralInput> = z.strictObject({
  where: z.lazy(() => ReferralUsageWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => ReferralUsageUpdateWithoutReferralInputSchema), z.lazy(() => ReferralUsageUncheckedUpdateWithoutReferralInputSchema) ]),
  create: z.union([ z.lazy(() => ReferralUsageCreateWithoutReferralInputSchema), z.lazy(() => ReferralUsageUncheckedCreateWithoutReferralInputSchema) ]),
});

export const ReferralUsageUpdateWithWhereUniqueWithoutReferralInputSchema: z.ZodType<Prisma.ReferralUsageUpdateWithWhereUniqueWithoutReferralInput> = z.strictObject({
  where: z.lazy(() => ReferralUsageWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => ReferralUsageUpdateWithoutReferralInputSchema), z.lazy(() => ReferralUsageUncheckedUpdateWithoutReferralInputSchema) ]),
});

export const ReferralUsageUpdateManyWithWhereWithoutReferralInputSchema: z.ZodType<Prisma.ReferralUsageUpdateManyWithWhereWithoutReferralInput> = z.strictObject({
  where: z.lazy(() => ReferralUsageScalarWhereInputSchema),
  data: z.union([ z.lazy(() => ReferralUsageUpdateManyMutationInputSchema), z.lazy(() => ReferralUsageUncheckedUpdateManyWithoutReferralInputSchema) ]),
});

export const ReferralCreateWithoutReferredUsersInputSchema: z.ZodType<Prisma.ReferralCreateWithoutReferredUsersInput> = z.strictObject({
  id: z.cuid().optional(),
  code: z.string(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  registration: z.lazy(() => RegistrationCreateNestedOneWithoutReferralInputSchema),
  event: z.lazy(() => EventCreateNestedOneWithoutReferralsInputSchema),
});

export const ReferralUncheckedCreateWithoutReferredUsersInputSchema: z.ZodType<Prisma.ReferralUncheckedCreateWithoutReferredUsersInput> = z.strictObject({
  id: z.cuid().optional(),
  code: z.string(),
  registrationId: z.string(),
  eventId: z.string(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const ReferralCreateOrConnectWithoutReferredUsersInputSchema: z.ZodType<Prisma.ReferralCreateOrConnectWithoutReferredUsersInput> = z.strictObject({
  where: z.lazy(() => ReferralWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ReferralCreateWithoutReferredUsersInputSchema), z.lazy(() => ReferralUncheckedCreateWithoutReferredUsersInputSchema) ]),
});

export const RegistrationCreateWithoutReferralUsageInputSchema: z.ZodType<Prisma.RegistrationCreateWithoutReferralUsageInput> = z.strictObject({
  id: z.cuid().optional(),
  email: z.string(),
  formData: z.string().optional().nullable(),
  status: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutRegistrationsInputSchema),
  event: z.lazy(() => EventCreateNestedOneWithoutRegistrationsInputSchema),
  ticket: z.lazy(() => TicketCreateNestedOneWithoutRegistrationsInputSchema),
  referrals: z.lazy(() => RegistrationCreateNestedManyWithoutReferrerInputSchema).optional(),
  referrer: z.lazy(() => RegistrationCreateNestedOneWithoutReferralsInputSchema).optional(),
  referral: z.lazy(() => ReferralCreateNestedOneWithoutRegistrationInputSchema).optional(),
});

export const RegistrationUncheckedCreateWithoutReferralUsageInputSchema: z.ZodType<Prisma.RegistrationUncheckedCreateWithoutReferralUsageInput> = z.strictObject({
  id: z.cuid().optional(),
  userId: z.string(),
  eventId: z.string(),
  ticketId: z.string(),
  email: z.string(),
  formData: z.string().optional().nullable(),
  status: z.string().optional(),
  referredBy: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  referrals: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutReferrerInputSchema).optional(),
  referral: z.lazy(() => ReferralUncheckedCreateNestedOneWithoutRegistrationInputSchema).optional(),
});

export const RegistrationCreateOrConnectWithoutReferralUsageInputSchema: z.ZodType<Prisma.RegistrationCreateOrConnectWithoutReferralUsageInput> = z.strictObject({
  where: z.lazy(() => RegistrationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => RegistrationCreateWithoutReferralUsageInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutReferralUsageInputSchema) ]),
});

export const EventCreateWithoutReferralUsageInputSchema: z.ZodType<Prisma.EventCreateWithoutReferralUsageInput> = z.strictObject({
  id: z.cuid().optional(),
  slug: z.string().optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  ogImage: z.string().optional().nullable(),
  landingPage: z.string().optional().nullable(),
  googleSheetsUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  hideEvent: z.boolean().optional(),
  useOpass: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  tickets: z.lazy(() => TicketCreateNestedManyWithoutEventInputSchema).optional(),
  registrations: z.lazy(() => RegistrationCreateNestedManyWithoutEventInputSchema).optional(),
  referrals: z.lazy(() => ReferralCreateNestedManyWithoutEventInputSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventUncheckedCreateWithoutReferralUsageInputSchema: z.ZodType<Prisma.EventUncheckedCreateWithoutReferralUsageInput> = z.strictObject({
  id: z.cuid().optional(),
  slug: z.string().optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  ogImage: z.string().optional().nullable(),
  landingPage: z.string().optional().nullable(),
  googleSheetsUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  hideEvent: z.boolean().optional(),
  useOpass: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  tickets: z.lazy(() => TicketUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  referrals: z.lazy(() => ReferralUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsUncheckedCreateNestedManyWithoutEventInputSchema).optional(),
});

export const EventCreateOrConnectWithoutReferralUsageInputSchema: z.ZodType<Prisma.EventCreateOrConnectWithoutReferralUsageInput> = z.strictObject({
  where: z.lazy(() => EventWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => EventCreateWithoutReferralUsageInputSchema), z.lazy(() => EventUncheckedCreateWithoutReferralUsageInputSchema) ]),
});

export const ReferralUpsertWithoutReferredUsersInputSchema: z.ZodType<Prisma.ReferralUpsertWithoutReferredUsersInput> = z.strictObject({
  update: z.union([ z.lazy(() => ReferralUpdateWithoutReferredUsersInputSchema), z.lazy(() => ReferralUncheckedUpdateWithoutReferredUsersInputSchema) ]),
  create: z.union([ z.lazy(() => ReferralCreateWithoutReferredUsersInputSchema), z.lazy(() => ReferralUncheckedCreateWithoutReferredUsersInputSchema) ]),
  where: z.lazy(() => ReferralWhereInputSchema).optional(),
});

export const ReferralUpdateToOneWithWhereWithoutReferredUsersInputSchema: z.ZodType<Prisma.ReferralUpdateToOneWithWhereWithoutReferredUsersInput> = z.strictObject({
  where: z.lazy(() => ReferralWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => ReferralUpdateWithoutReferredUsersInputSchema), z.lazy(() => ReferralUncheckedUpdateWithoutReferredUsersInputSchema) ]),
});

export const ReferralUpdateWithoutReferredUsersInputSchema: z.ZodType<Prisma.ReferralUpdateWithoutReferredUsersInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  registration: z.lazy(() => RegistrationUpdateOneRequiredWithoutReferralNestedInputSchema).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutReferralsNestedInputSchema).optional(),
});

export const ReferralUncheckedUpdateWithoutReferredUsersInputSchema: z.ZodType<Prisma.ReferralUncheckedUpdateWithoutReferredUsersInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  registrationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const RegistrationUpsertWithoutReferralUsageInputSchema: z.ZodType<Prisma.RegistrationUpsertWithoutReferralUsageInput> = z.strictObject({
  update: z.union([ z.lazy(() => RegistrationUpdateWithoutReferralUsageInputSchema), z.lazy(() => RegistrationUncheckedUpdateWithoutReferralUsageInputSchema) ]),
  create: z.union([ z.lazy(() => RegistrationCreateWithoutReferralUsageInputSchema), z.lazy(() => RegistrationUncheckedCreateWithoutReferralUsageInputSchema) ]),
  where: z.lazy(() => RegistrationWhereInputSchema).optional(),
});

export const RegistrationUpdateToOneWithWhereWithoutReferralUsageInputSchema: z.ZodType<Prisma.RegistrationUpdateToOneWithWhereWithoutReferralUsageInput> = z.strictObject({
  where: z.lazy(() => RegistrationWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => RegistrationUpdateWithoutReferralUsageInputSchema), z.lazy(() => RegistrationUncheckedUpdateWithoutReferralUsageInputSchema) ]),
});

export const RegistrationUpdateWithoutReferralUsageInputSchema: z.ZodType<Prisma.RegistrationUpdateWithoutReferralUsageInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutRegistrationsNestedInputSchema).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutRegistrationsNestedInputSchema).optional(),
  ticket: z.lazy(() => TicketUpdateOneRequiredWithoutRegistrationsNestedInputSchema).optional(),
  referrals: z.lazy(() => RegistrationUpdateManyWithoutReferrerNestedInputSchema).optional(),
  referrer: z.lazy(() => RegistrationUpdateOneWithoutReferralsNestedInputSchema).optional(),
  referral: z.lazy(() => ReferralUpdateOneWithoutRegistrationNestedInputSchema).optional(),
});

export const RegistrationUncheckedUpdateWithoutReferralUsageInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateWithoutReferralUsageInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ticketId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  referredBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  referrals: z.lazy(() => RegistrationUncheckedUpdateManyWithoutReferrerNestedInputSchema).optional(),
  referral: z.lazy(() => ReferralUncheckedUpdateOneWithoutRegistrationNestedInputSchema).optional(),
});

export const EventUpsertWithoutReferralUsageInputSchema: z.ZodType<Prisma.EventUpsertWithoutReferralUsageInput> = z.strictObject({
  update: z.union([ z.lazy(() => EventUpdateWithoutReferralUsageInputSchema), z.lazy(() => EventUncheckedUpdateWithoutReferralUsageInputSchema) ]),
  create: z.union([ z.lazy(() => EventCreateWithoutReferralUsageInputSchema), z.lazy(() => EventUncheckedCreateWithoutReferralUsageInputSchema) ]),
  where: z.lazy(() => EventWhereInputSchema).optional(),
});

export const EventUpdateToOneWithWhereWithoutReferralUsageInputSchema: z.ZodType<Prisma.EventUpdateToOneWithWhereWithoutReferralUsageInput> = z.strictObject({
  where: z.lazy(() => EventWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => EventUpdateWithoutReferralUsageInputSchema), z.lazy(() => EventUncheckedUpdateWithoutReferralUsageInputSchema) ]),
});

export const EventUpdateWithoutReferralUsageInputSchema: z.ZodType<Prisma.EventUpdateWithoutReferralUsageInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ogImage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landingPage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  googleSheetsUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hideEvent: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  useOpass: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  tickets: z.lazy(() => TicketUpdateManyWithoutEventNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUpdateManyWithoutEventNestedInputSchema).optional(),
  referrals: z.lazy(() => ReferralUpdateManyWithoutEventNestedInputSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const EventUncheckedUpdateWithoutReferralUsageInputSchema: z.ZodType<Prisma.EventUncheckedUpdateWithoutReferralUsageInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  location: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ogImage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  landingPage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  googleSheetsUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hideEvent: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  useOpass: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  tickets: z.lazy(() => TicketUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  referrals: z.lazy(() => ReferralUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
  formFields: z.lazy(() => EventFormFieldsUncheckedUpdateManyWithoutEventNestedInputSchema).optional(),
});

export const TicketCreateWithoutInvitationCodesInputSchema: z.ZodType<Prisma.TicketCreateWithoutInvitationCodesInput> = z.strictObject({
  id: z.cuid().optional(),
  order: z.number().int().optional(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  price: z.number().int(),
  quantity: z.number().int(),
  soldCount: z.number().int().optional(),
  saleStart: z.coerce.date().optional().nullable(),
  saleEnd: z.coerce.date().optional().nullable(),
  requireInviteCode: z.boolean().optional(),
  requireSmsVerification: z.boolean().optional(),
  hidden: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  event: z.lazy(() => EventCreateNestedOneWithoutTicketsInputSchema),
  registrations: z.lazy(() => RegistrationCreateNestedManyWithoutTicketInputSchema).optional(),
});

export const TicketUncheckedCreateWithoutInvitationCodesInputSchema: z.ZodType<Prisma.TicketUncheckedCreateWithoutInvitationCodesInput> = z.strictObject({
  id: z.cuid().optional(),
  eventId: z.string(),
  order: z.number().int().optional(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  price: z.number().int(),
  quantity: z.number().int(),
  soldCount: z.number().int().optional(),
  saleStart: z.coerce.date().optional().nullable(),
  saleEnd: z.coerce.date().optional().nullable(),
  requireInviteCode: z.boolean().optional(),
  requireSmsVerification: z.boolean().optional(),
  hidden: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  registrations: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutTicketInputSchema).optional(),
});

export const TicketCreateOrConnectWithoutInvitationCodesInputSchema: z.ZodType<Prisma.TicketCreateOrConnectWithoutInvitationCodesInput> = z.strictObject({
  where: z.lazy(() => TicketWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TicketCreateWithoutInvitationCodesInputSchema), z.lazy(() => TicketUncheckedCreateWithoutInvitationCodesInputSchema) ]),
});

export const TicketUpsertWithoutInvitationCodesInputSchema: z.ZodType<Prisma.TicketUpsertWithoutInvitationCodesInput> = z.strictObject({
  update: z.union([ z.lazy(() => TicketUpdateWithoutInvitationCodesInputSchema), z.lazy(() => TicketUncheckedUpdateWithoutInvitationCodesInputSchema) ]),
  create: z.union([ z.lazy(() => TicketCreateWithoutInvitationCodesInputSchema), z.lazy(() => TicketUncheckedCreateWithoutInvitationCodesInputSchema) ]),
  where: z.lazy(() => TicketWhereInputSchema).optional(),
});

export const TicketUpdateToOneWithWhereWithoutInvitationCodesInputSchema: z.ZodType<Prisma.TicketUpdateToOneWithWhereWithoutInvitationCodesInput> = z.strictObject({
  where: z.lazy(() => TicketWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => TicketUpdateWithoutInvitationCodesInputSchema), z.lazy(() => TicketUncheckedUpdateWithoutInvitationCodesInputSchema) ]),
});

export const TicketUpdateWithoutInvitationCodesInputSchema: z.ZodType<Prisma.TicketUpdateWithoutInvitationCodesInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  quantity: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  soldCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  saleStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  requireInviteCode: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  requireSmsVerification: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hidden: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutTicketsNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUpdateManyWithoutTicketNestedInputSchema).optional(),
});

export const TicketUncheckedUpdateWithoutInvitationCodesInputSchema: z.ZodType<Prisma.TicketUncheckedUpdateWithoutInvitationCodesInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  quantity: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  soldCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  saleStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  requireInviteCode: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  requireSmsVerification: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hidden: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  registrations: z.lazy(() => RegistrationUncheckedUpdateManyWithoutTicketNestedInputSchema).optional(),
});

export const UserCreateWithoutEmailCampaignsInputSchema: z.ZodType<Prisma.UserCreateWithoutEmailCampaignsInput> = z.strictObject({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().optional().nullable(),
  role: z.string().optional(),
  permissions: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  phoneNumber: z.string().optional().nullable(),
  phoneVerified: z.boolean().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  sessions: z.lazy(() => SessionCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountCreateNestedManyWithoutUserInputSchema).optional(),
  registrations: z.lazy(() => RegistrationCreateNestedManyWithoutUserInputSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateWithoutEmailCampaignsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutEmailCampaignsInput> = z.strictObject({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().optional().nullable(),
  role: z.string().optional(),
  permissions: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  phoneNumber: z.string().optional().nullable(),
  phoneVerified: z.boolean().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  sessions: z.lazy(() => SessionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserCreateOrConnectWithoutEmailCampaignsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutEmailCampaignsInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutEmailCampaignsInputSchema), z.lazy(() => UserUncheckedCreateWithoutEmailCampaignsInputSchema) ]),
});

export const UserUpsertWithoutEmailCampaignsInputSchema: z.ZodType<Prisma.UserUpsertWithoutEmailCampaignsInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutEmailCampaignsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutEmailCampaignsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutEmailCampaignsInputSchema), z.lazy(() => UserUncheckedCreateWithoutEmailCampaignsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutEmailCampaignsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutEmailCampaignsInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutEmailCampaignsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutEmailCampaignsInputSchema) ]),
});

export const UserUpdateWithoutEmailCampaignsInputSchema: z.ZodType<Prisma.UserUpdateWithoutEmailCampaignsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  permissions: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  phoneVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUpdateManyWithoutUserNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUpdateManyWithoutUserNestedInputSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutEmailCampaignsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutEmailCampaignsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  permissions: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  phoneVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  smsVerifications: z.lazy(() => SmsVerificationUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserCreateWithoutSmsVerificationsInputSchema: z.ZodType<Prisma.UserCreateWithoutSmsVerificationsInput> = z.strictObject({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().optional().nullable(),
  role: z.string().optional(),
  permissions: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  phoneNumber: z.string().optional().nullable(),
  phoneVerified: z.boolean().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  sessions: z.lazy(() => SessionCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountCreateNestedManyWithoutUserInputSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignCreateNestedManyWithoutUserInputSchema).optional(),
  registrations: z.lazy(() => RegistrationCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateWithoutSmsVerificationsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutSmsVerificationsInput> = z.strictObject({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().optional().nullable(),
  role: z.string().optional(),
  permissions: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  phoneNumber: z.string().optional().nullable(),
  phoneVerified: z.boolean().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  sessions: z.lazy(() => SessionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserCreateOrConnectWithoutSmsVerificationsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutSmsVerificationsInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutSmsVerificationsInputSchema), z.lazy(() => UserUncheckedCreateWithoutSmsVerificationsInputSchema) ]),
});

export const UserUpsertWithoutSmsVerificationsInputSchema: z.ZodType<Prisma.UserUpsertWithoutSmsVerificationsInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutSmsVerificationsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutSmsVerificationsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutSmsVerificationsInputSchema), z.lazy(() => UserUncheckedCreateWithoutSmsVerificationsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutSmsVerificationsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutSmsVerificationsInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutSmsVerificationsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutSmsVerificationsInputSchema) ]),
});

export const UserUpdateWithoutSmsVerificationsInputSchema: z.ZodType<Prisma.UserUpdateWithoutSmsVerificationsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  permissions: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  phoneVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUpdateManyWithoutUserNestedInputSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignUpdateManyWithoutUserNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutSmsVerificationsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutSmsVerificationsInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  permissions: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  phoneVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  emailCampaigns: z.lazy(() => EmailCampaignUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const SessionCreateManyUserInputSchema: z.ZodType<Prisma.SessionCreateManyUserInput> = z.strictObject({
  id: z.string(),
  expiresAt: z.coerce.date(),
  token: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
});

export const AccountCreateManyUserInputSchema: z.ZodType<Prisma.AccountCreateManyUserInput> = z.strictObject({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
  idToken: z.string().optional().nullable(),
  accessTokenExpiresAt: z.coerce.date().optional().nullable(),
  refreshTokenExpiresAt: z.coerce.date().optional().nullable(),
  scope: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const EmailCampaignCreateManyUserInputSchema: z.ZodType<Prisma.EmailCampaignCreateManyUserInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  subject: z.string(),
  content: z.string(),
  recipientFilter: z.string().optional().nullable(),
  status: z.string().optional(),
  sentCount: z.number().int().optional(),
  totalCount: z.number().int().optional(),
  scheduledAt: z.coerce.date().optional().nullable(),
  sentAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const RegistrationCreateManyUserInputSchema: z.ZodType<Prisma.RegistrationCreateManyUserInput> = z.strictObject({
  id: z.cuid().optional(),
  eventId: z.string(),
  ticketId: z.string(),
  email: z.string(),
  formData: z.string().optional().nullable(),
  status: z.string().optional(),
  referredBy: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const SmsVerificationCreateManyUserInputSchema: z.ZodType<Prisma.SmsVerificationCreateManyUserInput> = z.strictObject({
  id: z.cuid().optional(),
  phoneNumber: z.string(),
  code: z.string(),
  verified: z.boolean().optional(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const SessionUpdateWithoutUserInputSchema: z.ZodType<Prisma.SessionUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userAgent: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SessionUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userAgent: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SessionUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateManyWithoutUserInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userAgent: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const AccountUpdateWithoutUserInputSchema: z.ZodType<Prisma.AccountUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accessToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  idToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AccountUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.AccountUncheckedUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accessToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  idToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AccountUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.AccountUncheckedUpdateManyWithoutUserInput> = z.strictObject({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accessToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  idToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const EmailCampaignUpdateWithoutUserInputSchema: z.ZodType<Prisma.EmailCampaignUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subject: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  recipientFilter: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sentCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sentAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const EmailCampaignUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.EmailCampaignUncheckedUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subject: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  recipientFilter: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sentCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sentAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const EmailCampaignUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.EmailCampaignUncheckedUpdateManyWithoutUserInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subject: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  recipientFilter: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sentCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sentAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const RegistrationUpdateWithoutUserInputSchema: z.ZodType<Prisma.RegistrationUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutRegistrationsNestedInputSchema).optional(),
  ticket: z.lazy(() => TicketUpdateOneRequiredWithoutRegistrationsNestedInputSchema).optional(),
  referrals: z.lazy(() => RegistrationUpdateManyWithoutReferrerNestedInputSchema).optional(),
  referrer: z.lazy(() => RegistrationUpdateOneWithoutReferralsNestedInputSchema).optional(),
  referral: z.lazy(() => ReferralUpdateOneWithoutRegistrationNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUpdateManyWithoutRegistrationNestedInputSchema).optional(),
});

export const RegistrationUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ticketId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  referredBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  referrals: z.lazy(() => RegistrationUncheckedUpdateManyWithoutReferrerNestedInputSchema).optional(),
  referral: z.lazy(() => ReferralUncheckedUpdateOneWithoutRegistrationNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedUpdateManyWithoutRegistrationNestedInputSchema).optional(),
});

export const RegistrationUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateManyWithoutUserInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ticketId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  referredBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const SmsVerificationUpdateWithoutUserInputSchema: z.ZodType<Prisma.SmsVerificationUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  verified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const SmsVerificationUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.SmsVerificationUncheckedUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  verified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const SmsVerificationUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.SmsVerificationUncheckedUpdateManyWithoutUserInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phoneNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  verified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TicketCreateManyEventInputSchema: z.ZodType<Prisma.TicketCreateManyEventInput> = z.strictObject({
  id: z.cuid().optional(),
  order: z.number().int().optional(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  price: z.number().int(),
  quantity: z.number().int(),
  soldCount: z.number().int().optional(),
  saleStart: z.coerce.date().optional().nullable(),
  saleEnd: z.coerce.date().optional().nullable(),
  requireInviteCode: z.boolean().optional(),
  requireSmsVerification: z.boolean().optional(),
  hidden: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const RegistrationCreateManyEventInputSchema: z.ZodType<Prisma.RegistrationCreateManyEventInput> = z.strictObject({
  id: z.cuid().optional(),
  userId: z.string(),
  ticketId: z.string(),
  email: z.string(),
  formData: z.string().optional().nullable(),
  status: z.string().optional(),
  referredBy: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const ReferralCreateManyEventInputSchema: z.ZodType<Prisma.ReferralCreateManyEventInput> = z.strictObject({
  id: z.cuid().optional(),
  code: z.string(),
  registrationId: z.string(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const ReferralUsageCreateManyEventInputSchema: z.ZodType<Prisma.ReferralUsageCreateManyEventInput> = z.strictObject({
  id: z.cuid().optional(),
  referralId: z.string(),
  registrationId: z.string(),
  usedAt: z.coerce.date().optional(),
});

export const EventFormFieldsCreateManyEventInputSchema: z.ZodType<Prisma.EventFormFieldsCreateManyEventInput> = z.strictObject({
  id: z.cuid().optional(),
  order: z.number().int(),
  type: z.string(),
  validater: z.string().optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  placeholder: z.string().optional().nullable(),
  required: z.boolean().optional(),
  values: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  filters: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  prompts: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const TicketUpdateWithoutEventInputSchema: z.ZodType<Prisma.TicketUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  quantity: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  soldCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  saleStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  requireInviteCode: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  requireSmsVerification: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hidden: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  registrations: z.lazy(() => RegistrationUpdateManyWithoutTicketNestedInputSchema).optional(),
  invitationCodes: z.lazy(() => InvitationCodeUpdateManyWithoutTicketNestedInputSchema).optional(),
});

export const TicketUncheckedUpdateWithoutEventInputSchema: z.ZodType<Prisma.TicketUncheckedUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  quantity: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  soldCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  saleStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  requireInviteCode: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  requireSmsVerification: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hidden: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  registrations: z.lazy(() => RegistrationUncheckedUpdateManyWithoutTicketNestedInputSchema).optional(),
  invitationCodes: z.lazy(() => InvitationCodeUncheckedUpdateManyWithoutTicketNestedInputSchema).optional(),
});

export const TicketUncheckedUpdateManyWithoutEventInputSchema: z.ZodType<Prisma.TicketUncheckedUpdateManyWithoutEventInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  plainDescription: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  quantity: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  soldCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  saleStart: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  saleEnd: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  requireInviteCode: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  requireSmsVerification: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  hidden: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const RegistrationUpdateWithoutEventInputSchema: z.ZodType<Prisma.RegistrationUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutRegistrationsNestedInputSchema).optional(),
  ticket: z.lazy(() => TicketUpdateOneRequiredWithoutRegistrationsNestedInputSchema).optional(),
  referrals: z.lazy(() => RegistrationUpdateManyWithoutReferrerNestedInputSchema).optional(),
  referrer: z.lazy(() => RegistrationUpdateOneWithoutReferralsNestedInputSchema).optional(),
  referral: z.lazy(() => ReferralUpdateOneWithoutRegistrationNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUpdateManyWithoutRegistrationNestedInputSchema).optional(),
});

export const RegistrationUncheckedUpdateWithoutEventInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ticketId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  referredBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  referrals: z.lazy(() => RegistrationUncheckedUpdateManyWithoutReferrerNestedInputSchema).optional(),
  referral: z.lazy(() => ReferralUncheckedUpdateOneWithoutRegistrationNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedUpdateManyWithoutRegistrationNestedInputSchema).optional(),
});

export const RegistrationUncheckedUpdateManyWithoutEventInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateManyWithoutEventInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ticketId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  referredBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReferralUpdateWithoutEventInputSchema: z.ZodType<Prisma.ReferralUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  registration: z.lazy(() => RegistrationUpdateOneRequiredWithoutReferralNestedInputSchema).optional(),
  referredUsers: z.lazy(() => ReferralUsageUpdateManyWithoutReferralNestedInputSchema).optional(),
});

export const ReferralUncheckedUpdateWithoutEventInputSchema: z.ZodType<Prisma.ReferralUncheckedUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  registrationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  referredUsers: z.lazy(() => ReferralUsageUncheckedUpdateManyWithoutReferralNestedInputSchema).optional(),
});

export const ReferralUncheckedUpdateManyWithoutEventInputSchema: z.ZodType<Prisma.ReferralUncheckedUpdateManyWithoutEventInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  registrationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReferralUsageUpdateWithoutEventInputSchema: z.ZodType<Prisma.ReferralUsageUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  usedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  referral: z.lazy(() => ReferralUpdateOneRequiredWithoutReferredUsersNestedInputSchema).optional(),
  registration: z.lazy(() => RegistrationUpdateOneRequiredWithoutReferralUsageNestedInputSchema).optional(),
});

export const ReferralUsageUncheckedUpdateWithoutEventInputSchema: z.ZodType<Prisma.ReferralUsageUncheckedUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  referralId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  registrationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  usedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReferralUsageUncheckedUpdateManyWithoutEventInputSchema: z.ZodType<Prisma.ReferralUsageUncheckedUpdateManyWithoutEventInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  referralId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  registrationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  usedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const EventFormFieldsUpdateWithoutEventInputSchema: z.ZodType<Prisma.EventFormFieldsUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  validater: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  placeholder: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  required: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  values: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  filters: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  prompts: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const EventFormFieldsUncheckedUpdateWithoutEventInputSchema: z.ZodType<Prisma.EventFormFieldsUncheckedUpdateWithoutEventInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  validater: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  placeholder: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  required: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  values: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  filters: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  prompts: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const EventFormFieldsUncheckedUpdateManyWithoutEventInputSchema: z.ZodType<Prisma.EventFormFieldsUncheckedUpdateManyWithoutEventInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  validater: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  description: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  placeholder: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  required: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  values: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  filters: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  prompts: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const RegistrationCreateManyTicketInputSchema: z.ZodType<Prisma.RegistrationCreateManyTicketInput> = z.strictObject({
  id: z.cuid().optional(),
  userId: z.string(),
  eventId: z.string(),
  email: z.string(),
  formData: z.string().optional().nullable(),
  status: z.string().optional(),
  referredBy: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const InvitationCodeCreateManyTicketInputSchema: z.ZodType<Prisma.InvitationCodeCreateManyTicketInput> = z.strictObject({
  id: z.cuid().optional(),
  code: z.string(),
  name: z.string().optional().nullable(),
  usageLimit: z.number().int().optional().nullable(),
  usedCount: z.number().int().optional(),
  validFrom: z.coerce.date().optional().nullable(),
  validUntil: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const RegistrationUpdateWithoutTicketInputSchema: z.ZodType<Prisma.RegistrationUpdateWithoutTicketInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutRegistrationsNestedInputSchema).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutRegistrationsNestedInputSchema).optional(),
  referrals: z.lazy(() => RegistrationUpdateManyWithoutReferrerNestedInputSchema).optional(),
  referrer: z.lazy(() => RegistrationUpdateOneWithoutReferralsNestedInputSchema).optional(),
  referral: z.lazy(() => ReferralUpdateOneWithoutRegistrationNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUpdateManyWithoutRegistrationNestedInputSchema).optional(),
});

export const RegistrationUncheckedUpdateWithoutTicketInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateWithoutTicketInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  referredBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  referrals: z.lazy(() => RegistrationUncheckedUpdateManyWithoutReferrerNestedInputSchema).optional(),
  referral: z.lazy(() => ReferralUncheckedUpdateOneWithoutRegistrationNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedUpdateManyWithoutRegistrationNestedInputSchema).optional(),
});

export const RegistrationUncheckedUpdateManyWithoutTicketInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateManyWithoutTicketInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  referredBy: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const InvitationCodeUpdateWithoutTicketInputSchema: z.ZodType<Prisma.InvitationCodeUpdateWithoutTicketInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usageLimit: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usedCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  validFrom: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  validUntil: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const InvitationCodeUncheckedUpdateWithoutTicketInputSchema: z.ZodType<Prisma.InvitationCodeUncheckedUpdateWithoutTicketInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usageLimit: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usedCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  validFrom: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  validUntil: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const InvitationCodeUncheckedUpdateManyWithoutTicketInputSchema: z.ZodType<Prisma.InvitationCodeUncheckedUpdateManyWithoutTicketInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usageLimit: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usedCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  validFrom: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  validUntil: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const RegistrationCreateManyReferrerInputSchema: z.ZodType<Prisma.RegistrationCreateManyReferrerInput> = z.strictObject({
  id: z.cuid().optional(),
  userId: z.string(),
  eventId: z.string(),
  ticketId: z.string(),
  email: z.string(),
  formData: z.string().optional().nullable(),
  status: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const ReferralUsageCreateManyRegistrationInputSchema: z.ZodType<Prisma.ReferralUsageCreateManyRegistrationInput> = z.strictObject({
  id: z.cuid().optional(),
  referralId: z.string(),
  eventId: z.string(),
  usedAt: z.coerce.date().optional(),
});

export const RegistrationUpdateWithoutReferrerInputSchema: z.ZodType<Prisma.RegistrationUpdateWithoutReferrerInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutRegistrationsNestedInputSchema).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutRegistrationsNestedInputSchema).optional(),
  ticket: z.lazy(() => TicketUpdateOneRequiredWithoutRegistrationsNestedInputSchema).optional(),
  referrals: z.lazy(() => RegistrationUpdateManyWithoutReferrerNestedInputSchema).optional(),
  referral: z.lazy(() => ReferralUpdateOneWithoutRegistrationNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUpdateManyWithoutRegistrationNestedInputSchema).optional(),
});

export const RegistrationUncheckedUpdateWithoutReferrerInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateWithoutReferrerInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ticketId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  referrals: z.lazy(() => RegistrationUncheckedUpdateManyWithoutReferrerNestedInputSchema).optional(),
  referral: z.lazy(() => ReferralUncheckedUpdateOneWithoutRegistrationNestedInputSchema).optional(),
  referralUsage: z.lazy(() => ReferralUsageUncheckedUpdateManyWithoutRegistrationNestedInputSchema).optional(),
});

export const RegistrationUncheckedUpdateManyWithoutReferrerInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateManyWithoutReferrerInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ticketId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  formData: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReferralUsageUpdateWithoutRegistrationInputSchema: z.ZodType<Prisma.ReferralUsageUpdateWithoutRegistrationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  usedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  referral: z.lazy(() => ReferralUpdateOneRequiredWithoutReferredUsersNestedInputSchema).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutReferralUsageNestedInputSchema).optional(),
});

export const ReferralUsageUncheckedUpdateWithoutRegistrationInputSchema: z.ZodType<Prisma.ReferralUsageUncheckedUpdateWithoutRegistrationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  referralId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  usedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReferralUsageUncheckedUpdateManyWithoutRegistrationInputSchema: z.ZodType<Prisma.ReferralUsageUncheckedUpdateManyWithoutRegistrationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  referralId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  usedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReferralUsageCreateManyReferralInputSchema: z.ZodType<Prisma.ReferralUsageCreateManyReferralInput> = z.strictObject({
  id: z.cuid().optional(),
  registrationId: z.string(),
  eventId: z.string(),
  usedAt: z.coerce.date().optional(),
});

export const ReferralUsageUpdateWithoutReferralInputSchema: z.ZodType<Prisma.ReferralUsageUpdateWithoutReferralInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  usedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  registration: z.lazy(() => RegistrationUpdateOneRequiredWithoutReferralUsageNestedInputSchema).optional(),
  event: z.lazy(() => EventUpdateOneRequiredWithoutReferralUsageNestedInputSchema).optional(),
});

export const ReferralUsageUncheckedUpdateWithoutReferralInputSchema: z.ZodType<Prisma.ReferralUsageUncheckedUpdateWithoutReferralInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  registrationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  usedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReferralUsageUncheckedUpdateManyWithoutReferralInputSchema: z.ZodType<Prisma.ReferralUsageUncheckedUpdateManyWithoutReferralInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  registrationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  usedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

export const UserFindFirstArgsSchema: z.ZodType<Prisma.UserFindFirstArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserFindFirstOrThrowArgsSchema: z.ZodType<Prisma.UserFindFirstOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserFindManyArgsSchema: z.ZodType<Prisma.UserFindManyArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserAggregateArgsSchema: z.ZodType<Prisma.UserAggregateArgs> = z.object({
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const UserGroupByArgsSchema: z.ZodType<Prisma.UserGroupByArgs> = z.object({
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithAggregationInputSchema.array(), UserOrderByWithAggregationInputSchema ]).optional(),
  by: UserScalarFieldEnumSchema.array(), 
  having: UserScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const UserFindUniqueArgsSchema: z.ZodType<Prisma.UserFindUniqueArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.UserFindUniqueOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const SessionFindFirstArgsSchema: z.ZodType<Prisma.SessionFindFirstArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  where: SessionWhereInputSchema.optional(), 
  orderBy: z.union([ SessionOrderByWithRelationInputSchema.array(), SessionOrderByWithRelationInputSchema ]).optional(),
  cursor: SessionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SessionScalarFieldEnumSchema, SessionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SessionFindFirstOrThrowArgsSchema: z.ZodType<Prisma.SessionFindFirstOrThrowArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  where: SessionWhereInputSchema.optional(), 
  orderBy: z.union([ SessionOrderByWithRelationInputSchema.array(), SessionOrderByWithRelationInputSchema ]).optional(),
  cursor: SessionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SessionScalarFieldEnumSchema, SessionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SessionFindManyArgsSchema: z.ZodType<Prisma.SessionFindManyArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  where: SessionWhereInputSchema.optional(), 
  orderBy: z.union([ SessionOrderByWithRelationInputSchema.array(), SessionOrderByWithRelationInputSchema ]).optional(),
  cursor: SessionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SessionScalarFieldEnumSchema, SessionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SessionAggregateArgsSchema: z.ZodType<Prisma.SessionAggregateArgs> = z.object({
  where: SessionWhereInputSchema.optional(), 
  orderBy: z.union([ SessionOrderByWithRelationInputSchema.array(), SessionOrderByWithRelationInputSchema ]).optional(),
  cursor: SessionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const SessionGroupByArgsSchema: z.ZodType<Prisma.SessionGroupByArgs> = z.object({
  where: SessionWhereInputSchema.optional(), 
  orderBy: z.union([ SessionOrderByWithAggregationInputSchema.array(), SessionOrderByWithAggregationInputSchema ]).optional(),
  by: SessionScalarFieldEnumSchema.array(), 
  having: SessionScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const SessionFindUniqueArgsSchema: z.ZodType<Prisma.SessionFindUniqueArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  where: SessionWhereUniqueInputSchema, 
}).strict();

export const SessionFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.SessionFindUniqueOrThrowArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  where: SessionWhereUniqueInputSchema, 
}).strict();

export const AccountFindFirstArgsSchema: z.ZodType<Prisma.AccountFindFirstArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  where: AccountWhereInputSchema.optional(), 
  orderBy: z.union([ AccountOrderByWithRelationInputSchema.array(), AccountOrderByWithRelationInputSchema ]).optional(),
  cursor: AccountWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AccountScalarFieldEnumSchema, AccountScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AccountFindFirstOrThrowArgsSchema: z.ZodType<Prisma.AccountFindFirstOrThrowArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  where: AccountWhereInputSchema.optional(), 
  orderBy: z.union([ AccountOrderByWithRelationInputSchema.array(), AccountOrderByWithRelationInputSchema ]).optional(),
  cursor: AccountWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AccountScalarFieldEnumSchema, AccountScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AccountFindManyArgsSchema: z.ZodType<Prisma.AccountFindManyArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  where: AccountWhereInputSchema.optional(), 
  orderBy: z.union([ AccountOrderByWithRelationInputSchema.array(), AccountOrderByWithRelationInputSchema ]).optional(),
  cursor: AccountWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AccountScalarFieldEnumSchema, AccountScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AccountAggregateArgsSchema: z.ZodType<Prisma.AccountAggregateArgs> = z.object({
  where: AccountWhereInputSchema.optional(), 
  orderBy: z.union([ AccountOrderByWithRelationInputSchema.array(), AccountOrderByWithRelationInputSchema ]).optional(),
  cursor: AccountWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const AccountGroupByArgsSchema: z.ZodType<Prisma.AccountGroupByArgs> = z.object({
  where: AccountWhereInputSchema.optional(), 
  orderBy: z.union([ AccountOrderByWithAggregationInputSchema.array(), AccountOrderByWithAggregationInputSchema ]).optional(),
  by: AccountScalarFieldEnumSchema.array(), 
  having: AccountScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const AccountFindUniqueArgsSchema: z.ZodType<Prisma.AccountFindUniqueArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  where: AccountWhereUniqueInputSchema, 
}).strict();

export const AccountFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.AccountFindUniqueOrThrowArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  where: AccountWhereUniqueInputSchema, 
}).strict();

export const VerificationFindFirstArgsSchema: z.ZodType<Prisma.VerificationFindFirstArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  where: VerificationWhereInputSchema.optional(), 
  orderBy: z.union([ VerificationOrderByWithRelationInputSchema.array(), VerificationOrderByWithRelationInputSchema ]).optional(),
  cursor: VerificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ VerificationScalarFieldEnumSchema, VerificationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const VerificationFindFirstOrThrowArgsSchema: z.ZodType<Prisma.VerificationFindFirstOrThrowArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  where: VerificationWhereInputSchema.optional(), 
  orderBy: z.union([ VerificationOrderByWithRelationInputSchema.array(), VerificationOrderByWithRelationInputSchema ]).optional(),
  cursor: VerificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ VerificationScalarFieldEnumSchema, VerificationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const VerificationFindManyArgsSchema: z.ZodType<Prisma.VerificationFindManyArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  where: VerificationWhereInputSchema.optional(), 
  orderBy: z.union([ VerificationOrderByWithRelationInputSchema.array(), VerificationOrderByWithRelationInputSchema ]).optional(),
  cursor: VerificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ VerificationScalarFieldEnumSchema, VerificationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const VerificationAggregateArgsSchema: z.ZodType<Prisma.VerificationAggregateArgs> = z.object({
  where: VerificationWhereInputSchema.optional(), 
  orderBy: z.union([ VerificationOrderByWithRelationInputSchema.array(), VerificationOrderByWithRelationInputSchema ]).optional(),
  cursor: VerificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const VerificationGroupByArgsSchema: z.ZodType<Prisma.VerificationGroupByArgs> = z.object({
  where: VerificationWhereInputSchema.optional(), 
  orderBy: z.union([ VerificationOrderByWithAggregationInputSchema.array(), VerificationOrderByWithAggregationInputSchema ]).optional(),
  by: VerificationScalarFieldEnumSchema.array(), 
  having: VerificationScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const VerificationFindUniqueArgsSchema: z.ZodType<Prisma.VerificationFindUniqueArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  where: VerificationWhereUniqueInputSchema, 
}).strict();

export const VerificationFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.VerificationFindUniqueOrThrowArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  where: VerificationWhereUniqueInputSchema, 
}).strict();

export const EventFindFirstArgsSchema: z.ZodType<Prisma.EventFindFirstArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  where: EventWhereInputSchema.optional(), 
  orderBy: z.union([ EventOrderByWithRelationInputSchema.array(), EventOrderByWithRelationInputSchema ]).optional(),
  cursor: EventWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ EventScalarFieldEnumSchema, EventScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const EventFindFirstOrThrowArgsSchema: z.ZodType<Prisma.EventFindFirstOrThrowArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  where: EventWhereInputSchema.optional(), 
  orderBy: z.union([ EventOrderByWithRelationInputSchema.array(), EventOrderByWithRelationInputSchema ]).optional(),
  cursor: EventWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ EventScalarFieldEnumSchema, EventScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const EventFindManyArgsSchema: z.ZodType<Prisma.EventFindManyArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  where: EventWhereInputSchema.optional(), 
  orderBy: z.union([ EventOrderByWithRelationInputSchema.array(), EventOrderByWithRelationInputSchema ]).optional(),
  cursor: EventWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ EventScalarFieldEnumSchema, EventScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const EventAggregateArgsSchema: z.ZodType<Prisma.EventAggregateArgs> = z.object({
  where: EventWhereInputSchema.optional(), 
  orderBy: z.union([ EventOrderByWithRelationInputSchema.array(), EventOrderByWithRelationInputSchema ]).optional(),
  cursor: EventWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const EventGroupByArgsSchema: z.ZodType<Prisma.EventGroupByArgs> = z.object({
  where: EventWhereInputSchema.optional(), 
  orderBy: z.union([ EventOrderByWithAggregationInputSchema.array(), EventOrderByWithAggregationInputSchema ]).optional(),
  by: EventScalarFieldEnumSchema.array(), 
  having: EventScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const EventFindUniqueArgsSchema: z.ZodType<Prisma.EventFindUniqueArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  where: EventWhereUniqueInputSchema, 
}).strict();

export const EventFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.EventFindUniqueOrThrowArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  where: EventWhereUniqueInputSchema, 
}).strict();

export const TicketFindFirstArgsSchema: z.ZodType<Prisma.TicketFindFirstArgs> = z.object({
  select: TicketSelectSchema.optional(),
  include: TicketIncludeSchema.optional(),
  where: TicketWhereInputSchema.optional(), 
  orderBy: z.union([ TicketOrderByWithRelationInputSchema.array(), TicketOrderByWithRelationInputSchema ]).optional(),
  cursor: TicketWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TicketScalarFieldEnumSchema, TicketScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TicketFindFirstOrThrowArgsSchema: z.ZodType<Prisma.TicketFindFirstOrThrowArgs> = z.object({
  select: TicketSelectSchema.optional(),
  include: TicketIncludeSchema.optional(),
  where: TicketWhereInputSchema.optional(), 
  orderBy: z.union([ TicketOrderByWithRelationInputSchema.array(), TicketOrderByWithRelationInputSchema ]).optional(),
  cursor: TicketWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TicketScalarFieldEnumSchema, TicketScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TicketFindManyArgsSchema: z.ZodType<Prisma.TicketFindManyArgs> = z.object({
  select: TicketSelectSchema.optional(),
  include: TicketIncludeSchema.optional(),
  where: TicketWhereInputSchema.optional(), 
  orderBy: z.union([ TicketOrderByWithRelationInputSchema.array(), TicketOrderByWithRelationInputSchema ]).optional(),
  cursor: TicketWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TicketScalarFieldEnumSchema, TicketScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TicketAggregateArgsSchema: z.ZodType<Prisma.TicketAggregateArgs> = z.object({
  where: TicketWhereInputSchema.optional(), 
  orderBy: z.union([ TicketOrderByWithRelationInputSchema.array(), TicketOrderByWithRelationInputSchema ]).optional(),
  cursor: TicketWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const TicketGroupByArgsSchema: z.ZodType<Prisma.TicketGroupByArgs> = z.object({
  where: TicketWhereInputSchema.optional(), 
  orderBy: z.union([ TicketOrderByWithAggregationInputSchema.array(), TicketOrderByWithAggregationInputSchema ]).optional(),
  by: TicketScalarFieldEnumSchema.array(), 
  having: TicketScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const TicketFindUniqueArgsSchema: z.ZodType<Prisma.TicketFindUniqueArgs> = z.object({
  select: TicketSelectSchema.optional(),
  include: TicketIncludeSchema.optional(),
  where: TicketWhereUniqueInputSchema, 
}).strict();

export const TicketFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.TicketFindUniqueOrThrowArgs> = z.object({
  select: TicketSelectSchema.optional(),
  include: TicketIncludeSchema.optional(),
  where: TicketWhereUniqueInputSchema, 
}).strict();

export const EventFormFieldsFindFirstArgsSchema: z.ZodType<Prisma.EventFormFieldsFindFirstArgs> = z.object({
  select: EventFormFieldsSelectSchema.optional(),
  include: EventFormFieldsIncludeSchema.optional(),
  where: EventFormFieldsWhereInputSchema.optional(), 
  orderBy: z.union([ EventFormFieldsOrderByWithRelationInputSchema.array(), EventFormFieldsOrderByWithRelationInputSchema ]).optional(),
  cursor: EventFormFieldsWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ EventFormFieldsScalarFieldEnumSchema, EventFormFieldsScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const EventFormFieldsFindFirstOrThrowArgsSchema: z.ZodType<Prisma.EventFormFieldsFindFirstOrThrowArgs> = z.object({
  select: EventFormFieldsSelectSchema.optional(),
  include: EventFormFieldsIncludeSchema.optional(),
  where: EventFormFieldsWhereInputSchema.optional(), 
  orderBy: z.union([ EventFormFieldsOrderByWithRelationInputSchema.array(), EventFormFieldsOrderByWithRelationInputSchema ]).optional(),
  cursor: EventFormFieldsWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ EventFormFieldsScalarFieldEnumSchema, EventFormFieldsScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const EventFormFieldsFindManyArgsSchema: z.ZodType<Prisma.EventFormFieldsFindManyArgs> = z.object({
  select: EventFormFieldsSelectSchema.optional(),
  include: EventFormFieldsIncludeSchema.optional(),
  where: EventFormFieldsWhereInputSchema.optional(), 
  orderBy: z.union([ EventFormFieldsOrderByWithRelationInputSchema.array(), EventFormFieldsOrderByWithRelationInputSchema ]).optional(),
  cursor: EventFormFieldsWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ EventFormFieldsScalarFieldEnumSchema, EventFormFieldsScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const EventFormFieldsAggregateArgsSchema: z.ZodType<Prisma.EventFormFieldsAggregateArgs> = z.object({
  where: EventFormFieldsWhereInputSchema.optional(), 
  orderBy: z.union([ EventFormFieldsOrderByWithRelationInputSchema.array(), EventFormFieldsOrderByWithRelationInputSchema ]).optional(),
  cursor: EventFormFieldsWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const EventFormFieldsGroupByArgsSchema: z.ZodType<Prisma.EventFormFieldsGroupByArgs> = z.object({
  where: EventFormFieldsWhereInputSchema.optional(), 
  orderBy: z.union([ EventFormFieldsOrderByWithAggregationInputSchema.array(), EventFormFieldsOrderByWithAggregationInputSchema ]).optional(),
  by: EventFormFieldsScalarFieldEnumSchema.array(), 
  having: EventFormFieldsScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const EventFormFieldsFindUniqueArgsSchema: z.ZodType<Prisma.EventFormFieldsFindUniqueArgs> = z.object({
  select: EventFormFieldsSelectSchema.optional(),
  include: EventFormFieldsIncludeSchema.optional(),
  where: EventFormFieldsWhereUniqueInputSchema, 
}).strict();

export const EventFormFieldsFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.EventFormFieldsFindUniqueOrThrowArgs> = z.object({
  select: EventFormFieldsSelectSchema.optional(),
  include: EventFormFieldsIncludeSchema.optional(),
  where: EventFormFieldsWhereUniqueInputSchema, 
}).strict();

export const RegistrationFindFirstArgsSchema: z.ZodType<Prisma.RegistrationFindFirstArgs> = z.object({
  select: RegistrationSelectSchema.optional(),
  include: RegistrationIncludeSchema.optional(),
  where: RegistrationWhereInputSchema.optional(), 
  orderBy: z.union([ RegistrationOrderByWithRelationInputSchema.array(), RegistrationOrderByWithRelationInputSchema ]).optional(),
  cursor: RegistrationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ RegistrationScalarFieldEnumSchema, RegistrationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const RegistrationFindFirstOrThrowArgsSchema: z.ZodType<Prisma.RegistrationFindFirstOrThrowArgs> = z.object({
  select: RegistrationSelectSchema.optional(),
  include: RegistrationIncludeSchema.optional(),
  where: RegistrationWhereInputSchema.optional(), 
  orderBy: z.union([ RegistrationOrderByWithRelationInputSchema.array(), RegistrationOrderByWithRelationInputSchema ]).optional(),
  cursor: RegistrationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ RegistrationScalarFieldEnumSchema, RegistrationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const RegistrationFindManyArgsSchema: z.ZodType<Prisma.RegistrationFindManyArgs> = z.object({
  select: RegistrationSelectSchema.optional(),
  include: RegistrationIncludeSchema.optional(),
  where: RegistrationWhereInputSchema.optional(), 
  orderBy: z.union([ RegistrationOrderByWithRelationInputSchema.array(), RegistrationOrderByWithRelationInputSchema ]).optional(),
  cursor: RegistrationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ RegistrationScalarFieldEnumSchema, RegistrationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const RegistrationAggregateArgsSchema: z.ZodType<Prisma.RegistrationAggregateArgs> = z.object({
  where: RegistrationWhereInputSchema.optional(), 
  orderBy: z.union([ RegistrationOrderByWithRelationInputSchema.array(), RegistrationOrderByWithRelationInputSchema ]).optional(),
  cursor: RegistrationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const RegistrationGroupByArgsSchema: z.ZodType<Prisma.RegistrationGroupByArgs> = z.object({
  where: RegistrationWhereInputSchema.optional(), 
  orderBy: z.union([ RegistrationOrderByWithAggregationInputSchema.array(), RegistrationOrderByWithAggregationInputSchema ]).optional(),
  by: RegistrationScalarFieldEnumSchema.array(), 
  having: RegistrationScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const RegistrationFindUniqueArgsSchema: z.ZodType<Prisma.RegistrationFindUniqueArgs> = z.object({
  select: RegistrationSelectSchema.optional(),
  include: RegistrationIncludeSchema.optional(),
  where: RegistrationWhereUniqueInputSchema, 
}).strict();

export const RegistrationFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.RegistrationFindUniqueOrThrowArgs> = z.object({
  select: RegistrationSelectSchema.optional(),
  include: RegistrationIncludeSchema.optional(),
  where: RegistrationWhereUniqueInputSchema, 
}).strict();

export const ReferralFindFirstArgsSchema: z.ZodType<Prisma.ReferralFindFirstArgs> = z.object({
  select: ReferralSelectSchema.optional(),
  include: ReferralIncludeSchema.optional(),
  where: ReferralWhereInputSchema.optional(), 
  orderBy: z.union([ ReferralOrderByWithRelationInputSchema.array(), ReferralOrderByWithRelationInputSchema ]).optional(),
  cursor: ReferralWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ReferralScalarFieldEnumSchema, ReferralScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ReferralFindFirstOrThrowArgsSchema: z.ZodType<Prisma.ReferralFindFirstOrThrowArgs> = z.object({
  select: ReferralSelectSchema.optional(),
  include: ReferralIncludeSchema.optional(),
  where: ReferralWhereInputSchema.optional(), 
  orderBy: z.union([ ReferralOrderByWithRelationInputSchema.array(), ReferralOrderByWithRelationInputSchema ]).optional(),
  cursor: ReferralWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ReferralScalarFieldEnumSchema, ReferralScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ReferralFindManyArgsSchema: z.ZodType<Prisma.ReferralFindManyArgs> = z.object({
  select: ReferralSelectSchema.optional(),
  include: ReferralIncludeSchema.optional(),
  where: ReferralWhereInputSchema.optional(), 
  orderBy: z.union([ ReferralOrderByWithRelationInputSchema.array(), ReferralOrderByWithRelationInputSchema ]).optional(),
  cursor: ReferralWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ReferralScalarFieldEnumSchema, ReferralScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ReferralAggregateArgsSchema: z.ZodType<Prisma.ReferralAggregateArgs> = z.object({
  where: ReferralWhereInputSchema.optional(), 
  orderBy: z.union([ ReferralOrderByWithRelationInputSchema.array(), ReferralOrderByWithRelationInputSchema ]).optional(),
  cursor: ReferralWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ReferralGroupByArgsSchema: z.ZodType<Prisma.ReferralGroupByArgs> = z.object({
  where: ReferralWhereInputSchema.optional(), 
  orderBy: z.union([ ReferralOrderByWithAggregationInputSchema.array(), ReferralOrderByWithAggregationInputSchema ]).optional(),
  by: ReferralScalarFieldEnumSchema.array(), 
  having: ReferralScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ReferralFindUniqueArgsSchema: z.ZodType<Prisma.ReferralFindUniqueArgs> = z.object({
  select: ReferralSelectSchema.optional(),
  include: ReferralIncludeSchema.optional(),
  where: ReferralWhereUniqueInputSchema, 
}).strict();

export const ReferralFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.ReferralFindUniqueOrThrowArgs> = z.object({
  select: ReferralSelectSchema.optional(),
  include: ReferralIncludeSchema.optional(),
  where: ReferralWhereUniqueInputSchema, 
}).strict();

export const ReferralUsageFindFirstArgsSchema: z.ZodType<Prisma.ReferralUsageFindFirstArgs> = z.object({
  select: ReferralUsageSelectSchema.optional(),
  include: ReferralUsageIncludeSchema.optional(),
  where: ReferralUsageWhereInputSchema.optional(), 
  orderBy: z.union([ ReferralUsageOrderByWithRelationInputSchema.array(), ReferralUsageOrderByWithRelationInputSchema ]).optional(),
  cursor: ReferralUsageWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ReferralUsageScalarFieldEnumSchema, ReferralUsageScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ReferralUsageFindFirstOrThrowArgsSchema: z.ZodType<Prisma.ReferralUsageFindFirstOrThrowArgs> = z.object({
  select: ReferralUsageSelectSchema.optional(),
  include: ReferralUsageIncludeSchema.optional(),
  where: ReferralUsageWhereInputSchema.optional(), 
  orderBy: z.union([ ReferralUsageOrderByWithRelationInputSchema.array(), ReferralUsageOrderByWithRelationInputSchema ]).optional(),
  cursor: ReferralUsageWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ReferralUsageScalarFieldEnumSchema, ReferralUsageScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ReferralUsageFindManyArgsSchema: z.ZodType<Prisma.ReferralUsageFindManyArgs> = z.object({
  select: ReferralUsageSelectSchema.optional(),
  include: ReferralUsageIncludeSchema.optional(),
  where: ReferralUsageWhereInputSchema.optional(), 
  orderBy: z.union([ ReferralUsageOrderByWithRelationInputSchema.array(), ReferralUsageOrderByWithRelationInputSchema ]).optional(),
  cursor: ReferralUsageWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ReferralUsageScalarFieldEnumSchema, ReferralUsageScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ReferralUsageAggregateArgsSchema: z.ZodType<Prisma.ReferralUsageAggregateArgs> = z.object({
  where: ReferralUsageWhereInputSchema.optional(), 
  orderBy: z.union([ ReferralUsageOrderByWithRelationInputSchema.array(), ReferralUsageOrderByWithRelationInputSchema ]).optional(),
  cursor: ReferralUsageWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ReferralUsageGroupByArgsSchema: z.ZodType<Prisma.ReferralUsageGroupByArgs> = z.object({
  where: ReferralUsageWhereInputSchema.optional(), 
  orderBy: z.union([ ReferralUsageOrderByWithAggregationInputSchema.array(), ReferralUsageOrderByWithAggregationInputSchema ]).optional(),
  by: ReferralUsageScalarFieldEnumSchema.array(), 
  having: ReferralUsageScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ReferralUsageFindUniqueArgsSchema: z.ZodType<Prisma.ReferralUsageFindUniqueArgs> = z.object({
  select: ReferralUsageSelectSchema.optional(),
  include: ReferralUsageIncludeSchema.optional(),
  where: ReferralUsageWhereUniqueInputSchema, 
}).strict();

export const ReferralUsageFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.ReferralUsageFindUniqueOrThrowArgs> = z.object({
  select: ReferralUsageSelectSchema.optional(),
  include: ReferralUsageIncludeSchema.optional(),
  where: ReferralUsageWhereUniqueInputSchema, 
}).strict();

export const InvitationCodeFindFirstArgsSchema: z.ZodType<Prisma.InvitationCodeFindFirstArgs> = z.object({
  select: InvitationCodeSelectSchema.optional(),
  include: InvitationCodeIncludeSchema.optional(),
  where: InvitationCodeWhereInputSchema.optional(), 
  orderBy: z.union([ InvitationCodeOrderByWithRelationInputSchema.array(), InvitationCodeOrderByWithRelationInputSchema ]).optional(),
  cursor: InvitationCodeWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ InvitationCodeScalarFieldEnumSchema, InvitationCodeScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const InvitationCodeFindFirstOrThrowArgsSchema: z.ZodType<Prisma.InvitationCodeFindFirstOrThrowArgs> = z.object({
  select: InvitationCodeSelectSchema.optional(),
  include: InvitationCodeIncludeSchema.optional(),
  where: InvitationCodeWhereInputSchema.optional(), 
  orderBy: z.union([ InvitationCodeOrderByWithRelationInputSchema.array(), InvitationCodeOrderByWithRelationInputSchema ]).optional(),
  cursor: InvitationCodeWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ InvitationCodeScalarFieldEnumSchema, InvitationCodeScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const InvitationCodeFindManyArgsSchema: z.ZodType<Prisma.InvitationCodeFindManyArgs> = z.object({
  select: InvitationCodeSelectSchema.optional(),
  include: InvitationCodeIncludeSchema.optional(),
  where: InvitationCodeWhereInputSchema.optional(), 
  orderBy: z.union([ InvitationCodeOrderByWithRelationInputSchema.array(), InvitationCodeOrderByWithRelationInputSchema ]).optional(),
  cursor: InvitationCodeWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ InvitationCodeScalarFieldEnumSchema, InvitationCodeScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const InvitationCodeAggregateArgsSchema: z.ZodType<Prisma.InvitationCodeAggregateArgs> = z.object({
  where: InvitationCodeWhereInputSchema.optional(), 
  orderBy: z.union([ InvitationCodeOrderByWithRelationInputSchema.array(), InvitationCodeOrderByWithRelationInputSchema ]).optional(),
  cursor: InvitationCodeWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const InvitationCodeGroupByArgsSchema: z.ZodType<Prisma.InvitationCodeGroupByArgs> = z.object({
  where: InvitationCodeWhereInputSchema.optional(), 
  orderBy: z.union([ InvitationCodeOrderByWithAggregationInputSchema.array(), InvitationCodeOrderByWithAggregationInputSchema ]).optional(),
  by: InvitationCodeScalarFieldEnumSchema.array(), 
  having: InvitationCodeScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const InvitationCodeFindUniqueArgsSchema: z.ZodType<Prisma.InvitationCodeFindUniqueArgs> = z.object({
  select: InvitationCodeSelectSchema.optional(),
  include: InvitationCodeIncludeSchema.optional(),
  where: InvitationCodeWhereUniqueInputSchema, 
}).strict();

export const InvitationCodeFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.InvitationCodeFindUniqueOrThrowArgs> = z.object({
  select: InvitationCodeSelectSchema.optional(),
  include: InvitationCodeIncludeSchema.optional(),
  where: InvitationCodeWhereUniqueInputSchema, 
}).strict();

export const EmailCampaignFindFirstArgsSchema: z.ZodType<Prisma.EmailCampaignFindFirstArgs> = z.object({
  select: EmailCampaignSelectSchema.optional(),
  include: EmailCampaignIncludeSchema.optional(),
  where: EmailCampaignWhereInputSchema.optional(), 
  orderBy: z.union([ EmailCampaignOrderByWithRelationInputSchema.array(), EmailCampaignOrderByWithRelationInputSchema ]).optional(),
  cursor: EmailCampaignWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ EmailCampaignScalarFieldEnumSchema, EmailCampaignScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const EmailCampaignFindFirstOrThrowArgsSchema: z.ZodType<Prisma.EmailCampaignFindFirstOrThrowArgs> = z.object({
  select: EmailCampaignSelectSchema.optional(),
  include: EmailCampaignIncludeSchema.optional(),
  where: EmailCampaignWhereInputSchema.optional(), 
  orderBy: z.union([ EmailCampaignOrderByWithRelationInputSchema.array(), EmailCampaignOrderByWithRelationInputSchema ]).optional(),
  cursor: EmailCampaignWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ EmailCampaignScalarFieldEnumSchema, EmailCampaignScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const EmailCampaignFindManyArgsSchema: z.ZodType<Prisma.EmailCampaignFindManyArgs> = z.object({
  select: EmailCampaignSelectSchema.optional(),
  include: EmailCampaignIncludeSchema.optional(),
  where: EmailCampaignWhereInputSchema.optional(), 
  orderBy: z.union([ EmailCampaignOrderByWithRelationInputSchema.array(), EmailCampaignOrderByWithRelationInputSchema ]).optional(),
  cursor: EmailCampaignWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ EmailCampaignScalarFieldEnumSchema, EmailCampaignScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const EmailCampaignAggregateArgsSchema: z.ZodType<Prisma.EmailCampaignAggregateArgs> = z.object({
  where: EmailCampaignWhereInputSchema.optional(), 
  orderBy: z.union([ EmailCampaignOrderByWithRelationInputSchema.array(), EmailCampaignOrderByWithRelationInputSchema ]).optional(),
  cursor: EmailCampaignWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const EmailCampaignGroupByArgsSchema: z.ZodType<Prisma.EmailCampaignGroupByArgs> = z.object({
  where: EmailCampaignWhereInputSchema.optional(), 
  orderBy: z.union([ EmailCampaignOrderByWithAggregationInputSchema.array(), EmailCampaignOrderByWithAggregationInputSchema ]).optional(),
  by: EmailCampaignScalarFieldEnumSchema.array(), 
  having: EmailCampaignScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const EmailCampaignFindUniqueArgsSchema: z.ZodType<Prisma.EmailCampaignFindUniqueArgs> = z.object({
  select: EmailCampaignSelectSchema.optional(),
  include: EmailCampaignIncludeSchema.optional(),
  where: EmailCampaignWhereUniqueInputSchema, 
}).strict();

export const EmailCampaignFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.EmailCampaignFindUniqueOrThrowArgs> = z.object({
  select: EmailCampaignSelectSchema.optional(),
  include: EmailCampaignIncludeSchema.optional(),
  where: EmailCampaignWhereUniqueInputSchema, 
}).strict();

export const SmsVerificationFindFirstArgsSchema: z.ZodType<Prisma.SmsVerificationFindFirstArgs> = z.object({
  select: SmsVerificationSelectSchema.optional(),
  include: SmsVerificationIncludeSchema.optional(),
  where: SmsVerificationWhereInputSchema.optional(), 
  orderBy: z.union([ SmsVerificationOrderByWithRelationInputSchema.array(), SmsVerificationOrderByWithRelationInputSchema ]).optional(),
  cursor: SmsVerificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SmsVerificationScalarFieldEnumSchema, SmsVerificationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SmsVerificationFindFirstOrThrowArgsSchema: z.ZodType<Prisma.SmsVerificationFindFirstOrThrowArgs> = z.object({
  select: SmsVerificationSelectSchema.optional(),
  include: SmsVerificationIncludeSchema.optional(),
  where: SmsVerificationWhereInputSchema.optional(), 
  orderBy: z.union([ SmsVerificationOrderByWithRelationInputSchema.array(), SmsVerificationOrderByWithRelationInputSchema ]).optional(),
  cursor: SmsVerificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SmsVerificationScalarFieldEnumSchema, SmsVerificationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SmsVerificationFindManyArgsSchema: z.ZodType<Prisma.SmsVerificationFindManyArgs> = z.object({
  select: SmsVerificationSelectSchema.optional(),
  include: SmsVerificationIncludeSchema.optional(),
  where: SmsVerificationWhereInputSchema.optional(), 
  orderBy: z.union([ SmsVerificationOrderByWithRelationInputSchema.array(), SmsVerificationOrderByWithRelationInputSchema ]).optional(),
  cursor: SmsVerificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SmsVerificationScalarFieldEnumSchema, SmsVerificationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SmsVerificationAggregateArgsSchema: z.ZodType<Prisma.SmsVerificationAggregateArgs> = z.object({
  where: SmsVerificationWhereInputSchema.optional(), 
  orderBy: z.union([ SmsVerificationOrderByWithRelationInputSchema.array(), SmsVerificationOrderByWithRelationInputSchema ]).optional(),
  cursor: SmsVerificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const SmsVerificationGroupByArgsSchema: z.ZodType<Prisma.SmsVerificationGroupByArgs> = z.object({
  where: SmsVerificationWhereInputSchema.optional(), 
  orderBy: z.union([ SmsVerificationOrderByWithAggregationInputSchema.array(), SmsVerificationOrderByWithAggregationInputSchema ]).optional(),
  by: SmsVerificationScalarFieldEnumSchema.array(), 
  having: SmsVerificationScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const SmsVerificationFindUniqueArgsSchema: z.ZodType<Prisma.SmsVerificationFindUniqueArgs> = z.object({
  select: SmsVerificationSelectSchema.optional(),
  include: SmsVerificationIncludeSchema.optional(),
  where: SmsVerificationWhereUniqueInputSchema, 
}).strict();

export const SmsVerificationFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.SmsVerificationFindUniqueOrThrowArgs> = z.object({
  select: SmsVerificationSelectSchema.optional(),
  include: SmsVerificationIncludeSchema.optional(),
  where: SmsVerificationWhereUniqueInputSchema, 
}).strict();

export const MagicLinkAttemptFindFirstArgsSchema: z.ZodType<Prisma.MagicLinkAttemptFindFirstArgs> = z.object({
  select: MagicLinkAttemptSelectSchema.optional(),
  where: MagicLinkAttemptWhereInputSchema.optional(), 
  orderBy: z.union([ MagicLinkAttemptOrderByWithRelationInputSchema.array(), MagicLinkAttemptOrderByWithRelationInputSchema ]).optional(),
  cursor: MagicLinkAttemptWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ MagicLinkAttemptScalarFieldEnumSchema, MagicLinkAttemptScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const MagicLinkAttemptFindFirstOrThrowArgsSchema: z.ZodType<Prisma.MagicLinkAttemptFindFirstOrThrowArgs> = z.object({
  select: MagicLinkAttemptSelectSchema.optional(),
  where: MagicLinkAttemptWhereInputSchema.optional(), 
  orderBy: z.union([ MagicLinkAttemptOrderByWithRelationInputSchema.array(), MagicLinkAttemptOrderByWithRelationInputSchema ]).optional(),
  cursor: MagicLinkAttemptWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ MagicLinkAttemptScalarFieldEnumSchema, MagicLinkAttemptScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const MagicLinkAttemptFindManyArgsSchema: z.ZodType<Prisma.MagicLinkAttemptFindManyArgs> = z.object({
  select: MagicLinkAttemptSelectSchema.optional(),
  where: MagicLinkAttemptWhereInputSchema.optional(), 
  orderBy: z.union([ MagicLinkAttemptOrderByWithRelationInputSchema.array(), MagicLinkAttemptOrderByWithRelationInputSchema ]).optional(),
  cursor: MagicLinkAttemptWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ MagicLinkAttemptScalarFieldEnumSchema, MagicLinkAttemptScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const MagicLinkAttemptAggregateArgsSchema: z.ZodType<Prisma.MagicLinkAttemptAggregateArgs> = z.object({
  where: MagicLinkAttemptWhereInputSchema.optional(), 
  orderBy: z.union([ MagicLinkAttemptOrderByWithRelationInputSchema.array(), MagicLinkAttemptOrderByWithRelationInputSchema ]).optional(),
  cursor: MagicLinkAttemptWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const MagicLinkAttemptGroupByArgsSchema: z.ZodType<Prisma.MagicLinkAttemptGroupByArgs> = z.object({
  where: MagicLinkAttemptWhereInputSchema.optional(), 
  orderBy: z.union([ MagicLinkAttemptOrderByWithAggregationInputSchema.array(), MagicLinkAttemptOrderByWithAggregationInputSchema ]).optional(),
  by: MagicLinkAttemptScalarFieldEnumSchema.array(), 
  having: MagicLinkAttemptScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const MagicLinkAttemptFindUniqueArgsSchema: z.ZodType<Prisma.MagicLinkAttemptFindUniqueArgs> = z.object({
  select: MagicLinkAttemptSelectSchema.optional(),
  where: MagicLinkAttemptWhereUniqueInputSchema, 
}).strict();

export const MagicLinkAttemptFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.MagicLinkAttemptFindUniqueOrThrowArgs> = z.object({
  select: MagicLinkAttemptSelectSchema.optional(),
  where: MagicLinkAttemptWhereUniqueInputSchema, 
}).strict();

export const UserCreateArgsSchema: z.ZodType<Prisma.UserCreateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserCreateInputSchema, UserUncheckedCreateInputSchema ]),
}).strict();

export const UserUpsertArgsSchema: z.ZodType<Prisma.UserUpsertArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
  create: z.union([ UserCreateInputSchema, UserUncheckedCreateInputSchema ]),
  update: z.union([ UserUpdateInputSchema, UserUncheckedUpdateInputSchema ]),
}).strict();

export const UserCreateManyArgsSchema: z.ZodType<Prisma.UserCreateManyArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema, UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const UserCreateManyAndReturnArgsSchema: z.ZodType<Prisma.UserCreateManyAndReturnArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema, UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const UserDeleteArgsSchema: z.ZodType<Prisma.UserDeleteArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserUpdateArgsSchema: z.ZodType<Prisma.UserUpdateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserUpdateInputSchema, UserUncheckedUpdateInputSchema ]),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserUpdateManyArgsSchema: z.ZodType<Prisma.UserUpdateManyArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema, UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.UserUpdateManyAndReturnArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema, UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserDeleteManyArgsSchema: z.ZodType<Prisma.UserDeleteManyArgs> = z.object({
  where: UserWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SessionCreateArgsSchema: z.ZodType<Prisma.SessionCreateArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  data: z.union([ SessionCreateInputSchema, SessionUncheckedCreateInputSchema ]),
}).strict();

export const SessionUpsertArgsSchema: z.ZodType<Prisma.SessionUpsertArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  where: SessionWhereUniqueInputSchema, 
  create: z.union([ SessionCreateInputSchema, SessionUncheckedCreateInputSchema ]),
  update: z.union([ SessionUpdateInputSchema, SessionUncheckedUpdateInputSchema ]),
}).strict();

export const SessionCreateManyArgsSchema: z.ZodType<Prisma.SessionCreateManyArgs> = z.object({
  data: z.union([ SessionCreateManyInputSchema, SessionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const SessionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.SessionCreateManyAndReturnArgs> = z.object({
  data: z.union([ SessionCreateManyInputSchema, SessionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const SessionDeleteArgsSchema: z.ZodType<Prisma.SessionDeleteArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  where: SessionWhereUniqueInputSchema, 
}).strict();

export const SessionUpdateArgsSchema: z.ZodType<Prisma.SessionUpdateArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  data: z.union([ SessionUpdateInputSchema, SessionUncheckedUpdateInputSchema ]),
  where: SessionWhereUniqueInputSchema, 
}).strict();

export const SessionUpdateManyArgsSchema: z.ZodType<Prisma.SessionUpdateManyArgs> = z.object({
  data: z.union([ SessionUpdateManyMutationInputSchema, SessionUncheckedUpdateManyInputSchema ]),
  where: SessionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SessionUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.SessionUpdateManyAndReturnArgs> = z.object({
  data: z.union([ SessionUpdateManyMutationInputSchema, SessionUncheckedUpdateManyInputSchema ]),
  where: SessionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SessionDeleteManyArgsSchema: z.ZodType<Prisma.SessionDeleteManyArgs> = z.object({
  where: SessionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AccountCreateArgsSchema: z.ZodType<Prisma.AccountCreateArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  data: z.union([ AccountCreateInputSchema, AccountUncheckedCreateInputSchema ]),
}).strict();

export const AccountUpsertArgsSchema: z.ZodType<Prisma.AccountUpsertArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  where: AccountWhereUniqueInputSchema, 
  create: z.union([ AccountCreateInputSchema, AccountUncheckedCreateInputSchema ]),
  update: z.union([ AccountUpdateInputSchema, AccountUncheckedUpdateInputSchema ]),
}).strict();

export const AccountCreateManyArgsSchema: z.ZodType<Prisma.AccountCreateManyArgs> = z.object({
  data: z.union([ AccountCreateManyInputSchema, AccountCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const AccountCreateManyAndReturnArgsSchema: z.ZodType<Prisma.AccountCreateManyAndReturnArgs> = z.object({
  data: z.union([ AccountCreateManyInputSchema, AccountCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const AccountDeleteArgsSchema: z.ZodType<Prisma.AccountDeleteArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  where: AccountWhereUniqueInputSchema, 
}).strict();

export const AccountUpdateArgsSchema: z.ZodType<Prisma.AccountUpdateArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  data: z.union([ AccountUpdateInputSchema, AccountUncheckedUpdateInputSchema ]),
  where: AccountWhereUniqueInputSchema, 
}).strict();

export const AccountUpdateManyArgsSchema: z.ZodType<Prisma.AccountUpdateManyArgs> = z.object({
  data: z.union([ AccountUpdateManyMutationInputSchema, AccountUncheckedUpdateManyInputSchema ]),
  where: AccountWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AccountUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.AccountUpdateManyAndReturnArgs> = z.object({
  data: z.union([ AccountUpdateManyMutationInputSchema, AccountUncheckedUpdateManyInputSchema ]),
  where: AccountWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AccountDeleteManyArgsSchema: z.ZodType<Prisma.AccountDeleteManyArgs> = z.object({
  where: AccountWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const VerificationCreateArgsSchema: z.ZodType<Prisma.VerificationCreateArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  data: z.union([ VerificationCreateInputSchema, VerificationUncheckedCreateInputSchema ]),
}).strict();

export const VerificationUpsertArgsSchema: z.ZodType<Prisma.VerificationUpsertArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  where: VerificationWhereUniqueInputSchema, 
  create: z.union([ VerificationCreateInputSchema, VerificationUncheckedCreateInputSchema ]),
  update: z.union([ VerificationUpdateInputSchema, VerificationUncheckedUpdateInputSchema ]),
}).strict();

export const VerificationCreateManyArgsSchema: z.ZodType<Prisma.VerificationCreateManyArgs> = z.object({
  data: z.union([ VerificationCreateManyInputSchema, VerificationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const VerificationCreateManyAndReturnArgsSchema: z.ZodType<Prisma.VerificationCreateManyAndReturnArgs> = z.object({
  data: z.union([ VerificationCreateManyInputSchema, VerificationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const VerificationDeleteArgsSchema: z.ZodType<Prisma.VerificationDeleteArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  where: VerificationWhereUniqueInputSchema, 
}).strict();

export const VerificationUpdateArgsSchema: z.ZodType<Prisma.VerificationUpdateArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  data: z.union([ VerificationUpdateInputSchema, VerificationUncheckedUpdateInputSchema ]),
  where: VerificationWhereUniqueInputSchema, 
}).strict();

export const VerificationUpdateManyArgsSchema: z.ZodType<Prisma.VerificationUpdateManyArgs> = z.object({
  data: z.union([ VerificationUpdateManyMutationInputSchema, VerificationUncheckedUpdateManyInputSchema ]),
  where: VerificationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const VerificationUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.VerificationUpdateManyAndReturnArgs> = z.object({
  data: z.union([ VerificationUpdateManyMutationInputSchema, VerificationUncheckedUpdateManyInputSchema ]),
  where: VerificationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const VerificationDeleteManyArgsSchema: z.ZodType<Prisma.VerificationDeleteManyArgs> = z.object({
  where: VerificationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const EventCreateArgsSchema: z.ZodType<Prisma.EventCreateArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  data: z.union([ EventCreateInputSchema, EventUncheckedCreateInputSchema ]),
}).strict();

export const EventUpsertArgsSchema: z.ZodType<Prisma.EventUpsertArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  where: EventWhereUniqueInputSchema, 
  create: z.union([ EventCreateInputSchema, EventUncheckedCreateInputSchema ]),
  update: z.union([ EventUpdateInputSchema, EventUncheckedUpdateInputSchema ]),
}).strict();

export const EventCreateManyArgsSchema: z.ZodType<Prisma.EventCreateManyArgs> = z.object({
  data: z.union([ EventCreateManyInputSchema, EventCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const EventCreateManyAndReturnArgsSchema: z.ZodType<Prisma.EventCreateManyAndReturnArgs> = z.object({
  data: z.union([ EventCreateManyInputSchema, EventCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const EventDeleteArgsSchema: z.ZodType<Prisma.EventDeleteArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  where: EventWhereUniqueInputSchema, 
}).strict();

export const EventUpdateArgsSchema: z.ZodType<Prisma.EventUpdateArgs> = z.object({
  select: EventSelectSchema.optional(),
  include: EventIncludeSchema.optional(),
  data: z.union([ EventUpdateInputSchema, EventUncheckedUpdateInputSchema ]),
  where: EventWhereUniqueInputSchema, 
}).strict();

export const EventUpdateManyArgsSchema: z.ZodType<Prisma.EventUpdateManyArgs> = z.object({
  data: z.union([ EventUpdateManyMutationInputSchema, EventUncheckedUpdateManyInputSchema ]),
  where: EventWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const EventUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.EventUpdateManyAndReturnArgs> = z.object({
  data: z.union([ EventUpdateManyMutationInputSchema, EventUncheckedUpdateManyInputSchema ]),
  where: EventWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const EventDeleteManyArgsSchema: z.ZodType<Prisma.EventDeleteManyArgs> = z.object({
  where: EventWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TicketCreateArgsSchema: z.ZodType<Prisma.TicketCreateArgs> = z.object({
  select: TicketSelectSchema.optional(),
  include: TicketIncludeSchema.optional(),
  data: z.union([ TicketCreateInputSchema, TicketUncheckedCreateInputSchema ]),
}).strict();

export const TicketUpsertArgsSchema: z.ZodType<Prisma.TicketUpsertArgs> = z.object({
  select: TicketSelectSchema.optional(),
  include: TicketIncludeSchema.optional(),
  where: TicketWhereUniqueInputSchema, 
  create: z.union([ TicketCreateInputSchema, TicketUncheckedCreateInputSchema ]),
  update: z.union([ TicketUpdateInputSchema, TicketUncheckedUpdateInputSchema ]),
}).strict();

export const TicketCreateManyArgsSchema: z.ZodType<Prisma.TicketCreateManyArgs> = z.object({
  data: z.union([ TicketCreateManyInputSchema, TicketCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const TicketCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TicketCreateManyAndReturnArgs> = z.object({
  data: z.union([ TicketCreateManyInputSchema, TicketCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const TicketDeleteArgsSchema: z.ZodType<Prisma.TicketDeleteArgs> = z.object({
  select: TicketSelectSchema.optional(),
  include: TicketIncludeSchema.optional(),
  where: TicketWhereUniqueInputSchema, 
}).strict();

export const TicketUpdateArgsSchema: z.ZodType<Prisma.TicketUpdateArgs> = z.object({
  select: TicketSelectSchema.optional(),
  include: TicketIncludeSchema.optional(),
  data: z.union([ TicketUpdateInputSchema, TicketUncheckedUpdateInputSchema ]),
  where: TicketWhereUniqueInputSchema, 
}).strict();

export const TicketUpdateManyArgsSchema: z.ZodType<Prisma.TicketUpdateManyArgs> = z.object({
  data: z.union([ TicketUpdateManyMutationInputSchema, TicketUncheckedUpdateManyInputSchema ]),
  where: TicketWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TicketUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.TicketUpdateManyAndReturnArgs> = z.object({
  data: z.union([ TicketUpdateManyMutationInputSchema, TicketUncheckedUpdateManyInputSchema ]),
  where: TicketWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TicketDeleteManyArgsSchema: z.ZodType<Prisma.TicketDeleteManyArgs> = z.object({
  where: TicketWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const EventFormFieldsCreateArgsSchema: z.ZodType<Prisma.EventFormFieldsCreateArgs> = z.object({
  select: EventFormFieldsSelectSchema.optional(),
  include: EventFormFieldsIncludeSchema.optional(),
  data: z.union([ EventFormFieldsCreateInputSchema, EventFormFieldsUncheckedCreateInputSchema ]),
}).strict();

export const EventFormFieldsUpsertArgsSchema: z.ZodType<Prisma.EventFormFieldsUpsertArgs> = z.object({
  select: EventFormFieldsSelectSchema.optional(),
  include: EventFormFieldsIncludeSchema.optional(),
  where: EventFormFieldsWhereUniqueInputSchema, 
  create: z.union([ EventFormFieldsCreateInputSchema, EventFormFieldsUncheckedCreateInputSchema ]),
  update: z.union([ EventFormFieldsUpdateInputSchema, EventFormFieldsUncheckedUpdateInputSchema ]),
}).strict();

export const EventFormFieldsCreateManyArgsSchema: z.ZodType<Prisma.EventFormFieldsCreateManyArgs> = z.object({
  data: z.union([ EventFormFieldsCreateManyInputSchema, EventFormFieldsCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const EventFormFieldsCreateManyAndReturnArgsSchema: z.ZodType<Prisma.EventFormFieldsCreateManyAndReturnArgs> = z.object({
  data: z.union([ EventFormFieldsCreateManyInputSchema, EventFormFieldsCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const EventFormFieldsDeleteArgsSchema: z.ZodType<Prisma.EventFormFieldsDeleteArgs> = z.object({
  select: EventFormFieldsSelectSchema.optional(),
  include: EventFormFieldsIncludeSchema.optional(),
  where: EventFormFieldsWhereUniqueInputSchema, 
}).strict();

export const EventFormFieldsUpdateArgsSchema: z.ZodType<Prisma.EventFormFieldsUpdateArgs> = z.object({
  select: EventFormFieldsSelectSchema.optional(),
  include: EventFormFieldsIncludeSchema.optional(),
  data: z.union([ EventFormFieldsUpdateInputSchema, EventFormFieldsUncheckedUpdateInputSchema ]),
  where: EventFormFieldsWhereUniqueInputSchema, 
}).strict();

export const EventFormFieldsUpdateManyArgsSchema: z.ZodType<Prisma.EventFormFieldsUpdateManyArgs> = z.object({
  data: z.union([ EventFormFieldsUpdateManyMutationInputSchema, EventFormFieldsUncheckedUpdateManyInputSchema ]),
  where: EventFormFieldsWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const EventFormFieldsUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.EventFormFieldsUpdateManyAndReturnArgs> = z.object({
  data: z.union([ EventFormFieldsUpdateManyMutationInputSchema, EventFormFieldsUncheckedUpdateManyInputSchema ]),
  where: EventFormFieldsWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const EventFormFieldsDeleteManyArgsSchema: z.ZodType<Prisma.EventFormFieldsDeleteManyArgs> = z.object({
  where: EventFormFieldsWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const RegistrationCreateArgsSchema: z.ZodType<Prisma.RegistrationCreateArgs> = z.object({
  select: RegistrationSelectSchema.optional(),
  include: RegistrationIncludeSchema.optional(),
  data: z.union([ RegistrationCreateInputSchema, RegistrationUncheckedCreateInputSchema ]),
}).strict();

export const RegistrationUpsertArgsSchema: z.ZodType<Prisma.RegistrationUpsertArgs> = z.object({
  select: RegistrationSelectSchema.optional(),
  include: RegistrationIncludeSchema.optional(),
  where: RegistrationWhereUniqueInputSchema, 
  create: z.union([ RegistrationCreateInputSchema, RegistrationUncheckedCreateInputSchema ]),
  update: z.union([ RegistrationUpdateInputSchema, RegistrationUncheckedUpdateInputSchema ]),
}).strict();

export const RegistrationCreateManyArgsSchema: z.ZodType<Prisma.RegistrationCreateManyArgs> = z.object({
  data: z.union([ RegistrationCreateManyInputSchema, RegistrationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const RegistrationCreateManyAndReturnArgsSchema: z.ZodType<Prisma.RegistrationCreateManyAndReturnArgs> = z.object({
  data: z.union([ RegistrationCreateManyInputSchema, RegistrationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const RegistrationDeleteArgsSchema: z.ZodType<Prisma.RegistrationDeleteArgs> = z.object({
  select: RegistrationSelectSchema.optional(),
  include: RegistrationIncludeSchema.optional(),
  where: RegistrationWhereUniqueInputSchema, 
}).strict();

export const RegistrationUpdateArgsSchema: z.ZodType<Prisma.RegistrationUpdateArgs> = z.object({
  select: RegistrationSelectSchema.optional(),
  include: RegistrationIncludeSchema.optional(),
  data: z.union([ RegistrationUpdateInputSchema, RegistrationUncheckedUpdateInputSchema ]),
  where: RegistrationWhereUniqueInputSchema, 
}).strict();

export const RegistrationUpdateManyArgsSchema: z.ZodType<Prisma.RegistrationUpdateManyArgs> = z.object({
  data: z.union([ RegistrationUpdateManyMutationInputSchema, RegistrationUncheckedUpdateManyInputSchema ]),
  where: RegistrationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const RegistrationUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.RegistrationUpdateManyAndReturnArgs> = z.object({
  data: z.union([ RegistrationUpdateManyMutationInputSchema, RegistrationUncheckedUpdateManyInputSchema ]),
  where: RegistrationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const RegistrationDeleteManyArgsSchema: z.ZodType<Prisma.RegistrationDeleteManyArgs> = z.object({
  where: RegistrationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ReferralCreateArgsSchema: z.ZodType<Prisma.ReferralCreateArgs> = z.object({
  select: ReferralSelectSchema.optional(),
  include: ReferralIncludeSchema.optional(),
  data: z.union([ ReferralCreateInputSchema, ReferralUncheckedCreateInputSchema ]),
}).strict();

export const ReferralUpsertArgsSchema: z.ZodType<Prisma.ReferralUpsertArgs> = z.object({
  select: ReferralSelectSchema.optional(),
  include: ReferralIncludeSchema.optional(),
  where: ReferralWhereUniqueInputSchema, 
  create: z.union([ ReferralCreateInputSchema, ReferralUncheckedCreateInputSchema ]),
  update: z.union([ ReferralUpdateInputSchema, ReferralUncheckedUpdateInputSchema ]),
}).strict();

export const ReferralCreateManyArgsSchema: z.ZodType<Prisma.ReferralCreateManyArgs> = z.object({
  data: z.union([ ReferralCreateManyInputSchema, ReferralCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ReferralCreateManyAndReturnArgsSchema: z.ZodType<Prisma.ReferralCreateManyAndReturnArgs> = z.object({
  data: z.union([ ReferralCreateManyInputSchema, ReferralCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ReferralDeleteArgsSchema: z.ZodType<Prisma.ReferralDeleteArgs> = z.object({
  select: ReferralSelectSchema.optional(),
  include: ReferralIncludeSchema.optional(),
  where: ReferralWhereUniqueInputSchema, 
}).strict();

export const ReferralUpdateArgsSchema: z.ZodType<Prisma.ReferralUpdateArgs> = z.object({
  select: ReferralSelectSchema.optional(),
  include: ReferralIncludeSchema.optional(),
  data: z.union([ ReferralUpdateInputSchema, ReferralUncheckedUpdateInputSchema ]),
  where: ReferralWhereUniqueInputSchema, 
}).strict();

export const ReferralUpdateManyArgsSchema: z.ZodType<Prisma.ReferralUpdateManyArgs> = z.object({
  data: z.union([ ReferralUpdateManyMutationInputSchema, ReferralUncheckedUpdateManyInputSchema ]),
  where: ReferralWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ReferralUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.ReferralUpdateManyAndReturnArgs> = z.object({
  data: z.union([ ReferralUpdateManyMutationInputSchema, ReferralUncheckedUpdateManyInputSchema ]),
  where: ReferralWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ReferralDeleteManyArgsSchema: z.ZodType<Prisma.ReferralDeleteManyArgs> = z.object({
  where: ReferralWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ReferralUsageCreateArgsSchema: z.ZodType<Prisma.ReferralUsageCreateArgs> = z.object({
  select: ReferralUsageSelectSchema.optional(),
  include: ReferralUsageIncludeSchema.optional(),
  data: z.union([ ReferralUsageCreateInputSchema, ReferralUsageUncheckedCreateInputSchema ]),
}).strict();

export const ReferralUsageUpsertArgsSchema: z.ZodType<Prisma.ReferralUsageUpsertArgs> = z.object({
  select: ReferralUsageSelectSchema.optional(),
  include: ReferralUsageIncludeSchema.optional(),
  where: ReferralUsageWhereUniqueInputSchema, 
  create: z.union([ ReferralUsageCreateInputSchema, ReferralUsageUncheckedCreateInputSchema ]),
  update: z.union([ ReferralUsageUpdateInputSchema, ReferralUsageUncheckedUpdateInputSchema ]),
}).strict();

export const ReferralUsageCreateManyArgsSchema: z.ZodType<Prisma.ReferralUsageCreateManyArgs> = z.object({
  data: z.union([ ReferralUsageCreateManyInputSchema, ReferralUsageCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ReferralUsageCreateManyAndReturnArgsSchema: z.ZodType<Prisma.ReferralUsageCreateManyAndReturnArgs> = z.object({
  data: z.union([ ReferralUsageCreateManyInputSchema, ReferralUsageCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ReferralUsageDeleteArgsSchema: z.ZodType<Prisma.ReferralUsageDeleteArgs> = z.object({
  select: ReferralUsageSelectSchema.optional(),
  include: ReferralUsageIncludeSchema.optional(),
  where: ReferralUsageWhereUniqueInputSchema, 
}).strict();

export const ReferralUsageUpdateArgsSchema: z.ZodType<Prisma.ReferralUsageUpdateArgs> = z.object({
  select: ReferralUsageSelectSchema.optional(),
  include: ReferralUsageIncludeSchema.optional(),
  data: z.union([ ReferralUsageUpdateInputSchema, ReferralUsageUncheckedUpdateInputSchema ]),
  where: ReferralUsageWhereUniqueInputSchema, 
}).strict();

export const ReferralUsageUpdateManyArgsSchema: z.ZodType<Prisma.ReferralUsageUpdateManyArgs> = z.object({
  data: z.union([ ReferralUsageUpdateManyMutationInputSchema, ReferralUsageUncheckedUpdateManyInputSchema ]),
  where: ReferralUsageWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ReferralUsageUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.ReferralUsageUpdateManyAndReturnArgs> = z.object({
  data: z.union([ ReferralUsageUpdateManyMutationInputSchema, ReferralUsageUncheckedUpdateManyInputSchema ]),
  where: ReferralUsageWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ReferralUsageDeleteManyArgsSchema: z.ZodType<Prisma.ReferralUsageDeleteManyArgs> = z.object({
  where: ReferralUsageWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const InvitationCodeCreateArgsSchema: z.ZodType<Prisma.InvitationCodeCreateArgs> = z.object({
  select: InvitationCodeSelectSchema.optional(),
  include: InvitationCodeIncludeSchema.optional(),
  data: z.union([ InvitationCodeCreateInputSchema, InvitationCodeUncheckedCreateInputSchema ]),
}).strict();

export const InvitationCodeUpsertArgsSchema: z.ZodType<Prisma.InvitationCodeUpsertArgs> = z.object({
  select: InvitationCodeSelectSchema.optional(),
  include: InvitationCodeIncludeSchema.optional(),
  where: InvitationCodeWhereUniqueInputSchema, 
  create: z.union([ InvitationCodeCreateInputSchema, InvitationCodeUncheckedCreateInputSchema ]),
  update: z.union([ InvitationCodeUpdateInputSchema, InvitationCodeUncheckedUpdateInputSchema ]),
}).strict();

export const InvitationCodeCreateManyArgsSchema: z.ZodType<Prisma.InvitationCodeCreateManyArgs> = z.object({
  data: z.union([ InvitationCodeCreateManyInputSchema, InvitationCodeCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const InvitationCodeCreateManyAndReturnArgsSchema: z.ZodType<Prisma.InvitationCodeCreateManyAndReturnArgs> = z.object({
  data: z.union([ InvitationCodeCreateManyInputSchema, InvitationCodeCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const InvitationCodeDeleteArgsSchema: z.ZodType<Prisma.InvitationCodeDeleteArgs> = z.object({
  select: InvitationCodeSelectSchema.optional(),
  include: InvitationCodeIncludeSchema.optional(),
  where: InvitationCodeWhereUniqueInputSchema, 
}).strict();

export const InvitationCodeUpdateArgsSchema: z.ZodType<Prisma.InvitationCodeUpdateArgs> = z.object({
  select: InvitationCodeSelectSchema.optional(),
  include: InvitationCodeIncludeSchema.optional(),
  data: z.union([ InvitationCodeUpdateInputSchema, InvitationCodeUncheckedUpdateInputSchema ]),
  where: InvitationCodeWhereUniqueInputSchema, 
}).strict();

export const InvitationCodeUpdateManyArgsSchema: z.ZodType<Prisma.InvitationCodeUpdateManyArgs> = z.object({
  data: z.union([ InvitationCodeUpdateManyMutationInputSchema, InvitationCodeUncheckedUpdateManyInputSchema ]),
  where: InvitationCodeWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const InvitationCodeUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.InvitationCodeUpdateManyAndReturnArgs> = z.object({
  data: z.union([ InvitationCodeUpdateManyMutationInputSchema, InvitationCodeUncheckedUpdateManyInputSchema ]),
  where: InvitationCodeWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const InvitationCodeDeleteManyArgsSchema: z.ZodType<Prisma.InvitationCodeDeleteManyArgs> = z.object({
  where: InvitationCodeWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const EmailCampaignCreateArgsSchema: z.ZodType<Prisma.EmailCampaignCreateArgs> = z.object({
  select: EmailCampaignSelectSchema.optional(),
  include: EmailCampaignIncludeSchema.optional(),
  data: z.union([ EmailCampaignCreateInputSchema, EmailCampaignUncheckedCreateInputSchema ]),
}).strict();

export const EmailCampaignUpsertArgsSchema: z.ZodType<Prisma.EmailCampaignUpsertArgs> = z.object({
  select: EmailCampaignSelectSchema.optional(),
  include: EmailCampaignIncludeSchema.optional(),
  where: EmailCampaignWhereUniqueInputSchema, 
  create: z.union([ EmailCampaignCreateInputSchema, EmailCampaignUncheckedCreateInputSchema ]),
  update: z.union([ EmailCampaignUpdateInputSchema, EmailCampaignUncheckedUpdateInputSchema ]),
}).strict();

export const EmailCampaignCreateManyArgsSchema: z.ZodType<Prisma.EmailCampaignCreateManyArgs> = z.object({
  data: z.union([ EmailCampaignCreateManyInputSchema, EmailCampaignCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const EmailCampaignCreateManyAndReturnArgsSchema: z.ZodType<Prisma.EmailCampaignCreateManyAndReturnArgs> = z.object({
  data: z.union([ EmailCampaignCreateManyInputSchema, EmailCampaignCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const EmailCampaignDeleteArgsSchema: z.ZodType<Prisma.EmailCampaignDeleteArgs> = z.object({
  select: EmailCampaignSelectSchema.optional(),
  include: EmailCampaignIncludeSchema.optional(),
  where: EmailCampaignWhereUniqueInputSchema, 
}).strict();

export const EmailCampaignUpdateArgsSchema: z.ZodType<Prisma.EmailCampaignUpdateArgs> = z.object({
  select: EmailCampaignSelectSchema.optional(),
  include: EmailCampaignIncludeSchema.optional(),
  data: z.union([ EmailCampaignUpdateInputSchema, EmailCampaignUncheckedUpdateInputSchema ]),
  where: EmailCampaignWhereUniqueInputSchema, 
}).strict();

export const EmailCampaignUpdateManyArgsSchema: z.ZodType<Prisma.EmailCampaignUpdateManyArgs> = z.object({
  data: z.union([ EmailCampaignUpdateManyMutationInputSchema, EmailCampaignUncheckedUpdateManyInputSchema ]),
  where: EmailCampaignWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const EmailCampaignUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.EmailCampaignUpdateManyAndReturnArgs> = z.object({
  data: z.union([ EmailCampaignUpdateManyMutationInputSchema, EmailCampaignUncheckedUpdateManyInputSchema ]),
  where: EmailCampaignWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const EmailCampaignDeleteManyArgsSchema: z.ZodType<Prisma.EmailCampaignDeleteManyArgs> = z.object({
  where: EmailCampaignWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SmsVerificationCreateArgsSchema: z.ZodType<Prisma.SmsVerificationCreateArgs> = z.object({
  select: SmsVerificationSelectSchema.optional(),
  include: SmsVerificationIncludeSchema.optional(),
  data: z.union([ SmsVerificationCreateInputSchema, SmsVerificationUncheckedCreateInputSchema ]),
}).strict();

export const SmsVerificationUpsertArgsSchema: z.ZodType<Prisma.SmsVerificationUpsertArgs> = z.object({
  select: SmsVerificationSelectSchema.optional(),
  include: SmsVerificationIncludeSchema.optional(),
  where: SmsVerificationWhereUniqueInputSchema, 
  create: z.union([ SmsVerificationCreateInputSchema, SmsVerificationUncheckedCreateInputSchema ]),
  update: z.union([ SmsVerificationUpdateInputSchema, SmsVerificationUncheckedUpdateInputSchema ]),
}).strict();

export const SmsVerificationCreateManyArgsSchema: z.ZodType<Prisma.SmsVerificationCreateManyArgs> = z.object({
  data: z.union([ SmsVerificationCreateManyInputSchema, SmsVerificationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const SmsVerificationCreateManyAndReturnArgsSchema: z.ZodType<Prisma.SmsVerificationCreateManyAndReturnArgs> = z.object({
  data: z.union([ SmsVerificationCreateManyInputSchema, SmsVerificationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const SmsVerificationDeleteArgsSchema: z.ZodType<Prisma.SmsVerificationDeleteArgs> = z.object({
  select: SmsVerificationSelectSchema.optional(),
  include: SmsVerificationIncludeSchema.optional(),
  where: SmsVerificationWhereUniqueInputSchema, 
}).strict();

export const SmsVerificationUpdateArgsSchema: z.ZodType<Prisma.SmsVerificationUpdateArgs> = z.object({
  select: SmsVerificationSelectSchema.optional(),
  include: SmsVerificationIncludeSchema.optional(),
  data: z.union([ SmsVerificationUpdateInputSchema, SmsVerificationUncheckedUpdateInputSchema ]),
  where: SmsVerificationWhereUniqueInputSchema, 
}).strict();

export const SmsVerificationUpdateManyArgsSchema: z.ZodType<Prisma.SmsVerificationUpdateManyArgs> = z.object({
  data: z.union([ SmsVerificationUpdateManyMutationInputSchema, SmsVerificationUncheckedUpdateManyInputSchema ]),
  where: SmsVerificationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SmsVerificationUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.SmsVerificationUpdateManyAndReturnArgs> = z.object({
  data: z.union([ SmsVerificationUpdateManyMutationInputSchema, SmsVerificationUncheckedUpdateManyInputSchema ]),
  where: SmsVerificationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SmsVerificationDeleteManyArgsSchema: z.ZodType<Prisma.SmsVerificationDeleteManyArgs> = z.object({
  where: SmsVerificationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const MagicLinkAttemptCreateArgsSchema: z.ZodType<Prisma.MagicLinkAttemptCreateArgs> = z.object({
  select: MagicLinkAttemptSelectSchema.optional(),
  data: z.union([ MagicLinkAttemptCreateInputSchema, MagicLinkAttemptUncheckedCreateInputSchema ]),
}).strict();

export const MagicLinkAttemptUpsertArgsSchema: z.ZodType<Prisma.MagicLinkAttemptUpsertArgs> = z.object({
  select: MagicLinkAttemptSelectSchema.optional(),
  where: MagicLinkAttemptWhereUniqueInputSchema, 
  create: z.union([ MagicLinkAttemptCreateInputSchema, MagicLinkAttemptUncheckedCreateInputSchema ]),
  update: z.union([ MagicLinkAttemptUpdateInputSchema, MagicLinkAttemptUncheckedUpdateInputSchema ]),
}).strict();

export const MagicLinkAttemptCreateManyArgsSchema: z.ZodType<Prisma.MagicLinkAttemptCreateManyArgs> = z.object({
  data: z.union([ MagicLinkAttemptCreateManyInputSchema, MagicLinkAttemptCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const MagicLinkAttemptCreateManyAndReturnArgsSchema: z.ZodType<Prisma.MagicLinkAttemptCreateManyAndReturnArgs> = z.object({
  data: z.union([ MagicLinkAttemptCreateManyInputSchema, MagicLinkAttemptCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const MagicLinkAttemptDeleteArgsSchema: z.ZodType<Prisma.MagicLinkAttemptDeleteArgs> = z.object({
  select: MagicLinkAttemptSelectSchema.optional(),
  where: MagicLinkAttemptWhereUniqueInputSchema, 
}).strict();

export const MagicLinkAttemptUpdateArgsSchema: z.ZodType<Prisma.MagicLinkAttemptUpdateArgs> = z.object({
  select: MagicLinkAttemptSelectSchema.optional(),
  data: z.union([ MagicLinkAttemptUpdateInputSchema, MagicLinkAttemptUncheckedUpdateInputSchema ]),
  where: MagicLinkAttemptWhereUniqueInputSchema, 
}).strict();

export const MagicLinkAttemptUpdateManyArgsSchema: z.ZodType<Prisma.MagicLinkAttemptUpdateManyArgs> = z.object({
  data: z.union([ MagicLinkAttemptUpdateManyMutationInputSchema, MagicLinkAttemptUncheckedUpdateManyInputSchema ]),
  where: MagicLinkAttemptWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const MagicLinkAttemptUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.MagicLinkAttemptUpdateManyAndReturnArgs> = z.object({
  data: z.union([ MagicLinkAttemptUpdateManyMutationInputSchema, MagicLinkAttemptUncheckedUpdateManyInputSchema ]),
  where: MagicLinkAttemptWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const MagicLinkAttemptDeleteManyArgsSchema: z.ZodType<Prisma.MagicLinkAttemptDeleteManyArgs> = z.object({
  where: MagicLinkAttemptWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();