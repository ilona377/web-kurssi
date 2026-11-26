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


// ─── 2. Ottelut ja harjoitusajat kurssin rajapinnasta (index + listing) ──
// Lapuan Lepakot on asiakasnumero 2 (Nº 02 toimeksiannossa).
const API = 'https://vectorsigma.org/briefer/api/v1';
const ASIAKAS = 2;
const YRITYKSIA = 3; // 429: alkuperäinen pyyntö + kaksi uutta yritystä

const ottelut = {
  tila: document.querySelector('#ottelu-tila'),
  tulevat: document.querySelector('#tulevat-lista'),
  tulokset: document.querySelector('#tulokset-lista'),
  pohja: document.querySelector('#ottelu-pohja'),
};
const harjoitukset = {
  lista: document.querySelector('#harjoitus-lista'),
  pohja: document.querySelector('#harjoitus-pohja'),
  viesti: document.querySelector('#harjoitus-viesti'),
  yhteyshenkilo: document.querySelector('#yhteyshenkilo'),
};

// Rajapinnan joukkueet suodattimen ryhmiksi
const joukkueet = {
  P12: { nimi: 'Pojat P12', ryhma: 'juniorit' },
  T12: { nimi: 'Tytöt T12', ryhma: 'juniorit' },
  P15: { nimi: 'Pojat P15', ryhma: 'juniorit' },
  Naiset: { nimi: 'Naiset', ryhma: 'naiset' },
  Miehet: { nimi: 'Miehet', ryhma: 'miehet' },
};
const paivat = { ma: 'Maanantai', ti: 'Tiistai', ke: 'Keskiviikko', to: 'Torstai', pe: 'Perjantai', la: 'Lauantai', su: 'Sunnuntai' };

function joukkue(koodi) {
  if (koodi == null || koodi === '') return { nimi: 'Joukkue ilmoitetaan myöhemmin', ryhma: 'muut' };
  return joukkueet[koodi] ?? { nimi: koodi, ryhma: 'muut' };
}

// Rakentaa osoitteen, esim. …/items?customer=2&lang=fi&limit=50
function apiUrl(polku, parametrit = {}) {
  const url = new URL(API + polku);
  url.searchParams.set('customer', ASIAKAS);
  url.searchParams.set('lang', 'fi');
  for (const [nimi, arvo] of Object.entries(parametrit)) {
    if (arvo != null && arvo !== '') url.searchParams.set(nimi, arvo);
  }
  return url;
}

const odota = (ms) => new Promise((valmis) => setTimeout(valmis, ms));

// fetch ei heitä virhettä 404:stä tai 500:sta, joten tarkistetaan res.ok itse
async function haeJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const runko = await res.json().catch(() => ({}));
    const virhe = new Error(runko.error ?? `HTTP ${res.status}`);
    virhe.status = res.status;
    virhe.odotus = Number(res.headers.get('Retry-After')) || 3;
    throw virhe;
  }
  return res.json();
}

// 429 = palvelin pyytää odottamaan. Odotetaan Retry-Afterin verran ja yritetään uudelleen.
async function haeUudelleenyrittaen(url, kerro) {
  for (let yritys = 1; ; yritys++) {
    try {
      return await haeJSON(url);
    } catch (virhe) {
      if (virhe.status !== 429 || yritys === YRITYKSIA) throw virhe;
      kerro?.(`Palvelin on kiireinen. Yritetään uudelleen ${virhe.odotus} sekunnin päästä…`);
      await odota(virhe.odotus * 1000);
    }
  }
}

function naytaTila(teksti, { virhe = false } = {}) {
  ottelut.tila.textContent = teksti;
  ottelut.tila.classList.toggle('is-error', virhe);
}

function muotoilePaiva(paiva) {
  if (!paiva) return null;
  const pvm = new Date(paiva + 'T12:00');
  if (Number.isNaN(pvm.getTime())) return null;
  const teksti = pvm.toLocaleDateString('fi-FI', { weekday: 'short', day: 'numeric', month: 'numeric' });
  return teksti.charAt(0).toUpperCase() + teksti.slice(1);
}

function teeOttelukortti(ottelu, { seuraava = false } = {}) {
  const kortti = ottelut.pohja.content.firstElementChild.cloneNode(true);
  const jk = joukkue(ottelu.team);
  kortti.dataset.joukkue = jk.ryhma;

  kortti.querySelector('.joukkue').textContent =
    `${jk.nimi} · ${ottelu.home === false ? 'vierasottelu' : 'kotiottelu'}`;

  const vastustaja = ottelu.opponent || 'Vastustaja ilmoitetaan myöhemmin';
  kortti.querySelector('.kortti__ottelu').textContent =
    ottelu.home === false ? `${vastustaja} – Lepakot` : `Lepakot – ${vastustaja}`;

  const paiva = muotoilePaiva(ottelu.date);
  let aika = paiva ?? 'Päivä ilmoitetaan myöhemmin';
  if (paiva && ottelu.time) aika += ` klo ${ottelu.time.replace(':', '.')}`;
  kortti.querySelector('.aika').textContent = aika;

  kortti.querySelector('.paikka').textContent = ottelu.venue || 'Paikka ilmoitetaan myöhemmin';

  const tulos = kortti.querySelector('.tulos');
  if (ottelu.result) {
    tulos.textContent = `Lopputulos ${ottelu.result}`;
  } else if (onPelattu(ottelu)) {
    tulos.textContent = 'Tulosta ei ole vielä ilmoitettu';
    tulos.classList.add('tulos--odottaa');
  } else {
    tulos.remove();
  }

  const erat = (ottelu.periods ?? []).filter(Boolean);
  if (erat.length > 0) {
    kortti.querySelector('.erat').textContent = `Erät: ${erat.join(', ')}`;
  } else {
    kortti.querySelector('.erat').remove();
  }

  if (seuraava) {
    kortti.classList.add('kortti--seuraava');
    const merkki = document.createElement('p');
    const vahva = document.createElement('strong');
    vahva.textContent = 'Seuraava ottelu';
    merkki.append(vahva);
    kortti.append(merkki);
  }
  return kortti;
}

const tanaan = new Date().toISOString().slice(0, 10);

// Pelattu = tulos on tiedossa tai päivä on jo mennyt
function onPelattu(ottelu) {
  return Boolean(ottelu.result) || (ottelu.date != null && ottelu.date < tanaan);
}

// Hakee kaikki sivut: rajapinta antaa next-kursorin, kunnes lista loppuu
async function haeKaikkiOttelut() {
  const kaikki = [];
  let kursori = null;
  let sivuja = 0;
  do {
    const sivu = await haeUudelleenyrittaen(apiUrl('/items', { limit: 50, cursor: kursori }), naytaTila);
    kaikki.push(...(sivu.items ?? []));
    kursori = sivu.next ?? null;
    sivuja++;
  } while (kursori && sivuja < 20);
  return kaikki;
}

let otteluita = 0;

async function lataaOttelut() {
  const listat = [ottelut.tulevat, ottelut.tulokset].filter(Boolean);
  naytaTila('Ladataan otteluohjelmaa…');
  for (const lista of listat) lista.setAttribute('aria-busy', 'true');

  try {
    const kaikki = await haeKaikkiOttelut();
    otteluita = kaikki.length;

    const tulevat = kaikki
      .filter((o) => !onPelattu(o))
      .sort((a, b) => `${a.date ?? '9999'}${a.time ?? ''}`.localeCompare(`${b.date ?? '9999'}${b.time ?? ''}`));
    const pelatut = kaikki
      .filter(onPelattu)
      .sort((a, b) => `${b.date ?? ''}${b.time ?? ''}`.localeCompare(`${a.date ?? ''}${a.time ?? ''}`));

    const enintaan = Number(ottelut.tulevat.dataset.enintaan) || tulevat.length;
    ottelut.tulevat.replaceChildren(
      ...tulevat.slice(0, enintaan).map((o, i) => teeOttelukortti(o, { seuraava: i === 0 })),
    );
    ottelut.tulokset?.replaceChildren(...pelatut.map((o) => teeOttelukortti(o)));

    if (kaikki.length === 0) {
      naytaTila('Otteluohjelma on tällä hetkellä tyhjä. Uusia otteluita lisätään kauden edetessä.');
      naytaTyhjat();
    } else if (ottelut.tulokset) {
      suodata(valittu);
    } else if (tulevat.length === 0) {
      naytaTila('Tulevia otteluita ei ole juuri nyt. Katso tulokset otteluohjelmasta.');
    } else {
      naytaTila(`Näytetään ${Math.min(enintaan, tulevat.length)} seuraavaa ottelua.`);
    }
  } catch (virhe) {
    console.error(virhe);
    naytaTila(
      virhe.status === 429
        ? 'Palvelin on yhä kiireinen, joten otteluohjelmaa ei voitu ladata. Yritä uudelleen hetken päästä.'
        : 'Otteluohjelmaa ei voitu ladata. Yritä uudelleen hetken päästä päivittämällä sivu.',
      { virhe: true },
    );
  } finally {
    for (const lista of listat) lista.removeAttribute('aria-busy');
  }
}

async function lataaHarjoitukset() {
  harjoitukset.viesti.textContent = 'Ladataan harjoitusaikoja…';
  harjoitukset.lista.setAttribute('aria-busy', 'true');
  try {
    const seura = await haeUudelleenyrittaen(apiUrl('/customer'));
    const vuorot = seura.training ?? [];

    harjoitukset.lista.replaceChildren(...vuorot.map((vuoro) => {
      const kortti = harjoitukset.pohja.content.firstElementChild.cloneNode(true);
      const jk = joukkue(vuoro.team);
      kortti.dataset.joukkue = jk.ryhma;
      kortti.querySelector('.joukkue').textContent = jk.nimi;
      kortti.querySelector('.kortti__paiva').textContent = paivat[vuoro.day] ?? vuoro.day ?? 'Päivä ilmoitetaan myöhemmin';
      kortti.querySelector('.aika').textContent = vuoro.time ? vuoro.time.replaceAll(':', '.') : 'Aika ilmoitetaan myöhemmin';
      kortti.querySelector('.paikka').textContent = vuoro.place || 'Paikka ilmoitetaan myöhemmin';
      return kortti;
    }));

    harjoitukset.viesti.textContent = vuorot.length === 0
      ? 'Harjoitusajat päivitetään pian. Kysy valmentajalta.'
      : 'Viikoittaiset vuorot. Muutoksista ilmoitetaan joukkueiden valmentajille.';

    if (seura.contact) {
      harjoitukset.yhteyshenkilo.textContent = `Kysyttävää harjoituksista? Yhteyshenkilö: ${seura.contact}.`;
      harjoitukset.yhteyshenkilo.hidden = false;
    }
    suodata(valittu, { paivitaTila: false });
  } catch (virhe) {
    console.error(virhe);
    harjoitukset.viesti.textContent = 'Harjoitusaikoja ei voitu ladata. Yritä uudelleen hetken päästä päivittämällä sivu.';
    harjoitukset.viesti.classList.add('is-error');
  } finally {
    harjoitukset.lista.removeAttribute('aria-busy');
  }
}


// ─── 3. Joukkuesuodatin ladatulle datalle (listing.html) ───────────────
const suodatinNapit = document.querySelectorAll('[data-suodatin]');
let valittu = 'kaikki';

const ryhmaNimet = { juniorit: 'juniorien', naiset: 'naisten', miehet: 'miesten' };

function naytaTyhjat() {
  for (const lista of document.querySelectorAll('.kortit')) {
    const tyhja = lista.parentElement.querySelector('.tyhja');
    if (!tyhja) continue;
    tyhja.hidden = lista.querySelector('[data-joukkue]:not([hidden])') !== null;
  }
}

function suodata(ryhma, { paivitaTila = true } = {}) {
  valittu = ryhma;
  let naytetaan = 0;
  for (const kortti of document.querySelectorAll('#tulevat-lista [data-joukkue], #tulokset-lista [data-joukkue], #harjoitus-lista [data-joukkue]')) {
    const nayta = ryhma === 'kaikki' || kortti.dataset.joukkue === ryhma;
    kortti.hidden = !nayta;
    if (nayta && kortti.closest('#harjoitus-lista') == null) naytetaan++;
  }
  naytaTyhjat();

  // Tilariviä ei muuteta, jos ottelut ovat vielä latautumassa tai lataus epäonnistui
  if (!paivitaTila || otteluita === 0 || !ottelut.tila) return;
  naytaTila(ryhma === 'kaikki'
    ? `Näytetään kaikki ottelut: ${naytetaan} / ${otteluita}.`
    : `Näytetään ${ryhmaNimet[ryhma]} ottelut: ${naytetaan} / ${otteluita}.`);
}

for (const nappi of suodatinNapit) {
  nappi.addEventListener('click', () => {
    for (const toinen of suodatinNapit) {
      toinen.setAttribute('aria-pressed', String(toinen === nappi));
    }
    suodata(nappi.dataset.suodatin);
  });
}

if (ottelut.tila && ottelut.tulevat && ottelut.pohja) lataaOttelut();
if (harjoitukset.lista && harjoitukset.pohja) lataaHarjoitukset();


// ─── 4. Kokeiluharjoituksen ilmoittautuminen (contact.html) ─────────────
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
