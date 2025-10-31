import React, { useEffect, useState, useRef } from "react";

// decode HTML entities dari API
function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

const STORAGE_KEY = "quiz-app-progress";

export default function App() {
  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem("quiz-user")) || null
  );
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [remaining, setRemaining] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | running | finished
  const timerRef = useRef(null);

  // Perlu array untuk menyimpan urutan jawaban untuk setiap soal
  const [choicesByIndex, setChoicesByIndex] = useState([]);

  // Ambil pertanyaan dari OpenTDB
  async function startQuiz() {
    setStatus("loading");
    const res = await fetch("https://opentdb.com/api.php?amount=10&category=19&difficulty=easy");
    const data = await res.json();
    const qs = data.results.map((q) => ({
      ...q,
      question: decodeHtml(q.question),
      correct_answer: decodeHtml(q.correct_answer),
      incorrect_answers: q.incorrect_answers.map(decodeHtml),
    }));
    setQuestions(qs);

    // Buat urutan random untuk pilihan pada setiap soal SEKALI SAJA
    const mappedChoices = qs.map((q) => {
      // gunakan slice supaya tidak mengubah array asli
      return shuffle([q.correct_answer, ...q.incorrect_answers].slice());
    });
    setChoicesByIndex(mappedChoices);

    setStatus("running");
    setRemaining(60); //mengasih waktu 1 menit / 60 detik
  }

  // Timer
  useEffect(() => {
    if (status !== "running") return;
    timerRef.current = setInterval(() => {
      setRemaining((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setStatus("finished");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [status]);

  // Menjawab soal
  function handleAnswer(ans) {
    const q = questions[index];
    const correct = ans === q.correct_answer;
    setAnswers((a) => [...a, { q: q.question, ans, correct }]);
    if (index + 1 >= questions.length) {
      setStatus("finished");
    } else {
      setIndex(index + 1);
    }
  }

  // Format waktu
  function formatTime(s) {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  // Jika belum login
  if (!user)
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6 border border-indigo-100">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-indigo-700">Masuk ke Quiz App</h2>
            <p className="text-sm text-slate-500 mt-1">Silakan masukkan nama kamu</p>
          </div>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const username = e.target.username.value.trim();
              if (!username) return;
              localStorage.setItem("quiz-user", JSON.stringify({ username }));
              setUser({ username });
            }}
          >
            <input
              name="username"
              placeholder="Nama pengguna"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="w-full inline-flex justify-center rounded-lg bg-indigo-600 text-white font-medium px-4 py-2 hover:bg-indigo-700 active:bg-indigo-800 transition"
            >
              Masuk
            </button>
          </form>
        </div>
      </div>
    );

  // Jika idle
  if (status === "idle")
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8 border border-indigo-100 text-center">
          <h2 className="text-2xl font-bold text-slate-800">
            Halo, <span className="text-indigo-600">{user.username}</span>
          </h2>
          <p className="text-slate-500 mt-1">Siap untuk mulai kuis Matematika?</p>
          <button
            onClick={startQuiz}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 text-white font-medium px-6 py-3 hover:bg-indigo-700 active:bg-indigo-800 transition"
          >
            Mulai Kuis
          </button>
        </div>
      </div>
    );

  // Jika loading
  if (status === "loading")
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8 border border-indigo-100 text-center">
          <p className="text-slate-600">Memuat soal...</p>
        </div>
      </div>
    );

  // Jika kuis sedang berlangsung
  if (status === "running") {
    const q = questions[index];
    // Pilihan tidak di-shuffle setiap render, tetapi diambil dari choicesByIndex
    const choices =
      choicesByIndex[index] ||
      [q?.correct_answer, ...(q?.incorrect_answers || [])];
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-6 border border-indigo-100">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-500">
              Soal <span className="font-medium text-slate-700">{index + 1}</span> dari {questions.length}
            </div>
            <div className="inline-flex items-center gap-2 text-sm">
              <span className="text-slate-500">Waktu</span>
              <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 font-mono font-semibold">
                {formatTime(remaining)}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 leading-relaxed">{q.question}</h3>
          </div>

          <div className="grid gap-3">
            {choices.map((c, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(c)}
                className="w-full text-left rounded-xl border border-slate-200 px-4 py-3 hover:border-indigo-300 hover:bg-indigo-50/60 transition"
              >
                <span className="text-slate-700">{c}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Jika selesai
  if (status === "finished") {
    const benar = answers.filter((a) => a.correct).length;
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8 border border-indigo-100 text-center">
          <h2 className="text-2xl font-bold text-slate-800">Hasil Kuis</h2>
          <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-green-50 py-3">
              <div className="text-green-600 font-semibold">Benar</div>
              <div className="text-lg font-bold text-green-700">{benar}</div>
            </div>
            <div className="rounded-xl bg-rose-50 py-3">
              <div className="text-rose-600 font-semibold">Salah</div>
              <div className="text-lg font-bold text-rose-700">{answers.length - benar}</div>
            </div>
            <div className="rounded-xl bg-indigo-50 py-3">
              <div className="text-indigo-600 font-semibold">Total</div>
              <div className="text-lg font-bold text-indigo-700">{questions.length}</div>
            </div>
          </div>
          <button
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-indigo-600 text-white font-medium px-6 py-3 hover:bg-indigo-700 active:bg-indigo-800 transition"
            onClick={() => {
              setStatus("idle");
              setAnswers([]);
              setIndex(0);
              setChoicesByIndex([]);
            }}
          >
            Ulangi
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// Acak pilihan jawaban
function shuffle(arr) {
  // Hindari melakukan sort langsung di array asal
  let a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
