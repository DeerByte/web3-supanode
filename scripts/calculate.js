// Calculate song metadata aggregates to bypass SupaBase SQL
// calculated field restrictions and view circumvention of
// row level security.
const calculateArtistSongAverages = (data, artistId) => {
  if (!data || !data.length) {
    // If there is no artist, return an empty array.
    //
    // Prevents errors when data.length is later
    // called on an undefined array.
    return [];
  } else {
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
    const artistName = data[0].artists.artist_name;

    const dataObj = {
      artist_id: artistId,
      artist_name: artistName,
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
    return dataObj;
  }
};

// Returns new array with songs sorted in order of coffeeness.
//
// Coffeeness is the song.liveness/song.acousticness, unless
// acousticness is 0 then coffeeness = 0.
//
// Songs are sorted in descending order of coffeeness.
const calculateCoffeeValues = (songDataArr) => {
  const coffeeData = songDataArr
    .map((song) => ({
      ...song,
      coffeeness:
        song.acousticness !== 0 ? song.liveness / song.acousticness : 0
    }))
    .sort((a, b) => b.coffeeness - a.coffeeness);
  return coffeeData;
};

// Returns new array with "Studyness" (song.energy*song.speechiness) added.
//
// Songs are sorted in ascending order of studyness.
// Ergo, lower energy n speech first.
const calculateStudyValues = (songDataArr) => {
  const studyData = songDataArr
    .map((song) => ({
      ...song,
      studyness: song.energy * song.speechiness
    }))
    .sort((a, b) => a.studyness - b.studyness);
  return studyData;
};

module.exports = {
  calculateArtistSongAverages,
  calculateCoffeeValues,
  calculateStudyValues
};
