export enum ResponseDisplayType {
	TABLE = "table",
	JSON = "json",
	TEXT = "text",
	CUSTOM = "custom",
}

export interface ResponseField {
	key: string;
	label: string;
	format?: string;
}

export type ResponseDisplay = {
	fields?: ResponseField[];
	template?: string;
};
