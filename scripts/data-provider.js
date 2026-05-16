let apiURL = process.env.API_URL;
let apiKey = process.env.API_KEY;

const supa = require("@supabase/supabase-js");

const supabase = supa.createClient(apiURL, apiKey);

const fetchArtists = async () => {
  const { data, error } = await supabase
    .from("artists")
    .select(
      "artist_id, artist_name, types(type_id, type_name), artist_image_url, spotify_url, spotify_desc"
    )
    .order("artist_name", { ascending: true });

  return { data, error };
};

const fetchArtistById = async (artistId) => {
  const { data, error } = await supabase
    .from("artists")
    .select(
      "artist_id, artist_name, types(type_id, type_name), artist_image_url, spotify_url, spotify_desc"
    )
    .eq("artist_id", artistId);

  return { data, error };
};

const fetchArtistSongsMetadata = async (artistId) => {
  const { data, error } = await supabase
    .from("songs")
    .select(
      `
        artists(artist_name), bpm, energy,
        danceability, loudness, liveness,
        valence, duration, acousticness,
        speechiness, popularity
      `
    )
    .eq("artist_id", artistId);
  return { data, error };
};

// Fetch all genres SupaBase API
const fetchGenres = async () => {
  const { data, error } = await supabase.from("genres").select();
  return { data, error };
};

// Fetch all songs from Supabase API.
const fetchSongs = async () => {
  const { data, error } = await supabase
    .from("songs")
    .select(
      `song_id, title, artists (artist_id,artist_name), genres (genre_id,genre_name),
       year, bpm, energy, danceability, loudness, liveness, valence, duration, 
       acousticness, speechiness, popularity`
    )
    .order("artists(artist_name)", {
      referenceTable: "artists",
      ascending: true
    });

  return { data, error };
};

//Fetch song by songId
const fetchSongById = async (songId) => {
  const { data, error } = await supabase
    .from("songs")
    .select(
      `song_id, title, artists(artist_id, artist_name), genres(genre_id, genre_name),
       year, bpm, energy, danceability, loudness, liveness, valence, duration, 
       acousticness, speechiness, popularity`
    )
    .eq("song_id", songId);

  return { data, error };
};

// Fetch songs ordered by defined field.
// Permissible order_by values: id, title, artist(name), genre(name), year, duration
const fetchOrderedSongs = async (orderByField, orderParamObj) => {
  const { data, error } = await supabase
    .from("songs")
    .select(
      `song_id, title, artists(artist_id, artist_name), genres(genre_id, genre_name),
        year, bpm, energy, danceability, loudness, liveness, valence, duration, 
        acousticness, speechiness, popularity`
    )

    // orderParamObj requires {ascending: true}
    // If a foreign key is referenced via orderByField,
    //       add {referencedTable: "tableReferenced"}
    .order(orderByField, orderParamObj);

  return { data, error };
};

// Fetch all songs with titles beginning with substr
const fetchSongsBeginningWith = async (substr) => {
  const { data, error } = await supabase
    .from("songs")
    .select(
      `song_id, title, artists(artist_id, artist_name), genres(genre_id, genre_name),
       year, bpm, popularity`
    )
    .ilike("title", `${substr}%`)
    .order("title", { ascending: true });

  return { data, error };
};

//Fetch all songs with titles containing substr.
const fetchSongsMatching = async (substr) => {
  const { data, error } = await supabase
    .from("songs")
    .select(
      `song_id, title, artists(artist_id, artist_name), genres(genre_id, genre_name),
       year, bpm, popularity`
    )
    .ilike("title", `%${substr}%`)
    .order("title", { ascending: true });

  return { data, error };
};

// Fetch songs from provided year.
const fetchSongsFromYear = async (year) => {
  const { data, error } = await supabase
    .from("songs")
    .select(
      `song_id, title, artists(artist_id, artist_name), genres(genre_id, genre_name),
       year, bpm, energy, danceability, loudness, liveness, valence, duration, 
       acousticness, speechiness, popularity`
    )
    .eq("year", parseInt(year))
    .order("year", { descending: true });

  return { data, error };
};

// Fetch songs with matching artistId.
const fetchSongsByArtistId = async (artistId) => {
  const { data, error } = await supabase
    .from("songs")
    .select(
      `song_id, title, artists!inner(artist_id, artist_name), genres(genre_id, genre_name),
       year, bpm, energy, danceability, loudness, liveness, valence, duration, 
       acousticness, speechiness, popularity`
    )
    .eq("artist_id", artistId)
    .order("year", { descending: true });

  return { data, error };
};

// Fetch songs with matching genreId
const fetchSongsByGenre = async (genreId) => {
  const { data, error } = await supabase
    .from("songs")
    .select(
      `song_id, title, artists(artist_id, artist_name), genres(genre_id, genre_name),
       year, bpm, energy, danceability, loudness, liveness, valence, duration, 
       acousticness, speechiness, popularity`
    )
    .eq("genre_id", genreId)
    .order("song_id", { ascending: true });

  return { data, error };
};

// Fetch songs belonging to playlistId.
const fetchSongsByPlaylistId = async (playlistId) => {
  const { data, error } = await supabase
    .from("songs")
    .select(
      `playlists!inner(playlist_id), song_id, title, artists!inner(artist_name), genres!inner(genre_name),
       year`
    )
    //playlist id is on separate table.
    .eq("playlists.playlist_id", playlistId);

  return { data, error };
};

// fetch top X (numSongs) of songs ordered by danceability.
const fetchTopSongsByDanceability = async (numSongs) => {
  const { data, error } = await supabase
    .from("songs")
    .select(
      `song_id, title, artists!inner(artist_id, artist_name), genres!inner(genre_id, genre_name),
       year, bpm, energy, danceability, loudness, liveness, valence, duration, 
       acousticness, speechiness, popularity, playlists!inner(playlist_id)`
    )
    .order("danceability", { ascending: false })
    .limit(numSongs);

  return { data, error };
};

// Fetch top X (numSongs) of songs by descending order of valence
const fetchTopSongsByHappiness = async (numSongs) => {
  const { data, error } = await supabase
    .from("songs")
    .select(
      `song_id, title, artists!inner(artist_id, artist_name), genres!inner(genre_id, genre_name),
       year`
    )
    .order("valence", { ascending: false })
    .limit(numSongs);

  return { data, error };
};

const fetchAllPlaylists = async () => {
  const { data, error } = await supabase.from("playlist_names").select();
  return { data, error };
};

// Insert a new playlist_name into playlist_names, then return created record
// SERIAL primary key handles playlist_id
// Referenced: https://supabase.com/docs/reference/javascript/insert
const createPlaylist = async (name) => {
  const response = await supabase
    .from("playlist_names")
    .insert({ playlist_name: name });
  return response;
};

// Delete playlist row from playlist_names table. Return deleted record.
// Cascade on delete set within Supabase, so deleting a playlist_name
//  will remove any record in playlist referencing that playlist_id.
const deletePlaylist = async (playlistId) => {
  const response = await supabase
    .from("playlist_names")
    .delete()
    .eq("playlist_id", playlistId)
    .select();

  return response;
};

// Add song to playlist using playlistId and songId.
const addSongToPlaylist = async (playlistId, songId) => {
  const response = await supabase
    .from("playlists")
    .insert({ playlist_id: playlistId, song_id: songId });
  console.log(response);
  return response;
};

// Referenced https://supabase.com/docs/reference/javascript/delete
// Delete song from playlists where playlistId=playlistId && id==id
const removeSongFromPlaylist = async (playlistId, id) => {
  const response = await supabase
    .from("playlists")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("id", id);

  return response;
};

const updatePlaylistName = async (playlistId, name) => {
  const response = await supabase
    .from("playlist_names")
    .update({ playlist_name: name })
    .eq("playlist_id", playlistId);
  return response;
};

module.exports = {
  fetchArtists,
  fetchArtistById,
  fetchArtistSongsMetadata,
  fetchGenres,
  fetchSongById,
  fetchSongs,
  fetchOrderedSongs,
  fetchSongsByArtistId,
  fetchSongsBeginningWith,
  fetchSongsByGenre,
  fetchSongsByPlaylistId,
  fetchTopSongsByDanceability,
  fetchTopSongsByHappiness,
  fetchSongsMatching,
  fetchSongsFromYear,
  fetchAllPlaylists,
  createPlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  updatePlaylistName
};
