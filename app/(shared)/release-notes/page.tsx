import { getPaginatedVersions, SanityVersion } from '@/utils/sanity/queries'
import ReleaseView from './release-view'


const ReleasesPage = async () => {
  const [paginatedVersions] = await Promise.all([
    getPaginatedVersions()
  ])

  return (
    <ReleaseView versions={paginatedVersions} />
  )
}

export default ReleasesPage