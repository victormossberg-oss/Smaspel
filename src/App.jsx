import { useEffect, useRef, useState } from "react";
import { songs } from "./data/songs";
import { Disc3, Trophy } from "lucide-react";

function getRandomSong(playedSongs) {
  const availableSongs = songs.filter(
    (song) =>
      !playedSongs.some(
        (playedSong) =>
          playedSong.title === song.title &&
          playedSong.artist === song.artist
      )
  );

  const index = Math.floor(Math.random() * availableSongs.length);

  return availableSongs[index];
}

function createMatch() {
  const selectedSongs = [];
  const usedSongs = [];

  for (let i = 0; i < 5; i++) {
    const song = getRandomSong(usedSongs);

    selectedSongs.push(song);
    usedSongs.push(song);
  }

  return selectedSongs;
}

async function getMatchSong(song, usedMatchSongs = []) {
  const search = `${song.artist} ${song.title}`;

  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(
      search
    )}&entity=song&limit=10`
  );

  const data = await response.json();

const normalize = (text) =>
  text?.toLowerCase().trim().replace(/[^\p{L}\p{N}]/gu, "");

const availableResults = data.results.filter((result) => {
  return !usedMatchSongs.some(
    (usedSong) =>
      usedSong.trackId === result.trackId ||
      (normalize(usedSong.trackName) === normalize(result.trackName) &&
        normalize(usedSong.artistName) === normalize(result.artistName))
  );
});

const exactMatch = availableResults.find(
  (result) =>
    normalize(result.trackName) === normalize(song.title) &&
    normalize(result.artistName) === normalize(song.artist)
);

const titleMatch = availableResults.find(
  (result) =>
    normalize(result.trackName) === normalize(song.title)
);

return exactMatch || titleMatch || null;
}

function App() {
  const [search, setSearch] = useState("");
  const [selectedSong, setSelectedSong] = useState(null);
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [audio, setAudio] = useState(null);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [musicResults, setMusicResults] = useState([]);
  const [todaysSong, setTodaysSong] = useState(null);
  const [playedSongs, setPlayedSongs] = useState([]);
  const [round, setRound] = useState(1);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [gameMode, setGameMode] = useState("endless");
  const [matchSongs, setMatchSongs] = useState([]);
  const [matchRound, setMatchRound] = useState(0);
  const [matchScore, setMatchScore] = useState(0);
  const [usedMatchTrackIds, setUsedMatchTrackIds] = useState([]);
  const [usedMatchSongs, setUsedMatchSongs] = useState([]);

  const timeoutRef = useRef(null);

const clipLengths = [0.1, 0.5, 1, 2, 8];
const points = [5, 4, 3, 2, 1];

  // Hämtar dagens låt
const getTodaysSong = async () => {
  const currentSong = todaysSong
  ? {
      title: todaysSong.trackName,
      artist: todaysSong.artistName,
    }
  : null;

const selectedSong = getRandomSong(playedSongs);

setPlayedSongs((current) => [...current, selectedSong]);


  const search = `${selectedSong.artist} ${selectedSong.title}`;

  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(
      search
    )}&entity=song&limit=10`
  );

  const data = await response.json();

const song = data.results.find(
  (result) =>
    result.trackName?.toLowerCase() === selectedSong.title.toLowerCase() &&
    result.artistName?.toLowerCase() === selectedSong.artist.toLowerCase()
);

setTodaysSong(song || data.results[0]);
};

  // Körs när sidan laddas
  useEffect(() => {
    getTodaysSong();
  }, []);

  useEffect(() => {
  if (!todaysSong?.previewUrl) {
    return;
  }

  const newAudio = new Audio(todaysSong.previewUrl);

  setAudio(newAudio);

  return () => {
    newAudio.pause();
    newAudio.currentTime = 0;
  };
}, [todaysSong]);

useEffect(() => {
  if (!search.trim() || selectedSong) {
    setMusicResults([]);
    return;
  }

  const timeout = setTimeout(() => {
    searchMusic();
  }, 300);

  return () => clearTimeout(timeout);
}, [search]);

const findCuratedSong = (searchText) => {
  const searchLower = searchText.toLowerCase().trim();

  return songs.find((song) => {
    const title = song.title.toLowerCase();

    return (
      title === searchLower ||
      title.includes(searchLower)
    );
  });
};

  // Sök riktiga låtar från Apple
  const searchMusic = async () => {
    if (!search.trim()) {
      return;
    }
    const curatedSong = findCuratedSong(search);
    const response = await fetch(
  `https://itunes.apple.com/search?term=${encodeURIComponent(
    curatedSong
      ? `${curatedSong.artist} ${curatedSong.title}`
      : search
  )}&entity=song&limit=10`
);

    const data = await response.json();

    const filteredResults = data.results.filter((song) => {
  const title = song.trackName.toLowerCase();

  const unwantedWords = [
    "remix",
    "live",
    "karaoke",
    "instrumental",
    "acoustic",
    "radio edit",
    "extended",
    "version",
    "mix",
    "edit",
    "cover",
  ];

  return !unwantedWords.some((word) => title.includes(word));
});

const uniqueResults = filteredResults.filter(
  (song, index, self) =>
    index ===
    self.findIndex(
      (item) =>
        item.trackName.toLowerCase() === song.trackName.toLowerCase() &&
        item.artistName.toLowerCase() === song.artistName.toLowerCase()
    )
);

const exactMatch = curatedSong
  ? uniqueResults.find(
      (song) =>
        song.trackName.toLowerCase() === curatedSong.title.toLowerCase() &&
        song.artistName.toLowerCase() === curatedSong.artist.toLowerCase()
    )
  : null;

if (exactMatch) {
  setMusicResults([exactMatch]);
} else {
  setMusicResults(uniqueResults);
}
  };

  // Stoppa ljud
  const stopAudio = () => {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }

  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
};

const skipToNextClip = () => {
  stopAudio();

  if (attempt < clipLengths.length - 1) {
    setAttempt(attempt + 1);
    setSearch("");
    setSelectedSong(null);
    setResult(null);
  } else {
    setResult("lost");
    setGameFinished(true);
  }
};

const nextSong = () => {
  stopAudio();
  setIsPreviewPlaying(false);

  setGameFinished(false);
  setResult(null);
  setAttempt(0);
  setSearch("");
  setSelectedSong(null);
  setMusicResults([]);
  setRound((current) => current + 1);

  getTodaysSong();
};

const nextMatchSong = async () => {
  stopAudio();
  setIsPreviewPlaying(false);

  const nextRound = matchRound + 1;
  if (nextRound >= 5) {
  setGameFinished(true);
  setResult("matchFinished");
  return;
}

  setResult(null);
  setGameFinished(false);
  setAttempt(0);
  setSearch("");
  setSelectedSong(null);
  setMusicResults([]);

  setMatchRound(nextRound);


const nextSong = await getMatchSong(
  matchSongs[nextRound],
  usedMatchSongs
);

if (!nextSong) {
  alert("Kunde inte hitta en unik låt. Matchen kan inte fortsätta.");
  return;
}

setUsedMatchTrackIds((currentIds) => [
  ...currentIds,
  nextSong.trackId,
]);

setTodaysSong(nextSong);

};

  // Gissa
  const handleGuess = () => {
    stopAudio();

    if (!todaysSong || !selectedSong) {
      return;
    }

    // Jämför låtens ID
    if (
  selectedSong.trackName.toLowerCase() ===
    todaysSong.trackName.toLowerCase() &&
  selectedSong.artistName.toLowerCase() ===
    todaysSong.artistName.toLowerCase()
) {
  setResult("correct");
  setGameFinished(true);
  if (gameMode === "match") {
  setMatchScore((currentScore) => currentScore + points[attempt]);
} else {
  setScore((currentScore) => currentScore + points[attempt]);
}



    } else {
      if (attempt === clipLengths.length - 1) {
        setResult("lost");
        setGameFinished(true);

} 
else {
        setResult("wrong");
        setAttempt(attempt + 1);
        setSearch("");
        setSelectedSong(null);
      }
    }
  };

  // Spela ljud
  const playAudio = () => {
  if (!audio) {
    return;
  }

  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
  }

  audio.currentTime = 0;

  audio.play();

  timeoutRef.current = setTimeout(() => {
    audio.pause();
    audio.currentTime = 0;
    timeoutRef.current = null;
  }, clipLengths[attempt] * 1000);
};

const togglePreview = () => {
  if (!audio) {
    return;
  }

  if (isPreviewPlaying) {
    audio.pause();
    setIsPreviewPlaying(false);
  } else {
    audio.currentTime = 0;
    audio.play();
    setIsPreviewPlaying(true);

    audio.onended = () => {
      setIsPreviewPlaying(false);
    };
  }
};

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <main className="w-full max-w-xl">

{gameMode === "endless" && (
  <div className="grid grid-cols-2 gap-3 mb-5 max-w-sm mx-auto">
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wider">
        <Disc3 className="w-5 h-5 text-orange-500" />
        Omgång
      </div>
      <p className="text-2xl font-extrabold text-gray-900 mt-1">
        {String(round).padStart(2, "0")}
        <span className="text-sm font-medium text-gray-400"> / ∞</span>
      </p>
    </div>

    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wider">
        <Trophy className="w-5 h-5 text-orange-500" />
        Poäng
      </div>
      <p className="text-2xl font-extrabold text-gray-900 mt-1">
        {score}
        <span className="text-sm font-medium text-gray-400"> p</span>
      </p>
    </div>
  </div>
)}



        
        <div className="bg-white rounded-3xl shadow-lg p-8">


{gameMode === "endless" && (
  <div className="flex items-center justify-center gap-1 mb-8">
    <img
      src="/favicon.png"
      alt=""
      className="w-9 h-9 object-contain"
    />

    <h1 className="text-3xl font-extrabold text-black">
      Låt<span className="text-orange-500">jakten</span>
    </h1>
  </div>
)}



          {gameMode === "match" && !gameFinished && (
  <div className="text-center">
    <h2 className="text-3xl font-bold">
      ⚔️ Matchläge
    </h2>

    <p className="text-gray-500 mt-3">
      Låt {matchRound + 1} av 5
    </p>

    <button
      onClick={playAudio}
      className="w-24 h-24 mx-auto mt-8 flex items-center justify-center bg-black text-white rounded-full text-3xl hover:scale-105 transition"
    >
      ▶
    </button>
            <button
  onClick={skipToNextClip}
  className="block mx-auto mt-6 border border-gray-300 px-5 py-2 rounded-xl font-semibold hover:bg-gray-100 transition"
>
  {attempt === clipLengths.length - 1
    ? "Ge upp"
    : "Jag kan inte"}
</button>


<p className="text-center font-semibold text-lg mt-4">
  {points[attempt]} poäng ·{" "}
  {clipLengths[attempt]
    .toString()
    .replace(".", ",")}{" "}
  {clipLengths[attempt] === 1 ? "sekund" : "sekunder"}
</p>


    <div className="relative mt-6">
  <input
    type="text"
    placeholder="Skriv låtens titel..."
    value={search}
    onChange={(event) => {
      setSearch(event.target.value);
      setSelectedSong(null);
      setResult(null);
    }}
    className="w-full border border-gray-300 rounded-xl px-4 py-4 pr-12 text-lg outline-none focus:ring-2 focus:ring-black"
  />

  {search && (
    <button
      onClick={() => {
        setSearch("");
        setSelectedSong(null);
        setMusicResults([]);
        setResult(null);
      }}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black text-2xl"
      aria-label="Rensa sökning"
    >
      ×
    </button>
  )}

  {musicResults.map((song) => (
  <button
    key={song.trackId}
    onClick={() => {
      setSelectedSong(song);
      setSearch(`${song.trackName} - ${song.artistName}`);
      setMusicResults([]);
    }}
    className="w-full text-left border-b p-3 hover:bg-gray-100"
  >
    <p className="font-semibold">
      {song.trackName}
    </p>

    <p className="text-gray-500">
      {song.artistName}
    </p>
  </button>
))}
</div>

<button
  onClick={handleGuess}
  disabled={!selectedSong}
  className="w-full mt-4 bg-black text-white py-4 rounded-xl font-bold text-lg disabled:opacity-40 hover:bg-gray-800 transition"
>
  
  <span className="block">
    {selectedSong
      ? `Gissa · ${points[attempt]} poäng`
      : "Välj en låt"}
  </span>

  

  {selectedSong && (
    <span className="block text-sm font-normal text-gray-300 mt-1">
      {clipLengths[attempt]
        .toString()
        .replace(".", ",")} sekunder
    </span>
  )}
</button>

{result === "wrong" && (
  <p className="mt-6 text-center text-red-600 font-bold text-xl">
    ❌ Fel! Försök igen.
  </p>
)}



    <button
      onClick={() => setGameMode("endless")}
      className="mt-6 border border-gray-300 px-5 py-2 rounded-xl font-semibold hover:bg-gray-100 transition"
    >
      ← Tillbaka
    </button>
  </div>
)}

          {/* SPELA */}
          {gameMode === "endless" && !gameFinished && (
            <>
            
              <button
                onClick={playAudio}
                className="w-24 h-24 mx-auto mb-8 flex items-center justify-center bg-black text-white rounded-full text-3xl hover:scale-105 transition"
              >
                ▶
              </button>

<button
  onClick={skipToNextClip}
  className="block mx-auto mb-4 border border-gray-300 px-5 py-2 rounded-xl font-semibold hover:bg-gray-100 transition"
>
  {attempt === clipLengths.length - 1
    ? "Ge upp"
    : "Jag kan inte"}
</button>

<p className="text-center font-semibold text-lg mb-4">
{points[attempt]} poäng ·{" "}
{clipLengths[attempt]
  .toString()
  .replace(".", ",")}{" "}
{clipLengths[attempt] === 1 ? "sekund" : "sekunder"}
</p>
            </>
          )}

          {/* SPELPLAN */}
          {gameMode === "endless" && !gameFinished && (
            <>
<div className="relative">
  <input
    type="text"
    placeholder="Skriv låtens titel..."
    value={search}
    onChange={(event) => {
      setSearch(event.target.value);
      setSelectedSong(null);
      setResult(null);
    }}
    className="w-full border border-gray-300 rounded-xl px-4 py-4 pr-12 text-lg outline-none focus:ring-2 focus:ring-black"
  />

  {search && (
    <button
      onClick={() => {
        setSearch("");
        setSelectedSong(null);
        setMusicResults([]);
        setResult(null);
      }}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black text-2xl"
      aria-label="Rensa sökning"
    >
      ×
    </button>
  )}
</div>


              {/* APPLE-RESULTAT */}
              {musicResults.map((song) => (
                <button
                  key={song.trackId}
                  onClick={() => {
                    setSelectedSong(song);
                    setSearch(`${song.trackName} - ${song.artistName}`);
                    setMusicResults([]);
                  }}
                  className="w-full text-left border-b p-3 hover:bg-gray-100"
                >
                  <p className="font-semibold">
                    {song.trackName}
                  </p>

                  <p className="text-gray-500">
                    {song.artistName}
                  </p>
                </button>
              ))}

              {/* GISSA */}
              <button
                onClick={handleGuess}
                disabled={!selectedSong}
                className="w-full mt-4 bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                GISSA
              </button>

              {/* FEL */}
              {result === "wrong" && (
                <p className="mt-6 text-center text-red-600 font-bold text-xl">
                  ❌ Fel! Försök igen.
                </p>
              )}
            </>
          )}

          {/* RÄTT */}
          {result === "correct" && (
            <div className="mt-8 text-center">

              <h2 className="text-3xl font-bold text-green-600">
                RÄTT!
              </h2>

              <p className="text-xl font-semibold mt-4">
                {todaysSong?.trackName}
              </p>

              <p className="text-gray-500">
                {todaysSong?.artistName}
              </p>

              {todaysSong?.artworkUrl100 && (
<button
  onClick={togglePreview}
  className="relative w-56 h-56 mx-auto mt-6 rounded-2xl overflow-hidden shadow-xl group"
>
  <img
    src={todaysSong.artworkUrl100.replace("100x100", "600x600")}
    alt={`${todaysSong.trackName} albumomslag`}
    className="w-full h-full object-cover"
  />

  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition">
<span className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
  {isPreviewPlaying ? (
    <span className="flex gap-1">
      <span className="w-2 h-7 bg-black rounded-full"></span>
      <span className="w-2 h-7 bg-black rounded-full"></span>
    </span>
  ) : (
    <span className="ml-1 text-black text-3xl">
      ▶
    </span>
  )}
</span>
  </div>
</button>
)}

              <p className="text-gray-500 mt-2">
                Du klarade det på{" "}
                {clipLengths[attempt]} sekunder.
              </p>

              <p className="text-2xl font-bold mt-4">
                +{points[attempt]} poäng
              </p>

              <p className="text-gray-500 mt-6">
                🎵 Redo för nästa?
              </p>

              <button
  onClick={gameMode === "match" ? nextMatchSong : nextSong}
  className="w-full mt-6 bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition"
>
  Nästa låt
</button>

            </div>
          )}

          {/* FÖRLUST */}
          {result === "lost" && (
            <div className="mt-8 text-center">


              <h2 className="text-3xl font-bold text-red-600">
                INTE RÄTT
              </h2>

              <p className="text-xl font-semibold mt-4">
                Rätt svar var:
              </p>

              <p className="text-2xl font-bold mt-2">
                {todaysSong?.trackName}
              </p>

              <p className="text-gray-500">
                {todaysSong?.artistName}
              </p>

              {todaysSong?.artworkUrl100 && (
<button
  onClick={togglePreview}
  className="relative w-56 h-56 mx-auto mt-6 rounded-2xl overflow-hidden shadow-xl group"
>
  <img
    src={todaysSong.artworkUrl100.replace("100x100", "600x600")}
    alt={`${todaysSong.trackName} albumomslag`}
    className="w-full h-full object-cover"
  />

  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition">
    <span className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
      {isPreviewPlaying ? (
        <span className="flex gap-1">
          <span className="w-2 h-7 bg-black rounded-full"></span>
          <span className="w-2 h-7 bg-black rounded-full"></span>
        </span>
      ) : (
        <span className="ml-1 text-black text-3xl">
          ▶
        </span>
      )}
    </span>
  </div>
</button>
)}

              <p className="text-gray-500 mt-6">
                🎵 Redo för nästa?
              </p>
<button
  onClick={gameMode === "match" ? nextMatchSong : nextSong}
  className="w-full mt-6 bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition"
>
  Nästa låt
</button>
              

            </div>
          )}

{result === "matchFinished" && (
  <div className="text-center py-8">
    <h2 className="text-4xl font-bold mb-4">
      🏆 Matchen är slut!
    </h2>

    <p className="text-gray-500 text-lg mb-2">
      Du har spelat alla 5 låtar.
    </p>

    <p className="text-3xl font-bold my-6">
      ⭐ {matchScore} poäng
    </p>

    <button
      onClick={() => {
        setGameMode("endless");
        setResult(null);
        setGameFinished(false);
        setMatchRound(0);
        setMatchScore(0);
        setAttempt(0);
        setSearch("");
        setSelectedSong(null);
      }}
      className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800"
    >
      Tillbaka till endless
    </button>
  </div>
)}


        </div>


{gameMode === "endless" && (
  <div className="text-center mt-6 text-gray-500">
    

    <button
      onClick={() => {
        stopAudio();
        setScore(0);
        setRound(1);
        setPlayedSongs([]);
        setAttempt(0);
        setSearch("");
        setSelectedSong(null);
        setMusicResults([]);
        setResult(null);
        setGameFinished(false);
        setIsPreviewPlaying(false);
        getTodaysSong();
      }}
      className="mt-4 border border-gray-300 px-5 py-2 rounded-xl font-semibold hover:bg-gray-100 transition"
    >
      Börja om
    </button>

    {!result && (
      <button
        onClick={async () => {
          const newMatch = createMatch();
          const firstSong = await getMatchSong(newMatch[0], []);

          if (!firstSong) {
            alert("Kunde inte hitta låten. Försök igen!");
            return;
          }

          setMatchSongs(newMatch);
          setMatchRound(0);
          setMatchScore(0);
          setUsedMatchTrackIds([firstSong.trackId]);
          setUsedMatchSongs([firstSong]);
          setTodaysSong(firstSong);
          setGameMode("match");
        }}
        className="mt-4 ml-2 border border-gray-300 px-5 py-2 rounded-xl font-semibold hover:bg-gray-100 transition"
      >
        ⚔️ Utmana en vän
      </button>
    )}
  </div>
)}


      </main>
    </div>
  );
}

export default App;