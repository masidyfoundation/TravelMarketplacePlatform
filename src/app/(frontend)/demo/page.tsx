import { getDemoMarketplaceData } from '@/lib/marketplace-data'
import DemoClient from './demo-client'

export const dynamic = 'force-static'

export default async function DemoPage() {
  const { trips, agencies } = await getDemoMarketplaceData()
  return <DemoClient trips={trips} agencies={agencies} />
}
