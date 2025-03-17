import type { D1Database } from "@cloudflare/workers-types";

import { AssistantError } from "../utils/errors";

export class Database {
	private db: D1Database;
	private static instance: Database;

	private constructor(db: D1Database) {
		if (!db) {
			throw new Error("Database not configured");
		}

		this.db = db;
	}

	public static getInstance(db: D1Database): Database {
		if (!Database.instance) {
			Database.instance = new Database(db);
		}
		return Database.instance;
	}

	public async getUserByGithubId(
		githubId: string,
	): Promise<Record<string, unknown> | null> {
		const result = await this.db
			.prepare(`
      SELECT u.* FROM user u
      JOIN oauth_account oa ON u.id = oa.user_id
      WHERE oa.provider_id = 'github' AND oa.provider_user_id = ?
    `)
			.bind(githubId)
			.first();

		return result;
	}

	public async getUserBySessionId(
		sessionId: string,
	): Promise<Record<string, unknown> | null> {
		const result = await this.db
			.prepare(`
      SELECT u.* FROM user u
      JOIN session s ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > datetime('now')
    `)
			.bind(sessionId)
			.first();

		return result;
	}

	public async getUserById(
		userId: number,
	): Promise<Record<string, unknown> | null> {
		const result = await this.db
			.prepare(`
      SELECT * FROM user WHERE id = ?
    `)
			.bind(userId)
			.first();

		return result;
	}

	public async getUserByEmail(
		email: string,
	): Promise<Record<string, unknown> | null> {
		const result = await this.db
			.prepare("SELECT * FROM user WHERE email = ?")
			.bind(email)
			.first();

		return result;
	}

	public async updateUser(
		userId: number,
		userData: Record<string, unknown>,
	): Promise<void> {
		const result = await this.db
			.prepare(`
        UPDATE user 
        SET 
          name = ?, 
          avatar_url = ?, 
          email = ?, 
          github_username = ?,
          company = ?,
          location = ?,
          bio = ?,
          twitter_username = ?,
          site = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `)
			.bind(
				userData.name || null,
				userData.avatarUrl || null,
				userData.email,
				userData.username,
				userData.company || null,
				userData.location || null,
				userData.bio || null,
				userData.twitterUsername || null,
				userData.site || null,
				userId,
			)
			.run();

		if (!result.success) {
			throw new AssistantError("Error updating user in the database");
		}
	}

	public async createOauthAccount(
		userId: number,
		providerId: string,
		providerUserId: string,
	): Promise<void> {
		const result = await this.db
			.prepare(`
          INSERT INTO oauth_account (provider_id, provider_user_id, user_id)
          VALUES ('github', ?, ?)
        `)
			.bind(providerId, providerUserId, userId)
			.run();

		if (!result.success) {
			throw new AssistantError("Error creating oauth account in the database");
		}
	}

	public async updateUserWithGithubData(
		userId: number,
		userData: Record<string, unknown>,
	): Promise<void> {
		const result = await this.db
			.prepare(`
          UPDATE user 
          SET 
            github_username = ?,
            name = COALESCE(?, name),
            avatar_url = COALESCE(?, avatar_url),
            company = COALESCE(?, company),
            location = COALESCE(?, location),
            bio = COALESCE(?, bio),
            twitter_username = COALESCE(?, twitter_username),
            site = COALESCE(?, site),
            updated_at = datetime('now')
          WHERE id = ?
        `)
			.bind(
				userData.username,
				userData.name || null,
				userData.avatarUrl || null,
				userData.company || null,
				userData.location || null,
				userData.bio || null,
				userData.twitterUsername || null,
				userData.site || null,
				userId,
			)
			.run();

		if (!result.success) {
			throw new AssistantError("Error creating github user in the database");
		}
	}

	public async createUser(
		userData: Record<string, unknown>,
	): Promise<Record<string, unknown> | null> {
		const result = await this.db
			.prepare(`
          INSERT INTO user (
            name, 
            avatar_url, 
            email, 
            github_username,
            company,
            location,
            bio,
            twitter_username,
            site,
            created_at, 
            updated_at
          ) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          RETURNING *
        `)
			.bind(
				userData.name || null,
				userData.avatarUrl || null,
				userData.email,
				userData.username,
				userData.company || null,
				userData.location || null,
				userData.bio || null,
				userData.twitterUsername || null,
				userData.site || null,
			)
			.first();

		if (!result) {
			throw new AssistantError("Error creating user in the database");
		}

		return result;
	}

	public async createSession(
		sessionId: string,
		userId: number,
		expiresAt: Date,
	): Promise<void> {
		const result = await this.db
			.prepare(`
      INSERT INTO session (id, user_id, expires_at)
      VALUES (?, ?, ?)
    `)
			.bind(sessionId, userId, expiresAt.toISOString())
			.run();

		if (!result) {
			throw new AssistantError("Error creating session in the database");
		}
	}

	public async deleteSession(sessionId: string): Promise<void> {
		const result = await this.db
			.prepare(`
      DELETE FROM session
      WHERE id = ?
    `)
			.bind(sessionId)
			.run();

		if (!result) {
			throw new AssistantError("Error deleting session in the database");
		}
	}

	public async getEmbedding(
		id: string,
		type?: string,
	): Promise<Record<string, unknown> | null> {
		const query = type
			? "SELECT id, metadata, type, title, content FROM embedding WHERE id = ?1 AND type = ?2"
			: "SELECT id, metadata, type, title, content FROM embedding WHERE id = ?1";
		const stmt = type
			? await this.db.prepare(query).bind(id, type)
			: await this.db.prepare(query).bind(id);
		const record = await stmt.first();

		return record;
	}

	public async getEmbeddingIdByType(
		id: string,
		type: string,
	): Promise<Record<string, unknown> | null> {
		const record = await this.db
			.prepare("SELECT id FROM embedding WHERE id = ?1 AND type = ?2")
			.bind(id, type)
			.first();

		return record;
	}

	public async insertEmbedding(
		id: string,
		metadata: Record<string, unknown>,
		title: string,
		content: string,
		type: string,
	): Promise<void> {
		const database = await this.db
			.prepare(
				"INSERT INTO embedding (id, metadata, title, content, type) VALUES (?1, ?2, ?3, ?4, ?5)",
			)
			.bind(id, JSON.stringify(metadata), title, content, type);
		const result = await database.run();

		if (!result.success) {
			throw new AssistantError("Error storing embedding in the database");
		}
	}
}
