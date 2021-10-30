import { Context, RedirectResult } from '../types';

export default async function redirectResultHandler(result: RedirectResult, context: Context): Promise<any>  {
	return context.response.redirect(result.status, result.url);
}