import { FaSearch } from "react-icons/fa";

export default function SearchBar({
  search,
  setSearch,
  platform,
  setPlatform
}) {
  return (
    <div className="toolbar">

      <div className="searchBox">
        <FaSearch />

        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
        />
      </div>

      <select
        value={platform}
        onChange={(e)=>setPlatform(e.target.value)}
      >
        <option value="All">All Platforms</option>
        <option>Instagram</option>
        <option>Facebook</option>
        <option>LinkedIn</option>
        <option>Twitter</option>
      </select>

    </div>
  );
}