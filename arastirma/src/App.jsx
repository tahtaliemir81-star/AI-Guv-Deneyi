import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = 'https://ai-guv-deneyi.onrender.com'

function App() {
  const [participants, setParticipants] = useState([])
  const [status, setStatus] = useState({
    participantCount: 0,
  })
  const [tab, setTab] = useState('total')
  const [error, setError] = useState('')
  const [openMenu, setOpenMenu] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      setError('')

      const [resultsResponse, statusResponse] = await Promise.all([
        fetch(`${API_URL}/api/results`),
        fetch(`${API_URL}/api/status`),
      ])

      if (!resultsResponse.ok || !statusResponse.ok) {
        throw new Error('Veriler alınamadı.')
      }

      const results = await resultsResponse.json()
      const currentStatus = await statusResponse.json()

      setParticipants(Array.isArray(results) ? results : [])
      setStatus(currentStatus)
    } catch (err) {
      console.error(err)
      setError('Sunucuya bağlanılamadı.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDeleteParticipant = async (participant) => {
    const confirmed = window.confirm(
      `Katılımcı ${participant.participantNumber} kaydı silinsin mi?`
    )

    if (!confirmed) return

    try {
      const response = await fetch(
        `${API_URL}/api/results/${encodeURIComponent(participant.receivedAt)}`,
        {
          method: 'DELETE',
        },
      )

      if (!response.ok) {
        throw new Error()
      }

      setOpenMenu(null)
      await loadData()
    } catch {
      setError('Kayıt silinemedi.')
    }
  }


  const handleResetData = async () => {
    const confirmed = window.confirm(
      'Tüm günler ve katılımcı kayıtları kalıcı olarak silinecek. Devam edilsin mi?',
    )

    if (!confirmed) return

    try {
      const response = await fetch(`${API_URL}/api/reset-data`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error()
      }

      await loadData()
    } catch {
      setError('Veriler silinemedi.')
    }
  }

  const answers = useMemo(
    () =>
      participants.flatMap((participant) =>
        Array.isArray(participant.results) ? participant.results : [],
      ),
    [participants],
  )

  const followedAI = answers.filter((item) => item.followedAI === true).length
  const changedAnswers = answers.filter(
    (item) => item.changedAnswer === true,
  ).length
  const aiCorrect = answers.filter(
    (item) => item.aiWasCorrect === true,
  ).length

  const confidenceTotal = answers.reduce(
    (sum, item) => sum + (Number(item.aiConfidence) || 0),
    0,
  )

  const averageConfidence = answers.length
    ? Math.round(confidenceTotal / answers.length)
    : 0

  const followRate = answers.length
    ? Math.round((followedAI / answers.length) * 100)
    : 0

  const changeRate = answers.length
    ? Math.round((changedAnswers / answers.length) * 100)
    : 0

  const aiAccuracy = answers.length
    ? Math.round((aiCorrect / answers.length) * 100)
    : 0

  const time20Participants = participants.filter(
    (participant) => Number(participant.timeLimit) === 20,
  ).length

  const time30Participants = participants.filter(
    (participant) => Number(participant.timeLimit) === 30,
  ).length

  const totalTimedParticipants =
    time20Participants + time30Participants

  const time20Rate = totalTimedParticipants
    ? Math.round((time20Participants / totalTimedParticipants) * 100)
    : 0

  const time30Rate = totalTimedParticipants
    ? Math.round((time30Participants / totalTimedParticipants) * 100)
    : 0

  const allParticipants = [...participants].reverse()

  return (
    <main className="dashboard">
      <header className="header">
        <div>
          <p className="eyebrow">TÜBİTAK 4006 • ARAŞTIRMA PANELİ</p>
          <h1>AI Güven Deneyi</h1>
          <p className="subtitle">
            Katılımcı sonuçları ve deney hesaplamaları
          </p>
        </div>

        <button className="refresh" type="button" onClick={loadData}>
          ↻ Yenile
        </button>
      </header>

      {error && <div className="error">{error}</div>}

      <section className="stats">
        <article>
          <span>Katılımcı</span>
          <strong>{participants.length}</strong>
        </article>

        <article>
          <span>AI'ı takip etme</span>
          <strong>%{followRate}</strong>
        </article>

        <article>
          <span>Cevap değiştirme</span>
          <strong>%{changeRate}</strong>
        </article>

        <article>
          <span>AI ort. güven</span>
          <strong>%{averageConfidence}</strong>
        </article>

        <article>
          <span>AI doğruluk</span>
          <strong>%{aiAccuracy}</strong>
        </article>
      </section>

      <nav className="tabs" aria-label="Araştırma bölümleri">
        <button
          type="button"
          className={tab === 'total' ? 'active' : ''}
          onClick={() => setTab('total')}
        >
          Toplam Veri
        </button>

        <button
          type="button"
          className={tab === 'all' ? 'active' : ''}
          onClick={() => setTab('all')}
        >
          Tüm Kayıtlar
        </button>
      </nav>

      <section className="panel">
        {loading ? (
          <p>Veriler yükleniyor…</p>
        ) : tab === 'total' ? (
          <>
            <h2>Toplam hesaplamalar</h2>

            <div className="calcs">
              <div>
                <span>Toplam cevap</span>
                <strong>{answers.length}</strong>
              </div>

              <div>
                <span>AI doğru cevap</span>
                <strong>{aiCorrect}</strong>
              </div>

              <div>
                <span>AI yanlış cevap</span>
                <strong>{answers.length - aiCorrect}</strong>
              </div>

              <div>
                <span>AI takip edilen</span>
                <strong>{followedAI}</strong>
              </div>

              <div>
                <span>Değiştirilen cevap</span>
                <strong>{changedAnswers}</strong>
              </div>

              <div>
                <span>Ortalama AI güveni</span>
                <strong>%{averageConfidence}</strong>
              </div>
            </div>

            <div className="time-stats">
              <h3>Deney süresi dağılımı</h3>

              <div className="time-stats-grid">
                <div>
                  <span>20 saniye</span>
                  <strong>{time20Participants} kişi</strong>
                  <small>%{time20Rate}</small>
                </div>

                <div>
                  <span>30 saniye</span>
                  <strong>{time30Participants} kişi</strong>
                  <small>%{time30Rate}</small>
                </div>

                <div>
                  <span>Toplam</span>
                  <strong>{totalTimedParticipants} kişi</strong>
                </div>
              </div>
            </div>



            <div className="research-note">
              <strong>Ana ölçüm:</strong>{' '}
              Katılımcının ilk cevabı AI cevabından farklı olup son cevabı AI
              cevabıyla aynıysa bu cevap “AI'ı takip etti” olarak hesaplanır.
            </div>

            <button
              type="button"
              className="danger-button"
              onClick={handleResetData}
            >
              Tüm kayıtları sil
            </button>
          </>
        ) : (
          <>
            <h2>Tüm kayıtlar</h2>

            {allParticipants.length === 0 ? (
              <p className="muted">Henüz kayıt yok.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Katılımcı</th>
                        <th>Cevap</th>
                      <th>AI takip</th>
                      <th>AI güven</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {allParticipants.map((participant) => {
                      const participantAnswers = Array.isArray(
                        participant.results,
                      )
                        ? participant.results
                        : []

                      const participantFollowed =
                        participantAnswers.filter(
                          (item) => item.followedAI === true,
                        ).length

                      const participantConfidence =
                        participantAnswers.length
                          ? Math.round(
                              participantAnswers.reduce(
                                (sum, item) =>
                                  sum +
                                  (Number(item.aiConfidence) || 0),
                                0,
                              ) / participantAnswers.length,
                            )
                          : 0

                      return (
                        <tr
                          key={`${participant.participantNumber}-${participant.receivedAt}`}
                        >
                          <td>
                            Katılımcı {participant.participantNumber}
                          </td>
                          <td>{participantAnswers.length}</td>
                          <td>{participantFollowed}</td>
                          <td>%{participantConfidence}</td>
                          <td className="record-menu-cell">
                            <button
                              type="button"
                              className="record-menu-button"
                              onClick={() =>
                                setOpenMenu(
                                  openMenu === participant.receivedAt
                                    ? null
                                    : participant.receivedAt,
                                )
                              }
                              aria-label="Kayıt seçenekleri"
                            >
                              ⋮
                            </button>

                            {openMenu === participant.receivedAt && (
                              <div className="record-menu">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteParticipant(participant)
                                  }
                                >
                                  Kaydı sil
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}

export default App
