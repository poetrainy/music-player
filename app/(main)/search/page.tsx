import { searchSongs } from "@/api";
import { getPlaylists } from "@/features/playlist/api";
import { SearchComponent } from "@/features/search/pages/Search";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q ?? "";

  const [playlists, songs] = await Promise.all([
    getPlaylists(),
    query ? searchSongs(query) : Promise.resolve([]),
  ]);

  return <SearchComponent playlists={playlists} query={query} songs={songs} />;
}
