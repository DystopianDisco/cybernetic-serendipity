// ───────────────────────────────────────────────────────────
//  SCHOTTER, CONDUCTED  ·  the elegant destruction
//
//  Georg Nees "Schotter" (1968): black outline squares, pristine top, disorder
//  dissolving straight down. This is the resting truth, and the piece mostly
//  holds it — calm, ordered, breathing.
//
//  The art is the DESTRUCTION of that order, and it is RESERVED for the music's
//  significant moments. A "surge" spikes only on strong onsets / swells; it
//  sends a graceful wave of dissolution through the squares (flow-field tumble),
//  then decays and the field REFORMS to Schotter. Restraint between events is
//  the point — nuance, not spectacle. Colour is a rare, single accent, never a
//  light show. Motion is physical (Nature of Code): flow-field + spring to order.
//
//  Upload any audio (top-left). Keys: F fullscreen · S save · D meter · R …
// ───────────────────────────────────────────────────────────

let AUDIO_FILE = '';

let COLS = 12, ROWS = 22, CELL = 32, MARGIN = 200;
let SEED = 201;
let MAXA = 1.2;          // peak rotation at the bottom — disorder is rotation-led
let MAXS = 0.5;          // restrained displacement — squares hold their lanes
let SENS = 10;
let PHRASE = 6.0;        // texture of the destruction changes every phrase

let PALETTE = ['#E2D248','#57A8A3','#DE9D45','#342372','#264C92',
               '#509EDE','#D53075','#D13531','#B2644E','#D36292'];

let src, amp, fft, peak;
let started = false, energy = 0, surge = 0, avgE = 0, showMeter = false;
let epoch = 0;
let REST = [], LIVE = [];
let conductor = { movement: 'descent' };

// the viewer shapes the piece — unlabeled, open-ended (GRAV: the spectator co-creates).
// each handle is a little Nees square you drag; what it does is for you to discover.
let CONTROLS = [], dragging = -1;

function ss(x){ return x * x * (3 - 2 * x); }

// ═══════════════════════════════════════════════════════════
//  GROUND STATE — an exact Schotter (deterministic, static)
// ═══════════════════════════════════════════════════════════
function buildSchotter(){
  REST = []; LIVE = [];
  for (let r = 0; r < ROWS; r++){
    for (let c = 0; c < COLS; c++){
      randomSeed((r * COLS + c) * 2 + SEED);
      let d = pow(r / (ROWS - 1), 1.35);
      let cell = {
        rot: d * random(-1, 1) * MAXA,
        dx:  d * random(-1, 1) * CELL * MAXS,
        dy:  d * random(-1, 1) * CELL * MAXS,
        phase: random(TWO_PI),
        hue:   floor(random(PALETTE.length)),
      };
      REST.push(cell);
      LIVE.push({ dx: cell.dx, dy: cell.dy, rot: cell.rot, omega: 0, col: 0 });
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  MOVEMENTS — textures of the destruction. All gated by ctx.surge, so they
//  do nothing until a significant musical moment. Return {dx,dy,omega,pColour};
//  geometry eases toward it and a spring reforms Schotter as the surge decays.
// ═══════════════════════════════════════════════════════════
const MOVEMENTS = {

  // DESCENT — a graceful flow-field dissolution; the bottom lets go first.
  descent(cell, c, r, ctx){
    let rowT = r / (ROWS - 1);
    let m = ss(constrain(ctx.surge * (0.5 + rowT * ctx.reach), 0, 1));
    let T = ctx.clock;
    let ang = noise(c * 0.16, r * 0.16, T * 0.15) * TAU * 2;
    let mag = m * CELL * 0.7 * ctx.intensity;
    return {
      dx: cell.dx + cos(ang) * mag,
      dy: cell.dy + sin(ang) * mag * 0.7 + m * rowT * CELL * 0.35 * ctx.intensity,
      omega: (noise(c * 0.25 + 9, r * 0.25, T * 0.2) - 0.5) * m * 0.45 * ctx.intensity,
      pColour: constrain(m * ctx.col, 0, 1),
    };
  },

  // SPIN WAVE — the dissolution reads as a single turning wave across the field.
  spinWave(cell, c, r, ctx){
    let rowT = r / (ROWS - 1);
    let m = ss(constrain(ctx.surge * (0.5 + rowT * ctx.reach * 0.7), 0, 1));
    let phase = c * 0.4 + r * 0.5 - ctx.clock * 1.1;
    return { dx: cell.dx, dy: cell.dy, omega: sin(phase) * m * 0.22 * ctx.intensity, pColour: constrain(m * ctx.col * 0.8, 0, 1) };
  },

  settle(cell){ return { dx: cell.dx, dy: cell.dy, omega: 0, pColour: 0 }; },
};

// two textures, alternating slowly — variety without spectacle
const SEQ = ['descent', 'descent', 'spinWave', 'descent'];
function pickMovement(clock){ return SEQ[floor(clock / PHRASE) % SEQ.length]; }

// ═══════════════════════════════════════════════════════════
//  ROBOT — easter egg (press R).
// ═══════════════════════════════════════════════════════════
let robotMode = false, robotMix = 0, walkPhase = 0, robotCells = [];
const ROBOT = [
  "..X......X..","..X......X..","...XXXXXX...","..XXXXXXXX..","..X.XXXX.X..",
  "..XXXXXXXX..","..X.X..X.X..","..XXXXXXXX..","...XXXXXX...","....XXXX....",
  ".XXXXXXXXXX.","X.XXXXXXXX.X","X.XXXXXXXX.X","X.XXXXXXXX.X","..XXXXXXXX..",
  "...XX..XX...","..XX....XX..","..XX....XX..",".XXX....XXX.",
];

function preload(){ if (AUDIO_FILE) src = loadSound(AUDIO_FILE); }

function setup(){
  createCanvas(COLS * CELL + MARGIN * 2, ROWS * CELL + MARGIN * 2);
  amp  = new p5.Amplitude();
  fft  = new p5.FFT(0.85, 64);
  peak = new p5.PeakDetect(20, 8000, 0.35);
  buildSchotter();

  let rw = ROBOT[0].length, rh = ROBOT.length;
  let rsx = width/2 - rw*CELL/2 + CELL/2, rsy = height/2 - rh*CELL/2 + CELL/2;
  for (let row = 0; row < rh; row++) for (let col = 0; col < rw; col++){
    if (ROBOT[row][col] === 'X'){
      let part = 'body';
      if (row >= 15)                                      part = col < 6 ? 'legL' : 'legR';
      else if ((col<=1 || col>=10) && row>=10 && row<=13) part = col < 6 ? 'armL' : 'armR';
      robotCells.push({ x: rsx + col*CELL, y: rsy + row*CELL, part });
    }
  }

  if (AUDIO_FILE && src){ amp.setInput(src); fft.setInput(src); }
  let fi = createFileInput(gotFile);
  fi.position(18, 18);
  fi.attribute('accept', 'audio/*');

  // permanent, unlabeled controls — the viewer's instrument
  let cx = width - MARGIN + 44, cw = MARGIN - 90;   // clean right-margin white space
  CONTROLS = [
    { x: cx, y: height/2 - 96, w: cw, val: 0.34 },
    { x: cx, y: height/2 - 32, w: cw, val: 0.64 },
    { x: cx, y: height/2 + 32, w: cw, val: 0.50 },
    { x: cx, y: height/2 + 96, w: cw, val: 0.46 },
  ];
}

function gotFile(file){
  if (file.type === 'audio'){
    userStartAudio();
    if (src && src.stop) try { src.stop(); } catch(e){}
    loadSound(file.data, snd => {
      src = snd; amp.setInput(src); fft.setInput(src); src.loop(); started = true;
    });
  }
}
function mousePressed(){
  for (let i = 0; i < CONTROLS.length; i++){
    let ct = CONTROLS[i];
    if (mouseX > ct.x - 10 && mouseX < ct.x + ct.w + 10 && abs(mouseY - ct.y) < 12){
      ct.val = constrain((mouseX - ct.x) / ct.w, 0, 1);
      dragging = i; return;
    }
  }
}
function mouseDragged(){ if (dragging >= 0){ let ct = CONTROLS[dragging]; ct.val = constrain((mouseX - ct.x) / ct.w, 0, 1); } }
function mouseReleased(){ dragging = -1; }

function draw(){
  background(248);

  // live tuning values (defaults when sliders absent)
  let tCol   = CONTROLS[0] ? CONTROLS[0].val : 0.34;
  let tSens  = CONTROLS[1] ? lerp(0.75, 0.25, CONTROLS[1].val) : 0.45;
  let tInt   = CONTROLS[2] ? CONTROLS[2].val * 2 : 1.0;
  let tReach = CONTROLS[3] ? lerp(0.3, 2.5, CONTROLS[3].val) : 1.3;

  // ── read the music ──
  let beatNow = false, treble = 0;
  if (started){
    fft.analyze(); peak.update(fft);
    if (peak.isDetected){ epoch++; beatNow = true; }
    treble = fft.getEnergy('treble') / 255;
    energy = lerp(energy, constrain(amp.getLevel() * SENS, 0, 1), 0.16);
  } else {
    energy = lerp(energy, 0, 0.1);
  }

  // ── SURGE: destruction is reserved for significant musical moments ──
  // Fires only on a strong onset that stands out from the recent texture (avgE),
  // and not again until the last dissolve has faded (surge < 0.35 cooldown). The
  // dissolve lingers then reforms. Tune sensitivity via the two thresholds below.
  avgE = lerp(avgE, energy, 0.02);
  if (started && beatNow && energy > tSens && energy > avgE * 1.7 && surge < 0.35){
    surge = constrain((energy - avgE) * 2.2, 0.5, 1);
  }
  let idle = 0.10 + 0.07 * sin(frameCount * 0.009);            // gentle autonomous life — always playable
  let floorSurge = constrain((energy - 0.72) * 1.4, 0, 0.4);   // genuine swells sustain motion
  surge = max(surge * 0.955, max(floorSurge, idle));
  if (!started) avgE = 0;

  let clock = (started && src && src.currentTime) ? src.currentTime() * 0.6 : 0;
  let ctx = { energy, surge, treble, beatNow, clock, epoch, col: tCol, reach: tReach, intensity: tInt };

  conductor.movement = pickMovement(clock);
  let move = MOVEMENTS[conductor.movement] || MOVEMENTS.settle;
  let restore = 0.045 * (1 - constrain(surge, 0, 1)) + 0.01;   // spring reforms Schotter as surge fades

  // one evolving accent colour, used sparingly
  let dom = PALETTE[floor((clock + 3) / (PHRASE * 2)) % PALETTE.length];

  robotMix = lerp(robotMix, robotMode ? 1 : 0, 0.06);
  if (robotMix > 0.01) walkPhase += 0.05 + energy * 0.13;

  stroke(20); strokeWeight(1.3); rectMode(CENTER);
  for (let r = 0; r < ROWS; r++){
    for (let c = 0; c < COLS; c++){
      let i = r * COLS + c;
      let cell = REST[i], L = LIVE[i];
      let x = MARGIN + c * CELL + CELL/2;
      let y = MARGIN + r * CELL + CELL/2;

      let tgt = move(cell, c, r, ctx);

      // ── PHYSICS: ease toward target, spin by omega, spring back to order ──
      L.dx = lerp(L.dx, tgt.dx, 0.09);
      L.dy = lerp(L.dy, tgt.dy, 0.09);
      L.omega = lerp(L.omega, tgt.omega, 0.06);
      L.rot += L.omega;
      L.rot = lerp(L.rot, cell.rot, restore);
      L.col = lerp(L.col, tgt.pColour, 0.10);

      // ── BREATHE (whisper) ──
      let rowT = r / (ROWS - 1);
      let bAmt = pow(rowT, 1.35) + 0.04;
      let gb   = 1 + 0.035 * sin(frameCount * 0.021);
      let bRot = bAmt * 0.022 * sin(frameCount * 0.016 + cell.phase);
      let bx   = bAmt * CELL * 0.022 * sin(frameCount * 0.013 + cell.phase * 1.3);
      let by   = bAmt * CELL * 0.022 * cos(frameCount * 0.011 + cell.phase);

      let px = x + L.dx * gb + bx, py = y + L.dy * gb + by, prot = L.rot * gb + bRot;

      // ── colour: a sparse single accent, tied to how far this square has broken ──
      let filled = false, fc = dom;
      randomSeed(i * 9176 + epoch * 131 + 7);
      if (random() < L.col) filled = true;

      // ── robot overlay (easter egg) ──
      if (robotMix > 0.001){
        let robX, robY, robRot = 0;
        if (i < robotCells.length){
          let rc = robotCells[i], wx = 0, wy = 0, lift = 12 + energy*12, stride = 7 + energy*6;
          if      (rc.part==='legL'){ wy=-max(0,sin(walkPhase))   *lift; wx=sin(walkPhase)   *stride; }
          else if (rc.part==='legR'){ wy=-max(0,sin(walkPhase+PI))*lift; wx=sin(walkPhase+PI)*stride; }
          else if (rc.part==='armL'){ robRot=sin(walkPhase+PI)*(0.4+energy*0.4); }
          else if (rc.part==='armR'){ robRot=sin(walkPhase)   *(0.4+energy*0.4); }
          wy += -abs(sin(walkPhase))*(4+energy*9);
          robX = rc.x+wx; robY = rc.y+wy;
        } else { robX = ((i*61) % (width-80)) + 40; robY = height + 90; }
        px = lerp(px, robX, robotMix); py = lerp(py, robY, robotMix); prot = lerp(prot, robRot, robotMix);
        if (robotMix > 0.5){ filled = true; fc = PALETTE[cell.hue]; }
      }

      if (filled) fill(fc); else noFill();
      push(); translate(px, py); rotate(prot); rect(0, 0, CELL*0.86, CELL*0.86); pop();
    }
  }

  if (!started){
    fill(40); noStroke(); textAlign(CENTER, TOP); textSize(15);
    text('Georg Nees · Schotter (1968)      ▲ upload a track (top-left) to conduct it', width/2, 22);
  }
  if (showMeter && started){
    noStroke(); rectMode(CORNER); fill(30); textAlign(LEFT, TOP); textSize(13);
    text('energy '+energy.toFixed(2)+'   surge '+surge.toFixed(2)+'   '+conductor.movement, 16, 52);
    fill(220); rect(16, 72, 180, 10); fill('#D53075'); rect(16, 72, 180*constrain(surge,0,1), 10);
  }
  drawControls();
}

// unlabeled controls — thin line, a small square handle to drag. Part of the piece.
function drawControls(){
  rectMode(CENTER);
  for (let ct of CONTROLS){
    stroke(20); strokeWeight(1); noFill();
    line(ct.x, ct.y, ct.x + ct.w, ct.y);
    let hx = ct.x + ct.val * ct.w;
    fill(248); stroke(20); strokeWeight(1.4);
    push(); translate(hx, ct.y); rect(0, 0, 13, 13); pop();
  }
}

function keyPressed(){
  if (key==='s'||key==='S') saveCanvas('schotter-conducted','png');
  if (key==='f'||key==='F') fullscreen(!fullscreen());
  if (key==='d'||key==='D') showMeter = !showMeter;
  if (key==='r'||key==='R') robotMode = !robotMode;
}
