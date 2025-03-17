import { sql } from "drizzle-orm";
import {
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
	id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
	name: text(),
	avatar_url: text(),
	email: text().unique().notNull(),
	github_username: text(),
	company: text(),
	site: text(),
	location: text(),
	bio: text(),
	twitter_username: text(),
	created_at: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updated_at: text()
		.default(sql`(CURRENT_TIMESTAMP)`)
		.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	setup_at: text(),
	terms_accepted_at: text(),
});

export type User = typeof user.$inferSelect;

export const oauthAccount = sqliteTable(
	"oauth_account",
	{
		provider_id: text(),
		provider_user_id: text(),
		user_id: integer()
			.notNull()
			.references(() => user.id),
	},
	(table: any) => [
		primaryKey({ columns: [table.provider_id, table.provider_user_id] }),
	],
);

export const session = sqliteTable("session", {
	id: text().primaryKey(),
	user_id: integer()
		.notNull()
		.references(() => user.id),
	expires_at: text().notNull(),
});

export type Session = typeof session.$inferSelect;

export const embedding = sqliteTable("embedding", {
	id: text().primaryKey(),
	metadata: text(),
	title: text(),
	content: text(),
	type: text(),
	namespace: text(),
	created_at: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updated_at: text()
		.default(sql`(CURRENT_TIMESTAMP)`)
		.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
});

export type Embedding = typeof embedding.$inferSelect;
