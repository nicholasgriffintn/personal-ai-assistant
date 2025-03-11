import type { IFunction } from "../../types";
import type { AppSchema } from "../../types/app-schema";
import { FieldType, ResponseDisplayType } from "../../types/app-schema";
import { availableFunctions } from "../functions";
import { registerDynamicApp } from "./index";

export const autoRegisterDynamicApps = (): void => {
	for (const func of availableFunctions) {
		registerFunctionAsDynamicApp(func);
	}
};

const registerFunctionAsDynamicApp = (func: IFunction): void => {
	const { name, description, parameters } = func;

	const appSchema: AppSchema = {
		id: name,
		name: formatFunctionName(name),
		description: description || `Execute the ${name} function`,
		icon: getFunctionIcon(name),
		category: "functions",
		formSchema: {
			steps: [
				{
					id: "parameters",
					title: "Function Parameters",
					description: `Provide the parameters for the ${formatFunctionName(name)} function`,
					fields: generateFieldsFromParameters(parameters),
				},
			],
		},
		responseSchema: {
			type: getFunctionResponseType(name),
			display: getFunctionResponseDisplay(name),
		},
	};

	try {
		registerDynamicApp(appSchema);
		console.log(`Registered dynamic app for function: ${name}`);
	} catch (error) {
		console.error(
			`Failed to register dynamic app for function ${name}:`,
			error,
		);
	}
};

const generateFieldsFromParameters = (
	parameters: any,
): AppSchema["formSchema"]["steps"][0]["fields"] => {
	const fields: AppSchema["formSchema"]["steps"][0]["fields"] = [];

	if (!parameters || !parameters.properties) {
		return fields;
	}

	const { properties, required = [] } = parameters;

	for (const [key, value] of Object.entries(properties) as [string, any][]) {
		const isRequired = required.includes(key);

		const fieldType = mapJsonSchemaTypeToFieldType(value.type, value.enum);

		const field = {
			id: key,
			type: fieldType,
			label: value.description || key,
			description: value.description,
			placeholder: `Enter ${key}`,
			required: isRequired,
			validation: generateValidationFromSchema(value, fieldType),
		};

		fields.push(field);
	}

	return fields;
};

const mapJsonSchemaTypeToFieldType = (
	type: string,
	hasEnum?: any[],
): FieldType => {
	if (hasEnum) {
		return FieldType.SELECT;
	}

	switch (type) {
		case "string":
			return FieldType.TEXT;
		case "number":
		case "integer":
			return FieldType.NUMBER;
		case "boolean":
			return FieldType.CHECKBOX;
		case "array":
			return FieldType.MULTISELECT;
		default:
			return FieldType.TEXTAREA;
	}
};

const generateValidationFromSchema = (
	schema: any,
	fieldType: FieldType,
): any => {
	const validation: any = {};

	if (schema.enum) {
		validation.options = schema.enum.map((value: any) => ({
			label: value.toString(),
			value: value.toString(),
		}));
	}

	if (schema.minimum !== undefined) {
		validation.min = schema.minimum;
	}

	if (schema.maximum !== undefined) {
		validation.max = schema.maximum;
	}

	if (schema.minLength !== undefined) {
		validation.minLength = schema.minLength;
	}

	if (schema.maxLength !== undefined) {
		validation.maxLength = schema.maxLength;
	}

	if (schema.pattern) {
		validation.pattern = schema.pattern;
	}

	return Object.keys(validation).length > 0 ? validation : undefined;
};

const formatFunctionName = (name: string): string => {
	return name
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
};

const getFunctionIcon = (name: string): string => {
	if (name.includes("weather")) return "cloud";
	if (name.includes("search")) return "search";
	if (name.includes("image") || name.includes("screenshot")) return "image";
	if (name.includes("video")) return "video";
	if (name.includes("music")) return "music";
	if (name.includes("note")) return "file-text";
	if (name.includes("extract") || name.includes("content")) return "file-text";
	if (name.includes("create")) return "plus-circle";
	if (name.includes("get")) return "folder-open";
	return "app";
};

const getFunctionResponseType = (name: string): ResponseDisplayType => {
	if (name.includes("search")) return ResponseDisplayType.TABLE;
	if (name.includes("weather")) return ResponseDisplayType.CUSTOM;
	if (name.includes("image") || name.includes("screenshot"))
		return ResponseDisplayType.CUSTOM;
	if (name.includes("video")) return ResponseDisplayType.CUSTOM;
	if (name.includes("extract")) return ResponseDisplayType.TEXT;
	return ResponseDisplayType.JSON;
};

const getFunctionResponseDisplay = (
	name: string,
): AppSchema["responseSchema"]["display"] => {
	const display: AppSchema["responseSchema"]["display"] = {
		fields: [
			{ key: "status", label: "Status" },
			{ key: "content", label: "Content" },
		],
	};

	if (name.includes("weather")) {
		display.template = `
      <div class="weather-response">
        <h2>Weather Information</h2>
        <p>{{content}}</p>
        {{#if data.weather}}
          <div class="weather-details">
            <div class="weather-icon">
              <img src="https://openweathermap.org/img/wn/{{data.weather.0.icon}}@2x.png" alt="{{data.weather.0.description}}">
            </div>
            <div class="weather-info">
              <p><strong>Temperature:</strong> {{data.main.temp}}°C</p>
              <p><strong>Feels Like:</strong> {{data.main.feels_like}}°C</p>
              <p><strong>Humidity:</strong> {{data.main.humidity}}%</p>
              <p><strong>Wind:</strong> {{data.wind.speed}} m/s</p>
            </div>
          </div>
        {{/if}}
      </div>
    `;
	} else if (name.includes("image") || name.includes("screenshot")) {
		display.template = `
      <div class="image-response">
        <h2>Generated Image</h2>
        <p>{{content}}</p>
        {{#if data.url}}
          <div class="image-container">
            <img src="{{data.url}}" alt="Generated image" class="generated-image">
          </div>
        {{/if}}
      </div>
    `;
	} else if (name.includes("search")) {
		display.fields = [
			{ key: "title", label: "Title" },
			{ key: "url", label: "URL" },
			{ key: "snippet", label: "Snippet" },
		];
	}

	return display;
};
