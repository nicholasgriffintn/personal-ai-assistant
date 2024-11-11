import type { IRequest, IFunction, IFunctionResponse } from '../types';
import { get_weather } from '../functions/weather';

export const availableFunctions: IFunction[] = [get_weather];

export const handleFunctions = async (functionName: string, args: unknown, request: IRequest): Promise<IFunctionResponse> => {
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
	return foundFunction.function(args, request);
};
