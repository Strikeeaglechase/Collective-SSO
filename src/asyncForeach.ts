async function forEach<T>(arr: Array<T>, cb: (val: T, idx: number) => Promise<void>, oneAtATime: boolean): Promise<void> {
	const proms: Promise<void>[] = [];
	for (let i = 0; i < arr.length; i++) {
		if (oneAtATime) {
			await cb(arr[i], i);
		} else {
			proms.push(cb(arr[i], i));
		}
	}
	if (proms.length == 0) return;
	await Promise.all(proms)
}
export default forEach;