export const stories = {
  space: {
    number: '01', category: 'SPACE & DISCOVERY', feeling: 'Wonder',
    title: 'Where stars<br><em>begin.</em>', titleText: 'Where stars begin',
    intro: 'Inside a cloud of dust, something extraordinary is taking shape.',
    publisher: 'NASA', date: '19 October 2022', isoDate: '2022-10-19',
    sourceTitle: 'NASA’s Webb Takes Star-Filled Portrait of Pillars of Creation',
    source: 'https://science.nasa.gov/missions/webb/nasas-webb-takes-star-filled-portrait-of-pillars-of-creation/',
    image: './assets/images/pillars.png', imageAlt: 'The rust-colored Pillars of Creation surrounded by stars, photographed by the James Webb Space Telescope.',
    imageTag: 'A FIELD GUIDE TO WONDER', imageCredit: 'NASA, ESA, CSA, STScI · Image processing: Joseph DePasquale, Anton Koekemoer & Alyssa Pagan',
    score: './scores/space.strudel', scale: 'D Lydian', pitches: ['D','E','F♯','G♯','A','B','C♯'], pitchClasses: [2,4,6,8,9,11,1],
    texture: 'Glass-like notes. Open fifths. A little light.',
    scoreText: 'Small points of sound open into a wider register, like stars emerging from a cloud.',
    theory: 'A D–A pedal holds the center while the melody uses D Lydian. Its raised fourth, G♯, adds a floating color. There is no dominant-to-tonic cadence that needs a particular direction: the melody can retrace its steps over the same tonal ground.',
    next: 'reef', nextLabel: 'Unease / our oceans',
    chapters: [
      {title:'A familiar sky, seen anew.', text:'In October 2022, the James Webb Space Telescope offered a new look at the Pillars of Creation. What resemble monumental stone towers are actually clouds of cool interstellar gas and dust. Near-infrared light lets us look into a landscape that visible light cannot reveal in the same way.', cue:'A low D and an open fifth establish space before the upper notes appear.'},
      {title:'There is light inside the dust.', text:'Bright red points around the pillars mark newly formed stars. Within the clouds, dense knots of material gather under gravity. As they contract and heat, stars begin to form. Some of the dramatic red features near the pillars are associated with energetic outflows from young stars.', cue:'The melody reaches upward. G♯ gives the scene its suspended, Lydian color.'},
      {title:'A picture that changes a question.', text:'The image is also a tool for research. More precise counts of young stars, alongside measurements of the region’s gas and dust, can refine models of star formation. The scene lies roughly 6,500 light-years away in the Eagle Nebula: a distant place where an old story is still beginning.', cue:'The register opens further, while the same D–A foundation remains beneath it.'}
    ]
  },
  reef: {
    number:'02', category:'CLIMATE & OUR OCEANS', feeling:'Unease',
    title:'When the reef<br><em>goes quiet.</em>', titleText:'When the reef goes quiet',
    intro:'A living landscape loses its color. The warning travels across oceans.',
    publisher:'NOAA',date:'15 April 2024',isoDate:'2024-04-15',
    sourceTitle:'NOAA confirms 4th global coral bleaching event',
    source:'https://www.noaa.gov/news-release/noaa-confirms-4th-global-coral-bleaching-event',
    image:'./assets/images/reef.svg',imageAlt:'Original illustration of a pale branching coral against a deep green ocean.',
    imageTag:'A FIELD GUIDE TO FRAGILITY',imageCredit:'Original illustration for Undertone · A reading of NOAA’s April 2024 report',
    score:'./scores/reef.strudel',scale:'D Phrygian',pitches:['D','E♭','F','G','A','B♭','C'],pitchClasses:[2,3,5,7,9,10,0],
    texture:'Low pulses. Close intervals. Unsettled air.',
    scoreText:'A dark, steady foundation meets notes that lean close to it. Space and restraint carry the tension.',
    theory:'D Phrygian places E♭ just a semitone above D. Against the D–A pedal, that closeness creates deliberate friction. The score stays inside one mode and returns to the same motif, so going backward preserves the tension without depending on a final cadence.',
    next:'orchestra',nextLabel:'Hope / human ingenuity',
    chapters:[
      {title:'A warning, written in white.',text:'On 15 April 2024, NOAA confirmed a fourth global coral bleaching event. Satellite monitoring showed widespread heat stress across the Atlantic, Pacific and Indian Oceans. Bleaching reports had arrived from both hemispheres. This reading looks back at that announcement, rather than describing conditions today.',cue:'A low, narrow-register motif makes the first gestures feel weighted.'},
      {title:'More than a change of color.',text:'Severe or prolonged heat stress can kill corals. The consequences extend beyond the reef itself to the people who depend on it: livelihoods, local economies and food security are connected to the health of these ecosystems. What looks like a distant underwater change reaches human lives on shore.',cue:'E♭ presses against the D foundation. The close interval is an intentional source of unease.'},
      {title:'A possibility worth protecting.',text:'Bleaching is not an automatic death sentence. Corals can recover when the stress eases. NOAA’s report described restoration and protection efforts, including moving nursery corals into deeper, cooler water and using sunshades in Florida. That possibility leaves room for action, without making the threat disappear.',cue:'The last phrase leaves more room between notes. Its center stays unresolved and watchful.'}
    ]
  },
  orchestra: {
    number:'03',category:'PEOPLE & HUMAN INGENUITY',feeling:'Hope',
    title:'A second life.<br><em>A first note.</em>',titleText:'A second life. A first note.',
    intro:'In Paraguay, discarded materials become instruments. Then they become possibility.',
    publisher:'NPR / Anastasia Tsioulcas',date:'14 September 2016',isoDate:'2016-09-14',
    sourceTitle:'From Trash To Triumph: The Recycled Orchestra',
    source:'https://www.northcountrypublicradio.org/news/npr/493794763/from-trash-to-triumph-the-recycled-orchestra',
    image:'./assets/images/orchestra.svg',imageAlt:'Original illustration of a violin assembled from warm geometric shapes, crossed by a bow.',
    imageTag:'A FIELD GUIDE TO POSSIBILITY',imageCredit:'Original illustration for Undertone · Based on NPR’s reporting from Cateura',
    score:'./scores/orchestra.strudel',scale:'C major pentatonic',pitches:['C','D','E','G','A'],pitchClasses:[0,2,4,7,9],
    texture:'Warm plucks. Answering phrases. Room to play.',
    scoreText:'A small musical idea becomes a conversation. Bright, short notes leave space for another voice.',
    theory:'C–D–E–G–A is a major pentatonic collection: five notes without semitone steps. Over a C–G foundation, the short phrases can answer one another in either direction. The score builds through register and texture rather than a one-way chord progression.',
    next:'erosion',nextLabel:'Carved / subtractive synthesis',
    chapters:[
      {title:'Start with what is there.',text:'NPR’s 2016 report visits Cateura, a community beside a landfill near Asunción, Paraguay. Its young musicians play instruments built from discarded materials: cans become parts of violins, an oil drum becomes a cello, and old X-ray film becomes drumheads. Materials with one life behind them begin another.',cue:'One short pentatonic phrase makes an invitation. A lower voice answers.'},
      {title:'An idea becomes an ensemble.',text:'Environmental engineer Favio Chávez began teaching music in his spare time. When donated instruments ran short, he asked local carpenter Nicolás Gómez to build more from materials recovered at the landfill. The Recycled Orchestra grew from that practical collaboration, opening musical opportunities that conventional instruments could not provide.',cue:'The motif rises into a brighter register, staying within the same five-note family.'},
      {title:'The sound travels home.',text:'The ensemble eventually toured internationally, performing classical works and Paraguayan folk music. According to NPR, touring income helped fund safer homes for some members and their families. Chávez also described a change within the community: greater respect for children’s education, and for the time they needed to learn.',cue:'Two registers share the phrase. Going backward becomes another answer, not a broken ending.'}
    ]
  },
  erosion: {
    number:'04',category:'GEOLOGY & DEEP TIME',feeling:'Patience',navTitle:'Carved',navSubject:'subtractive',
    title:'What the river<br><em>leaves.</em>',titleText:'What the river leaves',
    intro:'A landscape takes shape as material is carried away. So does this sound.',
    publisher:'National Park Service',date:'NPS reference guide',
    sourceTitle:'Geologic Formations — Grand Canyon National Park',
    source:'https://www.nps.gov/grca/learn/nature/geologicformations.htm',
    image:'./assets/images/erosion.svg',imageAlt:'Original illustration of layered canyon walls, carved through by a winding river.',
    imageTag:'SHAPE THROUGH SUBTRACTION',imageCredit:'Original illustration for Undertone · Geological reading adapted from the National Park Service',
    score:'./scores/erosion.strudel',scale:'G Dorian',pitches:['G','A','B♭','C','D','E','F'],pitchClasses:[7,9,10,0,2,4,5],
    texture:'A rich saw wave, slowly carved by a filter.',technique:'Subtractive synthesis',
    method:'Start with a sound containing many harmonics, then filter some away. Here, descending through the article closes the filter; returning upward reveals the brighter layers.',
    scoreText:'The sound follows the article’s process: a full spectrum becomes a shape through removal.',
    theory:'A G–D foundation and a G Dorian melody keep the tonal center steady as the filter changes. Each chapter removes more upper harmonics from the saw wave. Reading backward restores that brightness while keeping the melody in the same mode.',
    next:'fireflies',nextLabel:'Together / additive synthesis',
    chapters:[
      {title:'A record with its cover removed.',text:'Grand Canyon exposes rock layers that record a vast stretch of geological history. The National Park Service describes a landscape shaped by uplift, deposition, volcanic activity and erosion. Carving away the plateau made those layers available to study: removal revealed a record that had been hidden.',cue:'The opening saw wave contains a broad range of upper harmonics.'},
      {title:'Some layers resist. Others yield.',text:'The Colorado River cut deeply into the plateau. Different rocks respond differently to erosion: resistant sandstone and limestone form prominent cliffs, while softer layers produce slopes. The resulting shape is not uniform. Material, water and time have worked together to produce the canyon’s contrasting surfaces.',cue:'A lower filter cutoff removes brighter overtones, leaving a rounder sound.'},
      {title:'What remains has a shape.',text:'The exposed walls let geologists compare environments across layers and across distance. The canyon is more than an empty space between rock faces; its surfaces reveal the processes that made it. In this score, the quieter spectrum is also a result of what has been removed.',cue:'The final chapter keeps the fundamental and fewer upper harmonics. A pause holds that filtered sound.'}
    ]
  },
  fireflies: {
    number:'05',category:'NATURE & COLLECTIVE PATTERNS',feeling:'Connection',navTitle:'Together',navSubject:'additive',
    title:'One light.<br><em>A whole forest.</em>',titleText:'One light. A whole forest.',
    intro:'Small signals gather into a shared pattern. Simple tones gather into one richer voice.',
    publisher:'National Park Service',date:'Updated 14 October 2026',isoDate:'2026-10-14',
    sourceTitle:'Synchronous Fireflies — Great Smoky Mountains National Park',
    source:'https://www.nps.gov/grsm/learn/nature/fireflies.htm',
    image:'./assets/images/fireflies.svg',imageAlt:'Original illustration of small golden lights gathering between dark forest trunks.',
    imageTag:'COMPLEXITY THROUGH COMBINATION',imageCredit:'Original illustration for Undertone · A musical analogy inspired by the NPS firefly guide',
    score:'./scores/fireflies.strudel',scale:'A major pentatonic',pitches:['A','B','C♯','E','F♯'],pitchClasses:[9,11,1,4,6],
    texture:'One pure component becomes a blend of harmonics.',technique:'Additive synthesis',
    method:'Add simple sine-wave components to construct a richer tone. Each chapter adds more harmonics to the same waveform, echoing the idea of small contributions forming a collective pattern.',
    scoreText:'The relationship is a compositional analogy: many small contributions become one perceptible whole.',
    theory:'An A–E foundation and the five notes of A major pentatonic support either reading direction. The waveform grows from one harmonic to three, then six. Reading backward removes those components. This is an original musical analogy, not a recording or scientific model of firefly flashes.',
    next:'bell',nextLabel:'Resonance / FM synthesis',
    chapters:[
      {title:'A signal in the dark.',text:'Fireflies are beetles, and their light serves an important purpose in finding mates. Different species have distinctive flashing patterns that help males and females recognize one another. In Great Smoky Mountains National Park, one species is known for an especially striking collective display.',cue:'One harmonic begins the tone. The waveform is close to a pure sine.'},
      {title:'More lights enter the pattern.',text:'Photinus carolinus can coordinate its flashes with other individuals. The National Park Service describes bursts of light followed by darkness. As more males join, the rhythms can align. Females respond during the pauses, although the reasons for the synchronized behavior are not yet fully understood.',cue:'Two more harmonic components join the fundamental, making the timbre fuller.'},
      {title:'A shared pattern needs space.',text:'Bright artificial lights can interfere with the display and with visitors’ night vision. The park asks people to protect the insects and their habitat. Watching this phenomenon means making room for something delicate: a collective pattern whose individual participants are easily overlooked.',cue:'Six harmonics now form one sound. Pausing sustains their combined waveform.'}
    ]
  },
  bell: {
    number:'06',category:'HISTORY & MATERIAL MEMORY',feeling:'Resonance',navTitle:'Resonance',navSubject:'FM',
    title:'A voice<br><em>held in metal.</em>',titleText:'A voice held in metal',
    intro:'A bell carries a message through sound, through damage, and eventually through silence.',
    publisher:'National Park Service',date:'NPS reference guide',
    sourceTitle:'The Liberty Bell — Independence National Historical Park',
    source:'https://www.nps.gov/inde/learn/historyculture/stories-libertybell.htm',
    image:'./assets/images/bell.svg',imageAlt:'Original bronze-colored bell illustration with concentric lines suggesting resonance.',
    imageTag:'COLOR THROUGH MODULATION',imageCredit:'Original illustration for Undertone · An original score inspired by the Liberty Bell’s history',
    score:'./scores/bell.strudel',scale:'E minor pentatonic',pitches:['E','G','A','B','D'],pitchClasses:[4,7,9,11,2],
    texture:'A sine wave becomes glassy, then metallic.',technique:'Frequency modulation (FM)',
    method:'One oscillator rapidly changes another oscillator’s frequency. Their ratio and modulation depth create extra spectral components. Here, a non-integer ratio gives the notes a metallic color.',
    scoreText:'The material suggests the method: complex metallic resonance is interpreted through FM.',
    theory:'An E–B foundation and E minor pentatonic phrases keep the notes related in both directions. Modulation depth increases across the chapters while the carrier/modulator ratio stays at 1.414. The result suggests metal; it does not reconstruct the Liberty Bell’s actual sound.',
    next:'loss',nextLabel:'A life / domestic violence',
    chapters:[
      {title:'Before it was a symbol.',text:'The bell ordered for Pennsylvania’s State House in 1751 cracked during its first test. Local metalworkers John Pass and John Stow melted it down and cast a replacement. The bell called lawmakers to meetings and gathered people to hear news before becoming a symbol of liberty.',cue:'A little frequency modulation gives an otherwise smooth sine wave a glassy edge.'},
      {title:'The visible crack is a repair.',text:'The National Park Service explains that the familiar wide opening was an attempt to repair a smaller crack in 1846. Metalworkers widened the split to stop it spreading and restore the bell’s tone. The repair failed when another fissure developed, ending the bell’s ordinary ringing life.',cue:'More modulation creates additional spectral components and a stronger metallic color.'},
      {title:'A voice beyond the ringing.',text:'Abolitionists and later movements for voting and civil rights drew meaning from the bell’s inscription. Its history continued after its audible voice was lost. Computer modeling offers clues to the sound, but this score takes a different path: an original musical interpretation of material and memory.',cue:'The modulation is richest here. A pause holds the current resonance without advancing the melody.'}
    ]
  },
  loss: {
    number:'07',category:'PEOPLE & DOMESTIC VIOLENCE',feeling:'Grief',navTitle:'A life',navSubject:'Holly Bramley',
    title:'A life.<br><em>Not a headline.</em>',titleText:'A life. Not a headline.',
    intro:'Holly Bramley was killed by her husband. Her family remembers a person, not a crime story.',
    publisher:'Sky News / Connor Sephton',date:'8 April 2024',isoDate:'2024-04-08',
    sourceTitle:'Court report: Nicholas Metson sentenced for the murder of Holly Bramley',
    source:'https://news.sky.com/story/nicholas-metson-evil-monster-who-cut-his-wifes-body-into-224-pieces-jailed-for-life-13110719',
    image:'./assets/images/loss.svg',imageAlt:'Original illustration of an empty chair beside a sunlit window and a small plant.',
    imageTag:'A PERSON LEAVES AN ABSENCE',imageCredit:'Original illustration for Undertone · An imagined room, not a depiction of Holly’s home',
    score:'./scores/loss.strudel',scale:'E natural minor',pitches:['E','F♯','G','A','B','C','D'],pitchClasses:[4,6,7,9,11,0,2],
    texture:'Rounded triangle tones. Slow openings. A recurring small phrase.',technique:'Amplitude envelopes',
    method:'An envelope shapes how a note begins and fades. Soft attacks and rounded triangle waves give this small repeated phrase a restrained voice. The sound stays intimate as the article moves from the judgment to the family’s loss.',
    scoreText:'A small phrase keeps returning, with room around it. The score centers the loss of a person rather than recreating violence.',
    theory:'E natural minor stays over an E–B foundation. The melody narrows toward the end instead of building to a dramatic climax. A recurring tonal center lets the phrase retrace in either direction. Pausing keeps the shared warm hold, with no new melodic events.',
    next:'minab',nextLabel:'An empty classroom / Minab',
    chapters:[
      {title:'Begin with her name.',text:'Holly Bramley was 26 when she was murdered in Lincoln in March 2023. In the sentencing report, her mother remembers her kindness and the love she gave. Her family and friends describe the lasting absence left by her death. That is where this reading begins: with the person who was lost.',cue:'A gentle triangle-wave phrase stays close to its E–B foundation.'},
      {title:'The judgment is a fact.',text:'On 8 April 2024, Nicholas Metson received a life sentence after admitting the murder of his wife. Sky News reported a minimum term of 19 years and 316 days. This summary states the established court outcome; it does not invent an explanation for why he killed her.',cue:'The same phrase returns with a softer opening, rather than becoming a crime-drama crescendo.'},
      {title:'The loss does not end here.',text:'The court also heard how deeply the killing affected Holly’s family and friends. A sentence can be recorded in a news report; the grief described by those who loved her has no comparable endpoint. The final paragraph returns attention to that loss, rather than to the perpetrator’s actions.',cue:'The register contracts. Stop scrolling and the harmony stays with this moment.'}
    ]
  },
  minab: {
    number:'08',category:'WAR & CIVILIAN LIVES',feeling:'Mourning',navTitle:'Classroom',navSubject:'Minab, Iran',
    title:'Where a lesson<br><em>stopped.</em>',titleText:'Where a lesson stopped',
    intro:'A school in Minab. Children killed. Questions that remain.',
    publisher:'Associated Press',date:'6 September 2026 · with 11 March reporting',isoDate:'2026-09-06',
    sourceTitle:'AP reporting: the Minab school becomes a memorial',
    source:'https://www.ksat.com/news/world/2026/09/06/the-iranian-school-struck-in-the-wars-earliest-attacks-is-now-a-memorial-for-children/',
    relatedSources:[{label:'AP, 11 March: preliminary investigation',url:'https://wtop.com/world/2026/03/senators-demand-answers-on-school-strike-in-iran-as-growing-evidence-points-to-us-involvement/'}],
    image:'./assets/images/minab.svg',imageAlt:'Original abstract illustration of empty classroom desks and an unfinished line on a chalkboard.',
    imageTag:'SPACE FOR WHAT IS MISSING',imageCredit:'Original illustration for Undertone · An imagined classroom, not a reconstruction of the school',
    score:'./scores/minab.strudel',scale:'A minor pentatonic',pitches:['A','C','D','E','G'],pitchClasses:[9,0,2,4,7],
    texture:'An unfinished phrase. Missing harmonics. A quiet open fifth.',technique:'Additive synthesis through omission',
    method:'Simple harmonic components form one tone. Across the chapters, one component disappears and another softens. Gaps in the melody leave the continuous harmony exposed: absence is part of the composition.',
    scoreText:'The musical gesture is an incomplete phrase and a thinning voice. It leaves room for mourning without imitating the attack.',
    theory:'A–C–D–E–G stays over an A–E foundation. Rest positions and removed partials make the phrase incomplete without requiring a sudden loud event. Reading upward restores earlier components. During a pause, the held layer sustains the current spectrum in its gentler form.',
    next:'election',nextLabel:'A public decision / Brazil',
    chapters:[
      {title:'A school day interrupted.',text:'A strike hit a girls’ elementary school in Minab, Iran, on 28 February 2026, killing children and adults. By September, AP found the site becoming a memorial, with photographs preserving memories of the children’s lives.',cue:'An A–E foundation supports a small phrase. Its gaps expose the held sound beneath.'},
      {title:'What the reporting established.',text:'In March, AP cited two sources briefed on a preliminary U.S. investigation: outdated targeting intelligence likely led to a U.S. strike. That was a reported preliminary finding, not a final determination that the attack was accidental.',cue:'The second harmonic disappears. A thinner tone carries the same notes; there are no impact sounds.'},
      {title:'A place for remembrance.',text:'AP’s September reporting described evidence that at least one U.S. missile hit the school. As of that report, the administration had not directly accepted responsibility or released the Pentagon’s findings. This reading keeps that date and uncertainty visible.',cue:'The remaining upper component softens. Pausing holds the harmony rather than completing the phrase.'}
    ]
  },
  election: {
    number:'09',category:'BRAZIL & DEMOCRACY',feeling:'Anticipation',navTitle:'Decision',navSubject:'Brazil votes',
    title:'Millions of votes.<br><em>A public decision.</em>',titleText:'Millions of votes. A public decision.',
    intro:'Lula wins the 2026 runoff against Flávio Bolsonaro. The count ends; the country’s work continues.',
    publisher:'Tribunal Superior Eleitoral',date:'26 October 2026',isoDate:'2026-10-26',
    sourceTitle:'Presidente do TSE anuncia reeleição de Lula e faz balanço do 2º turno das Eleições 2026',
    source:'https://www.tse.jus.br/comunicacao/noticias/2026/Outubro/presidente-do-tse-anuncia-reeleicao-de-lula-e-faz-balanco-do-2o-turno-das-eleicoes-2026',
    image:'./assets/images/election.svg',imageAlt:'Original abstract illustration of many small ballot-like marks gathering into two counted columns.',
    imageTag:'FROM ANTICIPATION TO A RESULT',imageCredit:'Original illustration for Undertone · Abstract marks, not a chart of the vote totals',
    score:'./scores/election.strudel',scale:'C Mixolydian',pitches:['C','D','E','F','G','A','B♭'],pitchClasses:[0,2,4,5,7,9,10],
    texture:'Suspended phrases. Harmonic FM. A steadier final motif.',technique:'Harmonic frequency modulation',
    method:'One oscillator changes another’s frequency at an integer ratio of 2:1. This adds related overtones. Modulation grows in the middle passage, then eases as a suspended F gives way to E in the recurring motif.',
    scoreText:'The count moves from waiting toward a stated result. The musical response follows that process, without assigning a heroic or threatening sound to either candidate.',
    theory:'C Mixolydian shares one C–G center throughout. The middle passage emphasizes F and B♭; the last favors C, E and G. That changes the balance of the phrase without making a one-way dominant cadence necessary. Reverse reading returns to anticipation over the same foundation.',
    next:'routes',nextLabel:'More connections / São Paulo',
    chapters:[
      {title:'A result announced.',text:'Brazil’s electoral court announced Luiz Inácio Lula da Silva’s reelection after the presidential runoff on 25 October 2026. His opponent was Flávio Bolsonaro. The TSE published its account after midnight on 26 October, recording the outcome and describing the administration of the second round.',cue:'An open C–G foundation supports a phrase that keeps returning to the suspended fourth, F.'},
      {title:'A close public choice.',text:'The TSE reported 64,256,232 valid votes for Lula, or 51.79%, and 59,826,041 for Flávio Bolsonaro, or 48.21%. Those figures establish the result. They do not describe one shared emotion: voters on either side can experience the same announcement very differently.',cue:'A stronger, harmonic FM color adds urgency. Both candidates remain outside the musical metaphor.'},
      {title:'The voters remain the center.',text:'The court reported that about 128.2 million people voted in the second round, from an eligible electorate of more than 158 million. Its president emphasized citizens’ participation. The score follows the transition from uncertainty to a counted decision, leaving the political meaning to the reader.',cue:'The motif settles more often on C, E and G, while the sound becomes rounder.'}
    ]
  },
  routes: {
    number:'10',category:'CITY LIFE & PUBLIC TRANSPORT',feeling:'Possibility',navTitle:'Routes',navSubject:'São Paulo',
    title:'The outskirts.<br><em>More connected.</em>',titleText:'The outskirts. More connected.',
    intro:'New bus service and a connection to rail redraw an everyday journey in southern São Paulo.',
    publisher:'SPTrans',date:'13 April 2026',isoDate:'2026-04-13',
    sourceTitle:'SPTrans announces Terminal Estação Varginha and its phased bus connections',
    source:'https://www.sptrans.com.br/noticias/prefeitura-e-governo-do-estado-inauguram-terminal-estacao-varginha-com-integracao-direta-aos-trilhos-e-reducao-de-tempo-de-viagem/',
    image:'./assets/images/routes.svg',imageAlt:'Original illustration of neighborhood paths meeting at a bus and rail interchange.',
    imageTag:'SEPARATE LINES FIND A CONNECTION',imageCredit:'Original illustration for Undertone · A schematic musical analogy, not a transit map',
    score:'./scores/routes.strudel',scale:'D major pentatonic',pitches:['D','E','F♯','A','B'],pitchClasses:[2,4,6,9,11],
    texture:'Short warm plucks. Offbeat answers. Paths joining a common pulse.',technique:'Interlocking sequences and additive tones',
    method:'A foundation sequence leaves gaps for another voice. Across the chapters, more answers join those spaces. Simple harmonic components give the plucks a warm tone; the separate parts form one connected pattern.',
    scoreText:'The article’s process becomes the music’s structure: a useful connection appears between previously separate routes.',
    theory:'D major pentatonic sits over D and A. The answering sequence enters in the gaps between foundation notes, then appears more often. All voices share the same five-note collection, so reversing keeps their tonal relationship while changing the order of the connections.',
    next:'worldcup',nextLabel:'Champions / a fictional World Cup',
    chapters:[
      {title:'A connection closer to home.',text:'On 13 April 2026, SPTrans announced the opening of Terminal Estação Varginha in São Paulo’s far south. The new terminal connects directly to Line 9-Esmeralda. The announcement describes an interchange intended to make journeys between neighborhood buses and rail more direct.',cue:'One short pentatonic route moves above a regular D–A foundation.'},
      {title:'One new line, several new links.',text:'The first phase, scheduled from 14 April, included a new circular route, 6082-10, linking the two Varginha terminals. Other services were transferred to the new interchange, including the Parelheiros route and buses serving Jardim Itajaí and Jardim Sete de Setembro. A new connection can matter as much as a new line.',cue:'A second voice starts answering in the spaces between the foundation notes.'},
      {title:'A network grows in stages.',text:'SPTrans scheduled a second phase for 2 May, with additional neighborhood routes moving into the terminal. The plan also described six platforms and accessibility facilities. These were announced service changes, not an independent measurement of their effects. The musical idea is the connection itself: separate journeys finding a shared point.',cue:'More offbeat answers join the same pulse. A pause sustains their common tonal ground.'}
    ]
  },
  worldcup: {
    number:'11',category:'FICTION / BRAZIL & FOOTBALL',feeling:'Euphoria',navTitle:'Champions',navSubject:'fiction',fictional:true,
    title:'The whistle.<br><em>Then everyone.</em>',titleText:'Fiction: Brazil wins the World Cup',
    intro:'An imagined World Cup final. Brazil wins, and a country lets out the breath it has been holding.',
    publisher:'Undertone · Fiction',date:'An imagined tournament',
    image:'./assets/images/worldcup.svg',imageAlt:'Original illustration of an imagined football trophy above a green pitch, surrounded by golden confetti.',
    imageTag:'FICTION / A COUNTRY CELEBRATES',imageCredit:'Original illustration for Undertone · An imagined trophy and celebration',
    score:'./scores/worldcup.strudel',scale:'G major',pitches:['G','A','B','C','D','E','F♯'],pitchClasses:[7,9,11,0,2,4,6],
    texture:'Bright brass-like synths. Rising major thirds. Answering cheers.',technique:'Subtractive brass and answering phrases',
    method:'A saw wave starts with a rich spectrum. Opening its low-pass filter makes the sound brighter as the celebration spreads. Short attacks give the melody a brass-like edge, while a second voice answers the main phrase.',
    scoreText:'A rising G–B–D shape opens into a higher register. Brightness and answering voices carry the release of a shared celebration.',
    theory:'G major and a G–D foundation give the melody one center in either direction. Repeated major-triad leaps, short attacks and a rising register suggest exuberance here. The filter opens from 2400 to 5800 Hz. Pausing turns that same brass-like palette into a gentler sustained harmony.',
    next:'displacement',nextLabel:'Thirty percent / a fictional AI future',
    chapters:[
      {title:'One more second.',text:'In this fictional final, Brazil is one goal ahead and the clock has become almost unbearable. A family stands in front of a television nobody has sat down to watch for several minutes. On the screen, the ball moves away from the Brazilian goal. Someone whispers that it must be over. Nobody quite believes it yet.',cue:'A compact G–B–D call rises, then comes back to its starting point.'},
      {title:'The whole street answers.',text:'The referee blows the final whistle. Brazil has won the World Cup. In the apartment, the first shout is answered from the balcony, then from the building opposite. A stranger on the pavement hugs another stranger. For a moment, people who have never met seem to know exactly what to say to one another.',cue:'The filter opens. A lower answering voice joins the bright main phrase.'},
      {title:'Carry the night home.',text:'Later, the television replays the winning goal while someone makes more coffee. Children try to repeat the players’ celebrations in a corridor much too small for football. The street is still singing. The trophy belongs to the team, but this invented night keeps finding little rooms in which to become everyone’s memory.',cue:'The melody reaches its widest register. Stop scrolling and the celebration settles into a warm, held chord.'}
    ]
  },
  displacement: {
    number:'12',category:'FICTION / AI & LIVELIHOODS',feeling:'Dislocation',navTitle:'Work',navSubject:'fiction',fictional:true,
    title:'Thirty percent.<br><em>What now?</em>',titleText:'Fiction: AI replaces the work of 30% of the world’s population',
    intro:'An imagined world where AI replaces the paid work of people representing 30% of the global population.',
    publisher:'Undertone · Fiction',date:'An imagined future',
    image:'./assets/images/displacement.svg',imageAlt:'Original illustration of empty workstations beside a continuous machine-like line, with one chair pulled away.',
    imageTag:'FICTION / WHEN THE ROUTINE BREAKS',imageCredit:'Original illustration for Undertone · An invented workplace and future',
    score:'./scores/displacement.strudel',scale:'C Phrygian',pitches:['C','D♭','E♭','F','G','A♭','B♭'],pitchClasses:[0,1,3,5,7,8,10],
    texture:'A persistent metallic pattern. Close intervals. Answers that disappear.',technique:'Inharmonic FM and thinning counterpoint',
    method:'Frequency modulation at a non-integer ratio adds a metallic edge to a repeating phrase. A softer triangle-wave voice answers it less often in each chapter. The routine continues while the human-scale conversation loses its place.',
    scoreText:'The repeating system keeps its pulse while another voice withdraws. The effect aims for dislocation and unease, leaving the ending open.',
    theory:'C Phrygian puts D♭ a semitone above the C foundation, creating friction when the two are close. A 1.414 FM ratio adds spectral tension. The answering part shrinks from eight entries to four, then two; this is a musical metaphor, not a numerical model of the fictional 30%. Reading backward restores those answers. Pausing softens the sustained spectrum without advancing the story.',
    next:'laundromat',nextLabel:'One sock / a Martian microfiction',
    chapters:[
      {title:'A number becomes a message.',text:'Across this imagined world, people representing 30% of the global population have lost paid work as AI systems take over their tasks. The figure is invented for this story. In one apartment, the announcement arrives as a short message on a phone: tomorrow’s shift has been cancelled, and there will be no next rota.',cue:'A regular metallic phrase is answered by a softer, rounded voice.'},
      {title:'The system keeps going.',text:'The service still opens on time. Orders are processed, deliveries scheduled and questions answered. Across the road, a café has fewer customers at breakfast. At a kitchen table, someone closes a retraining application that asks for experience in a role created only last month. The machines’ smooth operation and the household’s uncertainty now occupy the same morning.',cue:'FM depth increases. Half of the answering voice’s entries disappear, while the main pattern continues.'},
      {title:'The meeting after work.',text:'That evening, neighbors gather in a borrowed room. One proposes sharing tools; another asks who will pay the rent. They argue about shorter working weeks, public support and who should benefit from the systems now doing the work. Nothing is resolved before the chairs are stacked. They agree on a time to meet again.',cue:'Only two answers remain. The close interval stays unresolved; a pause holds a quieter version of this uncertainty.'}
    ]
  },
  laundromat: {
    number:'13',category:'FICTION / COMEDY & SPACE',feeling:'Mischief',navTitle:'One sock',navSubject:'microfiction',fictional:true,
    title:'One small sock.<br><em>One giant leap.</em>',titleText:'Fiction: the Martian laundromat',
    intro:'The first laundromat on Mars has solved everything except the usual problem.',
    publisher:'Undertone · Fiction',date:'Original microfiction',
    image:'./assets/images/laundromat.svg',imageAlt:'An imagined washing machine under a glass dome on a rust-colored Martian plain.',
    imageTag:'SMALL STORY / CROOKED LITTLE TUNE',imageCredit:'Original illustration for Undertone',
    score:'./scores/laundromat.strudel',scale:'C major pentatonic',pitches:['C','D','E','G','A'],pitchClasses:[0,2,4,7,9],
    texture:'Crunchy arcade notes and tiny pitch slides.',technique:'ZZFX chiptune synthesis',
    method:'ZZFX generates the arcade voice. Its zcrush setting roughens the tone, and small slides bend the pitch. The short tune stays playful.',
    scoreText:'A deliberately small sound suits a very small disaster. The machine’s little victory tune becomes slightly crooked.',
    theory:'C major pentatonic and a C–G foundation keep the tune related in either direction. ZZFX supplies the attacks; the pause uses a softened continuous square wave, so a tiny sound effect never has to loop forever.',
    learn:[{label:'Learn ZZFX and synthesis',url:'https://strudel.cc/learn/synths/#zzfx'}],
    next:'chess',nextLabel:'Two clocks / a short chess scene',
    chapters:[
      {title:'Grand opening.',text:'The first laundromat on Mars opened on a Tuesday. Its owner promised water recovery, radiation shielding and a machine that returned every sock.',cue:'A compact square-wave tune makes a cheerful promise.'},
      {title:'First customer.',text:'An astronaut inserted two socks. The machine played a victory tune and returned three. One was enormous. Nobody recognized the knitting.',cue:'A small upward slide introduces the first wobble.'},
      {title:'Business as usual.',text:'By Friday, the owner had removed the promise. A handwritten sign replaced it: PLEASE CHECK THE POCKETS OF YOUR SPACE-TIME.',cue:'The pitch leans downward. A pause holds the joke’s last harmonic moment.'}
    ]
  },
  chess: {
    number:'14',category:'FICTION / GAMES & CITY LIFE',feeling:'Concentration',navTitle:'Two clocks',navSubject:'short fiction',fictional:true,
    title:'Your move.<br><em>My bus.</em>',titleText:'Fiction: a chess game at the bus stop',
    intro:'Two strangers, one board, and two different reasons to watch the time.',
    publisher:'Undertone · Fiction',date:'Original short fiction',
    image:'./assets/images/chess.svg',imageAlt:'An abstract chessboard between two differently colored clocks beneath a bus-stop sign.',
    imageTag:'TWO PLAYERS / DIFFERENT PULSES',imageCredit:'Original illustration for Undertone',
    score:'./scores/chess.strudel',scale:'D Dorian',pitches:['D','E','F','G','A','B','C'],pitchClasses:[2,4,5,7,9,11,0],
    texture:'Three pulses against five, split left and right.',technique:'Euclidean rhythms, stereo and pitch envelopes',
    method:'Two Euclidean patterns share eight slots but distribute three and five attacks differently. Left/right placement separates the players; a small pitch envelope gives one voice a clipped edge.',
    scoreText:'Each side keeps its own rhythm. Sometimes their gestures meet; sometimes the gap is the whole point.',
    theory:'Both patterns share D Dorian over D–A. Their pulses interlock without needing a particular final chord. A band-pass filter narrows one voice, while stereo placement makes the two parts easier to distinguish. On a pause, the clocks yield to a softer square-wave harmony.',
    learn:[{label:'Learn Euclidean rhythms',url:'https://strudel.cc/learn/mini-notation/#euclidian-rhythms'},{label:'Learn pitch envelopes and panning',url:'https://strudel.cc/learn/effects/'}],
    next:'bakery',nextLabel:'Before dawn / a bakery opens',
    chapters:[
      {title:'An unexpected opening.',text:'The bus was late enough for the old man to unfold his pocket chessboard. The woman beside him moved a pawn before he could ask. They agreed to play until one of their buses arrived. Neither admitted that they had already let one go.',cue:'Three attacks on the left meet five on the right.'},
      {title:'A little pressure.',text:'She played quickly, then waited through his long silences. He noticed her glancing at the road and offered a draw. She declined. A delivery bicycle rattled past. He moved his knight. For the first time, she stopped watching the traffic.',cue:'The upper notes change, while the two rhythms keep their separate identities.'},
      {title:'A useful interruption.',text:'When her bus finally came, the position was still undecided. She photographed the board, wrote a time on his newspaper, and boarded. The old man packed away the pieces in the order he would need them tomorrow.',cue:'The patterns remain open. Stop scrolling and neither player has to move.'}
    ]
  },
  bakery: {
    number:'15',category:'FICTION / FOOD & EVERYDAY CARE',feeling:'Anticipation',navTitle:'Before dawn',navSubject:'a little longer',fictional:true,
    title:'Before the city<br><em>asks for bread.</em>',titleText:'Fiction: the bakery before dawn',
    intro:'In a quiet kitchen, an apprentice learns that waiting is part of making something.',
    publisher:'Undertone · Fiction',date:'Original fiction',
    image:'./assets/images/bakery.svg',imageAlt:'Warm shapes suggesting rising dough, flour and an oven before a blue predawn window.',
    imageTag:'EACH NOTE OPENS FROM WITHIN',imageCredit:'Original illustration for Undertone',
    score:'./scores/bakery.strudel',scale:'F major',pitches:['F','G','A','B♭','C','D','E'],pitchClasses:[5,7,9,10,0,2,4],
    texture:'Warm filtered notes, a little breath and gentle vibrato.',technique:'Filter envelopes, vibrato and patterned stereo',
    method:'A filter envelope opens and settles inside every note. Slight vibrato adds movement. A slow signal shifts the stereo position of successive attacks.',
    scoreText:'The sound opens slowly instead of arriving fully formed. Warmth comes from the way the note develops, not just its pitch.',
    theory:'F major stays over F–C. The score changes each note’s filter envelope as the kitchen wakes. Its vibrato is a restrained gesture; the held sound becomes a quieter, smooth version of the same tonal foundation. Filter movement and the reading clock have separate jobs.',
    learn:[{label:'Learn filter envelopes',url:'https://strudel.cc/learn/effects/#filter-envelope'},{label:'Learn vibrato',url:'https://strudel.cc/learn/synths/'}],
    next:'porcelain',nextLabel:'The visible seam / repairing a cup',
    chapters:[
      {title:'A room with its own weather.',text:`At four in the morning, the bakery windows reflected the kitchen instead of the street. Mara arrived wearing a coat over her apron. Her first task was to take the covers off the bowls. She expected a dramatic transformation, something that would explain why the baker had made her come so early. The dough looked like dough.

Then she leaned closer. Tiny bubbles moved beneath one surface. Another bowl had risen until the cloth rested on it like a low tent. The baker said nothing about patience. He put the kettle on and asked her to listen to the room before switching on the radio.`,cue:'Each filtered note opens, then settles; slight vibrato keeps its surface moving.'},
      {title:'Learning where to leave space.',text:`Mara wanted instructions precise enough to make a mistake impossible. She asked how many folds, how much flour, exactly how long. The baker answered some questions and handed the others back with the dough. A sticky edge did not always need more flour. A stubborn shape did not always need more pressure.

They worked at opposite ends of the bench. Whenever she looked up, he seemed to be doing less than she was. Eventually she stopped trying to make her hands move at his speed. She made one careful fold, then another, and left the next batch alone while they drank their tea.`,cue:'The filter’s movement becomes rounder. The melody keeps a small, gently shifting vibrato.'},
      {title:'The first person through the door.',text:`By the time the first loaves cooled, the window had turned blue. Outside, a cleaner waited for a bus. Mara unlocked the door before the sign said they were open and gave her the end of a loaf that had broken in the oven.

The baker was already weighing flour for tomorrow. Mara asked if every morning was like this. He said no: some mornings everything went wrong. She looked at the broken loaf, the crumbs on the counter, and the cleaner waving from the pavement. She no longer thought that was a complete answer.`,cue:'The notes brighten a little, then leave a warm foundation for a reading pause.'}
    ]
  },
  porcelain: {
    number:'16',category:'FICTION / CRAFT & MEMORY',feeling:'Tenderness',navTitle:'The seam',navSubject:'longer fiction',fictional:true,
    title:'The cup remembers<br><em>its pieces.</em>',titleText:'Fiction: the cup with the visible seam',
    intro:'A repairer receives a cup, a box of fragments, and a request that changes as she works.',
    publisher:'Undertone · Fiction',date:'Original fiction',
    image:'./assets/images/porcelain.svg',imageAlt:'An imagined ceramic cup assembled from pale fragments with a visible warm-colored seam.',
    imageTag:'A SOUND REASSEMBLED FROM FRAGMENTS',imageCredit:'Original illustration for Undertone',
    score:'./scores/porcelain.strudel',scale:'C major pentatonic',pitches:['C','D','E','G','A'],pitchClasses:[0,2,4,7,9],
    texture:'A sampled strike, sliced, reversed and reassembled.',technique:'Sampling, chopping and repeatable omissions',
    method:'One original pitched strike is divided into slices. Reversed playback and fixed-seed omissions break the first phrase apart. Later chapters use larger pieces with fewer gaps.',
    scoreText:'The sound is made from the same material throughout. Repair changes how its pieces fit together.',
    theory:'The sample is an original synthesized C4 strike, transposed within C major pentatonic. Chops move from sixteen slices to eight, then four. Pattern randomness is fixed before playback, so upward reading retraces the same fragments. The hold reconstructs the sample’s harmonic blend as a continuous tone rather than repeating a short recording forever.',
    learn:[{label:'Learn sample chopping and playback',url:'https://strudel.cc/learn/samples/'},{label:'Learn repeatable pattern variation',url:'https://strudel.cc/learn/random-modifiers/'}],
    next:'library',nextLabel:'The lower rooms / a long mystery',
    chapters:[
      {title:'The missing handle.',text:`The cup arrived in a biscuit tin lined with a tea towel. Its owner, a retired projectionist named Leon, had numbered the fragments in pencil. Most numbers had rubbed off on the journey. He apologized for this before saying what he wanted repaired. There was a large piece of the bowl, three smaller pieces, and a handle whose shape suggested that another part was missing.

Iris arranged everything on a sheet of paper. She asked whether the cup was valuable. Leon said that it had been expensive once, but that was not the same thing. It came from the cinema café where he had worked until the building was sold. He had taken it home on the final evening because it was the cup he always used. Last week he had knocked it off the draining board while looking for his glasses.

He wanted it to look as though nothing had happened. Iris explained what she could promise and what she could not. The seam would remain visible, and the repaired object would be decorative. Leon listened politely and then asked whether she could at least turn the worst side toward the wall.`,cue:'The strike arrives in tiny, sometimes reversed fragments. Some pieces are deliberately missing.'},
      {title:'A different kind of likeness.',text:`During the next week, Iris found that two pieces Leon had thought unrelated fitted along a single curved edge. She photographed them and sent him the picture. He replied with a photograph of the old cinema. It showed the café before an extension had blocked its windows, and a woman behind the counter holding a tray of cups. At the bottom of the message he wrote that she had been the only person who knew how he took his coffee.

He came back with a cardboard sleeve from a film reel. Inside was a small blue fragment he had found beneath the refrigerator. It completed the rim, but it did nothing for the handle. Iris had already made several drawings of the missing shape. She showed him a version that would preserve the gap instead of pretending to fill it with matching ceramic.

Leon stood at the workbench for a long time. He told her that the cinema in his photograph looked wrong now. He remembered a narrower counter and a darker room. The picture was accurate, but it had failed to resemble the place he carried in his head. Perhaps, he said, making the cup look untouched would produce the same disappointment.

They put the drawings side by side. He chose the repair that could be seen from across the room.`,cue:'The slices become longer and the gaps less frequent. The same material begins to carry a recognizable phrase.'},
      {title:'The side facing the room.',text:`When Leon collected the cup, he did not reach for it immediately. He watched Iris turn it under the lamp. The seam crossed the bowl at an angle and widened near the place where a piece had been lost. The replacement shape did not hide the absence. It made the old handle’s curve readable without trying to pass for the original.

He asked for the biscuit tin back. Iris assumed he meant to carry the cup home inside it, but he had brought a new box for that. He wanted the tin for the fragments they had not used. She placed them in an envelope with her drawings. There were fewer than he expected. He had remembered almost a whole cup lying in pieces; the envelope looked much too small to contain the evidence of such a loud afternoon.

A month later, he sent another photograph. The cup stood on a shelf beside a cheap radio. Its seam faced the room. There were no flowers in it and no attempt to make it useful. Beneath the photograph he wrote that he had finally found his glasses. Iris started a reply about the repair, deleted it, and asked what was playing on the radio.`,cue:'Larger sections of the strike now survive intact. Pause to hold a smooth reconstruction of its harmonics.'}
    ]
  },
  library: {
    number:'17',category:'FICTION / MYSTERY & LANGUAGE',feeling:'Suspense',navTitle:'Lower rooms',navSubject:'a long reading',fictional:true,
    title:'The library<br><em>under the library.</em>',titleText:'Fiction: the library under the library',
    intro:'A night archivist follows an unexplained sound into rooms that no longer appear on the building’s plans.',
    publisher:'Undertone · Fiction',date:'Original long fiction',
    image:'./assets/images/library.svg',imageAlt:'An imagined underground archive with tall shelving, a staircase and light falling through a narrow doorway.',
    imageTag:'A LONG READING / VOICES WITHOUT WORDS',imageCredit:'Original illustration for Undertone',
    score:'./scores/library.strudel',scale:'E minor pentatonic',pitches:['E','G','A','B','D'],pitchClasses:[4,7,9,11,2],
    texture:'Vowel-shaped tones, stereo movement, echoes and a small reverberant room.',technique:'Formant filters, reverb and patterned stereo',
    method:'Vowel filters shape the synth into voice-like colors. Stereo placement shifts between attacks; a dedicated effects orbit adds reflections and echo without the lower voice replacing its settings.',
    scoreText:'An artificial voice almost speaks. Its reflections suggest rooms beyond the edge of the paragraph.',
    theory:'E minor pentatonic stays over E–B. More note positions support this longer reading. The vowel sequence changes by chapter, while delay and reverb suggest the archive’s depth. Upward scrolling retraces the phrase; pauses let the effects trail into a softer sustained saw-wave harmony, without inventing new words or notes.',
    learn:[{label:'Learn vowel filters, delay and reverb',url:'https://strudel.cc/learn/effects/'},{label:'Learn signals and patterned movement',url:'https://strudel.cc/learn/signals/'}],
    next:'mall',nextLabel:'After hours / mallsoft vaporwave',
    chapters:[
      {title:'The room behind the index.',text:`At eleven each night, Ada walked the public floors of the library with a ring of keys and a clipboard. She checked the windows, counted the chairs that had migrated between departments, and wrote down anything the morning staff would otherwise discover by sitting in it. Usually this meant a broken lamp. Once it had meant a sleeping clarinetist. The building was old enough to make noises that belonged to no one, and Ada had learned which ones required attention. Water in a pipe had urgency. Wood changing its mind about the weather did not.

The sound from the catalogue room was different. It was almost a voice, but without consonants: a low opening vowel that narrowed and vanished before she could decide whether it had come from the heating system. She switched off the room’s fans. The sound returned, thinner now, behind the cabinet that held the obsolete card index. Nobody used the index, but nobody had been willing to throw it away. Its drawers occupied a wall that the new digital floor plan showed as empty space.

Ada moved a wastebasket and found a handle near the floor. The handle opened a shallow service panel. Behind it was a stair, descending in the opposite direction from the basement she knew. She fetched a torch, left a note on the night desk, and checked the fire exit from the first landing before going farther. There was no particular bravery in this. She was responsible for a building, and the building had produced another part of itself.

The stair ended at a door with a brass label polished bright around its screws. The words on it had been removed. Ada could see the shadows of their shapes, which made the absence feel deliberate. Her oldest key fitted, although she could not remember what that key normally opened. Inside stood six reading desks, a row of shelves and a clock with no hands. Nothing was dusty. On the nearest desk lay a closed notebook beneath a stone that had been worn smooth by water.

The almost-voice came again. This time it seemed to move between the shelves. Ada followed it to a narrow opening and found a second room. Someone had stacked boxes beside the doorway, leaving enough space for one person to pass. Every box bore the same instruction: KEEP IN THE ORDER RECEIVED. None had an address or a date.

She returned to the first desk and opened the notebook. On its first page, in a hand she did not recognize, someone had written: The order is not chronological. Please stop trying to make it so.`,cue:'Rounded vowel colors appear in a repeating phrase. Their reflections open a space beyond the main sound.'},
      {title:'A catalogue of unfinished things.',text:`The next evening, Ada came early. In the staff archive she found three incompatible plans of the lower floors. One showed a boiler room where the reading desks stood. Another showed a corridor ending in a wall. The oldest plan was a survey drawn before the library opened, and its lower corner had been folded so often that an entire room was missing along the crease. She took copies rather than the originals and told the caretaker which entrance she intended to use. He said the building had always been larger on paper. When she showed him the handle, he became quiet and asked her to leave the door open.

The notebook contained lists, but they were not lists of books. One entry described the last sentence a woman had intended to put in a letter before deciding to visit instead. Another described directions to a shop that had closed while the speaker was halfway through giving them. A third recorded a lullaby remembered without its ending. Ada read each description twice. The entries were practical, almost dry. They mentioned where something had been received, whether it could be handled, and what to do if a visitor insisted that it belonged to them.

In the second room, the boxes held ordinary objects. A scarf. A cracked cassette case. A paper bag folded into a square. Each had a catalogue number that led back to a notebook entry. Ada lifted the cassette case and heard the narrow vowel from the previous night, followed by a small irregular tapping. She put it down. The sound stopped. She picked up the folded bag and heard something else: the audible space before a person begins to explain a mistake. It contained no words, but she recognized the effort. The room seemed to store things that speech had approached and then left unfinished.

At the far end stood an empty shelf with newer labels. Ada found a card bearing her own name. It described a question she had meant to ask her father during their last long drive together. She had forgotten the drive until the description restored the petrol station, the rain, and the unpleasant sweetness of the coffee. The card did not record the question. It recorded the fact that she had rehearsed it silently and let the turn for home arrive first. Under Handling Instructions someone had written: Do not supply the missing words.

She carried the card to the first room and set it beside the smooth stone. She was angry with the instruction, then grateful for it, then angry again. A library normally offered the reassurance that something had been kept. This one seemed to preserve the shape of what could no longer be recovered. She understood why a visitor might mistake that for an invitation to invent an answer.

Upstairs, the caretaker had made tea. He asked whether she had found a leak. Ada said no. He nodded with the relief of someone who understood exactly what kind of answer he had been given.`,cue:'The vowel shapes open further. Panning shifts with the score’s position; the echo stays in its own effects channel.'},
      {title:'The note for the next keeper.',text:`For a week, Ada tried to find the person who had written the notebook. The handwriting changed halfway through it, then changed again. Some entries had been made with a fountain pen, others with a blunt pencil, and the newest used the same cheap blue ink available at every desk upstairs. No one had signed a page. The work appeared to have passed between people who agreed that the records mattered more than the name of the person making them. Ada found this admirable until she needed someone to answer a question.

She began with the objects nearest the door. She repaired their boxes, copied fading labels and made a separate list of descriptions she could not understand. Sometimes the sounds were almost musical. A repeated breath seemed to contain several pitches without settling on any of them. A pause in a conversation had a rough edge that became smoother as she moved around it. She learned to stop handling an object when she caught herself trying to turn its sound into a story. The notebook’s warning was more useful than its author could have explained.

On Thursday, the caretaker came down with a woman from the binding department. They stood at the threshold while Ada showed them the reading desks. The woman noticed the stone and said her predecessor had kept one just like it on a windowsill. The caretaker recognized the clock. Neither claimed to understand the rooms, but both found work that could be done without understanding everything. The door caught on the floor. One shelf needed a brace. A damaged box could be replaced with a better one. By midnight, the place looked less like a secret and more like a department with inadequate funding.

Ada still visited the card with her name. Eventually she moved it back to its shelf. She did not decide that the unanswered question had been unimportant. She did not decide that silence was an answer. She had simply become able to stand in front of it without using the blank space to write something comforting. On her way out, she noticed that the shelf had room for another card, and then another. The archive had not finished receiving things merely because she had found it.

At the end of the month, Ada added a page to the notebook. She wrote where the spare key was kept, how to test the lights, and which stair tread moved if stepped on near the wall. Under these practical details she added a sentence for whoever came next: If you hear a voice, first listen for what it has not said. She considered crossing it out. It sounded too much like advice, and advice had a way of making a complicated room seem smaller than it was.

Instead, she left a space beneath it. Upstairs, the first readers were waiting at the doors. Ada returned the clipboard to its hook, counted the keys and let the morning staff in. When someone asked whether the night had been quiet, she said that nothing needed urgent attention.`,cue:'The voice-like colors return toward a closed vowel. Stop anywhere: the phrase rests while a gentler harmony remains.'}
    ]
  },
  mall: {
    number:'18',category:'FICTION / MALLSOFT VAPORWAVE',feeling:'Longing',navTitle:'After hours',navSubject:'vaporwave',fictional:true,
    playback:{mode:'groove',character:'vaporwave',bpm:72,gesture:true},
    title:'The escalator<br><em>remembers.</em>',titleText:'Fiction: the shopping mall after closing',
    intro:'One repair shop is still open in a mall whose future has already been sold.',
    publisher:'Undertone · Fiction',date:'Original fiction',
    image:'./assets/images/mall.svg',imageAlt:'An imagined empty shopping mall with a pink-lit escalator, tiled floor and a solitary blue storefront.',
    imageTag:'VAPORWAVE / AN EMPTY PUBLIC MEMORY',imageCredit:'Original illustration for Undertone',
    score:'./scores/mall.strudel',scale:'D major',pitches:['D','E','F♯','G','A','B','C♯'],pitchClasses:[2,4,6,7,9,11,1],
    texture:'Detuned major-nine pads and a muffled backbeat, with chimes played by scrolling.',technique:'Wide unison pads, extended chords and FM chimes',
    method:'Slightly detuned oscillators make a soft stereo pad. Major-seventh and ninth colors, slow pitch drift and filtered reflections turn the space into a hazy memory. Scrolling plays a separate, clearer FM chime line above this loop.',
    scoreText:'The empty mall suggests a public space whose cheerful music has outlived its purpose. The chords linger; the beat reaches you through the walls.',
    theory:'D-major and G-major-nine voicings share one D-major collection. Their sevenths and ninths retain their full color in a four-bar loop at 72 BPM. Scrolling plays a separate chime melody: down moves through its notes, up retraces them, and faster movement makes the line denser. A pause lets those notes ring out while the background passage keeps playing. New background passages enter on bar boundaries.',
    learn:[{label:'Learn synthesis and vibrato',url:'https://strudel.cc/learn/synths/'},{label:'Learn chords, stereo and reverb',url:'https://strudel.cc/learn/effects/'}],
    next:'vhs',nextLabel:'Room 409 / VHS vaporwave',
    chapters:[
      {title:'The doors close at six.',text:'At six, the shopping mall’s automatic doors locked out a woman who had come to collect a repaired watch. The security guard let her in through a side entrance. Beyond the glass, every shop was dark except the repair counter. The escalator still moved. An announcement promised special offers in a department that had been empty for three years.',cue:'Soft major-nine chords arrive with a little pitch drift, over a distant kick and snare.'},
      {title:'A place that kept its weather.',text:'The repairer was wrapping her watch in tissue. His lease ended on Friday, and the property company had already covered the directory with a picture of future apartments. She remembered coming here after school, spending nothing, staying until the lights changed. The palms were plastic then, too. Somehow she had forgotten that detail while remembering everything else.',cue:'The chord opens toward G major nine. Its stereo edges remain slightly out of focus.'},
      {title:'One more journey upward.',text:'She took the escalator to the upper floor although there was no reason to go there. Through the empty food court she could see the city’s new lights. Below, the guard waited beside the side entrance. The announcement began again. This time she stayed long enough to hear the silence that followed it.',cue:'The filter closes a little. Pause to stay inside this soft chord-and-beat loop; scrolling brings its upper melody closer.'}
    ]
  },
  vhs: {
    number:'19',category:'FICTION / VHS VAPORWAVE',feeling:'Haze',navTitle:'Room 409',navSubject:'vaporwave',fictional:true,
    playback:{mode:'groove',character:'vaporwave',bpm:68,gesture:true},
    title:'Play it again.<br><em>A little slower.</em>',titleText:'Fiction: the hotel on an old videotape',
    intro:'A home video preserves a holiday hotel more clearly than the people who stayed there.',
    publisher:'Undertone · Fiction',date:'Original fiction',
    image:'./assets/images/vhs.svg',imageAlt:'An imagined old television showing a turquoise swimming pool, a sunset and the number 409.',
    imageTag:'VAPORWAVE / A MEMORY AT HALF SPEED',imageCredit:'Original illustration for Undertone',
    score:'./scores/vhs.strudel',scale:'C major',pitches:['C','D','E','F','G','A','B'],pitchClasses:[0,2,4,5,7,9,11],
    texture:'An original electric-key chord at half speed, tape-like drift and softened drums.',technique:'Slowed chord sampling and filtered echoes',
    method:'An original major-nine chord recording plays at half speed, lowering it an octave. Small pitch movement, dark echoes and a sparse backbeat make the repeated material feel worn and distant.',
    scoreText:'The soundtrack behaves like a recording revisited too many times: recognizable, warm, and slightly less certain with every return.',
    theory:'The sample supplies a major-nine shape on C and F; both fit C major. Half-speed playback changes the octave while retaining those pitch classes. At 68 BPM, the current four-bar recording loop continues during a pause. Scrolling plays a high, plucked answer on its own responsive pulse; reading back retraces that line. Faster movement adds more lead notes and a restrained hat fill, while the underlying beat stays steady.',
    learn:[{label:'Learn sample playback speed',url:'https://strudel.cc/learn/samples/#speed'},{label:'Learn vibrato and effects',url:'https://strudel.cc/learn/effects/'}],
    next:'courier',nextLabel:'Last delivery / acid electro',
    chapters:[
      {title:'The label says August.',text:`The videotape had no year on its label, only August and a room number. The player took a moment to decide whether it still understood the cassette. Then a swimming pool appeared: impossibly blue, with white chairs lined around it and nobody in the water. Someone behind the camera said that breakfast ended at ten. The camera did not turn toward the speaker.

Nina recognized the hotel before she recognized the holiday. Its corridor had a carpet patterned with little suns. She remembered trying to step only on the yellow ones, which had made every journey to the lift unnecessarily complicated.`,cue:'A recorded major-nine chord plays one octave slower, with its bright edges filtered away.'},
      {title:'A room becomes a recording.',text:`The next scene was the balcony of room 409. A towel moved in the wind. Far below, a waiter carried glasses across a terrace that now looked much smaller than it had seemed from the railing. Nina stopped the tape and searched for the hotel. The building still existed, but its pool had become a terrace for offices. The pictures were sharp, professionally lit, and almost useless to her.

She returned to the cassette. At the edge of the frame, a hand held a peach over a plate. She knew whose hand it was. The camera moved before the person could appear.`,cue:'The chord moves to F. Soft reflections blur its ending into the next attack.'},
      {title:'Leave a little before the ending.',text:`The final few minutes showed the road home through a windscreen. It was dark, and the camera had struggled to focus on the headlights. Somebody was asleep on the back seat. Somebody else had started telling a story that would be recorded over before its ending.

Nina rewound to the pool. This time she noticed the cleaning trolley behind the chairs and a bird on the roof of the bar. She let the scene run without looking for the people outside the frame. When the voice mentioned breakfast, she answered, softly, that there was still plenty of time.`,cue:'The sample darkens again. Pause to keep the tape loop running; scroll to reveal the high answering line.'}
    ]
  },
  courier: {
    number:'20',category:'FICTION / ACID ELECTRO',feeling:'Urgency',navTitle:'Last delivery',navSubject:'acid electro',fictional:true,
    playback:{mode:'groove',character:'electronic',bpm:116,gesture:true},
    title:'One address.<br><em>Before sunrise.</em>',titleText:'Fiction: the courier’s last delivery',
    intro:'A bicycle courier crosses a nearly empty city with a parcel that refuses to look urgent.',
    publisher:'Undertone · Fiction',date:'Original short fiction',
    image:'./assets/images/courier.svg',imageAlt:'An imagined night city of blue towers, wet streets and a bright bicycle route crossing between buildings.',
    imageTag:'ACID ELECTRO / THE CITY AS A CIRCUIT',imageCredit:'Original illustration for Undertone',
    score:'./scores/courier.strudel',scale:'D Dorian',pitches:['D','E','F','G','A','B','C'],pitchClasses:[2,4,5,7,9,11,0],
    texture:'Syncopated kicks, a squelching bass line and short metallic accents.',technique:'Acid filter envelopes and broken drum patterns',
    method:'A saturated bass line moves through a resonant low-pass envelope. Syncopated kicks and a snare backbeat make a broken groove; short FM accents cut across it.',
    scoreText:'The line ducks into side streets and returns to the same destination. A steady beat carries the journey while your scroll changes its energy.',
    theory:'D Dorian and a D-centered bass keep each four-bar passage related. The broken beat continues at 116 BPM during a reading pause. Scrolling plays a separate metallic FM line, moving forward or back through its notes with your hand. Faster movement adds more notes and a few grid-aligned hats. A pause lets the foreground ring out; background passages change at bar boundaries.',
    learn:[{label:'Learn resonant filters and envelopes',url:'https://strudel.cc/learn/effects/'},{label:'Learn rhythmic mini-notation',url:'https://strudel.cc/learn/mini-notation/'}],
    next:'space',nextLabel:'Wonder / the cosmos',
    chapters:[
      {title:'A parcel with no explanation.',text:'The parcel was light enough to feel empty. Its label gave a tower, a floor and a name, with BEFORE SUNRISE written beneath them. Jo took the job because it was on the way home. Half an hour later, the city’s temporary road closures had made that description meaningless.',cue:'The kick pattern leaves gaps for a resonant bass phrase and the snare’s reply.'},
      {title:'The city changes the route.',text:'She followed the signed diversion, then the route suggested by a cleaner outside an all-night café. The tower appeared and disappeared between other buildings. A delivery van waited beside the wrong entrance. Her phone had enough battery to tell her that the customer was still watching the map.',cue:'The filter envelope becomes deeper. Metallic FM accents flash above the broken beat.'},
      {title:'The smallest possible ending.',text:'On the twenty-first floor, a man opened the door before she knocked. Inside the parcel was a soft toy with one ear repaired. He thanked her quietly and carried it toward a room where a small light was still on. Jo took the lift down. The sky was beginning to change.',cue:'The phrase returns toward D. Pause to repeat this groove; the metallic accents recede while the bass and drums carry on.'}
    ]
  }
};

export function readingWordCount(story) {
  return story.chapters.reduce((total, chapter) => total + chapter.text.trim().split(/\s+/u).length, 0);
}
