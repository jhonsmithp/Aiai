// IMPORTANT: Put your Vercel API URL here.
// Example: https://your-project.vercel.app/api/chat
const API_URL = "const API_URL = "https://aiai-mu.vercel.app/api/chat";";

const chat=document.getElementById("chat"), form=document.getElementById("form"),
input=document.getElementById("input"), send=document.getElementById("send"),
clearBtn=document.getElementById("clear"), web=document.getElementById("web");
let history=[];

function add(role,text){
  const row=document.createElement("div");
  row.className="row "+(role==="user"?"user":"ai");
  const bubble=document.createElement("div");
  bubble.className="bubble"; bubble.textContent=text;
  row.appendChild(bubble); chat.appendChild(row);
  chat.scrollTop=chat.scrollHeight;
}

form.addEventListener("submit",async e=>{
  e.preventDefault();
  const text=input.value.trim(); if(!text)return;
  if(API_URL.includes("PASTE_YOUR")){add("assistant","আগে app.js-এ তোমার Vercel API URL বসাও।");return;}
  add("user",text); history.push({role:"user",content:text}); input.value="";
  send.disabled=true; send.textContent="...";
  try{
    const r=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({messages:history,web_search:web.checked})});
    const d=await r.json(); if(!r.ok)throw new Error(d.error||"Request failed");
    add("assistant",d.answer||"কোনো উত্তর পাওয়া যায়নি।");
    history.push({role:"assistant",content:d.answer||""});
  }catch(err){add("assistant","সমস্যা: "+err.message)}
  finally{send.disabled=false;send.textContent="Send";input.focus();}
});
clearBtn.onclick=()=>{history=[];chat.innerHTML="";add("assistant","চ্যাট পরিষ্কার হয়েছে। আবার বলো।")};
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();form.requestSubmit()}});
