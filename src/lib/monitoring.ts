export interface Metric {
	traceId: string;
	timestamp: number;
	type: "performance" | "error";
	name: string;
	value: number;
	metadata: Record<string, any>;
	status: "success" | "error";
	error?: string;
}

export class Monitoring {
	private static instance: Monitoring;
	private metrics: Metric[] = [];

	private constructor() {}

	public static getInstance(): Monitoring {
		if (!Monitoring.instance) {
			Monitoring.instance = new Monitoring();
		}
		return Monitoring.instance;
	}

	public recordMetric(metric: Metric): void {
		this.metrics.push(metric);

		// Log metric for debugging/monitoring
		console.log(
			`[Metric] ${metric.type}:${metric.name}`,
			JSON.stringify(
				{
					value: metric.value,
					status: metric.status,
					metadata: metric.metadata,
					error: metric.error || "",
				},
				null,
				2,
			),
		);
	}

	public getMetrics(): Metric[] {
		return this.metrics;
	}

	public getMetricsByType(type: Metric["type"]): Metric[] {
		return this.metrics.filter((metric) => metric.type === type);
	}

	public getMetricsByName(name: string): Metric[] {
		return this.metrics.filter((metric) => metric.name === name);
	}

	public clearMetrics(): void {
		this.metrics = [];
	}
}

export function trackProviderMetrics<T>(
	provider: string,
	model: string,
	operation: () => Promise<T>,
): Promise<T> {
	const startTime = performance.now();
	const monitor = Monitoring.getInstance();
	const traceId = crypto.randomUUID();

	return operation()
		.then((result: any) => {
			const metrics = {
				provider,
				model,
				latency: performance.now() - startTime,
				tokenUsage: result?.usage,
				systemFingerprint: result?.system_fingerprint,
				logId: result?.logId,
			};

			monitor.recordMetric({
				traceId,
				timestamp: Date.now(),
				type: "performance",
				name: "ai_provider_response",
				value: metrics.latency,
				metadata: metrics,
				status: "success",
			});

			return result;
		})
		.catch((error) => {
			monitor.recordMetric({
				traceId,
				timestamp: Date.now(),
				type: "error",
				name: "ai_provider_response",
				value: performance.now() - startTime,
				metadata: {
					provider,
					model,
					error: error instanceof Error ? error.message : String(error),
				},
				status: "error",
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		});
}
