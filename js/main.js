function buildWhatsAppUrl(message, phoneKey) {
  const config = window.LCA_SITE || {};
  const phone = phoneKey === 'support'
    ? (config.whatsappSupportPhone || '2250788062035')
    : (config.whatsappPhone || '2250715877715');
  const text = message || config.whatsappMessage || 'Bonjour LCA';
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function initWhatsAppLinks() {
  document.querySelectorAll('[data-wa-bot]').forEach((link) => {
    link.href = buildWhatsAppUrl(link.dataset.waMessage);
    if (!link.target) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
  });

  document.querySelectorAll('[data-wa-support]').forEach((link) => {
    link.href = buildWhatsAppUrl(link.dataset.waMessage, 'support');
    if (!link.target) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
  });

  document.querySelectorAll('[data-wa-display]').forEach((el) => {
    const display = window.LCA_SITE?.whatsappDisplay;
    if (display) el.textContent = display;
  });

  document.querySelectorAll('[data-wa-support-display]').forEach((el) => {
    const display = window.LCA_SITE?.whatsappSupportDisplay;
    if (display) el.textContent = display;
  });

  document.querySelectorAll('[data-wa-support-display-full]').forEach((el) => {
    const display = window.LCA_SITE?.whatsappSupportDisplayFull;
    if (display) el.textContent = display;
  });
}

initWhatsAppLinks();

const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');

function initPageLoader() {
  const loader = document.getElementById('page-loader');
  const progressBar = loader?.querySelector('[role="progressbar"]');
  const LOADER_DURATION = 3000;

  if (!loader) return;

  const finishLoader = () => {
    if (progressBar) progressBar.setAttribute('aria-valuenow', '100');
    loader.classList.add('loader--done');
    loader.setAttribute('aria-busy', 'false');
    document.body.classList.remove('is-loading');

    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  };

  setTimeout(finishLoader, LOADER_DURATION);
}

initPageLoader();

if (toggle && nav) {
  function closeNav() {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('click', () => {
    if (nav.classList.contains('is-open')) {
      closeNav();
    }
  });

  window.addEventListener('scroll', () => {
    if (nav.classList.contains('is-open')) {
      closeNav();
    }
  }, { passive: true });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* Simulations alignées sur webhook/bot.js */
const WA_MOCK = {
  rate: '14,5',
  fee: '0,5',
  fcfaAmount: '250 000',
  gnfAmount: '3 625 000',
  scolariteAmount: '150 000',
  scolariteFeeAmount: '750',
  scolariteTotal: '150 750',
  receiveGnf: '224620000000',
  receiveFcfa: '2250700000000',
  matricule: 'MD26000',
  payFcfaWave: '2250700000000',
  payGnfOrange: '224620000000',
  payGnfPaycard: '469000000',
};

function waWelcome() {
  return {
    dir: 'in',
    html: [
      '<p>Bienvenue 👋</p>',
      '<p>Je suis votre assistant de change FCFA ⇄ GNF.</p>',
      `<p>Taux du jour : <strong>1 FCFA = ${WA_MOCK.rate} GNF</strong><br>Frais : <strong>${WA_MOCK.fee}%</strong></p>`,
      '<p>Quelle opération souhaitez-vous effectuer ?</p>',
    ].join(''),
    replies: ['FCFA à GNF', 'GNF à FCFA', 'Scolarité'],
  };
}

function waOut(text) {
  return { dir: 'out', preview: text, html: `<p>${text}</p>` };
}

function waSuccessTransfer() {
  return {
    dir: 'in',
    success: true,
    html: '<p>🎉✅ Votre transfert a été effectué avec succès.</p><p><strong>LCATRANSCASH</strong> vous remercie.</p>',
    replies: ['Nouvelle opération'],
  };
}

function waProcessing() {
  return { dir: 'in', html: '<p>Votre demande est en cours de traitement...⏳</p>' };
}

function waConfirmPayment() {
  return {
    dir: 'in',
    html: '<p>Capture d’écran reçue ✅</p><p>Confirmez-vous que vous avez bien effectué le paiement ?</p>',
    replies: ['✅ Oui, je confirme'],
  };
}

const WA_SCENARIOS = [
  {
    id: 'fcfa_gnf',
    label: 'FCFA à GNF',
    steps: [
      waOut('Bonjour'),
      waWelcome(),
      waOut('FCFA à GNF'),
      {
        dir: 'in',
        html: '<p>Vous avez choisi : <strong>FCFA à GNF</strong>.</p><p>Quel est votre moyen de paiement ?</p>',
        replies: ['🟠 ORANGE MONEY', '🔵 WAVE', '⚫ DJAMO'],
      },
      waOut('🔵 WAVE'),
      {
        dir: 'in',
        html: '<p>Moyen de paiement : <strong>🔵 WAVE</strong>.</p><p>Par quel moyen souhaitez-vous recevoir les GNF ?</p>',
        replies: ['🟠 ORANGE MONEY', '💳 PAYCARD'],
      },
      waOut('🟠 ORANGE MONEY'),
      {
        dir: 'in',
        html: '<p>Indiquez le numéro <strong>🟠 ORANGE MONEY</strong> sur lequel vous souhaitez recevoir les GNF.</p><p>Exemple : 224620000000</p>',
      },
      waOut('224620000000'),
      {
        dir: 'in',
        html: [
          '<p>Numéro de réception 🟠 ORANGE MONEY :</p>',
          `<p><strong>${WA_MOCK.receiveGnf}</strong></p>`,
          '<p>Les GNF seront envoyés sur ce numéro.</p>',
          '<p>Ce numéro est-il correct ?</p>',
        ].join(''),
        replies: ['✅ Oui, correct', '❌ Non, modifier'],
      },
      waOut('✅ Oui, correct'),
      { dir: 'in', html: '<p>Quel montant envoyez-vous en FCFA ?</p><p>Exemple : 50000</p>' },
      waOut('250 000'),
      {
        dir: 'in',
        html: [
          '<p>Merci.</p>',
          `<p>Veuillez effectuer le paiement <strong>🔵 WAVE</strong> de <strong>${WA_MOCK.fcfaAmount} FCFA</strong> sur le numéro suivant :</p>`,
          `<p><strong>${WA_MOCK.payFcfaWave}</strong></p>`,
          '<p>Ensuite, envoyez une capture d’écran comme preuve de paiement.</p>',
        ].join(''),
      },
      waOut('📷 Capture d’écran'),
      waConfirmPayment(),
      waOut('✅ Oui, je confirme'),
      waProcessing(),
      waSuccessTransfer(),
    ],
  },
  {
    id: 'gnf_fcfa',
    label: 'GNF à FCFA',
    steps: [
      waOut('Bonjour'),
      waWelcome(),
      waOut('GNF à FCFA'),
      {
        dir: 'in',
        html: '<p>Vous avez choisi : <strong>GNF à FCFA</strong>.</p><p>Quel est votre moyen de paiement ?</p>',
        replies: ['🟠 ORANGE MONEY', '💳 PAYCARD'],
      },
      waOut('💳 PAYCARD'),
      {
        dir: 'in',
        html: '<p>Moyen de paiement : <strong>💳 PAYCARD</strong>.</p><p>Par quel moyen souhaitez-vous recevoir les FCFA ?</p>',
        replies: ['🟠 ORANGE MONEY', '🔵 WAVE', '⚫ DJAMO'],
      },
      waOut('🔵 WAVE'),
      {
        dir: 'in',
        html: '<p>Indiquez le numéro <strong>🔵 WAVE</strong> sur lequel vous souhaitez recevoir les FCFA.</p><p>Exemple : 2250700000000</p>',
      },
      waOut('2250700000000'),
      {
        dir: 'in',
        html: [
          '<p>Numéro de réception 🔵 WAVE :</p>',
          `<p><strong>${WA_MOCK.receiveFcfa}</strong></p>`,
          '<p>Les FCFA seront envoyés sur ce numéro.</p>',
          '<p>Ce numéro est-il correct ?</p>',
        ].join(''),
        replies: ['✅ Oui, correct', '❌ Non, modifier'],
      },
      waOut('✅ Oui, correct'),
      { dir: 'in', html: '<p>Quel montant envoyez-vous en GNF ?</p><p>Exemple : 50000</p>' },
      waOut('3 625 000'),
      {
        dir: 'in',
        html: [
          '<p>Merci.</p>',
          `<p>Veuillez effectuer le paiement <strong>💳 PAYCARD</strong> de <strong>${WA_MOCK.gnfAmount} GNF</strong> sur le numéro suivant :</p>`,
          `<p><strong>${WA_MOCK.payGnfPaycard}</strong></p>`,
          '<p>Ensuite, envoyez une capture d’écran comme preuve de paiement.</p>',
        ].join(''),
      },
      waOut('📷 Capture d’écran'),
      waConfirmPayment(),
      waOut('✅ Oui, je confirme'),
      waProcessing(),
      waSuccessTransfer(),
    ],
  },
  {
    id: 'scolarite',
    label: 'Scolarité',
    steps: [
      waOut('Bonjour'),
      waWelcome(),
      waOut('Scolarité'),
      {
        dir: 'in',
        html: '<p>Vous avez choisi : <strong>Scolarité</strong>.</p><p>Indiquez votre matricule.</p><p>Exemple : MD26000</p>',
      },
      waOut('MD26000'),
      {
        dir: 'in',
        html: [
          '<p>Matricule :</p>',
          `<p><strong>${WA_MOCK.matricule}</strong></p>`,
          '<p>Ce matricule est-il correct ?</p>',
        ].join(''),
        replies: ['✅ Oui, correct', '❌ Non, modifier'],
      },
      waOut('✅ Oui, correct'),
      {
        dir: 'in',
        html: '<p>Quel montant de scolarité devez-vous payer en FCFA ?</p><p>Exemple : 150000</p>',
      },
      waOut('150 000'),
      {
        dir: 'in',
        html: '<p>Quel est votre moyen de paiement ?</p>',
        replies: ['🟠 ORANGE MONEY', '🔵 WAVE', '⚫ DJAMO'],
      },
      waOut('🔵 WAVE'),
      {
        dir: 'in',
        html: [
          '<p>Merci.</p>',
          `<p>Veuillez effectuer le paiement <strong>🔵 WAVE</strong> de <strong>${WA_MOCK.scolariteTotal} FCFA</strong> sur le numéro suivant :</p>`,
          `<p>Scolarité ${WA_MOCK.scolariteAmount} FCFA + frais ${WA_MOCK.fee}% (${WA_MOCK.scolariteFeeAmount} FCFA).</p>`,
          `<p><strong>${WA_MOCK.payFcfaWave}</strong></p>`,
          '<p>Ensuite, envoyez une capture d’écran comme preuve de paiement.</p>',
        ].join(''),
      },
      waOut('📷 Capture d’écran'),
      waConfirmPayment(),
      waOut('✅ Oui, je confirme'),
      waProcessing(),
      {
        dir: 'in',
        success: true,
        html: '<p>🎉✅ Votre paiement de scolarité a bien été reçu.</p><p>Nous procédons à l’inscription.</p>',
        replies: ['Nouvelle opération'],
      },
    ],
  },
];

const WA_TICKS_SVG = '<svg viewBox="0 0 16 11" width="14" height="10"><path fill="#53bdeb" d="M11.071 0L5.677 5.394 3.253 2.97 1.5 4.723l4.177 4.177 6.644-6.644L11.071 0zm3.5 0L9.177 5.394 8.19 4.407 6.437 6.16l2.644 2.644 6.644-6.644L14.571 0z"/></svg>';

function formatWaTime(minutesOffset) {
  const baseMinutes = 9 * 60 + 41 + minutesOffset;
  const hours = Math.floor(baseMinutes / 60);
  const minutes = baseMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function createWaBubble(step, time) {
  const bubble = document.createElement('div');
  bubble.className = `wa-bubble wa-bubble--${step.dir === 'out' ? 'out' : 'in'} wa-bubble--pending`;
  if (step.success) bubble.classList.add('wa-bubble--success');

  bubble.innerHTML = step.html;

  const meta = document.createElement('div');
  meta.className = 'wa-bubble__meta';
  meta.innerHTML = `<time>${time}</time>`;

  if (step.dir === 'out') {
    const ticks = document.createElement('span');
    ticks.className = 'wa-bubble__ticks';
    ticks.setAttribute('aria-hidden', 'true');
    ticks.innerHTML = WA_TICKS_SVG;
    meta.appendChild(ticks);
  }

  bubble.appendChild(meta);

  if (step.replies?.length) {
    const replies = document.createElement('div');
    replies.className = 'wa-replies';
    step.replies.forEach((label) => {
      const item = document.createElement('span');
      item.textContent = label;
      replies.appendChild(item);
    });
    bubble.appendChild(replies);
  }

  return bubble;
}

function buildWaBubbles(steps, typing) {
  return steps.map((step, index) => {
    const bubble = createWaBubble(step, formatWaTime(index));
    typing.before(bubble);
    return { el: bubble, step };
  });
}

function clearWaBubbles(chatBody) {
  chatBody.querySelectorAll('.wa-bubble').forEach((bubble) => bubble.remove());
}

function animateWhatsAppChat() {
  const chatBody = document.querySelector('.wa-chat__body');
  const typing = document.querySelector('.wa-typing');
  const status = document.querySelector('.wa-chat__status');
  const chatInput = document.querySelector('.wa-chat__input');

  if (!chatBody || !typing) return;

  const onlineStatus = 'compte professionnel · 8h–23h';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scrollToBottom = () => {
    chatBody.scrollTop = chatBody.scrollHeight;
  };

  const setStatus = (text) => {
    if (status) status.textContent = text;
  };

  const resetChat = (bubbles) => {
    bubbles.forEach(({ el }) => {
      el.classList.add('wa-bubble--pending');
      el.classList.remove('wa-bubble--visible');
    });
    typing.classList.remove('is-active');
    setStatus(onlineStatus);
    if (chatInput) {
      chatInput.textContent = 'Message';
      chatInput.classList.remove('is-typing');
    }
    chatBody.scrollTop = 0;
  };

  const showTyping = () => {
    setStatus('écrit…');
    typing.classList.add('is-active');
    scrollToBottom();
  };

  const hideTyping = () => {
    typing.classList.remove('is-active');
    setStatus(onlineStatus);
  };

  const showBubble = (bubble) => {
    hideTyping();
    bubble.classList.remove('wa-bubble--pending');
    bubble.classList.add('wa-bubble--visible');
    scrollToBottom();
  };

  const showOutgoing = async (bubble, previewText, typeDelay) => {
    if (chatInput && previewText) {
      chatInput.textContent = previewText;
      chatInput.classList.add('is-typing');
    }
    await wait(typeDelay);
    if (chatInput) {
      chatInput.textContent = 'Message';
      chatInput.classList.remove('is-typing');
    }
    showBubble(bubble);
  };

  const playScenario = async (steps) => {
    clearWaBubbles(chatBody);
    const bubbles = buildWaBubbles(steps, typing);
    resetChat(bubbles);
    await wait(700);

    for (let i = 0; i < bubbles.length; i += 1) {
      const { el, step } = bubbles[i];

      if (step.dir === 'out') {
        await wait(i === 0 ? 0 : 650);
        await showOutgoing(el, step.preview || '', 750);
        continue;
      }

      await wait(550);
      showTyping();
      await wait(step.replies ? 1400 : step.success ? 1800 : 1100);
      showBubble(el);
    }

    await wait(4500);
    clearWaBubbles(chatBody);
  };

  const runLoop = async () => {
    for (;;) {
      for (const scenario of WA_SCENARIOS) {
        await playScenario(scenario.steps);
      }
    }
  };

  if (reducedMotion) {
    playScenario(WA_SCENARIOS[0].steps).then(() => {
      chatBody.querySelectorAll('.wa-bubble').forEach((el) => el.classList.remove('wa-bubble--pending'));
      scrollToBottom();
    });
    return;
  }

  runLoop();
}

animateWhatsAppChat();
