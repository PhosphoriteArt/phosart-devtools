import { $ROOT } from '@phosart/common/server';

export function artroot() {
	return $ROOT() + '/..';
}
