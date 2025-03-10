import { StorageService } from "../../lib/storage";
import type { IRequest } from "../../types";
import { AssistantError, ErrorType } from "../../utils/errors";

export interface OcrParams {
	model?: string;
	document: {
		type: "document_url";
		document_url: string;
		document_name: string;
	};
	id?: string;
	pages?: number[];
	include_image_base64?: boolean;
	image_limit?: number;
	image_min_size?: number;
	output_format?: "json" | "html" | "markdown";
}

export interface OcrResult {
	status: "success" | "error";
	error?: string;
	data?: any;
}

/**
 * Performs OCR on an image using Mistral API
 * @param params - OCR parameters including the image
 * @param req - Request object containing environment variables
 * @returns OCR result with extracted text
 */
export const performOcr = async (
	params: OcrParams,
	req: IRequest,
): Promise<OcrResult> => {
	try {
		if (!req.env.MISTRAL_API_KEY) {
			throw new AssistantError(
				"Mistral API key not configured",
				ErrorType.PARAMS_ERROR,
			);
		}

		if (!params.document) {
			throw new AssistantError("Document is required", ErrorType.PARAMS_ERROR);
		}

		const requestId = params.id || crypto.randomUUID();

		const response = await fetch("https://api.mistral.ai/v1/ocr", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${req.env.MISTRAL_API_KEY}`,
			},
			body: JSON.stringify({
				document: params.document,
				model: params.model || "mistral-ocr-latest",
				id: requestId,
				pages: params.pages,
				include_image_base64: params.include_image_base64,
				image_limit: params.image_limit,
				image_min_size: params.image_min_size,
			}),
		});

		if (!response.ok) {
			throw new AssistantError(
				`Mistral API error: ${response.statusText}`,
				ErrorType.EXTERNAL_API_ERROR,
			);
		}

		const data = (await response.json()) as any;

		const storageService = new StorageService(req.env.ASSETS_BUCKET);

		if (params.output_format === "json") {
			const jsonUrl = await storageService.uploadObject(
				`ocr/${requestId}/output.json`,
				JSON.stringify(data),
				{
					contentType: "application/json",
					contentLength: JSON.stringify(data).length,
				},
			);

			return {
				status: "success",
				data: {
					url: jsonUrl,
				},
			};
		}

		if (params.output_format === "html") {
			const markdown_contents = [];
			for (const page of data.pages) {
				const pageContent = page.markdown || page.text;
				markdown_contents.push(pageContent);
			}
			let markdownText = markdown_contents.join("\n\n");

			// TODO: This isn't working still...
			if (data.images && Array.isArray(data.images)) {
				for (const image of data.images) {
					if (image.id && image.image_base64) {
						const imgSrc = `data:image/jpeg;base64,${image.image_base64}`;
						const escapedId = image.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
						markdownText = markdownText.replace(
							new RegExp(`\\!\\[${escapedId}\\]\\(${escapedId}\\)`, "g"),
							`![${image.id}](${imgSrc})`,
						);
						markdownText = markdownText.replace(
							new RegExp(`\\!\\[.*?\\]\\(${escapedId}\\)`, "g"),
							`![${image.id}](${imgSrc})`,
						);
					}
				}
			}

			const htmlContent = convertMarkdownToHtml(markdownText);

			data.html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OCR Result</title>
    <style>
        body { 
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0 auto;
            max-width: 800px;
            padding: 20px;
        }
        img { max-width: 100%; height: auto; }
        h1, h2, h3 { margin-top: 1.5em; }
        p { margin: 1em 0; }
    </style>
</head>
<body>
${htmlContent}
</body>
</html>`;

			const htmlUrl = await storageService.uploadObject(
				`ocr/${requestId}/output.html`,
				data.html,
				{
					contentType: "text/html",
					contentLength: data.html.length,
				},
			);

			return {
				status: "success",
				data: {
					url: htmlUrl,
				},
			};
		}

		const markdown_contents = [];
		for (const page of data.pages) {
			const pageContent = page.markdown || page.text;
			markdown_contents.push(pageContent);
		}
		let markdownText = markdown_contents.join("\n\n");

		const images = data.images || [];
		for (const image of images) {
			if (image.id && image.image_base64) {
				const imgSrc = `data:image/png;base64,${image.image_base64}`;
				const imgIdEscaped = image.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
				const imgRegex = new RegExp(`!\\[(.*?)\\]\\(${imgIdEscaped}\\)`, "g");
				markdownText = markdownText.replace(imgRegex, `![$1](${imgSrc})`);
			}
		}

		const markdownUrl = await storageService.uploadObject(
			`ocr/${requestId}/output.md`,
			markdownText,
			{
				contentType: "text/markdown",
				contentLength: markdownText.length,
			},
		);
		return {
			status: "success",
			data: {
				url: markdownUrl,
			},
		};
	} catch (error) {
		console.error("OCR error:", error);

		if (error instanceof AssistantError) {
			return {
				status: "error",
				error: error.message,
			};
		}

		return {
			status: "error",
			error: "Failed to perform OCR on the image",
		};
	}
};

function convertMarkdownToHtml(markdown: string): string {
	const html = markdown
		.replace(/^# (.*$)/gm, "<h1>$1</h1>")
		.replace(/^## (.*$)/gm, "<h2>$1</h2>")
		.replace(/^### (.*$)/gm, "<h3>$1</h3>")
		.replace(/^#### (.*$)/gm, "<h4>$1</h4>")
		.replace(/^##### (.*$)/gm, "<h5>$1</h5>")
		.replace(/^###### (.*$)/gm, "<h6>$1</h6>")
		.replace(/^\s*(\n)?(.+)/gm, (m) =>
			/^<(\/)?(h\d|ul|ol|li|blockquote|pre|table)/.test(m) ? m : `<p>${m}</p>`,
		)
		.replace(/\n/g, "<br>")
		.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');

	return html;
}
