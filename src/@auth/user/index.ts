import { FuseSettingsConfigType } from '@fuse/core/FuseSettings/FuseSettings';
import { FuseAuthUser } from '@fuse/core/FuseAuthProvider/types/FuseAuthUser';
import { PartialDeep } from 'type-fest';

/**
 * The type definition for a user object.
 */
export type User = FuseAuthUser & {
	id: string;
	role: string[] | string | null;
	displayName: string;
	photoURL?: string;
	email?: string;
	shortcuts?: string[];
	settings?: PartialDeep<FuseSettingsConfigType>;
	social?: {
		whatsapp?: string;
		skype?: string;
		meta?: string;
		telegram?: string;
		x: string;
		tictok: string;
		instagram: string;
	},
	loginRedirectUrl?: string; // The URL to redirect to after login.
};
