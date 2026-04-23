let apiURL = process.env.API_URL;
let apiKey = process.env.API_KEY;
// TODO change to port 80 for deployment
let port = process.env.PORT;

const express = require("express");
const supa = require("@supabase/supabase-js");
const cors = require("cors");
const app = express();

//TODO set to OnRender origin for production.
app.use(cors());

const supabase = supa.createClient(apiURL, apiKey);

//Construct json messages
function jsonMessage(msgString) {
  return { message: msgString };
}

// Permissible order_by values: id, title, artist(name), genre(name), year, duration
// Key: valid orderBy string, Value: column name.
const orderValues = [
  { key: "id", value: "song_id" },
  { key: "title", value: "title" },
  { key: "artist", value: "artist_name" },
  { key: "year", value: "year" },
  { key: "duration", value: "duration" }
];

//TODO add more explicit server error handling (more than HTTP/500)

//TODO move routing to separate module.
app.get("/api/artists", async (req, resp) => {
  const { data, error } = await supabase
    .from("artists")
    .select(
      "artist_id, artist_name, types(type_id, type_name), artist_image_url, spotify_url, spotify_desc"
    )
    .order("artist_name", { ascending: true });
  if (error) {
    resp.status(500);
    console.log(error);
  } else {
    resp.send(data);
  }

  // return all data for all artists, alpha by name
  //return foreign key fields with related data
});

// Search by artist_id and return artist info, including info linked by foreign keys.

app.get("/api/artists/:id", async (req, resp) => {
  // Query supabase for artist given artist_id
  const { data, error } = await supabase
    .from("artists")
    .select(
      "artist_id, artist_name, types(type_id, type_name), artist_image_url, spotify_url, spotify_desc"
    )
    .eq("artist_id", req.params.id);

  if (data.length < 1) {
    // If not found, return error message.
    resp.json(jsonMessage("No artists found for artist_id=" + req.params.id));
  } else if (error) {
    //If internal error return status 500
  } else {
    // If there are results, return data.
    resp.send(data);
  }
});

// Return averages for given artistId
// return the average values for bpm, energy, danceability,
// loudness, liveness, valence, duration, acousticness, speechiness, popularity
// based on specified artist id

app.get("/api/artists/averages/:artistId", async (req, resp) => {
  // process averages via Node to circumvent disabled aggregate functions on supabase free tier

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
    .eq("artist_id", req.params.artistId);

  if (error) {
    resp.status(500);
    console.log(error);
  } else if (data.length < 1) {
    resp.json(jsonMessage("ArtistId not found."));
  } else {
    //TODO: move calculations to separate module
    let totals = {
      bpm: 0,
      energy: 0,
      danceablility: 0,
      loudness: 0,
      liveness: 0,
      valence: 0,
      duration: 0,
      acousticness: 0,
      speechiness: 0,
      popularity: 0
    };

    for (let song of data) {
      totals.bpm += song.bpm;
      totals.energy += song.energy;
      totals.danceablility += song.danceability;
      totals.loudness += song.loudness;
      totals.liveness += song.liveness;
      totals.valence += song.valence;
      totals.duration += song.duration;
      totals.acousticness += song.acousticness;
      totals.speechiness += song.speechiness;
      totals.popularity += song.popularity;
    }
    const numSongs = data.length;

    const dataObj = {
      artist_id: req.params.artistId,
      avg_bpm: totals.bpm / numSongs,
      avg_energy: totals.energy / numSongs,
      avg_danceability: totals.danceablility / numSongs,
      avg_loudness: totals.loudness / numSongs,
      avg_liveness: totals.liveness / numSongs,
      avg_valence: totals.valence / numSongs,
      avg_duration: totals.duration / numSongs,
      avg_acousticness: totals.acousticness / numSongs,
      avg_speechiness: totals.speechiness / numSongs,
      avg_popularity: totals.popularity / numSongs,
      numSongs: numSongs
    };
    if (error) {
      resp.status(500);
      console.log(error);
    } else {
      resp.json(dataObj);
    }
  }
});

// Return all genre_ids and genre_names
app.get("/api/genres", async (req, resp) => {
  const { data, error } = await supabase.from("genres").select();
  if (error) {
    resp.status(500);
    console.log(error);
  } else {
    resp.send(data);
  }
});

// Return all songs and associated data
app.get("/api/songs", async (req, resp) => {
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

  if (error) {
    resp.status(500);
    console.log(error);
  } else {
    resp.send(data);
  }
});

// referenced https://stackoverflow.com/questions/11258077/how-to-find-index-of-an-object-by-key-and-value-in-an-javascript-array

// Return all songs, sorted by provided column via :field
app.get("/api/songs/sort/:field", async (req, resp) => {
  // return all songs sorted by order field
  const validFields = orderValues.map((o) => {
    return o.key;
  });

  // get index of valid key
  const sortByIndex = validFields.indexOf(req.params.field);

  // If sorting by artists
  const orderParamObj =
    orderValues[sortByIndex].key === "artist"
      ? // reference artists table
        { referencedTable: "artists", ascending: true }
      : //otherwise, referenc not required.
        { ascending: true };

  // accepted values: id, title, artist(name), genre(name), year, duration
  // If param not accepted, return error message
  if (sortByIndex === -1) {
    resp.json(
      jsonMessage(
        "Invalid sort parameter. Permitted parameters: " +
          validFields.toString()
      )
    );
  } else {
    const { data, error } = await supabase
      .from("songs")
      .select(
        `song_id, title, artists(artist_id, artist_name), genres(genre_id, genre_name),
        year, bpm, energy, danceability, loudness, liveness, valence, duration, 
        acousticness, speechiness, popularity`
      )
      // use value for given param
      .order(orderValues[sortByIndex].value, orderParamObj);
    if (error) {
      resp.status(500);
      console.log(error);
    }
    resp.send(data);
  }
});

app.get("/api/songs/:songId", async (req, resp) => {
  //return song using specified song_id
  const { data, error } = await supabase
    .from("songs")
    .select(
      `song_id, title, artists(artist_id, artist_name), genres(genre_id, genre_name),
       year, bpm, energy, danceability, loudness, liveness, valence, duration, 
       acousticness, speechiness, popularity`
    )
    .eq("song_id", req.params.songId);
  if (error) {
    resp.status(500);
    console.log(error);
  } else {
    resp.send(data);
  }
});

app.get("/api/songs/search/begin/:substr", async (req, resp) => {
  // return songs where titles beginning with specified substring
  const { data, error } = await supabase
    .from("songs")
    .select(
      `song_id, title, artists(artist_id, artist_name), genres(genre_id, genre_name),
       year, bpm, popularity`
    )
    .ilike("song_id", `${req.params.substr}%`)
    .order("title", { ascending: true });

  if (error) {
    resp.status(500);
    console.log(error);
  } else if (data.length < 1) {
    resp.json(jsonMessage("No match found for " + req.params.substr));
  } else {
    resp.send(data);
  }
});

app.get("/api/songs/search/any/:substr", async (req, resp) => {
  // return songs where substring is anywhere in title

  const { data, error } = await supabase
    .from("songs")
    .select(
      `song_id, title, artists(artist_id, artist_name), genres(genre_id, genre_name),
       year, bpm, popularity`
    )
    .ilike("song_id", `%${req.params.substr}%`);
  if (error) {
    resp.status(500);
    console.log(error);
  } else if (data.length < 1) {
    resp.json(jsonMessage("No match found for " + req.params.substr));
  } else {
    resp.send(data);
  }
});

app.get("/api/songs/search/year/:substr", async (req, resp) => {
  // return songs where substring matches year.
  const date = new Date();

  if (req.params.substr < 1 || req.params.substr > date.getFullYear()) {
    resp.json(
      jsonMessage(
        `Invalid year. Enter a year between 1 and ${date.getFullYear()}`
      )
    );
  } else {
    const { data, error } = await supabase
      .from("songs")
      .select(
        `song_id, title, artists(artist_id, artist_name), genres(genre_id, genre_name),
       year, bpm, energy, danceability, loudness, liveness, valence, duration, 
       acousticness, speechiness, popularity`
      )
      .eq("year", parseInt(req.params.substr))
      .order("year", { descending: true });

    if (error) {
      resp.status(500);
      console.log(error);
    } else if (data.length > 0) {
      resp.send(data);
    } else {
      resp.json(jsonMessage("No songs found for year " + req.params.substr));
    }
  }
});

// Return all songs matching artist_id
app.get("/api/songs/artist/:id", async (req, resp) => {
  const { data, error } = await supabase
    .from("songs")
    .select(
      `song_id, title, artists!inner(artist_id, artist_name), genres(genre_id, genre_name),
       year, bpm, energy, danceability, loudness, liveness, valence, duration, 
       acousticness, speechiness, popularity`
    )
    .eq("artist_id", req.params.id)
    .order("year", { descending: true });
  if (error) {
    resp.status(500);
    console.log(error);
  } else if (data.length < 1) {
    resp.json(jsonMessage("Artist_id not found for id=" + req.params.id));
  } else {
    resp.send(data);
  }
});

// return all songs matching genre_id
app.get("/api/songs/genre/:id", async (req, resp) => {
  if (req.params.id < 0) {
    resp.json(jsonMessage("Invalid genre_id. Enter value > 0"));
  } else {
    const { data, error } = await supabase
      .from("songs")
      .select(
        `song_id, title, artists(artist_id, artist_name), genres(genre_id, genre_name),
       year, bpm, energy, danceability, loudness, liveness, valence, duration, 
       acousticness, speechiness, popularity`
      )
      .eq("genre_id", req.params.id)
      .order("song_id", { ascending: true });

    if (error) {
      resp.status(500);
      console.log(error);
    } else if (data.length > 0) {
      resp.send(data);
    } else {
      resp.json(jsonMessage("No songs found for genre_id " + req.params.id));
    }
  }
});

// return all the songs for specified playlist_id
// return fields: song_id, title, artist, name, genre name, year
app.get("/api/playlists/:id", async (req, resp) => {
  const listId = req.params.id;

  if (listId < 1) {
    resp.json(jsonMessage("Invalid playlist_id. Enter id > 0"));
  } else {
    const { data, error } = await supabase
      .from("songs")
      .select(
        `playlists!inner(playlist_id), song_id, title, artists!inner(artist_name), genres!inner(genre_name),
       year, `
      )
      //playlist id is on separate table.
      .eq("playlists.playlist_id", req.params.id);
    if (error) {
      resp.status(500);
      console.log(error);
    }
    if (data.length > 0) {
      resp.send(data);
    } else {
      resp.json(jsonMessage("No songs found for playlist_id " + req.params.id));
    }
  }
});

// For all moods:
// if value is > 20 or < 1, default to 20.

// return top number of songs sorted by danceability param
// descending order
app.get("/api/mood/dancing/:value", async (req, resp) => {
  let numSongs = parseInt(req.params.value);
  if (numSongs < 1 || numSongs > 20) {
    numSongs = 20;
  }
  const { data, error } = await supabase
    .from("songs")
    .select(
      `song_id, title, artists!inner(artist_id, artist_name), genres!inner(genre_id, genre_name),
       year, bpm, energy, danceability, loudness, liveness, valence, duration, 
       acousticness, speechiness, popularity, playlists!inner(playlist_id)`
    )
    .order("danceability", { ascending: false })
    .limit(numSongs);
  if (error) {
    resp.status(500);

    console.log(error);
  }
  resp.send(data);
});

app.get("/api/mood/happy/:value", async (req, resp) => {
  // return top number of songs sorted by valence param
  // descending order

  let numSongs = parseInt(req.params.value);
  if (numSongs < 1 || numSongs > 20) {
    numSongs = 20;
  }
  const { data, error } = await supabase
    .from("songs")
    .select(
      `song_id, title, artists!inner(artist_id, artist_name), genres!inner(genre_id, genre_name),
       year`
    )
    .order("valence", { ascending: false })
    .limit(numSongs);

  if (error) {
    resp.status(500);
    console.log(error);
  }
  resp.send(data);
});

app.get("/api/mood/coffee/:value", async (req, resp) => {
  // return top number of songs sorted by coffee param
  // descending order

  let numSongs = parseInt(req.params.value);
  if (numSongs < 1 || numSongs > 20) {
    numSongs = 20;
  }
  const { data, error } = await supabase
    .from("song_coffee_view")
    .select()
    .order("coffee_score", { ascending: false })
    .limit(numSongs);

  resp.send(data);

  if (error) {
    console.log(error);
  }
});

app.get("/api/mood/studying/:value", async (req, resp) => {
  // return top number of songs sorted by product of (speechiness*energy)
  // param
  // descending order

  let numSongs = parseInt(req.params.value);
  if (numSongs < 1 || numSongs > 20) {
    numSongs = 20;
  }
  const { data, error } = await supabase
    .from("song_study_view")
    .select()
    .limit(numSongs);

  resp.send(data);
  if (error) {
    console.log(error);
  }
});

app.listen(port, () => {
  console.log("server running @ port: " + port);
  console.log("http://localhost:8080/api/artists");
  console.log("http://localhost:8080/api/genres");
  console.log("http://localhost:8080/api/songs");

  console.log("http://localhost:8080/api/artists/averages/42");
});
