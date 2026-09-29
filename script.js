const conteudos={
1:{ilha:"Ilha 1",nome:"Primeiros Passos",nivel:"facil",dica:"Use as duas mãos e digite sem pressa.",palavras:["casa","bola","gato","mesa","livro","flor","pato","rua","sol","porta","mala","fita","dado","rato","copo","lápis","papel","azul","verde","amigo"]},
2:{ilha:"Ilha 2",nome:"Teclas em Ação",nivel:"medio",dica:"Tente olhar mais para a tela do que para o teclado.",palavras:["escola","caderno","teclado","janela","computador","mochila","professor","internet","biblioteca","atividade","estudante","pesquisa","arquivo","programa","monitor","educação","tecnologia","aprendizado","digitação","desafio"]},
3:{ilha:"Ilha 3",nome:"Castelo das Frases",nivel:"dificil",dica:"Mantenha um ritmo constante e revise antes de confirmar.",palavras:["aprendizagem digital","tecnologia na escola","digitar com atenção","praticar todos os dias","usar o teclado corretamente","concentração e precisão","desafio de digitação","aprender com tecnologia","computadores ajudam a estudar","a prática melhora o desempenho","o teclado faz parte do aprendizado","digitar rápido exige treinamento"]}
};
const TOTAL=10;
let faseAtual=1,lista=[],indice=0,acertos=0,erros=0,pontos=0,combo=0,melhorCombo=0,inicio=0,timer=null;
let charsCorretos=0,charsTotais=0,errosPorCaractere={};
let musicaAtiva=true,somAtivo=true,audioCtx=null,musicTimer=null,musicStep=0;

const entrada=document.getElementById("entrada-digitacao");
const alvo=document.getElementById("palavra-alvo");
const feedback=document.getElementById("feedback");
const btnConfirmar=document.getElementById("btn-confirmar");

function mostrar(id){
  document.querySelectorAll(".tela").forEach(t=>t.classList.remove("ativa"));
  document.getElementById(id).classList.add("ativa");
}
function embaralhar(arr){
  const c=[...arr];
  for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]]}
  return c;
}
function formatarTempo(s){const m=Math.floor(s/60).toString().padStart(2,"0");const ss=Math.floor(s%60).toString().padStart(2,"0");return `${m}:${ss}`}
function segundosDecorridos(){return inicio?(Date.now()-inicio)/1000:0}
function progresso(){return JSON.parse(localStorage.getItem("progressoMissao")||'{"fases":{"1":0,"2":0,"3":0},"desbloqueada":1,"badges":[]}')}
function salvarProgresso(p){localStorage.setItem("progressoMissao",JSON.stringify(p))}

function garantirAudio(){
  if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==="suspended") audioCtx.resume();
}
function tocarNota(freq,dur=.18,volume=.025,tipo="sine",quando=0){
  garantirAudio();
  const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();
  osc.type=tipo;osc.frequency.value=freq;
  gain.gain.setValueAtTime(volume,audioCtx.currentTime+quando);
  gain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+quando+dur);
  osc.connect(gain);gain.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime+quando);osc.stop(audioCtx.currentTime+quando+dur);
}
function musicaTick(){
  if(!musicaAtiva) return;
  const escala=[261.63,329.63,392.00,523.25,392.00,329.63,293.66,349.23,440.00,523.25,440.00,349.23];
  const baixo=[130.81,130.81,146.83,146.83,174.61,174.61];
  tocarNota(escala[musicStep%escala.length],.28,.014,"triangle");
  if(musicStep%2===0) tocarNota(baixo[Math.floor(musicStep/2)%baixo.length],.38,.010,"sine");
  musicStep++;
}
function iniciarMusica(){
  garantirAudio();
  if(musicTimer) clearInterval(musicTimer);
  if(musicaAtiva){musicaTick();musicTimer=setInterval(musicaTick,420)}
}
function pararMusica(){if(musicTimer){clearInterval(musicTimer);musicTimer=null}}
function atualizarBotoesAudio(){
  document.getElementById("btn-musica").textContent=musicaAtiva?"🎵":"🚫";
  document.getElementById("btn-musica-jogo").textContent=musicaAtiva?"🎵":"🚫";
  document.getElementById("btn-som").textContent=somAtivo?"🔊":"🔇";
  document.getElementById("btn-som-jogo").textContent=somAtivo?"🔊":"🔇";
}
function alternarMusica(){musicaAtiva=!musicaAtiva;localStorage.setItem("musicaAtiva",musicaAtiva);atualizarBotoesAudio();musicaAtiva?iniciarMusica():pararMusica()}
function alternarSom(){somAtivo=!somAtivo;localStorage.setItem("somAtivo",somAtivo);atualizarBotoesAudio()}
function efeitoSom(tipo){
  if(!somAtivo)return;
  if(tipo==="ok"){tocarNota(659,.12,.04,"sine");tocarNota(784,.15,.03,"sine",.09)}
  else{tocarNota(220,.18,.03,"square");tocarNota(196,.16,.025,"square",.10)}
}
function efeitoParticulas(ok){
  const area=document.getElementById("efeitos-area");
  const itens=ok?["⭐","✨","🌟"]:["💨","⚡","❗"];
  for(let i=0;i<9;i++){
    const p=document.createElement("div");p.className="particula";p.textContent=itens[Math.floor(Math.random()*itens.length)];
    p.style.left=(20+Math.random()*60)+"%";p.style.top=(48+Math.random()*18)+"%";area.appendChild(p);setTimeout(()=>p.remove(),1100);
  }
}
function confete(){
  const itens=["🎉","⭐","✨","🎊"];
  for(let i=0;i<28;i++){
    const c=document.createElement("div");c.className="confete";c.textContent=itens[Math.floor(Math.random()*itens.length)];
    c.style.left=Math.random()*100+"vw";c.style.animationDelay=Math.random()*.5+"s";document.body.appendChild(c);setTimeout(()=>c.remove(),3400);
  }
}

function estrelasPorResultado(precisao){
  if(precisao>=95)return 3;
  if(precisao>=80)return 2;
  return 1;
}
function renderMapa(){
  const p=progresso();
  let total=0;
  [1,2,3].forEach(f=>{
    const estrelas=p.fases[String(f)]||0;total+=estrelas;
    document.getElementById(`estrelas-fase-${f}`).textContent="★".repeat(estrelas)+"☆".repeat(3-estrelas);
    const card=document.querySelector(`.fase[data-fase="${f}"]`);
    const botao=card.querySelector(".btn-fase");
    const liberada=f<=p.desbloqueada;
    card.classList.toggle("liberada",liberada);card.classList.toggle("bloqueada",!liberada);
    botao.textContent=liberada?"Jogar":"🔒";botao.disabled=!liberada;
  });
  document.getElementById("estrelas-totais").textContent=total;
  document.getElementById("medalhas-totais").textContent=p.badges.length;
  const hist=JSON.parse(localStorage.getItem("historicoDigitacao")||"[]");
  document.getElementById("melhor-ppm").textContent=hist.reduce((m,r)=>Math.max(m,r.ppm||0),0);
  renderBadges(p.badges);
}
const badgesDef=[
  {id:"primeira",icone:"🌟",nome:"Primeira missão"},
  {id:"precisao",icone:"🎯",nome:"Precisão 95%+"},
  {id:"veloz",icone:"⚡",nome:"30 PPM+"},
  {id:"combo",icone:"🔥",nome:"Combo x5"},
  {id:"mestre",icone:"👑",nome:"3 estrelas em uma fase"}
];
function renderBadges(obtidas){
  document.getElementById("badges").innerHTML=badgesDef.map(b=>`<div class="badge ${obtidas.includes(b.id)?"":"bloq"}" title="${b.nome}">${b.icone}</div>`).join("");
}
function compararCaracteres(resposta,correta){
  const max=Math.max(resposta.length,correta.length);
  for(let i=0;i<max;i++){
    const r=resposta[i]||"∅",c=correta[i]||"∅";charsTotais++;
    if(r.toLowerCase()===c.toLowerCase()) charsCorretos++;
    else{const chave=c===" "?"espaço":c;errosPorCaractere[chave]=(errosPorCaractere[chave]||0)+1}
  }
}
function precisaoCaracteres(){return charsTotais?Math.round(charsCorretos/charsTotais*100):100}
function criarTrilha(){
  const t=document.getElementById("trilha");t.innerHTML="";
  for(let i=0;i<TOTAL;i++){const s=document.createElement("span");s.textContent="★";t.appendChild(s)}
}
function atualizarHud(){
  document.getElementById("numero-desafio").textContent=indice+1;
  document.getElementById("pontos").textContent=pontos;
  document.getElementById("combo").textContent="x"+combo;
  document.getElementById("acertos").textContent=acertos;
  document.getElementById("erros").textContent=erros;
  document.getElementById("precisao-atual").textContent=precisaoCaracteres()+"%";
  document.getElementById("barra-preenchida").style.width=((indice+1)/TOTAL*100)+"%";
  document.querySelectorAll("#trilha span").forEach((s,i)=>s.classList.toggle("ok",i<indice));
}
function iniciarFase(fase){
  faseAtual=Number(fase);
  const c=conteudos[faseAtual];
  lista=embaralhar(c.palavras).slice(0,TOTAL);
  indice=0;acertos=0;erros=0;pontos=0;combo=0;melhorCombo=0;charsCorretos=0;charsTotais=0;errosPorCaractere={};
  document.getElementById("nome-ilha").textContent=c.ilha;
  document.getElementById("nome-fase").textContent=c.nome;
  document.getElementById("dica-teclado").textContent=c.dica;
  criarTrilha();inicio=Date.now();clearInterval(timer);
  timer=setInterval(()=>document.getElementById("tempo").textContent=formatarTempo(segundosDecorridos()),250);
  mostrar("tela-jogo");carregarDesafio();
  iniciarMusica();
}
function carregarDesafio(){
  atualizarHud();alvo.textContent=lista[indice];entrada.value="";entrada.disabled=false;btnConfirmar.disabled=false;
  feedback.textContent="Boa sorte!";feedback.className="feedback";
  document.getElementById("fala-jogo").textContent=["Você consegue!","Muito bem!","Olhe com atenção!","Continue assim!"][Math.floor(Math.random()*4)];
  entrada.focus();
}
function confirmar(){
  const resposta=entrada.value.trim(),correta=lista[indice];
  if(!resposta){feedback.textContent="Digite uma resposta antes de continuar.";feedback.className="feedback erro";return}
  compararCaracteres(resposta,correta);
  const ok=resposta.toLowerCase()===correta.toLowerCase();
  const masc=document.getElementById("mascote-jogo");
  masc.classList.remove("acerto","erro");void masc.offsetWidth;
  if(ok){
    acertos++;combo++;melhorCombo=Math.max(melhorCombo,combo);pontos+=10+(combo>=3?2:0);
    feedback.textContent=combo>=3?`Perfeito! Combo x${combo}!`:"Muito bem! Resposta correta.";
    feedback.className="feedback ok";masc.classList.add("acerto");document.getElementById("fala-jogo").textContent="Arrasou! 🌟";
  }else{
    erros++;combo=0;feedback.textContent=`Quase! A resposta era: ${correta}`;feedback.className="feedback erro";
    masc.classList.add("erro");document.getElementById("fala-jogo").textContent="Tudo bem! Próxima missão! 💪";
  }
  efeitoSom(ok?"ok":"erro");efeitoParticulas(ok);entrada.disabled=true;btnConfirmar.disabled=true;atualizarHud();
  setTimeout(()=>{indice++;if(indice>=TOTAL)finalizar();else carregarDesafio()},900);
}
function salvarHistorico(reg){
  const h=JSON.parse(localStorage.getItem("historicoDigitacao")||"[]");h.unshift(reg);localStorage.setItem("historicoDigitacao",JSON.stringify(h.slice(0,30)))
}
function atualizarBadges(precisao,ppm,estrelas){
  const p=progresso(),antes=[...p.badges];
  const add=id=>{if(!p.badges.includes(id))p.badges.push(id)};
  add("primeira");if(precisao>=95)add("precisao");if(ppm>=30)add("veloz");if(melhorCombo>=5)add("combo");if(estrelas===3)add("mestre");
  salvarProgresso(p);
  return p.badges.find(x=>!antes.includes(x))||null;
}
function finalizar(){
  clearInterval(timer);
  const seg=segundosDecorridos(),prec=precisaoCaracteres(),ppm=seg>0?Math.round((charsCorretos/5)/(seg/60)):0;
  const estrelas=estrelasPorResultado(prec);
  document.getElementById("resultado-acertos").textContent=`${acertos}/${TOTAL}`;
  document.getElementById("resultado-precisao").textContent=prec+"%";
  document.getElementById("resultado-ppm").textContent=ppm;
  document.getElementById("resultado-tempo").textContent=formatarTempo(seg);
  document.getElementById("resultado-combo").textContent=melhorCombo;
  document.getElementById("resultado-pontos").textContent=pontos;
  document.getElementById("estrelas-resultado").textContent="★".repeat(estrelas)+"☆".repeat(3-estrelas);
  document.getElementById("mensagem-final").textContent=prec>=95?"Excelente! Você dominou esta missão!":prec>=80?"Muito bem! Você está evoluindo!":"Bom trabalho! Continue praticando.";
  const ranking=Object.entries(errosPorCaractere).sort((a,b)=>b[1]-a[1]).slice(0,5);
  document.getElementById("erros-caracteres").textContent=ranking.length?`Pratique principalmente: ${ranking.map(([c,q])=>`${c} (${q})`).join(", ")}.`:"Você não teve erros de caractere. Excelente!";
  const p=progresso();p.fases[String(faseAtual)]=Math.max(p.fases[String(faseAtual)]||0,estrelas);if(estrelas>=2&&faseAtual<3)p.desbloqueada=Math.max(p.desbloqueada,faseAtual+1);salvarProgresso(p);
  salvarHistorico({data:new Date().toLocaleString("pt-BR"),fase:faseAtual,nivel:conteudos[faseAtual].nivel,precisao:prec,ppm,pontos,estrelas});
  const badge=atualizarBadges(prec,ppm,estrelas);
  const box=document.getElementById("nova-medalha");
  if(badge){const d=badgesDef.find(b=>b.id===badge);box.textContent=`Nova medalha: ${d.icone} ${d.nome}`;box.classList.remove("escondido")}else box.classList.add("escondido");
  const prox=document.getElementById("btn-proxima-fase");prox.style.display=(faseAtual<3&&progresso().desbloqueada>faseAtual)?"block":"none";
  confete();mostrar("tela-resultado");renderMapa();
}
function carregarHistorico(){
  const h=JSON.parse(localStorage.getItem("historicoDigitacao")||"[]"),area=document.getElementById("lista-historico");
  area.innerHTML=h.length?h.map(r=>`<div class="historico-item"><div><small>Data</small><strong>${r.data}</strong></div><div><small>Fase</small><strong>${r.fase||"-"}</strong></div><div><small>Precisão</small><strong>${r.precisao}%</strong></div><div><small>PPM</small><strong>${r.ppm}</strong></div><div><small>Estrelas</small><strong>${r.estrelas||"-"}</strong></div></div>`).join(""):'<p style="text-align:center;color:#71809b">Nenhuma partida salva ainda.</p>';
}
document.querySelectorAll(".btn-fase").forEach(b=>b.addEventListener("click",()=>{if(!b.disabled)iniciarFase(b.dataset.fase)}));
document.getElementById("btn-confirmar").addEventListener("click",confirmar);
entrada.addEventListener("keydown",e=>{if(e.key==="Enter"&&!btnConfirmar.disabled)confirmar()});
document.getElementById("btn-sair").addEventListener("click",()=>{clearInterval(timer);mostrar("tela-mapa");renderMapa()});
document.getElementById("btn-voltar-mapa").addEventListener("click",()=>{mostrar("tela-mapa");renderMapa()});
document.getElementById("btn-jogar-novamente").addEventListener("click",()=>iniciarFase(faseAtual));
document.getElementById("btn-proxima-fase").addEventListener("click",()=>iniciarFase(Math.min(3,faseAtual+1)));
document.getElementById("btn-historico").addEventListener("click",()=>{carregarHistorico();mostrar("tela-historico")});
document.getElementById("btn-voltar-historico").addEventListener("click",()=>{mostrar("tela-mapa");renderMapa()});
document.getElementById("btn-limpar-historico").addEventListener("click",()=>{localStorage.removeItem("historicoDigitacao");carregarHistorico();renderMapa()});
["btn-musica","btn-musica-jogo"].forEach(id=>document.getElementById(id).addEventListener("click",alternarMusica));
["btn-som","btn-som-jogo"].forEach(id=>document.getElementById(id).addEventListener("click",alternarSom));

musicaAtiva=localStorage.getItem("musicaAtiva")!=="false";
somAtivo=localStorage.getItem("somAtivo")!=="false";
atualizarBotoesAudio();renderMapa();
document.body.addEventListener("pointerdown",()=>{if(musicaAtiva&&!musicTimer)iniciarMusica()},{once:true});
