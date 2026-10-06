const $ = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => [...p.querySelectorAll(s)];
const state = JSON.parse(localStorage.getItem("vlab-tpb-state") || '{"done":[]}');
const save = () => localStorage.setItem("vlab-tpb-state", JSON.stringify(state));

function markDone(key){
  if(!state.done.includes(key)){ state.done.push(key); save(); updateProgress(); }
}
function updateProgress(){
  const total=5, pct=Math.min(100, Math.round(state.done.length/total*100));
  $("#progressBar").style.width=pct+"%"; $("#progressText").textContent=pct+"%";
  $("#homeCompletion").textContent=`${state.done.length} / ${total} selesai`;
}
function go(id){
  $$(".page-section").forEach(s=>s.classList.toggle("active",s.id===id));
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.section===id));
  window.scrollTo({top:0,behavior:"smooth"});
  $("#sidebar").classList.remove("open");
  if(id==="branch") setTimeout(drawBranch,80);
}
$$("[data-go]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.go)));
$$(".nav-item").forEach(b=>b.addEventListener("click",()=>go(b.dataset.section)));
$("#menuBtn").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$("#themeBtn").addEventListener("click",()=>{
  document.body.classList.toggle("dark");
  localStorage.setItem("vlab-theme",document.body.classList.contains("dark")?"dark":"light");
  drawBranch();
});
if(localStorage.getItem("vlab-theme")==="dark") document.body.classList.add("dark");
$("#resetProgress").addEventListener("click",()=>{
  if(confirm("Reset seluruh progress?")){state.done=[];save();updateProgress();}
});
updateProgress();

/* Input / Output simulator */
$("#runIO").addEventListener("click",()=>{
  const name=$("#ioName").value.trim() || "Mahasiswa";
  const n=Number($("#ioNumber").value);
  if(!Number.isFinite(n)){ $("#ioInsight").innerHTML="⚠️ Masukkan angka yang valid."; return; }
  $("#terminal").innerHTML=`
    <div>$ python modul1.py</div>
    <div>Nama: ${escapeHTML(name)}</div>
    <div>Angka: ${n}</div>
    <div>Hi ${escapeHTML(name)}, angka kamu ${n}</div>
    <div>${n+5}</div>
    <div class="terminal-muted">Process finished successfully.</div>`;
  $("#ioInsight").innerHTML=`💡 <b>Amati:</b> input <code>${n}</code> masuk sebagai data, lalu <code>int()</code> membuatnya bisa dihitung.`;
  markDone("io");
});
$("#clearTerminal").addEventListener("click",()=>$("#terminal").innerHTML='<div class="terminal-muted">Terminal cleared.</div>');
function escapeHTML(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

/* Operator drag & drop */
const drop=$("#dropZone");
$$(".operator").forEach(op=>{
  op.addEventListener("dragstart",e=>e.dataTransfer.setData("text/plain",op.dataset.op));
  op.addEventListener("click",()=>applyOperator(op.dataset.op));
});
drop.addEventListener("dragover",e=>{e.preventDefault();drop.classList.add("over")});
drop.addEventListener("dragleave",()=>drop.classList.remove("over"));
drop.addEventListener("drop",e=>{e.preventDefault();drop.classList.remove("over");applyOperator(e.dataTransfer.getData("text/plain"))});
function applyOperator(op){
  const a=13,b=5; let result;
  if(op==="+") result=a+b; else if(op==="-") result=a-b; else if(op==="*") result=a*b;
  else if(op==="/") result=a/b; else if(op==="//") result=Math.floor(a/b); else if(op==="%") result=a%b;
  else return;
  drop.textContent=op; drop.dataset.operator=op; drop.classList.add("filled");
  $("#exprResult").textContent=result;
  $("#exprStatus").textContent="● EVALUATED";
  markDone("types");
}
$("#resetOperator").addEventListener("click",()=>{drop.textContent="?";drop.dataset.operator="";drop.classList.remove("filled");$("#exprResult").textContent="?";$("#exprStatus").textContent="● READY";});

/* Type inspector */
$$("[data-type-test]").forEach(btn=>btn.addEventListener("click",()=>{
  const raw=$("#typeValue").value; const type=btn.dataset.typeTest;
  let valid=false, explanation="";
  if(type==="int"){valid=/^-?\d+$/.test(raw.trim());explanation="Bilangan bulat tanpa desimal."}
  if(type==="float"){valid=/^-?\d+\.\d+$/.test(raw.trim());explanation="Bilangan real/desimal."}
  if(type==="str"){valid=true;explanation="Teks diperlakukan sebagai kumpulan karakter."}
  if(type==="bool"){valid=["true","false","True","False"].includes(raw.trim());explanation="Nilai logika hanya True atau False."}
  $("#typeResult").innerHTML=valid?`✓ <b>${escapeHTML(raw)}</b> cocok dengan <code>${type}</code>. ${explanation}`:`✕ <b>${escapeHTML(raw)}</b> bukan representasi sederhana dari <code>${type}</code>.`;
}));

/* Branch canvas */
let branchValue=8;
$("#runBranch").addEventListener("click",()=>{
  const n=Number($("#branchN").value);
  if(!Number.isFinite(n)){return}
  branchValue=n;
  ["codeIf","codePositive","codeElif","codeNegative","codeElse","codeZero"].forEach(id=>$("#"+id).classList.remove("active"));
  let result,key;
  if(n>0){$("#codeIf").classList.add("active");$("#codePositive").classList.add("active");result=`N = ${n} → POSITIF`;key="positive";}
  else if(n<0){$("#codeElif").classList.add("active");$("#codeNegative").classList.add("active");result=`N = ${n} → NEGATIF`;key="negative";}
  else{$("#codeElse").classList.add("active");$("#codeZero").classList.add("active");result="N = 0 → NOL";key="zero";}
  $("#branchResult").innerHTML=`<b>${result}</b><br><small>Program berhenti pada cabang pertama yang kondisinya True.</small>`;
  drawBranch(key); markDone("branch");
});
function drawBranch(active){
  const c=$("#branchCanvas"),ctx=c.getContext("2d"),dpr=window.devicePixelRatio||1;
  const rect=c.getBoundingClientRect(),w=Math.max(320,rect.width),h=w*.58;
  c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);
  const dark=document.body.classList.contains("dark"), ink=dark?"#dce9e0":"#1b2b21", muted=dark?"#8fa197":"#718078", line=dark?"#405147":"#cbd5ce";
  ctx.font="600 12px DM Sans, sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";
  const sx=w*.16, sy=h*.5, dx=w*.47, dy=h*.5, ox=w*.80, oy=h*.5;
  function box(x,y,bg,label,sub){
    ctx.beginPath();ctx.roundRect(x-58,y-34,116,68,15);ctx.fillStyle=bg;ctx.fill();ctx.strokeStyle=line;ctx.stroke();
    ctx.fillStyle=ink;ctx.fillText(label,x,y-8);ctx.fillStyle=muted;ctx.font="10px DM Sans, sans-serif";ctx.fillText(sub,x,y+14);ctx.font="600 12px DM Sans, sans-serif";
  }
  function arrow(x1,y1,x2,y2){ctx.strokeStyle=line;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-9,y2);ctx.stroke();ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-10,y2-5);ctx.lineTo(x2-10,y2+5);ctx.closePath();ctx.fillStyle=line;ctx.fill()}
  box(sx,sy,"#dfeaf4","INPUT","N = "+branchValue);
  box(dx,dy,"#f2e6bd","DECISION","N > 0?");
  box(ox,oy,"#dceee3","OUTPUT",branchValue>0?"POSITIF":branchValue<0?"NEGATIF":"NOL");
  arrow(sx+58,sy,dx-58,dy);arrow(dx+58,dy,ox-58,oy);
  ctx.fillStyle=muted;ctx.font="10px DM Sans, sans-serif";ctx.fillText("if / elif / else",w*.5,h*.14);
  ctx.fillStyle=ink;ctx.font="700 11px DM Sans, sans-serif";ctx.fillText("jalur dipilih →",w*.67,h*.83);
}
window.addEventListener("resize",()=>{if($("#branch").classList.contains("active"))drawBranch()});

/* Lab tabs */
$$(".lab-tab").forEach(tab=>tab.addEventListener("click",()=>{
  $$(".lab-tab").forEach(t=>t.classList.remove("active"));tab.classList.add("active");
  $$(".experiment").forEach(e=>e.classList.toggle("active",e.id===tab.dataset.lab));
  if(tab.dataset.lab==="frog") setTimeout(()=>drawFrog(0,[]),50);
}));

/* Odd-even */
$("#checkOdd").addEventListener("click",()=>{
  const n=Number($("#oddN").value), box=$("#oddResult");
  if(!Number.isInteger(n)){box.className="lab-result error";box.innerHTML="Masukkan bilangan bulat.";return}
  if(n>0){
    const even=n%2===0;
    box.className="lab-result success";box.innerHTML=`✓ <b>${n}</b> adalah bilangan positif dan <b>${even?"GENAP":"GANJIL"}</b>.<br><small>Karena ${n} % 2 = ${n%2}.</small>`;
    markDone("lab");
  }else if(n<0){box.className="lab-result warning";box.innerHTML="N negatif. Sesuai pola soal, kategori positif tidak diteruskan ke pengecekan ganjil-genap."}
  else{box.className="lab-result warning";box.innerHTML="N = 0. Nilai nol bukan bilangan positif."}
});

/* Exam */
$("#checkExam").addEventListener("click",()=>{
  const essayDone=Number($("#essayDone").value), shortDone=Number($("#shortDone").value), elapsed=Number($("#examElapsed").value);
  const remaining=(14-essayDone)*10+(2-shortDone)*20, available=120-elapsed;
  const box=$("#examResult");
  if([essayDone,shortDone,elapsed].some(x=>!Number.isFinite(x))){box.className="lab-result error";box.textContent="Data tidak valid.";return}
  const ok=remaining<=available && remaining>=0 && available>=0;
  box.className="lab-result "+(ok?"success":"warning");
  box.innerHTML=`${ok?"✓":"✕"} <b>${ok?"Tuan Riz berhasil menyelesaikan semua soal.":"Tuan Riz tidak memiliki cukup waktu."}</b><br>Sisa waktu pengerjaan: <b>${Math.max(0,available)} menit</b> • Perkiraan waktu soal tersisa: <b>${Math.max(0,remaining)} menit</b>.`;
  markDone("lab");
});

/* Bravo */
$("#checkBravo").addEventListener("click",()=>{
  const n=String(Math.trunc(Number($("#bravoN").value)));
  const box=$("#bravoResult"),vis=$("#digitVisual");
  if(!/^\d{4}$/.test(n)){box.className="lab-result error";box.textContent="Masukkan bilangan tepat 4 digit.";return}
  const digits=[...n].map(Number),sum=digits.reduce((a,b)=>a+b,0);
  vis.innerHTML=digits.map(d=>`<span class="digit-chip">${d}</span>`).join("")+`<span class="digit-chip" style="background:#e1f0e7;color:#24543b">Σ = ${sum}</span>`;
  const nonZero=digits.filter(d=>d!==0), good=nonZero.every(d=>sum%d===0);
  box.className="lab-result "+(good?"success":"warning");
  box.innerHTML=`${good?"✓":"✕"} <b>${n}</b> adalah bilangan <b>${good?"BRAVO":"BIASA"}</b>.<br>${sum} ${good?"habis":"tidak habis"} dibagi oleh setiap digit yang bukan nol.`;
  markDone("lab");
});
$("#runFrog").addEventListener("click",()=>{
  const x=Number($("#frogX").value),a=Number($("#frogA").value),b=Number($("#frogB").value),box=$("#frogResult");
  if(![x,a,b].every(Number.isFinite)||a<0||b<0){box.className="lab-result error";box.textContent="Masukkan nilai valid.";return}
  let k;
  if(x<0 && x%3===0) k=b*2;
  else if(x%2===0) k=a*b;
  else if(x%2!==0) k=a*2;
  else k=a*b;
  k=Math.max(0,Math.floor(k));
  let pos=x,steps=[];
  for(let i=0;i<k;i++){const right=i%2===0;pos+=right?a:-b;steps.push(pos)}
  drawFrog(pos,steps);
  box.className="lab-result success";
  box.innerHTML=`✓ <b>k = ${k}</b> lompatan → koordinat akhir <b>${pos}</b>.<br><small>Aturan k yang aktif: ${x<0&&x%3===0?"x negatif dan kelipatan 3 → b × 2":x%2===0?"x genap → a × b":"x ganjil → a × 2"}.</small>`;
  markDone("lab");
});
function drawFrog(finalPos,steps){
  const c=$("#frogCanvas"),ctx=c.getContext("2d"),dpr=devicePixelRatio||1,w=c.clientWidth||900,h=180;
  c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const dark=document.body.classList.contains("dark"),line=dark?"#4a5a4f":"#ccd7cf",ink=dark?"#dce9e0":"#24332a";
  ctx.strokeStyle=line;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(25,h-48);ctx.lineTo(w-25,h-48);ctx.stroke();
  const vals=[0,...steps], min=Math.min(...vals),max=Math.max(...vals),range=Math.max(1,max-min);
  vals.forEach((v,i)=>{const px=30+(v-min)/range*(w-60);ctx.fillStyle=i===vals.length-1?"#1f6f52":"#91aa9a";ctx.beginPath();ctx.arc(px,h-48,5,0,Math.PI*2);ctx.fill();if(i>0){ctx.fillStyle=ink;ctx.font="9px monospace";ctx.textAlign="center";ctx.fillText(v,px,h-63)}})
  const endx=30+(finalPos-min)/range*(w-60);ctx.font="24px sans-serif";ctx.textAlign="center";ctx.fillText("🐸",endx,h-70);ctx.fillStyle=ink;ctx.font="700 11px DM Sans";ctx.fillText("posisi akhir: "+finalPos,endx,h-16);
}

/* Quiz */
$("#quizForm").addEventListener("submit",e=>{
  e.preventDefault();
  const ans={q1:"3",q2:"b",q3:"c",q4:"b",q5:"b"};let score=0;
  Object.entries(ans).forEach(([q,a])=>{if($(`input[name="${q}"]:checked`)?.value===a)score++});
  const result=$("#quizResult"), pct=score*20;
  result.classList.add("show");
  result.innerHTML=`<b>Skor kamu: ${score}/5 (${pct}%)</b><br>${score===5?"Perfect. Logika dasar modul ini sudah kamu kuasai.":score>=3?"Good work. Coba ulang eksperimen yang masih membingungkan.":"Belum selesai. Kembali ke eksperimen dan perhatikan hubungan input → proses → output."}`;
  markDone("quiz");
});
