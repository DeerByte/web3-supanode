let port = process.env.PORT;
const cors = require("cors");
const express = require("express");
const app = express();
app.use(
  cors({
    origin: ["https://web3-react.onrender.com"]
  })
);

//
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

// Return all artists, sorted by ascending name.
// Returns JSON
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
  // Parse Int of given artistId
  const artistId = parseInt(req.params.id);

  // If artistId is NaN, or < 1, return HTTP 400
  if (isNaN(req.params.id)) {
    next({ status: 400, message: "Bad Request: Artist_Id must be a number." });
  } else if (artistId < 1) {
    next({ status: 400, message: "Bad Request: Artist_Id must be > 0." });
  } else {
    // Otherwise, attempt to fetch and return artists.
    try {
      const { data, error } = await fetcher.fetchArtistById(artistId);
      //IF error while fetching, return HTTP 500
      if (error) {
        console.error(error);
        next(error);
      } else {
        // Otherwise, return HTTP 200 with data.
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
    // Fetch ordered songs
    const { data, error } = await fetcher.fetchOrderedSongs(
      orderValues[sortByIndex].value,
      orderParamObj
    );

    // If error server error, return HTTP 500
    if (error) {
      console.log(error);
      next({ status: 500, message: "Internal Server Error" });
    } else {
      // Else return HTTP 200 with data
      resp.json({ status: 200, data });
    }
  }
});

// Return song referenced by songId
app.get("/api/songs/:songId", async (req, resp, next) => {
  const songId = req.params.songId;

  // SongId must be a number, and songId > 0. If not, return HTTP 400 Bad Request.
  if (isNaN(songId)) {
    next({ status: 400, message: "Bad Request: songId must be a number" });
  } else if (songId < 0) {
    next({ status: 400, message: "Bad Request: songId must be > 0" });
  } else {
    //Otherwise, attempt to fetch song.
    const { data, error } = await fetcher.fetchSongById(parseInt(songId));
    if (error) {
      //If internal error, return HTTP 500
      console.log(error);
      next({ status: 500, message: "Internal Server Error" });
    } else {
      // Else return HTTP 200 with data
      resp.json({ status: 200, data });
    }
  }
});

// Fetch then return songs beginning with specified substring.
app.get("/api/songs/search/begin/:substr", async (req, resp, next) => {
  // fetch songs where titles beginning with specified substring
  const { data, error } = await fetcher.fetchSongsBeginningWith(
    req.params.substr
  );

  // If there is an error with fetch, return HTTP 500.
  if (error) {
    console.log(error);
    next({ status: 500, message: "Internal Server Error" });

    // Else, return HTTP 200 with json data.
  } else {
    resp.json({ status: 200, data });
  }
});

// Fetch and return songs in json where the provided substring matches
//  anywhere in the song title.
app.get("/api/songs/search/any/:substr", async (req, resp, next) => {
  // Fetch songs
  const { data, error } = await fetcher.fetchSongsMatching(req.params.substr);

  // If there is an error with fetch, return HTTP 500.
  if (error) {
    console.error(error);
    next({ status: 500, message: "Internal Server Error" });

    // Else, return HTTP 200 with json data.
  } else {
    resp.json({ status: 200, data });
  }
});

// Fetch and return songs in json where substring matches the song.year.
// The year must be a number, > 0, and not after the current year.
app.get("/api/songs/search/year/:substr", async (req, resp, next) => {
  const date = new Date();

  // If the year is not valid,
  if (
    isNaN(req.params.substr) ||
    req.params.substr < 1 ||
    req.params.substr > date.getFullYear()
  ) {
    // Return HTTP 400 and explain in message.
    next({
      status: 400,
      message: `Bad Request: Date must be a number > 1 and < ${date.getFullYear()}`
    });
    //Otherwise, fetch songs with matching year
  } else {
    const { data, error } = await fetcher.fetchSongsFromYear(
      parseInt(req.params.substr)
    );
    //If fetch errors, return HTTP 500
    if (error) {
      console.error(error);
      next({ status: 500, message: "Internal Server Error" });

      // Otherwise, return HTTP 200 and json data.
    } else {
      resp.json({ status: 200, data });
    }
  }
});

// Fetch and return all songs matching artist_id.
// ArtistId must be a number
app.get("/api/songs/artist/:id", async (req, resp, next) => {
  const artistId = req.params.id;

  //  If artistId is NaN, return HTTP 400.
  if (isNaN(artistId)) {
    next({ status: 400, message: "Bad Request: artist_id must be a number" });
  } else {
    // Otherwise, fetch songs by artistId.
    const { data, error } = await fetcher.fetchSongsByArtistId(
      parseInt(artistId)
    );

    // If there is an error during fetch, return HTTP 500
    if (error) {
      console.error(error);
      next({ status: 500, message: "Internal Server Error" });
      // Otherwise, return HTTP 200 with data via json
    } else resp.json({ status: 200, data });
  }
});

// Fetch and return all songs matching genre_id.
// Returns json. If there are no matching genreId, returns empty array.
// genreId must be a number and greater than 0.
app.get("/api/songs/genre/:id", async (req, resp, next) => {
  //  If genreId is NaN or <0, return HTTP 400
  if (isNaN(req.params.id) || req.params.id < 0) {
    next({
      status: 400,
      message: "Bad Request: Genre_Id must be a number > 0"
    });
    //Otherwise, attempt to fetch songs
  } else {
    const { data, error } = await fetcher.fetchSongsByGenre(req.params.id);
    // If there is an error fetching songs, return HTTP 500.
    if (error) {
      console.error(error);
      next({ status: 500, message: "Internal Server Error" });
      // Otherwise, return HTTP 200 with song data.
    } else {
      resp.json({ status: 200, data });
    }
  }
});

// Fetch and return all the songs for specified playlist_id
// return fields: song_id, title, artist, name, genre name, year
//  returns JSON
//  playlist ID must be a number, and > 0.
app.get("/api/playlists/:id", async (req, resp, next) => {
  const listId = req.params.id;

  //  If playlist ID is NaN, or is < 1, return HTTP 400
  if (isNaN(listId) || listId < 1) {
    next({
      status: 400,
      message: "Bad Request: Playlist_Id must be a number > 0"
    });
    // / Otherwise, attempt to fetch songs matching playlistId
  } else {
    const { data, error } = await fetcher.fetchSongsByPlaylistId(
      parseInt(listId)
    );

    // If error occurs when fetching, return HTTP 500.
    if (error) {
      console.log(error);
      next({ status: 500, message: "Internal Server Error" });
      // Otherwise, return HTTP 200 with data.
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
// It has been modified to include an http status, as resp.status does not send the
// status code in the headers.

// eslint-disable-next-line no-unused-vars
app.use((err, req, resp, next) => {
  if (resp.headersSent) {
    return next(err);
  }
  const errorMsg = err.message || err.details || "Internal Server Error";
  console.error(`[${err.status}] ${req.method} ${req.url} — ${errorMsg}`);
  // Disabled. MDN reference says status should have no effect on page text.
  // However, this API intentionally adds status as it is lost in the header.
  // eslint-disable-next-line no-undef
  resp
    .status(err.status || 500)
    .json({ status: err.status, message: errorMsg });
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
