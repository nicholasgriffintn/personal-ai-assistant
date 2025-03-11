import { type FC, useEffect, useRef } from "react";

interface CustomViewProps {
	template?: string;
	data: Record<string, any>;
}

const CustomView: FC<CustomViewProps> = ({ template, data }) => {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!template || !containerRef.current) {
			return;
		}

		try {
			const renderedHtml = renderTemplate(template, data);

			containerRef.current.innerHTML = renderedHtml;
		} catch (error) {
			console.error("Error rendering template:", error);
			containerRef.current.innerHTML = `
        <div class="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md border border-red-300 dark:border-red-800">
          <h3 class="font-semibold">Error rendering template</h3>
          <p>${error instanceof Error ? error.message : "Unknown error"}</p>
        </div>
      `;
		}
	}, [template, data]);

	const renderTemplate = (
		template: string,
		data: Record<string, any>,
	): string => {
		let rendered = template;

		rendered = rendered.replace(/\{\{([^}]+)\}\}/g, (_match, key) => {
			const trimmedKey = key.trim();
			const value = getNestedValue(data, trimmedKey);

			if (value === undefined || value === null) {
				return "";
			}

			if (trimmedKey.includes("date") && value instanceof Date) {
				return value.toLocaleDateString();
			}

			if (trimmedKey.includes("price") || trimmedKey.includes("amount")) {
				const num = Number(value);
				if (!Number.isNaN(num)) {
					return new Intl.NumberFormat("en-US", {
						style: "currency",
						currency: "USD",
					}).format(num);
				}
			}

			return String(value);
		});

		rendered = rendered.replace(
			/\{\{#if\s+([^}]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g,
			(_match, condition, ifContent, elseContent = "") => {
				const trimmedCondition = condition.trim();
				const value = getNestedValue(data, trimmedCondition);
				return value ? ifContent : elseContent;
			},
		);

		rendered = rendered.replace(
			/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
			(_match, arrayKey, content) => {
				const trimmedKey = arrayKey.trim();
				const array = getNestedValue(data, trimmedKey);

				if (!Array.isArray(array)) {
					return "";
				}

				return array
					.map((item) => {
						let itemContent = content;

						if (typeof item === "object") {
							itemContent = itemContent.replace(
								/\{\{this\.([^}]+)\}\}/g,
								(_match: string, prop: string) => {
									const value = item[prop.trim()];
									return value !== undefined ? String(value) : "";
								},
							);
						} else {
							itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
						}

						return itemContent;
					})
					.join("");
			},
		);

		return rendered;
	};

	const getNestedValue = (obj: Record<string, any>, path: string): any => {
		const keys = path.split(".");
		return keys.reduce(
			(o, key) => (o && o[key] !== undefined ? o[key] : undefined),
			obj,
		);
	};

	if (!template) {
		return (
			<div className="p-4 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800">
				No response is available.
			</div>
		);
	}

	return (
		<div
			className="custom-template text-zinc-900 dark:text-zinc-100"
			ref={containerRef}
		/>
	);
};

export default CustomView;
