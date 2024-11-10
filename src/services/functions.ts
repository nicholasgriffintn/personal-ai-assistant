import type { IRequest, IFunction } from '../types';
import { get_weather } from '../functions/weather';

export const availableFunctions: IFunction[] = [get_weather];

export const handleFunctions = async (functionName: string, args: unknown, request: IRequest): Promise<string> => {
	const foundFunction = availableFunctions.find((func) => func.name === functionName);
	if (!foundFunction) {
		console.error(`Function ${functionName} not found`);
		return '';
	}
	return foundFunction.function(args, request);
};
