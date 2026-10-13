import Image from 'next/image'
export function BrandLogo({ light: _light = false }: { light?: boolean }) {
  return <Image src="/brand/coollects.png" alt="Coollects" width={566} height={125} priority className="official-logo" />
}
