import { useEffect, useState } from 'react'
import './App.css'

const questions = [
  {
    question:
      'Bir gölde nilüferler her gün iki katına çıkıyor. Gölün tamamı 48. günde nilüferlerle kaplanıyor. Gölün yarısı hangi gün kaplanmıştır?',
    options: ['24', '47', '46', '25'],
    correctAnswer: 1,
    aiAnswer: 0,
    aiConfidence: 94,
  },
  {
    question:
      'Bir ürünün fiyatı önce %20 artırılıyor, sonra yeni fiyat üzerinden %20 azaltılıyor. Ürünün son fiyatı ilk fiyatına göre nasıldır?',
    options: ['Aynı', '%4 daha düşük', '%4 daha yüksek', '%8 daha düşük'],
    correctAnswer: 1,
    aiAnswer: 1,
    aiConfidence: 91,
  },
  {
    question:
      'Bir doktor sana 3 hap veriyor ve “Her yarım saatte bir tane iç” diyor. İlk hapı şimdi içersen bütün hapları kaç dakika içinde bitirmiş olursun?',
    options: ['60', '90', '120', '30'],
    correctAnswer: 0,
    aiAnswer: 0,
    aiConfidence: 88,
  },
  {
    question:
      'Bir zar 6 kez atılıyor ve ilk 5 atışın hepsi 6 geliyor. 6. atışta hangisinin gerçekleşme olasılığı daha yüksektir?',
    options: [
      '6 gelmesi',
      '6 dışında bir sayı gelmesi',
      'İkisi de eşit',
      'Önceki atışlara bağlı olarak değişir',
    ],
    correctAnswer: 2,
    aiAnswer: 2,
    aiConfidence: 86,
  },
  {
    question:
      'Bir odada 5 mum yanıyor. Odadaki kişi bunların 2’sini söndürüyor, ancak diğer 3 mum yanmaya devam ediyor. Bir süre sonra odada kaç mum kalması beklenir?',
    options: ['0', '2', '3', '5'],
    correctAnswer: 3,
    aiAnswer: 0,
    aiConfidence: 93,
  },
]

function App() {
  const [started, setStarted] = useState(false)
  const [participantNumber, setParticipantNumber] = useState(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [initialAnswer, setInitialAnswer] = useState(null)
  const [showAI, setShowAI] = useState(false)
  const [changingAnswer, setChangingAnswer] = useState(false)
  const [results, setResults] = useState([])
  const [finished, setFinished] = useState(false)

  const currentQuestion = questions[questionIndex]

  useEffect(() => {
    if (!started || showAI || changingAnswer || finished) return

    if (timeLeft <= 0) {
      if (selectedAnswer !== null) {
        submitAnswer()
      } else {
        setSelectedAnswer(null)
        setShowAI(true)
      }
      return
    }

    const timer = setTimeout(() => {
      setTimeLeft((value) => value - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [
    started,
    showAI,
    changingAnswer,
    finished,
    timeLeft,
    selectedAnswer,
  ])

  const startExperiment = () => {
    const lastNumber = Number(
      localStorage.getItem('ai-deneyi-last-number') || '0'
    )

    const newNumber = lastNumber + 1

    localStorage.setItem(
      'ai-deneyi-last-number',
      String(newNumber)
    )

    setParticipantNumber(newNumber)
    setStarted(true)
    setQuestionIndex(0)
    setTimeLeft(15)
    setSelectedAnswer(null)
    setInitialAnswer(null)
    setShowAI(false)
    setChangingAnswer(false)
    setResults([])
    setFinished(false)
  }

  const chooseAnswer = (index) => {
    if (showAI && !changingAnswer) return

    setSelectedAnswer(index)

    if (changingAnswer) {
      finishChangedAnswer(index)
    }
  }

  const submitAnswer = () => {
    if (selectedAnswer === null) {
      setShowAI(true)
      return
    }

    setInitialAnswer(selectedAnswer)
    setShowAI(true)
  }

  const startChangingAnswer = () => {
    setChangingAnswer(true)
    setSelectedAnswer(null)
  }

  const finishChangedAnswer = (newAnswer) => {
    const result = {
      question: questionIndex + 1,
      initialAnswer,
      aiAnswer: currentQuestion.aiAnswer,
      aiConfidence: currentQuestion.aiConfidence,
      correctAnswer: currentQuestion.correctAnswer,
      finalAnswer: newAnswer,
      aiWasCorrect:
        currentQuestion.aiAnswer === currentQuestion.correctAnswer,
      followedAI:
        initialAnswer !== currentQuestion.aiAnswer &&
        newAnswer === currentQuestion.aiAnswer,
      changedAnswer: initialAnswer !== newAnswer,
    }

    const updatedResults = [...results, result]
    setResults(updatedResults)

    if (questionIndex === questions.length - 1) {
      localStorage.setItem(
        `ai-deneyi-result-${participantNumber}`,
        JSON.stringify(updatedResults)
      )

      setFinished(true)
      return
    }

    setQuestionIndex((value) => value + 1)
    setSelectedAnswer(null)
    setInitialAnswer(null)
    setShowAI(false)
    setChangingAnswer(false)
    setTimeLeft(15)
  }

  const keepAnswer = () => {
    const result = {
      question: questionIndex + 1,
      initialAnswer,
      aiAnswer: currentQuestion.aiAnswer,
      aiConfidence: currentQuestion.aiConfidence,
      correctAnswer: currentQuestion.correctAnswer,
      finalAnswer: initialAnswer,
      aiWasCorrect:
        currentQuestion.aiAnswer === currentQuestion.correctAnswer,
      followedAI:
        initialAnswer !== currentQuestion.aiAnswer &&
        initialAnswer === currentQuestion.aiAnswer,
      changedAnswer: false,
    }

    const updatedResults = [...results, result]
    setResults(updatedResults)

    if (questionIndex === questions.length - 1) {
      localStorage.setItem(
        `ai-deneyi-result-${participantNumber}`,
        JSON.stringify(updatedResults)
      )

      setFinished(true)
      return
    }

    setQuestionIndex((value) => value + 1)
    setSelectedAnswer(null)
    setInitialAnswer(null)
    setShowAI(false)
    setChangingAnswer(false)
    setTimeLeft(15)
  }

  if (finished) {
    return (
      <main className="app">
        <section className="participant">
          <div className="logo">AI</div>

          <h1>Deney tamamlandı!</h1>

          <p>
            Katılımın için teşekkürler.
          </p>

          <button onClick={() => {
            setStarted(false)
            setFinished(false)
            setParticipantNumber(null)
            setQuestionIndex(0)
            setTimeLeft(15)
            setSelectedAnswer(null)
            setInitialAnswer(null)
            setShowAI(false)
            setChangingAnswer(false)
            setResults([])
          }}>
            Yeni Test
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="app">
      {!started ? (
        <section className="welcome">
          <div className="logo">AI</div>

          <h1>AI Güven Deneyi</h1>

          <p>
            Yapay zekânın verdiği güven düzeyinin,
            insanların kararlarını nasıl etkilediğini araştırıyoruz.
          </p>

          <div className="info">
            <span>⏱️ Soru başına 15 saniye</span>
            <span>🧠 5 soru</span>
          </div>

          <button onClick={startExperiment}>
            Deneye Başla
          </button>
        </section>
      ) : (
        <section className="participant">
          <div className="top">
            <span>Katılımcı {participantNumber}</span>
            <span>
              {questionIndex + 1} / {questions.length}
            </span>
          </div>

          {!showAI ? (
            <>
              {!changingAnswer && (
                <div className="timer">
                  {timeLeft}
                </div>
              )}

              <h2>{currentQuestion.question}</h2>

              {changingAnswer && (
                <p className="change-mode">
                  Yeni cevabını seç.
                </p>
              )}

              <div className="answers">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={option}
                    className={
                      selectedAnswer === index ? 'selected' : ''
                    }
                    onClick={() => chooseAnswer(index)}
                  >
                    <span>
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>

              {!changingAnswer && (
                <button
                  className="continue"
                  disabled={selectedAnswer === null}
                  onClick={submitAnswer}
                >
                  Cevabımı Gönder
                </button>
              )}
            </>
          ) : (
            <>
              <div className="ai-card">
                <div className="ai-title">
                  🤖 Yapay zekânın cevabı
                </div>

                <div className="ai-answer">
                  {String.fromCharCode(
                    65 + currentQuestion.aiAnswer
                  )}{' '}
                  — {currentQuestion.options[currentQuestion.aiAnswer]}
                </div>

                <div className="confidence">
                  Güven düzeyi:{' '}
                  <strong>
                    {currentQuestion.aiConfidence}%
                  </strong>
                </div>
              </div>

              <p className="change-text">
                Cevabını değiştirmek ister misin?
              </p>

              <div className="decision-buttons">
                <button onClick={startChangingAnswer}>
                  Cevabımı Değiştir
                </button>

                <button onClick={keepAnswer}>
                  Cevabımda Kal
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  )
}

export default App
