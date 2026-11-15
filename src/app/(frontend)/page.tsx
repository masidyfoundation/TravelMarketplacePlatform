import { getMarketplaceData } from '@/lib/marketplace-data'
import Marketplace from './marketplace'

export const dynamic = 'force-static'

export default async function HomePage() {
  const { trips, agencies } = await getMarketplaceData()
  return <Marketplace trips={trips} agencies={agencies} />
}
