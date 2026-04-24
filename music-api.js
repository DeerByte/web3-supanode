let port = process.env.PORT;

const express = require("express");
const app = express();

//
// TODO: Test all get routes
//
const fetcher = require("./scripts/data-provider.js");
const {
  calculateArtistSongAverages,
  calculateStudyValues,
  calculateCoffeeValues
} = require("./scripts/calculate");

// Permissible order_by values: id, title, artist(name), genre(name), year, duration
// Key: valid orderBy parameter string, Value: column name.
const orderValues = [
  { key: "id", value: "song_id" },
  { key: "title", value: "title" },
  { key: "artist", value: "artist_name" },
  { key: "year", value: "year" },
  { key: "genre", value: "genre_name" },
  { key: "duration", value: "duration" }
];

//Return all artists, sorted by ascending name.
app.get("/api/artists", async (req, resp, next) => {
  const { data, error } = await fetcher.fetchArtists();

  if (error) {
    console.error(error);
    next({ status: 500, message: "Internal Server Error" });
  } else {
    resp.json({ status: 200, data });
  }
});

// Search by artist_id and return artist info, including info linked by foreign keys.

app.get("/api/artists/:id", async (req, resp, next) => {
  // Query supabase for artist given artist_id
  const artistId = parseInt(req.params.id);

  if (isNaN(req.params.id)) {
    next({ status: 400, message: "Bad Request: Artist_Id must be a number." });
  } else if (artistId < 1) {
    next({ status: 400, message: "Bad Request: Artist_Id must be > 0." });
  } else {
    try {
      const { data, error } = await fetcher.fetchArtistById(parseInt(artistId));
      if (error) {
        console.error(error);
        next(error);
      } else {
        resp.json({ status: 200, data });
      }
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
});

// Return the average values for bpm, energy, danceability,
// loudness, liveness, valence, duration, acousticness, speechiness, popularity
// based on specified artist id

app.get("/api/artists/averages/:artistId", async (req, resp, next) => {
  // process averages via Node to circumvent disabled aggregate functions on supabase free tier
  // Not ideal as introduces redundant averages computation. Would increase host costs.

  try {
    const { data, error } = await fetcher.fetchSongsByArtistId(
      req.params.artistId
    );

    if (error) {
      console.error(error);
      next({ status: 500, message: "Internal Server Error" });
    } else {
      resp.json({
        status: 200,
        data: calculateArtistSongAverages(data, req.params.artistId)
      });
    }
  } catch (error) {
    console.error(error);
    next({ status: 500, message: "Internal Server Error" });
    // Will this also catch error?
  }
});

// Return all genre_ids and genre_names
app.get("/api/genres", async (req, resp, next) => {
  const { data, error } = await fetcher.fetchGenres();
  if (error) {
    console.log(error);
    next({ status: 500, message: "Internal Server Error" });
  } else {
    resp.json({ status: 200, data });
  }
});

// Return all songs and associated data
app.get("/api/songs", async (req, resp) => {
  const { data, error } = await fetcher.fetchSongs();

  if (error) {
    resp.status(500);
    console.log(error);
  } else {
    resp.json({ status: 200, data });
  }
});

// Referenced: https://stackoverflow.com/questions/11258077/how-to-find-index-of-an-object-by-key-and-value-in-an-javascript-array
//
// Return all songs, sorted by provided column via :field
app.get("/api/songs/sort/:field", async (req, resp, next) => {
  // return all songs sorted by order field
  const validFields = orderValues.map((o) => {
    console.log(`o.key = ${o.key}`);
    return o.key;
  });

  // get index of valid key, then use key and value to return songs
  // ordered by defined field.
  // accepted values: id, title, artists(name), genres(name), year, duration
  const sortByIndex = validFields.indexOf(req.params.field);
  console.log(`sortByIndex = ${sortByIndex}`);
  if (sortByIndex === -1) {
    //If invalid sort key, return 400 Bad Request
    next({
      status: 400,
      message: `Bad Request: Invalid Order Parameter. Permitted sort_by values:{${validFields.toString()}} `
    });
  } else {
    // If sorting by artists, or genre, add referenced table,
    let orderParamObj;
    switch (orderValues[sortByIndex].key) {
      case "artist":
        orderParamObj = { referencedTable: "artists", ascending: true };
        break;

      case "genre":
        orderParamObj = { referencedTable: "genres", ascending: true };
        break;
      default:
        orderParamObj = { ascending: true };
        break;
    }

    const { data, error } = await fetcher.fetchOrderedSongs(
      orderValues[sortByIndex].value,
      orderParamObj
    );

    // const { data, error } = await supabase
    //   .from("songs")
    //   .select(
    //     `song_id, title, artists(artist_id, artist_name), genres(genre_id, genre_name),
    //     year, bpm, energy, danceability, loudness, liveness, valence, duration,
    //     acousticness, speechiness, popularity`
    //   )
    //   // use value for given param
    //   .order(orderValues[sortByIndex].value, orderParamObj);

    if (error) {
      console.log(error);
      next({ status: 500, message: "Internal Server Error" });
    } else {
      resp.json({ status: 200, data });
    }
  }
});

app.get("/api/songs/:songId", async (req, resp, next) => {
  const songId = req.params.songId;

  if (isNaN(songId)) {
    next({ status: 400, message: "Bad Request: songId must be a number" });
  } else if (songId < 0) {
    next({ status: 400, message: "Bad Request: songId must be > 0" });
  } else {
    const { data, error } = await fetcher.fetchSongById(parseInt(songId));
    if (error) {
      console.log(error);
      next({ status: 500, message: "Internal Server Error" });
    } else {
      resp.json({ status: 200, data });
    }
  }
  //return song using specified song_id

  // await supabase
  //   .from("songs")
  //   .select(
  //     `song_id, title, artists(artist_id, artist_name), genres(genre_id, genre_name),
  //      year, bpm, energy, danceability, loudness, liveness, valence, duration,
  //      acousticness, speechiness, popularity`
  //   )
  //   .eq("song_id", req.params.songId);
});

app.get("/api/songs/search/begin/:substr", async (req, resp, next) => {
  // return songs where titles beginning with specified substring
  const { data, error } = await fetcher.fetchSongsBeginningWith(
    req.params.substr
  );
  // supabase
  //   .from("songs")
  //   .select(
  //     `song_id, title, artists(artist_id, artist_name), genres(genre_id, genre_name),
  //      year, bpm, popularity`
  //   )
  //   .ilike("song_id", `${req.params.substr}%`)
  //   .order("title", { ascending: true });

  if (error) {
    console.log(error);
    next({ status: 500, message: "Internal Server Error" });
  } else {
    resp.json({ status: 200, data });
  }
});

app.get("/api/songs/search/any/:substr", async (req, resp, next) => {
  // return songs where substring is anywhere in title

  const { data, error } = await fetcher.fetchSongsMatching(req.params.substr);

  if (error) {
    console.error(error);
    next({ status: 500, message: "Internal Server Error" });
  } else {
    resp.json({ status: 200, data });
  }
});

app.get("/api/songs/search/year/:substr", async (req, resp, next) => {
  // return songs where substring matches year.
  const date = new Date();

  if (
    isNaN(req.params.substr) ||
    req.params.substr < 1 ||
    req.params.substr > date.getFullYear()
  ) {
    next({
      status: 400,
      message: `Bad Request: Date must be a number > 1 and < ${date.getFullYear()}`
    });
  } else {
    const { data, error } = await fetcher.fetchSongsFromYear(
      parseInt(req.params.substr)
    );

    // supabase
    //   .from("songs")
    //   .select(
    //     `song_id, title, artists(artist_id, artist_name),
    //     genres(genre_id, genre_name),
    //    year, bpm, energy, danceability, loudness, liveness,
    //    valence, duration, acousticness, speechiness, popularity`
    //   )
    //   .eq("year", parseInt(req.params.substr))
    //   .order("year", { descending: true });
    if (error) {
      console.error(error);
      next({ status: 500, message: "Internal Server Error" });
    } else {
      resp.json({ status: 200, data });
    }
  }
});

// Return all songs matching artist_id
app.get("/api/songs/artist/:id", async (req, resp, next) => {
  const artistId = req.params.id;

  if (isNaN(artistId)) {
    next({ status: 400, message: "Bad Request: artist_id must be a number" });
  } else {
    const { data, error } = await fetcher.fetchSongsByArtistId(
      parseInt(artistId)
    );
    // TODO: Add http 400 for string input
    if (error) {
      console.error(error);
      next({ status: 500, message: "Internal Server Error" });
    } else resp.json({ status: 200, data });
  }
});

// return all songs matching genre_id
app.get("/api/songs/genre/:id", async (req, resp, next) => {
  if (isNaN(req.params.id) || req.params.id < 0) {
    next({
      status: 400,
      message: "Bad Request: Genre_Id must be a number > 0"
    });
  } else {
    const { data, error } = await fetcher.fetchSongsByGenre(req.params.id);

    if (error) {
      console.error(error);
      next({ status: 500, message: "Internal Server Error" });
    } else {
      resp.json({ status: 200, data });
    }
  }
});

// return all the songs for specified playlist_id
// return fields: song_id, title, artist, name, genre name, year
app.get("/api/playlists/:id", async (req, resp, next) => {
  const listId = req.params.id;

  if (isNaN(listId) || listId < 1) {
    next({
      status: 400,
      message: "Bad Request: Playlist_Id must be a number > 0"
    });
  } else {
    const { data, error } = await fetcher.fetchSongsByPlaylistId(
      parseInt(listId)
    );
    // const { data, error } = await supabase
    //   .from("songs")
    //   .select(
    //     `playlists!inner(playlist_id), song_id, title, artists!inner(artist_name), genres!inner(genre_name),
    //    year`
    //   )
    //   //playlist id is on separate table.
    //   .eq("playlists.playlist_id", req.params.id);
    if (error) {
      console.log(error);
      next({ status: 500, message: "Internal Server Error" });
    } else {
      resp.json({ status: 200, data });
    }
  }
});

// For all moods:
// if value is > 20 or < 1, default to 20.

// return top number of songs sorted by danceability param
// descending order
app.get("/api/mood/dancing/:value", async (req, resp, next) => {
  let numSongs = parseInt(req.params.value);
  if (isNaN(numSongs) || numSongs < 1 || numSongs > 20) {
    numSongs = 20;
  }
  const { data, error } = await fetcher.fetchTopSongsByDanceability(numSongs);
  if (error) {
    console.error(error);
    next({ status: 500, message: "Internal Server Error" });
  } else {
    resp.json({ status: 200, data });
  }
});

app.get("/api/mood/happy/:value", async (req, resp, next) => {
  // return top number of songs sorted by valence param
  // descending order

  let numSongs = parseInt(req.params.value);
  if (numSongs < 1 || numSongs > 20) {
    numSongs = 20;
  }
  const { data, error } = await fetcher.fetchTopSongsByHappiness(numSongs);

  // supabase
  //   .from("songs")
  //   .select(
  //     `song_id, title, artists!inner(artist_id, artist_name), genres!inner(genre_id, genre_name),
  //      year`
  //   )
  //   .order("valence", { ascending: false })
  //   .limit(numSongs);

  if (error) {
    console.log(error);
    next({ status: 500, message: "Internal Server Error" });
  } else {
    resp.json({ status: 200, data });
  }
});

app.get("/api/mood/coffee/:value", async (req, resp, next) => {
  // return top number of songs sorted by coffee param
  // descending order

  let numSongs = parseInt(req.params.value);
  if (numSongs < 1 || numSongs > 20 || isNaN(req.params.value)) {
    numSongs = 20;
  }

  // Modified to not use view.
  // Instead, fetch all songs and calculate totals, then sort by totals
  try {
    const { data, error } = await fetcher.fetchSongs();
    // console.log(data);
    if (error) {
      console.log(error);
      next({ status: 500, message: "Internal Server Error" });
    } else {
      resp.json({
        status: 200,
        data: calculateCoffeeValues(data).slice(0, numSongs)
      });
    }
    //Redundant error handling? Repeated code
  } catch (error) {
    console.error(error);
    next({ status: 500, message: "Internal Server Error" });
  }
});

app.get("/api/mood/studying/:value", async (req, resp, next) => {
  // return top X number of songs sorted by product of (speechiness*energy)
  //
  //  X is either user-defined, or if out of scope set to 20.
  //  Songs are sorted in descending order.

  let numSongs = parseInt(req.params.value);
  if (numSongs < 1 || numSongs > 20 || isNaN(req.params.value)) {
    numSongs = 20;
  }

  //Modify to not use view. Instead, fetch all songs and calculate totals, then sort by totals
  try {
    const { data, error } = await fetcher.fetchSongs();
    // console.log(data);
    if (error) {
      console.log(error);
      next({ status: 500, message: "Internal Server Error" });
    } else {
      resp.json({
        status: 200,
        data: calculateStudyValues(data).slice(0, numSongs)
      });
    }
  } catch (error) {
    console.error(error);
    next({ status: 500, message: "Internal Server Error" });
  }
});

// !!! The following function was AI Generated using OpenAI Sonnet 4.6 !!!
// This, and the error-handling that invokes it, was not the product of my work.
// eslint-disable-next-line no-unused-vars
app.use((err, req, resp, next) => {
  const errorMsg = err.message || err.details || "Internal Server Error";
  console.error(`[${err.status}] ${req.method} ${req.url} — ${errorMsg}`);
  resp.status(err.status || 500).json({ message: errorMsg });
});

// Original error handling function.
// Referenced: https://expressjs.com/en/guide/error-handling.html
//
// Issues:     Did not include status in sent headers.
//             Clunky when used in code.

// function errorResponse(resp, status, error, msg) {
//   resp.status(status).json({
//     error: error,
//     message: msg
//   });
// }

app.listen(port, () => {
  console.log("server running @ port: " + port);
});
