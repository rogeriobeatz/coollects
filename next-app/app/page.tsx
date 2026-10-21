import { HomeEntry } from '@/components/home-entry'
export default function HomePage(){
 return <HomeEntry aiEnabled={Boolean(process.env.KIE_API_KEY)}/>
}
