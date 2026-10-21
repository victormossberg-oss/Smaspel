import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "../styles/Ordspelet.css";


const normalizeWord = (word) =>
  word.trim().normalize("NFC").toLocaleUpperCase("sv-SE");

function getFeedback(guess, answer) {
  const result = Array(guess.length).fill("gray");
  const remaining = {};

  // Först markerar vi bokstäver på rätt plats.
  for (let i = 0; i < answer.length; i++) {
    if (guess[i] === answer[i]) {
      result[i] = "green";
    } else {
      remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
    }
  }

  // Sedan markerar vi bokstäver som finns på fel plats.
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === "green") continue;

    if (remaining[guess[i]] > 0) {
      result[i] = "yellow";
      remaining[guess[i]]--;
    }
  }

  return result;
}

function App() {
  // Alla tillstånd deklareras innan effekter och funktioner.
  const [words, setWords] = useState([]);
  const [dictionaryLoaded, setDictionaryLoaded] = useState(false);
  const [dictionaryError, setDictionaryError] = useState("");

  const [answer, setAnswer] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState([]);
  const [activeCell, setActiveCell] = useState(0);
  const [message, setMessage] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  // Läs in den svenska ordlistan en gång.
  useEffect(() => {
    let cancelled = false;

    async function loadDictionary() {
      try {
        const response = await fetch("/ordlista.txt");

        if (!response.ok) {
          throw new Error(
            `Kunde inte läsa ordlistan (${response.status}).`
          );
        }

        const text = await response.text();

        const dictionary = [
          ...new Set(
            text
              .split(/\r?\n/)
              .map(normalizeWord)
              .filter((word) => /^[A-ZÅÄÖ]+$/.test(word))
          ),
        ];

        if (dictionary.length === 0) {
          throw new Error(
            "Ordlistan är tom eller har ett annat format än väntat."
          );
        }

        // Hemliga ord ska ha 4–8 bokstäver.
        const solutions = dictionary.filter(
          (word) => [...word].length >= 4 && [...word].length <= 6
        );

        if (solutions.length === 0) {
          throw new Error(
            "Inga hemliga ord med 4–8 bokstäver hittades."
          );
        }

        if (cancelled) return;

        setWords(dictionary);

        const firstAnswer =
          solutions[Math.floor(Math.random() * solutions.length)];

        setAnswer(firstAnswer);
        setCurrentGuess(Array([...firstAnswer].length).fill(""));
        setActiveCell(0);
        setDictionaryLoaded(true);
      } catch (error) {
        if (cancelled) return;

        console.error("Ordlistan kunde inte laddas:", error);
        setDictionaryError(
          "Kunde inte ladda ordlistan. Kontrollera public/ordlista.txt."
        );
      }
    }

    loadDictionary();

    return () => {
      cancelled = true;
    };
  }, []);

  function pickNewAnswer(exclude = "") {
    const candidates = words.filter(
      (word) =>
        [...word].length >= 4 &&
        [...word].length <= 6 &&
        word !== exclude
    );

    if (candidates.length === 0) {
      setMessage("Kunde inte hitta något nytt ord.");
      return;
    }

    const nextAnswer =
      candidates[Math.floor(Math.random() * candidates.length)];

    setAnswer(nextAnswer);
    setCurrentGuess(Array([...nextAnswer].length).fill(""));
    setGuesses([]);
    setActiveCell(0);
    setMessage("");
    setGameOver(false);
    setWon(false);
    setIsRevealing(false);
  }


function submitGuess() {
  if (!dictionaryLoaded || !answer || gameOver || isRevealing) return;

  const guess = normalizeWord(currentGuess.join(""));

  if (currentGuess.some((letter) => !letter)) {
    setMessage("Fyll i alla bokstäver först.");
    return;
  }

  if (!words.includes(guess)) {
    setMessage("Ordet finns inte i ordlistan.");
    return;
  }

  const feedback = getFeedback(guess, answer);
  const nextGuesses = [...guesses, { word: guess, feedback }];

  setGuesses(nextGuesses);
  setCurrentGuess(Array([...answer].length).fill(""));
  setActiveCell(0);
  setMessage("");
  setIsRevealing(true);
}


function finishReveal() {
  if (!isRevealing) return;

  setIsRevealing(false);

  const lastGuess = guesses[guesses.length - 1];

  if (!lastGuess) return;

  if (lastGuess.word === answer) {
    setWon(true);
    setGameOver(true);
    setMessage("Rätt! Du hittade ordet!");
  } else if (guesses.length === 6) {
    setGameOver(true);
    setMessage(`Slut på försök! Ordet var ${answer}.`);
  }
}



  function handleKey(key) {
    if (!dictionaryLoaded || !answer || gameOver || isRevealing) return;

    if (key === "ENTER") {
      submitGuess();
      return;
    }

    if (key === "BACKSPACE") {
      setCurrentGuess((previous) => {
        const next = [...previous];

        if (next[activeCell]) {
          next[activeCell] = "";
        } else if (activeCell > 0) {
          next[activeCell - 1] = "";
          setActiveCell(activeCell - 1);
        }

        return next;
      });

      setMessage("");
      return;
    }

    if (/^[A-ZÅÄÖ]$/i.test(key)) {
      const letter = normalizeWord(key);

      setCurrentGuess((previous) => {
        const next = [...previous];
        next[activeCell] = letter;
        return next;
      });

      setActiveCell((previous) =>
        Math.min(previous + 1, currentGuess.length - 1)
      );

      setMessage("");
    }
  }

  // Stöd för datorns fysiska tangentbord.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === "Enter") {
        event.preventDefault();
        handleKey("ENTER");
      } else if (event.key === "Backspace") {
        event.preventDefault();
        handleKey("BACKSPACE");
      } else if (/^[a-zåäö]$/i.test(event.key)) {
        handleKey(event.key);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [currentGuess, activeCell, guesses, answer, gameOver, dictionaryLoaded, isRevealing]);

  const keyboardRows = [
    [..."QWERTYUIOPÅ"],
    [..."ASDFGHJKLÖÄ"],
    ["ENTER", ..."ZXCVBNM", "BACKSPACE"],
  ];

  // Visa den bästa färgen som hittats för varje tangent.
  const keyboardStatus = {};

  guesses.forEach(({ word, feedback }) => {
    [...word].forEach((letter, index) => {
      const color = feedback[index];
      const previous = keyboardStatus[letter];

      if (
        color === "green" ||
        (color === "yellow" && previous !== "green") ||
        !previous
      ) {
        keyboardStatus[letter] = color;
      }
    });
  });

  if (dictionaryError) {
    return (
      <main className="app">
        <header className="header">
          <h1>ORDSPELET</h1>
        </header>
        <p className="message">{dictionaryError}</p>
      </main>
    );
  }

  if (!dictionaryLoaded || !answer) {
    return (
      <main className="app">
        <header className="header">
          <h1>ORDSPELET</h1>
        </header>
        <p className="message">Laddar...</p>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="header">
        <h1>ORDSPELET</h1>
      </header>

      <section className="game">
  <div className="game-main">
        <p className="hint">
          Ordet har <strong>{[...answer].length}</strong> bokstäver.
        </p>

        <div className="board">
          {Array.from({ length: 6 }, (_, row) => {
            const submitted = guesses[row];
            const isCurrent = row === guesses.length && !gameOver;
            const isRevealingRow =
  isRevealing && submitted && row === guesses.length - 1;

            return (
              <div
  className="board-row"
  key={row}
  style={{ "--word-length": [...answer].length }}
>
                {Array.from({ length: [...answer].length }, (_, col) => {
                  const letter = submitted
                    ? [...submitted.word][col]
                    : isCurrent
                      ? currentGuess[col] || ""
                      : "";

                  const color = submitted
                    ? submitted.feedback[col]
                    : "";

                  return (
                    <div
className={`tile ${color} ${letter ? "filled" : ""} ${
  isCurrent && activeCell === col ? "active" : ""
} ${isRevealingRow ? "revealing" : ""}`}
style={{ "--tile-index": col }}
onAnimationEnd={() => {
  if (isRevealingRow && col === [...answer].length - 1) {
    finishReveal();
  }
}}
                      key={col}
                      onClick={() => {
                        if (isCurrent) setActiveCell(col);
                      }}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
          </div>

        <p
          className={`message ${won ? "success" : ""}`}
          aria-live="polite"
        >
          {message || " "}
        </p>



{gameOver &&
  createPortal(
    <div className="result-overlay">
      <div
        className="result-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
      >
        <div className="result-icon">
          {won ? "🏆" : "🎯"}
        </div>

        <p className="result-eyebrow">
          {won ? "SNYGGT SPELAT" : "BRA FÖRSÖK"}
        </p>

        <h2 id="result-title">
          {won ? "Du knäckte ordet!" : "Inte den här gången!"}
        </h2>

        <p className="result-description">
          {won
            ? `Du hittade ordet på ${guesses.length} försök.`
            : "Rätt svar var:"}
        </p>

        <div className="result-word">
          {[...answer].map((letter, index) => (
            <span key={index}>{letter}</span>
          ))}
        </div>

        <button
          className="result-play-button"
          onClick={() => pickNewAnswer(answer)}
          autoFocus
        >
          Spela igen <span>→</span>
        </button>

        <p className="result-footer">
          småspel.se · Små spel. Stora utmaningar.
        </p>
      </div>
    </div>,
    document.body
  )}



        <div className="keyboard">
          {keyboardRows.map((row, index) => (
            <div className="keyboard-row" key={index}>
              {row.map((key) => {
                const status = keyboardStatus[key] || "";
                const wide = key === "ENTER" || key === "BACKSPACE";

                return (
                  <button
                    key={key}
                    className={`key ${status} ${wide ? "wide" : ""}`}
                    onClick={() => handleKey(key)}
                    aria-label={
                      key === "BACKSPACE"
                        ? "Radera bokstav"
                        : key === "ENTER"
                          ? "Skicka gissning"
                          : key
                    }
                  >
                    {key === "BACKSPACE" ? "⌫" : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

{gameOver && (
  <button className="restart" onClick={() => pickNewAnswer(answer)}>
    Nytt ord
  </button>
)}
      </section>
    </main>
  );
}

export default App;
