import type { IRequest, IFunction, IFunctionResponse } from '../types';
import { get_weather } from '../functions/weather';
import { create_video } from '../functions/video';
import { create_music } from '../functions/music';
import { create_image } from '../functions/image';

export const availableFunctions: IFunction[] = [get_weather, create_video, create_music, create_image];

export const handleFunctions = async (
	chatId: string,
	appUrl: string | undefined,
	functionName: string,
	args: unknown,
	request: IRequest
): Promise<IFunctionResponse> => {
	const foundFunction = availableFunctions.find((func) => func.name === functionName);
	if (!foundFunction) {
		console.error(`Function ${functionName} not found`);
		return {
			status: 'error',
			name: functionName,
			content: `Function ${functionName} not found`,
			data: {},
		};
	}
	return foundFunction.function(chatId, args, request, appUrl);
};
