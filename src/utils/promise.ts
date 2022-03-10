/**
 * creates a promise that resolves after given
 * time in milliseconds
 * @param ms milliseconds
 * @returns promise
 */
export async function delay(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms ?? 0);
	});
}

/**
 * creates a promise that resolves on next 
 * event loop tick
 * @returns promise
 */
export async function nextTick() {
	return delay(0);
}