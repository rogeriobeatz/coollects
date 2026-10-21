import { avatarTone, initials } from '@/lib/social'

type Size='xs'|'sm'|'md'|'lg'

/** Initials on a stable brand color. Decorative: the name is always shown beside it. */
export function CollectorAvatar({name,seed,size='md'}:{name:string;seed:string;size?:Size}){
 return <span className={'collector-avatar avatar-'+size+' avatar-'+avatarTone(seed)} aria-hidden="true">{initials(name)}</span>
}
