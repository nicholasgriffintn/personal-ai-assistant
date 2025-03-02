import type { IFunction, IFunctionResponse, IRequest } from "../../types";
import { AssistantError, ErrorType } from "../../utils/errors";
import { create_image } from "./image";
import { create_music } from "./music";
import { create_video } from "./video";
import { get_weather } from "./weather";
import { web_search } from "./web_search";
import { extract_content } from "./extract_content";
import { capture_screenshot } from "./screenshot";

export const availableFunctions: IFunction[] = [
	get_weather,
	create_video,
	create_music,
	create_image,
	web_search,
	extract_content,
	capture_screenshot,
];

export const handleFunctions = async (
	chatId: string,
	appUrl: string | undefined,
	functionName: string,
	args: unknown,
	request: IRequest,
): Promise<IFunctionResponse> => {
	const foundFunction = availableFunctions.find(
		(func) => func.name === functionName,
	);

	if (!foundFunction) {
		throw new AssistantError(
			`Function ${functionName} not found`,
			ErrorType.PARAMS_ERROR,
		);
	}

	return foundFunction.function(chatId, args, request, appUrl);
};
