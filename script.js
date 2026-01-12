const ROWS = 6, COLS = 5;
let secret = '';
let allowed = [];
let board = Array.from({length:ROWS},()=>Array(COLS).fill(''));
let curRow = 0, curCol = 0;
let isGameOver = false;

const boardEl = document.getElementById('board');
const keyboardEl = document.getElementById('keyboard');
const messageEl = document.getElementById('message');
const restartBtn = document.getElementById('restart');

// Build grid
function buildGrid(){
  boardEl.innerHTML = '';
  for(let r=0;r<ROWS;r++){
    const row = document.createElement('div'); row.className='row';
    for(let c=0;c<COLS;c++){
      const tile = document.createElement('div');
      tile.className='tile';
      tile.id = `tile-${r}-${c}`;
      row.appendChild(tile);
    }
    boardEl.appendChild(row);
  }
}

// Build keyboard
const KEY_LAYOUT = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['Enter','z','x','c','v','b','n','m','Back']
];
function buildKeyboard(){
  keyboardEl.innerHTML = '';
  KEY_LAYOUT.forEach(row=>{
    const rowEl = document.createElement('div'); rowEl.className='keyboard-row';
    row.forEach(k=>{
      const key = document.createElement('button');
      key.className='key';
      if(k==='Enter' || k==='Back') key.classList.add('wide');
      key.textContent = k;
      key.addEventListener('click',()=>handleKey(k));
      key.id = `key-${k.toLowerCase()}`;
      rowEl.appendChild(key);
    });
    keyboardEl.appendChild(rowEl);
  });
}

function showMessage(msg, timeout=2000){
  messageEl.textContent = msg;
  if(timeout) setTimeout(()=>{ if(messageEl.textContent===msg) messageEl.textContent=''; }, timeout);
}

function handleKey(k){
  if(isGameOver) return;
  if(k==='Back') return deleteLetter();
  if(k==='Enter') return submitGuess();
  addLetter(k);
}

function addLetter(ch){
  if(curCol>=COLS) return;
  ch = ch.toUpperCase();
  board[curRow][curCol] = ch;
  const tile = document.getElementById(`tile-${curRow}-${curCol}`);
  tile.textContent = ch; tile.classList.add('filled');
  curCol++;
}

function deleteLetter(){
  if(curCol<=0) return;
  curCol--;
  board[curRow][curCol] = '';
  const tile = document.getElementById(`tile-${curRow}-${curCol}`);
  tile.textContent = '';
  tile.classList.remove('filled');
}

function submitGuess(){
  if(curCol!==COLS){ showMessage('Not enough letters'); return; }
  const guess = board[curRow].join('').toUpperCase();
  if(!allowed.includes(guess)) { showMessage('Not in word list'); return; }
  // Evaluate
  const result = evaluateGuess(guess, secret);
  flipTiles(result);
}

function evaluateGuess(guess, secretWord){
  const res = Array(COLS).fill('absent');
  const secretArr = secretWord.split('');
  // First pass greens
  for(let i=0;i<COLS;i++){
    if(guess[i]===secretArr[i]){ res[i]='correct'; secretArr[i]=null; }
  }
  // Second pass yellows
  for(let i=0;i<COLS;i++){
    if(res[i]==='correct') continue;
    const idx = secretArr.indexOf(guess[i]);
    if(idx!==-1){ res[i]='present'; secretArr[idx]=null; }
  }
  return res;
}

function flipTiles(result){
  const tiles = [];
  for(let c=0;c<COLS;c++) tiles.push(document.getElementById(`tile-${curRow}-${c}`));
  // animate and set classes
  tiles.forEach((tile, i)=>{
    setTimeout(()=>{
      tile.classList.add('flip');
      setTimeout(()=>{
        tile.classList.remove('flip');
        tile.classList.add(result[i]);
      }, 200);
      updateKeyColor(board[curRow][i], result[i]);
    }, i*300);
  });

  setTimeout(()=>{
    // Check win/lose
    if(result.every(r=>r==='correct')){
      isGameOver=true;
      showMessage('Correct! Use this word to advance: ' + secret);
      return;
    }
    curRow++;
    curCol=0;
    if(curRow>=ROWS){
      isGameOver=true;
      showMessage('Out of tries. The word was: ' + secret, 10000);
    }
  }, COLS*300 + 300);
}

function updateKeyColor(letter, status){
  const key = document.getElementById(`key-${letter.toLowerCase()}`);
  if(!key) return;
  // priority: correct > present > absent
  if(key.classList.contains('correct')) return;
  if(status==='correct'){ key.classList.remove('present','absent'); key.classList.add('correct'); key.style.backgroundColor='var(--correct)'; }
  else if(status==='present'){ if(!key.classList.contains('correct')){ key.classList.add('present'); key.style.backgroundColor='var(--present)'; }}
  else { if(!key.classList.contains('correct') && !key.classList.contains('present')){ key.classList.add('absent'); key.style.backgroundColor='var(--absent)'; }}
}

// Keyboard (physical) support
window.addEventListener('keydown',(e)=>{
  if(isGameOver) return;
  const k = e.key;
  if(k==='Backspace') deleteLetter();
  else if(k==='Enter') submitGuess();
  else if(/^[a-zA-Z]$/.test(k)) addLetter(k);
});

restartBtn.addEventListener('click',()=>{
  resetGame();
});

function resetGame(){
  board = Array.from({length:ROWS},()=>Array(COLS).fill(''));
  curRow=0;curCol=0;isGameOver=false;messageEl.textContent='';
  buildGrid(); buildKeyboard();
}

// Load secret and wordlist
async function loadAssets(){
  try{
    const s = await fetch('secret.txt');
    secret = (await s.text()).trim().toUpperCase();
  }catch(e){ secret='CRANE'; console.warn('Failed to load secret.txt, using CRANE'); }

  try{
    const w = await fetch('words.txt');
    const text = await w.text();
    allowed = text.split(/\r?\n/).map(l=>l.trim().toUpperCase()).filter(Boolean);
  }catch(e){ allowed = [secret]; console.warn('Failed to load words.txt'); }

  buildGrid(); buildKeyboard();
}

loadAssets();