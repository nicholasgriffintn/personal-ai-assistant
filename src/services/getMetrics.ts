import type { IRequest } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";

export const handleGetMetrics = async (
	req: IRequest,
	options: {
		limit?: number;
		interval?: string;
		timeframe?: string;
	},
): Promise<Record<string, any>[]> => {
	const { env } = req;

	if (!env.ANALYTICS || !env.ACCOUNT_ID) {
		throw new AssistantError(
			"Analytics Engine or Account ID not configured",
			ErrorType.CONFIGURATION_ERROR,
		);
	}

	const query = `
    SELECT 
        blob1 as type,
        blob2 as name,
        blob3 as status,
        blob4 as error,
        blob5 as traceId,
        double1 as value,
        timestamp,
        toStartOfInterval(timestamp, INTERVAL '${options.interval || "1"}' MINUTE) as truncated_time,
        extract(MINUTE from now()) - extract(MINUTE from timestamp) as minutesAgo,
        SUM(_sample_interval) as sampleCount
    FROM assistant_analytics
    WHERE timestamp > now() - INTERVAL '24' HOUR
    GROUP BY 
        blob1, blob2, blob3, blob4, blob5, 
        double1, timestamp
    ORDER BY timestamp DESC
    LIMIT ${options.limit || 100}
		`;
	const response = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql?query=${encodeURIComponent(query)}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${env.ANALYTICS_API_KEY}`,
			},
		},
	);

	if (!response.ok) {
		console.error("Error querying Analytics Engine:", await response.text());
		throw new AssistantError("Failed to fetch metrics from Analytics Engine");
	}

	const metricsResponse = (await response.json()) as {
		meta: {
			name: string;
			type: string;
		}[];
		data: {
			[key: string]: string | number | boolean;
		}[];
	};

	if (!metricsResponse.data) {
		throw new AssistantError("No metrics found in Analytics Engine");
	}

	return metricsResponse.data;
};
