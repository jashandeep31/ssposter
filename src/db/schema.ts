import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const connectedAccount = pgTable(
  "connected_account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    displayName: text("display_name"),
    username: text("username"),
    avatarUrl: text("avatar_url"),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    tokenType: text("token_type"),
    scope: text("scope"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    status: text("status").default("active").notNull(),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("connected_account_userId_idx").on(table.userId),
    index("connected_account_platform_idx").on(table.platform),
    uniqueIndex("connected_account_user_platform_provider_unique").on(
      table.userId,
      table.platform,
      table.providerAccountId,
    ),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const post = pgTable(
  "post",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    platforms: text("platforms").notNull(),
    publishAt: timestamp("publish_at"),
    publishVersion: integer("publish_version").default(1).notNull(),
    queuedAt: timestamp("queued_at"),
    publishedAt: timestamp("published_at"),
    lastPublishError: text("last_publish_error"),
    status: text("status").default("draft").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("post_userId_idx").on(table.userId),
    index("post_status_idx").on(table.status),
  ],
);

export const postPublish = pgTable(
  "post_publish",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    connectedAccountId: text("connected_account_id").references(
      () => connectedAccount.id,
      { onDelete: "set null" },
    ),
    publishVersion: integer("publish_version").notNull(),
    status: text("status").default("pending").notNull(),
    providerPostId: text("provider_post_id"),
    error: text("error"),
    attempts: integer("attempts").default(0).notNull(),
    lastAttemptAt: timestamp("last_attempt_at"),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("post_publish_postId_idx").on(table.postId),
    index("post_publish_status_idx").on(table.status),
    uniqueIndex("post_publish_post_platform_version_unique").on(
      table.postId,
      table.platform,
      table.publishVersion,
    ),
  ],
);

export const postMedia = pgTable(
  "post_media",
  {
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    mediaId: text("media_id")
      .notNull()
      .references(() => userMedia.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.mediaId] }),
    index("post_media_mediaId_idx").on(table.mediaId),
  ],
);

export const userMedia = pgTable(
  "user_media",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mediaUrl: text("media_url").notNull().unique(),
    displayName: text("display_name").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("user_media_userId_idx").on(table.userId),
    index("user_media_userId_createdAt_idx").on(
      table.userId,
      table.createdAt,
    ),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  connectedAccounts: many(connectedAccount),
  posts: many(post),
  media: many(userMedia),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const connectedAccountRelations = relations(
  connectedAccount,
  ({ many, one }) => ({
    user: one(user, {
      fields: [connectedAccount.userId],
      references: [user.id],
    }),
    publishes: many(postPublish),
  }),
);

export const postRelations = relations(post, ({ many, one }) => ({
  user: one(user, {
    fields: [post.userId],
    references: [user.id],
  }),
  media: many(postMedia),
  publishes: many(postPublish),
}));

export const postPublishRelations = relations(postPublish, ({ one }) => ({
  post: one(post, {
    fields: [postPublish.postId],
    references: [post.id],
  }),
  connectedAccount: one(connectedAccount, {
    fields: [postPublish.connectedAccountId],
    references: [connectedAccount.id],
  }),
}));

export const userMediaRelations = relations(userMedia, ({ many, one }) => ({
  user: one(user, {
    fields: [userMedia.userId],
    references: [user.id],
  }),
  posts: many(postMedia),
}));

export const postMediaRelations = relations(postMedia, ({ one }) => ({
  post: one(post, {
    fields: [postMedia.postId],
    references: [post.id],
  }),
  media: one(userMedia, {
    fields: [postMedia.mediaId],
    references: [userMedia.id],
  }),
}));
