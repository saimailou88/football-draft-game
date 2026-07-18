import { useState } from 'react';
import Footer from './Footer';

const STEPS = [
  {
    number: 1,
    text: "Choose the season you want your drafted team to play against — this sets your 20 historical opponents for the year.",
  },
  {
    number: 2,
    text: "Choose Easy Mode - see all player ratings while you draft, or Hard Mode - drafing with ratings hidden. Pick a formation and roll your budget — every draft gets a random budget between £80m and £120m, locked in once rolled.",
  },
  {
    number: 3,
    text: "Spin to reveal a random club and season. Reroll up to 3 times if you don't like what comes up — the position you're filling stays locked, only the club/season changes. Cost of players are randomised every new game.",
  },
  {
    number: 4,
    text: "Draft players from that squad into your formation, then simulate the season. Watch for a transfer window partway through — you'll get a chance to swap out up to 5 players before the run-in.",
  },
  {
    number: 5,
    text: "The aim of the game: become champions of England. Beat that season's title-winning points total to be crowned champion.",
  },
];

const FAQS = [
  {
    question: "How is a player's rating calculated?",
    answer: "Ratings are built from public historical performance data, position-weighted and era-adjusted so a 1995 season is fairly compared to a 2020 one.",
  },
  {
    question: "Why does the same player have a different rating in different seasons?",
    answer: "Ratings are tied to a player's actual performance that specific season, not a fixed career rating — so a player at their peak will rate higher than the same player in an earlier or later season.",
  },
  {
    question: "Can I save my season and come back later?",
    answer: "Not yet — each run is one sitting, start to finish. Save/resume may come in a future update.",
  },
  {
    question: "Is my season history saved anywhere?",
    answer: "Your best result for each season is saved automatically in this browser, so you can check your History page any time you come back. It's tied to this device and browser though — clearing your browser data, using private/incognito mode, or switching devices will lose it. You can back it up any time from the History page using Export, and load it back in with Import if needed.",
  },
  {
    question: "What happens if I run out of budget mid-draft?",
    answer: "You'll only be offered players you can afford, and slots you can't realistically fill get flagged so you don't get stuck.",
  },
];

function HowToPlay({ onBack }) {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  function toggleFaq(index) {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  }

  return (
    <div style={{ padding: '20px 24px 60px' }}>
      <button
        className="btn btn-dark"
        onClick={onBack}
        style={{ padding: '10px 16px', fontSize: '13px', marginBottom: '32px' }}
      >
        ← BACK
      </button>

      <h1 className="section-title" style={{ fontSize: '28px', marginBottom: '8px' }}>
        WELCOME!
      </h1>
      <p className="label-mono" style={{ marginBottom: '32px', lineHeight: 1.6 }}>
        DRAFT A SQUAD FROM HISTORIC SEASONS AND TRY TO WIN THE TITLE.
      </p>

      <h2 className="label-mono" style={{ marginBottom: '16px', fontSize: '13px' }}>
        HOW TO PLAY:
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
        {STEPS.map((step) => (
          <div key={step.number} style={{ display: 'flex', gap: '14px' }}>
            <div
              className="label-mono"
              style={{
                flexShrink: 0,
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(192, 132, 252, 0.75)',
                border: '2px solid var(--accent-purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--white-text)',
                fontWeight: 700,
              }}
            >
              {step.number}
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--white-text)' }}>
              {step.text}
            </p>
          </div>
        ))}
      </div>

      <h2 className="label-mono" style={{ marginBottom: '16px', fontSize: '13px' }}>
        FAQS:
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px' }}>
        {FAQS.map((faq, index) => {
          const isOpen = openFaqIndex === index;
          return (
            <div
              key={index}
              onClick={() => toggleFaq(index)}
              style={{
                background: 'rgba(36, 36, 58, 0.75)',
                border: '2px solid var(--btn-dark)',
                borderRadius: '10px',
                padding: '14px 16px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--white-text)' }}>
                  {faq.question}
                </p>
                <span style={{ fontSize: '18px', color: 'var(--grey-text)' }}>
                  {isOpen ? '−' : '+'}
                </span>
              </div>
              {isOpen && (
                <p style={{ fontSize: '13px', color: 'var(--grey-text)', marginTop: '10px', lineHeight: 1.5 }}>
                  {faq.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <button className="btn btn-dark" onClick={onBack} style={{ width: '100%' }}>
        BACK TO HOME
      </button>

      <Footer />
    </div>
  );
}

export default HowToPlay;