# Assignment 1 Node API

## Overview

This project contains data provided by Dr. Randy Connolly for COMP 4513: Web 3.

A database was constructed on SupaBase using provided .csv files. The assignment requirements can be found [HERE](./info/COMP%204513%20Assignment%201.pdf).

---

## Built With

**Node.js** - JS Runtime.
**Express** - Routing, request, and response handling.
**SupaBase** - Cloud DB
**Render.com** - Hosting service

---

## API Endpoints

| API Endpoint                      |                                                                                                                                                                                                                                    Description |
| :-------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| `/api/artists`                    |                                                                                                                                                                               Return all data for all artists, returned in alphabetical order. |
| `/api/artists/:id`                |                                                                                                                                                                                                     Return artist given a supplied `artist_id` |
| `/api/artists/averages/:artistId` |                                                                                          Given an `artist_id`, return averages of bpm, energy, danceability, loudness, liveness, valence, duration, acousticness, speechiness, and popularity. |
| `/api/songs/`                     |                                                                                                                                                                     Return all songs and their associated information from all related tables. |
| `api/songs/sort/:field`           |                                                                                                                                                     Return all songs and their associated information, sorted by a provided column id `:field` |
| `/api/songs/:songId`              |                                                                                                                           Given a `song_id`, return all information for a specific song. Otherwise, return a message saying no song was found. |
| `/api/songs/search/begin/:substr` |                                                                                                                                                                                  Return all songs where the song's title begins with `:substr` |
| `/api/songs/search/any/:substr`   |                                                                                                                                                  Return all songs where a provided substring (`:substr`) is contained within the song's title. |
| `/api/songs/search/year/:substr`  |                                                                                                                                                              Return all the songs where the song year matches a provided substring (`:substr`) |
| `/api/songs/artist/:id`           |                                                                                                                                                                                              Return all songs matching a specified `artist_id` |
| `/api/songs/genre/:id`            |                                                                                                                                                                                               Return all songs matching a specified `genre_id` |
| `/api/playlists/:id`              |                                                                                                                                                                                           Returns all songs matching a specified `playlist_id` |
| `/api/mood/dancing/:value`        |                                                              _X_ = `:value`. Returns the top _X_ number of songs, sorted by descending order of `danceability`, where _X_ is a value between 1 and 20. If _X_ is outside this range, _X_ = 20. |
| `/api/mood/happy/:value`          |                                                                   _X_ = `:value`. Returns the top _X_ number of songs, sorted by descending order of `valence`, where _X_ is a value between 1 and 20. If _X_ is outside this range, _X_ = 20. |
| `/api/mood/coffee/:value`         | _X_ = `:value`. Returns the top _X_ number of songs, sorted by descending order of `coffee_score`, where _X_ is a value between 1 and 20. If _X_ is outside this range, _X_ = 20. `coffee_score` is the result of \(liveness / acousticness\). |
| `/api/mood/studying/:value`       |    _X_ = `:value`. Returns the top _X_ number of songs, sorted by descending order of `study_score`, where _X_ is a value between 1 and 20. If _X_ is outside this range, _X_ = 20. `study_score` is the result of \(speechiness \* energy \). |

---

### Test URLS

[/api/artists](https://web3-supanode.onrender.com/api/artists)

[/api/artists/129](https://web3-supanode.onrender.com/api/artists/129)

[/api/artists/sdfjkhsdf](https://web3-supanode.onrender.com/api/artists/sdfjkhsdf)

[/api/artists/averages/129](https://web3-supanode.onrender.com/api/averages/129)

[/api/genres](https://web3-supanode.onrender.com/api/genres)

[/api/songs](https://web3-supanode.onrender.com/api/songs)

[/api/songs/sort/artist](https://web3-supanode.onrender.com/api/songs/sort/artist)

[/api/songs/sort/year](https://web3-supanode.onrender.com/api/songs/sort/year)

[/api/songs/sort/duration](https://web3-supanode.onrender.com/api/songs/sort/duration)

[/api/songs/1010](https://web3-supanode.onrender.com/api/songs/1010)

[/api/songs/sjdkfhsdkjf](https://web3-supanode.onrender.com/api/songs/sjdkfhsdkjf)

[/api/songs/search/begin/love](https://web3-supanode.onrender.com/api/songs/search/begin/love)

[/api/songs/search/begin/sdjfhs](https://web3-supanode.onrender.com/api/songs/search/begin/sdjfhs)

[/api/songs/search/any/love](https://web3-supanode.onrender.com/api/songs/search/any/love)

[/api/songs/search/year/2017](https://web3-supanode.onrender.com/api/songs/search/year/2017)

[/api/songs/search/year/2027](https://web3-supanode.onrender.com/api/songs/search/year/2027)

[/api/songs/artist/149](https://web3-supanode.onrender.com/api/songs/artist/149)

[/api/songs/artist/7834562](https://web3-supanode.onrender.com/api/songs/artist/7834562)

[/api/songs/genre/115](https://web3-supanode.onrender.com/api/songs/genre/115)

[/api/playlists](https://web3-supanode.onrender.com/api/playlists)

[/api/playlists/3](https://web3-supanode.onrender.com/api/playlists/3)

[/api/playlists/35362](https://web3-supanode.onrender.com/api/playlists/35362)

[/api/mood/dancing/5](https://web3-supanode.onrender.com/api/mood/dancing/5)

[/api/mood/dancing/500](https://web3-supanode.onrender.com/api/mood/dancing/500)

[/api/mood/dancing/ksdjf](https://web3-supanode.onrender.com/api/mood/happy/8)

[/api/mood/happy/8](https://web3-supanode.onrender.com)

[/api/mood/happy](https://web3-supanode.onrender.com/api/mood/happy)

[/api/mood/coffee/10](https://web3-supanode.onrender.com/api/mood/coffee/10)

[/api/mood/studying/15](https://web3-supanode.onrender.com/api/mood/studying/15)
