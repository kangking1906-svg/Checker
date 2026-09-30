const state={length:2,running:false,checked:0,available:[]};

const startButton=document.getElementById("start");
const stopButton=document.getElementById("stop");
const results=document.getElementById("results");
const checkedText=document.getElementById("checked");
const availableText=document.getElementById("available");
const statusText=document.getElementById("statusText");
const charset=document.getElementById("charset");
const delayInput=document.getElementById("delay");
const goal=document.getElementById("goal");
const toastBox=document.getElementById("toast");
const usedUsernames=new Set();

document.querySelectorAll(".length").forEach(button=>{
  button.addEventListener("click",()=>{
    document.querySelectorAll(".length").forEach(x=>x.classList.remove("active"));
    button.classList.add("active");
    state.length=Number(button.dataset.length);
  });
});

startButton.addEventListener("click",startFinding);
stopButton.addEventListener("click",stopFinding);

async function startFinding(){
  if(state.running)return;

  state.running=true;
  state.checked=0;
  state.available=[];
  usedUsernames.clear();

  renderResults();
  startButton.disabled=true;
  stopButton.disabled=false;
  statusText.textContent="Searching...";

  const target=getGoal();

  while(state.running && state.available.length<target){
    const username=generateUniqueUsername();

    if(!username){
      statusText.textContent="No more usernames available";
      break;
    }

    state.checked++;
    updateStats();
    statusText.textContent=`Checking ${username}...`;

    try{
      const result=await verifyUsername(username);

      if(result==="available"&&state.running){
        state.available.push(username);
        renderResults();
        showToast(`Found available username: ${username}`);
      }
    }catch(error){
      console.error("Availability check failed:",error);
      statusText.textContent="API error";
    }

    updateStats();

    if(state.running)await sleep(getDelay());
  }

  if(state.running){
    statusText.textContent=state.available.length>=target?"Found!":"Finished";
  }else{
    statusText.textContent="Stopped";
  }

  state.running=false;
  startButton.disabled=false;
  stopButton.disabled=true;
}

function stopFinding(){
  state.running=false;
  statusText.textContent="Stopping...";
}

function generateUniqueUsername(){
  let characters;

  if(charset.value==="numbers"){
    characters="0123456789";
  }else if(charset.value==="lettersNumbers"){
    characters="abcdefghijklmnopqrstuvwxyz0123456789";
  }else{
    characters="abcdefghijklmnopqrstuvwxyz";
  }

  for(let attempt=0;attempt<1000;attempt++){
    let username="";

    for(let i=0;i<state.length;i++){
      username+=characters[Math.floor(Math.random()*characters.length)];
    }

    if(!usedUsernames.has(username)){
      usedUsernames.add(username);
      return username;
    }
  }

  return null;
}

/*
  Connect this to your backend.

  The backend should return JSON like:
  { "available": true }

  or:
  { "available": false }

  Do not put private API keys in this file.
*/
async function verifyUsername(username){
  const response=await fetch(
    `/api/check?username=${encodeURIComponent(username)}`,
    {
      method:"GET",
      headers:{"Accept":"application/json"}
    }
  );

  if(!response.ok){
    throw new Error(`HTTP ${response.status}`);
  }

  const data=await response.json();

  return data.available===true?"available":"taken";
}

function renderResults(){
  if(!state.available.length){
    results.innerHTML=`
      <div class="empty">
        <div class="empty-icon">⌁</div>
        <h3>No available usernames found</h3>
        <p>The checker will keep searching until it finds one.</p>
      </div>`;
    return;
  }

  results.innerHTML=state.available.map(username=>`
    <div class="row">
      <div class="username">${escapeHTML(username)}</div>
      <div>${username.length} characters</div>
      <div>
        <span class="available-status">✓ Available</span>
      </div>
      <button class="copy" data-copy="${escapeHTML(username)}">Copy</button>
    </div>
  `).join("");

  document.querySelectorAll(".copy").forEach(button=>{
    button.addEventListener("click",async()=>{
      await navigator.clipboard.writeText(button.dataset.copy);
      const old=button.textContent;
      button.textContent="Copied!";
      showToast("Username copied.");
      setTimeout(()=>button.textContent=old,900);
    });
  });
}

document.getElementById("copyAll").addEventListener("click",async()=>{
  if(!state.available.length){
    showToast("No available usernames yet.");
    return;
  }

  await navigator.clipboard.writeText(state.available.join("
"));
  showToast(`${state.available.length} usernames copied!`);
});

function updateStats(){
  checkedText.textContent=state.checked;
  availableText.textContent=state.available.length;
}

function getGoal(){
  if(goal.value==="five")return 5;
  if(goal.value==="ten")return 10;
  return 1;
}

function getDelay(){
  const value=Number(delayInput.value);
  return Math.min(10000,Math.max(500,value||1500));
}

function sleep(milliseconds){
  return new Promise(resolve=>setTimeout(resolve,milliseconds));
}

function showToast(message){
  toastBox.textContent=message;
  toastBox.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer=setTimeout(()=>toastBox.classList.remove("show"),1800);
}

function escapeHTML(text){
  return text.replace(/[&<>"']/g,character=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[character]));
}

renderResults();
updateStats();
