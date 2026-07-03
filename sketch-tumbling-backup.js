// ───────────────────────────────────────────────────────────
//  ORDER ⇄ DISORDER  ·  driven by SOUND   ·  local app
//  Quiet → grid assembles. Loud → squares scatter & colour floods.
//  Smoothed, so it falls apart and REASSEMBLES with the music.
//
//  ▶ BEST: use your own track. Drop an mp3 in this folder and set:
//        AUDIO_FILE = 'yourtrack.mp3';
//     (a loaded file = strong guaranteed signal; the mic is finicky)
//  ▶ MIC MODE: leave AUDIO_FILE = ''  and play music OUT LOUD.
//
//  The little meter (top-left) shows what it's hearing. If it stays
//  near 0, no sound is getting in — switch to a track or play louder.
//
//  RUN:  cd ~/generative/sound-app && python3 -m http.server 8000
//        → http://localhost:8000  → click once.   (press D = hide meter)
// ───────────────────────────────────────────────────────────

let AUDIO_FILE = 'track.wav';   // your Inferno track

let COLS=12, ROWS=22, CELL=32, MARGIN=200;
let ROT_MAX=1.1, JIT_MAX=0.6, SEED=201;
let SENS = 10;           // input boost. Raise if the track is quiet, lower if it over-scatters.
let DISORDER_MAX = 7;    // peak chaos on the busiest parts (your nees-final look) — try 5.3–8
let DISORDER = 0;        // live value (energy drives it 0 → DISORDER_MAX)
let showMeter = true;

let PALETTE = ['#E2D248','#57A8A3','#DE9D45','#342372','#264C92',
               '#509EDE','#D53075','#D13531','#B2644E','#D36292'];

let src, amp, fft, energy = 0, started = false;

function preload(){ if (AUDIO_FILE) src = loadSound(AUDIO_FILE); }

function setup(){
  createCanvas(COLS*CELL+MARGIN*2, ROWS*CELL+MARGIN*2);
  amp = new p5.Amplitude();
  fft = new p5.FFT(0.85, 64);
  if (!AUDIO_FILE) src = new p5.AudioIn();

  // ── drop-in file picker (upload any track from the browser) ──
  let fi = createFileInput(gotFile);
  fi.position(18, 18);
  fi.attribute('accept', 'audio/*');
}

// load a track the user picks — overrides whatever's playing
function gotFile(file){
  if (file.type === 'audio'){
    userStartAudio();
    if (src && src.stop) try { src.stop(); } catch(e){}
    loadSound(file.data, function(snd){
      src = snd;
      amp.setInput(src);
      fft.setInput(src);
      src.loop();
      started = true;
    });
  }
}

function startAudio(){
  userStartAudio();
  if (AUDIO_FILE){ src.loop(); }
  else { src.start(); }
  amp.setInput(src);
  fft.setInput(src);
  started = true;
}
function mousePressed(){ if(!started) startAudio(); }

function draw(){
  background(248);
  if(!started){
    fill(20); noStroke(); textAlign(CENTER,CENTER); textSize(16);
    text(AUDIO_FILE ? 'click to play '+AUDIO_FILE : 'click to start the mic (then play music OUT LOUD)', width/2, height/2);
    return;
  }

  fft.analyze();
  let level  = amp.getLevel();
  let bass   = fft.getEnergy('bass')   / 255;
  let treble = fft.getEnergy('treble') / 255;
  let target = constrain(level * SENS, 0, 1);
  energy = lerp(energy, target, 0.16);          // smooth → scatter then REASSEMBLE

  DISORDER = 0.1 + energy * DISORDER_MAX;        // ← music drives the dial: silence→0.1, busy→~7

  let T = frameCount * 0.012;        // animation clock — makes the chaos EVOLVE, not just scale
  randomSeed(SEED);                  // stable per-square phase + colour pick
  strokeWeight(1.4);
  for(let r=0; r<ROWS; r++){
    let t = r/(ROWS-1);
    let chaos   = t*t * DISORDER;                 // 0 in order → up to ~7 in busy chaos
    let pColour = constrain(0.02 + chaos + treble*0.3, 0, 1);
    for(let c=0; c<COLS; c++){
      let x = MARGIN + c*CELL + CELL/2;
      let y = MARGIN + r*CELL + CELL/2;
      let phase = random(TWO_PI);                 // desync each square
      let pick  = random();

      // ── animated wander (Perlin noise evolving with time) ──
      let nx = noise(c*0.4,      r*0.4, T) - 0.5;
      let ny = noise(c*0.4 + 31, r*0.4, T) - 0.5;
      let ox = nx * 2 * chaos * CELL * 0.7;
      let oy = ny * 2 * chaos * CELL * 0.7
             + chaos * CELL * 0.45 * (0.6 + 0.4*sin(T + phase));  // ← downward PULL = tumble DOWN

      // ── continuous tumbling rotation (accumulates over time) ──
      let rot = (T*1.6 + phase) * min(chaos, 1.2) * (0.5 + 0.5*bass);

      if (pick < pColour) fill(PALETTE[floor(random(PALETTE.length))]);
      else                noFill();
      stroke(20);
      push();
      translate(x + ox, y + oy);
      rotate(rot);
      rectMode(CENTER);
      rect(0,0, CELL*0.86, CELL*0.86);
      pop();
    }
  }

  // ── meter: is it hearing anything? ──
  if (showMeter){
    noStroke();
    fill(30); textAlign(LEFT,TOP); textSize(13);
    text('level '+level.toFixed(3)+'   energy '+energy.toFixed(2), 16, 14);
    fill(220); rect(16, 34, 180, 10);
    fill('#D53075'); rect(16, 34, 180*constrain(energy,0,1), 10);   // pink bar = chaos amount
  }
}

function keyPressed(){
  if(key==='s'||key==='S') saveCanvas('order-disorder-sound','png');
  if(key==='f'||key==='F') fullscreen(!fullscreen());
  if(key==='d'||key==='D') showMeter = !showMeter;
}
