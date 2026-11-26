# AI-loki

Käytin Claudea. En ollut tehnyt nettisivuja ennen, joten käytin sitä aika paljon, ja osa koodista on suoraan siltä. Tarkistin kaiken itse selaimessa ja puhelimella.

## E1

- **Aloitus:** kysyin, mistä aloitan ja mitä tiedostoja tarvitaan. Sain selityksen HTML:stä, CSS:stä ja JS:stä sekä neuvon aloittaa index.html:llä ja style.css:llä.
- **Rakenne:** kysyin, miten tiedot kannattaa jakaa sivuille. Tein neljä sivua (index, about, listing, contact) ja kirjoitin tekstit itse.
- **Tekstit:** kysyin, mitä tietoja otteluista ja harjoituksista pitää näkyä. Vastaus: päivä, kello, joukkue, vastustaja ja paikka.

## E2

- **style.css:** pyysin yhdistämään oman style.css:ni ja E2:n vaatimukset (:root-muuttujat, 320 px, tumma tila, fokus). Tekoäly kirjoitti suurimman osan tiedostosta.
- **Kontrasti:** tekoäly laski, että seuran oranssi #e8742a on vaalealla taustalla vain 2.75:1, ja ehdotti tekstiin tummempaa #b04f12:ta. Valkoinen teksti oranssilla napilla ei myöskään riittänyt, joten vaihdoin sen tummaksi.
- **Sivut:** pyysin yhdistämään omat sivuni (index, listing, contact, about) samaan rakenteeseen ja tyyliin. Lomake ja sen JS ovat omiani, tekoäly lisäsi niihin tyylit.
- **Tarkistuksen virheet:** tarkistin valitti, että listing.html:ssä on kaksi h1:tä ja että ylä- ja alatunniste ovat eri sivuilla erilaiset. Tekoäly korjasi about.html:n samaan malliin kuin muut sivut.
- **moodboard.md:** tekoäly teki pohjan plan.md:n ja sivujeni perusteella. Valitsin itse kolme lähdesivustoa ja kerroin, mitä sain niistä.

## E3

- **Suodatin:** pyysin listing.html:ään joukkuesuodattimen (kaikki, juniorit, naiset, miehet) ja tilarivin "Näytetään X / Y". Tekoäly kirjoitti suurimman osan script.js:n kurssin kahvilaesimerkin mallilla, ja kokeilin sitä näppäimistöllä.
- **Lomake:** pyysin muuttamaan ilmoittautumislomakkeen E3:n vaatimusten mukaiseksi: omat virheilmoitukset kenttien alle, fokus ensimmäiseen virheeseen, valmis-viesti role="status" ja luonnos localStorageen. Tekoäly kirjoitti koodin, ja tarkistin, että virheet häviävät, kun korjaan kentän.
- **Popover:** tekoäly lisäsi kaikkien sivujen valikkoon "Hyvä tietää" -popoverin, joka aukeaa ja sulkeutuu Enterillä ja Escillä.

## E4

- **Data rajapinnasta:** pyysin tekemään E4:n luennon 7 tarkistuslistan mukaan. Tekoäly haki seuran datan kurssin rajapinnasta (customer=2) ja kirjoitti app.js:ään koodin, joka näyttää ottelut, tulokset ja harjoitusajat sieltä. Keksityt esimerkkiottelut poistuivat.
- **Neljä tilaa:** latausviesti, virheviesti, tyhjä lista ja 429-tilanne, jossa sivu odottaa, yrittää uudelleen ja luovuttaa kolmen yrityksen jälkeen. Puuttuvat tiedot (null) korvataan tekstillä, esimerkiksi "Paikka ilmoitetaan myöhemmin".
- **Suodatin:** E3:n joukkuesuodatin toimii nyt ladatuille otteluille ja harjoitusajoille. Rajapinnan joukkueet P12, T12 ja P15 näkyvät junioreina.
- **Testaus:** tekoäly testasi kaikki tilat. Itse kokeilin sivua selaimessa ja katsoin Network-välilehdeltä, että pyynnöt menevät oikealle asiakasnumerolle.

## Mitä opin

Opin, miten CSS-muuttujat ja tumma tila toimivat, ja ettei brändin väri aina käy tekstiin sellaisenaan. Jatkossa yritän kirjoittaa enemmän itse ja kysyä vasta, kun jumitan.
