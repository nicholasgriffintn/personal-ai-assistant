import type { IRequest, IFunction } from '../types';
import { get_weather } from '../functions/weather';

export const availableFunctions: IFunction[] = [get_weather];

export const handleFunctions = async (functionName: string, args: unknown, request: IRequest): Promise<string> => {
	const foundFunction = availableFunctions.find((func) => func.function.name === functionName);
	if (!foundFunction) {
		return '';
	}
	return foundFunction.execute(args, request);
};
