import type { IFunction, IFunctionResponse, IRequest } from "../../types";
import { AppError } from "../../utils/errors";
import { create_image } from "./image";
import { create_music } from "./music";
import { create_video } from "./video";
import { get_weather } from "./weather";

export const availableFunctions: IFunction[] = [
	get_weather,
	create_video,
	create_music,
	create_image,
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
		throw new AppError(`Function ${functionName} not found`, 400);
	}

	return foundFunction.function(chatId, args, request, appUrl);
};
