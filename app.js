// Lapuan Lepakot ry – app.js
// Yksi tiedosto kaikille sivuille. Jokainen osa tarkistaa ensin,
// onko sen tarvitsema elementti tällä sivulla.

// ─── 1. Hyvä tietää -valikko (popover, kaikilla sivuilla) ───────────────
// Avaaminen ja sulkeminen (myös Esc) hoituu HTML:n popover-attribuutilla.
// Tämä sulkee valikon, kun sen linkkiä klikataan.
const infoMenu = document.querySelector('#info-menu');

if (infoMenu) {
  infoMenu.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      infoMenu.hidePopover();
    }
  });
}


// ─── 2. Joukkuesuodatin (listing.html) ──────────────────────────────────
const suodatinNapit = document.querySelectorAll('[data-suodatin]');
const kortit = document.querySelectorAll('[data-joukkue]');
const suodatinTila = document.querySelector('#suodatin-tila');

const joukkueNimet = {
  juniorit: 'juniorien',
  naiset: 'naisten',
  miehet: 'miesten',
};

function suodata(valinta) {
  let naytetaan = 0;

  for (const kortti of kortit) {
    const nayta = valinta === 'kaikki' || kortti.dataset.joukkue === valinta;
    kortti.hidden = !nayta;
    if (nayta) naytetaan++;
  }

  // Jos osiosta ei jää mitään näkyviin, näytetään sen alla oleva viesti
  for (const lista of document.querySelectorAll('.kortit')) {
    const tyhja = lista.parentElement.querySelector('.tyhja');
    if (!tyhja) continue;
    tyhja.hidden = lista.querySelector('[data-joukkue]:not([hidden])') !== null;
  }

  if (valinta === 'kaikki') {
    suodatinTila.textContent = `Näytetään kaikki joukkueet: ${naytetaan} / ${kortit.length}.`;
  } else {
    suodatinTila.textContent = `Näytetään ${joukkueNimet[valinta]} tiedot: ${naytetaan} / ${kortit.length}.`;
  }
}

if (suodatinNapit.length > 0 && suodatinTila) {
  for (const nappi of suodatinNapit) {
    nappi.addEventListener('click', () => {
      for (const toinen of suodatinNapit) {
        toinen.setAttribute('aria-pressed', String(toinen === nappi));
      }
      suodata(nappi.dataset.suodatin);
    });
  }
  suodata('kaikki');
}


// ─── 3. Kokeiluharjoituksen ilmoittautuminen (contact.html) ─────────────
const lomake = document.querySelector('#ilmoittautuminen');
const lomakeTila = document.querySelector('#lomake-tila');
const LUONNOS = 'lepakot-ilmoittautuminen';

function kentanNimi(kentta) {
  return kentta.labels[0].textContent.replace('*', '').trim();
}

function virheViesti(kentta) {
  const v = kentta.validity;
  if (v.valueMissing) {
    return kentta.tagName === 'SELECT'
      ? 'Valitse joukkue.'
      : `${kentanNimi(kentta)} on pakollinen.`;
  }
  if (v.typeMismatch) return 'Kirjoita sähköpostiosoite muodossa nimi@esimerkki.fi.';
  if (v.patternMismatch) return 'Käytä vain numeroita, välilyöntejä ja +-merkkiä, vähintään 7 merkkiä.';
  if (v.rangeUnderflow || v.rangeOverflow) return 'Iän pitää olla 4–100 vuotta.';
  if (v.badInput) return 'Kirjoita ikä numeroina.';
  if (v.tooLong) return 'Teksti on liian pitkä, enintään 500 merkkiä.';
  return 'Tarkista tämä kenttä.';
}

function naytaVirhe(kentta) {
  document.querySelector(`#${kentta.id}-error`).textContent = virheViesti(kentta);
  kentta.setAttribute('aria-invalid', 'true');
}

function poistaVirhe(kentta) {
  document.querySelector(`#${kentta.id}-error`).textContent = '';
  kentta.removeAttribute('aria-invalid');
}

if (lomake && lomakeTila) {
  // Otetaan tarkistus omiin käsiin. Ilman JavaScriptiä selaimen omat tarkistukset toimivat yhä.
  lomake.noValidate = true;
  const kentat = lomake.querySelectorAll('input, select, textarea');

  // Luonnos takaisin, jos sellainen on tallessa
  try {
    const tallessa = JSON.parse(localStorage.getItem(LUONNOS));
    if (tallessa) {
      for (const [nimi, arvo] of Object.entries(tallessa)) {
        if (lomake.elements[nimi]) lomake.elements[nimi].value = arvo;
      }
    }
  } catch (virhe) {
    // Tallennus ei ole käytössä (esim. yksityinen ikkuna): lomake toimii silti.
  }

  lomake.addEventListener('submit', (event) => {
    event.preventDefault();
    lomakeTila.textContent = '';

    let ensimmainenVirhe = null;
    for (const kentta of kentat) {
      if (kentta.validity.valid) {
        poistaVirhe(kentta);
      } else {
        naytaVirhe(kentta);
        if (!ensimmainenVirhe) ensimmainenVirhe = kentta;
      }
    }

    if (ensimmainenVirhe) {
      ensimmainenVirhe.focus();
      return;
    }

    const tiedot = Object.fromEntries(new FormData(lomake));
    lomakeTila.textContent =
      `Kiitos, ${tiedot.nimi}! Ilmoittautuminen on valmis: ${tiedot.joukkue}, ` +
      `ikä ${tiedot.ika}. Valmentaja ottaa yhteyttä osoitteeseen ${tiedot.sahkoposti}.`;

    lomake.reset();
    try {
      localStorage.removeItem(LUONNOS);
    } catch (virhe) {
      // ei tallennusta, ei poistettavaa
    }
  });

  // Yksi kuuntelija koko lomakkeelle: poistaa korjatun virheen ja tallentaa luonnoksen
  lomake.addEventListener('input', (event) => {
    const kentta = event.target;
    if (kentta.getAttribute('aria-invalid') === 'true' && kentta.validity.valid) {
      poistaVirhe(kentta);
    }
    try {
      localStorage.setItem(LUONNOS, JSON.stringify(Object.fromEntries(new FormData(lomake))));
    } catch (virhe) {
      // ei tallennusta
    }
  });
}
