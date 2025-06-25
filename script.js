const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx1hQx_znNyFUYv7DKK5JNTkkxGgCP9EVnTRWBOgz8ElJtnx7szkIOnR92JtIqRTI3s/exec";

let currentUser = "";
let sessionTimeout;
let currentAksi = "";
let transaksiInProgress = false;

function loginUser() {
  const user = document.getElementById("username").value;
  const pin = document.getElementById("pin").value;
  const loadingText = document.getElementById("loginLoading");
  const errorText = document.getElementById("loginError");

  loadingText.innerText = "🔄 Sedang masuk, mohon tunggu...";
  errorText.innerText = "";

  fetch(`${WEB_APP_URL}?aksi=login&user=${user}&pin=${pin}`)
    .then(res => res.json())
    .then(res => {
      if (res.status === "success") {
        currentUser = user;
        sessionStorage.setItem("user", user);
        document.getElementById("loginContainer").classList.add("hidden");
        document.getElementById("mainContainer").classList.remove("hidden");
        document.getElementById("userDisplay").innerText = user;
        document.getElementById("profileContainer").innerHTML = `
          <p>Nama: ${res.nama}</p>
          <p>Rekening: ${res.rekening}</p>
          <p>Bank: ${res.bank}</p>
        `;
        loadSaldo();
        autoLogout();
      } else {
        errorText.innerText = res.message;
      }
    })
    .catch(() => {
      errorText.innerText = "Terjadi kesalahan jaringan.";
    })
    .finally(() => {
      loadingText.innerText = "";
    });
}

function autoLogout() {
  clearTimeout(sessionTimeout);
  sessionTimeout = setTimeout(() => {
    alert("Sesi login berakhir. Silakan login kembali.");
    sessionStorage.removeItem("user");
    location.reload();
  }, 5 * 60 * 1000); // 5 menit
}

// Deteksi aktivitas user untuk reset timer logout
["click", "mousemove", "keydown", "scroll"].forEach(event => {
  document.addEventListener(event, () => {
    if (currentUser) autoLogout();
  });
});

window.onload = () => {
  const savedUser = sessionStorage.getItem("user");
  if (savedUser) {
    currentUser = savedUser;
    document.getElementById("loginContainer").classList.add("hidden");
    document.getElementById("mainContainer").classList.remove("hidden");
    document.getElementById("userDisplay").innerText = savedUser;
    loadSaldo();
    autoLogout();
  }
};

function loadSaldo() {
  fetch(`${WEB_APP_URL}?aksi=get_saldo&user=${currentUser}`)
    .then(res => res.json())
    .then(res => {
      if (res.status === "success") {
        document.getElementById("saldoDisplay").innerText = "Rp " + Number(res.saldo).toLocaleString();
      }
    });
}

function showForm(aksi) {
  if (transaksiInProgress) return;
  currentAksi = aksi;
  document.getElementById("transaksiForm").classList.remove("hidden");
}

function submitTransaksi() {
  if (transaksiInProgress) return;
  transaksiInProgress = true;
  const nominal = document.getElementById("nominalInput").value;
  const button = document.querySelector("#transaksiForm button");
  button.disabled = true;
  button.innerText = "⏳ Memproses...";

  fetch(WEB_APP_URL, {
    method: "POST",
    body: new URLSearchParams({
      aksi: currentAksi,
      user: currentUser,
      nominal: nominal
    })
  })
  .then(res => res.json())
  .then(res => {
    alert(res.message);
    document.getElementById("transaksiForm").classList.add("hidden");
    document.getElementById("nominalInput").value = "";
    if (currentAksi === "tarik") loadSaldo();
  })
  .finally(() => {
    transaksiInProgress = false;
    button.disabled = false;
    button.innerText = "Kirim";
  });
}

function loadHistori() {
  document.getElementById("loadingMsg").innerText = "⏳ Mohon tunggu sejenak...";
  fetch(`${WEB_APP_URL}?aksi=histori&user=${currentUser}`)
    .then(res => res.json())
    .then(res => {
      const historiDiv = document.getElementById("historiContainer");
      historiDiv.innerHTML = "<h3>Histori Transaksi</h3>";
      res.transaksi.forEach(row => {
        historiDiv.innerHTML += `<p>${row[0]} - ${row[2]} - Rp ${row[3].toLocaleString()} (${row[6]})</p>`;
      });
      historiDiv.innerHTML += "<h3>Histori Game</h3>";
      res.game.forEach(row => {
        historiDiv.innerHTML += `<p>${row[0]} - ${row[2]} - ${row[3]}</p>`;
      });
      document.getElementById("loadingMsg").innerText = "";
    });
}

function showProfile() {
  const profile = document.getElementById("profileContainer");
  profile.classList.toggle("hidden");
}

function goToGame() {
  alert("🔜 Menuju halaman game...");
}

function logout() {
  sessionStorage.removeItem("user");
  location.reload();
}
