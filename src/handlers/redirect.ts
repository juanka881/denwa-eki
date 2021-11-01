import { Context } from '../context';
import { RedirectResult } from '../result';

export default async function redirectResultHandler(result: RedirectResult, context: Context): Promise<any>  {
	return context.response.redirect(result.status, result.url);
}