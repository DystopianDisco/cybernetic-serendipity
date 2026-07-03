// ───────────────────────────────────────────────────────────
//  ORDER ⇄ DISORDER  ·  audio-reactive   ·  v4 "fluid + independent"
//  • Top holds PRISTINE order; chaos pools at the bottom (steep curve).
//  • Every box has its OWN life — own drift, own spin dir/speed.
//  • Motion FLOWS: each box advances along its own path at a rate the
//    music sets, so the bottom never makes the same shape twice.
//  • Colour PRESENCE tracks loudness (quiet → empties out).
//  • Colour SWITCHES on detected beats/onsets — a response, not flicker.
//
//  ▶ Pick a track with the file button (top-left), or set AUDIO_FILE.
//  RUN:  cd ~/generative/sound-app && python3 -m http.server 8000
//        → http://localhost:8000   (D = hide meter · S = save · F = fullscreen)
// ───────────────────────────────────────────────────────────

let AUDIO_FILE = '';     // no default sound — silent until you upload a track

let COLS=12, ROWS=22, CELL=32, MARGIN=200;
let SENS = 10;            // input boost
let DISORDER_MAX = 7;     // peak chaos on the busiest parts
let DISORDER = 0;         // live (energy drives it)
let showMeter = true;

let PALETTE = ['#E2D248','#57A8A3','#DE9D45','#342372','#264C92',
               '#509EDE','#D53075','#D13531','#B2644E','#D36292'];

let src, amp, fft, peak, energy = 0, started = false;
let epoch = 0;            // bumps on each beat → colours switch ON the music
let npos = [], spinPos = [];   // per-box FLOW accumulators (give motion memory)

// ── press R: cubes assemble into a walking robot (a nod to Paik's Robot K-456 in CS '68) ──
let robotMode = false, robotMix = 0, walkPhase = 0, robotCells = [];
const ROBOT = [
  "..X......X..",
  "..X......X..",
  "...XXXXXX...",
  "..XXXXXXXX..",
  "..X.XXXX.X..",
  "..XXXXXXXX..",
  "..X.X..X.X..",
  "..XXXXXXXX..",
  "...XXXXXX...",
  "....XXXX....",
  ".XXXXXXXXXX.",
  "X.XXXXXXXX.X",
  "X.XXXXXXXX.X",
  "X.XXXXXXXX.X",
  "..XXXXXXXX..",
  "...XX..XX...",
  "..XX....XX..",
  "..XX....XX..",
  ".XXX....XXX.",
];

function preload(){ if (AUDIO_FILE) src = loadSound(AUDIO_FILE); }

function setup(){
  createCanvas(COLS*CELL+MARGIN*2, ROWS*CELL+MARGIN*2);
  amp  = new p5.Amplitude();
  fft  = new p5.FFT(0.85, 64);
  peak = new p5.PeakDetect(20, 8000, 0.4);

  for (let i=0; i<COLS*ROWS; i++){ npos[i] = i*3.7; spinPos[i] = 0; }   // varied start phases

  // build robot target cells from the bitmap, centred on the canvas
  let rw = ROBOT[0].length, rh = ROBOT.length;
  let rsx = width/2 - rw*CELL/2 + CELL/2;
  let rsy = height/2 - rh*CELL/2 + CELL/2;
  for (let row=0; row<rh; row++) for (let col=0; col<rw; col++){
    if (ROBOT[row][col] === 'X'){
      let part = 'body';
      if (row >= 15)                          part = col < 6 ? 'legL' : 'legR';
      else if ((col<=1 || col>=10) && row>=10 && row<=13) part = col < 6 ? 'armL' : 'armR';
      robotCells.push({ x: rsx + col*CELL, y: rsy + row*CELL, part: part });
    }
  }

  let fi = createFileInput(gotFile);
  fi.position(18, 18);
  fi.attribute('accept', 'audio/*');
}

function gotFile(file){
  if (file.type === 'audio'){
    userStartAudio();
    if (src && src.stop) try { src.stop(); } catch(e){}
    loadSound(file.data, function(snd){
      src = snd; amp.setInput(src); fft.setInput(src); src.loop(); started = true;
    });
  }
}
function startAudio(){
  userStartAudio();
  if (AUDIO_FILE){ src.loop(); } else { src.start(); }
  amp.setInput(src); fft.setInput(src); started = true;
}
function mousePressed(){ /* no click-to-play: audio only starts when a file is uploaded */ }

function draw(){
  background(248);

  // ── listen (only once a track is loaded — no default sound) ──
  let beatNow = false, treble = 0;
  if (started){
    fft.analyze();
    peak.update(fft);
    if (peak.isDetected){ epoch++; beatNow = true; }   // onset → colours switch
    let level = amp.getLevel();
    treble = fft.getEnergy('treble') / 255;
    energy = lerp(energy, constrain(level * SENS, 0, 1), 0.16);
  } else {
    energy = lerp(energy, 0, 0.1);                      // no audio yet → settle into a clean grid
  }
  // THE ORDER↔CHAOS LINE — sweeps DOWN (more chaos) when loud, UP (more order) when quiet.
  // Everything ABOVE the line is perfect grid; below it, boxes break down. As the track
  // calms, the line rises and boxes REASSEMBLE from the top of the chaos zone downward.
  let chaosFront = map(energy, 0, 1, 0.90, 0.04);
  DISORDER = (1 - chaosFront) * DISORDER_MAX * (0.35 + energy);   // peak chaos (for the meter)

  // robot morph + walk cycle
  robotMix = lerp(robotMix, robotMode ? 1 : 0, 0.06);
  if (robotMix > 0.01) walkPhase += 0.05 + energy*0.13;   // robot walks faster when the music's busy

  strokeWeight(1.4);
  for(let r=0; r<ROWS; r++){
    let t = r/(ROWS-1);
    let chaos = max(0, t - chaosFront) * DISORDER_MAX * (0.35 + energy);  // 0 ABOVE the line = perfect order → reassembles there
    for(let c=0; c<COLS; c++){
      let i = r*COLS + c;
      let x = MARGIN + c*CELL + CELL/2;
      let y = MARGIN + r*CELL + CELL/2;

      // stable personality per box
      randomSeed(i*2749 + 13);
      let ph      = random(1000);
      let wob     = random(0.4, 1.3);
      let spinDir = random() < 0.5 ? -1 : 1;
      let spinSpd = random(0.5, 1.5);
      let pick    = random();

      // ── FLOW: advance each box along its own path, faster when louder ──
      // (position depends on history → the bottom never repeats the same shape)
      npos[i]    += (0.004 + energy*0.05) * wob;
      spinPos[i] += spinDir * (0.004 + energy*0.06) * spinSpd * min(chaos, 3);
      if (beatNow) npos[i] += 0.12 + 0.25*pick;       // a kick on the hit

      let ox=0, oy=0, rot=0;
      if (chaos > 0.015){
        ox = (noise(ph,        npos[i]) - 0.5) * 2 * chaos * CELL * 0.85;
        oy = (noise(ph + 57.3, npos[i]) - 0.5) * 2 * chaos * CELL * 0.6
           +  chaos * CELL * 0.5;                      // gravity → tumble down
        rot = spinPos[i];
      } else {
        spinPos[i] *= 0.94;                            // ease back to grid-aligned when calm
        rot = spinPos[i];
      }

      // ── robot target (when R is pressed) ──
      let flowX = x + ox, flowY = y + oy, flowRot = rot;
      let robX, robY, robRot = 0;
      if (i < robotCells.length){
        let cell = robotCells[i];
        let wx = 0, wy = 0;
        let lift = 12 + energy*12, stride = 7 + energy*6;   // steps higher/wider when louder
        if (cell.part === 'legL'){ wy = -max(0, sin(walkPhase))   * lift; wx = sin(walkPhase)    * stride; }
        else if (cell.part === 'legR'){ wy = -max(0, sin(walkPhase+PI)) * lift; wx = sin(walkPhase+PI) * stride; }
        else if (cell.part === 'armL'){ robRot = sin(walkPhase+PI) * (0.4 + energy*0.4); }
        else if (cell.part === 'armR'){ robRot = sin(walkPhase)    * (0.4 + energy*0.4); }
        wy += -abs(sin(walkPhase)) * (4 + energy*9);            // body bob — bounces harder when loud
        robX = cell.x + wx; robY = cell.y + wy;
      } else {
        robX = ((i*61) % (width-80)) + 40; robY = height + 90;   // extras walk off the bottom
      }

      let drawX = lerp(flowX, robX, robotMix);
      let drawY = lerp(flowY, robY, robotMix);
      let drawRot = lerp(flowRot, robRot, robotMix);

      // colour PRESENCE tracks loudness; HUE switches on beats — for BOTH the grid and the robot
      let flowPColour  = constrain(pow(t,1.5) * energy * 1.9 + treble*0.18, 0, 1);
      let robotPColour = constrain(0.5 + energy*0.55 + treble*0.25 + (beatNow?0.2:0), 0, 1); // robot stays readable but PULSES
      let pColour = lerp(flowPColour, robotPColour, robotMix);
      randomSeed(i*9176 + epoch*131 + 7);
      let colIdx = floor(random(PALETTE.length));
      if (pick < pColour) fill(PALETTE[colIdx]);
      else                noFill();
      stroke(20);

      push();
      translate(drawX, drawY);
      rotate(drawRot);
      rectMode(CENTER);
      rect(0,0, CELL*0.86, CELL*0.86);
      pop();
    }
  }

  if (!started){
    fill(40); noStroke(); textAlign(CENTER, TOP); textSize(15);
    text('▲ choose an audio file (top-left) to begin    ·    press  R  for the robot', width/2, 22);
  }

  if (showMeter && started){
    noStroke();
    fill(30); textAlign(LEFT,TOP); textSize(13);
    text('energy '+energy.toFixed(2)+'   DISORDER '+DISORDER.toFixed(1)+(beatNow?'   ● beat':''), 16, 52);
    fill(220); rect(16, 72, 180, 10);
    fill('#D53075'); rect(16, 72, 180*constrain(energy,0,1), 10);
  }
}

function keyPressed(){
  if(key==='s'||key==='S') saveCanvas('order-disorder-sound','png');
  if(key==='f'||key==='F') fullscreen(!fullscreen());
  if(key==='d'||key==='D') showMeter = !showMeter;
  if(key==='r'||key==='R') robotMode = !robotMode;     // assemble / dissolve the walking robot
}
