import Image from 'next/image'
export function BrandLogo({light=false}:{light?:boolean}){return <Image src="/brand/coollects.png" alt="Coollects" width={146} height={52} priority className={light?'official-logo light':'official-logo'} />}
