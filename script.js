/* =======================================================
   🔥 SISTEMA DE SECCIONES (UI) + INTEGRACIÓN NUEVOS MÓDULOS
======================================================= */
function ocultarTodas() {
  [
    "login","registro","panel","feed","asesoria",
    "chatbot-module","test-module","juego-module",
    "matching","scenarios","memory","passguess",
    "microretos","trivial","alerta"
  ].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.add("hidden");
  });
}
function mostrar(id) {
  ocultarTodas();
  const el = document.getElementById(id);
  if(el) el.classList.remove("hidden");
  actualizarHeader();
}
function cerrarExtra(id){
  document.getElementById(id).classList.add("hidden");
  // si estaba logueado mostramos feed si existe
  if(isLogged()) mostrar("feed"); else mostrar("login");
}

/* =======================================================
   🔥 SISTEMA DE USUARIOS (LocalStorage)  -- SIN CAMBIOS
======================================================= */
function readUsers(){ return JSON.parse(localStorage.getItem("pc_users") || "{}"); }
function saveUsers(u){ localStorage.setItem("pc_users", JSON.stringify(u)); }

function registrar(){
  const nombre = document.getElementById("regNombre").value.trim();
  const user = document.getElementById("regUser").value.trim();
  const pass = document.getElementById("regPass").value;
  const pass2 = document.getElementById("regPass2").value;
  const sexo = document.getElementById("regSexo").value;
  const tel = document.getElementById("regTel").value.trim();

  if(!nombre || !user || !pass || !pass2){
    alert("Completa todos los campos.");
    return;
  }

  const regex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
  if(!regex.test(pass)){
    alert("La contraseña debe tener mínimo 6 caracteres, una mayúscula y un número.");
    return;
  }
  if(pass !== pass2){
    alert("Las contraseñas no coinciden.");
    return;
  }

  const users = readUsers();
  if(users[user]){
    alert("Ese usuario ya existe.");
    return;
  }

  users[user] = { nombre, user, pass, sexo, tel };
  saveUsers(users);
  alert("Registro exitoso.");
  mostrar("login");
}

function iniciarSesion(){
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value;
  const users = readUsers();
  if(!users[user]){
    alert("Usuario no existe.");
    return;
  }
  if(users[user].pass !== pass){
    alert("Contraseña incorrecta.");
    return;
  }
  localStorage.setItem("pc_currentUser", JSON.stringify(users[user]));
  cargarReportes();
  mostrar("feed");
}

function isLogged(){ return !!localStorage.getItem("pc_currentUser"); }
function getCurrentUser(){ return JSON.parse(localStorage.getItem("pc_currentUser")); }
function logout(){
  localStorage.removeItem("pc_currentUser");
  mostrar("login");
}

function actualizarHeader(){
  const logged = isLogged();
  const btnLogout = document.getElementById("btn-logout");
  if(btnLogout) btnLogout.style.display = logged ? "inline-block" : "none";
  const welcome = document.getElementById("welcome");
  if(welcome){
    if(logged){
      const u = getCurrentUser();
      welcome.textContent = `Hola, ${u.nombre}`;
    } else {
      welcome.textContent = "";
    }
  }
}

/* =======================================================
   🔥 REPORTES → FIREBASE (SIN CAMBIOS estructurales)
======================================================= */
async function enviarReporte(){
  if(!isLogged()){
    alert("Debes iniciar sesión.");
    return;
  }

  const titulo = document.getElementById("titulo").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const categoria = document.getElementById("categoria").value;

  if(!titulo || !descripcion){
    alert("Completa todos los campos.");
    return;
  }

  const u = getCurrentUser();
  await guardarReporte(titulo, descripcion, categoria, u.user);

  alert("Reporte enviado.");
  document.getElementById("titulo").value="";
  document.getElementById("descripcion").value="";

  cargarReportes();
  mostrar("feed");
}

async function guardarReporte(titulo, descripcion, categoria, usuario){
  try {
    await addDoc(collection(db, "reportes"), {
      titulo,
      descripcion,
      categoria,
      usuario,
      fecha: new Date().toISOString()
    });
  } catch (e){
    alert("Error guardando el reporte.");
    console.error(e);
  }
}

/* =======================================================
   🔥 CARGAR REPORTES (SIN CAMBIOS funcionales)
======================================================= */
async function cargarReportes(){
  const contenedor = document.getElementById("posts");
  if(!contenedor) return;
  contenedor.innerHTML = "<p>Cargando...</p>";

  try {
    const querySnapshot = await getDocs(collection(db, "reportes"));
    contenedor.innerHTML = "";
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const div = document.createElement("div");
      div.className = "post";
      div.innerHTML = `
        <div class="meta">
          <strong>${data.usuario}</strong> · 
          <span class="muted">${new Date(data.fecha).toLocaleString()}</span>
        </div>
        <h3>${data.titulo}</h3>
        <p>${data.descripcion}</p>
        <span class="badge badge-${data.categoria}">
          ${data.categoria}
        </span>
        <button class="secondary ver-asesoria" data-cat="${data.categoria}">
          Ver asesoría
        </button>
      `;
      contenedor.appendChild(div);
    });
    activarBotonesAsesoria();
  } catch(e){
    contenedor.innerHTML = "<p>Error cargando reportes.</p>";
    console.error(e);
  }
}

function activarBotonesAsesoria(){
  document.querySelectorAll(".ver-asesoria").forEach(btn => {
    btn.onclick = () => {
      const cat = btn.dataset.cat;
      showAsesoriaForCategory(cat);
    };
  });
}

/* =======================================================
   🔥 ASESORÍA DETALLADA (SIN CAMBIOS)
======================================================= */
function showAsesoriaForCategory(catParam){
  const cat = catParam || "desconocido";

  const textos = {
    phishing: {
      titulo: "Asesoría: Phishing",
      descripcion: "El phishing es un engaño para robar tus datos o dinero.",
      animo: "No estás sola/o. Respira, esto tiene solución.",
      consejos: ["No abras enlaces raros.","Cambia contraseñas.","Activa 2FA."],
      prevencion: ["Verifica remitentes.","No compartas códigos.","Evita páginas falsas."],
      videos: ["https://www.youtube.com/embed/UuuAlP7ay6U"]
    },
    malware: {
      titulo: "Asesoría: Malware",
      descripcion: "El malware puede dañar o robar información.",
      animo: "Tranquila/o, sigue estos pasos.",
      consejos: ["Escanea con antivirus.","Desconecta Internet.","Cambia contraseñas."],
      prevencion: ["No instales apps piratas.","Mantén todo actualizado.","Haz respaldos."],
      videos: ["https://www.youtube.com/embed/HuasitV4lcw"]
    },
    exploit: {
      titulo: "Asesoría: Exploit",
      descripcion: "Un exploit aprovecha fallas de software.",
      animo: "Respira, esto pasa mucho.",
      consejos: ["Actualiza sistemas.","Evita archivos dudosos.","Revisa permisos."],
      prevencion: ["Instala parches.","Limita accesos.","Usa firewall."],
      videos: ["https://www.youtube.com/embed/K49G8UbMx_Y"]
    },
    desconocido: {
      titulo: "Asesoría general",
      descripcion: "No se pudo identificar la categoría, sigue esta guía.",
      animo: "No estás sola/o. Todo se puede manejar.",
      consejos: ["Guarda evidencia.","No borres nada.","Cambia contraseñas importantes."],
      prevencion: ["Contraseñas fuertes.","Actualizaciones.","Doble verificación."],
      videos: [
        "https://www.youtube.com/embed/vJjVAAZJdZQ",
        "https://www.youtube.com/embed/3J0i8wGzDZA",
        "https://www.youtube.com/embed/2ZQjvF6XkD8"
      ]
    }
  };

  const data = textos[cat] || textos.desconocido;

  document.getElementById("asesoria-tit").innerText = data.titulo;
  document.getElementById("asesoria-text").innerText = data.descripcion;
  document.getElementById("asesoria-animo").innerText = data.animo;

  const ul1 = document.getElementById("asesoria-pasos");
  ul1.innerHTML = "";
  data.consejos.forEach(c => {
    const li = document.createElement("li");
    li.innerText = c;
    ul1.appendChild(li);
  });

  const ul2 = document.getElementById("asesoria-prevenir");
  ul2.innerHTML = "";
  data.prevencion.forEach(p => {
    const li = document.createElement("li");
    li.innerText = p;
    ul2.appendChild(li);
  });

  const videoWrap = document.getElementById("asesoria-video");
  videoWrap.innerHTML = "";
  data.videos.forEach(src => {
    const iframe = document.createElement("iframe");
    iframe.className = "video-frame";
    iframe.width = "100%";
    iframe.height = "315";
    iframe.src = src;
    iframe.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    videoWrap.appendChild(iframe);
  });

  mostrar("asesoria");
}

/* =======================================================
   🔥 LISTENERS INICIALES (BASE + NUEVOS BOTONES)
======================================================= */
(function init(){
  // base
  document.getElementById("btn-login").onclick = iniciarSesion;
  document.getElementById("btn-show-register").onclick = ()=>mostrar("registro");
  document.getElementById("btn-register").onclick = registrar;
  document.getElementById("btn-reg-back").onclick = ()=>mostrar("login");
  document.getElementById("btn-feed").onclick = ()=>{ cargarReportes(); mostrar("feed"); };
  document.getElementById("btn-new").onclick = ()=>mostrar("panel");
  document.getElementById("btn-new-2").onclick = ()=>mostrar("panel");
  document.getElementById("btn-send-report").onclick = enviarReporte;
  document.getElementById("btn-feed-back").onclick = ()=>mostrar("feed");
  document.getElementById("btn-asesoria-back").onclick = ()=>mostrar("feed");
  document.getElementById("btn-logout").onclick = logout;

  // nuevos botones
  document.getElementById("btn-chatbot").onclick = ()=>mostrar("chatbot-module");
  document.getElementById("btn-test").onclick = ()=>iniciarTest();
  document.getElementById("btn-juego").onclick = ()=>mostrar("juego-module");
document.getElementById("btn-profile").onclick = mostrarPerfil;

  // chatbot UI
  document.getElementById("chat-send").onclick = handleChatSend;
  document.getElementById("chat-menu-home").onclick = chatShowMenu;

  // test
  document.getElementById("test-next").onclick = testNext;

  // juegos: matching
  document.getElementById("start-matching").onclick = startMatching;
  document.getElementById("match-check").onclick = checkMatching;
  document.getElementById("match-reset").onclick = startMatching;

  // scenarios
  document.getElementById("start-scenarios").onclick = startScenarios;
  document.getElementById("scenario-next").onclick = nextScenario;

  // memory
  document.getElementById("start-memory").onclick = startMemory;
  document.getElementById("memory-reset").onclick = startMemory;

  // passguess
  document.getElementById("start-passguess").onclick = startPassGuess;
  document.getElementById("pass-reset").onclick = startPassGuess;

  // microretos/trivial/alerta
  document.getElementById("start-microretos").onclick = showMicroreto;
  document.getElementById("microreto-complete").onclick = completeMicroreto;

  document.getElementById("start-trivial").onclick = startTrivial;
  document.getElementById("start-alerta").onclick = startAlerta;
  document.getElementById("alert-report").onclick = ()=>handleAlertChoice(true);
  document.getElementById("alert-ignore").onclick = ()=>handleAlertChoice(false);

  // inicial
  if(isLogged()){
    cargarReportes();
    mostrar("feed");
  } else {
    mostrar("login");
  }
})();

/* =======================================================
   🔥 CHATBOT (MENÚ Y SUBMENÚS RICOS)
   - Implementa el flujo que pediste (bienvenida, opciones, sub-opciones)
======================================================= */

const chatIntro = `¡Hola! Bienvenido al asistente de ciberseguridad. Aquí aprenderás a proteger tus datos y tu información en internet.`;
const chatOptionsMain = [
  "Contraseñas seguras",
  "Phishing y fraudes",
  "Software y actualizaciones",
  "Seguridad en redes",
  "Consejos generales",
  "Volver al inicio"
];

function chatAppendUser(text){
  const box = document.getElementById("chat-window");
  box.innerHTML += `<div class="msg-user"><strong>Tú:</strong> ${escapeHtml(text)}</div>`;
  box.scrollTop = box.scrollHeight;
}
function chatAppendBot(html){
  const box = document.getElementById("chat-window");
  box.innerHTML += `<div class="msg-bot">${html}</div>`;
  box.scrollTop = box.scrollHeight;
}

function chatShowMenu(){
  chatAppendBot(`<strong>Bot:</strong> ${chatIntro}`);
  // show options as clickable buttons
  const html = chatOptionsMain.map(o => `<button class="secondary chat-opt">${o}</button>`).join(" ");
  chatAppendBot(html);
  // attach listeners (delegation)
  setTimeout(()=> {
    document.querySelectorAll(".chat-opt").forEach(b=>{
      b.onclick = ()=> chatHandleOption(b.innerText);
    });
  }, 50);
}

function handleChatSend(){
  const input = document.getElementById("chat-input");
  const txt = input.value.trim();
  if(!txt) {
    chatShowMenu();
    return;
  }
  chatAppendUser(txt);
  chatHandleOption(txt);
  input.value = "";
}

function chatHandleOption(choice){
  const c = choice.toLowerCase();
  if(c.includes("contrase") || c === "contraseñas seguras"){
    showContraseñas();
    return;
  }
  if(c.includes("phish") || c.includes("fraud") || c === "phishing y fraudes"){
    showPhishing();
    return;
  }
  if(c.includes("software") || c.includes("actualiz")){
    showSoftware();
    return;
  }
  if(c.includes("red") || c.includes("wifi") || c === "seguridad en redes"){
    showRedes();
    return;
  }
  if(c.includes("consejo") || c === "consejos generales"){
    showConsejos();
    return;
  }
  if(c.includes("volver") || c === "volver al inicio"){
    chatShowMenu();
    return;
  }

  // fallback: keyword search
  if(c.includes("gestor") || c.includes("gestión")){
    chatAppendBot(`<strong>Bot:</strong> Un gestor de contraseñas es una aplicación que guarda y genera contraseñas seguras y las protege con una contraseña maestra.`);
    return;
  }

  chatAppendBot(`<strong>Bot:</strong> Lo siento, no entendí. Usa el menú o escribe: "Contraseñas seguras", "Phishing y fraudes", "Software y actualizaciones", "Seguridad en redes", o "Consejos generales".`);
}

// Submenus (contraseñas, phishing, software, redes, consejos)
function showContraseñas(){
  const html = `
    <strong>Bot:</strong> Las contraseñas son tu primera línea de defensa. Debe ser larga, única y combinar mayúsculas, minúsculas, números y símbolos.
    <div style="margin-top:8px;">
      <button class="secondary chat-sub">Cómo crear una contraseña fuerte</button>
      <button class="secondary chat-sub">Qué es un gestor de contraseñas</button>
      <button class="secondary chat-sub">Volver al menú principal</button>
    </div>
  `;
  chatAppendBot(html);
  setTimeout(()=> attachChatSubs(),50);
}
function showPhishing(){
  const html = `
    <strong>Bot:</strong> El phishing es un intento de engañarte para que reveles información sensible. Verifica remitentes y evita enlaces sospechosos.
    <div style="margin-top:8px;">
      <button class="secondary chat-sub">Ejemplos de phishing</button>
      <button class="secondary chat-sub">Cómo reportar un intento de phishing</button>
      <button class="secondary chat-sub">Volver al menú principal</button>
    </div>
  `;
  chatAppendBot(html);
  setTimeout(()=> attachChatSubs(),50);
}
function showSoftware(){
  const html = `
    <strong>Bot:</strong> Mantener tu software actualizado es crucial. Descarga solo desde fuentes oficiales y usa antivirus confiable.
    <div style="margin-top:8px;">
      <button class="secondary chat-sub">Qué software actualizar primero</button>
      <button class="secondary chat-sub">Cómo elegir un antivirus</button>
      <button class="secondary chat-sub">Volver al menú principal</button>
    </div>
  `;
  chatAppendBot(html);
  setTimeout(()=> attachChatSubs(),50);
}
function showRedes(){
  const html = `
    <strong>Bot:</strong> Evita Wi‑Fi públicas sin protección. Usa contraseñas fuertes en tu router y considera usar VPN.
    <div style="margin-top:8px;">
      <button class="secondary chat-sub">Qué es una VPN</button>
      <button class="secondary chat-sub">Cómo proteger mi Wi-Fi</button>
      <button class="secondary chat-sub">Volver al menú principal</button>
    </div>
  `;
  chatAppendBot(html);
  setTimeout(()=> attachChatSubs(),50);
}
function showConsejos(){
  const consejos = `
    <strong>Bot:</strong>
    <ul>
      <li>Activa la autenticación en dos pasos siempre que sea posible.</li>
      <li>No compartas tus contraseñas.</li>
      <li>Cuidado con archivos adjuntos y enlaces desconocidos.</li>
      <li>Haz copias de seguridad periódicas.</li>
    </ul>
  `;
  chatAppendBot(consejos);
  setTimeout(()=> chatShowMenu(),500);
}

function attachChatSubs(){
  document.querySelectorAll(".chat-sub").forEach(b=>{
    b.onclick = ()=> {
      const txt = b.innerText;
      if(txt.includes("Cómo crear")) {
        chatAppendBot(`<strong>Bot:</strong> Una contraseña fuerte puede ser una frase fácil de recordar + símbolos. Ej: 'Café2025!Sol'`);
      } else if(txt.includes("gestor")) {
        chatAppendBot(`<strong>Bot:</strong> Un gestor guarda y genera contraseñas y te protege con una contraseña maestra. Ejemplos: Bitwarden, LastPass, 1Password.`);
      } else if(txt.includes("Ejemplos")) {
        chatAppendBot(`<strong>Bot:</strong> Ejemplo: "Tu cuenta será bloqueada, haz clic aquí" → phishing típico.`);
      } else if(txt.includes("reportar")) {
        chatAppendBot(`<strong>Bot:</strong> No respondas. Reenvíalo a TI o al proveedor y luego elimínalo.`);
      } else if(txt.includes("VPN")) {
        chatAppendBot(`<strong>Bot:</strong> VPN cifra tu tráfico y oculta tu ubicación, aumentando tu privacidad.`)
      } else if(txt.includes("proteger mi Wi-Fi")) {
        chatAppendBot(`<strong>Bot:</strong> Cambia el SSID, usa WPA2/WPA3, desactiva WPS y acceso remoto si no lo necesitas.`);
      } else if(txt.includes("antivirus")) {
        chatAppendBot(`<strong>Bot:</strong> Elige uno con actualizaciones automáticas, análisis en tiempo real y buenas calificaciones.`);
      } else if(txt.includes("Volver")) {
        chatShowMenu();
      } else {
        chatAppendBot(`<strong>Bot:</strong> ${txt}`);
      }
    };
  });
}

/* Init chat with menu when module opens */
document.getElementById("btn-chatbot").addEventListener("click", () => {
  // clear window & show greeting + menu
  const box = document.getElementById("chat-window");
  box.innerHTML = "";
  chatShowMenu();
});

/* =======================================================
   🔥 TEST DE 20 PREGUNTAS (Sencillo, con avance y resultado)
======================================================= */
const testPreguntas = [
  { p:"¿Qué es phishing?", o:["Un tipo de malware","Un intento de engañar para robar información","Un antivirus"], c:1 },
  { p:"Una contraseña segura debe incluir:", o:["Solo letras","Letras, números y símbolos","Solo números"], c:1 },
  { p:"Verdadero o falso: Reutilizar la misma contraseña en varias cuentas es seguro.", o:["V","F"], c:1 },
  { p:"¿Qué significa VPN?", o:["Virus Protection Network","Virtual Private Network","Very Personal Network"], c:1 },
  { p:"¿Qué acción es correcta si recibes un correo sospechoso de tu banco?", o:["Hacer clic en el enlace","Reportarlo y eliminarlo","Responder con tus datos"], c:1 },
  { p:"Verdadero o falso: Actualizar tu sistema operativo regularmente ayuda a proteger tu computadora.", o:["V","F"], c:0 },
  { p:"Un antivirus sirve para:", o:["Detectar y eliminar malware","Mejorar la velocidad de internet","Crear contraseñas"], c:0 },
  { p:"Verdadero o falso: Las redes Wi-Fi públicas siempre son seguras.", o:["V","F"], c:1 },
  { p:"¿Cuál es un ejemplo de contraseña débil?", o:["123456","C@feSol2025!","yULi2025!"], c:0 },
  { p:"¿Qué es un gestor de contraseñas?", o:["Programa que guarda y genera contraseñas seguras","Tipo de malware","Navegador web"], c:0 },
  { p:"Verdadero o falso: Compartir tus contraseñas con amigos es seguro.", o:["V","F"], c:1 },
  { p:"¿Qué se debe hacer si encuentras un USB desconocido?", o:["Conectarlo inmediatamente","Escanearlo con antivirus antes de abrirlo","Ignorarlo"], c:1 },
  { p:"Verdadero o falso: Activar la autenticación en dos pasos aumenta la seguridad.", o:["V","F"], c:0 },
  { p:"¿Qué acción ayuda a proteger tu Wi-Fi doméstico?", o:["Usar contraseña predeterminada","Cambiar nombre y usar WPA2/WPA3","Compartirla con vecinos"], c:1 },
  { p:"Verdadero o falso: Los correos que dicen “ganaste un premio” son siempre confiables.", o:["V","F"], c:1 },
  { p:"¿Cuál es un buen hábito para mantener tu software seguro?", o:["Actualizar solo cuando falla","Mantenerlo siempre actualizado","Instalar sin verificar"], c:1 },
  { p:"Verdadero o falso: Usar una VPN protege tu conexión en redes públicas.", o:["V","F"], c:0 },
  { p:"¿Qué significa un candado en la barra de direcciones?", o:["Sitio en mantenimiento","Conexión segura y cifrada","Sitio gratis"], c:1 },
  { p:"Verdadero o falso: Ignorar actualizaciones no tiene riesgos.", o:["V","F"], c:1 },
  { p:"¿Qué se debe hacer con un archivo adjunto desconocido?", o:["Abrirlo inmediatamente","Analizarlo con antivirus antes de abrir","Reenviarlo"], c:1 }
];

let testIndex = 0, testScore = 0;

function iniciarTest(){
  testIndex = 0;
  testScore = 0;
  mostrar("test-module");
  mostrarPregunta();
}

function mostrarPregunta(){
  const q = testPreguntas[testIndex];
  document.getElementById("test-progress").innerText = `Pregunta ${testIndex+1} de ${testPreguntas.length}`;
  document.getElementById("test-question").innerText = q.p;
  const cont = document.getElementById("test-choices");
  cont.innerHTML = "";
  q.o.forEach((opc,i)=>{
    const b = document.createElement("button");
    b.className = "secondary";
    b.innerText = opc;
    b.onclick = ()=> {
      const correct = (i === q.c);
      if(correct) testScore++;
      document.getElementById("test-result").innerText = correct ? "✔ Correcto" : "✖ Incorrecto";
      document.getElementById("test-next").style.display = "inline-block";
      // disable choices
      Array.from(cont.children).forEach(ch => ch.disabled = true);
    };
    cont.appendChild(b);
  });
  document.getElementById("test-result").innerText = "";
  document.getElementById("test-next").style.display = "none";
}

function testNext(){
  testIndex++;
  if(testIndex >= testPreguntas.length){
    document.getElementById("test-question").innerText = `Resultado final: ${testScore} / ${testPreguntas.length}`;
    document.getElementById("test-choices").innerHTML = "";
    document.getElementById("test-next").style.display = "none";
    document.getElementById("test-result").innerText = "";
  } else {
    mostrarPregunta();
  }
}

/* =======================================================
   🔥 JUEGOS DIDÁCTICOS (5 juegos)
   - Matching (drag & drop)
   - Scenarios (escoje acción)
   - Memory
   - PassGuess (identificar contraseñas fuertes/débil)
   - Microretos / Trivial / Alerta
======================================================= */

/* ---------- Matching (drag & drop text-based) ---------- */
const matchingPairs = [
  { key: "Phishing", val: "Intento de engañar a un usuario para robar información personal." },
  { key: "VPN", val: "Red que cifra la conexión y protege la privacidad en internet." },
  { key: "Antivirus", val: "Programa que detecta y elimina software malicioso." },
  { key: "Contraseña segura", val: "Combinación de letras, números y símbolos que protege tus cuentas." }
];

function startMatching(){
  ocultarSubJuegos();
  document.getElementById("matching").classList.remove("hidden");
  const area = document.getElementById("match-area");
  area.innerHTML = "";
  // shuffle arrays
  const left = matchingPairs.map(p=>p.key).sort(()=>Math.random()-0.5);
  const right = matchingPairs.map(p=>p.val).sort(()=>Math.random()-0.5);

  const leftCol = document.createElement("div");
  leftCol.className = "match-left";
  left.forEach(k=>{
    const el = document.createElement("div");
    el.className = "match-item draggable";
    el.draggable = true;
    el.innerText = k;
    el.dataset.key = k;
    el.addEventListener("dragstart", (e)=> e.dataTransfer.setData("text/plain", k));
    leftCol.appendChild(el);
  });

  const rightCol = document.createElement("div");
  rightCol.className = "match-right";
  right.forEach(v=>{
    const el = document.createElement("div");
    el.className = "match-dropzone";
    el.innerText = v;
    el.dataset.val = v;
    el.addEventListener("dragover", (e)=> e.preventDefault());
    el.addEventListener("drop", (e)=>{
      const k = e.dataTransfer.getData("text/plain");
      // mark dropzone with chosen key
      el.dataset.matched = k;
      el.innerHTML = `<strong>${escapeHtml(v)}</strong><div class="small">(${escapeHtml(k)})</div>`;
    });
    rightCol.appendChild(el);
  });

  area.appendChild(leftCol);
  area.appendChild(rightCol);
  document.getElementById("match-result").innerText = "Arrastra cada concepto a su definición.";
}

function checkMatching(){
  const drops = Array.from(document.querySelectorAll("#match-area .match-dropzone"));
  let correct = 0;
  drops.forEach(d=>{
    const v = d.dataset.val;
    const matchedKey = d.dataset.matched;
    const pair = matchingPairs.find(p=>p.key === matchedKey && p.val === v);
    if(pair) correct++;
  });
  const total = matchingPairs.length;
  document.getElementById("match-result").innerText = `Resultado: ${correct} / ${total}. ${correct===total ? '¡Perfecto!' : 'Revisa tus emparejamientos.'}`;
}

/* ---------- Scenarios (elige la mejor acción) ---------- */
const scenariosList = [
  {
    q: "Recibes un correo de tu banco solicitando tu contraseña y con un enlace.",
    choices: ["Hacer clic en el enlace y entrar","Reportarlo y contactar al banco por canales oficiales","Responder con tus datos"],
    correct: 1,
    explanation: "Nunca introduzcas contraseñas por enlaces: contacta al banco por canales oficiales."
  },
  {
    q: "Un compañero te pide tu contraseña para 'ayudarte' a configurar algo.",
    choices: ["Compartir la contraseña","Negarte y pedir asistencia oficial","Enviar por chat"],
    correct: 1,
    explanation: "No compartas contraseñas; solicita asistencia por canales oficiales."
  }
];
let scenarioIndex = 0;
function startScenarios(){
  ocultarSubJuegos();
  document.getElementById("scenarios").classList.remove("hidden");
  scenarioIndex = 0;
  showScenario();
}
function showScenario(){
  const s = scenariosList[scenarioIndex];
  document.getElementById("scenario-text").innerText = s.q;
  const cont = document.getElementById("scenario-choices");
  cont.innerHTML = "";
  s.choices.forEach((ch,i)=>{
    const b = document.createElement("button");
    b.className = "secondary";
    b.innerText = ch;
    b.onclick = ()=>{
      document.getElementById("scenario-feedback").innerText = (i === s.correct) ? `Correcto. ${s.explanation}` : `Incorrecto. ${s.explanation}`;
    };
    cont.appendChild(b);
  });
}
function nextScenario(){
  scenarioIndex++;
  if(scenarioIndex >= scenariosList.length){
    document.getElementById("scenario-text").innerText = "Terminaste los escenarios. ¡Buen trabajo!";
    document.getElementById("scenario-choices").innerHTML = "";
  } else showScenario();
}

/* ---------- Memory (pairs) ---------- */
const memoryPairs = [
  { a: "Phishing", b: "Intento de engañar a un usuario" },
  { a: "VPN", b: "Cifra la conexión y protege la privacidad" },
  { a: "Antivirus", b: "Detecta y elimina software malicioso" },
  { a: "Contraseña segura", b: "Combinación de letras, números y símbolos" }
];
let memoryState = { board: [], first: null, second: null, matches: 0 };

function startMemory(){
  ocultarSubJuegos();
  document.getElementById("memory").classList.remove("hidden");
  memoryInit();
}
function memoryInit(){
  const board = [];
  memoryPairs.forEach((p, idx) => {
    board.push({ id: idx+"a", text: p.a, pair: idx });
    board.push({ id: idx+"b", text: p.b, pair: idx });
  });
  board.sort(()=>Math.random()-0.5);
  memoryState = { board, first: null, second: null, matches: 0 };
  renderMemoryBoard();
}
function renderMemoryBoard(){
  const bd = document.getElementById("memory-board");
  bd.innerHTML = "";
  memoryState.board.forEach(cell=>{
    const btn = document.createElement("button");
    btn.className = "secondary mem-cell";
    btn.dataset.id = cell.id;
    btn.innerText = "❓";
    btn.onclick = ()=> flipCell(cell.id);
    bd.appendChild(btn);
  });
  document.getElementById("memory-info").innerText = "Encuentra todas las parejas.";
}
function flipCell(id){
  const cell = memoryState.board.find(c=>c.id===id);
  const btn = document.querySelector(`.mem-cell[data-id="${id}"]`);
  if(!btn || btn.disabled) return;
  btn.innerText = cell.text;
  if(!memoryState.first) memoryState.first = { id, cell };
  else if(!memoryState.second && memoryState.first.id !== id){
    memoryState.second = { id, cell };
    // check match
    if(memoryState.first.cell.pair === memoryState.second.cell.pair){
      // correct
      document.querySelector(`.mem-cell[data-id="${memoryState.first.id}"]`).disabled = true;
      document.querySelector(`.mem-cell[data-id="${memoryState.second.id}"]`).disabled = true;
      memoryState.matches++;
      memoryState.first = null; memoryState.second = null;
      if(memoryState.matches === memoryPairs.length){
        document.getElementById("memory-info").innerText = "Completado 🎉";
      }
    } else {
      // hide after timeout
      setTimeout(()=>{
        document.querySelector(`.mem-cell[data-id="${memoryState.first.id}"]`).innerText = "❓";
        document.querySelector(`.mem-cell[data-id="${memoryState.second.id}"]`).innerText = "❓";
        memoryState.first = null; memoryState.second = null;
      }, 800);
    }
  }
}

/* ---------- Password guess (identificar contraseñas fuertes) ---------- */
const passwordList = [
  { s:"123456", good:false },
  { s:"C@feSol2025!", good:true },
  { s:"contraseña", good:false },
  { s:"Yuliana2007", good:false },
  { s:"Gato!72Sol#", good:true }
];

function startPassGuess(){
  ocultarSubJuegos();
  document.getElementById("passguess").classList.remove("hidden");
  renderPassList();
}
function renderPassList(){
  const cont = document.getElementById("pass-list");
  cont.innerHTML = "";
  passwordList.sort(()=>Math.random()-0.5).forEach((p, idx)=>{
    const b = document.createElement("button");
    b.className = "secondary";
    b.innerText = p.s;
    b.onclick = ()=>{
      const ok = p.good;
      document.getElementById("pass-feedback").innerText = ok ? `${p.s} → Seguro. Buen uso de símbolos y longitud.` : `${p.s} → Débil. Evita secuencias o palabras comunes.`;
      // optionally mark correct/incorrect visually
      b.style.border = ok ? "2px solid #0a8d00" : "2px solid #d10000";
    };
    cont.appendChild(b);
  });
}

/* ---------- Microretos / Trivial / Alerta ---------- */
function showMicroreto(){
  ocultarSubJuegos();
  document.getElementById("microretos").classList.remove("hidden");
  const retoText = "Micro‑reto: Revisa este correo: 'Has ganado un premio, cliquea aquí'. ¿Es sospechoso?";
  document.getElementById("microreto-text").innerText = retoText;
}
function completeMicroreto(){
  document.getElementById("microreto-status").innerText = "Marcado como completado. ¡Gracias por participar!";
}

function startTrivial(){
  ocultarSubJuegos();
  document.getElementById("trivial").classList.remove("hidden");
  document.getElementById("triv-q").innerText = "¿Qué debes hacer si un correo te pide tu contraseña?";
  const cont = document.getElementById("triv-choices");
  cont.innerHTML = "";
  const opts = ["Darla inmediatamente","Nunca dar contraseñas por correo"];
  opts.forEach((o,i)=>{
    const b = document.createElement("button");
    b.className = "secondary";
    b.innerText = o;
    b.onclick = ()=> {
      document.getElementById("triv-score").innerText = i===1 ? "Correcto" : "Incorrecto — No proporciones contraseñas por correo.";
    };
    cont.appendChild(b);
  });
}

function startAlerta(){
  ocultarSubJuegos();
  document.getElementById("alerta").classList.remove("hidden");
  document.getElementById("alert-desc").innerText = "Te llega un mensaje: 'Tu cuenta será suspendida, haz clic aquí'. ¿Qué haces?";
  document.getElementById("alert-feedback").innerText = "";
}
function handleAlertChoice(report){
  if(report){
    document.getElementById("alert-feedback").innerText = "Correcto: reportar y eliminar. No abra el enlace.";
  } else {
    document.getElementById("alert-feedback").innerText = "Ignorar no es suficiente: reporta el intento y elimínalo.";
  }
}

/* ---------- util: ocultar sub-juegos ---------- */
function ocultarSubJuegos(){
  ["matching","scenarios","memory","passguess","microretos","trivial","alerta"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.classList.add("hidden");
  });
}

/* ---------- helpers ---------- */
function escapeHtml(unsafe) {
  return unsafe.replace(/[&<"'>]/g, function(m) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]);
  });
}
/* ============================================================
   NUEVO JUEGO: PHISHING O REAL (FUNCIONAL Y SIN REPETIDOS)
   ============================================================ */

const phishingQuestions = [
  {
    pregunta: "Te llega un correo diciendo que ganaste un iPhone y debes ingresar tus datos. ¿Es phishing o real?",
    opciones: ["Phishing", "Real"],
    correcta: "Phishing"
  },
  {
    pregunta: "Un correo de tu universidad pide actualizar la clave entrando al portal oficial. ¿Phishing o real?",
    opciones: ["Phishing", "Real"],
    correcta: "Real"
  },
  {
    pregunta: "WhatsApp te pide reenviar un código de 6 dígitos. ¿Phishing o real?",
    opciones: ["Phishing", "Real"],
    correcta: "Phishing"
  },
  {
    pregunta: "Correo del banco enviado desde @gmail.com. ¿Phishing o real?",
    opciones: ["Phishing", "Real"],
    correcta: "Phishing"
  }
];

let phishIndex = 0;

// abrir juego
document.getElementById("start-phishinggame").addEventListener("click", () => {
  ocultarSubJuegos();
  document.getElementById("phishinggame").classList.remove("hidden");
  phishIndex = 0;
  cargarPreguntaPhish();
});

// cargar pregunta
function cargarPreguntaPhish() {
  const q = phishingQuestions[phishIndex];
  document.getElementById("phish-question").textContent = q.pregunta;

  const cont = document.getElementById("phish-choices");
  cont.innerHTML = "";

  q.opciones.forEach(op => {
    const b = document.createElement("button");
    b.className = "secondary";
    b.textContent = op;
    b.onclick = () => validarPhish(op);
    cont.appendChild(b);
  });

  document.getElementById("phish-feedback").textContent = "";
}

// validar respuesta
function validarPhish(opcion) {
  const correcta = phishingQuestions[phishIndex].correcta;
  const fb = document.getElementById("phish-feedback");

  if (opcion === correcta) {
    fb.textContent = "Correcto.";
    fb.style.color = "green";
  } else {
    fb.textContent = "Incorrecto. Era: " + correcta;
    fb.style.color = "red";
  }
}

// siguiente pregunta
document.getElementById("phish-next").addEventListener("click", () => {
  phishIndex++;
  if (phishIndex >= phishingQuestions.length) phishIndex = 0;
  cargarPreguntaPhish();
});
function mostrarPerfil() {
  const user = getCurrentUser();
  if (!user) {
    alert("Debes iniciar sesión.");
    return;
  }

  document.getElementById("p-nombre").innerText = user.nombre || "No registrado";
  document.getElementById("p-user").innerText = user.user || "No registrado";
  document.getElementById("p-sexo").innerText = user.sexo || "No indicado";
  document.getElementById("p-tel").innerText = user.tel || "No indicado";

  mostrar("profile-module");
}

