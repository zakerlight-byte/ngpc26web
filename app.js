(() => {
  const countryProfiles = window.NGPC_COUNTRY_PROFILES || {};
  const flagCodes = window.NGPC_FLAG_CODES || {};
  const committees = window.NGPC_COMMITTEES || {};
  const committeeInvites = [
    { committee: 'unhcr', name: 'UNHCR', url: 'https://chat.whatsapp.com/COVVGCwnLiZHEMxQyDM0vq' },
    { committee: 'cold war', name: 'Cold War Crisis Cabinet', url: 'https://chat.whatsapp.com/I9zWvfNS2h7925g5BH55sJ' },
    { committee: 'unesco', name: 'UNESCO', url: 'https://chat.whatsapp.com/Bmp1eb2CetcKN83P3eFFH6' },
    { committee: 'unep', name: 'UNEP', url: 'https://chat.whatsapp.com/GaHHIUqJFIi7GjBu33aBD1' },
    { committee: 'uncsw', name: 'UNCSW', url: 'https://chat.whatsapp.com/H01kRtrd0TaLUovKWYavJC' },
  ];
  const sessionKey = 'ngpc26Delegate';
  const loginView = document.getElementById('login-view');
  const dashboard = document.getElementById('dashboard-view');
  const form = document.getElementById('login-form');
  const nameInput = document.getElementById('delegate-name');
  const error = document.getElementById('login-error');
  let countryImageRequest = 0;

  const normalize = value => String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  const committeeFor = value => Object.values(committees).find(item => (item.aliases || []).some(alias => normalize(value).includes(normalize(alias))));
  const lookupByCountry = (collection, country) => Object.entries(collection).find(([name]) => normalize(name) === normalize(country))?.[1];
  const showCountryImage = async country => {
    const requestId = ++countryImageRequest;
    const image = document.getElementById('country-flag');
    const credit = document.getElementById('country-photo-credit');
    const historicLabel = document.getElementById('historic-label');
    const flagCode = lookupByCountry(flagCodes, country);
    const flagSource = flagCode ? `https://flagcdn.com/w320/${flagCode}.png` : '';
    credit.classList.add('hidden');
    image.onerror = () => {
      if (flagSource && image.src !== flagSource) {
        image.src = flagSource;
        image.alt = `${country} flag`;
        credit.classList.add('hidden');
        return;
      }
      image.hidden = true;
      historicLabel.classList.remove('hidden');
    };
    image.hidden = !flagCode;
    historicLabel.classList.toggle('hidden', Boolean(flagCode));
    if (!flagCode) {
      image.removeAttribute('src');
      image.alt = '';
      return;
    }
    image.alt = `${country} flag`;
    image.src = flagSource;
    try {
      const params = new URLSearchParams({
        action: 'query', generator: 'search', gsrnamespace: '6', gsrsearch: `${country} landscape`, gsrlimit: '8',
        prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '900', format: 'json', origin: '*'
      });
      const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
      if (!response.ok) return;
      const result = await response.json();
      const pages = Object.values(result.query?.pages || {});
      const match = pages.find(page => {
        const title = page.title || '';
        const info = page.imageinfo?.[0];
        return info?.thumburl?.startsWith('https://upload.wikimedia.org/') && !/(flag|map|logo|coat.of.arms|seal)/i.test(title);
      });
      if (!match || requestId !== countryImageRequest) return;
      const info = match.imageinfo[0];
      const source = info.descriptionurl;
      if (!source?.startsWith('https://commons.wikimedia.org/')) return;
      image.src = info.thumburl;
      image.alt = `${country} landscape photo`;
      const metadata = info.extmetadata || {};
      const clean = value => String(value || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      const artist = clean(metadata.Artist?.value).replace(/^\p{P}+/u, '');
      const license = clean(metadata.LicenseShortName?.value);
      credit.href = source;
      credit.textContent = `Photo: ${artist || 'Wikimedia Commons'}${license ? ` · ${license}` : ''} ↗`;
      credit.classList.remove('hidden');
    } catch (_) {
      // Keep the country flag when a Commons image cannot be loaded.
    }
  };
  const showLogin = () => {
    dashboard.classList.add('hidden');
    loginView.classList.remove('hidden');
    error.textContent = '';
    nameInput.focus();
  };
  const showDashboard = delegate => {
    document.getElementById('welcome-name').textContent = delegate.name;
    document.getElementById('grade-line').textContent = delegate.grade ? `Class / division: ${delegate.grade}` : 'Delegate';
    const committeeInfo = committeeFor(delegate.committee);
    document.getElementById('committee-name').textContent = committeeInfo?.title || delegate.committee;
    const guideLink = document.getElementById('committee-guide');
    document.getElementById('committee-briefing-title').textContent = committeeInfo?.title || delegate.committee;
    document.getElementById('committee-description').textContent = committeeInfo?.description || 'Your committee background guide and topic details will be shared by the secretariat.';
    const chairLine = document.getElementById('committee-chairs');
    chairLine.textContent = committeeInfo?.chairs ? `Chairs: ${committeeInfo.chairs}` : '';
    chairLine.classList.toggle('hidden', !committeeInfo?.chairs);
    guideLink.classList.toggle('hidden', !committeeInfo?.guide);
    if (committeeInfo?.guide) {
      guideLink.href = committeeInfo.guide;
      guideLink.setAttribute('aria-label', `Open the ${committeeInfo.title} background guide`);
    } else guideLink.removeAttribute('href');
    const invite = committeeInvites.find(item => normalize(delegate.committee).includes(item.committee));
    const inviteLink = document.getElementById('committee-whatsapp');
    inviteLink.classList.toggle('hidden', !invite);
    if (invite) {
      inviteLink.href = invite.url;
      inviteLink.setAttribute('aria-label', `Open the ${invite.name} WhatsApp group invitation`);
      document.getElementById('whatsapp-label').textContent = `Join ${invite.name} WhatsApp group`;
    } else {
      inviteLink.removeAttribute('href');
    }
    const country = delegate.country || 'Country portfolio to be confirmed';
    document.getElementById('country-name').textContent = country;
    const [strength, challenge] = lookupByCountry(countryProfiles, country) || [
      'Use your country’s regional relationships, expertise, and experience to build a coalition around the agenda.',
      'Be ready to explain the capacity, trade-offs, and affected groups behind the position you take.'
    ];
    document.getElementById('country-strength').textContent = strength;
    document.getElementById('country-challenge').textContent = challenge;
    document.getElementById('country-context').textContent = normalize(delegate.committee).includes('cold war')
      ? 'Historical positions depend on the crisis date. Use your committee background guide for the correct alliances, leaders, and policies; current country facts may not apply.'
      : 'These are starting points for debate, not judgments. Check your committee agenda and your country’s current policy.';
    showCountryImage(country);
    loginView.classList.add('hidden');
    dashboard.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  try {
    const saved = JSON.parse(sessionStorage.getItem(sessionKey) || 'null');
    if (saved && typeof saved.name === 'string') showDashboard(saved);
  } catch (_) {
    sessionStorage.removeItem(sessionKey);
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const query = nameInput.value.trim().replace(/\s+/g, ' ');
    error.textContent = '';
    if (!query) {
      error.textContent = 'Enter the name used for your registration.';
      nameInput.focus();
      return;
    }
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.textContent = 'Finding your delegation…';
    try {
      const response = await fetch('/api/delegate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: query })
      });
      const result = await response.json();
      if (!response.ok) {
        error.textContent = response.status === 404
          ? 'We couldn’t find that name. Check the spelling or ask your secretariat for help.'
          : response.status === 409
            ? 'More than one delegate has this name. Please contact your secretariat.'
            : result.error || 'Lookup failed. Please try again.';
        nameInput.focus();
        return;
      }
      sessionStorage.setItem(sessionKey, JSON.stringify(result));
      showDashboard(result);
    } catch (_) {
      error.textContent = 'The delegate lookup is unavailable right now. Please try again later.';
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  });

  document.getElementById('switch-delegate').addEventListener('click', () => {
    sessionStorage.removeItem(sessionKey);
    nameInput.value = '';
    showLogin();
  });

  const committeeDialog = document.getElementById('committee-dialog');
  document.querySelectorAll('.committee-list [data-committee]').forEach(button => {
    button.addEventListener('click', () => {
      const info = committees[button.dataset.committee];
      if (!info) return;
      document.getElementById('dialog-title').textContent = info.title;
      const dialogChairs = document.getElementById('dialog-chairs');
      dialogChairs.textContent = info.chairs ? `Chairs: ${info.chairs}` : '';
      dialogChairs.classList.toggle('hidden', !info.chairs);
      document.getElementById('dialog-description').textContent = info.description;
      const dialogGuide = document.getElementById('dialog-guide');
      dialogGuide.href = info.guide;
      dialogGuide.classList.remove('hidden');
      committeeDialog.showModal();
    });
  });
  document.querySelector('.dialog-close').addEventListener('click', () => committeeDialog.close());
  committeeDialog.addEventListener('click', event => {
    if (event.target === committeeDialog) committeeDialog.close();
  });
})();
