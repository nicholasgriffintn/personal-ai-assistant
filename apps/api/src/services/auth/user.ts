import type { D1Database } from "@cloudflare/workers-types";

import type { IEnv, User } from "../../types";
import { AssistantError, ErrorType } from "../../utils/errors";

/**
 * Map database result to User type
 */
function mapToUser(
	result: Record<string, unknown>,
	allowedUsernames?: string[],
): User {
	// TODO: Get this from the database when we have plans
	const isProPlan = allowedUsernames?.includes(
		result.github_username as string,
	);

	return {
		id: result.id as number,
		name: result.name as string | null,
		avatar_url: result.avatar_url as string | null,
		email: result.email as string,
		github_username: result.github_username as string | null,
		company: result.company as string | null,
		site: result.site as string | null,
		location: result.location as string | null,
		bio: result.bio as string | null,
		twitter_username: result.twitter_username as string | null,
		created_at: result.created_at as string,
		updated_at: result.updated_at as string,
		setup_at: result.setup_at as string | null,
		terms_accepted_at: result.terms_accepted_at as string | null,
		plan: isProPlan ? "pro" : "free",
	};
}

/**
 * Get a user by their GitHub user ID
 */
export async function getUserByGithubId(
	db: D1Database,
	githubId: string,
): Promise<User | null> {
	try {
		const result = await db
			.prepare(`
      SELECT u.* FROM user u
      JOIN oauth_account oa ON u.id = oa.user_id
      WHERE oa.provider_id = 'github' AND oa.provider_user_id = ?
    `)
			.bind(githubId)
			.first();

		if (!result) return null;

		return mapToUser(result);
	} catch (error) {
		console.error("Error getting user by GitHub ID:", error);
		throw new AssistantError(
			"Failed to retrieve user",
			ErrorType.UNKNOWN_ERROR,
		);
	}
}

/**
 * Get a user by their session ID
 */
export async function getUserBySessionId(
	env: IEnv,
	sessionId: string,
): Promise<User | null> {
	try {
		const { DB, ALLOWED_USERNAMES } = env;
		const result = await DB.prepare(`
      SELECT u.* FROM user u
      JOIN session s ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > datetime('now')
    `)
			.bind(sessionId)
			.first();

		if (!result) return null;

		const allowedUsernames = ALLOWED_USERNAMES?.split(",");
		return mapToUser(result, allowedUsernames);
	} catch (error) {
		console.error("Error getting user by session ID:", error);
		throw new AssistantError(
			"Failed to retrieve user",
			ErrorType.UNKNOWN_ERROR,
		);
	}
}

/**
 * Get a user by their ID
 */
export async function getUserById(
	db: D1Database,
	userId: number,
): Promise<User | null> {
	try {
		const result = await db
			.prepare(`
      SELECT * FROM user WHERE id = ?
    `)
			.bind(userId)
			.first();

		if (!result) return null;

		return mapToUser(result);
	} catch (error) {
		console.error("Error getting user by ID:", error);
		throw new AssistantError(
			"Failed to retrieve user",
			ErrorType.UNKNOWN_ERROR,
		);
	}
}

/**
 * Create or update a user from GitHub data
 */
export async function createOrUpdateGithubUser(
	db: D1Database,
	userData: {
		githubId: string;
		username: string;
		email: string;
		name?: string;
		avatarUrl?: string;
		company?: string;
		location?: string;
		bio?: string;
		twitterUsername?: string;
		site?: string;
	},
): Promise<User> {
	try {
		const existingUser = await getUserByGithubId(db, userData.githubId);

		if (existingUser) {
			await db
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
					existingUser.id,
				)
				.run();

			return {
				...existingUser,
				name: userData.name || existingUser.name,
				avatar_url: userData.avatarUrl || existingUser.avatar_url,
				email: userData.email,
				github_username: userData.username,
				company: userData.company || existingUser.company,
				location: userData.location || existingUser.location,
				bio: userData.bio || existingUser.bio,
				twitter_username:
					userData.twitterUsername || existingUser.twitter_username,
				site: userData.site || existingUser.site,
				updated_at: new Date().toISOString(),
			};
		}
		const userByEmail = (await db
			.prepare("SELECT * FROM user WHERE email = ?")
			.bind(userData.email)
			.first()) as User | null;

		if (userByEmail) {
			await db
				.prepare(`
          INSERT INTO oauth_account (provider_id, provider_user_id, user_id)
          VALUES ('github', ?, ?)
        `)
				.bind(userData.githubId, userByEmail.id)
				.run();

			await db
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
					userByEmail.id,
				)
				.run();

			return {
				...userByEmail,
				github_username: userData.username,
				name: userData.name || userByEmail.name,
				avatar_url: userData.avatarUrl || userByEmail.avatar_url,
				company: userData.company || userByEmail.company,
				location: userData.location || userByEmail.location,
				bio: userData.bio || userByEmail.bio,
				twitter_username:
					userData.twitterUsername || userByEmail.twitter_username,
				site: userData.site || userByEmail.site,
				updated_at: new Date().toISOString(),
			};
		}
		const result = await db
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
			throw new AssistantError(
				"Failed to create user",
				ErrorType.UNKNOWN_ERROR,
			);
		}

		const newUser = mapToUser(result);

		await db
			.prepare(`
          INSERT INTO oauth_account (provider_id, provider_user_id, user_id)
          VALUES ('github', ?, ?)
        `)
			.bind(userData.githubId, newUser.id)
			.run();

		return newUser;
	} catch (error) {
		console.error("Error creating/updating user:", error);
		throw new AssistantError(
			"Failed to create or update user",
			ErrorType.UNKNOWN_ERROR,
		);
	}
}

/**
 * Create a new session for a user
 */
export async function createSession(
	db: D1Database,
	userId: number,
	expiresInDays = 7,
): Promise<string> {
	try {
		const sessionId = crypto.randomUUID();
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + expiresInDays);

		await db
			.prepare(`
      INSERT INTO session (id, user_id, expires_at)
      VALUES (?, ?, ?)
    `)
			.bind(sessionId, userId, expiresAt.toISOString())
			.run();

		return sessionId;
	} catch (error) {
		console.error("Error creating session:", error);
		throw new AssistantError(
			"Failed to create session",
			ErrorType.UNKNOWN_ERROR,
		);
	}
}

/**
 * Delete a session
 */
export async function deleteSession(
	db: D1Database,
	sessionId: string,
): Promise<void> {
	try {
		await db
			.prepare(`
      DELETE FROM session
      WHERE id = ?
    `)
			.bind(sessionId)
			.run();
	} catch (error) {
		console.error("Error deleting session:", error);
		throw new AssistantError(
			"Failed to delete session",
			ErrorType.UNKNOWN_ERROR,
		);
	}
}
